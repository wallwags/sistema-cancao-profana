'use client';

// Popup do convite de integrante: mesma identidade visual e fluxo do quiz de inscricao,
// enxuto (quem escalou ja definiu banda e roster): confirmar -> escolher nome -> CPF -> resumo -> Pix real.
import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { X, Check, Users, Loader2, Copy, MessageCircle } from 'lucide-react';
import { applyCpfMask, applyPhoneMask, isValidCPF, isValidWhatsApp } from '../../lib/validators';

interface Slot {
  id: string;
  name: string;
  role: string;
  claimed: boolean;
}

interface InviteData {
  project_id: string;
  band: string;
  style: string;
  bio: string;
  photo_url: string | null;
  instagram: string | null;
  video_link: string | null;
  leader_first: string;
  entry_price: number;
  min_payable: number;
  total_members: number;
  band_status: string;
  slots: Slot[];
}

export default function InviteSheet({ inviteCode, startPhase = 'confirm', onClose, suporteWa }: { inviteCode: string; startPhase?: 'confirm' | 'pick'; onClose: () => void; suporteWa?: string | null }) {
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const dragStartY = useRef<number | null>(null);

  const [phase, setPhase] = useState<'loading' | 'confirm' | 'whats' | 'pick' | 'cpf' | 'summary' | 'pix' | 'done'>('loading');
  const [paymentMode, setPaymentMode] = useState<'individual' | 'lider'>('individual');
  const [data, setData] = useState<InviteData | null>(null);
  const [slotId, setSlotId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [whats, setWhats] = useState('');
  const [pix, setPix] = useState<{ paymentId: string; qr: string | null; qrBase64: string | null; amount: number } | null>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [polling, setPolling] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [result, setResult] = useState<{ pago: number; total: number; ativa: boolean } | null>(null);

  const totalTelas = 4; // confirmar, nome, cpf, resumo
  const faseTela: Record<string, number> = { confirm: 1, pick: 2, cpf: 3, summary: 4, pix: 4, done: 4 };
  const pct = Math.min(100, Math.round(4 + Math.pow(Math.max(faseTela[phase] ?? 1, 1) / totalTelas, 0.6) * 96));

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(cardRef.current,
        { scale: 0.95, y: 30, opacity: 0 },
        { scale: 1, y: 0, opacity: 1, duration: 0.3, ease: 'power2.out', clearProps: 'transform' });
    }
  }, [phase === 'loading' && data === null]);

  const slideDownClose = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (!cardRef.current) { onClose(); return; }
    gsap.to(cardRef.current, { scale: 0.95, y: 30, opacity: 0, duration: 0.25, ease: 'power2.in', onComplete: onClose });
  };

  const onTouchStart = (e: React.TouchEvent) => { dragStartY.current = e.touches[0].clientY; };
  const onTouchMove = (e: React.TouchEvent) => {
    if (dragStartY.current === null || !sheetRef.current) return;
    const dy = e.touches[0].clientY - dragStartY.current;
    if (dy > 0) sheetRef.current.style.transform = `translateY(${dy}px)`;
  };
  const onTouchEnd = () => {
    if (dragStartY.current === null || !sheetRef.current) return;
    const dy = sheetRef.current.getBoundingClientRect().top;
    sheetRef.current.style.transform = '';
    if (dy > 130) slideDownClose();
    dragStartY.current = null;
  };

  useEffect(() => {
    supabase.from('site_settings').select('key,value').eq('key', 'payment_mode').maybeSingle()
      .then(({ data: pm }) => setPaymentMode(pm && String(pm.value) === 'lider' ? 'lider' : 'individual'), () => setPaymentMode('individual'));

    (async () => {
      const { data: inv, error } = await supabase.rpc('get_invite', { p_code: inviteCode });
      if (error || !inv) { setError('Convite não encontrado ou inválido.'); setData(null); return; }
      setData(inv as unknown as InviteData);
      setPhase(startPhase === 'pick' ? 'pick' : 'confirm');
      fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ref: inviteCode, event: 'invite_opened' }) }).catch(() => {});
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteCode]);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const selectedSlot = data?.slots.find(s => s.id === slotId) || null;
  const price = data?.entry_price ?? 0;

  const goConfirm = () => {
    fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ref: inviteCode, event: 'invite_confirmed' }) }).catch(() => {});
    setPhase('pick');
  };

  const goPick = (slot: Slot) => {
    setSlotId(slot.id);
    setName(slot.name || '');
    setPhase('cpf');
  };

  const avancarDaEtapaWhats = () => {
    setError('');
    if (!isValidWhatsApp(whats)) { setError('Informe um WhatsApp válido com DDD.'); return; }
    setPhase('pick');
  };

  const concluir = async () => {
    setError('');
    if (!isValidWhatsApp(whats)) { setError('Informe um WhatsApp válido com DDD.'); return; }
    if (!isValidCPF(cpf)) { setError('CPF inválido. Confira os dígitos.'); return; }
    setBusy(true);
    const { error: err } = await supabase.rpc('claim_member_slot', {
      p_code: inviteCode, p_member_id: slotId,
      p_name: name.trim(), p_cpf: cpf, p_birth: '', p_phone: whats, p_email: ''
    });
    setBusy(false);
    if (err) {
      const m = err.message || '';
      setError(
        m.includes('VAGA_JA_RECLAMADA') ? 'Essa vaga acabou de ser confirmada por outra pessoa. Escolha outra ou fale com o líder.' :
        m.includes('CPF_INVALIDO') ? 'CPF inválido.' :
        m.includes('MUITAS_TENTATIVAS') ? 'Muitas tentativas. Aguarde alguns minutos e tente de novo.' :
        'Não foi possível confirmar agora. Tente novamente.'
      );
      return;
    }
    setPhase('summary');
  };

  const startPix = async () => {
    setError('');
    setPhase('pix');
    setBusy(true);
    try {
      const res = await fetch('/api/pix/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inviteCode, memberId: slotId, email: '', name: name.trim() })
      });
      const d = await res.json().catch(() => null);
      setBusy(false);
      if (d?.ok && d?.alreadyPaid) { await finalizar(); return; }
      if (!res.ok || !d?.ok || !d?.paymentId) {
        setError('Não foi possível gerar o Pix agora. Feche e reabra o convite em instantes.');
        return;
      }
      setPix({ paymentId: String(d.paymentId), qr: d.qr || null, qrBase64: d.qrBase64 || null, amount: Number(d.amount) || price });
      setPolling(true);
      pollRef.current = setInterval(async () => {
        try {
          const sres = await fetch(`/api/pix/status?id=${d.paymentId}`);
          const sd = await sres.json().catch(() => null);
          if (sd?.paid) {
            if (pollRef.current) clearInterval(pollRef.current);
            setPolling(false);
            await finalizar();
          }
        } catch { /* tenta no proximo tick */ }
      }, 5000);
    } catch {
      setBusy(false);
      setError('Falha de conexão com o gateway. Tente novamente.');
    }
  };

  const finalizar = async () => {
    const { data: res } = await supabase.rpc('confirm_member_payment', { p_code: inviteCode, p_member_id: slotId }).then(
      (r) => r, () => ({ data: null, error: null })
    );
    setResult({
      pago: Number(res?.pago ?? 1),
      total: Number(res?.total ?? data?.total_members ?? selectedSlotCount + 1),
      ativa: Boolean(res?.banda_ativa),
    });
    setPhase('done');
  };

  const selectedSlotCount = (data?.slots.length ?? 0) + 1;

  const fieldCls = (erro?: string) => `w-full bg-[#2F3A54] border rounded-xl px-4 py-3.5 text-white text-base outline-none placeholder-gray-300/70 transition-colors ${erro ? 'border-red-500/60' : 'border-white/30 focus:border-[#E3B552]'}`;

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/30 backdrop-blur-sm px-4 py-8 sm:p-6 flex justify-center items-start" onClick={phase === 'done' ? slideDownClose : undefined}>
      <div className="absolute inset-0 cursor-pointer" onClick={phase === 'done' ? slideDownClose : undefined} />

      <div
        ref={cardRef}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="bg-[#242D42] border-2 border-[#E3B552] w-full max-w-xl rounded-[32px] p-6 pb-16 md:p-8 md:pb-16 my-auto relative space-y-6 shadow-[0_10px_50px_rgba(0,0,0,0.8)] z-10"
      >
        <button onClick={slideDownClose} className="absolute right-5 top-5 text-[#B3B3B3] hover:text-white font-mono text-2xl font-bold">&times;</button>

        {/* PROGRESSO */}
        {phase !== 'loading' && phase !== 'done' && (
          <div className="space-y-2">
            <div className="flex justify-end items-baseline">
              <span className="font-mono text-sm md:text-base text-[#F0C265] font-black">{pct}%</span>
            </div>
            <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#FFF2D4] via-[#F0C265] to-[#B88A28] transition-all duration-300" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        {/* CARREGANDO / ERRO */}
        {phase === 'loading' && (
          <div className="py-12 text-center space-y-3">
            {error ? (
              <>
                <p className="text-sm text-red-300 font-mono">{error}</p>
                <Link href="/" className="text-[11px] text-gray-300 underline uppercase tracking-widest">Voltar ao site</Link>
              </>
            ) : (
              <>
                <Loader2 className="w-7 h-7 text-[#F0C265] animate-spin mx-auto" />
                <p className="font-mono text-[11px] text-gray-200 uppercase tracking-widest">Abrindo convite...</p>
              </>
            )}
          </div>
        )}

        {/* 1. CONFIRMA */}
        {data && phase === 'confirm' && (
          <div className="space-y-4 text-center">
            <span className="inline-block bg-[#F0C265]/15 text-[#F0C265] border border-[#F0C265]/30 font-mono text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Convite de banda</span>
            <h2 className="font-display font-black text-2xl text-white uppercase leading-tight">
              Você faz parte da <span className="text-[#F0C265]">{data.band}</span>?
            </h2>
            <p className="text-base text-gray-100">{data.style || 'não informado'} • escalado por {data.leader_first}</p>
            <div className="flex flex-col gap-2.5 pt-1">
              <button onClick={goConfirm} className="w-full flex items-center justify-center font-mono font-black text-sm sm:text-base text-black bg-lime px-7 py-4 rounded-2xl border-none tracking-wide shadow-[0_0_30px_rgba(163,230,53,0.35)] active:scale-[0.98] transition-transform uppercase">Sim, sou integrante</button>
              <button onClick={slideDownClose} className="font-mono text-xs font-bold text-gray-300 border border-white/25 py-3 rounded-full hover:bg-white/10 transition-colors uppercase">Não fui eu</button>
            </div>
          </div>
        )}

        {/* 2. ESCOLHE O NOME (com funcao definida pelo lider) */}
        {data && phase === 'whats' && (
          <div className="space-y-4">
            <h3 className="font-display font-black text-2xl text-white uppercase tracking-tight">Seu WhatsApp</h3>
            <p className="text-base text-gray-100 leading-relaxed">Você foi escalado pelo líder <strong className="text-[#F0C265]">{data.leader_first}</strong> na banda <strong className="text-[#F0C265]">{data.band}</strong>. Primeiro, seu contato direto.</p>
            <div className="space-y-1 pt-1">
              <label className="block font-mono text-sm text-[#F0C265] font-bold uppercase">WhatsApp <span className="text-red-400">*</span></label>
              <input type="tel" inputMode="numeric" enterKeyHint="next" value={whats} onChange={(e) => { setWhats(applyPhoneMask(e.target.value)); setError(''); }} placeholder="(21) 90000-0000" autoComplete="tel" className={fieldCls(error && !isValidWhatsApp(whats) ? error : '')} />
            </div>
            {error && <p className="text-xs text-red-300 font-mono">{error}</p>}
            <div className="flex gap-2.5 pt-2">
              <button type="button" onClick={slideDownClose} className="font-mono text-xs font-bold text-gray-200 border border-white/25 bg-white/10 px-5 py-4 rounded-2xl uppercase">Voltar</button>
              <button type="button" onClick={avancarDaEtapaWhats} className="flex-1 font-mono font-black text-sm sm:text-base text-black bg-lime px-7 py-4 rounded-2xl uppercase tracking-wide active:scale-[0.98] transition-transform">Continuar</button>
            </div>
          </div>
        )}

        {data && phase === 'pick' && (
          <div className="space-y-4">
            <h3 className="font-display font-black text-2xl text-white uppercase tracking-tight">Quem é você?</h3>
            <p className="text-base text-gray-100 leading-relaxed">Agora toque no seu nome na lista:</p>
            <div className="space-y-2.5 pt-1">
              {data.slots.map(sl => (
                <button
                  key={sl.id}
                  type="button"
                  disabled={sl.claimed}
                  onClick={() => goPick(sl)}
                  className={`w-full text-left flex justify-between items-center px-4 py-3.5 rounded-2xl border transition-colors ${
                    sl.claimed ? 'border-white/15 bg-white/[0.04] opacity-50 cursor-not-allowed' : 'border-white/30 hover:border-[#F0C265]/60 bg-[#2F3A54]'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="text-sm font-bold text-white block truncate">{sl.name || 'Integrante'}</span>
                    {sl.role && <span className="font-mono text-[11px] text-gray-200 uppercase tracking-wider block">{sl.role}</span>}
                  </span>
                  {sl.claimed
                    ? <span className="flex items-center gap-1 font-mono text-[11px] text-[#10B981] uppercase font-bold shrink-0"><Check className="w-3.5 h-3.5" /> confirmado</span>
                    : <span className="font-mono text-[11px] text-[#F0C265] uppercase font-bold shrink-0">Sou eu ›</span>}
                </button>
              ))}
              {data.slots.length === 0 && <p className="text-sm text-gray-200 font-mono">Nenhuma vaga pendente nesta banda.</p>}
            </div>
          </div>
        )}

        {/* 3. CPF */}
        {data && phase === 'cpf' && (
          <div className="space-y-4">
            <h3 className="font-display font-black text-2xl text-white uppercase tracking-tight">Seu CPF</h3>
            <p className="text-base text-gray-100 leading-relaxed">Confirma sua vaga e recupera seu acesso a qualquer momento.</p>
            <div className="space-y-1 pt-1">
              <label className="block font-mono text-sm text-[#F0C265] font-bold uppercase">CPF <span className="text-red-400">*</span></label>
              <input type="text" inputMode="numeric" enterKeyHint="next" value={cpf} onChange={(e) => { setCpf(applyCpfMask(e.target.value)); setError(''); }} placeholder="000.000.000-00" autoComplete="off" className={fieldCls(error && !isValidCPF(cpf) ? error : '')} />
            </div>
            {error && <p className="text-xs text-red-300 font-mono">{error}</p>}
            <div className="flex gap-2.5 pt-2">
              <button type="button" onClick={() => { setPhase('pick'); setError(''); }} className="font-mono text-xs font-bold text-gray-200 border border-white/25 bg-white/10 px-5 py-4 rounded-2xl uppercase">Voltar</button>
              <button onClick={concluir} disabled={busy || cpf.length < 14} className="w-full flex items-center justify-center font-mono font-black text-sm sm:text-base text-black bg-lime px-7 py-4 rounded-2xl border-none tracking-wide shadow-[0_0_30px_rgba(163,230,53,0.35)] active:scale-[0.98] transition-transform uppercase disabled:opacity-50">
                {busy ? 'Confirmando...' : 'Continuar'}
              </button>
            </div>
          </div>
        )}

        {/* 4. RESUMO */}
        {data && phase === 'summary' && (
          <div className="space-y-4">
            <h3 className="font-display font-black text-2xl text-white uppercase tracking-tight">Revise e conclua</h3>

            <div className="bg-white/[0.08] border border-white/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-gray-200 uppercase tracking-widest font-bold">Você na banda</span>
                <span className="font-mono text-[10px] text-[#10B981] font-bold uppercase">{selectedSlot?.role || 'Integrante'}</span>
              </div>
              <p className="font-display font-black text-white text-lg leading-tight">{name}</p>
              <p className="font-mono text-xs text-gray-200">{whats} · {cpf}</p>
              <div className="border-t border-white/15 pt-3 font-mono text-xs text-gray-100 space-y-1">
                <p><span className="text-gray-300 uppercase text-[10px] tracking-widest block">Banda:</span> <strong className="text-white text-sm">{data.band}</strong> · liderada por {data.leader_first}</p>
                <p><span className="text-gray-300 uppercase text-[10px] tracking-widest block">Condição solidária:</span> {selectedSlotCount}kg de alimento na entrada do estúdio</p>
              </div>
              <button type="button" onClick={() => { setPhase('cpf'); setError(''); }} className="text-xs text-[#F0C265] underline uppercase font-bold">Editar CPF</button>
            </div>

            <div className="bg-[#F0C265]/10 border border-[#F0C265]/30 rounded-2xl p-4 text-center">
              <span className="font-mono text-[13px] text-gray-100 uppercase tracking-widest font-bold block">Sua parte</span>
              <span className="font-display font-black text-4xl text-[#F0C265] block leading-tight mt-0.5">R$ {price},00</span>
              <span className="text-sm text-gray-100 block mt-1.5">Pagamento único da sua parte pelo Pix.</span>
            </div>

            {error && <p className="text-xs text-red-300 font-mono">{error}</p>}

            {paymentMode === 'lider' ? (
              <div className="space-y-3">
                <div className="bg-[#10B981]/10 border border-[#10B981]/40 rounded-xl px-4 py-3">
                  <span className="text-xs text-[#10B981] font-bold uppercase tracking-wide block">Sua parte já está coberta</span>
                  <span className="text-xs text-gray-200 leading-snug block mt-1">O líder fez um único Pix que cobre a parte de todos. Você não paga nada.</span>
                </div>
                <button onClick={slideDownClose} className="w-full flex items-center justify-center font-mono font-black text-sm text-black bg-[#10B981] py-4 rounded-2xl uppercase tracking-widest">
                  Entendi
                </button>
              </div>
            ) : (
              <button onClick={startPix} disabled={busy} className="w-full flex items-center justify-center font-mono font-black text-sm sm:text-base text-black bg-lime px-7 py-4 rounded-2xl border-none tracking-wide shadow-[0_0_30px_rgba(163,230,53,0.35)] active:scale-[0.98] transition-transform uppercase disabled:opacity-50">
                Concluir inscrição
              </button>
            )}
          </div>
        )}

        {/* 5. PIX REAL */}
        {data && phase === 'pix' && (
          <div className="space-y-4 text-center">
            <h3 className="font-display font-black text-xl text-white uppercase tracking-tight">{"Pix Copia & Cola"}</h3>

            <div className="space-y-2.5">
              <button onClick={async () => {
                if (pix?.qr) { try { await navigator.clipboard.writeText(pix.qr); setPixCopied(true); setTimeout(() => setPixCopied(false), 2500); } catch { /* */ } }
              }} disabled={!pix?.qr} className="w-full flex items-center justify-center gap-2 font-display font-black text-sm uppercase tracking-widest text-black btn-gold-shimmer py-4 rounded-2xl active:scale-[0.98] transition-transform disabled:opacity-50">
                <Copy className="w-4 h-4" />
                {pixCopied ? 'Código copiado!' : 'Copiar código Pix'}
              </button>
              {suporteWa && (
                <a href={suporteWa} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 font-mono text-sm font-bold uppercase tracking-wide text-black bg-[#25D366] py-3.5 rounded-2xl active:scale-[0.98] transition-transform">
                  <MessageCircle className="w-4 h-4" /> Tenho dúvidas <span className="opacity-60">›</span>
                </a>
              )}
            </div>

            <div className="bg-[#10141D] p-4 rounded-xl flex flex-col items-center space-y-4 border border-white/25">
              <div className="w-48 h-48 bg-white p-3 rounded-xl flex items-center justify-center relative">
                {pix?.qrBase64 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`data:image/png;base64,${pix.qrBase64}`} alt="QR Code Pix" className="w-full h-full object-contain rounded-lg" />
                ) : busy || !pix ? (
                  <Loader2 className="w-8 h-8 text-[#F0C265] animate-spin" />
                ) : (
                  <span className="text-xs text-red-300 font-mono px-3 text-center">Não foi possível gerar o QR. Use o botão copiar acima.</span>
                )}
                {polling && (
                  <div className="absolute inset-0 bg-[#05070B]/90 rounded-xl flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-7 h-7 text-[#F0C265] animate-spin" />
                    <span className="font-mono text-[11px] text-[#F0C265] uppercase tracking-widest animate-pulse">Aguardando pagamento...</span>
                  </div>
                )}
              </div>
              <p className="font-display font-black text-2xl text-[#F0C265]">R$ {(pix?.amount ?? price).toFixed(0)},00</p>
            </div>

            {error && <p className="text-xs text-red-300 font-mono">{error}</p>}
          </div>
        )}

        {/* 6. PAGO */}
        {data && phase === 'done' && (
          <div className="space-y-4 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-[#10B981]/15 text-[#10B981] border-2 border-[#10B981] flex items-center justify-center"><Check className="w-7 h-7" /></div>
            <h3 className="font-display font-black text-xl text-white uppercase">Sua parte está paga!</h3>

            <div className="bg-white/[0.08] border border-white/30 rounded-2xl p-4 space-y-2.5 text-left">
              <div className="flex justify-between items-baseline">
                <span className="font-mono text-[10px] text-gray-200 uppercase tracking-widest font-bold">Partes confirmadas</span>
                <span className="font-mono text-xs font-black text-white"><strong className="text-[#10B981]">{result?.pago ?? 1}</strong>/{result?.total ?? data.total_members}</span>
              </div>
              <div className="h-2.5 bg-black/40 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#10B981] to-[#34D399] rounded-full transition-all" style={{ width: `${Math.min(100, Math.round(((result?.pago ?? 1) / (result?.total ?? data.total_members)) * 100))}%` }} />
              </div>
              <p className="text-sm text-gray-100 leading-relaxed pt-1">
                {(result?.total ?? data.total_members) - (result?.pago ?? 1) > 0 ? (
                  <>Agora envie o link para os outros integrantes pagarem as partes deles: <strong className="text-[#F0C265]">falta{((result?.total ?? data.total_members) - (result?.pago ?? 1)) === 1 ? '' : 'm'} {((result?.total ?? data.total_members) - (result?.pago ?? 1))}</strong>.</>
                ) : (
                  <span className="text-[#10B981] font-bold uppercase">Banda completa no concurso!</span>
                )}
              </p>
            </div>

            <Link href={`/minha-inscricao?k=${inviteCode}`} className="w-full flex items-center justify-center gap-1.5 btn-gold-shimmer px-4 py-4 rounded-2xl text-sm uppercase tracking-widest font-black text-black">
              Minha inscrição <span aria-hidden="true">›</span>
            </Link>
            <button onClick={slideDownClose} className="font-mono text-xs font-bold text-gray-300 border border-white/25 py-3 rounded-full hover:bg-white/10 transition-colors uppercase w-full">Fechar</button>
          </div>
        )}
      </div>
    </div>
  );
}
