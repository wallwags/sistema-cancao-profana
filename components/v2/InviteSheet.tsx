'use client';

import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { X, Check, Users, Loader2, ShieldCheck } from 'lucide-react';
import { applyCpfMask, applyDateMask, applyPhoneMask, isValidCPF, isValidBirthDate, isValidWhatsApp, isValidEmail } from '../../lib/validators';

interface Slot {
  id: string;
  name: string;
  claimed: boolean;
}

interface InviteData {
  project_id: string;
  band: string;
  style: string;
  bio: string;
  photo_url: string | null;
  leader_first: string;
  entry_price: number;
  min_payable: number;
  total_members: number;
  band_status: string;
  slots: Slot[];
}

const inputCls = "w-full bg-[#05070B] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#E3B552] placeholder-gray-600 transition-colors";

export default function InviteSheet({ inviteCode, onClose }: { inviteCode: string; onClose: () => void }) {
  const [phase, setPhase] = useState<'loading' | 'confirm' | 'pick' | 'form' | 'summary' | 'checkout' | 'done'>('loading');
  const [data, setData] = useState<InviteData | null>(null);
  const [slotId, setSlotId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [birth, setBirth] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [cpfPrefilled, setCpfPrefilled] = useState(false);

  const [busy, setBusy] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<{ pago: number; minimo: number; total: number; ativa: boolean } | null>(null);

  const sheetRef = useRef<HTMLDivElement | null>(null);
  const dragStartY = useRef<number | null>(null);

  // entrada: sobe de baixo pra cima
  useEffect(() => {
    if (sheetRef.current) {
      gsap.fromTo(sheetRef.current, { y: '100%' }, { y: '0%', duration: 0.4, ease: 'power3.out' });
    }
  }, []);

  const slideDownClose = () => {
    if (!sheetRef.current) { onClose(); return; }
    gsap.to(sheetRef.current, { y: '105%', duration: 0.3, ease: 'power2.in', onComplete: onClose });
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
    if (dy > 110) slideDownClose();
    dragStartY.current = null;
  };

  useEffect(() => {
    (async () => {
      const { data: inv, error } = await supabase.rpc('get_invite', { p_code: inviteCode });
      if (error || !inv) { setError('Convite não encontrado ou inválido.'); setPhase('loading'); setData(null); return; }
      setData(inv as unknown as InviteData);
      setPhase('confirm');
      fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ref: inviteCode, event: 'invite_opened' }) }).catch(() => {});
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteCode]);

  const selectedSlot = data?.slots.find(s => s.id === slotId) || null;

  const goConfirm = () => {
    fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ref: inviteCode, event: 'invite_confirmed' }) }).catch(() => {});
    setPhase('pick');
  };

  const goDiscard = () => {
    fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ref: inviteCode, event: 'invite_closed' }) }).catch(() => {});
    slideDownClose();
  };

  const goPick = (slot: Slot) => {
    setSlotId(slot.id);
    setName(slot.name || '');
    setPhase('form');
  };

  const submitClaim = async () => {
    setError('');
    if (!name.trim() || name.trim().length < 3) { setError('Informe seu nome completo.'); return; }
    if (!isValidCPF(cpf)) { setError('CPF inválido. Confira os dígitos.'); return; }
    if (!isValidBirthDate(birth)) { setError('Data de nascimento inválida.'); return; }
    if (!isValidWhatsApp(phone)) { setError('Informe um WhatsApp válido com DDD.'); return; }
    if (!isValidEmail(email)) { setError('Informe um e-mail válido.'); return; }

    setBusy(true);
    const { error: err } = await supabase.rpc('claim_member_slot', {
      p_code: inviteCode, p_member_id: slotId,
      p_name: name.trim(), p_cpf: cpf, p_birth: birth, p_phone: phone, p_email: email
    });
    setBusy(false);
    if (err) {
      const m = err.message || '';
      setError(
        m.includes('VAGA_JA_RECLAMADA') ? 'Essa vaga acabou de ser confirmada por outra pessoa. Escolha outra ou fale com o líder.' :
        m.includes('CPF_INVALIDO') ? 'CPF inválido.' :
        m.includes('NASCIMENTO_INVALIDO') ? 'Data de nascimento inválida.' :
        'Não foi possível confirmar agora. Tente novamente.'
      );
      return;
    }
    setPhase('summary');
  };

  const startCheckout = () => {
    setPhase('checkout');
    setConfirming(true);
    const t1 = setTimeout(() => doConfirm(), 5000);
    const t2 = setTimeout(() => setConfirming(false), 12000);
    timers.current = [t1, t2];
  };

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  const doConfirm = async () => {
    if (!slotId) return;
    setConfirming(true);
    const { data: res, error } = await supabase.rpc('confirm_member_payment', { p_code: inviteCode, p_member_id: slotId });
    setConfirming(false);
    if (error || !res) { setError('Não foi possível confirmar agora. Toque em "Verificar novamente".'); return; }
    timers.current.forEach(clearTimeout);
    setResult({ pago: Number(res.pago), minimo: Number(res.minimo), total: Number(res.total), ativa: Boolean(res.banda_ativa) });
    setPhase('done');
  };

  const price = data?.entry_price ?? 0;

  return (
    <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm" onClick={slideDownClose}>
      <div
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-0 left-0 right-0 max-h-[92vh] bg-[#05070B] border-t-2 border-[#E3B552] rounded-t-[28px] shadow-[0_-10px_60px_rgba(0,0,0,0.8)] flex flex-col pt-2 sm:left-auto sm:right-0 sm:max-w-md sm:w-full sm:border-l sm:rounded-l-[28px] sm:rounded-tr-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* alça de arraste */}
        <div className="w-12 h-1.5 rounded-full bg-white/20 mx-auto mt-1 shrink-0" />
        <button onClick={slideDownClose} className="absolute right-4 top-3 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>

        <div className="overflow-y-auto px-5 pb-8 pt-3 space-y-4">
          {phase === 'loading' && !data && (
            <div className="py-12 text-center space-y-3">
              {error ? (
                <>
                  <p className="text-sm text-red-400 font-mono">{error}</p>
                  <Link href="/v2" className="text-[11px] text-gray-400 underline uppercase tracking-widest">Voltar ao site</Link>
                </>
              ) : (
                <>
                  <Loader2 className="w-7 h-7 text-[#F0C265] animate-spin mx-auto" />
                  <p className="font-mono text-[11px] text-gray-400 uppercase tracking-widest">Abrindo convite...</p>
                </>
              )}
            </div>
          )}

          {data && phase === 'confirm' && (
            <div className="space-y-4 text-center">
              <span className="inline-block bg-[#F0C265]/15 text-[#F0C265] border border-[#F0C265]/30 font-mono text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Convite de banda</span>
              {data.photo_url && String(data.photo_url).startsWith('http') && (
                <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden border-2 border-[#F0C265]/40 relative">
                  <Image src={String(data.photo_url)} alt={data.band} fill sizes="96px" className="object-cover" />
                </div>
              )}
              <h2 className="font-display font-black text-xl text-white uppercase leading-tight">
                Você foi convidado por <span className="text-[#F0C265]">{data.leader_first}</span> para representar <span className="text-[#F0C265]">{data.band}</span>?
              </h2>
              <p className="text-sm text-gray-300">{data.style || '—'} • {data.total_members} integrantes • Sua parte: <strong className="text-[#F0C265]">R$ {price},00</strong></p>
              {data.bio && <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">{data.bio}</p>}
              <div className="flex flex-col gap-2.5 pt-1">
                <button onClick={goConfirm} className="btn-gold-shimmer py-3.5 rounded-full text-sm uppercase tracking-widest font-black text-black">Sim, fui convidado(a)</button>
                <button onClick={goDiscard} className="font-mono text-xs font-bold text-gray-400 border border-white/10 py-3 rounded-full hover:bg-white/5 transition-colors uppercase">Não fui eu / Descartar</button>
              </div>
            </div>
          )}

          {data && phase === 'pick' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#F0C265]" />
                <h3 className="font-display font-black text-lg text-white uppercase">Quem é você?</h3>
              </div>
              <p className="text-sm text-gray-400">Escalado(a) por {data.leader_first} em {data.band}:</p>
              <div className="space-y-2.5">
                {data.slots.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    disabled={s.claimed}
                    onClick={() => goPick(s)}
                    className={`w-full text-left flex justify-between items-center px-4 py-3.5 rounded-xl border transition-colors ${
                      s.claimed ? 'border-white/5 bg-black/30 opacity-50 cursor-not-allowed' : 'border-white/10 hover:border-[#F0C265]/50 bg-black/40'
                    }`}
                  >
                    <span className="text-sm font-bold text-white">{s.name || 'Integrante'}</span>
                    {s.claimed
                      ? <span className="flex items-center gap-1 font-mono text-[11px] text-[#10B981] uppercase font-bold"><Check className="w-3.5 h-3.5" /> confirmado</span>
                      : <span className="font-mono text-[11px] text-[#F0C265] uppercase font-bold">Selecionar →</span>}
                  </button>
                ))}
                {data.slots.length === 0 && <p className="text-sm text-gray-400 font-mono">Nenhuma vaga pendente nesta banda.</p>}
              </div>
            </div>
          )}

          {data && phase === 'form' && (
            <div className="space-y-4">
              <h3 className="font-display font-black text-lg text-white uppercase">Seus dados</h3>
              <p className="text-sm text-gray-400">Confirme as informações para representar <strong className="text-white">{data.band}</strong>. Tudo pode ser revisado antes de pagar.</p>

              <div className="space-y-1.5">
                <label className="block font-mono text-[11px] text-[#F0C265] font-bold uppercase">Nome completo *</label>
                <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="block font-mono text-[11px] text-[#F0C265] font-bold uppercase">CPF *</label>
                {cpfPrefilled ? (
                  <div className="flex items-center gap-2">
                    <input className={`${inputCls} font-mono tracking-widest`} value="•••.•••.•••-••" readOnly />
                    <button type="button" onClick={() => { setCpf(''); setCpfPrefilled(false); }} className="font-mono text-[11px] text-[#F0C265] underline uppercase font-bold shrink-0">Alterar</button>
                  </div>
                ) : (
                  <input className={inputCls} value={cpf} onChange={(e) => setCpf(applyCpfMask(e.target.value))} placeholder="000.000.000-00" maxLength={14} inputMode="numeric" />
                )}
              </div>
              <div className="space-y-1.5">
                <label className="block font-mono text-[11px] text-[#F0C265] font-bold uppercase">Nascimento *</label>
                <input className={inputCls} value={birth} onChange={(e) => setBirth(applyDateMask(e.target.value))} placeholder="DD/MM/AAAA" maxLength={10} inputMode="numeric" />
              </div>
              <div className="space-y-1.5">
                <label className="block font-mono text-[11px] text-[#F0C265] font-bold uppercase">WhatsApp *</label>
                <input className={inputCls} value={phone} onChange={(e) => setPhone(applyPhoneMask(e.target.value))} placeholder="(21) 90000-0000" maxLength={15} inputMode="tel" />
              </div>
              <div className="space-y-1.5">
                <label className="block font-mono text-[11px] text-[#F0C265] font-bold uppercase">E-mail *</label>
                <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/40 rounded-xl px-4 py-3 flex items-start gap-2.5">
                  <span className="text-red-400 text-base leading-none mt-0.5">⚠</span>
                  <div className="text-left flex-1">
                    <span className="text-xs text-red-300 font-bold uppercase tracking-wide block">Atenção</span>
                    <span className="text-xs text-red-200/90 leading-snug">{error}</span>
                  </div>
                  <button type="button" onClick={() => setError('')} className="text-red-300/70 hover:text-white text-lg leading-none">×</button>
                </div>
              )}

              <button onClick={submitClaim} disabled={busy} className="btn-gold-shimmer w-full py-3.5 rounded-full text-sm uppercase tracking-widest font-black text-black disabled:opacity-50">
                {busy ? 'Confirmando...' : 'Revisar meus dados'}
              </button>
            </div>
          )}

          {data && phase === 'summary' && (
            <div className="space-y-4">
              <h3 className="font-display font-black text-lg text-white uppercase">Revise e pague sua parte</h3>

              <div className="bg-black/40 border border-white/5 rounded-xl p-4 space-y-1.5 text-xs">
                <span className="font-mono text-[11px] text-[#F0C265] uppercase font-black block mb-1">Seus dados</span>
                <p className="text-gray-200"><strong>{name}</strong></p>
                <p className="font-mono text-gray-400">{cpf} • {birth}</p>
                <p className="font-mono text-gray-400">{phone} • {email}</p>
                <button type="button" onClick={() => setPhase('form')} className="text-[11px] text-[#F0C265] underline uppercase font-bold mt-1">Editar meus dados</button>
              </div>

              <div className="bg-black/40 border border-white/5 rounded-xl p-4 space-y-2">
                <span className="font-mono text-[11px] text-[#F0C265] uppercase font-black block">Banda</span>
                <p className="text-sm font-bold text-white">{data.band}</p>
                <p className="text-xs text-gray-400">{data.style} • liderada por {data.leader_first}</p>
                {data.bio && <p className="text-xs text-gray-400 leading-relaxed">{data.bio}</p>}
                <p className="text-xs text-gray-300 pt-1"><strong className="text-white">Integrantes:</strong> {data.slots.map(s => s.name).join(', ')}</p>
              </div>

              <div className="bg-[#F0C265]/10 border border-[#F0C265]/25 rounded-xl p-4 flex justify-between items-center">
                <span className="font-mono text-xs text-gray-200 uppercase font-bold">Sua parte</span>
                <span className="font-display font-black text-2xl text-[#F0C265]">R$ {price},00</span>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/40 rounded-xl px-4 py-3 flex items-start gap-2.5">
                  <span className="text-red-400 text-base leading-none mt-0.5">⚠</span>
                  <div className="text-left flex-1">
                    <span className="text-xs text-red-300 font-bold uppercase tracking-wide block">Atenção</span>
                    <span className="text-xs text-red-200/90 leading-snug">{error}</span>
                  </div>
                  <button type="button" onClick={() => setError('')} className="text-red-300/70 hover:text-white text-lg leading-none">×</button>
                </div>
              )}

              <button onClick={startCheckout} className="font-mono text-sm font-bold text-black bg-[#10B981] py-4 rounded-full w-full uppercase tracking-widest">
                Gerar Pix e pagar R$ {price},00
              </button>
            </div>
          )}

          {data && phase === 'checkout' && (
            <div className="space-y-4 text-center">
              <span className="inline-block bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 font-mono text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full">● Servidor autenticado</span>
              <h3 className="font-display font-black text-lg text-white uppercase">PIX DA SUA PARTE</h3>

              <div className="w-44 h-44 mx-auto bg-white p-3 rounded-xl flex items-center justify-center relative">
                <div className="w-full h-full border border-black/10 flex flex-col justify-between p-2">
                  <div className="flex justify-between">
                    <div className="w-7 h-7 bg-black" />
                    <div className="w-7 h-7 bg-black" />
                  </div>
                  <div className="text-center font-bold text-[8px] text-[#05070B] font-mono uppercase tracking-widest py-2">Canção Profana</div>
                  <div className="flex justify-between">
                    <div className="w-7 h-7 bg-black" />
                    <div className="w-10 h-10 border border-black border-dashed flex items-center justify-center"><div className="w-5 h-5 bg-[#F0C265]" /></div>
                  </div>
                </div>
                {confirming && (
                  <div className="absolute inset-0 bg-[#05070B]/95 rounded-xl flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-7 h-7 text-[#F0C265] animate-spin" />
                    <span className="font-mono text-[11px] text-[#F0C265] uppercase tracking-widest animate-pulse">Confirmando sua parte...</span>
                  </div>
                )}
              </div>

              <p className="font-display font-black text-2xl text-[#10B981]">R$ {price},00</p>

              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(`PIX CANCAO PROFANA | ${data.band} | R$ ${price},00 | ${name.split(' ')[0]}`);
                    setPixCopied(true);
                    setTimeout(() => setPixCopied(false), 2500);
                  } catch { /* clipboard */ }
                }}
                className="font-mono text-xs font-bold text-white bg-white/5 border border-white/10 py-3 rounded-xl w-full uppercase hover:bg-white/10 transition-colors"
              >
                {pixCopied ? '✓ Código Pix copiado!' : 'Copiar código Pix'}
              </button>

              {!confirming && (
                <button onClick={doConfirm} className="font-mono text-[11px] text-gray-400 hover:text-[#F0C265] uppercase tracking-widest w-full py-1">
                  Já paguei — verificar novamente
                </button>
              )}
              {error && (
                <div className="bg-red-500/10 border border-red-500/40 rounded-xl px-4 py-3 flex items-start gap-2.5">
                  <span className="text-red-400 text-base leading-none mt-0.5">⚠</span>
                  <div className="text-left flex-1">
                    <span className="text-xs text-red-300 font-bold uppercase tracking-wide block">Atenção</span>
                    <span className="text-xs text-red-200/90 leading-snug">{error}</span>
                  </div>
                  <button type="button" onClick={() => setError('')} className="text-red-300/70 hover:text-white text-lg leading-none">×</button>
                </div>
              )}
            </div>
          )}

          {data && phase === 'done' && result && (
            <div className="space-y-4 text-center py-2">
              <div className="w-14 h-14 mx-auto rounded-full bg-[#10B981]/10 text-[#10B981] border-2 border-[#10B981] flex items-center justify-center"><Check className="w-7 h-7" /></div>
              <h3 className="font-display font-black text-xl text-white uppercase">Sua parte está paga!</h3>

              {result.ativa ? (
                <p className="text-sm text-[#10B981] font-bold uppercase tracking-wider">🎉 Banda {data.band} está ATIVA no concurso!</p>
              ) : (
                <div className="bg-[#F0C265]/10 border border-[#F0C265]/25 rounded-xl p-4 space-y-1">
                  <p className="text-sm text-gray-200">Banda aguardando: <strong className="text-white">{result.pago} de {result.minimo} partes mínimas pagas</strong></p>
                  <p className="text-xs text-gray-400">Faltam <strong className="text-[#F0C265]">{Math.max(0, result.minimo - result.pago)}</strong> pagamento(s) para a banda ativar no concurso.</p>
                </div>
              )}

              <ShieldCheck className="w-5 h-5 text-gray-500 mx-auto" />
              <p className="text-xs text-gray-500">Guarde o comprovante. O status da banda aparece no portal do candidato.</p>
              <Link href="/minha-inscricao" className="btn-gold-shimmer inline-block px-6 py-3 rounded-full text-xs uppercase tracking-widest font-black text-black">
                Acompanhar minha banda
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
