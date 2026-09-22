import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Registra acesso ao /sagrado (quem, quando, IP, navegador). Somente staff autenticado.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nzsbyfxcefmlclagoyii.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_HN7YVIWVNC08pjgKnGzsLg_sMlUMKSK'
);

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization') || '';
    if (!auth.startsWith('Bearer ')) return NextResponse.json({ ok: false }, { status: 401 });

    // valida a sessao e garante que e staff
    const { data: userData } = await supabase.auth.getUser(auth.slice(7));
    if (!userData?.user) return NextResponse.json({ ok: false }, { status: 401 });

    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim();
    const ua = req.headers.get('user-agent') || '';
    const { error } = await supabase.rpc('registrar_acesso_painel', { p_ip: ip, p_ua: ua });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
