// lib/database.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  QueryConstraint,
  DocumentData,
  Timestamp,
  WhereFilterOp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface DatabaseDocument {
  id?: string;
  [key: string]: any;
}

export interface ListDocumentsOptions {
  queries?: QueryConstraint[];
  limitCount?: number;
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
}

/**
 * Create a new document in a collection
 * @param collectionName Collection name
 * @param data Document data
 * @param documentId Optional custom document ID (generates auto ID if not provided)
 * @returns Promise with created document
 */
export const createDocument = async <T extends DatabaseDocument>(
  collectionName: string,
  data: Omit<T, 'id'>,
  documentId?: string
): Promise<T> => {
  try {
    const collectionRef = collection(db, collectionName);
    const docRef = documentId ? doc(collectionRef, documentId) : doc(collectionRef);
    
    const documentData = {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    await setDoc(docRef, documentData);

    return {
      id: docRef.id,
      ...documentData
    } as any;
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
};

/**
 * Get a document by ID
 * @param collectionName Collection name
 * @param documentId Document ID
 * @returns Promise with document or null
 */
export const getDocument = async <T extends DatabaseDocument>(
  collectionName: string,
  documentId: string
): Promise<T | null> => {
  try {
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data()
    } as T;
  } catch (error) {
    console.error('Error getting document:', error);
    throw error;
  }
};

/**
 * List documents in a collection
 * @param collectionName Collection name
 * @param options Query options
 * @returns Promise with document list
 */
export const listDocuments = async <T extends DatabaseDocument>(
  collectionName: string,
  options: ListDocumentsOptions = {}
): Promise<{ documents: T[]; total: number }> => {
  try {
    const collectionRef = collection(db, collectionName);
    const constraints: QueryConstraint[] = [];

    if (options.orderByField) {
      constraints.push(orderBy(options.orderByField, options.orderDirection || 'asc'));
    }

    if (options.limitCount) {
      constraints.push(limit(options.limitCount));
    }

    if (options.queries) {
      constraints.push(...options.queries);
    }

    const q = query(collectionRef, ...constraints);
    const querySnapshot = await getDocs(q);

    const documents = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as T[];

    return {
      documents,
      total: documents.length
    };
  } catch (error) {
    console.error('Error listing documents:', error);
    throw error;
  }
};

/**
 * Update a document
 * @param collectionName Collection name
 * @param documentId Document ID
 * @param data Updated data
 * @returns Promise with updated document
 */
export const updateDocument = async <T extends DatabaseDocument>(
  collectionName: string,
  documentId: string,
  data: Partial<Omit<T, 'id'>>
): Promise<T> => {
  try {
    const docRef = doc(db, collectionName, documentId);
    
    const updateData = {
      ...data,
      updatedAt: Timestamp.now()
    };

    await updateDoc(docRef, updateData);

    const updatedDoc = await getDoc(docRef);
    
    return {
      id: updatedDoc.id,
      ...updatedDoc.data()
    } as T;
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
};

/**
 * Delete a document
 * @param collectionName Collection name
 * @param documentId Document ID
 */
export const deleteDocument = async (
  collectionName: string,
  documentId: string
): Promise<void> => {
  try {
    const docRef = doc(db, collectionName, documentId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

/**
 * Get documents where attribute equals value
 * @param collectionName Collection name
 * @param field Field name
 * @param value Value to match
 * @param options Additional query options
 * @returns Promise with filtered documents
 */
export const getDocumentsWhere = async <T extends DatabaseDocument>(
  collectionName: string,
  field: string,
  value: any,
  options: ListDocumentsOptions = {}
): Promise<{ documents: T[]; total: number }> => {
  try {
    const collectionRef = collection(db, collectionName);
    const constraints: QueryConstraint[] = [where(field, '==', value)];

    if (options.orderByField) {
      constraints.push(orderBy(options.orderByField, options.orderDirection || 'asc'));
    }

    if (options.limitCount) {
      constraints.push(limit(options.limitCount));
    }

    const q = query(collectionRef, ...constraints);
    const querySnapshot = await getDocs(q);

    const documents = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as T[];

    return {
      documents,
      total: documents.length
    };
  } catch (error) {
    console.error('Error getting documents where:', error);
    throw error;
  }
};

/**
 * Search documents by text (simple implementation)
 * Note: Firebase doesn't have native full-text search
 * This is a basic implementation using where clause
 * For production, consider using Algolia or Elastic Search
 */
export const searchDocuments = async <T extends DatabaseDocument>(
  collectionName: string,
  field: string,
  searchTerm: string,
  options: ListDocumentsOptions = {}
): Promise<{ documents: T[]; total: number }> => {
  try {
    // Firebase doesn't support native text search
    // This is a workaround using startAt/endAt for prefix matching
    const collectionRef = collection(db, collectionName);
    const constraints: QueryConstraint[] = [
      orderBy(field),
      where(field, '>=', searchTerm),
      where(field, '<=', searchTerm + '\uf8ff')
    ];

    if (options.limitCount) {
      constraints.push(limit(options.limitCount));
    }

    const q = query(collectionRef, ...constraints);
    const querySnapshot = await getDocs(q);

    const documents = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as T[];

    return {
      documents,
      total: documents.length
    };
  } catch (error) {
    console.error('Error searching documents:', error);
    throw error;
  }
};

/**
 * Get paginated documents
 * @param collectionName Collection name
 * @param page Page number (1-based)
 * @param pageSize Number of documents per page
 * @param orderByField Optional order by field
 * @param orderDirection Order direction (asc or desc)
 * @returns Promise with paginated results
 */
export const getPaginatedDocuments = async <T extends DatabaseDocument>(
  collectionName: string,
  page: number = 1,
  pageSize: number = 25,
  orderByField?: string,
  orderDirection: 'asc' | 'desc' = 'asc'
): Promise<{
  documents: T[];
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}> => {
  try {
    const offset = (page - 1) * pageSize;
    
    const result = await listDocuments<T>(collectionName, {
      limitCount: pageSize + 1, // Fetch one extra to check if there's a next page
      orderByField,
      orderDirection
    });
    
    const hasNextPage = result.documents.length > pageSize;
    const documents = hasNextPage ? result.documents.slice(0, pageSize) : result.documents;
    
    return {
      documents,
      currentPage: page,
      pageSize,
      hasNextPage,
      hasPrevPage: page > 1
    };
  } catch (error) {
    console.error('Error getting paginated documents:', error);
    throw error;
  }
};

/**
 * Batch create multiple documents
 * @param collectionName Collection name
 * @param documents Array of document data
 * @returns Promise with array of created documents
 */
export const batchCreateDocuments = async <T extends DatabaseDocument>(
  collectionName: string,
  documents: Array<Omit<T, 'id'>>
): Promise<T[]> => {
  try {
    const promises = documents.map(data => 
      createDocument<T>(collectionName, data)
    );
    
    return Promise.all(promises);
  } catch (error) {
    console.error('Error batch creating documents:', error);
    throw error;
  }
};

/**
 * Batch update multiple documents
 * @param collectionName Collection name
 * @param updates Array of document updates with IDs
 * @returns Promise with array of updated documents
 */
export const batchUpdateDocuments = async <T extends DatabaseDocument>(
  collectionName: string,
  updates: Array<{ id: string; data: Partial<Omit<T, 'id'>> }>
): Promise<T[]> => {
  try {
    const promises = updates.map(({ id, data }) => 
      updateDocument<T>(collectionName, id, data)
    );
    
    return Promise.all(promises);
  } catch (error) {
    console.error('Error batch updating documents:', error);
    throw error;
  }
};

/**
 * Batch delete multiple documents
 * @param collectionName Collection name
 * @param documentIds Array of document IDs to delete
 */
export const batchDeleteDocuments = async (
  collectionName: string,
  documentIds: string[]
): Promise<void> => {
  try {
    const promises = documentIds.map(id => 
      deleteDocument(collectionName, id)
    );
    
    await Promise.all(promises);
  } catch (error) {
    console.error('Error batch deleting documents:', error);
    throw error;
  }
};

/**
 * Count documents in a collection
 * @param collectionName Collection name
 * @returns Promise with document count
 */
export const countDocuments = async (
  collectionName: string
): Promise<number> => {
  try {
    const result = await listDocuments(collectionName);
    return result.total;
  } catch (error) {
    console.error('Error counting documents:', error);
    throw error;
  }
};

/**
 * Check if document exists
 * @param collectionName Collection name
 * @param documentId Document ID
 * @returns Promise with boolean indicating existence
 */
export const documentExists = async (
  collectionName: string,
  documentId: string
): Promise<boolean> => {
  try {
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    return false;
  }
};

// Query helpers for common operations
export const queryHelpers = {
  where: (field: string, operator: WhereFilterOp, value: any) => where(field, operator, value),
  orderBy: (field: string, direction?: 'asc' | 'desc') => orderBy(field, direction),
  limit: (limitCount: number) => limit(limitCount),
};