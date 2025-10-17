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
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/types/type';
import { FetchOptions, PaginationState, ActionResult } from '@/types/admin';
import { formatFirestoreTimestamp } from '@/lib/utils';

interface AdminUsersStore {
  // State
  users: User[];
  selectedUser: User | null;
  
  // Loading & Error
  loading: boolean;
  error: string | null;
  
  // Pagination
  pagination: PaginationState;
  
  // Actions
  fetchUsers: (options?: FetchOptions) => Promise<void>;
  getUserById: (userId: string) => Promise<User | null>;
  updateUser: (userId: string, data: Partial<User>) => Promise<ActionResult>;
  toggleUserStatus: (userId: string, status: User['status']) => Promise<ActionResult>;
  updateUserRole: (userId: string, role: User['role']) => Promise<ActionResult>;
  bulkUpdateUserRole: (userIds: string[], role: User['role']) => Promise<ActionResult>;
  setSelectedUser: (user: User | null) => void;
  resetUsers: () => void;
  clearError: () => void;
}

const useAdminUsers = create<AdminUsersStore>((set, get) => ({
  // Initial State
  users: [],
  selectedUser: null,
  loading: false,
  error: null,
  pagination: {
    lastDoc: null,
    hasMore: false,
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

      // Apply pagination
      let paginatedQuery;
      if (get().pagination.hasMore && (startAfterDoc || get().pagination.lastDoc)) {
        const lastDoc = startAfterDoc || get().pagination.lastDoc;
        paginatedQuery = query(orderedQuery, startAfter(lastDoc), limit(limitCount));
      } else {
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
  updateUser: async (userId: string, data: Partial<User>): Promise<ActionResult> => {
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
  toggleUserStatus: async (userId: string, status: User['status']): Promise<ActionResult> => {
    set({ loading: true, error: null });

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        status,
        updatedAt: serverTimestamp(),
      });

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
  updateUserRole: async (userId: string, role: User['role']): Promise<ActionResult> => {
    set({ loading: true, error: null });

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role,
        updatedAt: serverTimestamp(),
      });

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
  bulkUpdateUserRole: async (userIds: string[], role: User['role']): Promise<ActionResult> => {
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