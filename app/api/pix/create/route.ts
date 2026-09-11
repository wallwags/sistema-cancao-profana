import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, clientIp } from '@/lib/ratelimit';

// Server-only: acessa as chaves do gateway e grava a intent de pagamento.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nzsbyfxcefmlclagoyii.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = SERVICE_KEY ? createClient(SUPABASE_URL, SERVICE_KEY) : null;

export async function POST(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'gateway_off' }, { status: 503 });
  }
  if (!rateLimit(`pixcreate:${clientIp(req)}`, 10, 60000)) {
    return NextResponse.json({ ok: false, error: 'muitas_tentativas' }, { status: 429 });
  }
  try {
    const body = await req.json();
    const code = String(body.code || '').replace(/[^a-z0-9]/g, '').slice(0, 12);
    const email = String(body.email || '').slice(0, 120);
    const name = String(body.name || '').slice(0, 80);
    if (!code || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: 'dados_invalidos' }, { status: 400 });
    }

    // Chaves do gateway (somente server-side)
    const { data: gdata } = await supabase.from('gateway_keys').select('provider, access_token').eq('id', 1).maybeSingle();
    const token = gdata?.access_token;
    if (!token) {
      return NextResponse.json({ ok: false, error: 'gateway_nao_configurado' }, { status: 400 });
    }

    // Projeto + preco travado
    const { data: project } = await supabase
      .from('projects')
      .select('id, name, entry_price, batch_id')
      .eq('invite_code', code)
      .maybeSingle();
    if (!project) {
      return NextResponse.json({ ok: false, error: 'codigo_invalido' }, { status: 404 });
    }

    const amount = Number(project.entry_price);
    const idempotencyKey = `${code}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        transaction_amount: Math.round(amount * 100) / 100,
        description: `Cancao Profana - ${String(project.name).slice(0, 60)}`,
        payment_method_id: 'pix',
        external_reference: `${code}:L`,
        payer: { email, first_name: name.slice(0, 60) || 'Candidato' },
      }),
    });

    const mp = await mpRes.json().catch(() => null);
    if (!mpRes.ok || !mp?.id || mp?.status === 'rejected') {
      return NextResponse.json({ ok: false, error: 'mp_erro', detail: String(mp?.status_detail || mpRes.status) }, { status: 502 });
    }

    const qr = mp?.point_of_interaction?.transaction_data?.qr_code || null;
    const qrBase64 = mp?.point_of_interaction?.transaction_data?.qr_code_base64 || null;

    // Intent de pagamento (trilha para conciliacao)
    await supabase.from('subscriptions').insert({
      project_id: project.id,
      batch_id: project.batch_id,
      amount_paid: amount,
      status: 'pending',
      charge_id: String(mp.id),
    });

    return NextResponse.json({
      ok: true,
      paymentId: String(mp.id),
      qr,
      qrBase64,
      amount,
      expiresAt: mp?.date_of_expiration || null,
    });
  } catch {
    return NextResponse.json({ ok: false, error: 'erro_interno' }, { status: 500 });
  }
}
