// lib/database.ts
import { databases, DATABASE_ID, Query } from '@/lib/appwrite';
import { ID, Models } from 'appwrite';

export interface DatabaseDocument extends Models.DefaultDocument {
  [key: string]: any;
}

export interface ListDocumentsOptions {
  queries?: string[];
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderType?: 'ASC' | 'DESC';
}

/**
 * Create a new document in a collection
 * @param collectionId Collection ID
 * @param data Document data
 * @param documentId Optional custom document ID (generates unique ID if not provided)
 * @param permissions Optional document permissions
 * @returns Promise with created document
 */
export const createDocument = async <T = DatabaseDocument>(
  collectionId: string,
  data: Omit<T, keyof Models.DefaultDocument>,
  documentId?: string,
  permissions?: string[]
): Promise<T & Models.DefaultDocument> => {
  try {
    const document = await databases.createDocument(
      DATABASE_ID,
      collectionId,
      documentId || ID.unique(),
      data,
      permissions
    );
    return document as unknown as T & Models.DefaultDocument;
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
};

/**
 * Get a document by ID
 * @param collectionId Collection ID
 * @param documentId Document ID
 * @returns Promise with document
 */
export const getDocument = async <T = DatabaseDocument>(
  collectionId: string,
  documentId: string
): Promise<T & Models.DefaultDocument> => {
  try {
    const document = await databases.getDocument(DATABASE_ID, collectionId, documentId);
    return document as unknown as T & Models.DefaultDocument;
  } catch (error) {
    console.error('Error getting document:', error);
    throw error;
  }
};

/**
 * List documents in a collection
 * @param collectionId Collection ID
 * @param options Query options
 * @returns Promise with document list
 */
export const listDocuments = async <T = DatabaseDocument>(
  collectionId: string,
  options: ListDocumentsOptions = {}
): Promise<Models.DocumentList<T & Models.DefaultDocument>> => {
  try {
    const { queries = [], limit, offset, orderBy, orderType } = options;
    
    // Add limit query if specified
    if (limit) queries.push(Query.limit(limit));
    
    // Add offset query if specified
    if (offset) queries.push(Query.offset(offset));
    
    // Add order query if specified
    if (orderBy) {
      if (orderType === 'DESC') {
        queries.push(Query.orderDesc(orderBy));
      } else {
        queries.push(Query.orderAsc(orderBy));
      }
    }

    const documents = await databases.listDocuments(DATABASE_ID, collectionId, queries);
    return documents as unknown as Models.DocumentList<T & Models.DefaultDocument>;
  } catch (error) {
    console.error('Error listing documents:', error);
    throw error;
  }
};

/**
 * Update a document
 * @param collectionId Collection ID
 * @param documentId Document ID
 * @param data Updated data
 * @param permissions Optional updated permissions
 * @returns Promise with updated document
 */
export const updateDocument = async <T = DatabaseDocument>(
  collectionId: string,
  documentId: string,
  data: Partial<Omit<T, keyof Models.DefaultDocument>>,
  permissions?: string[]
): Promise<T & Models.DefaultDocument> => {
  try {
    const document = await databases.updateDocument(
      DATABASE_ID,
      collectionId,
      documentId,
      data,
      permissions
    );
    return document as unknown as T & Models.DefaultDocument;
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
};

/**
 * Delete a document
 * @param collectionId Collection ID
 * @param documentId Document ID
 */
export const deleteDocument = async (
  collectionId: string,
  documentId: string
): Promise<void> => {
  try {
    await databases.deleteDocument(DATABASE_ID, collectionId, documentId);
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

/**
 * Search documents by text
 * @param collectionId Collection ID
 * @param attribute Attribute to search in
 * @param searchTerm Search term
 * @param options Additional query options
 * @returns Promise with search results
 */
export const searchDocuments = async <T = DatabaseDocument>(
  collectionId: string,
  attribute: string,
  searchTerm: string,
  options: ListDocumentsOptions = {}
): Promise<Models.DocumentList<T & Models.DefaultDocument>> => {
  try {
    const queries = [Query.search(attribute, searchTerm)];
    
    return listDocuments<T>(collectionId, { ...options, queries });
  } catch (error) {
    console.error('Error searching documents:', error);
    throw error;
  }
};

/**
 * Get documents where attribute equals value
 * @param collectionId Collection ID
 * @param attribute Attribute name
 * @param value Value to match
 * @param options Additional query options
 * @returns Promise with filtered documents
 */
export const getDocumentsWhere = async <T = DatabaseDocument>(
  collectionId: string,
  attribute: string,
  value: any,
  options: ListDocumentsOptions = {}
): Promise<Models.DocumentList<T & Models.DefaultDocument>> => {
  try {
    const queries = [Query.equal(attribute, value)];
    
    return listDocuments<T>(collectionId, { ...options, queries });
  } catch (error) {
    console.error('Error getting documents where:', error);
    throw error;
  }
};

/**
 * Get documents where attribute is in array of values
 * @param collectionId Collection ID
 * @param attribute Attribute name
 * @param values Array of values to match
 * @param options Additional query options
 * @returns Promise with filtered documents
 */
export const getDocumentsWhereIn = async <T = DatabaseDocument>(
  collectionId: string,
  attribute: string,
  values: any[],
  options: ListDocumentsOptions = {}
): Promise<Models.DocumentList<T & Models.DefaultDocument>> => {
  try {
    const queries = values.map(value => Query.equal(attribute, value));
    
    return listDocuments<T>(collectionId, { ...options, queries });
  } catch (error) {
    console.error('Error getting documents where in:', error);
    throw error;
  }
};

/**
 * Get documents with pagination
 * @param collectionId Collection ID
 * @param page Page number (1-based)
 * @param pageSize Number of documents per page
 * @param orderBy Optional order by attribute
 * @param orderType Order type (ASC or DESC)
 * @returns Promise with paginated results
 */
export const getPaginatedDocuments = async <T = DatabaseDocument>(
  collectionId: string,
  page: number = 1,
  pageSize: number = 25,
  orderBy?: string,
  orderType: 'ASC' | 'DESC' = 'ASC'
): Promise<{
  documents: Models.DocumentList<T & Models.DefaultDocument>;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}> => {
  try {
    const offset = (page - 1) * pageSize;
    
    const result = await listDocuments<T>(collectionId, {
      limit: pageSize,
      offset,
      orderBy,
      orderType
    });
    
    const totalPages = Math.ceil(result.total / pageSize);
    
    return {
      documents: result,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };
  } catch (error) {
    console.error('Error getting paginated documents:', error);
    throw error;
  }
};

/**
 * Batch create multiple documents
 * @param collectionId Collection ID
 * @param documents Array of document data
 * @returns Promise with array of created documents
 */
export const batchCreateDocuments = async <T = DatabaseDocument>(
  collectionId: string,
  documents: Array<Omit<T, keyof Models.DefaultDocument>>
): Promise<Array<T & Models.DefaultDocument>> => {
  try {
    const promises = documents.map(data => 
      createDocument<T>(collectionId, data)
    );
    
    return Promise.all(promises);
  } catch (error) {
    console.error('Error batch creating documents:', error);
    throw error;
  }
};

/**
 * Batch update multiple documents
 * @param collectionId Collection ID
 * @param updates Array of document updates with IDs
 * @returns Promise with array of updated documents
 */
export const batchUpdateDocuments = async <T = DatabaseDocument>(
  collectionId: string,
  updates: Array<{ id: string; data: Partial<Omit<T, keyof Models.DefaultDocument>> }>
): Promise<Array<T & Models.DefaultDocument>> => {
  try {
    const promises = updates.map(({ id, data }) => 
      updateDocument<T>(collectionId, id, data)
    );
    
    return Promise.all(promises);
  } catch (error) {
    console.error('Error batch updating documents:', error);
    throw error;
  }
};

/**
 * Batch delete multiple documents
 * @param collectionId Collection ID
 * @param documentIds Array of document IDs to delete
 */
export const batchDeleteDocuments = async (
  collectionId: string,
  documentIds: string[]
): Promise<void> => {
  try {
    const promises = documentIds.map(id => 
      deleteDocument(collectionId, id)
    );
    
    await Promise.all(promises);
  } catch (error) {
    console.error('Error batch deleting documents:', error);
    throw error;
  }
};

/**
 * Count documents in a collection
 * @param collectionId Collection ID
 * @param queries Optional query filters
 * @returns Promise with document count
 */
export const countDocuments = async (
  collectionId: string,
  queries?: string[]
): Promise<number> => {
  try {
    const result = await databases.listDocuments(DATABASE_ID, collectionId, [
      ...(queries || []),
      Query.limit(1) // We only need the total count, not the documents
    ]);
    
    return result.total;
  } catch (error) {
    console.error('Error counting documents:', error);
    throw error;
  }
};

/**
 * Check if document exists
 * @param collectionId Collection ID
 * @param documentId Document ID
 * @returns Promise with boolean indicating existence
 */
export const documentExists = async (
  collectionId: string,
  documentId: string
): Promise<boolean> => {
  try {
    await getDocument(collectionId, documentId);
    return true;
  } catch (error) {
    return false;
  }
};

// Query helpers for common operations
export const queryHelpers = {
  // Equality
  equal: (attribute: string, value: any) => Query.equal(attribute, value),
  notEqual: (attribute: string, value: any) => Query.notEqual(attribute, value),
  
  // Comparison
  lessThan: (attribute: string, value: any) => Query.lessThan(attribute, value),
  lessThanEqual: (attribute: string, value: any) => Query.lessThanEqual(attribute, value),
  greaterThan: (attribute: string, value: any) => Query.greaterThan(attribute, value),
  greaterThanEqual: (attribute: string, value: any) => Query.greaterThanEqual(attribute, value),
  
  // Array operations
  between: (attribute: string, start: any, end: any) => Query.between(attribute, start, end),
  isNull: (attribute: string) => Query.isNull(attribute),
  isNotNull: (attribute: string) => Query.isNotNull(attribute),
  
  // Text operations
  search: (attribute: string, value: string) => Query.search(attribute, value),
  
  // Ordering
  orderAsc: (attribute: string) => Query.orderAsc(attribute),
  orderDesc: (attribute: string) => Query.orderDesc(attribute),
  
  // Pagination
  limit: (value: number) => Query.limit(value),
  offset: (value: number) => Query.offset(value),
};