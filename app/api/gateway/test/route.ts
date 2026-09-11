import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, clientIp } from '@/lib/ratelimit';

// Teste de conexao com o gateway: valida o token direto na API do Mercado Pago.
// Usado pelo botao "Testar conexao" do painel (aba Pagamentos).
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nzsbyfxcefmlclagoyii.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = SERVICE_KEY ? createClient(SUPABASE_URL, SERVICE_KEY) : null;

export async function GET(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'env_ausente', msg: 'Configure SUPABASE_SERVICE_ROLE_KEY na Vercel e faca redeploy.' }, { status: 503 });
  }
  if (!rateLimit(`gwtest:${clientIp(req)}`, 6, 60000)) {
    return NextResponse.json({ ok: false, error: 'muitas_tentativas' }, { status: 429 });
  }
  try {
    const { data: gdata } = await supabase.from('gateway_keys').select('access_token').eq('id', 1).maybeSingle();
    const token = gdata?.access_token;
    if (!token) {
      return NextResponse.json({ ok: false, error: 'sem_chave', msg: 'Nenhuma chave salva. Cole o Access Token e salve primeiro.' }, { status: 400 });
    }

    const mpRes = await fetch('https://api.mercadopago.com/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const mp = await mpRes.json().catch(() => null);
    if (!mpRes.ok) {
      return NextResponse.json({
        ok: false,
        error: 'token_invalido',
        msg: 'O Mercado Pago rejeitou esta chave. Gere um Access Token de PRODUCAO novo e salve novamente.',
      }, { status: 200 });
    }
    return NextResponse.json({
      ok: true,
      nickname: mp?.nickname || '',
      firstName: mp?.first_name || '',
      country: mp?.country_id || '',
    });
  } catch {
    return NextResponse.json({ ok: false, error: 'erro_interno' }, { status: 500 });
  }
}
