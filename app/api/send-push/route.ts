// app/api/send-push/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Expo Push API endpoint
const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

interface PushNotificationData {
  userId?: string;
  tokens?: string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  priority?: 'default' | 'normal' | 'high';
  sound?: string;
  badge?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Verify API key
    const apiKey = request.headers.get('x-api-key');
    if (process.env.PUSH_API_KEY && apiKey !== process.env.PUSH_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: PushNotificationData = await request.json();
    const { userId, tokens, title, body: notificationBody, data, priority, sound, badge } = body;

    if (!title || !notificationBody) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, body' },
        { status: 400 }
      );
    }

    let pushTokens: string[] = [];

    // Get tokens from userId or use provided tokens
    if (userId) {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      const userData = userDoc.data();
      
      // Check if user has push notifications enabled
      if (userData.notificationSettings?.pushEnabled === false) {
        return NextResponse.json({
          success: false,
          error: 'Push notifications disabled for this user',
        });
      }

      pushTokens = userData.pushTokens || [];
    } else if (tokens) {
      pushTokens = tokens;
    } else {
      return NextResponse.json(
        { success: false, error: 'Either userId or tokens must be provided' },
        { status: 400 }
      );
    }

    if (pushTokens.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No push tokens found',
      });
    }

    // Filter valid Expo push tokens
    const validTokens = pushTokens.filter(
      (token) => typeof token === 'string' && token.startsWith('ExponentPushToken[')
    );

    if (validTokens.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid Expo push tokens found',
      });
    }

    // Prepare push messages
    const messages = validTokens.map((token) => ({
      to: token,
      title,
      body: notificationBody,
      data: data || {},
      sound: sound || 'default',
      badge: badge || 1,
      priority: priority || 'high',
      _displayInForeground: true,
      categoryId: data?.type || 'default',
    }));

    // Send push notifications via Expo
    const response = await fetch(EXPO_PUSH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Expo push error:', errorData);
      return NextResponse.json(
        { success: false, error: 'Failed to send push notification', details: errorData },
        { status: response.status }
      );
    }

    const result = await response.json();

    // Check for errors in individual messages
    const errors = result.data?.filter((r: any) => r.status === 'error') || [];
    
    if (errors.length > 0) {
      console.error('Some push notifications failed:', errors);
    }

    return NextResponse.json({
      success: true,
      message: 'Push notifications sent',
      sent: validTokens.length,
      errors: errors.length,
      data: result.data,
    });
  } catch (error: any) {
    console.error('Push notification API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}