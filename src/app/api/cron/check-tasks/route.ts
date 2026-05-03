import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

// Use Service Role Key for administrative access if available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(req: NextRequest) {
  try {
    // 1. Setup Web Push
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

    if (!vapidPublicKey || !vapidPrivateKey) {
      return NextResponse.json({ error: 'VAPID keys not configured' }, { status: 500 });
    }

    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:admin@nexarismodule.online',
      vapidPublicKey,
      vapidPrivateKey
    );

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Fetch all users with active push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('user_push_subscriptions')
      .select('user_id, subscription');

    if (subError || !subscriptions) {
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    const now = new Date();
    const results = [];

    // 3. For each user, check their tasks in user_data
    for (const subEntry of subscriptions) {
      const { user_id, subscription } = subEntry;
      
      const { data: userData, error: dataError } = await supabase
        .from('user_data')
        .select('data')
        .eq('user_id', user_id)
        .single();

      if (dataError || !userData) continue;

      const tasks = userData.data?.tasks || [];
      const parsedSub = JSON.parse(subscription);

      for (const task of tasks) {
        // Only process incomplete tasks with notifications enabled and a due date
        if (task.completed || !task.notifications || !task.dueDate) continue;

        const dueDate = new Date(task.dueDate);
        
        // Logic: If the task is due within the next 2 minutes AND was not notified yet.
        // For simplicity in a stateless cron, we check if it's due in the current minute window.
        const diffMs = dueDate.getTime() - now.getTime();
        const diffMins = diffMs / (1000 * 60);

        // If due in the next 1 minute or just became due (within last 1 min)
        if (diffMins > -1 && diffMins <= 1) {
          try {
            await webpush.sendNotification(parsedSub, JSON.stringify({
              title: `‼️ Task Due: ${task.name}`,
              body: task.description || 'The deadline has been reached.',
              url: '/tasks',
              icon: '/icon.png',
              badge: '/icon.png'
            }));
            results.push({ user_id, task: task.name, status: 'sent' });
          } catch (pushErr) {
            console.error(`Failed to send push to ${user_id}:`, pushErr);
          }
        }
      }
    }

    return NextResponse.json({ success: true, processed: results });
  } catch (err) {
    console.error('Cron check-tasks error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
