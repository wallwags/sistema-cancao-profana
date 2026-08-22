'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { 
  Shield, Music, Users, Calendar, CheckCircle, Clock, 
  AlertTriangle, ArrowLeft, Search, Phone, User, Hash 
} from 'lucide-react';

interface Member {
  name: string;
  cpf: string;
  birth_date: string;
  phone: string | null;
  is_responsible: boolean;
}

interface RegistrationData {
  id: string;
  name: string;
  style: string;
  bio: string;
  photo_url: string | null;
  instagram: string | null;
  video_link: string | null;
  status: 'pending' | 'paid' | 'failed';
  members: Member[];
  amount_paid?: number;
  batch_name?: string;
}

export default function MinhaInscricaoPage() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchCpf, setSearchCpf] = useState('');
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

  // Load project by ID with defensive local storage fallback (for adblockers / offline)
  const loadProject = async (id: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // Check for local mock fallback first (Item 2 offline simulation)
      if (id.startsWith('mock_proj_')) {
        const fallbackData = localStorage.getItem('fallback_project_' + id);
        if (fallbackData) {
          const parsed = JSON.parse(fallbackData);
          setData(parsed);
          setProjectId(id);
          setLoading(false);
          return;
        }
      }

      // 1. Fetch project details
      const { data: project, error: pError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (pError || !project) {
        throw new Error("Não encontramos nenhum projeto com este identificador.");
      }

      // 2. Fetch project members
      const { data: members, error: mError } = await supabase
        .from('members')
        .select('*')
        .eq('project_id', id)
        .order('is_responsible', { ascending: false });

      // 3. Fetch project subscriptions
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*, batches(name)')
        .eq('project_id', id)
        .single();

      const typedMembers: Member[] = (members || []).map(m => ({
        name: m.name,
        cpf: m.cpf,
        birth_date: m.birth_date,
        phone: m.phone,
        is_responsible: m.is_responsible
      }));

      setData({
        id: project.id,
        name: project.name,
        style: project.style,
        bio: project.bio,
        photo_url: project.photo_url,
        instagram: project.instagram || null,
        video_link: project.video_link || null,
        status: project.status, // 'pending' | 'paid' | 'failed'
        members: typedMembers,
        amount_paid: subscription ? Number(subscription.amount_paid) : undefined,
        batch_name: subscription && (subscription as any).batches ? (subscription as any).batches.name : undefined
      });

      setProjectId(id);
    } catch (err: any) {
      console.warn("Database lookup issue. Trying local storage cache as fail-safe:", err);
      
      // Fallback check on standard local storage cache
      const cachedProject = localStorage.getItem('fallback_project_' + id);
      if (cachedProject) {
        setData(JSON.parse(cachedProject));
        setProjectId(id);
      } else {
        setErrorMsg(err.message || "Erro de conexão ao carregar inscrição.");
        setData(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // Check for saved project ID on mount
  useEffect(() => {
    const savedId = localStorage.getItem('current_project_id');
    if (savedId) {
      loadProject(savedId);
    } else {
      setLoading(false);
    }
  }, []);

  // Handle Lookup by Leader CPF
  const handleCpfLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchCpf.length < 14) {
      alert("Por favor, digite um CPF válido completo.");
      return;
    }

    setSearching(true);
    setErrorMsg(null);

    try {
      // First, scan local backup storages for offline matched candidates
      let localFoundId = null;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('fallback_project_')) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            const matchedLeader = parsed.members?.find((m: any) => m.cpf === searchCpf && m.is_responsible);
            if (matchedLeader) {
              localFoundId = parsed.id;
              break;
            }
          }
        }
      }

      if (localFoundId) {
        localStorage.setItem('current_project_id', localFoundId);
        await loadProject(localFoundId);
        setSearching(false);
        return;
      }

      // 1. Scan online Supabase database if no offline match
      const { data: member, error: mError } = await supabase
        .from('members')
        .select('project_id')
        .eq('cpf', searchCpf)
        .eq('is_responsible', true)
        .limit(1)
        .maybeSingle();

      if (mError) {
        throw new Error("Ocorreu um erro ao consultar o banco de dados.");
      }

      if (!member) {
        throw new Error("Nenhuma inscrição encontrada com este CPF de responsável líder.");
      }

      // If found, load the full project
      localStorage.setItem('current_project_id', member.project_id);
      await loadProject(member.project_id);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Nenhuma inscrição encontrada.");
    } finally {
      setSearching(false);
    }
  };

  // Handle Logout/Clear
  const handleClearLookup = () => {
    localStorage.removeItem('current_project_id');
    setProjectId(null);
    setData(null);
    setSearchCpf('');
    setErrorMsg(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05070B] text-[#F0EAE0] flex flex-col items-center justify-center space-y-4">
        <span className="w-10 h-10 rounded-full border-2 border-[#F0C265] border-t-transparent animate-spin"></span>
        <span className="font-mono text-xs uppercase tracking-widest text-[#F0C265] font-bold">Consultando inscrições em tempo real...</span>
      </div>
    );
  }

  // Render Search lookup view if no project is loaded
  if (!data) {
    return (
      <div className="py-16 px-6 bg-[#05070B] min-h-screen text-[#F0EAE0] flex items-center justify-center relative overflow-hidden">
        {/* Background radial gold glow leaks */}
        <div className="absolute -right-32 -top-32 w-80 h-80 bg-[#E3B552]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-32 -bottom-32 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="glass-card-2 max-w-md w-full p-6 md:p-8 rounded-[32px] relative space-y-8 shadow-2xl">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded bg-gradient-to-b from-[#FFF2D4] via-[#F0C265] to-[#B88A28] flex items-center justify-center font-display font-black text-black text-2xl border border-black shadow-md mx-auto">
              P
            </div>
            <div>
              <span className="font-display font-black text-white text-lg tracking-tight uppercase block leading-none">CANÇÃO PROFANA</span>
              <span className="font-mono text-[9px] text-[#F0C265] tracking-widest block uppercase mt-1">PORTAL DO CANDIDATO</span>
            </div>
            <p className="text-xs text-gray-400">
              Digite o CPF do responsável legal cadastrado no quiz para localizar a inscrição e acompanhar o status de matrícula em tempo real.
            </p>
          </div>

          <form onSubmit={handleCpfLookup} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block font-mono text-[10px] text-[#F0C265] font-bold uppercase tracking-wider">CPF do Líder Responsável</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={searchCpf}
                  onChange={(e) => setSearchCpf(applyCpfMask(e.target.value))}
                  placeholder="000.000.000-00" 
                  className="w-full bg-black/60 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-xs outline-none focus:border-[#E3B552] placeholder-gray-600 font-mono"
                  required
                />
                <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {errorMsg && (
              <div className="bg-red-500/15 border border-red-500/30 text-red-400 p-3.5 rounded-xl text-xs flex gap-2 items-center leading-relaxed">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={searching}
              className="btn-gold-shimmer w-full py-3.5 rounded-xl text-xs uppercase tracking-widest block border-none font-bold"
            >
              {searching ? "Localizando..." : "Buscar Inscrição"}
            </button>
          </form>

          <div className="border-t border-white/5 pt-5 text-center">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-mono text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Início
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Render project details view
  const leader = data.members.find(m => m.is_responsible);
  const regularMembers = data.members.filter(m => !m.is_responsible);

  return (
    <div className="py-16 px-4 bg-[#05070B] min-h-screen text-[#F0EAE0] flex items-center justify-center relative overflow-hidden">
      {/* Background radial gold glow leaks */}
      <div className="absolute -right-32 -top-32 w-80 h-80 bg-[#E3B552]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -left-32 -bottom-32 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="glass-card-2 max-w-2xl w-full p-6 md:p-8 rounded-[32px] relative space-y-8 shadow-2xl">
        
        {/* HEADER BAR */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-gradient-to-b from-[#FFF2D4] via-[#F0C265] to-[#B88A28] flex items-center justify-center font-display font-black text-black text-xl border border-black shadow-md">
              P
            </div>
            <div>
              <span className="font-display font-black text-white text-md tracking-tight uppercase block leading-none">CANÇÃO PROFANA</span>
              <span className="font-mono text-[9px] text-[#F0C265] tracking-widest block uppercase mt-1">PORTAL DO CANDIDATO</span>
            </div>
          </div>
          
          <div className="flex gap-4 items-center">
            <button 
              onClick={handleClearLookup} 
              className="font-mono text-[9px] text-gray-400 hover:text-red-400 transition-colors uppercase font-bold"
            >
              Sair / Outra Busca
            </button>
            <Link href="/" className="flex items-center gap-1 text-xs font-mono text-[#A89880] hover:text-white transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Início
            </Link>
          </div>
        </div>

        {/* PREMIUM PARTICIPANT STAGE PASS ID CARD (Aesthetic Visual Upgrade) */}
        <div 
          className="relative rounded-2xl overflow-hidden h-44 border border-white/10 shadow-lg flex items-end p-5 bg-cover bg-center" 
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80')" }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-0"></div>
          
          <div className="relative z-10 flex justify-between items-center w-full">
            <div className="space-y-1">
              <span className="bg-[#F0C265] text-black font-mono text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow">
                SESSÕES DE ESTÚDIO 2026
              </span>
              <h2 className="text-white font-display font-black text-xl sm:text-2xl uppercase tracking-tight leading-none mt-2">
                {data.name}
              </h2>
              <p className="text-[10px] sm:text-xs text-[#A89880] font-medium tracking-wide">
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
            <span className="font-mono text-[9px] text-gray-400 block uppercase font-bold">STATUS DA MATRÍCULA:</span>
            <div className="flex items-center gap-2 mt-1">
              {data.status === 'paid' && (
                <>
                  <CheckCircle className="w-5 h-5 text-[#10B981]" />
                  <span className="text-[#10B981] font-display font-black text-md uppercase tracking-wider">Inscrição Ativa / Aprovada</span>
                </>
              )}
              {data.status === 'pending' && (
                <>
                  <Clock className="w-5 h-5 text-amber-500 animate-pulse" />
                  <span className="text-amber-500 font-display font-black text-md uppercase tracking-wider">Aguardando Compensação PIX</span>
                </>
              )}
              {data.status === 'failed' && (
                <>
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span className="text-red-500 font-display font-black text-md uppercase tracking-wider">Inscrição Negada / Rejeitada</span>
                </>
              )}
            </div>
          </div>
          <span className="bg-black/50 border border-[#D4A843]/30 px-3.5 py-1.5 rounded-full font-mono text-[9px] text-[#F0C265] font-bold uppercase tracking-wider shadow">
            ● CONEXÃO CRIPTOGRAFADA ATIVA
          </span>
        </div>

        {/* CANDIDATE INFO BODY */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-white/5 pb-6">
            <div className="space-y-1">
              <span className="font-mono text-[8px] text-gray-400 uppercase font-bold block">PROJETO / DUPLA DE RAP:</span>
              <span className="text-white font-bold text-md block">{data.name}</span>
            </div>
            <div className="space-y-1">
              <span className="font-mono text-[8px] text-gray-400 uppercase font-bold block">ESTILO MUSICAL:</span>
              <span className="text-white font-bold text-md block">{data.style}</span>
            </div>
            <div className="col-span-1 md:col-span-2 space-y-1">
              <span className="font-mono text-[8px] text-gray-400 uppercase font-bold block">BIOGRAFIA OFICIAL:</span>
              <p className="text-xs text-[#A89880] leading-relaxed font-normal">{data.bio}</p>
            </div>
            {data.instagram && (
              <div className="space-y-1">
                <span className="font-mono text-[8px] text-gray-400 uppercase font-bold block">INSTAGRAM:</span>
                <span className="text-[#F0C265] font-bold text-xs block font-mono">{data.instagram}</span>
              </div>
            )}
            {data.video_link && (
              <div className="space-y-1">
                <span className="font-mono text-[8px] text-gray-400 uppercase font-bold block">LINK DE VÍDEO DA MÚSICA:</span>
                <a href={data.video_link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-xs block font-mono truncate">{data.video_link}</a>
              </div>
            )}
            {data.photo_url && (
              <div className="col-span-1 md:col-span-2 space-y-1">
                <span className="font-mono text-[8px] text-gray-400 uppercase font-bold block">FOTO DE DIVULGAÇÃO ENVIADA:</span>
                <span className="text-xs font-mono text-gray-300 block">✓ {data.photo_url}</span>
              </div>
            )}
          </div>

          {/* RESPONSIBLE DETAILS */}
          {leader && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-white/5 pb-6">
              <div className="space-y-1">
                <span className="font-mono text-[8px] text-gray-400 uppercase font-bold block">LÍDER RESPONSÁVEL:</span>
                <span className="text-white font-bold text-xs block">{leader.name}</span>
              </div>
              <div className="space-y-1">
                <span className="font-mono text-[8px] text-gray-400 uppercase font-bold block">WHATSAPP:</span>
                <span className="text-white font-bold text-xs block font-mono">{leader.phone || '-'}</span>
              </div>
              <div className="space-y-1">
                <span className="font-mono text-[8px] text-gray-400 uppercase font-bold block">CPF LÍDER:</span>
                <span className="text-white font-bold text-xs block font-mono">{leader.cpf}</span>
              </div>
              {data.amount_paid !== undefined && (
                <div className="space-y-1">
                  <span className="font-mono text-[8px] text-gray-400 uppercase font-bold block">VALOR PAGO ({data.batch_name || 'LOTE'}):</span>
                  <span className="text-lime font-black text-xs block font-mono">R$ {data.amount_paid},00</span>
                </div>
              )}
            </div>
          )}

          {/* LINEUP MEMBER SHOWN AS TRACK ROWS */}
          <div className="space-y-4">
            <span className="font-mono text-[9px] text-[#F0C265] font-bold uppercase tracking-widest block">ROSTER DA BANDA (QUEUE DE INTEGRANTES)</span>
            
            <div className="space-y-3">
              {/* Leader Row */}
              {leader && (
                <div className="vst-input-groove p-3 flex justify-between items-center border border-[#F0C265]/20 bg-[#F0C265]/5">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#F0C265]/20 text-[#F0C265] flex items-center justify-center font-mono text-[9px] font-bold border border-[#F0C265]/35">1</span>
                    <div>
                      <span className="text-xs font-bold text-white block">{leader.name}</span>
                      <span className="font-mono text-[8px] text-gray-400 tracking-wider uppercase block mt-0.5">Líder Responsável • CPF: {leader.cpf}</span>
                    </div>
                  </div>
                  <span className="font-mono text-[8px] text-[#10B981] bg-[#10B981]/15 px-2.5 py-0.5 rounded border border-[#10B981]/25 uppercase font-bold tracking-wider">Líder</span>
                </div>
              )}

              {/* Regular Members Rows */}
              {regularMembers.map((m, i) => (
                <div key={i} className="vst-input-groove p-3 flex justify-between items-center border border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#E3B552]/10 text-[#F0C265] flex items-center justify-center font-mono text-[9px] font-bold border border-[#E3B552]/20">{i + 2}</span>
                    <div>
                      <span className="text-xs font-bold text-white block">{m.name}</span>
                      <span className="font-mono text-[8px] text-gray-400 tracking-wider uppercase block mt-0.5">Integrante {i + 2} • CPF: {m.cpf}</span>
                    </div>
                  </div>
                  <span className="font-mono text-[8px] text-[#10B981] bg-[#10B981]/15 px-2.5 py-0.5 rounded border border-[#10B981]/25 uppercase font-bold tracking-wider">Apto</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-5 text-center">
          <span className="font-mono text-[9px] text-[#5C5248] uppercase">QUALQUER INCONSISTÊNCIA CADASTRAL DEVE SER NOTIFICADA À DIREÇÃO DO Estúdio Pedra Profana.</span>
        </div>

      </div>
    </div>
  );
}
