// hooks/admin/useAdminUsers.ts
import { create } from 'zustand';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/types/type';
import { FetchOptions, PaginationState, ActionResult } from '@/types/admin';
import { formatFirestoreTimestamp } from '@/lib/utils';
import auditLogger from '@/lib/auditLog';

interface UserStats {
  total: number;
  active: number;
  admins: number;
}

interface AdminUsersStore {
  // State
  users: User[];
  selectedUser: User | null;
  stats: UserStats;
  
  // Loading & Error
  loading: boolean;
  error: string | null;
  
  // Pagination
  pagination: PaginationState;
  
  // Actions
  fetchUsers: (options?: FetchOptions) => Promise<void>;
  fetchUserStats: () => Promise<void>;
  getUserById: (userId: string) => Promise<User | null>;
  updateUser: (userId: string, data: Partial<User>, adminId?: string, adminEmail?: string) => Promise<ActionResult>;
  toggleUserStatus: (userId: string, status: User['status'], adminId?: string, adminEmail?: string) => Promise<ActionResult>;
  updateUserRole: (userId: string, role: User['role'], adminId?: string, adminEmail?: string) => Promise<ActionResult>;
  bulkUpdateUserRole: (userIds: string[], role: User['role'], adminId?: string, adminEmail?: string) => Promise<ActionResult>;
  setSelectedUser: (user: User | null) => void;
  resetUsers: () => void;
  clearError: () => void;
}

const useAdminUsers = create<AdminUsersStore>((set, get) => ({
  // Initial State
  users: [],
  selectedUser: null,
  stats: { total: 0, active: 0, admins: 0 },
  loading: false,
  error: null,
  pagination: {
    lastDoc: null,
    hasMore: false,
  },

  // Fetch aggregate stats (true totals from Firestore)
  fetchUserStats: async () => {
    try {
      const usersCol = collection(db, 'users');
      const [totalSnap, activeSnap, adminSnap] = await Promise.all([
        getCountFromServer(usersCol),
        getCountFromServer(query(usersCol, where('status', '==', 'active'))),
        getCountFromServer(query(usersCol, where('role', '==', 'admin'))),
      ]);
      set({
        stats: {
          total: totalSnap.data().count,
          active: activeSnap.data().count,
          admins: adminSnap.data().count,
        },
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  },

  // Fetch users with pagination and filters
  fetchUsers: async (options: FetchOptions = {}) => {
    set({ loading: true, error: null });

    try {
      const {
        limit: limitCount = 20,
        startAfter: startAfterDoc,
        filters = [],
        orderByField = 'addedAt',
        orderDirection = 'desc',
      } = options;

      // Build query
      let baseQuery = query(collection(db, 'users'));

      // Apply filters
      filters.forEach(filter => {
        baseQuery = query(baseQuery, where(filter.field, filter.operator, filter.value));
      });

      // Apply ordering
      let orderedQuery = query(baseQuery, orderBy(orderByField, orderDirection));

      // Apply pagination - only paginate when startAfter is explicitly provided
      let paginatedQuery;
      if (startAfterDoc) {
        paginatedQuery = query(orderedQuery, startAfter(startAfterDoc), limit(limitCount));
      } else {
        // Fresh fetch - reset pagination state
        paginatedQuery = query(orderedQuery, limit(limitCount));
      }

      const snapshot = await getDocs(paginatedQuery);

      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        addedAt: formatFirestoreTimestamp(doc.data().addedAt),
        updatedAt: formatFirestoreTimestamp(doc.data().updatedAt),
        lastLoginAt: formatFirestoreTimestamp(doc.data().lastLoginAt),
      } as User));

      const lastVisible = snapshot.docs[snapshot.docs.length - 1];

      set({
        users: options.startAfter ? [...get().users, ...users] : users,
        loading: false,
        pagination: {
          lastDoc: lastVisible,
          hasMore: snapshot.docs.length === limitCount,
        },
      });
    } catch (error: any) {
      console.error('Error fetching users:', error);
      set({
        loading: false,
        error: error.message || 'Failed to fetch users',
      });
    }
  },

  // Get user by ID
  getUserById: async (userId: string): Promise<User | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));

      if (!userDoc.exists()) return null;

      return {
        id: userDoc.id,
        ...userDoc.data(),
        addedAt: formatFirestoreTimestamp(userDoc.data().addedAt),
        updatedAt: formatFirestoreTimestamp(userDoc.data().updatedAt),
        lastLoginAt: formatFirestoreTimestamp(userDoc.data().lastLoginAt),
      } as User;
    } catch (error: any) {
      console.error('Error getting user:', error);
      set({ error: error.message || 'Failed to get user' });
      return null;
    }
  },

  // Update user
  updateUser: async (userId: string, data: Partial<User>, adminId?: string, adminEmail?: string): Promise<ActionResult> => {
    set({ loading: true, error: null });

    try {
      const userRef = doc(db, 'users', userId);
      const updateData = {
        ...data,
        updatedAt: serverTimestamp(),
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof typeof updateData] === undefined) {
          delete updateData[key as keyof typeof updateData];
        }
      });

      await updateDoc(userRef, updateData);

      // Audit log
      if (adminId) {
        await auditLogger.logUserAction(adminId, 'USER_UPDATE', userId, {
          updatedFields: Object.keys(data),
          newValues: data,
        }, adminEmail);
      }

      // Update in local state
      set(state => ({
        users: state.users.map(user =>
          user.id === userId ? { ...user, ...data, updatedAt: new Date().toISOString() } : user
        ),
        selectedUser: state.selectedUser?.id === userId
          ? { ...state.selectedUser, ...data, updatedAt: new Date().toISOString() }
          : state.selectedUser,
        loading: false,
      }));

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update user';
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Toggle user status
  toggleUserStatus: async (userId: string, status: User['status'], adminId?: string, adminEmail?: string): Promise<ActionResult> => {
    set({ loading: true, error: null });

    try {
      const userRef = doc(db, 'users', userId);

      // Get previous status for audit
      const userDoc = await getDoc(userRef);
      const previousStatus = userDoc.exists() ? userDoc.data().status : 'unknown';

      await updateDoc(userRef, {
        status,
        updatedAt: serverTimestamp(),
      });

      // Audit log
      if (adminId) {
        await auditLogger.logUserAction(adminId, 'USER_STATUS_CHANGE', userId, {
          previousStatus,
          newStatus: status,
        }, adminEmail);
      }

      set(state => ({
        users: state.users.map(user =>
          user.id === userId ? { ...user, status, updatedAt: new Date().toISOString() } : user
        ),
        selectedUser: state.selectedUser?.id === userId
          ? { ...state.selectedUser, status, updatedAt: new Date().toISOString() }
          : state.selectedUser,
        loading: false,
      }));

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update user status';
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Update user role
  updateUserRole: async (userId: string, role: User['role'], adminId?: string, adminEmail?: string): Promise<ActionResult> => {
    set({ loading: true, error: null });

    try {
      const userRef = doc(db, 'users', userId);

      // Get previous role for audit
      const userDoc = await getDoc(userRef);
      const previousRole = userDoc.exists() ? userDoc.data().role : 'unknown';

      await updateDoc(userRef, {
        role,
        updatedAt: serverTimestamp(),
      });

      // Audit log
      if (adminId) {
        await auditLogger.logUserAction(adminId, 'USER_ROLE_CHANGE', userId, {
          previousRole,
          newRole: role,
        }, adminEmail);
      }

      set(state => ({
        users: state.users.map(user =>
          user.id === userId ? { ...user, role, updatedAt: new Date().toISOString() } : user
        ),
        selectedUser: state.selectedUser?.id === userId
          ? { ...state.selectedUser, role, updatedAt: new Date().toISOString() }
          : state.selectedUser,
        loading: false,
      }));

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update user role';
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Bulk update user role
  bulkUpdateUserRole: async (userIds: string[], role: User['role'], adminId?: string, adminEmail?: string): Promise<ActionResult> => {
    set({ loading: true, error: null });

    try {
      const updatePromises = userIds.map(userId => {
        const userRef = doc(db, 'users', userId);
        return updateDoc(userRef, {
          role,
          updatedAt: serverTimestamp(),
        });
      });

      await Promise.all(updatePromises);

      // Audit log
      if (adminId) {
        await auditLogger.logUserAction(adminId, 'USER_BULK_ROLE_CHANGE', userIds.join(','), {
          userIds,
          newRole: role,
          affectedCount: userIds.length,
        }, adminEmail);
      }

      set(state => ({
        users: state.users.map(user =>
          userIds.includes(user.id)
            ? { ...user, role, updatedAt: new Date().toISOString() }
            : user
        ),
        loading: false,
      }));

      return { success: true, data: { updatedCount: userIds.length } };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update user roles';
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Utility actions
  setSelectedUser: (user: User | null) => set({ selectedUser: user }),
  resetUsers: () => set({ users: [], pagination: { lastDoc: null, hasMore: false } }),
  clearError: () => set({ error: null }),
}));

export default useAdminUsers;