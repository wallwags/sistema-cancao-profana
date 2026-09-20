import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, clientIp } from '@/lib/ratelimit';

// Cadastro de lead VIP com anti-spam: rate-limit na rota (por instancia) E no banco
// (rl_check global na RPC registrar_lead_vip). Insercao direta do public na tabela esta revogada.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nzsbyfxcefmlclagoyii.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_HN7YVIWVNC08pjgKnGzsLg_sMlUMKSK'
);

export async function POST(req: NextRequest) {
  if (!rateLimit(`viplead:${clientIp(req)}`, 5, 60000)) {
    return NextResponse.json({ ok: false, error: 'muitas_tentativas' }, { status: 429 });
  }
  try {
    const body = await req.json().catch(() => null);
    const email = String(body?.email || '').trim().toLowerCase().slice(0, 140);
    const name = String(body?.name || '').trim().slice(0, 80);
    const source = String(body?.source || 'site').replace(/[^a-z0-9_-]/gi, '').slice(0, 40);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: 'email_invalido' }, { status: 400 });
    }
    const { data, error } = await supabase.rpc('registrar_lead_vip', {
      p_name: name, p_email: email, p_source: source, p_ip: clientIp(req),
    });
    if (error) {
      if (/EMAIL_INVALIDO/i.test(error.message)) {
        return NextResponse.json({ ok: false, error: 'email_invalido' }, { status: 400 });
      }
      return NextResponse.json({ ok: false, error: 'erro_registro' }, { status: 500 });
    }
    // E-mail ja cadastrado NAO e erro: a pessoa ja esta na lista
    const r = (typeof data === 'object' && data ? data : {}) as { duplicado?: boolean };
    return NextResponse.json({ ok: true, duplicado: !!r.duplicado });
  } catch {
    return NextResponse.json({ ok: false, error: 'erro_interno' }, { status: 500 });
  }
}
