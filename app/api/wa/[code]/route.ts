import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nzsbyfxcefmlclagoyii.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_HN7YVIWVNC08pjgKnGzsLg_sMlUMKSK'
);

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const code = (params.code || '').replace(/[^a-z0-9]/g, '').slice(0, 12);
  if (!code) return NextResponse.redirect(new URL('/v2', req.url), 302);

  const { data } = await supabase.rpc('get_invite', { p_code: code });
  const band = data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
  const bandName = band?.band ? String(band.band) : 'nossa banda';
  const leader = band?.leader_first ? String(band.leader_first) : 'o líder';

  await supabase.from('funnel_events').insert({
    ref: code,
    event: 'whatsapp_click',
    step: band?.project_id ? String(band.project_id) : '',
    ip: (req.headers.get('x-forwarded-for') || '').split(',')[0].trim(),
    user_agent: (req.headers.get('user-agent') || '').slice(0, 200),
  });

  const origin = req.nextUrl.origin;
  const link = `${origin}/v2?b=${code}`;
  const msg = `Convite do Concurso Cancao Profana! ${leader} inscreveu ${bandName} e voce foi escalado como integrante. Confirme sua participacao aqui: ${link}`;
  return NextResponse.redirect(`https://wa.me/?text=${encodeURIComponent(msg)}`, 302);
}
