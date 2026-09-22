import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, clientIp } from '@/lib/ratelimit';

// Pagamento com CARTAO (Checkout Transparente MP): recebe o TOKEN do cartao
// gerado pelo SDK oficial no navegador (o numero do cartao NUNCA passa por aqui),
// cria o pagamento no MP com a referencia code:M{id} e responde sincronamente
// (aprovado/recusado). O webhook existente continua funcionando como segunda rede.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nzsbyfxcefmlclagoyii.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = SERVICE_KEY ? createClient(SUPABASE_URL, SERVICE_KEY) : null;

export async function POST(req: NextRequest) {
  if (!supabase) return NextResponse.json({ ok: false, error: 'gateway_off' }, { status: 503 });
  if (!rateLimit(`cardcreate:${clientIp(req)}`, 8, 60000)) {
    return NextResponse.json({ ok: false, error: 'muitas_tentativas' }, { status: 429 });
  }
  try {
    const body = await req.json().catch(() => null);
    const code = String(body?.code || '').replace(/[^a-z0-9]/g, '').slice(0, 12);
    const token = String(body?.cardToken || '').slice(0, 200);
    const memberId = String(body?.memberId || '').replace(/[^a-f0-9-]/gi, '').slice(0, 40);
    const payerName = String(body?.payerName || '').slice(0, 80);
    const payerCpf = String(body?.payerCpf || '').replace(/\D/g, '').slice(0, 11);
    const payerEmail = String(body?.payerEmail || '').slice(0, 120);
    const installments = Math.min(Math.max(parseInt(String(body?.installments || '1'), 10) || 1, 1), 12);
    if (!code || !token || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(payerEmail) || payerCpf.length !== 11) {
      return NextResponse.json({ ok: false, error: 'dados_invalidos' }, { status: 400 });
    }

    const { data: gdata } = await supabase.from('gateway_keys').select('access_token').eq('id', 1).maybeSingle();
    const mpToken = gdata?.access_token;
    if (!mpToken) return NextResponse.json({ ok: false, error: 'gateway_nao_configurado' }, { status: 400 });

    const { data: project } = await supabase
      .from('projects')
      .select('id, name, entry_price, total_members, status, batch_id')
      .eq('invite_code', code)
      .maybeSingle();
    if (!project) return NextResponse.json({ ok: false, error: 'codigo_invalido' }, { status: 404 });

    const { data: modeData } = await supabase.from('site_settings').select('value').eq('key', 'payment_mode').maybeSingle();
    const liderMode = String(modeData?.value ?? '') === 'lider';
    let amount: number;
    let externalRef: string;
    let memberOk: { id: string; payment_status: string | null } | null = null;

    if (memberId) {
      if (liderMode) return NextResponse.json({ ok: false, error: 'coberto_pelo_lider' }, { status: 400 });
      const { data: mm } = await supabase
        .from('members')
        .select('id, payment_status')
        .eq('id', memberId).eq('project_id', project.id).eq('is_responsible', false)
        .maybeSingle();
      if (!mm) return NextResponse.json({ ok: false, error: 'vaga_invalida' }, { status: 404 });
      memberOk = mm as { id: string; payment_status: string | null };
      if (memberOk.payment_status === 'paid') return NextResponse.json({ ok: true, alreadyPaid: true });
      amount = Number(project.entry_price);
      externalRef = `${code}:M${memberOk.id}`;
    } else {
      if (liderMode) {
        if (project.status === 'paid') return NextResponse.json({ ok: true, alreadyPaid: true });
        amount = Number(project.entry_price) * Math.max(Number(project.total_members) || 1, 1);
      } else {
        amount = Number(project.entry_price);
      }
      externalRef = `${code}:L`;
    }

    const idempotencyKey = `${code}-${memberId ? memberOk!.id : 'L'}-card-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${mpToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        transaction_amount: Math.round(amount * 100) / 100,
        token,
        description: `Cancao Profana - ${String(project.name).slice(0, 60)}`,
        installments,
        payment_method_id: 'master',
        external_reference: externalRef,
        payer: { email: payerEmail, first_name: payerName.slice(0, 60) || 'Candidato', identification: { type: 'CPF', number: payerCpf } },
      }),
    });
    const mp = await mpRes.json().catch(() => null);
    if (!mpRes.ok || !mp?.id) {
      return NextResponse.json({ ok: false, error: 'mp_erro', detail: String(mp?.message || mpRes.status).slice(0, 140) }, { status: 502 });
    }

    // trilha
    await supabase.from('subscriptions').insert({
      project_id: project.id,
      batch_id: project.batch_id,
      amount_paid: amount,
      status: mp.status === 'approved' ? 'paid' : 'pending',
      charge_id: String(mp.id),
      ...(mp.status === 'approved' ? { paid_at: new Date().toISOString() } : {}),
    });

    const status = String(mp.status || '');
    const detailCode = String(mp.status_detail || '');

    // Aprovado: confirma na hora (sincrono)
    if (status === 'approved') {
      if (memberOk) {
        await supabase.rpc('confirm_member_payment', { p_code: code, p_member_id: memberOk.id });
      } else {
        await supabase.rpc('confirm_leader_payment', { p_code: code });
      }
      return NextResponse.json({ ok: true, status: 'approved' });
    }

    // Pendente (raro em cartao) ou recusado
    return NextResponse.json({ ok: true, status, statusDetail: detailCode, paymentId: String(mp.id) });
  } catch {
    return NextResponse.json({ ok: false, error: 'erro_interno' }, { status: 500 });
  }
}
