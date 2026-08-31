'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { 
  Shield, Music, Users, CheckCircle, Clock, 
  AlertTriangle, ArrowLeft, Phone,
  XCircle, PauseCircle, RotateCcw, ClipboardList
} from 'lucide-react';

interface Member {
  id?: string;
  name: string;
  cpf: string;
  role_in_band?: string;
  removed?: boolean;
  birth_date: string;
  phone: string | null;
  email?: string | null;
  is_responsible: boolean;
  payment_status?: string;
}

interface RegistrationData {
  id: string;
  invite_code?: string | null;
  min_payable?: number;
  total_members?: number;
  entry_price?: number;
  name: string;
  style: string;
  bio: string;
  photo_url: string | null;
  instagram: string | null;
  video_link: string | null;
  status: 'pending' | 'paid' | 'failed' | 'blocked' | 'suspended' | 'refunded' | 'awaiting_members';
  lote_ends?: string | null;
  vagas_lote?: number;
  slot_mode?: 'band' | 'integrante';
  pending_edits?: number;
  members: Member[];
  amount_paid?: number;
  batch_name?: string;
}

export default function MinhaInscricaoPage() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchCpf, setSearchCpf] = useState('');
  const router = useRouter();
  const [linkCopied, setLinkCopied] = useState(false);
  const [me, setMe] = useState<{ id: string; name: string; role_in_band: string; isLeader: boolean } | null>(null);
  const [cpfGate, setCpfGate] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [gateError, setGateError] = useState('');
  const [gateBusy, setGateBusy] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [data, setData] = useState<RegistrationData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Apply CPF Mask
  const applyCpfMask = (val: string) => {
    let value = val.replace(/\D/g, "");
    if (value.length > 11) value = value.substring(0, 11);
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    return value;
  };

  const loadBandByCodeSafe = async () => {
    if (!accessCode) return;
    const { data: reg } = await supabase.rpc('get_registration_by_code', { p_code: accessCode });
    if (reg && reg.project) applyRegistration(reg);
  };

  const applyRegistration = (reg: any) => {
    const project = reg.project;
    const typedMembers: Member[] = (reg.members || []).map((m: any) => ({
      id: m.id,
      name: m.name,
      cpf: m.cpf,
      birth_date: m.birth_date,
      phone: m.phone,
      email: m.email ?? null,
      is_responsible: m.is_responsible,
      payment_status: m.payment_status,
      role_in_band: m.role_in_band,
      removed: m.removed
    }));
    setData({
      id: project.id,
      invite_code: project.invite_code,
      min_payable: project.min_payable,
      total_members: project.total_members,
      entry_price: project.entry_price,
      pending_edits: Number(reg.pending_edits || 0),
      name: project.name,
      style: project.style,
      bio: project.bio,
      photo_url: project.photo_url,
      instagram: project.instagram || null,
      video_link: project.video_link || null,
      status: project.status,
      members: typedMembers,
      lote_ends: reg.lote_ends,
      vagas_lote: reg.vagas_restantes_lote,
      slot_mode: reg.slot_mode || 'band'
    });
  };

  // ---------- identificação por CPF ----------
  const identifyByCpf = async (code: string, cpf: string) => {
    setGateBusy(true);
    setGateError('');
    const { data: reg, error } = await supabase.rpc('get_registration_by_code', { p_code: code });
    if (error || !reg || !reg.project) {
      setGateBusy(false);
      router.replace('/v2');
      return;
    }
    const norm = (v: string) => (v || '').replace(/\D/g, '');
    const me = (reg.members || []).find((m: any) => norm(m.cpf) === norm(cpf) && !m.removed);
    if (!me) {
      setGateBusy(false);
      setGateError('CPF não localizado nesta banda. Confira com o líder.');
      return;
    }
    setMe({
      id: me.id,
      name: me.name,
      role_in_band: me.is_responsible ? 'Líder' : (me.role_in_band || 'Integrante'),
      isLeader: !!me.is_responsible
    });
    applyRegistration(reg);
    setGateBusy(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05070B] text-[#F0EAE0] flex flex-col items-center justify-center space-y-4">
        <span className="w-10 h-10 rounded-full border-2 border-[#F0C265] border-t-transparent animate-spin"></span>
        <span className="font-mono text-xs uppercase tracking-widest text-[#F0C265] font-bold">Consultando inscrições em tempo real...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#05070B] text-[#F0EAE0] flex flex-col items-center justify-center space-y-4">
        <span className="w-10 h-10 rounded-full border-2 border-[#F0C265] border-t-transparent animate-spin"></span>
        <span className="font-mono text-xs uppercase tracking-widest text-[#F0C265] font-bold">Abrindo sua banda...</span>
      </div>
    );
  }

  // Render project details view
  const leader = data.members.find(m => m.is_responsible);
  const regularMembers = data.members.filter(m => !m.is_responsible);

  return (
    <div className="pt-10 pb-16 px-4 bg-[#05070B] min-h-screen text-[#F0EAE0] flex items-center justify-center relative overflow-hidden">
      {/* Background radial gold glow leaks */}
      <div className="absolute -right-32 -top-32 w-80 h-80 bg-[#E3B552]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -left-32 -bottom-32 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="glass-card-2 fade-up-800 max-w-2xl w-full p-6 md:p-8 rounded-[32px] relative space-y-8 shadow-2xl">
        
        {/* HEADER BAR */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-gradient-to-b from-[#FFF2D4] via-[#F0C265] to-[#B88A28] flex items-center justify-center font-display font-black text-black text-xl border border-black shadow-md">
              P
            </div>
            <div>
              <span className="font-display font-black text-white text-md tracking-tight uppercase block leading-none">CANÇÃO PROFANA</span>
              <span className="font-mono text-[11px] text-[#F0C265] tracking-widest block uppercase mt-1">PORTAL DO CANDIDATO</span>
            </div>
          </div>
          
          <div className="flex gap-4 items-center">
            <button 
              onClick={() => router.replace('/v2')} 
              className="font-mono text-[11px] text-gray-400 hover:text-red-400 transition-colors uppercase font-bold"
            >
              Sair
            </button>
            <Link href="/" className="flex items-center gap-1 text-xs font-mono text-[#A89880] hover:text-white transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Início
            </Link>
          </div>
        </div>

        {/* URGÊNCIA — partes pendentes */}
        {data.status === 'awaiting_members' && (() => {
          const paidCount = data.members.filter(m => m.payment_status === 'paid').length;
          const minReq = data.min_payable ?? 2;
          const faltam = Math.max(0, minReq - paidCount);
          const pendentes = data.members.filter(m => m.payment_status !== 'paid' && (m.is_responsible || m.cpf)).length;
          const endsIn = data.lote_ends ? Math.max(0, Math.floor((new Date(String(data.lote_ends).replace(' ', 'T')).getTime() - Date.now()) / 86400000)) : null;
          return (
            <div className="relative overflow-hidden rounded-2xl border-2 border-[#F0C265] bg-gradient-to-br from-[#8B1E1E]/40 via-[#0B0F19]/95 to-[#8B1E1E]/25 p-5 space-y-4 shadow-[0_0_35px_rgba(240,194,101,0.25)]">
              <div className="absolute -right-16 -top-16 w-40 h-40 bg-[#F0C265]/15 rounded-full blur-3xl pointer-events-none animate-pulse" />

              <div className="flex items-start gap-3 relative">
                <span className="text-3xl leading-none animate-pulse">⏳</span>
                <div className="flex-1">
                  <span className="font-display font-black text-lg text-[#F0C265] uppercase tracking-wide block leading-snug">
                    {pendentes > 0 ? `${pendentes} parte(s) da banda ainda não foi paga` : `${faltam} pagamento(s) para a banda ativar`}
                  </span>
                  <p className="text-sm text-gray-200 leading-snug mt-1.5">
                    A banda entra no concurso com <strong className="text-white">no mínimo 2</strong> e{' '}
                    <strong className="text-white">no máximo 7</strong> integrantes pagos (cada um paga a própria parte pelo link).
                    {faltam > 0 && <> Faltam <strong className="text-[#F0C265]">{faltam}</strong>.</>}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 relative">
                <div className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-center">
                  <span className="font-mono text-[10px] text-gray-400 uppercase tracking-widest block">Pago até agora</span>
                  <span className="font-display font-black text-xl text-[#10B981] block">{paidCount}</span>
                </div>
                <div className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-center">
                  <span className="font-mono text-[10px] text-gray-400 uppercase tracking-widest block">Partes pendentes</span>
                  <span className="font-display font-black text-xl text-amber-400 block">{Math.max(0, (data.total_members ?? 0) - paidCount)}</span>
                </div>
              </div>

              <p className="text-xs text-gray-300 leading-snug relative">
                <strong className="text-amber-400">Atenção:</strong> bandas com menos de 2 partes pagas podem perder a vaga na virada do lote{data.slot_mode === 'integrante' ? ', e as partes seguintes passam a valer o preço do novo lote.' : '.'}
              </p>

              {/* tags informativas (não clicáveis) — visual passivo */}
              <div className="flex flex-nowrap gap-2 overflow-x-auto scrollbar-thin pb-1 relative">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-md">
                  <Clock className="w-3 h-3 text-amber-400" />
                  Lote encerra em {endsIn !== null ? `${endsIn} dia${endsIn === 1 ? '' : 's'}` : '—'}
                </span>
                {typeof data.vagas_lote === 'number' && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-md">
                    <Users className="w-3 h-3 text-sky-400" />
                    Restam {data.vagas_lote} vagas no lote
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-md">
                  <Music className="w-3 h-3 text-[#F0C265]" />
                  Min. {minReq} / Máx. 7 integrantes
                </span>
              </div>

              {/* ações — sólidas, claramente clicáveis */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 relative pt-1">
                {data.invite_code && (
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(`${window.location.origin}/v2?b=${data.invite_code}`);
                        setLinkCopied(true);
                        setTimeout(() => setLinkCopied(false), 2500);
                      } catch { /* clipboard */ }
                    }}
                    className="inline-flex items-center justify-center gap-2 font-mono text-sm font-black uppercase tracking-wide text-white bg-white/10 border-2 border-white/25 px-3 py-3 rounded-xl hover:bg-white/15 transition-colors"
                  >
                    <ClipboardList className="w-4 h-4" />
                    {linkCopied ? '✓ Link copiado!' : 'Copiar link do convite'}
                  </button>
                )}
                <a
                  href={data.invite_code ? `/api/wa/${data.invite_code}` : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 font-mono text-sm font-black uppercase tracking-wide text-black bg-[#10B981] px-3 py-3 rounded-xl shadow-lg shadow-[#10B981]/25 hover:brightness-110 transition-all"
                >
                  <Phone className="w-4 h-4" />
                  Cobrar por WhatsApp
                </a>
              </div>
            </div>
          );
        })()}

        {/* DIVERGÊNCIA DE DADOS */}
        {(data.pending_edits ?? 0) > 0 && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-mono text-xs font-black uppercase tracking-widest text-amber-400 block">Dados divergentes nesta banda</span>
              <p className="text-sm text-amber-100/90 leading-snug mt-1">
                {data.pending_edits} campo(s) foi(ram) alterado(s) em relação ao cadastro original feito pelo líder. O líder foi sinalizado para revisar junto aos integrantes.
              </p>
            </div>
          </div>
        )}

        {/* PREMIUM PARTICIPANT STAGE PASS ID CARD (Aesthetic Visual Upgrade) */}
        <div className="relative rounded-2xl overflow-hidden h-44 border border-white/10 shadow-lg flex items-end p-5">
          <Image
            src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80"
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 100vw, 896px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-0"></div>
          
          <div className="relative z-10 flex justify-between items-center w-full">
            <div className="space-y-1">
              <span className="bg-[#F0C265] text-black font-mono text-[11px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow">
                SESSÕES DE ESTÚDIO 2026
              </span>
              <div className="flex items-center gap-2.5 flex-wrap mt-2">
                <span className="text-white font-display font-black text-xl sm:text-2xl uppercase tracking-tight leading-none">
                  Olá, {me!.name.split(' ')[0]}!
                </span>
                <span className="font-mono text-[11px] font-black uppercase tracking-wider bg-[#F0C265] text-black px-2.5 py-0.5 rounded-md">
                  {me!.isLeader ? (me!.role_in_band ? `Líder · ${me!.role_in_band}` : 'Líder') : (me!.role_in_band || 'Integrante')}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#A89880] font-medium tracking-wide mt-1.5">
                {data.name} • Estúdio Pedra Profana
              </p>
              <p className="text-xs sm:text-xs text-[#A89880] font-medium tracking-wide">
                Estúdio Pedra Profana • Concurso Canção Profana
              </p>
            </div>
            
            {/* Stage Pass Gold Symbol */}
            <div className="w-12 h-12 rounded-full border border-[#F0C265]/30 bg-black/50 flex items-center justify-center text-[#F0C265] shadow-inner backdrop-blur-sm hidden sm:flex">
              <Music className="w-5 h-5 animate-pulse" />
            </div>
          </div>
        </div>

        {/* LIVE STATUS BAR (REACTIVE - Sync trigger replaced by Criptografia Ativa trigger) */}
        <div className="vst-input-groove p-4 flex flex-col sm:flex-row justify-between items-center gap-4 border border-white/5">
          <div>
            <span className="font-mono text-[11px] text-gray-400 block uppercase font-bold">STATUS DA MATRÍCULA:</span>
            <div className="flex items-center gap-2 mt-1">
              {data.status === 'paid' && (
                <>
                  <CheckCircle className="w-5 h-5 text-[#10B981]" />
                  <span className="text-[#10B981] font-display font-black text-lg uppercase tracking-wider">Inscrição Ativa / Aprovada</span>
                </>
              )}
              {data.status === 'pending' && (
                <>
                  <Clock className="w-5 h-5 text-amber-500 animate-pulse" />
                  <span className="text-amber-500 font-display font-black text-lg uppercase tracking-wider">Aguardando Compensação PIX</span>
                </>
              )}
              {data.status === 'failed' && (
                <>
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span className="text-red-500 font-display font-black text-md uppercase tracking-wider">Inscrição Negada / Rejeitada</span>
                </>
              )}
              {data.status === 'blocked' && (
                <>
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-500 font-display font-black text-md uppercase tracking-wider">Inscrição Bloqueada</span>
                </>
              )}
              {data.status === 'suspended' && (
                <>
                  <PauseCircle className="w-5 h-5 text-orange-400" />
                  <span className="text-orange-400 font-display font-black text-md uppercase tracking-wider">Inscrição Suspensa</span>
                </>
              )}
              {data.status === 'refunded' && (
                <>
                  <RotateCcw className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-400 font-display font-black text-md uppercase tracking-wider">Inscrição Reembolsada</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* CANDIDATE INFO BODY */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-white/5 pb-6">
            <div className="space-y-1">
              <span className="font-mono text-xs text-gray-400 uppercase font-bold block">PROJETO / DUPLA DE RAP:</span>
              <span className="text-white font-bold text-base block">{data.name}</span>
            </div>
            <div className="space-y-1">
              <span className="font-mono text-xs text-gray-400 uppercase font-bold block">ESTILO MUSICAL:</span>
              <span className="text-white font-bold text-base block">{data.style}</span>
            </div>
            <div className="col-span-1 md:col-span-2 space-y-1">
              <span className="font-mono text-xs text-gray-400 uppercase font-bold block">BIOGRAFIA OFICIAL:</span>
              <p className="text-sm text-[#A89880] leading-relaxed font-normal">{data.bio}</p>
            </div>
            {data.instagram && (
              <div className="space-y-1">
                <span className="font-mono text-xs text-gray-400 uppercase font-bold block">INSTAGRAM:</span>
                <span className="text-[#F0C265] font-bold text-xs block font-mono">{data.instagram}</span>
              </div>
            )}
            {data.video_link && (
              <div className="space-y-1">
                <span className="font-mono text-xs text-gray-400 uppercase font-bold block">LINK DE VÍDEO DA MÚSICA:</span>
                <a href={data.video_link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-xs block font-mono truncate">{data.video_link}</a>
              </div>
            )}
            {data.photo_url && (
              <div className="col-span-1 md:col-span-2 space-y-1">
                <span className="font-mono text-xs text-gray-400 uppercase font-bold block">FOTO DE DIVULGAÇÃO ENVIADA:</span>
                <span className="text-xs font-mono text-gray-300 block">✓ {data.photo_url}</span>
              </div>
            )}
          </div>

          {/* RESPONSIBLE DETAILS */}
          {leader && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-white/5 pb-6">
              <div className="space-y-1">
                <span className="font-mono text-xs text-gray-400 uppercase font-bold block">LÍDER RESPONSÁVEL:</span>
                <span className="text-white font-bold text-sm block">{leader.name}</span>
              </div>
              <div className="space-y-1">
                <span className="font-mono text-xs text-gray-400 uppercase font-bold block">WHATSAPP:</span>
                <span className="text-white font-bold text-xs block font-mono">{leader.phone || '-'}</span>
              </div>
              <div className="space-y-1">
                <span className="font-mono text-xs text-gray-400 uppercase font-bold block">CPF LÍDER:</span>
                <span className="text-white font-bold text-xs block font-mono">{leader.cpf}</span>
              </div>
              {leader.email && (
                <div className="space-y-1">
                  <span className="font-mono text-xs text-gray-400 uppercase font-bold block">E-MAIL:</span>
                  <span className="text-white font-bold text-xs block font-mono truncate">{leader.email}</span>
                </div>
              )}
              {data.amount_paid !== undefined && (
                <div className="space-y-1">
                  <span className="font-mono text-xs text-gray-400 uppercase font-bold block">VALOR PAGO ({data.batch_name || 'LOTE'}):</span>
                  <span className="text-lime font-black text-xs block font-mono">R$ {data.amount_paid},00</span>
                </div>
              )}
            </div>
          )}

          {/* LINEUP MEMBER SHOWN AS TRACK ROWS */}
          <div className="space-y-4">
            <span className="font-mono text-[11px] text-[#F0C265] font-bold uppercase tracking-widest block">ROSTER DA BANDA (QUEUE DE INTEGRANTES)</span>
            
            <div className="space-y-3">
              {/* Leader Row */}
              {leader && (
                <div className="vst-input-groove p-3 flex justify-between items-center border border-[#F0C265]/20 bg-[#F0C265]/5">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#F0C265]/20 text-[#F0C265] flex items-center justify-center font-mono text-[11px] font-bold border border-[#F0C265]/35">1</span>
                    <div>
                      <span className="text-sm font-bold text-white block">{leader.name}</span>
                      <span className="font-mono text-xs text-gray-400 tracking-wider uppercase block mt-0.5">Líder Responsável • CPF: {leader.cpf ? '***.' + leader.cpf.slice(4, 7) + '.***' : '---'}</span>
                      <span className={`font-mono text-xs uppercase font-bold block mt-0.5 ${leader.payment_status === 'paid' ? 'text-[#10B981]' : 'text-amber-500'}`}>
                        {leader.payment_status === 'paid' ? '✓ Parte paga' : '⏳ Parte pendente'}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-[#10B981] bg-[#10B981]/15 px-2.5 py-0.5 rounded border border-[#10B981]/25 uppercase font-bold tracking-wider">Líder</span>
                </div>
              )}

              {/* Regular Members Rows */}
              {regularMembers.map((m, i) => (
                <div key={i} className="vst-input-groove p-3 flex justify-between items-center border border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#E3B552]/10 text-[#F0C265] flex items-center justify-center font-mono text-[11px] font-bold border border-[#E3B552]/20">{i + 2}</span>
                    <div>
                      <span className="text-sm font-bold text-white block">{m.name}</span>
                      <span className="font-mono text-xs text-gray-400 tracking-wider uppercase block mt-0.5">Integrante {i + 2} • CPF: {m.cpf ? '***.' + m.cpf.slice(4, 7) + '.***' : 'aguardando confirmação'}</span>
                      {m.payment_status && (
                        <span className={`font-mono text-xs uppercase font-bold block mt-0.5 ${m.payment_status === 'paid' ? 'text-[#10B981]' : 'text-amber-500'}`}>
                          {m.payment_status === 'paid' ? '✓ Parte paga' : (m.cpf ? '⏳ Parte pendente' : '⏳ Aguardando confirmação')}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="flex items-center gap-2 shrink-0">
                    {m.payment_status === 'paid' ? (
                      <span className="font-mono text-xs text-[#10B981] bg-[#10B981]/15 px-2.5 py-0.5 rounded border border-[#10B981]/25 uppercase font-bold tracking-wider">Apto</span>
                    ) : (
                      <span className="font-mono text-xs text-amber-500 bg-amber-500/15 px-2.5 py-0.5 rounded border border-amber-500/25 uppercase font-bold tracking-wider">Pendente</span>
                    )}
                    {me?.isLeader && m.payment_status !== 'paid' && m.id && (
                      removing === m.id ? (
                        <span className="flex items-center gap-1">
                          <button
                            onClick={async () => {
                              setRemoving(null);
                              const cpf = prompt('Confirme SEU CPF de líder para remover este integrante:');
                              if (!cpf) return;
                              const { error } = await supabase.rpc('leader_remove_member', { p_member_id: m.id, p_leader_cpf: cpf });
                              if (error) {
                                const msg = error.message || '';
                                alert(
                                  msg.includes('SOMENTE_LIDER') ? 'Somente o líder pode remover integrantes.' :
                                  msg.includes('PAGO_NAO_REMOVIVEL') ? 'Integrante com parte paga não pode ser removido.' :
                                  msg.includes('MINIMO_REGULAMENTO') ? 'O regulamento exige no mínimo 2 integrantes na banda.' :
                                  'Erro ao remover. Tente novamente.'
                                );
                              } else {
                                await loadBandByCodeSafe();
                              }
                            }}
                            className="font-mono text-xs font-black text-white bg-red-600 px-2.5 py-1 rounded uppercase"
                          >Confirmar</button>
                          <button onClick={() => setRemoving(null)} className="text-gray-400 hover:text-white px-1">×</button>
                        </span>
                      ) : (
                        <button onClick={() => setRemoving(m.id!)} className="font-mono text-xs text-gray-500 hover:text-red-400 uppercase font-bold transition-colors">Remover</button>
                      )
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-5 text-center">
          <span className="font-mono text-[11px] text-[#5C5248] uppercase">QUALQUER INCONSISTÊNCIA CADASTRAL DEVE SER NOTIFICADA À DIREÇÃO DO Estúdio Pedra Profana.</span>
        </div>

      </div>
    </div>
  );
}
