// lib/storage.ts
import { storage, STORAGE_BUCKET_ID } from '@/lib/appwrite';
import { ID } from 'appwrite';

interface UploadProgressCallback {
  (progress: number): void;
}

/**
 * Upload a single image to Appwrite Storage
 * @param file File object to upload
 * @param path Optional custom path/filename (will generate unique ID if not provided)
 * @param onProgress Optional callback for upload progress (simulated for Appwrite)
 * @param bucketId Optional bucket ID (uses default if not provided)
 * @returns Promise with file object containing file ID and preview URL
 */
export const uploadImage = async (
  file: File,
  path?: string,
  onProgress?: UploadProgressCallback,
  bucketId?: string
): Promise<{ fileId: string; url: string; downloadUrl: string }> => {
  try {
    // Simulate progress start
    if (onProgress) onProgress(0);

    // Generate unique filename if path not provided
    const fileId = path || generateUniqueFileName(file.name);

    // Simulate progress during upload
    if (onProgress) onProgress(50);

    // Upload file to Appwrite
    const uploadedFile = await storage.createFile(
      bucketId || STORAGE_BUCKET_ID,
      fileId,
      file
    );

    // Simulate progress completion
    if (onProgress) onProgress(100);

    // Get file URLs
    const previewUrl = storage.getFilePreview(bucketId || STORAGE_BUCKET_ID, uploadedFile.$id);
    const downloadUrl = storage.getFileDownload(bucketId || STORAGE_BUCKET_ID, uploadedFile.$id);

    return {
      fileId: uploadedFile.$id,
      url: previewUrl.toString(),
      downloadUrl: downloadUrl.toString()
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

/**
 * Upload multiple images to Appwrite Storage
 * @param files Array of File objects
 * @param basePath Base path for the images (optional)
 * @param onProgress Optional callback for total upload progress
 * @param bucketId Optional bucket ID
 * @returns Promise with array of file objects
 */
export const uploadMultipleImages = async (
  files: File[],
  basePath?: string,
  onProgress?: UploadProgressCallback,
  bucketId?: string
): Promise<Array<{ fileId: string; url: string; downloadUrl: string }>> => {
  try {
    const uploadPromises = files.map(async (file, index) => {
      const fileName = basePath 
        ? `${basePath}/${index}_${generateUniqueFileName(file.name)}`
        : undefined;
      
      const result = await uploadImage(file, fileName, (progress) => {
        if (onProgress) {
          // Calculate total progress across all images
          const totalProgress = (index * 100 + progress) / files.length;
          onProgress(totalProgress);
        }
      }, bucketId);

      return result;
    });

    return Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    throw error;
  }
};

/**
 * Upload a file to Appwrite Storage
 * @param file File object to upload
 * @param path Optional custom path/filename
 * @param onProgress Optional callback for upload progress
 * @param bucketId Optional bucket ID
 * @returns Promise with file object
 */
export const uploadFile = async (
  file: File,
  path?: string,
  onProgress?: UploadProgressCallback,
  bucketId?: string
): Promise<{ fileId: string; url: string; downloadUrl: string }> => {
  // Use the same implementation as uploadImage for consistency
  return uploadImage(file, path, onProgress, bucketId);
};

/**
 * Delete a file from Appwrite Storage
 * @param fileId File ID to delete
 * @param bucketId Optional bucket ID
 */
export const deleteFile = async (fileId: string, bucketId?: string): Promise<void> => {
  try {
    await storage.deleteFile(bucketId || STORAGE_BUCKET_ID, fileId);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

/**
 * Get file preview URL
 * @param fileId File ID
 * @param bucketId Optional bucket ID
 * @returns File preview URL
 */
export const getFilePreview = (fileId: string, bucketId?: string): string => {
  return storage.getFilePreview(bucketId || STORAGE_BUCKET_ID, fileId).toString();
};

/**
 * Get file download URL
 * @param fileId File ID
 * @param bucketId Optional bucket ID
 * @returns File download URL
 */
export const getFileDownload = (fileId: string, bucketId?: string): string => {
  return storage.getFileDownload(bucketId || STORAGE_BUCKET_ID, fileId).toString();
};

/**
 * List all files in storage bucket
 * @param bucketId Optional bucket ID
 * @returns Promise with list of files
 */
export const listFiles = async (bucketId?: string) => {
  try {
    return await storage.listFiles(bucketId || STORAGE_BUCKET_ID);
  } catch (error) {
    console.error('Error listing files:', error);
    throw error;
  }
};

/**
 * Generate a unique filename using Appwrite's ID utility
 * @param originalName Original filename
 * @returns Unique filename
 */
export const generateUniqueFileName = (originalName: string): string => {
  const extension = getFileExtension(originalName);
  const uniqueId = ID.unique();
  return extension ? `${uniqueId}.${extension}` : uniqueId;
};

/**
 * Helper to get file extension from file name or path
 * @param fileName File name or path
 * @returns File extension
 */
export const getFileExtension = (fileName: string): string => {
  return fileName.split('.').pop()?.toLowerCase() || '';
};

/**
 * Check if file is an image
 * @param file File object
 * @returns Boolean indicating if file is an image
 */
export const isImage = (file: File): boolean => {
  return file.type.startsWith('image/');
};

/**
 * Check if file type is image by filename
 * @param fileName File name
 * @returns Boolean indicating if file is an image
 */
export const isImageByName = (fileName: string): boolean => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
  const extension = getFileExtension(fileName);
  return imageExtensions.includes(extension);
};

/**
 * Validate file size
 * @param size File size in bytes
 * @param maxSize Maximum size in MB
 * @returns Boolean indicating if file size is valid
 */
export const validateFileSize = (size: number, maxSize: number): boolean => {
  const maxBytes = maxSize * 1024 * 1024; // Convert MB to bytes
  return size <= maxBytes;
};

/**
 * Get file size in human readable format
 * @param bytes File size in bytes
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Validate file type
 * @param file File object
 * @param allowedTypes Array of allowed MIME types
 * @returns Boolean indicating if file type is valid
 */
export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
};

/**
 * Common file type validators
 */
export const fileTypeValidators = {
  images: (file: File) => validateFileType(file, [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'
  ]),
  documents: (file: File) => validateFileType(file, [
    'application/pdf', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]),
  videos: (file: File) => validateFileType(file, [
    'video/mp4', 'video/mpeg', 'video/quicktime'
  ])
};