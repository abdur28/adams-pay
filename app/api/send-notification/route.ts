// app/api/send-notification/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  serverTimestamp,
  increment 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    // Verify API key (optional but recommended)
    const apiKey = request.headers.get('x-api-key');
    if (process.env.NOTIFICATION_API_KEY && apiKey !== process.env.NOTIFICATION_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, title, body: notificationBody, type, data } = body;

    if (!userId || !title || !notificationBody) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId, title, body' },
        { status: 400 }
      );
    }

    // Add notification to user's notifications subcollection
    const notificationRef = collection(db, 'users', userId, 'notifications');
    const newNotification = await addDoc(notificationRef, {
      title,
      body: notificationBody,
      type: type || 'info',
      data: data || {},
      read: false,
      createdAt: serverTimestamp(),
    });

    // Increment unread notifications counter
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      unreadNotifications: increment(1)
    });

    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully',
      notificationId: newNotification.id
    });
  } catch (error: any) {
    console.error('Notification API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}