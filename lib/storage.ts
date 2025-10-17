// lib/storage.ts
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL,
  deleteObject,
  listAll,
  UploadTaskSnapshot
} from 'firebase/storage';
import { storage } from '@/lib/firebase';

interface UploadProgressCallback {
  (progress: number): void;
}

/**
 * Upload a single file to Firebase Storage
 * @param file File object to upload
 * @param path Storage path where the file will be saved
 * @param onProgress Optional callback for upload progress
 * @returns Promise with file object containing download URL
 */
export const uploadFile = async (
  file: File,
  path: string,
  onProgress?: UploadProgressCallback
): Promise<{ fileId: string; url: string; downloadUrl: string }> => {
  try {
    // Create storage reference
    const storageRef = ref(storage, path);

    // Create upload task
    const uploadTask = uploadBytesResumable(storageRef, file);

    // Return promise
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot: UploadTaskSnapshot) => {
          // Handle progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        },
        (error) => {
          // Handle error
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          // Handle success
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            fileId: path,
            url: downloadURL,
            downloadUrl: downloadURL
          });
        }
      );
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Upload a single image to Firebase Storage
 * @param file File object to upload
 * @param path Storage path where the image will be saved
 * @param onProgress Optional callback for upload progress
 * @returns Promise with file object containing download URL
 */
export const uploadImage = async (
  file: File,
  path?: string,
  onProgress?: UploadProgressCallback
): Promise<{ fileId: string; url: string; downloadUrl: string }> => {
  try {
    // Generate unique filename if path not provided
    const filePath = path || `uploads/${generateUniqueFileName(file.name)}`;
    
    return uploadFile(file, filePath, onProgress);
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

/**
 * Upload multiple images to Firebase Storage
 * @param files Array of File objects
 * @param basePath Base path for the images (optional)
 * @param onProgress Optional callback for total upload progress
 * @returns Promise with array of file objects
 */
export const uploadMultipleImages = async (
  files: File[],
  basePath?: string,
  onProgress?: UploadProgressCallback
): Promise<Array<{ fileId: string; url: string; downloadUrl: string }>> => {
  try {
    const uploadPromises = files.map(async (file, index) => {
      const fileName = basePath 
        ? `${basePath}/${index}_${generateUniqueFileName(file.name)}`
        : `uploads/${generateUniqueFileName(file.name)}`;
      
      const result = await uploadImage(file, fileName, (progress) => {
        if (onProgress) {
          // Calculate total progress across all images
          const totalProgress = (index * 100 + progress) / files.length;
          onProgress(totalProgress);
        }
      });

      return result;
    });

    return Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    throw error;
  }
};

/**
 * Delete a file from Firebase Storage
 * @param path Storage path of the file to delete
 */
export const deleteFile = async (path: string): Promise<void> => {
  try {
    const fileRef = ref(storage, path);
    await deleteObject(fileRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

/**
 * Get file download URL
 * @param path Storage path
 * @returns File download URL
 */
export const getFileDownload = async (path: string): Promise<string> => {
  try {
    const fileRef = ref(storage, path);
    return await getDownloadURL(fileRef);
  } catch (error) {
    console.error('Error getting download URL:', error);
    throw error;
  }
};

/**
 * Get file preview URL (same as download for Firebase)
 * @param path Storage path
 * @returns File preview URL
 */
export const getFilePreview = async (path: string): Promise<string> => {
  return getFileDownload(path);
};

/**
 * List all files in a storage path
 * @param path Storage path
 * @returns Promise with list of file references
 */
export const listFiles = async (path: string = '') => {
  try {
    const listRef = ref(storage, path);
    const res = await listAll(listRef);
    
    const filesWithUrls = await Promise.all(
      res.items.map(async (itemRef) => ({
        path: itemRef.fullPath,
        name: itemRef.name,
        url: await getDownloadURL(itemRef)
      }))
    );
    
    return filesWithUrls;
  } catch (error) {
    console.error('Error listing files:', error);
    throw error;
  }
};

/**
 * Generate a unique filename using timestamp
 * @param originalName Original filename
 * @returns Unique filename
 */
export const generateUniqueFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = getFileExtension(originalName);
  return extension ? `${timestamp}_${randomString}.${extension}` : `${timestamp}_${randomString}`;
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