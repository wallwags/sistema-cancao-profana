import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nzsbyfxcefmlclagoyii.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_HN7YVIWVNC08pjgKnGzsLg_sMlUMKSK'
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ref = String(body.ref || '').slice(0, 40);
    const event = String(body.event || '').slice(0, 40).replace(/[^a-z_]/g, '');
    const step = String(body.step || '').slice(0, 40);
    const isTest = body.is_test === true;
    if (!event) return NextResponse.json({ ok: false }, { status: 400 });

    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim();
    const ua = req.headers.get('user-agent') || '';

    await supabase.rpc('log_funnel_event', { p_ref: ref, p_event: event, p_step: step, p_is_test: isTest, p_ip: ip });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
