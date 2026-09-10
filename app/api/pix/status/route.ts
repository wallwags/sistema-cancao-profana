import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Verificacao server-side: consulta o pagamento no Mercado Pago e, se aprovado,
// confirma via RPC idempotente e atualiza a trilha de conciliacao.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nzsbyfxcefmlclagoyii.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = SERVICE_KEY ? createClient(SUPABASE_URL, SERVICE_KEY) : null;

export async function GET(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ ok: false, paid: false, error: 'gateway_off' }, { status: 503 });
  }
  try {
    const id = (req.nextUrl.searchParams.get('id') || '').replace(/[^0-9]/g, '').slice(0, 20);
    if (!id) return NextResponse.json({ ok: false, paid: false, error: 'id_invalido' }, { status: 400 });

    const { data: gdata } = await supabase.from('gateway_keys').select('access_token').eq('id', 1).maybeSingle();
    const token = gdata?.access_token;
    if (!token) return NextResponse.json({ ok: false, paid: false, error: 'gateway_nao_configurado' }, { status: 400 });

    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const mp = await mpRes.json().catch(() => null);
    if (!mpRes.ok || !mp?.id) {
      return NextResponse.json({ ok: false, paid: false, error: 'mp_erro' }, { status: 502 });
    }

    const status = String(mp.status || 'pending');
    if (status !== 'approved') {
      return NextResponse.json({ ok: true, paid: false, status });
    }

    // Aprovado: confirma via RPC (idempotente) usando a referencia code:quem
    const ref = String(mp.external_reference || '');
    const [code, who] = ref.split(':');
    if (code && who === 'L') {
      await supabase.rpc('confirm_leader_payment', { p_code: code });
    }
    // Pagamento de integrante sera confirmado pelo webhook (ref traz o member id)

    await supabase
      .from('subscriptions')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('charge_id', String(mp.id));

    return NextResponse.json({ ok: true, paid: true, status });
  } catch {
    return NextResponse.json({ ok: false, paid: false, error: 'erro_interno' }, { status: 500 });
  }
}
