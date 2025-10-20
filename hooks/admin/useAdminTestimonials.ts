// hooks/admin/useAdminTestimonials.ts
import { create } from 'zustand';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  uploadFile, 
  deleteFile, 
  generateUniqueFileName, 
  validateFileSize 
} from '@/lib/storage';
import { ActionResult } from '@/types/admin';
import { formatFirestoreTimestamp } from '@/lib/utils';

// Testimonial Type
export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  designation: string;
  src: string; // image URL
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface AdminTestimonialsStore {
  // State
  testimonials: Testimonial[];
  selectedTestimonial: Testimonial | null;
  
  // Loading & Error & Upload Progress
  loading: boolean;
  error: string | null;
  uploadProgress: number;
  
  // Actions
  fetchTestimonials: () => Promise<void>;
  getTestimonialById: (testimonialId: string) => Promise<Testimonial | null>;
  createTestimonial: (data: Omit<Testimonial, 'id' | 'createdAt' | 'updatedAt' | 'src'>, imageFile: File) => Promise<ActionResult>;
  updateTestimonial: (testimonialId: string, data: Partial<Omit<Testimonial, 'src'>>, imageFile?: File) => Promise<ActionResult>;
  deleteTestimonial: (testimonialId: string) => Promise<ActionResult>;
  toggleTestimonialStatus: (testimonialId: string, isActive: boolean) => Promise<ActionResult>;
  reorderTestimonials: (testimonials: Testimonial[]) => Promise<ActionResult>;
  setSelectedTestimonial: (testimonial: Testimonial | null) => void;
  clearError: () => void;
}

const useAdminTestimonials = create<AdminTestimonialsStore>((set, get) => ({
  // Initial State
  testimonials: [],
  selectedTestimonial: null,
  loading: false,
  error: null,
  uploadProgress: 0,

  // Fetch all testimonials
  fetchTestimonials: async () => {
    set({ loading: true, error: null });

    try {
      const testimonialsQuery = query(
        collection(db, 'testimonials'),
        orderBy('order', 'asc')
      );

      const snapshot = await getDocs(testimonialsQuery);

      const testimonials = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: formatFirestoreTimestamp(doc.data().createdAt),
        updatedAt: formatFirestoreTimestamp(doc.data().updatedAt),
      } as Testimonial));

      set({ testimonials, loading: false });
    } catch (error: any) {
      console.error('Error fetching testimonials:', error);
      set({
        loading: false,
        error: error.message || 'Failed to fetch testimonials',
      });
    }
  },

  // Get testimonial by ID
  getTestimonialById: async (testimonialId: string): Promise<Testimonial | null> => {
    try {
      const testimonialDoc = await getDoc(doc(db, 'testimonials', testimonialId));

      if (!testimonialDoc.exists()) return null;

      return {
        id: testimonialDoc.id,
        ...testimonialDoc.data(),
        createdAt: formatFirestoreTimestamp(testimonialDoc.data().createdAt),
        updatedAt: formatFirestoreTimestamp(testimonialDoc.data().updatedAt),
      } as Testimonial;
    } catch (error: any) {
      console.error('Error getting testimonial:', error);
      set({ error: error.message || 'Failed to get testimonial' });
      return null;
    }
  },

  // Create testimonial with image upload
  createTestimonial: async (
    data: Omit<Testimonial, 'id' | 'createdAt' | 'updatedAt' | 'src'>,
    imageFile: File
  ): Promise<ActionResult> => {
    set({ loading: true, error: null, uploadProgress: 0 });

    try {
      // Validate file size (5MB max)
      if (!validateFileSize(imageFile.size, 5)) {
        throw new Error('File size must be less than 5MB');
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!allowedTypes.includes(imageFile.type)) {
        throw new Error('Only images (JPEG, PNG, WebP) are allowed');
      }

      // Get the highest order number and add 1
      const testimonials = get().testimonials;
      const maxOrder = testimonials.length > 0 
        ? Math.max(...testimonials.map(t => t.order)) 
        : 0;

      // Generate unique filename and upload
      const uniqueFileName = generateUniqueFileName(imageFile.name);
      const storagePath = `testimonials/images/${uniqueFileName}`;
      
      const downloadURL = await uploadFile(imageFile, storagePath, (progress) => {
        set({ uploadProgress: progress });
      });

      // Create testimonial document
      const docRef = await addDoc(collection(db, 'testimonials'), {
        ...data,
        src: downloadURL.url,
        order: data.order || maxOrder + 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const newTestimonial: Testimonial = {
        id: docRef.id,
        ...data,
        src: downloadURL.url,
        order: data.order || maxOrder + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      set(state => ({
        testimonials: [...state.testimonials, newTestimonial].sort((a, b) => a.order - b.order),
        loading: false,
        uploadProgress: 0,
      }));

      return { success: true, data: { id: docRef.id, imageUrl: downloadURL.url } };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create testimonial';
      set({ loading: false, error: errorMessage, uploadProgress: 0 });
      return { success: false, error: errorMessage };
    }
  },

  // Update testimonial
  updateTestimonial: async (
    testimonialId: string,
    data: Partial<Omit<Testimonial, 'src'>>,
    imageFile?: File
  ): Promise<ActionResult> => {
    set({ loading: true, error: null, uploadProgress: 0 });

    try {
      let imageUrl: string | undefined;

      // If new image is provided, upload it
      if (imageFile) {
        // Validate file size (5MB max)
        if (!validateFileSize(imageFile.size, 5)) {
          throw new Error('File size must be less than 5MB');
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (!imageFile.type.includes('image')) {
          throw new Error('Only images (JPEG, PNG, WebP) are allowed');
        }

        // Get old testimonial to delete old image
        const testimonialRef = doc(db, 'testimonials', testimonialId);
        const testimonialDoc = await getDoc(testimonialRef);
        
        if (testimonialDoc.exists()) {
          const oldImageUrl = testimonialDoc.data().src;
          if (oldImageUrl) {
            try {
              await deleteFile(oldImageUrl);
            } catch (error) {
              console.error('Error deleting old image:', error);
              // Continue even if deletion fails
            }
          }
        }

        // Upload new image
        const uniqueFileName = generateUniqueFileName(imageFile.name);
        const storagePath = `testimonials/images/${uniqueFileName}`;
        
        const downloadURL = await uploadFile(imageFile, storagePath, (progress) => {
          set({ uploadProgress: progress });
        });

        imageUrl = downloadURL.url;
      }

      // Update document
      const testimonialRef = doc(db, 'testimonials', testimonialId);
      const updateData: any = {
        ...data,
        updatedAt: serverTimestamp(),
      };

      if (imageUrl) {
        updateData.src = imageUrl;
      }

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      await updateDoc(testimonialRef, updateData);

      set(state => ({
        testimonials: state.testimonials.map(testimonial =>
          testimonial.id === testimonialId
            ? { 
                ...testimonial, 
                ...data, 
                ...(imageUrl && { src: imageUrl }),
                updatedAt: new Date().toISOString() 
              }
            : testimonial
        ).sort((a, b) => a.order - b.order),
        selectedTestimonial: state.selectedTestimonial?.id === testimonialId
          ? { 
              ...state.selectedTestimonial, 
              ...data, 
              ...(imageUrl && { src: imageUrl }),
              updatedAt: new Date().toISOString() 
            }
          : state.selectedTestimonial,
        loading: false,
        uploadProgress: 0,
      }));

      return { success: true, data: imageUrl ? { imageUrl } : undefined };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update testimonial';
      set({ loading: false, error: errorMessage, uploadProgress: 0 });
      return { success: false, error: errorMessage };
    }
  },

  // Delete testimonial
  deleteTestimonial: async (testimonialId: string): Promise<ActionResult> => {
    set({ loading: true, error: null });

    try {
      // Get testimonial to delete image
      const testimonialRef = doc(db, 'testimonials', testimonialId);
      const testimonialDoc = await getDoc(testimonialRef);

      if (testimonialDoc.exists()) {
        const imageUrl = testimonialDoc.data().src;
        
        // Delete image from storage
        if (imageUrl) {
          try {
            await deleteFile(imageUrl);
          } catch (error) {
            console.error('Error deleting image:', error);
            // Continue even if deletion fails
          }
        }
      }

      // Delete document
      await deleteDoc(testimonialRef);

      set(state => ({
        testimonials: state.testimonials.filter(t => t.id !== testimonialId),
        selectedTestimonial: state.selectedTestimonial?.id === testimonialId 
          ? null 
          : state.selectedTestimonial,
        loading: false,
      }));

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to delete testimonial';
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Toggle testimonial status
  toggleTestimonialStatus: async (
    testimonialId: string,
    isActive: boolean
  ): Promise<ActionResult> => {
    set({ loading: true, error: null });

    try {
      const testimonialRef = doc(db, 'testimonials', testimonialId);
      await updateDoc(testimonialRef, {
        isActive,
        updatedAt: serverTimestamp(),
      });

      set(state => ({
        testimonials: state.testimonials.map(testimonial =>
          testimonial.id === testimonialId
            ? { ...testimonial, isActive, updatedAt: new Date().toISOString() }
            : testimonial
        ),
        selectedTestimonial: state.selectedTestimonial?.id === testimonialId
          ? { ...state.selectedTestimonial, isActive, updatedAt: new Date().toISOString() }
          : state.selectedTestimonial,
        loading: false,
      }));

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to toggle testimonial status';
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Reorder testimonials
  reorderTestimonials: async (testimonials: Testimonial[]): Promise<ActionResult> => {
    set({ loading: true, error: null });

    try {
      // Update order for each testimonial
      const updatePromises = testimonials.map((testimonial, index) => {
        const testimonialRef = doc(db, 'testimonials', testimonial.id);
        return updateDoc(testimonialRef, {
          order: index,
          updatedAt: serverTimestamp(),
        });
      });

      await Promise.all(updatePromises);

      set({
        testimonials: testimonials.map((t, index) => ({
          ...t,
          order: index,
          updatedAt: new Date().toISOString(),
        })),
        loading: false,
      });

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to reorder testimonials';
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Utility actions
  setSelectedTestimonial: (testimonial: Testimonial | null) => 
    set({ selectedTestimonial: testimonial }),
  clearError: () => set({ error: null }),
}));

export default useAdminTestimonials;