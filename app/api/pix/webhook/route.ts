import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHmac, timingSafeEqual } from 'crypto';

// Webhook do Mercado Pago: notificacao de pagamento.
// Confia verificando o pagamento DIRETO na API do MP (nunca no corpo da notificacao).
// Idempotente: as RPCs de confirmacao e o update da trilha podem rodar varias vezes.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nzsbyfxcefmlclagoyii.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = SERVICE_KEY ? createClient(SUPABASE_URL, SERVICE_KEY) : null;

async function verifyAndConfirm(paymentId: string): Promise<void> {
  if (!supabase) return;
  const { data: gdata } = await supabase.from('gateway_keys').select('access_token').eq('id', 1).maybeSingle();
  const token = gdata?.access_token;
  if (!token) return;

  const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const mp = await mpRes.json().catch(() => null);
  if (!mpRes.ok || !mp?.id) return;

  if (String(mp.status || '') === 'approved') {
    const ref = String(mp.external_reference || '');
    const [code, who] = ref.split(':');
    try {
      if (code && who === 'L') {
        await supabase.rpc('confirm_leader_payment', { p_code: code });
      } else if (code && who && who !== 'L') {
        await supabase.rpc('confirm_member_payment', { p_code: code, p_member_id: who });
      }
      await supabase
        .from('subscriptions')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('charge_id', String(mp.id));
    } catch {
      // RPCs idempotentes; falha transitoria sera coberta pelo poll do front ou retry do MP
    }
  }
}

// Validacao da assinatura x-signature do MP (HMAC SHA256 com o Webhook Secret do painel).
// Secret nao configurado => comporta-se como antes (o pagamento ainda e conferido na API do MP).
// Assinatura presente e INVALIDA => rejeita (401), nao processa nada.
function assinaturaValida(paymentId: string, sigHeader: string, requestId: string, secret: string): boolean {
  try {
    const partes = Object.fromEntries(sigHeader.split(',').map(p => p.trim().split('=').map(s2 => s2.trim())));
    const ts = partes['ts'];
    const v1 = partes['v1'];
    if (!ts || !v1) return false;
    const manifestado = `id:${paymentId};request-id:${requestId};ts:${ts};`;
    const calc = createHmac('sha256', secret).update(manifestado).digest('hex');
    const a = Buffer.from(calc, 'hex');
    const b = Buffer.from(v1.toLowerCase(), 'hex');
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!supabase) return NextResponse.json({ ok: true, ignored: true });
  try {
    const body = await req.json().catch(() => null);
    const type = String(body?.type || body?.topic || '');
    const paymentId = String(body?.data?.id || '');
    if ((type === 'payment' || type === 'topic_payment') && /^[0-9]+$/.test(paymentId)) {
      const { data: gsec } = await supabase.from('gateway_keys').select('webhook_secret').eq('id', 1).maybeSingle();
      const secret = String((gsec as { webhook_secret?: string } | null)?.webhook_secret || '');
      const sigHeader = req.headers.get('x-signature') || '';
      const requestId = req.headers.get('x-request-id') || '';
      if (secret && sigHeader && !assinaturaValida(paymentId, sigHeader, requestId, secret)) {
        return NextResponse.json({ ok: false, error: 'assinatura_invalida' }, { status: 401 });
      }
      await verifyAndConfirm(paymentId);
    }
    // Sempre 200: evita retry agressivo do MP em erros de parse
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
