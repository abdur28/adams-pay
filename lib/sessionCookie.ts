// lib/sessionCookie.ts
import { auth } from '@/lib/firebase';

/**
 * Set session cookie when user logs in
 * This is called automatically by the AuthContext
 */
export const setSessionCookie = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return;

    // Get the ID token
    const idToken = await user.getIdToken();

    // Call API route to set the session cookie
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      console.error('Failed to set session cookie');
    }
  } catch (error) {
    console.error('Error setting session cookie:', error);
  }
};

/**
 * Clear session cookie when user logs out
 */
export const clearSessionCookie = async () => {
  try {
    await fetch('/api/auth/session', {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Error clearing session cookie:', error);
  }
};