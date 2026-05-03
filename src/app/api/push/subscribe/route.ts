import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscription, userId } = body;

    if (!subscription || !userId) {
      return NextResponse.json({ error: 'Missing subscription or userId' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Upsert — one row per user, always overwrite with latest subscription
    const { error } = await supabase
      .from('user_push_subscriptions')
      .upsert(
        {
          user_id: userId,
          subscription: JSON.stringify(subscription),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (error) {
      console.error('Supabase upsert error:', error);
      // Non-fatal — still return OK so the client doesn't break
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Subscribe endpoint error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
