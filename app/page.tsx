'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Settings, Music, Video, Camera, Globe, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import HeroCard from '../components/HeroCard';
import FeatureGrid from '../components/FeatureGrid';

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
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [quizStep, setQuizStep] = useState(1);
  
  // Quiz form states
  const [projectName, setProjectName] = useState('');
  const [projectStyle, setProjectStyle] = useState('');
  const [projectBio, setProjectBio] = useState('');
  const [projectPhotoName, setProjectPhotoName] = useState<string | null>(null);
  const [respName, setRespName] = useState('');
  const [respCpf, setRespCpf] = useState('');
  const [respBirth, setRespBirth] = useState('');
  const [respPhone, setRespPhone] = useState('');
  const [selectedMembers, setSelectedMembers] = useState(2);
  const [membersList, setMembersList] = useState<Array<{ name: string; cpf: string; birth: string }>>([]);
  const [acceptRules, setAcceptRules] = useState(false);

  // Popups states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  // Ticking countdown (Sep 14, 2026 23:59:00 Lote 1 close)
  const [timeLeft, setTimeLeft] = useState({ days: '33', hours: '13', minutes: '10', seconds: '00' });

  useEffect(() => {
    const targetDate = new Date("2026-09-14T23:59:00").getTime();
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        clearInterval(timer);
        setTimeLeft({ days: '00', hours: '00', minutes: '00', seconds: '00' });
        return;
      }

      const d = Math.floor(difference / (1000 * 60 * 60 * 24));
      const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({
        days: d < 10 ? `0${d}` : d.toString(),
        hours: h < 10 ? `0${h}` : h.toString(),
        minutes: m < 10 ? `0${m}` : m.toString(),
        seconds: s < 10 ? `0${s}` : s.toString()
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Sync additional members lists based on selection
  useEffect(() => {
    const additionalCount = selectedMembers - 1;
    if (membersList.length < additionalCount) {
      const copy = [...membersList];
      while (copy.length < additionalCount) {
        copy.push({ name: '', cpf: '', birth: '' });
      }
      setMembersList(copy);
    } else if (membersList.length > additionalCount) {
      setMembersList(membersList.slice(0, additionalCount));
    }
  }, [selectedMembers]);

  const activePrice = lotesConfig.lote1.status === 'ativo' ? lotesConfig.lote1.valor : (lotesConfig.lote2.status === 'ativo' ? lotesConfig.lote2.valor : lotesConfig.lote3.valor);
  const activeLoteName = lotesConfig.lote1.status === 'ativo' ? 'LOTE 1' : (lotesConfig.lote2.status === 'ativo' ? 'LOTE 2' : 'LOTE 3');
  const totalCost = selectedMembers * activePrice;

  const handleOpenQuiz = () => {
    setIsQuizOpen(true);
    setQuizStep(1);
  };

  const handleQuizNext = () => {
    if (quizStep === 1 && (!projectName || !projectStyle)) {
      alert('Por favor, preencha todos os campos obrigatórios.'); return;
    }
    if (quizStep === 2 && (!projectBio || !projectPhotoName)) {
      alert('Por favor, complete a biografia e envie a foto oficial.'); return;
    }
    if (quizStep === 3 && (!respName || respCpf.length < 14 || respBirth.length < 10 || respPhone.length < 14)) {
      alert('Por favor, complete as credenciais do responsável de forma válida.'); return;
    }
    if (quizStep === 4) {
      for (let i = 0; i < membersList.length; i++) {
        if (!membersList[i].name || membersList[i].cpf.length < 14 || membersList[i].birth.length < 10) {
          alert(`Por favor, preencha todos os dados obrigatórios do Integrante ${i+2}.`); return;
        }
      }
    }
    setQuizStep(quizStep + 1);
  };

  const handleMemberFieldChange = (index: number, field: string, value: string) => {
    const copy = [...membersList];
    copy[index] = { ...copy[index], [field]: value };
    setMembersList(copy);
  };

  const addQuizMember = () => {
    if (selectedMembers >= 7) {
      alert("O limite máximo do regulamento é de 7 integrantes por projeto.");
      return;
    }
    setSelectedMembers(selectedMembers + 1);
  };

  const removeQuizMember = (index: number) => {
    if (selectedMembers <= 2) {
      alert("O limite mínimo do regulamento é de 2 integrantes por projeto.");
      return;
    }
    setSelectedMembers(selectedMembers - 1);
    const copy = [...membersList];
    copy.splice(index, 1);
    setMembersList(copy);
  };

  const handleLaunchCheckout = () => {
    if (!acceptRules) {
      alert('Declare concordar com as regras regulamentares para prosseguir.'); return;
    }
    setIsQuizOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleSimulateWebhook = () => {
    setIsCheckoutLoading(true);
    setTimeout(() => {
      setIsCheckoutOpen(false);
      setIsCheckoutLoading(false);
      setIsSuccessOpen(true);
    }, 2000);
  };

  const handleBypassClear = () => {
    if (confirm('Deseja redefinir todo o chassi e limpar o formulário?')) {
      setProjectName('');
      setProjectStyle('');
      setProjectBio('');
      setProjectPhotoName(null);
      setRespName('');
      setRespCpf('');
      setRespBirth('');
      setRespPhone('');
      setSelectedMembers(2);
      setAcceptRules(false);
      setQuizStep(1);
    }
  };

  const applyCpfMask = (val: string) => {
    let value = val.replace(/\D/g, "");
    if (value.length > 11) value = value.substring(0, 11);
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    return value;
  };

  const applyDateMask = (val: string) => {
    let value = val.replace(/\D/g, "");
    if (value.length > 8) value = value.substring(0, 8);
    value = value.replace(/(\d{2})(\d)/, "$1/$2");
    value = value.replace(/(\d{2})(\d)/, "$1/$2");
    return value;
  };

  const applyPhoneMask = (val: string) => {
    let value = val.replace(/\D/g, "");
    if (value.length > 11) value = value.substring(0, 11);
    if (value.length > 10) {
      value = value.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
    } else if (value.length > 5) {
      value = value.replace(/^(\d{2})(\d{4})(\d{0,4})$/, "($1) $2-$3");
    } else if (value.length > 2) {
      value = value.replace(/^(\d{2})(\d{0,5})$/, "($1) $2");
    } else {
      value = value.replace(/^(\d*)$/, "($1");
    }
    return value;
  };

  const faqs = [
    { q: 'Como é calculada a taxa de inscrição?', a: 'O valor de R$ 35 (do Lote 1 ativo) é cobrado por integrante cadastrado no grupo musical (mínimo 2, máximo 7). Ao preencher o quiz e definir o lineup final, o sistema calcula o valor total. Essa taxa garante toda a infraestrutura e a gravação de estúdio da live.' },
    { q: 'Quem pode participar do concurso?', a: 'O concurso é aberto a qualquer artista independente ou banda que apresente um repertório autoral (com pelo menos uma música escrita majoritariamente em português ou instrumental). A banda precisa ter no mínimo 2 e no máximo 7 integrantes ativos.' },
    { q: 'Como funciona o sistema de votação durante a live?', a: 'A votação possui três canais complementares de avaliação: 1. Voto dos Jurados (Índio, Naraiane e Matheus T dão notas de 0 a 10 nos critérios de Apresentação, Composição e Estética); 2. Voto da Equipe do Estúdio (Nota baseada no envolvimento); 3. Voto Popular (Computado logo após cada live sessions, onde o volume absoluto de votos destrava as vagas de avanço).' },
    { q: 'Quantas músicas posso inscrever no concurso?', a: 'Cada grupo pode inscrever um repertório de no máximo 3 músicas para se apresentar e gravar nas transmissões oficiais.' },
    { q: 'Qual é o prazo final para inscrição?', a: 'A campanha completa de captação dura no máximo 28 dias. O Lote 1 vigora nos primeiros 10 dias de abertura; o Lote 2 nos dias 11 a 20; e o Lote 3 estende-se do dia 21 até o encerramento do prazo regulamentar.' },
    { q: 'Como recebo a confirmação da minha inscrição?', a: 'Logo após a validação segura do pagamento PIX por nosso sistema de webhook, você receberá um e-mail transacional de confirmação com os detalhes da sua inscrição e as diretrizes completas de estúdio.' },
    { q: 'O que acontece se eu me inscrever e não puder participar?', a: 'Caso ocorram imprevistos justificáveis, o grupo deve notificar a equipe de estúdio com no mínimo 5 dias de antecedência para realocação em novas datas sob disponibilidade. Em casos extremos, a inscrição pode ser transferida para outro projeto parceiro sob análise técnica.' },
    { q: 'Posso inscrever uma música em parceria ou coautoria?', a: 'Sim! Com certeza. Desde que a banda detranque os direitos autorais para as transmissões oficiais da gravação e pelo menos uma das faixas do repertório de 3 músicas seja de autoria e em língua portuguesa.' },
    { q: 'Como funciona cada fase do concurso?', a: 'O concurso possui 3 fases ativas: Etapa 1 (Transmissão ao Vivo): as bandas gravam ao vivo no estúdio e transmitem com arrecadação direta na tela. Etapa 2 (Podcast especial): as bandas selecionadas participam de um podcast de divulgação. Etapa 3 (Grande Final): Apresentação presencial ao vivo para o público e revelação dos vencedores pela média final de notas.' },
    { q: 'Quais são os prêmios e benefícios para os vencedores?', a: '1º lugar: EP de 5 faixas + clipe + fotos + distribuição; 2º lugar: 3 faixas + fotos; 3º lugar: 1 single.' }
  ];

  return (
    <div className="bg-[#05070B] text-[#F0EAE0] min-h-screen relative font-sans antialiased">
      
      {/* A. DYNAMIC COUNTDOWN TOP BAR */}
      <div className="sticky top-0 z-50 w-full bg-[#8B1E1E] py-2 px-4 flex justify-center items-center gap-2 md:gap-3 select-none text-center text-xs md:text-sm leading-none border-b border-white/5 shadow-md">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_8px_#FF4B2E] animate-ping shrink-0"></span>
        <span className="font-mono text-[#F0EAE0] font-bold uppercase tracking-wider">Lote 1 ativo até:</span>
        
        {/* Dynamic ticking countdown capsule */}
        <div className="bg-[#0F0D0B] px-3.5 py-1.5 rounded-full font-mono font-black text-[#8B1E1E] tracking-widest flex items-center gap-1 shadow-inner border border-white/5">
          <span className="text-[#8B1E1E] font-bold">{timeLeft.days}</span><span className="text-[#8B1E1E]/50 text-[10px]">D</span> : 
          <span className="text-[#8B1E1E] font-bold">{timeLeft.hours}</span><span className="text-[#8B1E1E]/50 text-[10px]">H</span> : 
          <span className="text-[#8B1E1E] font-bold">{timeLeft.minutes}</span><span className="text-[#8B1E1E]/50 text-[10px]">M</span> : 
          <span className="text-[#8B1E1E] font-bold">{timeLeft.seconds}</span><span className="text-[#8B1E1E]/50 text-[10px]">S</span>
        </div>
      </div>

      {/* HEADER NAVBAR */}
      <Navbar onOpenQuiz={handleOpenQuiz} />

      {/* MAIN CONTAINER */}
      <main className="max-w-6xl mx-auto px-6 py-10 grow space-y-24 relative z-10">
        
        {/* HERO SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <h1 className="font-display font-black text-4xl md:text-5xl lg:text-6xl text-white leading-none uppercase tracking-tight">
              Grave seu som. Concorra à produção da sua <span className="bg-gradient-to-b from-[#FFF2D4] via-[#F0C265] to-[#B88A28] bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(240,194,101,0.45)]">carreira</span>.
            </h1>
            <p className="text-base md:text-lg text-gray-300 leading-relaxed max-w-xl font-normal">
              A maior vitrine de revelação musical autoral. Grave sua apresentação ao vivo com áudio e vídeo de alta fidelidade de graça e dispute uma produção completa de carreira que mudará sua história.
            </p>
            <div className="flex flex-wrap gap-4 pt-2 text-sm font-mono text-gray-400 uppercase tracking-wider">
              <span>• AUTORAL PORTUGUÊS</span>
              <span>• TRANSMISSÃO DIGITAL</span>
              <span>• GRAVAÇÃO INCLUÍDA</span>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
              <button
                type="button"
                onClick={handleOpenQuiz}
                className="btn-gold-shimmer px-8 py-4 rounded-full text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(227,181,82,0.35)]"
              >
                INSCREVER-SE
              </button>
              <a
                href="#premios"
                className="border border-white/10 hover:border-white/35 text-white font-mono text-sm font-bold uppercase tracking-widest px-8 py-4 rounded-full transition-colors text-center"
              >
                Conhecer prêmios
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 relative flex justify-center">
            <div className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 w-full max-w-sm space-y-6 relative overflow-hidden shadow-2xl">
              <div className="w-full aspect-square rounded-2xl overflow-hidden border border-white/10 relative">
                <img
                  src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=600&q=80"
                  alt="Gravação ao vivo"
                  className="w-full h-full object-cover grayscale brightness-90"
                />
                <span className="absolute top-3 left-3 bg-[#F0C265] text-black font-mono text-sm uppercase tracking-widest px-3.5 py-1.5 rounded border border-black font-bold">
                  STUDIO LIVE
                </span>
              </div>
              <div className="space-y-2">
                <span className="font-mono text-[#F0C265] text-sm tracking-wider uppercase block font-bold">
                  OPORTUNIDADE ÚNICA (1º LUGAR)
                </span>
                <h3 className="font-display font-bold text-lg text-white leading-relaxed uppercase">
                  EP de 5 Faixas no Bolso
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed font-normal">
                  Produção completa de EP (5 músicas autorais), mixagem/masterização profissional, gravação de webclipe de estúdio, fotos artísticas e distribuição fonográfica garantida.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* B. AS 3 REGRAS DE MATRÍCULA */}
        <section id="principios" className="space-y-12">
          <div className="space-y-2 border-b border-white/5 pb-4">
            <span className="font-mono text-sm md:text-base text-[#F0C265] font-bold uppercase tracking-widest">
              # REGRAS INVIOLÁVEIS DO CONCURSO
            </span>
            <h2 className="font-display font-black text-2xl md:text-3xl text-white uppercase tracking-tight">
              AS 3 REGRAS DE MATRÍCULA
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 hover:border-[#E3B552]/30 rounded-2xl p-6 space-y-4 shadow-lg transition-colors">
              <span className="font-display font-black text-5xl text-[#F0C265] block select-none">01</span>
              <h3 className="font-display font-bold text-lg text-white uppercase">Repertório & Música Autoral</h3>
              <p className="text-sm text-gray-300">
                Seu repertório deve ter no máximo 3 músicas, com pelo menos uma música original (autoral) escrita majoritariamente em português ou instrumental.
              </p>
            </div>
            <div className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 hover:border-[#E3B552]/30 rounded-2xl p-6 space-y-4 shadow-lg transition-colors">
              <span className="font-display font-black text-5xl text-[#F0C265] block select-none">02</span>
              <h3 className="font-display font-bold text-lg text-white uppercase">Alinhamento de Lineup</h3>
              <p className="text-sm text-gray-300">
                As apresentações e gravações devem ser compostas por grupos contendo no mínimo 2 e no máximo 7 integrantes por projeto.
              </p>
            </div>
            <div className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 hover:border-[#E3B552]/30 rounded-2xl p-6 space-y-4 shadow-lg transition-colors">
              <span className="font-display font-black text-5xl text-[#F0C265] block select-none">03</span>
              <h3 className="font-display font-bold text-lg text-white uppercase">Compromisso Solidário</h3>
              <p className="text-sm text-gray-300">
                Entrega física obrigatória de 1kg (um quilo) de alimento não-perecível por integrante na entrada de cada etapa regulamentar.
              </p>
            </div>
          </div>
        </section>

        {/* C. FASES DO CONCURSO (Timeline) */}
        <section id="cronograma" className="space-y-12">
          <div className="space-y-2 border-b border-white/5 pb-4">
            <span className="font-mono text-sm md:text-base text-[#F0C265] font-bold uppercase tracking-widest">
              # FLUXO DO PROCESSO
            </span>
            <h2 className="font-display font-black text-2xl md:text-3xl text-white uppercase tracking-tight">
              FASES DE EXECUÇÃO DO CONCURSO
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-[1.5px] bg-white/5 -translate-y-1/2 z-0"></div>
            {[
              { f: 'F1', t: 'Inscrição Expressa', d: 'Matrícula no Quiz, lineup e upload da foto de divulgação.' },
              { f: 'F2', t: 'Transmissão ao Vivo', d: 'Gravação no estúdio com live e QR code para arrecadação.' },
              { f: 'F3', t: 'Mídias Ativas', d: 'Podcast especial de apresentação e abertura de voto popular.' },
              { f: 'F4', t: 'Grande Final', d: 'Apresentação presencial e revelação dos vencedores pela média final.' }
            ].map((p, i) => (
              <div key={i} className="bg-[#05070B] border border-white/5 p-5 rounded-xl space-y-3 relative z-10">
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

        {/* D. LOTES TABLE WITH CONFIG STATES */}
        <section id="lotes" className="space-y-12">
          <div className="space-y-4 border-b border-white/5 pb-4">
            <span className="font-mono text-sm md:text-base text-[#F0C265] font-bold uppercase tracking-widest">
              # INVESTIMENTO E CRONOGRAMA DE PREÇOS
            </span>
            <h2 className="font-display font-black text-2xl md:text-3xl text-white uppercase tracking-tight">
              TABELA PROGRESSIVA DE LOTES
            </h2>
            
            {/* Live Status banner simulation */}
            {lotesConfig.live.status === 'ao_vivo' && (
              <div className="py-4 px-6 rounded-2xl border-2 border-red-500 bg-red-950/20 text-red-500 flex flex-col sm:flex-row justify-between items-center gap-4 animate-pulse">
                <span className="font-mono text-sm md:text-base font-black tracking-widest uppercase">🔴 TRANSMISSÃO AO VIVO AGORA</span>
                <button className="bg-red-600 hover:bg-red-500 text-white font-mono text-sm font-bold uppercase px-5 py-2 rounded-xl border border-black shadow">ASSISTIR LIVE</button>
              </div>
            )}
            {lotesConfig.live.status === 'em_breve' && (
              <div className="py-4 px-6 rounded-2xl border-2 border-[#E3B552] bg-amber-950/10 text-[#F0C265] flex flex-col sm:flex-row justify-between items-center gap-4">
                <span className="font-mono text-sm md:text-base font-black tracking-widest uppercase">LIVE SESSIONS • LANÇAMENTO OFICIAL AGENDADO PARA 07 DE SETEMBRO ÀS 20:00</span>
              </div>
            )}
            {lotesConfig.live.status === 'encerrada' && (
              <div className="py-4 px-6 rounded-2xl border-2 border-white/5 bg-[#0B0F19]/60 text-gray-400 flex flex-col sm:flex-row justify-between items-center gap-4">
                <span className="font-mono text-sm md:text-base font-black tracking-widest uppercase">LIVE SESSIONS FINALIZADA • REPLAYS DISPONÍVEIS</span>
                <button className="border border-white/10 text-white font-mono text-sm font-bold px-4 py-2 rounded-xl">VER REPLAY</button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { key: 'dia0', title: 'Dia 0 (Live)', status: 'encerrado', desc: 'Apenas durante a transmissão ao vivo.', valor: 25 },
              { key: 'lote1', title: 'Lote 1', status: lotesConfig.lote1.status, desc: 'Primeiras inscrições. Menor preço histórico.', valor: 35, vagas: lotesConfig.lote1.vagasRestantes },
              { key: 'lote2', title: 'Lote 2', status: lotesConfig.lote2.status, desc: 'Disponível na fase intermediária.', valor: 40, vagas: lotesConfig.lote2.vagasRestantes },
              { key: 'lote3', title: 'Lote 3', status: lotesConfig.lote3.status, desc: 'Reta final de inscrições regulamentares.', valor: 45, vagas: lotesConfig.lote3.vagasRestantes }
            ].map((l, i) => {
              const isActive = l.status === 'ativo';
              const isClosed = l.status === 'encerrado';
              return (
                <div
                  key={i}
                  className={`bg-[#0B0F19]/60 backdrop-blur-xl border-2 rounded-[24px] p-5 flex flex-col justify-between shadow ${
                    isActive ? 'border-[#E3B552] scale-[1.02]' : 'border-white/5 opacity-60'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <h4 className="font-display font-bold text-md text-white uppercase">{l.title}</h4>
                      {isActive && <span className="bg-gradient-to-b from-[#FFF2D4] via-[#F0C265] to-[#B88A28] text-black text-[10px] font-bold px-2.5 py-1 rounded font-mono border border-black">VIGENTE</span>}
                      {isClosed && <span className="bg-[#121215] text-gray-500 text-[10px] font-bold px-2.5 py-1 rounded font-mono border border-white/5">ENCERRADO</span>}
                    </div>
                    <p className="text-sm text-gray-300 leading-normal">{l.desc}</p>
                    
                    {isActive && l.vagas !== undefined && (
                      <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                        <span className="font-mono text-sm text-gray-300 block font-bold">VAGAS RESTANTES: {l.vagas}</span>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden flex items-center">
                          <div className="h-full bg-gradient-to-r from-[#FFF2D4] via-[#F0C265] to-[#B88A28]" style={{ width: `${(l.vagas / 30) * 100}%` }}></div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-white/5 pt-4 flex justify-between items-baseline mt-4">
                    <span className="text-sm font-mono text-[#10B981] font-bold uppercase">+ 1kg Alimento</span>
                    <span className={`text-2xl font-display font-black ${isActive ? 'text-[#F0C265]' : 'text-white'}`}>
                      R$ {l.valor},00
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-6 text-center">
            <button
              onClick={handleOpenQuiz}
              className="btn-gold-shimmer px-10 py-4 rounded-2xl text-md"
            >
              Garantir Inscrição Lote 1
            </button>
          </div>
        </section>

        {/* E. DELIVERABLES GRAPH FEATURE GRID */}
        <section id="premios" className="space-y-12">
          <div className="space-y-2 border-b border-white/5 pb-4">
            <span className="font-mono text-sm md:text-base text-[#F0C265] font-bold uppercase tracking-widest">
              # VITRINE DE ENTREGÁVEIS
            </span>
            <h2 className="font-display font-black text-2xl md:text-3xl text-white uppercase tracking-tight">
              O QUE ESTÁ EM JOGO
            </h2>
          </div>
          
          {/* Hero Premium Card */}
          <HeroCard />

          {/* Staggered Grid Deliverables */}
          <FeatureGrid />
        </section>

        {/* F. FAQ ACCORDION SECTION */}
        <section id="FAQ" className="space-y-12">
          <div className="space-y-2 border-b border-white/5 pb-4">
            <span className="font-mono text-sm md:text-base text-[#F0C265] font-bold uppercase tracking-widest">
              # PERGUNTAS FREQUENTES
            </span>
            <h2 className="font-display font-black text-2xl md:text-3xl text-white uppercase tracking-tight">
              DÚVIDAS FREQUENTES
            </h2>
          </div>

          <div className="space-y-4 max-w-4xl mx-auto">
            {faqs.map((f, i) => (
              <div
                key={i}
                className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 rounded-xl p-5 cursor-pointer hover:border-[#E3B552]/40 transition-colors"
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
                {activeFaq === i && (
                  <p className="text-sm text-gray-300 mt-3 leading-relaxed border-t border-white/5 pt-3">
                    {f.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="bg-[#030407] border-t border-white/5 py-10 px-6 mt-16 text-center text-sm font-mono text-gray-400 uppercase tracking-widest">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-4">
          <div>
            Estúdio Pedra Profana © 2026 • Todos os Direitos Reservados.
          </div>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/termos" className="hover:text-white transition-colors font-semibold">Termos de Uso</Link>
            <span className="text-white/20">•</span>
            <Link href="/privacidade" className="hover:text-white transition-colors font-semibold">Privacidade</Link>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <Link href="/sagrado" className="text-[#8B6F47] hover:text-[#F0C265] transition-colors" title="Painel Admin">
              <Settings className="w-4 h-4" />
            </Link>
            <span>Sistema criado por <a href="https://instagram.com/ww.wagner" target="_blank" rel="noopener noreferrer" className="text-[#D4A843] hover:text-[#E8C06B] transition-colors font-bold">@ww.wagner</a></span>
          </div>
        </div>
      </footer>

      {/* QUIZ INTERACTIVE POPUP MODAL */}
      <AnimatePresence>
        {isQuizOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#05070B]/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              className="bg-[#0B0F19] border-2 border-[#E3B552] w-full max-w-xl rounded-3xl p-6 md:p-8 relative space-y-6 shadow-2xl flex flex-col justify-between max-h-[90vh] overflow-y-auto"
            >
              <button onClick={() => setIsQuizOpen(false)} className="absolute right-5 top-5 text-[#B3B3B3] hover:text-white font-mono text-2xl font-bold">&times;</button>
              
              {/* STATUS PROGRESS BAR */}
              <div className="space-y-2 shrink-0">
                <div className="flex justify-between items-baseline">
                  <span className="font-mono text-sm md:text-base text-[#F0C265] font-black uppercase tracking-widest">
                    Passo {quizStep} de 5
                  </span>
                  <span className="font-mono text-sm md:text-base text-gray-400 font-bold">
                    Progresso: {quizStep * 20}%
                  </span>
                </div>
                <div className="w-full h-2 bg-black rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#FFF2D4] via-[#F0C265] to-[#B88A28] transition-all duration-300" style={{ width: `${quizStep * 20}%` }}></div>
                </div>
              </div>

              {/* STEP CONTENTS */}
              <form onSubmit={(e) => e.preventDefault()} className="grow flex flex-col justify-between gap-6">
                {quizStep === 1 && (
                  <div className="space-y-4">
                    <h3 className="font-display font-black text-2xl text-white uppercase tracking-tight">Dados do Projeto</h3>
                    <p className="text-sm text-gray-300">Insira as informações gerais da banda/artista.</p>
                    <div className="space-y-4 pt-2">
                      <div className="space-y-1">
                        <label className="block font-mono text-sm text-[#F0C265] font-bold uppercase">Nome da Banda *</label>
                        <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#E3B552]" required />
                      </div>
                      <div className="space-y-1">
                        <label className="block font-mono text-sm text-[#F0C265] font-bold uppercase">Estilo / Gênero *</label>
                        <input type="text" value={projectStyle} onChange={(e) => setProjectStyle(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#E3B552]" required />
                      </div>
                    </div>
                  </div>
                )}

                {quizStep === 2 && (
                  <div className="space-y-4">
                    <h3 className="font-display font-black text-2xl text-white uppercase tracking-tight">Biografia & Mídia</h3>
                    <p className="text-sm text-gray-300">Estas informações serão avaliadas pelo corpo de jurados técnicos.</p>
                    <div className="space-y-4 pt-2">
                      <div className="space-y-1">
                        <label className="block font-mono text-sm text-[#F0C265] font-bold uppercase">Biografia *</label>
                        <textarea value={projectBio} onChange={(e) => setProjectBio(e.target.value)} rows={3} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#E3B552] resize-none" required />
                      </div>
                      <div className="space-y-1">
                        <label className="block font-mono text-sm text-[#F0C265] font-bold uppercase">Foto Oficial *</label>
                        <div className="border border-dashed border-white/10 hover:border-[#E3B552] rounded-xl p-5 text-center cursor-pointer bg-black/40 relative">
                          <input type="file" onChange={(e) => setProjectPhotoName(e.target.files ? e.target.files[0].name : null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" required />
                          {projectPhotoName ? (
                            <span className="text-sm text-[#10B981] font-bold">✓ Foto Selecionada: {projectPhotoName}</span>
                          ) : (
                            <span className="text-sm text-[#B3B3B3]">Arraste ou clique para carregar foto</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {quizStep === 3 && (
                  <div className="space-y-4">
                    <h3 className="font-display font-black text-2xl text-white uppercase tracking-tight">Líder Responsável</h3>
                    <p className="text-sm text-gray-300">Preencha as credenciais do responsável legal do projeto.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1">
                        <label className="block font-mono text-sm text-[#F0C265] font-bold uppercase">Nome Completo *</label>
                        <input type="text" value={respName} onChange={(e) => setRespName(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#E3B552]" required />
                      </div>
                      <div className="space-y-1">
                        <label className="block font-mono text-sm text-[#F0C265] font-bold uppercase">CPF *</label>
                        <input type="text" value={respCpf} onChange={(e) => setRespCpf(applyCpfMask(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#E3B552]" maxLength={14} required />
                      </div>
                      <div className="space-y-1">
                        <label className="block font-mono text-sm text-[#F0C265] font-bold uppercase">Nascimento *</label>
                        <input type="text" value={respBirth} onChange={(e) => setRespBirth(applyDateMask(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#E3B552]" maxLength={10} required />
                      </div>
                      <div className="space-y-1">
                        <label className="block font-mono text-sm text-[#F0C265] font-bold uppercase">WhatsApp *</label>
                        <input type="tel" value={respPhone} onChange={(e) => setRespPhone(applyPhoneMask(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#E3B552]" maxLength={15} required />
                      </div>
                    </div>
                  </div>
                )}

                {quizStep === 4 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <div>
                        <h3 className="font-display font-black text-2xl text-white uppercase tracking-tight">Escalar Integrantes</h3>
                        <p className="text-xs text-gray-300">Mínimo 2, Máximo 7 integrantes.</p>
                      </div>
                      <button type="button" onClick={addQuizMember} className="font-mono text-sm font-bold text-[#F0C265] bg-[#E3B552]/10 border border-[#E3B552]/30 px-3.5 py-2.5 rounded-xl uppercase hover:bg-[#E3B552] hover:text-black transition-colors">
                        + Escalar
                      </button>
                    </div>

                    <div className="space-y-3 overflow-y-auto max-h-[220px] pr-1">
                      <div className="bg-black/40 p-3 flex justify-between items-center border border-white/5 rounded-xl">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-[#E3B552]/15 text-[#F0C265] flex items-center justify-center font-mono text-sm font-bold border border-[#E3B552]/35">1</span>
                          <div>
                            <span className="text-sm font-bold text-white block">{respName || 'Nome do Líder'}</span>
                            <span className="font-mono text-sm text-gray-400 uppercase block mt-0.5">Integrante 1 (Líder)</span>
                          </div>
                        </div>
                        <span className="font-mono text-sm text-gray-400 uppercase font-bold">Fixo</span>
                      </div>

                      {membersList.map((m, index) => (
                        <div key={index} className="bg-black/40 p-4 rounded-xl space-y-4 border border-white/5">
                          <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <span className="font-mono text-sm text-white font-bold">INTEGRANTE {index + 2}</span>
                            <button type="button" onClick={() => removeQuizMember(index)} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                              <Trash2 className="w-3.5 h-3.5" /> Remover
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="block font-mono text-xs text-gray-300 uppercase">Nome Completo</label>
                              <input type="text" value={m.name} onChange={(e) => handleMemberFieldChange(index, 'name', e.target.value)} className="w-full bg-[#05070B] border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-[#E3B552]" />
                            </div>
                            <div className="space-y-1">
                              <label className="block font-mono text-xs text-gray-300 uppercase">CPF</label>
                              <input type="text" value={m.cpf} onChange={(e) => handleMemberFieldChange(index, 'cpf', applyCpfMask(e.target.value))} className="w-full bg-[#05070B] border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-[#E3B552]" maxLength={14} />
                            </div>
                            <div className="space-y-1 md:col-span-2">
                              <label className="block font-mono text-xs text-gray-300 uppercase">Data de Nascimento</label>
                              <input type="text" value={m.birth} onChange={(e) => handleMemberFieldChange(index, 'birth', applyDateMask(e.target.value))} className="w-full bg-[#05070B] border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-[#E3B552]" maxLength={10} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {quizStep === 5 && (
                  <div className="space-y-4">
                    <h3 className="font-display font-black text-2xl text-white uppercase tracking-tight">Revisar Matrícula</h3>
                    <p className="text-sm text-gray-300">Confirme os dados consolidados do sinal.</p>
                    
                    <div className="bg-black/50 p-5 rounded-2xl border border-white/5 space-y-4 text-xs font-mono">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-gray-400 block text-sm font-bold">PROJETO BANDA:</span>
                          <span className="font-bold text-white text-sm block mt-1">{projectName || '-'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-sm font-bold">RESPONSÁVEL LÍDER:</span>
                          <span className="font-bold text-white text-sm block mt-1">{respName || '-'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-sm font-bold">LOTE VIGENTE:</span>
                          <span className="font-bold text-[#F0C265] text-sm block mt-1 uppercase">{activeLoteName} (R$ {activePrice} / integrante)</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-sm font-bold font-bold">INTEGRANTES CONECTADOS:</span>
                          <span className="font-bold text-white text-sm block mt-1">{selectedMembers}</span>
                        </div>
                      </div>

                      <div className="border-t border-white/5 pt-4 flex flex-col sm:flex-row justify-between items-baseline gap-4">
                        <div>
                          <span className="font-mono text-sm text-[#F0C265] font-bold">GRAVAÇÃO LIVE INCLUÍDA:</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-gray-300 line-through block">R$ 1.500,00</span>
                            <span className="text-xs text-lime font-bold uppercase">CUSTO R$ 0</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-sm text-gray-300 block font-bold">TAXA TOTAL DO GRUPO:</span>
                          <span className="text-3xl font-display font-black text-[#F0C265] block mt-1">R$ {totalCost},00</span>
                          <span className="text-xs text-gray-300 font-mono block mt-1 uppercase">E mais {selectedMembers}kg de alimento</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-1">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" checked={acceptRules} onChange={(e) => setAcceptRules(e.target.checked)} className="mt-1 w-4 h-4 text-[#F0C265] bg-black border-[#2E2820] rounded focus:ring-[#F0C265]" />
                        <span className="text-sm text-gray-300 leading-relaxed font-normal">
                          Declaramos ler e anuir integralmente com o regulamento do concurso, concordando com as etapas, a doação obrigatória de alimentos e as políticas de direitos autorais para as transmissões ao vivo.
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                {/* CONTROLS */}
                <div className="border-t border-[#2C2C2C] pt-4 flex justify-between items-center gap-4 shrink-0">
                  <div className="flex flex-col">
                    <span className="text-sm text-[#B3B3B3] font-mono uppercase tracking-widest block font-bold">PASSO ATIVO</span>
                    <span className="text-sm text-[#F0EAE0] font-bold font-mono">0{quizStep}/05</span>
                  </div>

                  <div className="flex gap-2.5">
                    <button type="button" onClick={handleBypassClear} className="font-mono text-sm font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl uppercase">Bypass</button>
                    {quizStep > 1 && (
                      <button type="button" onClick={() => setQuizStep(quizStep - 1)} className="font-mono text-sm font-bold text-white border border-white/10 bg-white/5 px-5 py-2.5 rounded-xl uppercase">Voltar</button>
                    )}
                    {quizStep < 5 ? (
                      <button type="button" onClick={handleQuizNext} className="btn-gold-shimmer px-7 py-2.5 rounded uppercase border-none text-black">Continuar</button>
                    ) : (
                      <button type="button" onClick={handleLaunchCheckout} className="font-mono text-sm font-bold text-black bg-lime px-7 py-2.5 rounded-xl uppercase border-none">Gerar Pix</button>
                    )}
                  </div>
                </div>

              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CHECKOUT POPUP MODAL */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-[#0B0F19]/90 backdrop-blur-xl border-2 border-[#E3B552] max-w-sm w-full p-6 rounded-[32px] relative space-y-6 shadow-2xl"
            >
              <button onClick={() => setIsCheckoutOpen(false)} className="absolute right-4 top-4 text-gray-400 hover:text-white font-mono text-xl">&times;</button>
              
              <div className="text-center space-y-2 pt-2">
                <span className="font-mono text-sm text-lime font-bold bg-lime/10 border border-lime/20 px-3 py-1 rounded-full w-max mx-auto block uppercase">● Servidor Autenticado</span>
                <h3 className="font-display font-bold text-xl text-white uppercase tracking-tight">PIX DE INSCRIÇÃO</h3>
                <p className="text-sm text-gray-300">Sua vaga será confirmada após compensação do Pix.</p>
              </div>

              <div className="bg-[#030407] p-4 rounded-xl flex flex-col items-center space-y-4 border border-white/5">
                <div className="w-48 h-48 bg-white p-3 rounded-xl flex items-center justify-center relative shadow-lg">
                  <div className="w-full h-full border border-black/10 flex flex-col justify-between p-2">
                    <div className="flex justify-between">
                      <div className="w-8 h-8 bg-black"></div>
                      <div className="w-8 h-8 bg-black"></div>
                    </div>
                    <div className="text-center font-bold text-[8px] text-[#05070B] font-mono uppercase tracking-widest leading-none py-2">Canção Profana</div>
                    <div className="flex justify-between">
                      <div className="w-8 h-8 bg-black"></div>
                      <div className="w-12 h-12 border border-black border-dashed flex items-center justify-center"><div className="w-6 h-6 bg-[#F0C265]"></div></div>
                    </div>
                  </div>
                  {isCheckoutLoading && (
                    <div className="absolute inset-0 bg-[#05070B]/95 flex flex-col items-center justify-center text-center p-3 rounded-xl">
                      <span className="w-8 h-8 rounded-full border-2 border-[#F0C265] border-t-transparent animate-spin mb-3"></span>
                      <span className="font-mono text-sm text-[#F0C265] uppercase tracking-widest font-bold">AGUARDANDO WEBHOOK...</span>
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <span className="font-mono text-sm text-gray-400 block uppercase font-bold">TOTAL CONVERSÃO:</span>
                  <span className="text-2xl font-mono font-black text-lime block mt-1">R$ {totalCost},00</span>
                </div>
              </div>

              <div className="space-y-3">
                <button onClick={copyPixCode} className="font-mono text-sm font-bold text-white bg-white/5 border border-[#2E2820] py-3 rounded-xl w-full hover:bg-white/10 transition-colors uppercase">Copiar Código Pix</button>
                <button onClick={handleSimulateWebhook} className="font-mono text-sm font-bold text-black bg-lime py-3 rounded-xl w-full hover:bg-lime/90 transition-colors uppercase border-none shadow-lg shadow-lime/20">Confirmar Pagamento (Webhook)</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SUCCESS STATE */}
      <AnimatePresence>
        {isSuccessOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-[#0B0F19]/90 backdrop-blur-xl border-2 border-[#E3B552] max-w-lg w-full p-8 rounded-[32px] text-center space-y-6"
            >
              <div className="w-16 h-16 rounded-full bg-lime/10 text-lime border-2 border-lime flex items-center justify-center mx-auto text-3xl shadow font-bold">✓</div>
              <div className="space-y-2">
                <span className="font-mono text-sm text-lime uppercase tracking-widest font-bold">● Matrícula Concluída</span>
                <h3 className="font-display font-black text-3xl text-white uppercase tracking-tight">BANDA MATRICULADA!</h3>
                <p className="text-xs text-gray-300 leading-relaxed max-w-sm mx-auto">O webhook do servidor processou o Pix de forma segura. O recibo regulamentar foi transmitido ao e-mail cadastrado.</p>
              </div>

              <div className="bg-black/50 p-5 max-w-xs mx-auto grid grid-cols-2 gap-4 text-left border border-white/5">
                <div>
                  <span className="font-mono text-sm text-gray-400 uppercase">CÓDIGO ID BANDA:</span>
                  <span className="text-xs font-bold text-white font-mono block mt-1">CP-2026-X7Y9</span>
                </div>
                <div>
                  <span className="font-mono text-sm text-gray-400 uppercase">FILA CANAL:</span>
                  <span className="text-xs font-bold text-white font-mono block mt-1">{selectedMembers} MEMBROS</span>
                </div>
                <div className="col-span-2 border-t border-white/5 pt-3">
                  <span className="font-mono text-sm text-lime uppercase font-bold">Condição Solidária:</span>
                  <p className="text-xs text-gray-300 mt-1 leading-relaxed font-mono">Trazer {selectedMembers}kg de alimento no dia do show.</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button onClick={() => window.location.reload()} className="btn-gold-shimmer px-8 py-3.5 rounded-full text-xs uppercase tracking-wider block w-full max-w-xs mx-auto border-none">Voltar para Home</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );

  function closeCheckoutModal() {
    setIsCheckoutOpen(false);
  }
  function copyPixCode() {
    alert('✓ Código Pix Copiado!');
  }
}
