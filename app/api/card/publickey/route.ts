import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, clientIp } from '@/lib/ratelimit';

// Entrega a PUBLIC KEY do Mercado Pago para o checkout de cartao.
// Chave publica e publica por natureza (fica no JS do navegador por design do MP).
// Nao expoe access_token nem webhook_secret. Service key para ler a tabela protegida.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nzsbyfxcefmlclagoyii.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = SERVICE_KEY ? createClient(SUPABASE_URL, SERVICE_KEY) : null;

export async function GET(req: NextRequest) {
  if (!rateLimit(`pubkey:${clientIp(req)}`, 20, 60000)) {
    return NextResponse.json({ ok: false, error: 'muitas_tentativas' }, { status: 429 });
  }
  if (!supabase) return NextResponse.json({ ok: false, publicKey: null }, { status: 503 });
  try {
    const { data } = await supabase.from('gateway_keys').select('public_key').eq('id', 1).maybeSingle();
    const pk = data?.public_key ? String(data.public_key) : null;
    return NextResponse.json({ ok: true, publicKey: pk });
  } catch {
    return NextResponse.json({ ok: false, publicKey: null }, { status: 500 });
  }
}
