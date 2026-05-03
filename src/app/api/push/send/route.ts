import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  try {
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('VAPID keys are missing');
      return NextResponse.json({ error: 'Push notification service not configured' }, { status: 500 });
    }

    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:admin@nexarismodule.online',
      vapidPublicKey,
      vapidPrivateKey
    );

    const body = await req.json();
    const { userId, title, message, url } = body;

    if (!userId || !title) {
      return NextResponse.json({ error: 'Missing userId or title' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch this user's push subscription
    const { data, error } = await supabase
      .from('user_push_subscriptions')
      .select('subscription')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'No subscription found for user' }, { status: 404 });
    }

    const subscription = JSON.parse(data.subscription);

    const payload = JSON.stringify({
      title,
      body: message || '',
      url: url || '/dashboard',
      icon: '/icon.png',
      badge: '/icon.png',
    });

    await webpush.sendNotification(subscription, payload);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Send push error:', err);
    return NextResponse.json({ error: 'Failed to send push notification' }, { status: 500 });
  }
}
