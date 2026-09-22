import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, clientIp } from '@/lib/ratelimit';

// Entrega a PUBLIC KEY do Mercado Pago para o checkout de cartao.
// Chave publica e publica por natureza (fica no JS do navegador por design do MP).
// Nao expoe access_token nem webhook_secret.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nzsbyfxcefmlclagoyii.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_HN7YVIWVNC08pjgKnGzsLg_sMlUMKSK'
);

export async function GET(req: NextRequest) {
  if (!rateLimit(`pubkey:${clientIp(req)}`, 20, 60000)) {
    return NextResponse.json({ ok: false, error: 'muitas_tentativas' }, { status: 429 });
  }
  try {
    const { data } = await supabase.from('gateway_keys').select('public_key').eq('id', 1).maybeSingle();
    const pk = data?.public_key ? String(data.public_key) : null;
    return NextResponse.json({ ok: true, publicKey: pk });
  } catch {
    return NextResponse.json({ ok: false, publicKey: null }, { status: 500 });
  }
}
