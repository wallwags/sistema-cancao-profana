'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import gsap from 'gsap';
import { Settings, Music, Users, Shield } from 'lucide-react';
import Link from 'next/link';
import Navbar from '../../components/v2/Navbar';
import HeroCard from '../../components/v2/HeroCard';
import FeatureGrid from '../../components/v2/FeatureGrid';
import CountdownBar from '../../components/v2/CountdownBar';
import { TermsModal, PrivacyModal } from '../../components/v2/LegalModals';
import { supabase } from '../../lib/supabase';

// Quiz + checkout + success load on demand (keeps landing First Load JS lean)
const QuizFlow = dynamic(() => import('../../components/v2/QuizFlow'), { ssr: false });
const InviteSheet = dynamic(() => import('../../components/v2/InviteSheet'), { ssr: false });

interface LoteState {
  status: 'ativo' | 'encerrado' | 'em_breve';
  vagasRestantes: number;
  valor: number;
  desc: string;
}

interface LotesConfig {
  lote1: LoteState;
  lote2: LoteState;
  lote3: LoteState;
  live: {
    status: 'em_breve' | 'ao_vivo' | 'encerrada';
    horario: string;
  };
}

export default function Page() {
  const [lotesConfig, setLotesConfig] = useState<LotesConfig>({
    lote1: { status: 'ativo', vagasRestantes: 25, valor: 35, desc: 'Primeiras inscrições. Menor preço histórico.' },
    lote2: { status: 'em_breve', vagasRestantes: 30, valor: 40, desc: 'Disponível na fase intermediária.' },
    lote3: { status: 'em_breve', vagasRestantes: 30, valor: 45, desc: 'Reta final de inscrições regulamentares.' },
    live: { status: 'em_breve', horario: '2026-09-07T20:00:00' }
  });

  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Conteúdo editável pelo painel interno (com fallback igual ao visual atual)
  const [faqList, setFaqList] = useState([
    { q: 'Como é calculada a taxa de inscrição?', a: 'O valor de R$ 35 (do Lote 1 ativo) é cobrado por integrante cadastrado no grupo musical (mínimo 2, máximo 7). Ao preencher o quiz e definir o lineup final, o sistema calcula o valor total. Essa taxa garante toda a infraestrutura e a gravação de estúdio da live.' },
    { q: 'Quem pode participar do concurso?', a: 'O concurso é aberto a qualquer artista independente ou banda que apresente um repertório autoral (com pelo menos uma música escrita majoritariamente em português ou instrumental). A banda precisa ter no mínimo 2 e no máximo 7 integrantes ativos.' },
    { q: 'Como funciona o sistema de votação durante a live?', a: 'A votação possui três canais complementares de avaliação: 1. Voto dos Jurados (Índio, Naraiane e Matheus T dão notas de 0 a 10 nos critérios de Apresentação, Composição e Estética); 2. Voto da Equipe do Estúdio (Nota baseada no envolvimento); 3. Voto Popular (Computado logo após cada live sessions, onde o volume absoluto de votos destrava as vagas de avanço).' },
    { q: 'Quantas músicas posso inscrever no concurso?', a: 'Cada grupo pode inscrever um repertório de no máximo 3 músicas para se apresentar e gravar nas transmissões oficiais.' },
    { q: 'Qual é o prazo final para inscrição?', a: 'As inscrições do lote vigente terminam em [data-lote1]. Depois disso, o lote seguinte abre automaticamente, conforme o cronograma de lotes exibido na seção de investimento. Lote 2: [data-lote2]. Lote 3: [data-lote3].' },
    { q: 'Como recebo a confirmação da minha inscrição?', a: 'Assim que o Pix é validado, o status da sua matrícula aparece automaticamente no portal "Minha Inscrição", vinculado ao e-mail informado no cadastro. Leve o código do seu passe no dia da gravação.' },
    { q: 'O que acontece se eu me inscrever e não puder participar?', a: 'Caso ocorram imprevistos justificáveis, o grupo deve notificar a equipe de estúdio com no mínimo 5 dias de antecedência para realocação em novas datas sob disponibilidade. Em casos extremos, a inscrição pode ser transferida para outro projeto parceiro sob análise técnica.' },
    { q: 'Posso inscrever uma música em parceria ou coautoria?', a: 'Sim! Com certeza. Desde que a banda detranque os direitos autorais para as transmissões oficiais da gravação e pelo menos uma das faixas do repertório de 3 músicas seja de autoria e em língua portuguesa.' },
    { q: 'Como funciona cada fase do concurso?', a: 'O concurso possui 3 fases ativas: Etapa 1 (Transmissão ao Vivo): as bandas gravam ao vivo no estúdio e transmitem com arrecadação direta na tela. Etapa 2 (Podcast especial): as bandas selecionadas participam de um podcast de divulgação. Etapa 3 (Grande Final): Apresentação presencial ao vivo para o público e revelação dos vencedores pela média final de notas.' },
    { q: 'Quais são os prêmios e benefícios para os vencedores?', a: '1º lugar: EP de 5 faixas + clipe + fotos + distribuição; 2º lugar: 3 faixas + fotos; 3º lugar: 1 single.' }
  ]);
  const [countdownTarget, setCountdownTarget] = useState<string | null>(null);
  const [liveLaunch, setLiveLaunch] = useState<string | null>(null);
  const [liveUrl, setLiveUrl] = useState<string | null>(null);
  const [dia0Price, setDia0Price] = useState<number>(25);
  const [slotMode, setSlotMode] = useState<'band' | 'integrante'>('band');
  const [sheetCode, setSheetCode] = useState<string | null>(null);
  const [sheetStart, setSheetStart] = useState<'confirm' | 'pick'>('confirm');
  const [loteDates, setLoteDates] = useState<Record<string, string | null>>({});

  // Quiz modal: mounted on demand, kept mounted afterwards so state/draft persists
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [quizMounted, setQuizMounted] = useState(false);

  // Terms and Privacy footer popups
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  const headerRef = useRef<HTMLDivElement | null>(null);

  // Link de convite de integrante: ?b=codigo
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const b = (params.get('b') || '').replace(/[^a-z0-9]/g, '').slice(0, 12);
    if (b) { setSheetCode(b); setSheetStart('confirm'); }
  }, []);

  // Sync pricing configurations from Supabase on mount
  useEffect(() => {
    const fetchSupabaseConfig = async () => {
      try {
        const { data: batches } = await supabase
          .from('batches')
          .select('*')
          .order('created_at', { ascending: true });

        const { data: liveData } = await supabase
          .from('live_broadcast')
          .select('*')
          .eq('id', 1)
          .maybeSingle();

        const [settingsRes, faqRes] = await Promise.all([
          supabase.from('site_settings').select('key,value'),
          supabase.from('faq_items').select('question,answer,sort_order').eq('active', true).order('sort_order', { ascending: true })
        ]);

        if (settingsRes.data) {
          const map: Record<string, string> = {};
          settingsRes.data.forEach((r: { key: string; value: unknown }) => {
            map[r.key] = typeof r.value === 'string' ? r.value : String(r.value ?? '');
          });
          if (map.countdown_target) setCountdownTarget(map.countdown_target);
          if (map.live_launch) setLiveLaunch(map.live_launch);
          if (map.live_url) setLiveUrl(map.live_url);
          const dp = Number(map.dia0_price);
          const sm = map.slot_mode;
          if (sm === 'integrante') setSlotMode('integrante');
          if (!isNaN(dp) && dp > 0) setDia0Price(dp);
        }

        if (faqRes.data && faqRes.data.length > 0) {
          setFaqList(faqRes.data.map((f: { question: string; answer: string }) => ({ q: f.question, a: f.answer })));
        }

        if (batches && batches.length >= 3) {
          const b1 = batches[0];
          const b2 = batches[1];
          const b3 = batches[2];
          setLoteDates({ lote1: b1.ends_at ?? null, lote2: b2.ends_at ?? null, lote3: b3.ends_at ?? null });

          setLotesConfig({
            lote1: { status: b1.status, vagasRestantes: b1.vagas_restantes, valor: Number(b1.price_per_member), desc: 'Primeiras inscrições. Menor preço histórico.' },
            lote2: { status: b2.status, vagasRestantes: b2.vagas_restantes, valor: Number(b2.price_per_member), desc: 'Disponível na fase intermediária.' },
            lote3: { status: b3.status, vagasRestantes: b3.vagas_restantes, valor: Number(b3.price_per_member), desc: 'Reta final de inscrições regulamentares.' },
            live: { status: liveData ? liveData.status : 'em_breve', horario: '2026-09-07T20:00:00' }
          });
        }
      } catch (err) {
        console.error("Error fetching batches from Supabase:", err);
      }
    };

    fetchSupabaseConfig();
  }, []);

  const activePrice = lotesConfig.lote1.status === 'ativo' ? lotesConfig.lote1.valor : (lotesConfig.lote2.status === 'ativo' ? lotesConfig.lote2.valor : lotesConfig.lote3.valor);
  const activeLoteName = lotesConfig.lote1.status === 'ativo' ? 'LOTE 1' : (lotesConfig.lote2.status === 'ativo' ? 'LOTE 2' : 'LOTE 3');


  // Scroll FX engine — reveals de seção, grupos em stagger, linha da timeline
  // desenhando e barra de vagas animando ao entrarem na viewport (uma vez só).
  useEffect(() => {
    const revealEls = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    const groups = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal-group]'));
    const line = document.querySelector<HTMLElement>('[data-fx="timeline-line"]');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce || !('IntersectionObserver' in window)) {
      gsap.set('[data-reveal]', { opacity: 1, y: 0 });
      revealEls.forEach(() => undefined);
      groups.forEach((g) => gsap.set(g.querySelectorAll('.reveal-hidden'), { opacity: 1, y: 0 }));
      if (line) gsap.set(line, { scaleX: 1 });
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;

        if (el.hasAttribute('data-reveal')) {
          gsap.to(el, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' });
        } else if (el.hasAttribute('data-reveal-group')) {
          gsap.to(el.querySelectorAll('.reveal-hidden'), {
            opacity: 1, y: 0, duration: 0.55, stagger: 0.12, ease: 'power2.out'
          });
        } else if (el.dataset.fx === 'timeline-line') {
          gsap.fromTo(el, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'power2.inOut', transformOrigin: 'left center' });
        }

        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -80px 0px', threshold: 0 });

    [...revealEls, ...groups, ...(line ? [line] : [])].forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Open quiz instantly (no artificial loading) — chunk is code-split and pre-warmed on hover
  const preloadQuiz = () => {
    import('../../components/v2/QuizFlow');
  };

  const handleOpenQuiz = () => {
    if (lotesConfig.live.status === 'ao_vivo') return;
    setQuizMounted(true);
    setIsQuizOpen(true);
  };

  // Reflected locally when a payment is confirmed inside the quiz flow
  const handlePaymentSuccess = () => {
    setLotesConfig(prev => ({
      ...prev,
      lote1: {
        ...prev.lote1,
        vagasRestantes: Math.max(0, prev.lote1.vagasRestantes - 1)
      }
    }));
  };

  const resolveTags = (text: string): string => {
    const fmt = (iso?: string | null) => {
      const d = iso ? new Date(String(iso).replace(' ', 'T')) : null;
      if (!d || isNaN(d.getTime())) return 'a definir';
      return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }).format(d);
    };
    const activeBatch = lotesConfig.lote1.status === 'ativo' ? lotesConfig.lote1 : (lotesConfig.lote2.status === 'ativo' ? lotesConfig.lote2 : lotesConfig.lote3);
    return text
      .replaceAll('[data-lote1]', fmt(loteDates.lote1))
      .replaceAll('[data-lote2]', fmt(loteDates.lote2))
      .replaceAll('[data-lote3]', fmt(loteDates.lote3))
      .replaceAll('[data-live]', formatLaunch(liveLaunch))
      .replaceAll('[data-link-live]', liveUrl || 'em breve')
      .replaceAll('[data-preco-lote1]', `R$ ${lotesConfig.lote1.valor},00`)
      .replaceAll('[data-preco-lote2]', `R$ ${lotesConfig.lote2.valor},00`)
      .replaceAll('[data-preco-lote3]', `R$ ${lotesConfig.lote3.valor},00`)
      .replaceAll('[data-preco-dia0]', `R$ ${dia0Price},00`)
      .replaceAll('[data-vagas]', String(activeBatch.vagasRestantes));
  };

  const formatLaunch = (iso?: string | null): string => {
    const d = iso ? new Date(String(iso).replace(' ', 'T')) : null;
    if (!d || isNaN(d.getTime())) return '07 de setembro às 20:00';
    try {
      const dia = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', timeZone: 'America/Sao_Paulo' }).format(d);
      const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }).format(d);
      return `${dia} às ${hora}`;
    } catch {
      return '07 de setembro às 20:00';
    }
  };

  return (
    <div className="bg-[#05070B] text-[#F0EAE0] min-h-screen relative font-sans antialiased">

      {/* UNIFIED FIXED CONTAINER FOR COUNTDOWN AND NAVBAR — retrátil ao rolar */}
      <div ref={headerRef} className="fixed top-0 left-0 right-0 z-50 w-full bg-[#05070B]/95 backdrop-blur-md">
        <CountdownBar targetDate={countdownTarget} />
        <Navbar onOpenQuiz={handleOpenQuiz} />
      </div>

      {/* MAIN CONTAINER WITH FIXED NAVBAR ADJUSTMENT PT */}
      <main className="max-w-6xl mx-auto px-6 pt-32 sm:pt-40 pb-10 grow space-y-24 relative z-10">

        {/* HERO SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center">
          <div className="lg:col-span-7 space-y-4">
            <h1 className="fade-up-800 font-display font-black text-4xl sm:text-5xl lg:text-6xl text-white leading-[1.08] uppercase tracking-tightest">
              Grave seu som. Concorra à produção da sua <span className="bg-gradient-to-b from-[#FFF2D4] via-[#F0C265] to-[#B88A28] bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(240,194,101,0.45)]">carreira</span>.
            </h1>
            <p className="fade-up-800 [animation-delay:120ms] text-xs sm:text-sm md:text-base text-white/75 leading-relaxed max-w-xl font-normal">
              A maior vitrine de revelação musical autoral. Grave sua apresentação ao vivo com áudio e vídeo de alta fidelidade de graça e dispute uma produção completa de carreira que mudará sua história.
            </p>
            <div className="fade-up-800 [animation-delay:200ms] flex flex-wrap gap-x-5 gap-y-2 pt-2 text-[10px] sm:text-xs font-mono text-[#F0C265] uppercase tracking-widest font-black">
              <span>• AUTORAL PORTUGUÊS</span>
              <span>• TRANSMISSÃO DIGITAL</span>
              <span>• GRAVAÇÃO INCLUÍDA</span>
            </div>
            <div className="fade-up-800 [animation-delay:260ms] flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3">
              <button
                type="button"
                onClick={handleOpenQuiz}
                onMouseEnter={preloadQuiz}
                disabled={lotesConfig.live.status === 'ao_vivo'}
                className="btn-gold-shimmer px-8 py-3.5 rounded-full text-xs sm:text-sm uppercase tracking-widest font-black shadow-[0_0_30px_rgba(227,181,82,0.35)] w-full sm:w-auto text-center outline-none focus-visible:ring-2 focus-visible:ring-[#F0C265]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070B] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {lotesConfig.live.status === 'ao_vivo' ? 'Inscrições pausadas: Live no ar' : 'INSCREVER-SE'}
              </button>
              <a
                href="#premios"
                className="border border-white/10 hover:border-white/35 text-white font-mono text-sm font-bold uppercase tracking-widest px-8 py-3.5 rounded-full transition-colors text-center w-full sm:w-auto outline-none focus-visible:ring-2 focus-visible:ring-[#F0C265]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070B]"
              >
                Conhecer prêmios
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 relative flex justify-center mt-4 lg:mt-0">
            <div className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 rounded-[32px] p-5 sm:p-6 w-full max-w-sm space-y-4 relative overflow-hidden shadow-2xl">
              <div className="w-full aspect-square rounded-2xl overflow-hidden border border-white/10 relative">
                <Image
                  src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=600&q=80"
                  alt="Gravação ao vivo"
                  fill
                  priority
                  sizes="(max-width: 1024px) 90vw, 380px"
                  className="object-cover grayscale brightness-90"
                />
                <span className="absolute top-3 left-3 bg-[#F0C265] text-black font-mono text-xs uppercase tracking-widest px-3 py-1 rounded border border-black font-bold">
                  STUDIO LIVE
                </span>
              </div>
              <div className="space-y-2">
                <span className="font-mono text-[#F0C265] text-xs tracking-wider uppercase block font-bold">
                  OPORTUNIDADE ÚNICA (1º LUGAR)
                </span>
                <h3 className="font-display font-bold text-base sm:text-lg text-white uppercase leading-tight">
                  EP de 5 Faixas no Bolso
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed font-normal">
                  Produção completa de EP (5 músicas autorais), mixagem/masterização profissional, gravação de webclipe de estúdio, fotos artísticas e distribuição fonográfica garantida.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* B. AS 3 REGRAS DE MATRÍCULA */}
        <section id="principios" className="space-y-12">
          <div data-reveal className="reveal-hidden space-y-2 border-b border-white/5 pb-4">
            <span className="text-xs sm:text-sm uppercase tracking-widest font-bold text-[#F0C265] block font-mono">
              # REGRAS INVIOLÁVEIS DO CONCURSO
            </span>
            <h2 className="font-display font-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white uppercase tracking-tight">
              AS 3 REGRAS DE MATRÍCULA
            </h2>
          </div>
          <div data-reveal-group className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="reveal-hidden bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 hover:border-[#E3B552]/30 rounded-2xl p-6 space-y-4 shadow-lg transition-colors">
              <span className="font-display font-black text-5xl text-[#F0C265] block select-none">01</span>
              <h3 className="font-display font-bold text-lg text-white uppercase">Repertório & Música Autoral</h3>
              <p className="text-sm text-gray-300">
                Seu repertório deve ter no máximo 3 músicas, com pelo menos uma música original (autoral) escrita majoritariamente em português ou instrumental.
              </p>
            </div>
            <div className="reveal-hidden bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 hover:border-[#E3B552]/30 rounded-2xl p-6 space-y-4 shadow-lg transition-colors">
              <span className="font-display font-black text-5xl text-[#F0C265] block select-none">02</span>
              <h3 className="font-display font-bold text-lg text-white uppercase">Alinhamento de Lineup</h3>
              <p className="text-sm text-gray-300">
                As apresentações e gravações devem ser compostas por grupos contendo no mínimo 2 e no máximo 7 integrantes por projeto.
              </p>
            </div>
            <div className="reveal-hidden bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 hover:border-[#E3B552]/30 rounded-2xl p-6 space-y-4 shadow-lg transition-colors">
              <span className="font-display font-black text-5xl text-[#F0C265] block select-none">03</span>
              <h3 className="font-display font-bold text-lg text-white uppercase">Compromisso Solidário</h3>
              <p className="text-sm text-gray-300">
                Entrega física obrigatória de 1kg (um quilo) de alimento não-perecível por integrante na entrada de cada etapa regulamentar.
              </p>
            </div>
          </div>
        </section>

        {/* NEW INFOGRAPHIC SECTION: REGRA DE FORMAÇÃO DO GRUPO (Roster Rule) */}
        <section id="formacao" className="space-y-12">
          <div data-reveal className="reveal-hidden space-y-2 border-b border-white/5 pb-4">
            <span className="text-xs sm:text-sm uppercase tracking-widest font-bold text-[#F0C265] block font-mono"># REGRA DE FORMAÇÃO DE GRUPO</span>
            <h2 className="font-display font-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white uppercase tracking-tight">COMO DEVE SER SUA FORMAÇÃO?</h2>
          </div>

          {/* Premium Infographic Banner Box */}
          <div data-reveal className="reveal-hidden bg-gradient-to-r from-[#8B1E1E]/20 via-[#0B0F19]/80 to-[#8B1E1E]/20 border border-white/10 py-6 px-8 rounded-3xl text-center space-y-3 shadow-lg">
            <h3 className="font-mono text-xs text-[#F0C265] font-black uppercase tracking-widest">DIRETRIZ DE INTEGRANTES DO PALCO</h3>
            <div className="flex flex-wrap justify-center items-center gap-4 text-white font-display font-black text-xl sm:text-2xl md:text-3xl">
              <span>MÍNIMO DE 2 INTEGRANTES</span>
              <span className="text-[#F0C265]">•</span>
              <span>MÁXIMO DE 7 INTEGRANTES</span>
            </div>
            <p className="text-xs text-[#F0EAE0]/60 max-w-2xl mx-auto leading-relaxed">
              Para garantir a segurança física, qualidade acústica e colaboração mútua nas apresentações gravadas nos estúdios da Pedra Profana, as regras abaixo de lineup são estritas. Não são permitidos projetos solo sem acompanhantes.
            </p>
          </div>

          <div data-reveal-group className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div className="reveal-hidden bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 p-6 rounded-2xl space-y-3 shadow-lg hover:border-[#F0C265]/40 transition-all duration-300">
              <div className="w-10 h-10 rounded bg-[#E3B552]/10 border border-[#E3B552]/30 flex items-center justify-center text-[#F0C265]">
                <Music className="w-5 h-5 stroke-[2.2]" />
              </div>
              <h4 className="font-display font-bold text-md text-white uppercase">Duplas de Rap / Hip-Hop</h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                Se você é um <strong>MC de Rap</strong>, deve se juntar obrigatoriamente a um <strong>beatmaker/DJ</strong> e vice-versa. O festival fomenta a união criativa e a produção colaborativa real.
              </p>
            </div>

            <div className="reveal-hidden bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 p-6 rounded-2xl space-y-3 shadow-lg hover:border-[#F0C265]/40 transition-all duration-300">
              <div className="w-10 h-10 rounded bg-[#E3B552]/10 border border-[#E3B552]/30 flex items-center justify-center text-[#F0C265]">
                <Users className="w-5 h-5 stroke-[2.2]" />
              </div>
              <h4 className="font-display font-bold text-md text-white uppercase">Cantores Solo & Duos</h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                Se você é <strong>cantor(a) solo</strong>, deve se unir a alguém que <strong>toque algum instrumento</strong> (violão, teclado, guitarra, etc.). Não são aceitas apresentações solo puramente acapela.
              </p>
            </div>

            <div className="reveal-hidden bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 p-6 rounded-2xl space-y-3 shadow-lg hover:border-[#F0C265]/40 transition-all duration-300">
              <div className="w-10 h-10 rounded bg-[#E3B552]/10 border border-[#E3B552]/30 flex items-center justify-center text-[#F0C265]">
                <Shield className="w-5 h-5 stroke-[2.2]" />
              </div>
              <h4 className="font-display font-bold text-md text-white uppercase">Bandas & Coletivos</h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                Para bandas completas de rock, metal, pop ou coletivos de música, o limite de palco regulamentar estrito é de no máximo 7 integrantes por apresentação ao vivo no estúdio.
              </p>
            </div>

          </div>
        </section>

        {/* C. FASES DO CONCURSO (Timeline) */}
        <section id="cronograma" className="space-y-12">
          <div data-reveal className="reveal-hidden space-y-2 border-b border-white/5 pb-4">
            <span className="text-xs sm:text-sm uppercase tracking-widest font-bold text-[#F0C265] block font-mono">
              # FLUXO DO PROCESSO
            </span>
            <h2 className="font-display font-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white uppercase tracking-tight">
              FASES DE EXECUÇÃO DO CONCURSO
            </h2>
          </div>
          <div data-reveal-group className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            <div data-fx="timeline-line" className="hidden md:block absolute top-1/2 left-0 right-0 h-[1.5px] bg-white/5 z-0 will-change-transform"></div>
            {[
              { f: 'F1', t: 'Inscrição Expressa', d: 'Matrícula no Quiz, lineup e upload da foto de divulgação.' },
              { f: 'F2', t: 'Transmissão ao Vivo', d: 'Gravação no estúdio com live e QR code para arrecadação.' },
              { f: 'F3', t: 'Mídias Ativas', d: 'Podcast especial de apresentação e abertura de voto popular.' },
              { f: 'F4', t: 'Grande Final', d: 'Apresentação presencial e revelação dos vencedores pela média final.' }
            ].map((p, i) => (
              <div key={i} className="reveal-hidden bg-[#05070B] border border-white/5 p-5 rounded-xl space-y-3 relative z-10">
                <div className="flex justify-between items-center">
                  <span className="bg-[#121215] text-white font-mono text-sm uppercase px-2.5 py-1 rounded font-bold border border-white/10">{p.f}</span>
                  <span className="font-mono text-sm md:text-base text-gray-400 uppercase tracking-wider">Etapa</span>
                </div>
                <h4 className="font-display font-bold text-md text-white uppercase">{p.t}</h4>
                <p className="text-sm text-gray-300 leading-relaxed">{p.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* E. DELIVERABLES GRAPH FEATURE GRID - PLACED ABOVE PRICING */}
        <section id="premios" className="space-y-12">
          <div data-reveal className="reveal-hidden space-y-2 border-b border-white/5 pb-4">
            <span className="text-xs sm:text-sm uppercase tracking-widest font-bold text-[#F0C265] block font-mono">
              # VITRINE DE ENTREGÁVEIS
            </span>
            <h2 className="font-display font-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white uppercase tracking-tight">
              O QUE ESTÁ EM JOGO
            </h2>
          </div>

          {/* Staggered Grid Deliverables */}
          <FeatureGrid />

          {/* Hero Premium Card - Rendered below items as requested */}
          <HeroCard />
        </section>

        {/* D. LOTES TABLE WITH CONFIG STATES */}
        <section id="lotes" className="space-y-12">
          <div data-reveal className="reveal-hidden space-y-4 border-b border-white/5 pb-4">
            <span className="text-xs sm:text-sm uppercase tracking-widest font-bold text-[#F0C265] block font-mono">
              # INVESTIMENTO E CRONOGRAMA DE PREÇOS
            </span>
            <h2 className="font-display font-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white uppercase tracking-tight">
              TABELA PROGRESSIVA DE LOTES
            </h2>

            {/* Live Status banner simulation */}
            {lotesConfig.live.status === 'ao_vivo' && (
              <div className="py-4 px-6 rounded-2xl border-2 border-red-500 bg-red-950/20 text-red-500 flex flex-col sm:flex-row justify-between items-center gap-4 animate-pulse">
                <span className="font-mono text-sm md:text-base font-black tracking-widest uppercase">🔴 TRANSMISSÃO AO VIVO AGORA</span>
                {liveUrl
                  ? <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="bg-red-600 hover:bg-red-500 text-white font-mono text-sm font-bold uppercase px-5 py-2 rounded-xl border border-black shadow">ASSISTIR LIVE</a>
                  : <span className="bg-red-600/40 text-white/70 font-mono text-sm font-bold uppercase px-5 py-2 rounded-xl border border-black/40">ASSISTIR LIVE</span>}
              </div>
            )}
            {lotesConfig.live.status === 'em_breve' && (
              <div className="py-4 px-6 rounded-2xl border-2 border-[#8B1E1E] bg-[#8B1E1E]/10 text-[#FF4B2E] flex items-center justify-center sm:justify-start gap-3 w-full shadow-[0_0_15px_rgba(139,30,30,0.15)]">
                {/* Yellow pulsating dot from countdown */}
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F0C265] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F0C265]"></span>
                </span>
                <span className="font-mono text-xs sm:text-sm md:text-base font-black tracking-widest uppercase text-[#FF4B2E]">
                  Lançamento oficial: {formatLaunch(liveLaunch)}
                </span>
              </div>
            )}
            {lotesConfig.live.status === 'encerrada' && (
              <div className="py-4 px-6 rounded-2xl border-2 border-white/5 bg-[#0B0F19]/60 text-gray-400 flex flex-col sm:flex-row justify-between items-center gap-4">
                <span className="font-mono text-sm md:text-base font-black tracking-widest uppercase">LIVE SESSIONS FINALIZADA • REPLAYS DISPONÍVEIS</span>
                <button className="border border-white/10 text-white font-mono text-sm font-bold px-4 py-2 rounded-xl">VER REPLAY</button>
              </div>
            )}
          </div>

          {/* DIA 0 — faixa discreta de decisao */}
          {lotesConfig.live.status !== 'encerrada' && (
            <div data-reveal className={`reveal-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 rounded-2xl px-5 py-4 border transition-all duration-500 ${
              lotesConfig.live.status === 'ao_vivo'
                ? 'border-[#F0C265]/60 bg-[#0B0F19]/90 shadow-[0_0_25px_rgba(240,194,101,0.2)]'
                : 'border-white/10 bg-[#0B0F19]/60'
            }`}>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className={`font-mono text-[11px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                  lotesConfig.live.status === 'ao_vivo'
                    ? 'bg-red-600 text-white border-black animate-pulse'
                    : 'bg-[#F0C265]/10 text-[#F0C265] border-[#F0C265]/30'
                }`}>
                  {lotesConfig.live.status === 'ao_vivo' ? '🔴 AO VIVO' : '🔴 DIA 0'}
                </span>
                <span className="font-mono text-xs text-gray-300">{formatLaunch(liveLaunch)}</span>
                <span className="font-display font-black text-lg text-[#F0C265]">R$ {dia0Price},00</span>
                <span className="font-mono text-[11px] text-gray-400 uppercase tracking-wider">Inscrição apenas durante a transmissão</span>
              </div>
              {lotesConfig.live.status === 'ao_vivo' && (
                <div className="flex gap-2.5">
                  {liveUrl && (
                    <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-xl border border-black transition-colors">
                      Assistir
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={handleOpenQuiz}
                    onMouseEnter={preloadQuiz}
                    className="btn-gold-shimmer px-4 py-2 rounded-xl text-xs uppercase tracking-widest font-black"
                  >
                    Inscrever no Dia 0
                  </button>
                </div>
              )}
            </div>
          )}

          <div data-reveal-group className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { key: 'dia0', title: 'Dia 0 (Live)', status: lotesConfig.live.status === 'ao_vivo' ? 'ativo' : lotesConfig.live.status === 'encerrada' ? 'encerrado' : 'em_breve', desc: 'Apenas durante a transmissão ao vivo.', valor: dia0Price },
              { key: 'lote1', title: 'Lote 1', status: lotesConfig.lote1.status, desc: 'Primeiras inscrições. Menor preço histórico.', valor: lotesConfig.lote1.valor, vagas: lotesConfig.lote1.vagasRestantes },
              { key: 'lote2', title: 'Lote 2', status: lotesConfig.lote2.status, desc: 'Disponível na fase intermediária.', valor: lotesConfig.lote2.valor, vagas: lotesConfig.lote2.vagasRestantes },
              { key: 'lote3', title: 'Lote 3', status: lotesConfig.lote3.status, desc: 'Reta final de inscrições regulamentares.', valor: lotesConfig.lote3.valor, vagas: lotesConfig.lote3.vagasRestantes }
            ].map((l, i) => {
              const isActive = l.status === 'ativo';
              const isClosed = l.status === 'encerrado';
              const isComing = l.status === 'em_breve';
              return (
                <div
                  key={i}
                  className={`reveal-hidden bg-[#0B0F19]/60 backdrop-blur-xl border-2 rounded-[24px] p-5 flex flex-col justify-between shadow transition-all duration-300 ${
                    isActive
                      ? 'border-[#10B981] scale-[1.02] shadow-[0_0_20px_rgba(16,185,129,0.15)] bg-[#0B0F19]/90'
                      : (l.key === 'dia0' && lotesConfig.live.status === 'encerrada')
                        ? 'border-white/5 opacity-30 bg-[#0B0F19]/20'
                        : l.key === 'dia0'
                          ? 'border-[#F0C265]/50 bg-[#0B0F19]/85'
                          : 'border-white/5 opacity-50 bg-[#0B0F19]/30'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <h4 className="font-display font-bold text-md text-white uppercase">{l.title}</h4>
                      {isActive && (
                        <span className="bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 text-[10px] font-bold px-2.5 py-1 rounded font-mono uppercase tracking-wider">
                          VIGENTE
                        </span>
                      )}
                      {isClosed && (
                        <span className="bg-[#121215] text-gray-500 text-[10px] font-bold px-2.5 py-1 rounded font-mono border border-white/5">
                          ENCERRADO
                        </span>
                      )}
                      {isComing && (
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded font-mono uppercase tracking-wider ${
                          l.key === 'dia0'
                            ? 'bg-[#F0C265] text-black border border-black animate-pulse'
                            : 'bg-[#121215] text-gray-500 border border-white/5'
                        }`}>
                          EM BREVE
                        </span>
                      )}
                    </div>
                    {l.key === 'dia0' ? (
                      <div className="space-y-2 text-left mt-2">
                        <div className="flex items-center gap-1.5 text-xs text-red-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse shrink-0"></span>
                          <span>Só para quem assistir ao vivo;</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-600 shrink-0"></span>
                          <span>Live no YouTube;</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-[#F0C265]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#F0C265] shrink-0"></span>
                          <span>Preço exclusivo de lançamento;</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-[#F0C265]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#F0C265] shrink-0"></span>
                          <span>Vagas limitadas à transmissão;</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-300 leading-normal">{l.desc}</p>
                    )}

                    {l.vagas !== undefined && (
                      <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                        <div className="flex justify-between items-center">
                          <span className={`font-mono text-[11px] block font-bold uppercase tracking-wider ${isActive ? 'text-gray-200' : 'text-gray-400'}`}>Vagas restantes</span>
                          <span className={`font-display font-black text-base ${isActive ? 'text-[#10B981]' : 'text-gray-300'}`}>{l.vagas}</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden flex items-center">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${isActive ? 'from-[#10B981] to-[#34D399]' : 'from-[#F0C265]/70 to-[#B88A28]/70'}`}
                            style={{ width: `${Math.min(100, Math.max(3, (l.vagas / 10) * 100))}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-white/5 pt-4 flex justify-between items-baseline mt-4">
                    {isActive ? (
                      <span className="text-xs font-mono text-[#10B981] font-bold uppercase tracking-wider">
                        + 1kg Alimento
                      </span>
                    ) : (
                      <span className="text-sm"></span>
                    )}
                    <span className={`text-2xl font-display font-black ${isActive ? 'text-[#10B981]' : 'text-white'}`}>
                      R$ {l.valor},00
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-center font-mono text-xs text-gray-500 tracking-wider">
            {slotMode === 'integrante'
              ? 'Vagas individuais: cada integrante paga a própria parte pelo preço do lote vigente.'
              : 'Vagas por banda/projeto: preço travado para todos os integrantes no valor do lote de origem.'}
          </p>

          <div className="pt-4 text-center">
            <button
              onClick={handleOpenQuiz}
              onMouseEnter={preloadQuiz}
              disabled={lotesConfig.live.status === 'ao_vivo'}
              className="btn-gold-shimmer px-10 py-4 rounded-2xl text-md shadow-[0_0_30px_rgba(240,194,101,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {lotesConfig.live.status === 'ao_vivo' ? 'Inscrições pausadas: Live no ar' : 'Garantir Inscrição Lote 1'}
            </button>
          </div>
        </section>

        {/* F. FAQ ACCORDION SECTION */}
        <section id="faq" className="space-y-12">
          <div data-reveal className="reveal-hidden space-y-2 border-b border-white/5 pb-4">
            <span className="text-xs sm:text-sm uppercase tracking-widest font-bold text-[#F0C265] block font-mono">
              # PERGUNTAS FREQUENTES
            </span>
            <h2 className="font-display font-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white uppercase tracking-tight">
              DÚVIDAS FREQUENTES
            </h2>
          </div>

          <div data-reveal-group className="space-y-4 max-w-4xl mx-auto">
            {faqList.map((f, i) => (
              <div
                key={i}
                className="reveal-hidden bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 rounded-xl p-5 sm:p-6 cursor-pointer hover:border-[#E3B552]/40 transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#F0C265]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070B]"
                onClick={() => setActiveFaq(activeFaq === i ? null : i)}
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-display font-bold text-white text-sm md:text-md uppercase tracking-wide">
                    {f.q}
                  </h3>
                  <span className="text-[#F0C265] font-bold text-md leading-none">
                    {activeFaq === i ? '−' : '+'}
                  </span>
                </div>
                <div className={`faq-collapse ${activeFaq === i ? 'faq-open' : ''}`}>
                  <div>
                    <p className="text-sm text-gray-300 mt-3 leading-relaxed border-t border-white/5 pt-3 font-normal">
                      {resolveTags(f.a)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="bg-[#030407] border-t border-white/5 py-10 px-6 mt-16 text-center text-sm font-mono text-gray-400 uppercase tracking-widest relative z-20">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-4">
          <div>
            Estúdio Pedra Profana © 2026 • Todos os Direitos Reservados.
          </div>
          <div className="flex items-center gap-4 text-xs">
            <button type="button" onClick={() => setIsTermsOpen(true)} className="hover:text-white transition-colors font-semibold">Termos de Uso</button>
            <span className="text-white/20">•</span>
            <button type="button" onClick={() => setIsPrivacyOpen(true)} className="hover:text-white transition-colors font-semibold">Privacidade</button>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <Link href="/sagrado" className="text-[#8B6F47] hover:text-[#F0C265] transition-colors" title="Painel Admin">
              <Settings className="w-4 h-4" />
            </Link>
            <span>Sistema criado por <a href="https://instagram.com/ww.wagner" target="_blank" rel="noopener noreferrer" className="text-[#D4A843] hover:text-[#E8C06B] transition-colors font-bold">@ww.wagner</a></span>
          </div>
        </div>
      </footer>

      {/* QUIZ + CHECKOUT + SUCCESS — code-split, loads only when opened */}
      {quizMounted && (
        <QuizFlow
          isOpen={isQuizOpen}
          onClose={() => setIsQuizOpen(false)}
          onJoinBand={(code) => { setSheetCode(code); setSheetStart('pick'); }}
          activePrice={activePrice}
          activeLoteName={activeLoteName}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* CONVITE DE INTEGRANTE — bottom sheet sobre a landing */}
      {sheetCode && (
        <InviteSheet inviteCode={sheetCode} startPhase={sheetStart} onClose={() => setSheetCode(null)} />
      )}

      {/* Legal popups (footer) — CSS-animated, zero JS cost when closed */}
      <TermsModal open={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
      <PrivacyModal open={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />

    </div>
  );
}
