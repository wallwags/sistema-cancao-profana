'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, ChevronDown, Check, Trash2, Shield, Settings, Info, CreditCard, Music, Radio, Award } from 'lucide-react';
import CountdownBar from '../components/CountdownBar';
import Navbar from '../components/Navbar';
import HeroCard from '../components/HeroCard';
import FeatureGrid from '../components/FeatureGrid';

// 2. SEÇÃO #LOTES — CONFIGURAÇÃO CENTRALIZADA (JavaScript Control States)
interface LoteState {
  status: 'ativo' | 'encerrado' | 'em_breve';
  vagasRestantes: number;
  valor: number;
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
    lote1: { status: 'ativo', vagasRestantes: 12, valor: 60 },
    lote2: { status: 'em_breve', vagasRestantes: 25, valor: 80 },
    lote3: { status: 'em_breve', vagasRestantes: 30, valor: 100 },
    live: { status: 'em_breve', horario: '2026-08-20T20:00:00' }
  });

  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [quizStep, setQuizStep] = useState(1);
  
  // Quiz states
  const [projectName, setProjectName] = useState('');
  const [projectStyle, setProjectStyle] = useState('');
  const [projectBio, setProjectBio] = useState('');
  const [projectPhoto, setProjectPhoto] = useState<File | null>(null);
  const [respName, setRespName] = useState('');
  const [respCpf, setRespCpf] = useState('');
  const [respBirth, setRespBirth] = useState('');
  const [respPhone, setRespPhone] = useState('');
  const [selectedMembers, setSelectedMembers] = useState(2);
  const [membersList, setMembersList] = useState<Array<{ name: string; cpf: string; birth: string }>>([]);
  const [acceptRules, setAcceptRules] = useState(false);

  // Checkout Popups states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  // Admin states
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [admPass, setAdmPass] = useState('');
  const [admVagas, setAdmVagas] = useState(12);

  const activeLotePrice = lotesConfig.lote1.status === 'ativo' ? lotesConfig.lote1.valor : (lotesConfig.lote2.status === 'ativo' ? lotesConfig.lote2.valor : lotesConfig.lote3.valor);
  const activeLoteName = lotesConfig.lote1.status === 'ativo' ? 'LOTE 1' : (lotesConfig.lote2.status === 'ativo' ? 'LOTE 2' : 'LOTE 3');

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

  const handleOpenAdmin = () => {
    const pass = prompt('Digite a senha do administrador:');
    if (pass === 'profana2026') {
      setAdmVagas(lotesConfig.lote1.status === 'ativo' ? lotesConfig.lote1.vagasRestantes : (lotesConfig.lote2.status === 'ativo' ? lotesConfig.lote2.vagasRestantes : lotesConfig.lote3.vagasRestantes));
      setIsAdminOpen(true);
    } else if (pass !== null) {
      alert('Senha incorreta!');
    }
  };

  const handleSaveAdminConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = { ...lotesConfig };
    if (updated.lote1.status === 'ativo') updated.lote1.vagasRestantes = admVagas;
    if (updated.lote2.status === 'ativo') updated.lote2.vagasRestantes = admVagas;
    if (updated.lote3.status === 'ativo') updated.lote3.vagasRestantes = admVagas;
    setLotesConfig(updated);
    setIsAdminOpen(false);
  };

  const handleQuizNext = () => {
    if (quizStep === 1 && (!projectName || !projectStyle)) {
      alert('Preencha os campos obrigatórios.'); return;
    }
    if (quizStep === 2 && (!projectBio || !projectPhoto)) {
      alert('Forneça a biografia e envie a foto oficial.'); return;
    }
    if (quizStep === 3 && (!respName || respCpf.length < 14 || respBirth.length < 10 || respPhone.length < 14)) {
      alert('Preencha as credenciais do responsável de forma válida.'); return;
    }
    if (quizStep === 4) {
      for (let i = 0; i < membersList.length; i++) {
        if (!membersList[i].name || membersList[i].cpf.length < 14 || membersList[i].birth.length < 10) {
          alert(`Preencha os dados obrigatórios do Integrante ${i+2}.`); return;
        }
      }
    }
    setQuizStep(quizStep + 1);
  };

  const handleMemberChange = (index: number, field: string, value: string) => {
    const updated = [...membersList];
    updated[index] = { ...updated[index], [field]: value };
    setMembersList(updated);
  };

  const handleLaunchCheckout = () => {
    if (!acceptRules) {
      alert('Aceite os regulamentos para continuar.'); return;
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
    if (confirm('Redefinir todo o chassi e formulários?')) {
      setProjectName('');
      setProjectStyle('');
      setProjectBio('');
      setProjectPhoto(null);
      setRespName('');
      setRespCpf('');
      setRespBirth('');
      setRespPhone('');
      setSelectedMembers(2);
      setAcceptRules(false);
      setQuizStep(1);
    }
  };

  // Input masks helpers
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
    { q: 'Como é calculada a taxa de inscrição?', a: 'O valor de R$ 60 (do Lote 1 ativo) é cobrado por integrante cadastrado no grupo musical (mínimo 2, máximo 7). Ao preencher o quiz e definir o lineup final, o sistema calcula o valor total. Essa taxa garante toda a infraestrutura e a gravação de estúdio da live.' },
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
    <div className="bg-[#0F0D0B] text-[#F0EAE0] min-h-screen">
      
      {/* COUNTDOWN TOP BAR */}
      <CountdownBar />

      {/* NAVBAR */}
      <Navbar onOpenQuiz={openQuiz} />

      {/* MAIN CONTAINER */}
      <main className="max-w-6xl mx-auto px-6 py-12 space-y-24 relative z-10">
        
        {/* HERO SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-block px-3.5 py-1.5 bg-[#1A1612] border border-[#2E2820] rounded text-sm font-mono text-[#A89880] uppercase tracking-widest">
              # ESTÚDIO PEDRA PROFANA CONCURSO MUSICAL
            </div>
            <h1 className="font-display font-black text-3xl md:text-5xl lg:text-6xl text-[#F0EAE0] leading-none uppercase tracking-tight">
              Grave seu som. Concorra à produção da sua <span className="text-[#D4A843]">carreira</span>.
            </h1>
            <p className="text-base md:text-lg text-[#A89880] leading-relaxed max-w-xl">
              Esqueça taxas abusivas que não retornam nada. No Canção Profana, **cada banda inscrita ganha a gravação profissional de áudio e vídeo de sua live**. Entregamos estrutura de alto nível e portfólio imediato.
            </p>
            <div className="flex flex-wrap gap-4 pt-2 text-sm font-mono text-[#5C5248] uppercase tracking-wider">
              <span>• AUTORAL PORTUGUÊS</span>
              <span>• TRANSMISSÃO DIGITAL</span>
              <span>• GRAVAÇÃO INCLUÍDA</span>
            </div>
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
              <button
                type="button"
                onClick={openQuiz}
                className="bg-[#D4A843] hover:bg-[#E8C06B] text-black font-mono text-sm font-bold uppercase tracking-widest px-8 py-4 rounded transition-all shadow-lg shadow-[#D4A843]/20"
              >
                Inscrever-se
              </button>
              <a
                href="#premios"
                className="border border-[#2E2820] hover:border-[#A89880] text-white font-mono text-sm font-bold uppercase tracking-widest px-8 py-4 rounded transition-colors text-center"
              >
                Conhecer prêmios
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 relative flex justify-center">
            <div className="bg-[#1A1612] border border-[#2E2820] rounded-3xl p-5 w-full max-w-sm space-y-5 shadow-2xl">
              <div className="w-full aspect-square rounded-2xl overflow-hidden border border-[#2E2820] relative">
                <img
                  src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=600&q=80"
                  alt="Gravação ao vivo"
                  className="w-full h-full object-cover grayscale brightness-90"
                />
                <span className="absolute top-3 left-3 bg-[#D4A843] text-black font-mono text-sm uppercase tracking-widest px-3.5 py-1.5 rounded border border-[#2E2820] font-bold">
                  STUDIO LIVE
                </span>
              </div>
              <div className="space-y-2">
                <span className="font-mono text-[#D4A843] text-sm tracking-wider uppercase block font-bold">
                  OPORTUNIDADE ÚNICA (1º LUGAR)
                </span>
                <h3 className="font-display font-bold text-lg text-[#F0EAE0] leading-relaxed uppercase">
                  EP de 5 Faixas no Bolso
                </h3>
                <p className="text-sm text-[#A89880] leading-relaxed font-normal">
                  Produção completa de EP (5 músicas), mixagem/masterização profissional, gravação de webclipe de estúdio, fotos artísticas e distribuição fonográfica garantida.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* B. PRINCÍPIOS */}
        <section id="principios" className="space-y-12">
          <div className="space-y-2 border-b border-[#2E2820] pb-4">
            <span className="font-mono text-sm md:text-base text-[#D4A843] font-bold uppercase tracking-widest">
              # PRINCÍPIOS REGULAMENTARES
            </span>
            <h2 className="font-display font-black text-2xl md:text-3xl text-[#F0EAE0] uppercase tracking-tight">
              O QUE VOCÊ PRECISA SABER
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#1A1612] border border-[#2E2820] p-6 rounded-2xl space-y-4 shadow-lg">
              <span className="font-display font-black text-5xl text-[#D4A843] block select-none">01</span>
              <h3 className="font-display font-bold text-lg text-[#F0EAE0] uppercase">Inscrição Simples</h3>
              <p class="text-sm text-[#A89880]">
                Configure seu projeto de 2 a 7 integrantes através de nosso quiz e preencha as credenciais. Toda a banda é validada no processo.
              </p>
            </div>
            <div className="bg-[#1A1612] border border-[#2E2820] p-6 rounded-2xl space-y-4 shadow-lg">
              <span className="font-display font-black text-5xl text-[#D4A843] block select-none">02</span>
              <h3 class="font-display font-bold text-lg text-[#F0EAE0] uppercase">Estúdio Ativo</h3>
              <p class="text-sm text-[#A89880]">
                Sua banda se apresenta ao vivo e grava áudio e vídeo de alta fidelidade de graça, recebendo a matriz original para seu portfólio de carreira.
              </p>
            </div>
            <div className="bg-[#1A1612] border border-[#2E2820] p-6 rounded-2xl space-y-4 shadow-lg">
              <span className="font-display font-black text-5xl text-[#D4A843] block select-none">03</span>
              <h3 class="font-display font-bold text-lg text-[#F0EAE0] uppercase">Voto Qualificado</h3>
              <p class="text-sm text-[#A89880]">
                Avaliações divididas em três frentes: Notas técnicas dos jurados especialistas (Índio, Naraiane e Matheus T), voto do estúdio e quantidade de votos populares.
              </p>
            </div>
          </div>
        </section>

        {/* C. LINHA DO TEMPO */}
        <section id="cronograma" className="space-y-12">
          <div className="space-y-2 border-b border-[#2E2820] pb-4">
            <span className="font-mono text-sm md:text-base text-[#D4A843] font-bold uppercase tracking-widest">
              # FLUXO DO PROCESSO
            </span>
            <h2 className="font-display font-black text-2xl md:text-3xl text-[#F0EAE0] uppercase tracking-tight">
              FASES DE EXECUÇÃO DO CONCURSO
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-[1.5px] bg-[#2E2820] -translate-y-1/2 z-0"></div>
            {[
              { f: 'F1', t: 'Inscrição Expressa', d: 'Matrícula no Quiz, lineup e upload da foto de divulgação.' },
              { f: 'F2', t: 'Transmissão ao Vivo', d: 'Gravação no estúdio com live e QR code para arrecadação.' },
              { f: 'F3', t: 'Mídias Ativas', d: 'Podcast especial de apresentação e abertura de voto popular.' },
              { f: 'F4', t: 'Grande Final', d: 'Apresentação presencial e revelação dos vencedores pela média final.' }
            ].map((p, i) => (
              <div key={i} className="bg-[#120F0D] border border-[#2E2820] p-5 rounded-xl space-y-3 relative z-10">
                <div className="flex justify-between items-center">
                  <span className="bg-[#242019] text-[#F0EAE0] font-mono text-sm uppercase px-2.5 py-1 rounded font-bold border border-[#2E2820]">{p.f}</span>
                  <span className="font-mono text-sm md:text-base text-[#A89880] uppercase tracking-wider">Etapa</span>
                </div>
                <h4 className="font-display font-bold text-md text-[#F0EAE0] uppercase">{p.t}</h4>
                <p className="text-sm text-[#A89880] leading-relaxed">{p.d}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="bg-[#1A1612] p-4 rounded-xl border border-[#2E2820] text-center">
              <span className="font-mono text-sm text-[#A89880] block">PONTO DE EQUILÍBRIO MÍNIMO</span>
              <span className="font-mono text-sm md:text-base text-[#D4A843] font-bold block mt-1 uppercase">12 Bandas Registradas</span>
            </div>
            <div className="bg-[#1A1612] p-4 rounded-xl border border-[#2E2820] text-center">
              <span class="font-mono text-sm text-[#A89880] block">LIMITE DE SATURAÇÃO DA LIVE</span>
              <span class="font-mono text-sm md:text-base text-[#D4A843] font-bold block mt-1 uppercase">30 Bandas no Máximo</span>
            </div>
          </div>
        </section>

        {/* D. LOTES TABLE WITH CONFIG STATES */}
        <section id="lotes" className="space-y-12">
          <div className="space-y-4 border-b border-[#2E2820] pb-4">
            <span className="font-mono text-sm md:text-base text-[#D4A843] font-bold uppercase tracking-widest">
              # INVESTIMENTO E CRONOGRAMA DE PREÇOS
            </span>
            <h2 className="font-display font-black text-2xl md:text-3xl text-[#F0EAE0] uppercase tracking-tight">
              TABELA PROGRESSIVA DE LOTES
            </h2>
            
            {/* Live Status banner simulation */}
            {lotesConfig.live.status === 'ao_vivo' && (
              <div className="py-4 px-6 rounded-2xl border-2 border-red-500 bg-red-950/20 text-red-500 flex flex-col sm:flex-row justify-between items-center gap-4 animate-pulse">
                <span className="font-mono text-sm md:text-base font-black tracking-widest uppercase">🔴 TRANSMISSÃO AO VIVO AGORA</span>
                <button className="bg-red-600 hover:bg-red-500 text-white font-mono text-sm font-bold uppercase px-5 py-2 rounded-xl">ASSISTIR LIVE</button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { key: 'dia0', title: 'Dia 0 (Live)', status: 'encerrado', desc: 'Apenas durante a transmissão ao vivo.', valor: 40 },
              { key: 'lote1', title: 'Lote 1', status: lotesConfig.lote1.status, desc: 'Primeiras inscrições. Menor preço histórico.', valor: 60, vagas: lotesConfig.lote1.vagasRestantes },
              { key: 'lote2', title: 'Lote 2', status: lotesConfig.lote2.status, desc: 'Disponível na fase intermediária.', valor: 80, vagas: lotesConfig.lote2.vagasRestantes },
              { key: 'lote3', title: 'Lote 3', status: lotesConfig.lote3.status, desc: 'Reta final de inscrições regulamentares.', valor: 100, vagas: lotesConfig.lote3.vagasRestantes }
            ].map((l, i) => {
              const isActive = l.status === 'ativo';
              const isClosed = l.status === 'encerrado';
              return (
                <div
                  key={i}
                  className={`bg-[#1A1612] border-2 rounded-[24px] p-5 flex flex-col justify-between shadow ${
                    isActive ? 'border-[#D4A843] scale-[1.02]' : 'border-[#2E2820] opacity-60'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-[#2E2820] pb-2">
                      <h4 className="font-display font-bold text-md text-[#F0EAE0] uppercase">{l.title}</h4>
                      {isActive && <span className="bg-[#D4A843] text-black text-[10px] font-bold px-2.5 py-1 rounded font-mono">VIGENTE</span>}
                      {isClosed && <span className="bg-[#2E2820] text-[#A89880] text-[10px] font-bold px-2.5 py-1 rounded font-mono">ENCERRADO</span>}
                    </div>
                    <p className="text-sm text-[#A89880] leading-normal">{l.desc}</p>
                    
                    {isActive && l.vagas !== undefined && (
                      <div className="space-y-1 bg-black/30 p-2.5 rounded-xl border border-[#2E2820]">
                        <span className="font-mono text-sm text-[#A89880] block font-bold">VAGAS RESTANTES: {l.vagas}</span>
                        <div className="w-full h-1.5 bg-[#2E2820] rounded-full overflow-hidden flex items-center">
                          <div className="h-full bg-[#D4A843]" style={{ width: `${(l.vagas / 30) * 100}%` }}></div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-[#2E2820] pt-4 flex justify-between items-baseline mt-4">
                    <span className="text-sm font-mono text-[#10B981] font-bold uppercase">+ 1kg Alimento</span>
                    <span className={`text-2xl font-display font-black ${isActive ? 'text-[#D4A843]' : 'text-[#F0EAE0]'}`}>
                      R$ {l.valor},00
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-6 text-center">
            <button
              onClick={openQuiz}
              className="bg-[#D4A843] hover:bg-[#E8C06B] text-black font-display font-black px-10 py-4.5 rounded-2xl text-md transition-all shadow-lg shadow-[#D4A843]/20"
            >
              Garantir Inscrição Lote 1
            </button>
          </div>
        </section>

        {/* E. DELIVERABLES GRAPH FEATURE GRID */}
        <section id="premios" className="space-y-12">
          <div className="space-y-2 border-b border-[#2E2820] pb-4">
            <span className="font-mono text-sm md:text-base text-[#D4A843] font-bold uppercase tracking-widest">
              # VITRINE DE ENTREGÁVEIS
            </span>
            <h2 className="font-display font-black text-2xl md:text-3xl text-[#F0EAE0] uppercase tracking-tight">
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
          <div className="space-y-2 border-b border-[#2E2820] pb-4">
            <span className="font-mono text-sm md:text-base text-[#D4A843] font-bold uppercase tracking-widest">
              # PERGUNTAS FREQUENTES
            </span>
            <h2 className="font-display font-black text-2xl md:text-3xl text-[#F0EAE0] uppercase tracking-tight">
              DÚVIDAS FREQUENTES
            </h2>
          </div>

          <div className="space-y-4 max-w-4xl mx-auto">
            {faqs.map((f, i) => (
              <div
                key={i}
                className="bg-[#1A1612] border border-[#2E2820] rounded-xl p-5 cursor-pointer hover:border-[#8B6F47] transition-colors"
                onClick={() => setActiveFaq(activeFaq === i ? null : i)}
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-display font-bold text-[#F0EAE0] text-sm md:text-md uppercase tracking-wide">
                    {f.q}
                  </h3>
                  <span className="text-[#D4A843] font-bold text-md leading-none">
                    {activeFaq === i ? '−' : '+'}
                  </span>
                </div>
                {activeFaq === i && (
                  <p className="text-sm text-[#A89880] mt-3 leading-relaxed border-t border-[#2E2820] pt-3">
                    {f.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="bg-[#070504] border-t border-[#2E2820] py-8 px-6 text-center text-sm font-mono text-[#A89880] uppercase tracking-widest">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>© 2026 Canção Profana. Estúdio Pedra Profana. Todos os Direitos Reservados.</div>
          <div className="flex items-center gap-3">
            <button onClick={handleOpenAdmin} className="text-[#8B6F47] hover:text-[#D4A843]">
              <Settings className="w-4 h-4" />
            </button>
            <span>Designed by Senior UI/UX Engineer</span>
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F0D0B]/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              className="bg-[#1A1612] border-2 border-[#D4A843] w-full max-w-xl rounded-3xl p-6 md:p-8 relative space-y-6 shadow-2xl flex flex-col justify-between max-h-[90vh] overflow-y-auto"
            >
              <button onClick={closeQuiz} className="absolute right-5 top-5 text-[#A89880] hover:text-[#F0EAE0] font-mono text-2xl font-bold">&times;</button>
              
              {/* STATUS PROGRESS BAR */}
              <div className="space-y-2 shrink-0">
                <div className="flex justify-between items-baseline">
                  <span className="font-mono text-sm md:text-base text-[#D4A843] font-black uppercase tracking-widest">
                    Passo {quizStep} de 5
                  </span>
                  <span className="font-mono text-sm md:text-base text-[#A89880] font-bold">
                    Progresso: {quizStep * 20}%
                  </span>
                </div>
                <div className="w-full h-2 bg-[#0F0D0B] rounded-full overflow-hidden">
                  <div className="h-full bg-[#D4A843] transition-all duration-300" style={{ width: `${quizStep * 20}%` }}></div>
                </div>
              </div>

              {/* STEP CONTENTS */}
              <form onSubmit={(e) => e.preventDefault()} className="grow flex flex-col justify-between gap-6">
                {quizStep === 1 && (
                  <div className="space-y-4">
                    <h3 className="font-display font-black text-2xl text-white uppercase tracking-tight">Dados do Projeto</h3>
                    <p className="text-sm text-[#A89880]">Insira as informações gerais da banda/artista.</p>
                    <div className="space-y-4 pt-2">
                      <div className="space-y-1">
                        <label className="block font-mono text-sm text-[#F0EAE0] font-bold uppercase">Nome da Banda *</label>
                        <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} className="w-full bg-[#121214] border border-[#2E2820] rounded-xl px-4 py-3 text-white outline-none focus:border-[#D4A843]" required />
                      </div>
                      <div className="space-y-1">
                        <label className="block font-mono text-sm text-[#F0EAE0] font-bold uppercase">Estilo / Gênero *</label>
                        <input type="text" value={projectStyle} onChange={(e) => setProjectStyle(e.target.value)} className="w-full bg-[#121214] border border-[#2E2820] rounded-xl px-4 py-3 text-white outline-none focus:border-[#D4A843]" required />
                      </div>
                    </div>
                  </div>
                )}

                {quizStep === 2 && (
                  <div className="space-y-4">
                    <h3 className="font-display font-black text-2xl text-white uppercase tracking-tight">Biografia & Mídia</h3>
                    <p className="text-sm text-[#A89880]">Estas informações serão avaliadas pelo corpo de jurados técnicos.</p>
                    <div className="space-y-4 pt-2">
                      <div className="space-y-1">
                        <label className="block font-mono text-sm text-[#F0EAE0] font-bold uppercase">Biografia *</label>
                        <textarea value={projectBio} onChange={(e) => setProjectBio(e.target.value)} rows={3} className="w-full bg-[#121214] border border-[#2E2820] rounded-xl px-4 py-3 text-white outline-none focus:border-[#D4A843] resize-none" required />
                      </div>
                      <div className="space-y-1">
                        <label className="block font-mono text-sm text-[#F0EAE0] font-bold uppercase">Foto Oficial *</label>
                        <div className="border border-dashed border-[#2E2820] hover:border-[#D4A843] rounded-xl p-5 text-center cursor-pointer bg-[#0F0D0B] relative">
                          <input type="file" onChange={(e) => setProjectPhoto(e.target.files ? e.target.files[0] : null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" required />
                          {projectPhoto ? (
                            <span className="text-sm text-[#10B981] font-bold">✓ Foto Selecionada: {projectPhoto.name}</span>
                          ) : (
                            <span className="text-sm text-[#A89880]">Arraste ou clique para carregar foto</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {quizStep === 3 && (
                  <div className="space-y-4">
                    <h3 className="font-display font-black text-2xl text-white uppercase tracking-tight">Líder Responsável</h3>
                    <p className="text-sm text-[#A89880]">Preencha as credenciais do responsável legal do projeto.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1">
                        <label className="block font-mono text-sm text-[#F0EAE0] font-bold uppercase">Nome Completo *</label>
                        <input type="text" value={respName} onChange={(e) => setRespName(e.target.value)} className="w-full bg-[#121214] border border-[#2E2820] rounded-xl px-4 py-3 text-white outline-none focus:border-[#D4A843]" required />
                      </div>
                      <div className="space-y-1">
                        <label className="block font-mono text-sm text-[#F0EAE0] font-bold uppercase">CPF *</label>
                        <input type="text" value={respCpf} onChange={(e) => setRespCpf(applyCpfMask(e.target.value))} className="w-full bg-[#121214] border border-[#2E2820] rounded-xl px-4 py-3 text-white outline-none focus:border-[#D4A843]" maxlength={14} required />
                      </div>
                      <div className="space-y-1">
                        <label className="block font-mono text-sm text-[#F0EAE0] font-bold uppercase">Nascimento *</label>
                        <input type="text" value={respBirth} onChange={(e) => setRespBirth(applyDateMask(e.target.value))} className="w-full bg-[#121214] border border-[#2E2820] rounded-xl px-4 py-3 text-white outline-none focus:border-[#D4A843]" maxlength={10} required />
                      </div>
                      <div className="space-y-1">
                        <label className="block font-mono text-sm text-[#F0EAE0] font-bold uppercase">WhatsApp *</label>
                        <input type="tel" value={respPhone} onChange={(e) => setRespPhone(applyPhoneMask(e.target.value))} className="w-full bg-[#121214] border border-[#2E2820] rounded-xl px-4 py-3 text-white outline-none focus:border-[#D4A843]" maxlength={15} required />
                      </div>
                    </div>
                  </div>
                )}

                {quizStep === 4 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-[#2E2820] pb-2">
                      <div>
                        <h3 className="font-display font-black text-2xl text-white uppercase tracking-tight">Escalar Integrantes</h3>
                        <p className="text-xs text-[#A89880]">Mínimo 2, Máximo 7 integrantes.</p>
                      </div>
                      <button type="button" onClick={addQuizMember} className="font-mono text-sm font-bold text-[#D4A843] bg-[#D4A843]/10 border border-[#D4A843]/30 px-3.5 py-2 rounded-xl uppercase">
                        + Escalar
                      </button>
                    </div>

                    <div className="space-y-3 overflow-y-auto max-h-[220px] pr-1">
                      <div className="bg-[#0F0D0B] p-3 flex justify-between items-center border border-[#2E2820] rounded-xl">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-[#D4A843]/15 text-[#D4A843] flex items-center justify-center font-mono text-sm font-bold border border-[#D4A843]/30">1</span>
                          <div>
                            <span className="text-sm font-bold text-white block">{respName || 'Nome do Líder'}</span>
                            <span className="font-mono text-sm text-[#A89880] uppercase block mt-0.5">Integrante 1 (Líder)</span>
                          </div>
                        </div>
                        <span className="font-mono text-sm text-[#A89880] uppercase font-bold">Fixo</span>
                      </div>

                      {membersList.map((m, index) => (
                        <div key={index} className="bg-[#0F0D0B] p-4 rounded-xl space-y-4 border border-[#2E2820]">
                          <div className="flex justify-between items-center border-b border-[#2E2820] pb-2">
                            <span className="font-mono text-sm text-white font-bold">INTEGRANTE {index + 2}</span>
                            <button type="button" onClick={() => removeQuizMember(index)} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                              <Trash2 className="w-3.5 h-3.5" /> Remover
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="block font-mono text-xs text-[#A89880] uppercase">Nome Completo</label>
                              <input type="text" value={m.name} onChange={(e) => handleMemberChange(index, 'name', e.target.value)} className="w-full bg-[#121214] border border-[#2E2820] rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-[#D4A843]" />
                            </div>
                            <div className="space-y-1">
                              <label className="block font-mono text-xs text-[#A89880] uppercase">CPF</label>
                              <input type="text" value={m.cpf} onChange={(e) => handleMemberChange(index, 'cpf', applyCpfMask(e.target.value))} className="w-full bg-[#121214] border border-[#2E2820] rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-[#D4A843]" maxlength={14} />
                            </div>
                            <div className="space-y-1 md:col-span-2">
                              <label class="block font-mono text-xs text-[#A89880] uppercase">Data de Nascimento</label>
                              <input type="text" value={m.birth} onChange={(e) => handleMemberChange(index, 'birth', applyDateMask(e.target.value))} className="w-full bg-[#121214] border border-[#2E2820] rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-[#D4A843]" maxlength={10} />
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
                    <p className="text-sm text-[#A89880]">Confirme os dados consolidados do sinal.</p>
                    
                    <div className="bg-[#0F0D0B] p-5 rounded-2xl border border-[#2E2820] space-y-4 text-xs font-mono">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[#A89880] block text-sm font-bold">PROJETO BANDA:</span>
                          <span className="font-bold text-white text-sm block mt-1">{projectName || '-'}</span>
                        </div>
                        <div>
                          <span className="text-[#A89880] block text-sm font-bold">RESPONSÁVEL LÍDER:</span>
                          <span className="font-bold text-white text-sm block mt-1">{respName || '-'}</span>
                        </div>
                        <div>
                          <span className="text-[#A89880] block text-sm font-bold">LOTE VIGENTE:</span>
                          <span className="font-bold text-[#D4A843] text-sm block mt-1 uppercase">{activeLoteName} (R$ {activeLotePrice} / integrante)</span>
                        </div>
                        <div>
                          <span className="text-[#A89880] block text-sm font-bold">INTEGRANTES CONECTADOS:</span>
                          <span className="font-bold text-white text-sm block mt-1">{selectedMembers}</span>
                        </div>
                      </div>

                      <div className="border-t border-[#2E2820] pt-4 flex flex-col sm:flex-row justify-between items-baseline gap-4">
                        <div>
                          <span className="font-mono text-sm text-[#D4A843] font-bold">GRAVAÇÃO LIVE INCLUÍDA:</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-[#A89880] line-through block">R$ 1.500,00</span>
                            <span className="text-xs text-lime font-bold uppercase">CUSTO R$ 0</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-sm text-[#A89880] block font-bold">TAXA TOTAL DO GRUPO:</span>
                          <span className="text-3xl font-display font-black text-[#D4A843] block mt-1">R$ {selectedMembers * activeLotePrice},00</span>
                          <span className="text-xs text-[#A89880] font-mono block mt-1 uppercase">E mais {selectedMembers}kg de alimento</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-1">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" checked={acceptRules} onChange={(e) => setAcceptRules(e.target.checked)} className="mt-1 w-4 h-4 text-[#D4A843] bg-black border-[#2E2820] rounded focus:ring-[#D4A843]" />
                        <span className="text-sm text-[#A89880] leading-relaxed">
                          Declaramos ler e anuir integralmente com o regulamento do concurso, concordando com as etapas, a doação obrigatória de alimentos e as políticas de direitos autorais para as transmissões ao vivo.
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                {/* CONTROLS */}
                <div className="border-t border-[#2E2820] pt-4 flex justify-between items-center gap-4 shrink-0">
                  <div className="flex flex-col">
                    <span className="text-sm text-[#A89880] font-mono uppercase tracking-widest block font-bold">PASSO ATIVO</span>
                    <span className="text-sm text-[#F0EAE0] font-bold font-mono">0{quizStep}/05</span>
                  </div>

                  <div className="flex gap-2.5">
                    <button type="button" onClick={handleBypassClear} className="font-mono text-sm font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl uppercase">Bypass</button>
                    {quizStep > 1 && (
                      <button type="button" onClick={() => setQuizStep(quizStep - 1)} className="font-mono text-sm font-bold text-white border border-[#2E2820] bg-white/5 px-5 py-2.5 rounded-xl uppercase">Voltar</button>
                    )}
                    {quizStep < 5 ? (
                      <button type="button" onClick={handleQuizNext} className="font-mono text-sm font-bold text-black bg-[#D4A843] hover:bg-[#E8C06B] px-7 py-2.5 rounded-xl uppercase border-none">Continuar</button>
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
              className="bg-[#1A1612] border-2 border-[#D4A843] max-w-sm w-full p-6 rounded-[32px] relative space-y-6 shadow-2xl"
            >
              <button onClick={closeCheckoutModal} className="absolute right-4 top-4 text-[#A89880] hover:text-white font-mono text-xl">&times;</button>
              
              <div className="text-center space-y-2 pt-2">
                <span className="font-mono text-sm text-lime font-bold bg-lime/10 border border-lime/20 px-3 py-1 rounded-full w-max mx-auto block uppercase">● Servidor Autenticado</span>
                <h3 className="font-display font-bold text-xl text-[#F0EAE0] uppercase tracking-tight">PIX DE INSCRIÇÃO</h3>
                <p className="text-sm text-[#A89880]">Sua vaga será confirmada após compensação do Pix.</p>
              </div>

              <div className="bg-[#0F0D0B] p-4 rounded-xl flex flex-col items-center space-y-4 border border-[#2E2820]">
                <div className="w-48 h-48 bg-white p-3 rounded-xl flex items-center justify-center relative shadow-lg">
                  <div className="w-full h-full border border-black/10 flex flex-col justify-between p-2">
                    <div className="flex justify-between">
                      <div className="w-8 h-8 bg-black"></div>
                      <div class="w-8 h-8 bg-black"></div>
                    </div>
                    <div className="text-center font-bold text-[8px] text-[#0F0D0B] font-mono uppercase tracking-widest leading-none py-2">Canção Profana</div>
                    <div className="flex justify-between">
                      <div class="w-8 h-8 bg-black"></div>
                      <div className="w-12 h-12 border border-black border-dashed flex items-center justify-center"><div className="w-6 h-6 bg-[#D4A843]"></div></div>
                    </div>
                  </div>
                  {isCheckoutLoading && (
                    <div className="absolute inset-0 bg-[#121214]/95 flex flex-col items-center justify-center text-center p-3 rounded-xl">
                      <span className="w-8 h-8 rounded-full border-2 border-[#D4A843] border-t-transparent animate-spin mb-3"></span>
                      <span className="font-mono text-sm text-[#D4A843] uppercase tracking-widest font-bold">AGUARDANDO WEBHOOK...</span>
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <span className="font-mono text-sm text-[#A89880] block uppercase font-bold">TOTAL CONVERSÃO {activeLoteName}:</span>
                  <span className="text-2xl font-mono font-black text-lime block mt-1">R$ {selectedMembers * activeLotePrice},00</span>
                </div>
              </div>

              <div className="space-y-3">
                <button onClick={copyPixCode} className="font-mono text-sm font-bold text-white bg-white/5 border border-[#2E2820] py-3 rounded-xl w-full hover:bg-white/10 transition-colors uppercase">Copiar Código Pix</button>
                <button onClick={handleSimulateWebhook} className="font-mono text-sm font-bold text-black bg-lime py-3 rounded-xl w-full hover:bg-lime/90 transition-colors uppercase border-none shadow-lg shadow-lime/20">Confirmar Webhook</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SUCCESS MODAL */}
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
              className="bg-[#1A1612] border-2 border-[#D4A843] max-w-lg w-full p-8 rounded-[32px] text-center space-y-6 border border-white/5"
            >
              <div className="w-16 h-16 rounded-full bg-lime/10 text-lime border-2 border-lime flex items-center justify-center mx-auto text-3xl shadow font-bold">✓</div>
              <div className="space-y-2">
                <span className="font-mono text-sm text-lime uppercase tracking-widest font-bold">● Matrícula Concluída</span>
                <h3 className="font-display font-black text-3xl text-white uppercase tracking-tight">BANDA MATRICULADA!</h3>
                <p className="text-xs text-[#A89880] leading-relaxed max-w-sm mx-auto">O webhook do servidor processou o Pix de forma segura. O recibo regulamentar foi transmitido ao e-mail cadastrado.</p>
              </div>

              <div className="bg-[#0F0D0B] p-5 max-w-xs mx-auto grid grid-cols-2 gap-4 text-left border border-[#2E2820]">
                <div>
                  <span className="font-mono text-sm text-[#A89880] uppercase">CÓDIGO ID BANDA:</span>
                  <span className="text-xs font-bold text-[#F0EAE0] font-mono block mt-1">CP-2026-X7Y9</span>
                </div>
                <div>
                  <span class="font-mono text-sm text-[#A89880] uppercase">FILA CANAL:</span>
                  <span class="text-xs font-bold text-[#F0EAE0] font-mono block mt-1">{selectedMembers} MEMBROS</span>
                </div>
                <div class="col-span-2 border-t border-[#2E2820] pt-3">
                  <span class="font-mono text-sm text-lime uppercase font-bold">Condição Solidária:</span>
                  <p class="text-xs text-gray-300 mt-1 leading-relaxed font-mono">Trazer {selectedMembers}kg de alimento no dia do show.</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button onClick={() => window.location.reload()} className="bg-[#D4A843] hover:bg-[#E8C06B] text-black font-mono text-sm font-bold px-8 py-3.5 rounded-full uppercase tracking-wider block w-full max-w-xs mx-auto border-none">Voltar para Home</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADMIN CONTROL MODAL */}
      <AnimatePresence>
        {isAdminOpen && (
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
              className="bg-[#1A1612] border-2 border-[#D4A843] rounded-3xl p-6 w-full max-w-md space-y-6 shadow-2xl"
            >
              <button onClick={() => setIsAdminOpen(false)} className="absolute right-4 top-4 text-[#A89880] hover:text-white font-mono text-xl">&times;</button>
              <div className="text-center border-b border-[#2E2820] pb-3">
                <span className="font-mono text-sm md:text-base text-[#D4A843] font-bold uppercase block tracking-wider">PAINEL DE CONTROLE DE LOTES</span>
                <span className="text-xs text-[#A89880] block mt-1">Configure o lote ativo, vagas e status da transmissão live</span>
              </div>
              <form onSubmit={handleSaveAdminConfig} className="space-y-4">
                <div className="flex justify-between items-center bg-[#0F0D0B] p-3 rounded-lg border border-[#2E2820]">
                  <span className="font-mono text-sm text-white uppercase">Lote 1 Status:</span>
                  <select value={lotesConfig.lote1.status} onChange={(e) => setLotesConfig({ ...lotesConfig, lote1: { ...lotesConfig.lote1, status: e.target.value as any } })} className="bg-[#1A1612] border border-[#2E2820] text-white text-sm rounded px-2.5 py-1.5 outline-none">
                    <option value="ativo">Ativo</option>
                    <option value="encerrado">Encerrado</option>
                    <option value="em_breve">Em Breve</option>
                  </select>
                </div>
                <div className="flex justify-between items-center bg-[#0F0D0B] p-3 rounded-lg border border-[#2E2820]">
                  <span className="font-mono text-sm text-white uppercase">Lote 2 Status:</span>
                  <select value={lotesConfig.lote2.status} onChange={(e) => setLotesConfig({ ...lotesConfig, lote2: { ...lotesConfig.lote2, status: e.target.value as any } })} className="bg-[#1A1612] border border-[#2E2820] text-white text-sm rounded px-2.5 py-1.5 outline-none">
                    <option value="em_breve">Em Breve</option>
                    <option value="ativo">Ativo</option>
                    <option value="encerrado">Encerrado</option>
                  </select>
                </div>
                <div className="flex justify-between items-center bg-[#0F0D0B] p-3 rounded-lg border border-[#2E2820]">
                  <span className="font-mono text-sm text-white uppercase">Lote 3 Status:</span>
                  <select value={lotesConfig.lote3.status} onChange={(e) => setLotesConfig({ ...lotesConfig, lote3: { ...lotesConfig.lote3, status: e.target.value as any } })} className="bg-[#1A1612] border border-[#2E2820] text-white text-sm rounded px-2.5 py-1.5 outline-none">
                    <option value="em_breve">Em Breve</option>
                    <option value="ativo">Ativo</option>
                    <option value="encerrado">Encerrado</option>
                  </select>
                </div>
                <div className="flex justify-between items-center bg-[#0F0D0B] p-3 rounded-lg border border-[#2E2820]">
                  <span className="font-mono text-sm text-white uppercase">Live Transmissão:</span>
                  <select value={lotesConfig.live.status} onChange={(e) => setLotesConfig({ ...lotesConfig, live: { ...lotesConfig.live, status: e.target.value as any } })} className="bg-[#1A1612] border border-[#2E2820] text-white text-sm rounded px-2.5 py-1.5 outline-none">
                    <option value="em_breve">Em Breve</option>
                    <option value="ao_vivo">🔴 Ao Vivo Agora</option>
                    <option value="encerrada">Encerrada</option>
                  </select>
                </div>
                <div className="flex justify-between items-center bg-[#0F0D0B] p-3 rounded-lg border border-[#2E2820]">
                  <span className="font-mono text-sm text-white uppercase">Vagas Restantes:</span>
                  <input type="number" value={admVagas} onChange={(e) => setAdmVagas(parseInt(e.target.value) || 0)} className="w-20 bg-[#1A1612] border border-[#2E2820] text-white text-sm rounded px-2.5 py-1.5 text-center outline-none" />
                </div>
                <button type="submit" className="bg-[#D4A843] text-black font-mono text-sm font-bold px-6 py-2.5 rounded w-full border-none">SALVAR CONFIGURAÇÃO</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );

  function openQuiz() {
    setIsQuizOpen(true);
    setQuizStep(1);
  }
  function closeQuiz() {
    setIsQuizOpen(false);
  }
  function closeCheckoutModal() {
    setIsCheckoutOpen(false);
  }
  const copyPixCode = () => alert('✓ Código Pix Copiado!');
}
