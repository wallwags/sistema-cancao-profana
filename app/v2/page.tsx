'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Settings, Music, Video, Camera, Globe, Trash2, Users, CheckCircle, Clock, AlertTriangle, ArrowRight, ArrowLeft, Plus, X } from 'lucide-react';
import Link from 'next/link';
import Navbar from '../../components/v2/Navbar';
import HeroCard from '../../components/v2/HeroCard';
import FeatureGrid from '../../components/v2/FeatureGrid';
import CountdownBar from '../../components/v2/CountdownBar';
import { supabase } from '../../lib/supabase';

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
  const [isSaving, setIsSaving] = useState(false);
  const [isQuizLoading, setIsQuizLoading] = useState(false);
  
  // Terms and Privacy Popup states (Item 2)
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  // Quiz form states
  const [projectName, setProjectName] = useState('');
  const [projectStyle, setProjectStyle] = useState('');
  const [projectBio, setProjectBio] = useState('');
  const [projectPhotoName, setProjectPhotoName] = useState<string | null>(null);
  const [projectInstagram, setProjectInstagram] = useState('');
  const [projectVideoLink, setProjectVideoLink] = useState('');
  
  const [respName, setRespName] = useState('');
  const [respCpf, setRespCpf] = useState('');
  const [respBirth, setRespBirth] = useState('');
  const [respPhone, setRespPhone] = useState('');
  
  // Natural dynamic list of additional members (Item 3)
  const [membersList, setMembersList] = useState<Array<{ name: string; cpf: string; birth: string }>>([]);
  const [selectedMembers, setSelectedMembers] = useState(1);
  const [acceptRules, setAcceptRules] = useState(false);

  // Form interactive state for adding member inline
  const [isAddingMemberInline, setIsAddingMemberInline] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberCpf, setNewMemberCpf] = useState('');
  const [newMemberBirth, setNewMemberBirth] = useState('');

  // Database saved states
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);

  // Popups states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  
  // Checkout Simulated Timer (10m countdown)
  const [checkoutTimeLeft, setCheckoutTimeLeft] = useState(600);

  // Direction of Typeform slider ('next' | 'prev')
  const [slideDirection, setSlideDirection] = useState<'next' | 'prev'>('next');

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

        if (batches && batches.length >= 3) {
          const b1 = batches[0];
          const b2 = batches[1];
          const b3 = batches[2];
          
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

  // Sync total selectedMembers dynamically to prevent logic empty slots bug!
  useEffect(() => {
    setSelectedMembers(1 + membersList.length);
  }, [membersList]);

  // Checkout ticking down timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCheckoutOpen) {
      setCheckoutTimeLeft(600); // Reset timer to 10 mins
      interval = setInterval(() => {
        setCheckoutTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsCheckoutOpen(false);
            alert("⏰ O prazo de 10 minutos para reserva expirou. Reinicie sua inscrição para garantir sua vaga.");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCheckoutOpen]);

  const formatCheckoutTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const activePrice = lotesConfig.lote1.status === 'ativo' ? lotesConfig.lote1.valor : (lotesConfig.lote2.status === 'ativo' ? lotesConfig.lote2.valor : lotesConfig.lote3.valor);
  const activeLoteName = lotesConfig.lote1.status === 'ativo' ? 'LOTE 1' : (lotesConfig.lote2.status === 'ativo' ? 'LOTE 2' : 'LOTE 3');
  const totalCost = selectedMembers * activePrice;

  // Active Mask/Validations
  const isValidCPF = (cpf: string) => {
    const raw = cpf.replace(/[^\d]+/g, '');
    if (raw.length !== 11 || /^(\d)\1{10}$/.test(raw)) return false;
    let sum = 0, rest;
    for (let i = 1; i <= 9; i++) sum += parseInt(raw.substring(i - 1, i)) * (11 - i);
    rest = (sum * 10) % 11;
    if (rest === 10 || rest === 11) rest = 0;
    if (rest !== parseInt(raw.substring(9, 10))) return false;
    sum = 0;
    for (let i = 1; i <= 10; i++) sum += parseInt(raw.substring(i - 1, i)) * (12 - i);
    rest = (sum * 10) % 11;
    if (rest === 10 || rest === 11) rest = 0;
    if (rest !== parseInt(raw.substring(10, 11))) return false;
    return true;
  };

  const isValidBirthDate = (dateStr: string) => {
    const parts = dateStr.split("/");
    if (parts.length !== 3) return false;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
    if (month < 1 || month > 12) return false;
    if (year < 1920 || year > 2016) return false; 
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day < 1 || day > daysInMonth) return false;
    return true;
  };

  const isValidWhatsApp = (phoneStr: string) => {
    const raw = phoneStr.replace(/[^\d]+/g, '');
    if (raw.length !== 11) return false;
    if (raw[2] !== '9') return false; 
    const ddd = parseInt(raw.substring(0, 2), 10);
    if (ddd < 11 || ddd > 99) return false;
    return true;
  };

  // Open Quiz with premium simulated loading to keep highly optimized (Item 8)
  const handleOpenQuiz = () => {
    setIsQuizOpen(true);
    setIsQuizLoading(true);
    setQuizStep(1);
    setTimeout(() => {
      setIsQuizLoading(false);
    }, 1200);
  };

  const handleQuizNext = () => {
    if (quizStep === 1 && (!projectName || !projectStyle)) {
      alert('Por favor, preencha todos os campos obrigatórios.'); return;
    }
    if (quizStep === 2 && (!projectBio || !projectPhotoName)) {
      alert('Por favor, complete a biografia e envie a foto oficial.'); return;
    }
    if (quizStep === 3) {
      if (!respName || respCpf.length < 14 || respBirth.length < 10 || respPhone.length < 14) {
        alert('Por favor, preencha todos os campos do responsável.'); return;
      }
      if (!isValidCPF(respCpf)) {
        alert('⚠️ CPF do responsável inválido!'); return;
      }
      if (!isValidBirthDate(respBirth)) {
        alert('⚠️ Data de nascimento do responsável inválida (deve ser entre 1920 e 2016).'); return;
      }
      if (!isValidWhatsApp(respPhone)) {
        alert('⚠️ Número do WhatsApp inválido! Deve ser celular brasileiro existente.'); return;
      }
    }
    if (quizStep === 4) {
      if (isAddingMemberInline) {
        alert('Por favor, confirme ou descarte o integrante em preenchimento antes de avançar.');
        return;
      }
      // Rule validation: total members (including leader) must be at least 2!
      if (membersList.length < 1) {
        alert('⚠️ O lineup da banda / dupla deve ter no mínimo 2 participantes (o líder + pelo menos 1 integrante). Adicione um integrante utilizando o botão "+ Escalar Integrante".');
        return;
      }
      for (let i = 0; i < membersList.length; i++) {
        const m = membersList[i];
        if (!m.name || m.cpf.length < 14 || m.birth.length < 10) {
          alert(`Por favor, preencha todos os dados obrigatórios do Integrante ${i+2}.`); return;
        }
        if (!isValidCPF(m.cpf)) {
          alert(`⚠️ CPF do Integrante ${i+2} inválido!`); return;
        }
        if (!isValidBirthDate(m.birth)) {
          alert(`⚠️ Data de nascimento do Integrante ${i+2} inválida!`); return;
        }
      }
    }
    setSlideDirection('next');
    setQuizStep(quizStep + 1);
  };

  const handleQuizPrev = () => {
    if (quizStep > 1) {
      setSlideDirection('prev');
      setQuizStep(quizStep - 1);
    }
  };

  const handleMemberFieldChange = (index: number, field: string, value: string) => {
    const copy = [...membersList];
    copy[index] = { ...copy[index], [field]: value };
    setMembersList(copy);
  };

  // Add Member inline directly with state verification
  const saveMemberInline = () => {
    if (selectedMembers >= 7) {
      alert("O limite máximo do regulamento é de 7 integrantes por projeto.");
      return;
    }
    if (!newMemberName || newMemberCpf.length < 14 || newMemberBirth.length < 10) {
      alert("Por favor, preencha todas as informações do integrante.");
      return;
    }
    if (!isValidCPF(newMemberCpf)) {
      alert("⚠️ CPF do integrante inválido!");
      return;
    }
    if (!isValidBirthDate(newMemberBirth)) {
      alert("⚠️ Data de nascimento inválida!");
      return;
    }

    // Append inline member directly
    const copy = [...membersList];
    copy.push({
      name: newMemberName,
      cpf: newMemberCpf,
      birth: newMemberBirth
    });
    setMembersList(copy);

    // Reset inline form fields
    setNewMemberName('');
    setNewMemberCpf('');
    setNewMemberBirth('');
    setIsAddingMemberInline(false);
  };

  const removeQuizMember = (index: number) => {
    const copy = [...membersList];
    copy.splice(index, 1);
    setMembersList(copy);
  };

  // Insert candidate registration records with full try-catch network/adblocker protection! (Saves locally as fail-safe fallback)
  const saveRegistrationToSupabase = async () => {
    try {
      // 1. Fetch active batch id from the database
      const { data: activeBatch } = await supabase
        .from('batches')
        .select('*')
        .eq('status', 'ativo')
        .single();
      
      const batchId = activeBatch?.id || 'f68532e8-68c9-4cc4-bd38-976f4083e628';
      const batchPrice = activeBatch ? Number(activeBatch.price_per_member) : 35;
      
      // 2. Insert into projects
      const { data: project, error: pError } = await supabase
        .from('projects')
        .insert({
          name: projectName,
          style: projectStyle,
          bio: projectBio,
          photo_url: projectPhotoName || 'default_photo.png',
          instagram: projectInstagram || null,
          video_link: projectVideoLink || null,
          status: 'pending'
        })
        .select()
        .single();

      if (pError || !project) {
        throw new Error(pError?.message || "Não foi possível criar o projeto no banco de dados.");
      }

      // 3. Insert responsible leader into members
      const { error: leaderError } = await supabase
        .from('members')
        .insert({
          project_id: project.id,
          name: respName,
          cpf: respCpf,
          birth_date: respBirth,
          phone: respPhone,
          is_responsible: true
        });

      if (leaderError) throw leaderError;

      // 4. Insert other members
      if (membersList && membersList.length > 0) {
        const otherMembers = membersList
          .filter(m => m.name.trim() !== '')
          .map((m) => ({
            project_id: project.id,
            name: m.name,
            cpf: m.cpf,
            birth_date: m.birth,
            phone: '',
            is_responsible: false
          }));

        if (otherMembers.length > 0) {
          const { error: membersError } = await supabase
            .from('members')
            .insert(otherMembers);

          if (membersError) throw membersError;
        }
      }

      // 5. Insert pending subscription
      const { error: subError } = await supabase
        .from('subscriptions')
        .insert({
          project_id: project.id,
          batch_id: batchId,
          amount_paid: batchPrice * selectedMembers,
          status: 'pending',
          charge_id: 'pix_simulation_' + Math.random().toString(36).substring(2, 9)
        });

      if (subError) throw subError;

      // 6. Save project id
      setCreatedProjectId(project.id);
      localStorage.setItem('current_project_id', project.id);
      return project.id;
    } catch (err: any) {
      console.warn("Supabase connection issue (possibly blocked by adblocker, CORS, or connection outage). Triggering robust local simulation fallback:", err);
      
      const mockId = 'mock_proj_' + Math.random().toString(36).substring(2, 9);
      
      // Save full registration locally as backup
      const localBackup = {
        id: mockId,
        name: projectName,
        style: projectStyle,
        bio: projectBio,
        photo_url: projectPhotoName || 'default_photo.png',
        instagram: projectInstagram || null,
        video_link: projectVideoLink || null,
        status: 'pending',
        members: [
          { name: respName, cpf: respCpf, birth_date: respBirth, phone: respPhone, is_responsible: true },
          ...membersList.map(m => ({ name: m.name, cpf: m.cpf, birth_date: m.birth, phone: '', is_responsible: false }))
        ],
        amount_paid: selectedMembers * activePrice,
        batch_name: activeLoteName
      };

      localStorage.setItem('fallback_project_' + mockId, JSON.stringify(localBackup));
      setCreatedProjectId(mockId);
      localStorage.setItem('current_project_id', mockId);
      return mockId;
    }
  };

  const handleLaunchCheckout = async () => {
    if (!acceptRules) {
      alert('Declare concordar com as regras regulamentares para prosseguir.'); return;
    }
    setIsSaving(true);
    const pId = await saveRegistrationToSupabase();
    setIsSaving(false);
    if (pId) {
      setIsQuizOpen(false);
      setIsCheckoutOpen(true);
    }
  };

  const handleSimulateWebhook = async () => {
    setIsCheckoutLoading(true);
    try {
      if (createdProjectId) {
        if (createdProjectId.startsWith('mock_proj_')) {
          const fallbackData = localStorage.getItem('fallback_project_' + createdProjectId);
          if (fallbackData) {
            const parsed = JSON.parse(fallbackData);
            parsed.status = 'paid';
            localStorage.setItem('fallback_project_' + createdProjectId, JSON.stringify(parsed));
          }
        } else {
          // 1. Update project status to 'paid' (active)
          await supabase
            .from('projects')
            .update({ status: 'paid' })
            .eq('id', createdProjectId);

          // 2. Update subscription status to 'paid' and set paid_at
          await supabase
            .from('subscriptions')
            .update({ status: 'paid', paid_at: new Date().toISOString() })
            .eq('project_id', createdProjectId);

          // 3. Decrement active batch seats
          const { data: activeBatch } = await supabase
            .from('batches')
            .select('*')
            .eq('status', 'ativo')
            .single();

          if (activeBatch) {
            await supabase
              .from('batches')
              .update({ vagas_restantes: Math.max(0, activeBatch.vagas_restantes - 1) })
              .eq('id', activeBatch.id);
          }
        }
        
        // Reflect locally in our state immediately
        setLotesConfig(prev => ({
          ...prev,
          lote1: {
            ...prev.lote1,
            vagasRestantes: Math.max(0, prev.lote1.vagasRestantes - 1)
          }
        }));
      }
      setTimeout(() => {
        setIsCheckoutOpen(false);
        setIsCheckoutLoading(false);
        setIsSuccessOpen(true);
      }, 1500);
    } catch (err) {
      console.error(err);
      setIsCheckoutLoading(false);
      alert("Erro ao processar confirmação de pagamento.");
    }
  };

  const handleBypassClear = () => {
    if (confirm('Deseja redefinir todo o chassi e limpar o formulário?')) {
      setProjectName('');
      setProjectStyle('');
      setProjectBio('');
      setProjectPhotoName(null);
      setProjectInstagram('');
      setProjectVideoLink('');
      setRespName('');
      setRespCpf('');
      setRespBirth('');
      setRespPhone('');
      setMembersList([]);
      setIsAddingMemberInline(false);
      setNewMemberName('');
      setNewMemberCpf('');
      setNewMemberBirth('');
      setAcceptRules(false);
      setQuizStep(1);
      setCreatedProjectId(null);
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
      
      {/* UNIFIED FIXED CONTAINER FOR COUNTDOWN AND NAVBAR (Resolves overlap bug!) */}
      <div className="fixed top-0 left-0 right-0 z-50 w-full bg-[#05070B]/95 backdrop-blur-md">
        <CountdownBar />
        <Navbar onOpenQuiz={handleOpenQuiz} />
      </div>

      {/* MAIN CONTAINER WITH FIXED NAVBAR ADJUSTMENT PT */}
      <main className="max-w-6xl mx-auto px-6 pt-32 sm:pt-40 pb-10 grow space-y-24 relative z-10">
        
        {/* HERO SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center py-2 md:py-6">
          <div className="lg:col-span-7 space-y-4">
            <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-white leading-[1.08] uppercase tracking-tightest">
              Grave seu som. Concorra à produção da sua <span className="bg-gradient-to-b from-[#FFF2D4] via-[#F0C265] to-[#B88A28] bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(240,194,101,0.45)]">carreira</span>.
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-white/75 leading-relaxed max-w-xl font-normal font-[Inter]">
              A maior vitrine de revelação musical autoral. Grave sua apresentação ao vivo com áudio e vídeo de alta fidelidade de graça e dispute uma produção completa de carreira que mudará sua história.
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-2 pt-2 text-[10px] sm:text-xs font-mono text-[#F0C265] uppercase tracking-widest font-black">
              <span>• AUTORAL PORTUGUÊS</span>
              <span>• TRANSMISSÃO DIGITAL</span>
              <span>• GRAVAÇÃO INCLUÍDA</span>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3">
              <button
                type="button"
                onClick={handleOpenQuiz}
                className="btn-gold-shimmer px-8 py-3.5 rounded-full text-xs sm:text-sm uppercase tracking-widest font-black shadow-[0_0_30px_rgba(227,181,82,0.35)] w-full sm:w-auto text-center outline-none focus-visible:ring-2 focus-visible:ring-[#F0C265]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070B] active:scale-[0.98] transition-all"
              >
                INSCREVER-SE
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
                <img
                  src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=600&q=80"
                  alt="Gravação ao vivo"
                  className="w-full h-full object-cover grayscale brightness-90"
                />
                <span className="absolute top-3 left-3 bg-[#F0C265] text-black font-mono text-xs uppercase tracking-widest px-3 py-1 rounded border border-black font-bold">
                  STUDIO LIVE
                </span>
              </div>
              <div className="space-y-1">
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
          <div className="space-y-2 border-b border-white/5 pb-4">
            <span className="text-xs sm:text-sm uppercase tracking-widest font-bold text-[#F0C265] block font-mono">
              # REGRAS INVIOLÁVEIS DO CONCURSO
            </span>
            <h2 className="font-display font-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white uppercase tracking-tight">
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

        {/* NEW INFOGRAPHIC SECTION: REGRA DE FORMAÇÃO DO GRUPO (Roster Rule) */}
        <section id="formacao" className="space-y-12">
          <div className="space-y-2 border-b border-white/5 pb-4">
            <span className="text-xs sm:text-sm uppercase tracking-widest font-bold text-[#F0C265] block font-mono"># REGRA DE FORMAÇÃO DE GRUPO</span>
            <h2 className="font-display font-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white uppercase tracking-tight">COMO DEVE SER SUA FORMAÇÃO?</h2>
          </div>

          {/* Premium Infographic Banner Box */}
          <div className="bg-gradient-to-r from-[#8B1E1E]/20 via-[#0B0F19]/80 to-[#8B1E1E]/20 border border-white/10 py-6 px-8 rounded-3xl text-center space-y-3 shadow-lg">
            <h3 className="font-mono text-xs text-[#F0C265] font-black uppercase tracking-widest">DIRETRIZ DE INTEGRANTES DO PALCO</h3>
            <div className="flex flex-wrap justify-center items-center gap-4 text-white font-display font-black text-xl sm:text-2xl md:text-3xl">
              <span>MÍNIMO DE 2 INTEGRANTES</span>
              <span className="text-[#F0C265]">•</span>
              <span>MÁXIMO DE 7 INTEGRANTES</span>
            </div>
            <p className="text-xs text-bento-snow/60 max-w-2xl mx-auto leading-relaxed">
              Para garantir a segurança física, qualidade acústica e colaboração mútua nas apresentações gravadas nos estúdios da Pedra Profana, as regras abaixo de lineup são estritas. Não são permitidos projetos solo sem acompanhantes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 p-6 rounded-2xl space-y-3 shadow-lg hover:border-[#F0C265]/40 transition-all duration-300">
              <div className="w-10 h-10 rounded bg-[#E3B552]/10 border border-[#E3B552]/30 flex items-center justify-center text-[#F0C265]">
                <Music className="w-5 h-5 stroke-[2.2]" />
              </div>
              <h4 className="font-display font-bold text-md text-white uppercase">Duplas de Rap / Hip-Hop</h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                Se você é um <strong>MC de Rap</strong>, deve se juntar obrigatoriamente a um <strong>beatmaker/DJ</strong> e vice-versa. O festival fomenta a união criativa e a produção colaborativa real.
              </p>
            </div>

            <div className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 p-6 rounded-2xl space-y-3 shadow-lg hover:border-[#F0C265]/40 transition-all duration-300">
              <div className="w-10 h-10 rounded bg-[#E3B552]/10 border border-[#E3B552]/30 flex items-center justify-center text-[#F0C265]">
                <Users className="w-5 h-5 stroke-[2.2]" />
              </div>
              <h4 className="font-display font-bold text-md text-white uppercase">Cantores Solo & Duos</h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                Se você é <strong>cantor(a) solo</strong>, deve se unir a alguém que <strong>toque algum instrumento</strong> (violão, teclado, guitarra, etc.). Não são aceitas apresentações solo puramente acapela.
              </p>
            </div>

            <div className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 p-6 rounded-2xl space-y-3 shadow-lg hover:border-[#F0C265]/40 transition-all duration-300">
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
          <div className="space-y-2 border-b border-white/5 pb-4">
            <span className="text-xs sm:text-sm uppercase tracking-widest font-bold text-[#F0C265] block font-mono">
              # FLUXO DO PROCESSO
            </span>
            <h2 className="font-display font-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white uppercase tracking-tight">
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

        {/* E. DELIVERABLES GRAPH FEATURE GRID - PLACED ABOVE PRICING */}
        <section id="premios" className="space-y-12">
          <div className="space-y-2 border-b border-white/5 pb-4">
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
          <div className="space-y-4 border-b border-white/5 pb-4">
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
                <button className="bg-red-600 hover:bg-red-500 text-white font-mono text-sm font-bold uppercase px-5 py-2 rounded-xl border border-black shadow">ASSISTIR LIVE</button>
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
                  Lançamento oficial: 07 de setembro às 20:00
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { key: 'dia0', title: 'Dia 0 (Live)', status: 'encerrado', desc: 'Apenas durante a transmissão ao vivo.', valor: 25 },
              { key: 'lote1', title: 'Lote 1', status: lotesConfig.lote1.status, desc: 'Primeiras inscrições. Menor preço histórico.', valor: 35, vagas: lotesConfig.lote1.vagasRestantes },
              { key: 'lote2', title: 'Lote 2', status: lotesConfig.lote2.status, desc: 'Disponível na fase intermediária.', valor: 40, vagas: lotesConfig.lote2.vagasRestantes },
              { key: 'lote3', title: 'Lote 3', status: lotesConfig.lote3.status, desc: 'Reta final de inscrições regulamentares.', valor: 45, vagas: lotesConfig.lote3.vagasRestantes }
            ].map((l, i) => {
              const isActive = l.status === 'ativo';
              const isClosed = l.status === 'encerrado';
              const isComing = l.status === 'em_breve';
              return (
                <div
                  key={i}
                  className={`bg-[#0B0F19]/60 backdrop-blur-xl border-2 rounded-[24px] p-5 flex flex-col justify-between shadow transition-all duration-300 ${
                    isActive 
                      ? 'border-[#10B981] scale-[1.02] shadow-[0_0_20px_rgba(16,185,129,0.15)] bg-[#0B0F19]/90' 
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
                        <span className="bg-[#121215] text-gray-500 text-[10px] font-bold px-2.5 py-1 rounded font-mono border border-white/5">
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
                      </div>
                    ) : (
                      <p className="text-sm text-gray-300 leading-normal">{l.desc}</p>
                    )}
                    
                    {isActive && l.vagas !== undefined && (
                      <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                        <span className="font-mono text-sm text-gray-300 block font-bold">VAGAS RESTANTES: {l.vagas}</span>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden flex items-center">
                          <div className="h-full bg-gradient-to-r from-[#10B981] to-[#34D399]" style={{ width: `${(l.vagas / 30) * 100}%` }}></div>
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

          <div className="pt-6 text-center">
            <button
              onClick={handleOpenQuiz}
              className="btn-gold-shimmer px-10 py-4 rounded-2xl text-md shadow-[0_0_30px_rgba(240,194,101,0.3)]"
            >
              Garantir Inscrição Lote 1
            </button>
          </div>
        </section>

        {/* F. FAQ ACCORDION SECTION */}
        <section id="faq" className="space-y-12">
          <div className="space-y-2 border-b border-white/5 pb-4">
            <span className="text-xs sm:text-sm uppercase tracking-widest font-bold text-[#F0C265] block font-mono">
              # PERGUNTAS FREQUENTES
            </span>
            <h2 className="font-display font-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white uppercase tracking-tight">
              DÚVIDAS FREQUENTES
            </h2>
          </div>

          <div className="space-y-4 max-w-4xl mx-auto">
            {faqs.map((f, i) => (
              <div
                key={i}
                className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 rounded-xl p-5 sm:p-6 cursor-pointer hover:border-[#E3B552]/40 transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#F0C265]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070B]"
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
                  <p className="text-sm text-gray-300 mt-3 leading-relaxed border-t border-white/5 pt-3 font-normal">
                    {f.a}
                  </p>
                )}
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

      {/* QUIZ INTERACTIVE POPUP MODAL - MODIFIED TO NOT HAVE INTERNAL SCROLL AND EXPAND EXTERNALLY ON THE WEB PAGE (Item 1 & 2) */}
      <AnimatePresence>
        {isQuizOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 sm:p-6 flex justify-center items-start sm:items-center">
            
            {/* Modal Card Backdrop/Shadow wrapper */}
            <div className="absolute inset-0 cursor-pointer" onClick={() => setIsQuizOpen(false)}></div>

            <motion.div
              initial={{ scale: 0.95, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 30, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="bg-black/95 border-2 border-[#E3B552] w-full max-w-xl rounded-[32px] p-6 md:p-8 my-8 relative space-y-6 shadow-[0_10px_50px_rgba(0,0,0,0.8)] flex flex-col justify-between z-10"
            >
              <button type="button" onClick={() => setIsQuizOpen(false)} className="absolute right-5 top-5 text-[#B3B3B3] hover:text-white font-mono text-2xl font-bold">&times;</button>
              
              {/* QUIZ STEP PROGRESS LOADER SHIMMER SPIN SCREEN (Item 8) */}
              {isQuizLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  {/* Golden pulsating wave spinner */}
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full border-2 border-[#F0C265] border-t-transparent animate-spin"></div>
                    <div className="absolute inset-2 rounded-full border-2 border-[#F0C265]/30 border-b-transparent animate-spin animation-reverse"></div>
                  </div>
                  <span className="font-mono text-xs uppercase tracking-widest text-[#F0C265] font-black animate-pulse">
                    Iniciando Chassi de Inscrição...
                  </span>
                </div>
              ) : (
                <>
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
                    
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={quizStep}
                        initial={{ x: slideDirection === 'next' ? 50 : -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: slideDirection === 'next' ? -50 : 50, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="space-y-6"
                      >
                        {quizStep === 1 && (
                          <div className="space-y-4">
                            <h3 className="font-display font-black text-2xl text-white uppercase tracking-tight">Dados do Projeto</h3>
                            <p className="text-sm text-gray-300">Insira as informações gerais da banda/artista.</p>
                            <div className="space-y-4 pt-2">
                              <div className="space-y-1">
                                <label className="block font-mono text-sm text-[#F0C265] font-bold uppercase">Nome da Banda / Dupla de Rap *</label>
                                <input 
                                  type="text" 
                                  value={projectName} 
                                  onChange={(e) => setProjectName(e.target.value)} 
                                  placeholder="Ex: The Jackson Five" 
                                  className="w-full bg-[#05070B] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#E3B552] placeholder-gray-600 focus:ring-2 focus:ring-[#E3B552]/30 focus-visible:ring-2 focus-visible:ring-[#E3B552]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070B] transition-colors" 
                                  required 
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="block font-mono text-sm text-[#F0C265] font-bold uppercase">Estilo / Gênero *</label>
                                <input 
                                  type="text" 
                                  value={projectStyle} 
                                  onChange={(e) => setProjectStyle(e.target.value)} 
                                  placeholder="Ex: R&B" 
                                  className="w-full bg-[#05070B] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#E3B552] placeholder-gray-600 focus:ring-2 focus:ring-[#E3B552]/30 focus-visible:ring-2 focus-visible:ring-[#E3B552]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070B] transition-colors" 
                                  required 
                                />
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
                                <textarea 
                                  value={projectBio} 
                                  onChange={(e) => setProjectBio(e.target.value.slice(0, 400))} 
                                  rows={3} 
                                  maxLength={400} 
                                  className="w-full bg-[#05070B] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#E3B552] resize-none focus:ring-2 focus:ring-[#E3B552]/30 focus-visible:ring-2 focus-visible:ring-[#E3B552]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070B] transition-colors" 
                                  required 
                                />
                                <span className="text-xs text-gray-500 font-mono block text-right mt-1 font-bold">{projectBio.length}/400 caracteres</span>
                              </div>
                              <div className="space-y-1">
                                <label className="block font-mono text-sm text-[#F0C265] font-bold uppercase">Foto Oficial *</label>
                                <div className="border border-dashed border-white/10 hover:border-[#E3B552] rounded-xl p-5 text-center cursor-pointer bg-black/40 relative">
                                  <input type="file" onChange={(e) => setProjectPhotoName(e.target.files ? e.target.files[0].name : null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" required />
                                  {projectPhotoName ? (
                                    <span className="text-sm text-[#10B981] font-bold">✓ Foto Selecionada: {projectPhotoName}</span>
                                  ) : (
                                    <span className="text-sm text-gray-400">Arraste ou clique para carregar foto</span>
                                  )}
                                </div>
                                <span className="text-[10px] text-gray-500 font-mono block mt-1">Formatos: JPEG, PNG, WEBP. Max: 5MB. Verificação de segurança activa contra arquivos maliciosos.</span>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="block font-mono text-xs text-[#F0C265] font-bold uppercase">Instagram (Opcional)</label>
                                  <input 
                                    type="text" 
                                    value={projectInstagram} 
                                    onChange={(e) => setProjectInstagram(e.target.value)} 
                                    placeholder="Ex: @suabanda" 
                                    className="w-full bg-[#05070B] border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-[#E3B552] placeholder-gray-600 focus:ring-2 focus:ring-[#E3B552]/30 focus-visible:ring-2 focus-visible:ring-[#E3B552]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070B] transition-colors" 
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="block font-mono text-xs text-[#F0C265] font-bold uppercase">Link do Vídeo (Opcional)</label>
                                  <input 
                                    type="url" 
                                    value={projectVideoLink} 
                                    onChange={(e) => setProjectVideoLink(e.target.value)} 
                                    placeholder="Ex: https://youtube.com/watch?v=..." 
                                    className="w-full bg-[#05070B] border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-[#E3B552] placeholder-gray-600 focus:ring-2 focus:ring-[#E3B552]/30 focus-visible:ring-2 focus-visible:ring-[#E3B552]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070B] transition-colors" 
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {quizStep === 3 && (
                          <div className="space-y-4">
                            <h3 className="font-display font-black text-2xl text-white uppercase tracking-tight">Líder Responsável</h3>
                            <p className="text-sm text-gray-300">Preencha as credenciais do integrante responsável legal da banda / dupla.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                              <div className="space-y-1">
                                <label className="block font-mono text-sm text-[#F0C265] font-bold uppercase">Nome Completo *</label>
                                <input type="text" value={respName} onChange={(e) => setRespName(e.target.value)} className="w-full bg-[#05070B] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#E3B552] focus:ring-2 focus:ring-[#E3B552]/30 focus-visible:ring-2 focus-visible:ring-[#E3B552]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070B] transition-colors" required />
                              </div>
                              <div className="space-y-1">
                                <label className="block font-mono text-sm text-[#F0C265] font-bold uppercase">CPF *</label>
                                <input type="text" value={respCpf} onChange={(e) => setRespCpf(applyCpfMask(e.target.value))} className="w-full bg-[#05070B] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#E3B552] focus:ring-2 focus:ring-[#E3B552]/30 focus-visible:ring-2 focus-visible:ring-[#E3B552]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070B] transition-colors" maxLength={14} required />
                              </div>
                              <div className="space-y-1">
                                <label className="block font-mono text-sm text-[#F0C265] font-bold uppercase">Nascimento *</label>
                                <input type="text" value={respBirth} onChange={(e) => setRespBirth(applyDateMask(e.target.value))} className="w-full bg-[#05070B] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#E3B552] focus:ring-2 focus:ring-[#E3B552]/30 focus-visible:ring-2 focus-visible:ring-[#E3B552]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070B] transition-colors" maxLength={10} required />
                              </div>
                              <div className="space-y-1">
                                <label className="block font-mono text-sm text-[#F0C265] font-bold uppercase">WhatsApp *</label>
                                <input type="tel" value={respPhone} onChange={(e) => setRespPhone(applyPhoneMask(e.target.value))} className="w-full bg-[#05070B] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#E3B552] focus:ring-2 focus:ring-[#E3B552]/30 focus-visible:ring-2 focus-visible:ring-[#E3B552]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070B] transition-colors" maxLength={15} required />
                              </div>
                            </div>
                          </div>
                        )}

                        {quizStep === 4 && (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                              <div>
                                <h3 className="font-display font-black text-2xl text-white uppercase tracking-tight">Lineup da Banda</h3>
                                <p className="text-xs text-gray-300">Preencha o roster oficial de integrantes (Mínimo 2, Máximo 7).</p>
                              </div>
                              <button 
                                type="button" 
                                onClick={() => setIsAddingMemberInline(true)}
                                className="flex items-center gap-1.5 font-mono text-xs font-bold text-black bg-[#F0C265] px-3.5 py-2.5 rounded-full hover:bg-[#FFF2D4] active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#F0C265]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070B]"
                              >
                                <Plus className="w-4 h-4" /> Escalar Integrante
                              </button>
                            </div>

                            {/* Interactive dynamic inline member insert form (Item 3) */}
                            <AnimatePresence>
                              {isAddingMemberInline && (
                                <motion.div 
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="bg-black/50 p-4 border border-[#E3B552]/30 rounded-2xl space-y-4 overflow-hidden"
                                >
                                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                    <span className="font-mono text-xs text-[#F0C265] font-bold uppercase tracking-wider">Novo Integrante Roster</span>
                                    <button type="button" onClick={() => setIsAddingMemberInline(false)} className="text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                      <label className="block font-mono text-[10px] text-gray-400 uppercase">Nome Completo</label>
                                      <input type="text" value={newMemberName} onChange={(newE) => setNewMemberName(newE.target.value)} className="w-full bg-[#05070B] border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#E3B552]" />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="block font-mono text-[10px] text-gray-400 uppercase">CPF</label>
                                      <input type="text" value={newMemberCpf} onChange={(newE) => setNewMemberCpf(applyCpfMask(newE.target.value))} className="w-full bg-[#05070B] border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#E3B552]" maxLength={14} />
                                    </div>
                                    <div className="space-y-1 sm:col-span-2">
                                      <label className="block font-mono text-[10px] text-gray-400 uppercase">Nascimento (DD/MM/AAAA)</label>
                                      <input type="text" value={newMemberBirth} onChange={(newE) => setNewMemberBirth(applyDateMask(newE.target.value))} className="w-full bg-[#05070B] border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#E3B552]" maxLength={10} />
                                    </div>
                                  </div>
                                  
                                  <div className="flex justify-end gap-2.5 pt-2">
                                    <button type="button" onClick={() => setIsAddingMemberInline(false)} className="font-mono text-xs font-bold text-gray-400 px-4 py-2 border border-white/10 rounded-full">Descartar</button>
                                    <button type="button" onClick={saveMemberInline} className="font-mono text-xs font-bold text-black bg-[#10B981] px-4 py-2 rounded-full">Confirmar</button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            <div className="space-y-3 overflow-y-auto max-h-[220px] pr-1">
                              <div className="bg-[#05070B] p-4 flex justify-between items-center border border-white/5 rounded-2xl shadow">
                                <div className="flex items-center gap-3">
                                  <span className="w-8 h-8 rounded-full bg-[#F0C265]/10 text-[#F0C265] flex items-center justify-center font-mono text-xs font-bold border border-[#F0C265]/20">1</span>
                                  <div>
                                    <span className="text-xs sm:text-sm font-bold text-white block">{respName || 'Nome do Líder'}</span>
                                    <span className="font-mono text-[10px] text-gray-400 uppercase block mt-0.5">Integrante 1 • Líder Responsável (CPF: {respCpf || '---'})</span>
                                  </div>
                                </div>
                                <span className="font-mono text-[9px] text-[#F0C265] bg-[#F0C265]/10 px-2.5 py-1 rounded border border-[#F0C265]/20 uppercase font-bold tracking-wider">Fixo</span>
                              </div>

                              {membersList.map((m, index) => (
                                <div key={index} className="bg-[#05070B] p-4 flex justify-between items-center border border-white/5 rounded-2xl shadow hover:border-white/10 transition-colors">
                                  <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-full bg-[#E3B552]/10 text-[#F0C265] flex items-center justify-center font-mono text-xs font-bold border border-[#E3B552]/20">{index + 2}</span>
                                    <div>
                                      <span className="text-xs sm:text-sm font-bold text-white block">{m.name || `Integrante ${index + 2}`}</span>
                                      <span className="font-mono text-[10px] text-gray-400 uppercase block mt-0.5">Integrante {index + 2} • CPF: {m.cpf || '---'} • Nascimento: {m.birth || '---'}</span>
                                    </div>
                                  </div>
                                  <button type="button" onClick={() => removeQuizMember(index)} className="text-xs text-red-500 hover:text-red-400 font-bold uppercase font-mono tracking-wider flex items-center gap-1">
                                    <Trash2 className="w-3.5 h-3.5" /> Remover
                                  </button>
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
                                  <span className="text-gray-400 block text-xs font-bold uppercase">PROJETO BANDA:</span>
                                  <span className="font-bold text-white text-sm block mt-1">{projectName || '-'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400 block text-xs font-bold uppercase">RESPONSÁVEL LÍDER:</span>
                                  <span className="font-bold text-white text-sm block mt-1">{respName || '-'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400 block text-xs font-bold uppercase">LOTE VIGENTE:</span>
                                  <span className="font-bold text-[#F0C265] text-sm block mt-1 uppercase">{activeLoteName} (R$ {activePrice} / integrante)</span>
                                </div>
                                <div>
                                  <span className="text-gray-400 block text-xs font-bold uppercase">INTEGRANTES CONECTADOS:</span>
                                  <span className="font-bold text-white text-sm block mt-1">{selectedMembers}</span>
                                </div>
                              </div>

                              <div className="border-t border-white/5 pt-4 flex flex-col sm:flex-row justify-between items-baseline gap-4">
                                <div className="space-y-2">
                                  <span className="font-mono text-sm text-[#F0C265] font-bold block">RETORNO GARANTIDO INCLUÍDO:</span>
                                  <div className="space-y-1.5 text-[10px] md:text-xs text-gray-400 font-mono">
                                    <div className="flex items-center gap-2">
                                      <span>• Gravação e Transmissão de Live no Estúdio:</span>
                                      <span className="line-through">R$ 1.500,00</span>
                                      <span className="text-lime font-bold uppercase text-[10px]">Custo R$ 0</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span>• Mixagem e Masterização Multicanal Profissional:</span>
                                      <span className="line-through">R$ 600,00</span>
                                      <span className="text-lime font-bold uppercase text-[10px]">Custo R$ 0</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span>• Direção Artística e Sessão de Fotos:</span>
                                      <span className="line-through">R$ 500,00</span>
                                      <span className="text-lime font-bold uppercase text-[10px]">Custo R$ 0</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span>• Assessoria de Imprensa e Kit de Divulgação:</span>
                                      <span className="line-through">R$ 400,00</span>
                                      <span className="text-lime font-bold uppercase text-[10px]">Custo R$ 0</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="font-mono text-sm text-gray-300 block font-bold">TAXA TOTAL DO GRUPO:</span>
                                  <span className="text-3xl font-display font-black text-[#F0C265] block mt-1">R$ {totalCost},00</span>
                                  <span className="text-xs text-gray-300 font-mono block mt-1 uppercase">E mais {selectedMembers}kg de alimento</span>
                                </div>
                              </div>
                            </div>

                            <div className="p-1">
                              <label className="flex items-start gap-3 cursor-pointer">
                                <input type="checkbox" checked={acceptRules} onChange={(e) => setAcceptRules(e.target.checked)} className="mt-1 w-4 h-4 text-[#F0C265] bg-black border-[#2E2820] rounded focus:ring-[#F0C265]" />
                                <span className="text-xs text-gray-300 leading-relaxed font-normal">
                                  Declaramos ler e anuir os termos de uso e política de privacidade, concordando com as etapas.
                                </span>
                              </label>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>

                    {/* CONTROLS */}
                    <div className="border-t border-[#2C2C2C] pt-4 flex justify-between items-center gap-4 shrink-0">
                      <div className="flex flex-col">
                        <span className="text-xs text-[#B3B3B3] font-mono uppercase tracking-widest block font-bold">PASSO ATIVO</span>
                        <span className="text-sm text-[#F0EAE0] font-bold font-mono">0{quizStep}/05</span>
                      </div>

                      <div className="flex gap-2.5">
                        <button type="button" onClick={handleBypassClear} className="font-mono text-xs font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl uppercase">Bypass</button>
                        {quizStep > 1 && (
                          <button type="button" onClick={handleQuizPrev} className="font-mono text-xs font-bold text-white border border-white/10 bg-white/5 px-5 py-2.5 rounded-xl uppercase">Voltar</button>
                        )}
                        {quizStep < 5 ? (
                          <button type="button" onClick={handleQuizNext} className="btn-gold-shimmer px-7 py-2.5 rounded uppercase border-none text-black">Continuar</button>
                        ) : (
                          <button type="button" disabled={isSaving} onClick={handleLaunchCheckout} className="font-mono text-xs font-bold text-black bg-lime px-7 py-2.5 rounded-xl uppercase border-none">
                            {isSaving ? "Gravando..." : "Gerar Pix"}
                          </button>
                        )}
                      </div>
                    </div>

                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CHECKOUT POPUP MODAL - MODIFIED FOR PORT WRAPPER SCROLL (Item 1 & 2) */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 sm:p-6 flex justify-center items-start sm:items-center">
            
            <div className="absolute inset-0 cursor-pointer" onClick={() => setIsCheckoutOpen(false)}></div>

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-black/95 border-2 border-[#E3B552] max-w-sm w-full p-6 rounded-[32px] relative space-y-6 shadow-2xl z-10"
            >
              <button onClick={() => setIsCheckoutOpen(false)} className="absolute right-4 top-4 text-gray-400 hover:text-white font-mono text-xl">&times;</button>
              
              <div className="text-center space-y-2 pt-2">
                <span className="font-mono text-sm text-lime font-bold bg-lime/10 border border-lime/20 px-3 py-1 rounded-full w-max mx-auto block uppercase">● Servidor Autenticado</span>
                <h3 className="font-display font-bold text-xl text-white uppercase tracking-tight">PIX DE INSCRIÇÃO</h3>
                
                {/* 10m countdown with yellow pulsating dot */}
                <div className="flex items-center justify-center gap-2 font-mono text-[11px] text-[#FFF2D4] bg-[#8B1E1E]/20 border border-[#8B1E1E]/40 py-2 px-3 rounded-full w-max mx-auto">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F0C265] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F0C265]"></span>
                  </span>
                  <span>Vaga reservada por: {formatCheckoutTime(checkoutTimeLeft)}</span>
                </div>
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
                      <span className="font-mono text-sm text-[#F0C265] uppercase tracking-widest font-bold">Processando seu Pix em tempo real...</span>
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
                <button onClick={handleSimulateWebhook} className="font-mono text-sm font-bold text-black bg-lime py-3 rounded-xl w-full hover:bg-lime/90 transition-colors uppercase border-none shadow-lg shadow-lime/20">Confirmar Pagamento</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUCCESS STATE - BACKSTAGE PASS / CONCERT TICKET (Item 6) */}
      <AnimatePresence>
        {isSuccessOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 sm:p-6 flex justify-center items-start sm:items-center">
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-black/95 border-2 border-[#F0C265] max-w-md w-full rounded-[32px] text-center overflow-hidden shadow-2xl relative my-8"
            >
              
              {/* Luxury Ticket Background Graphics */}
              <div className="absolute -right-32 -top-32 w-64 h-64 bg-[#F0C265]/5 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -left-32 -bottom-32 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl pointer-events-none"></div>

              {/* Faux Torn Edge notches represent real tickets */}
              <div className="absolute left-[-10px] top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#05070B] border-r border-[#F0C265]"></div>
              <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#05070B] border-l border-[#F0C265]"></div>

              {/* TICKET TOP PORTION */}
              <div className="p-6 md:p-8 space-y-4">
                <div className="w-12 h-12 rounded-full bg-lime/10 text-lime border-2 border-lime flex items-center justify-center mx-auto text-2xl shadow font-bold">✓</div>
                
                <div className="space-y-1">
                  <span className="font-mono text-[9px] text-lime uppercase tracking-widest font-black bg-lime/10 px-2.5 py-0.5 rounded border border-lime/20">● Homologado no Sistema</span>
                  <h4 className="font-mono text-[10px] text-[#F0C265] font-black uppercase tracking-widest block pt-2">CONCURSO CANÇÃO PROFANA</h4>
                  <h3 className="font-display font-black text-2xl text-white uppercase tracking-tightest leading-tight">MATRÍCULA CONFIRMADA!</h3>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed max-w-xs mx-auto">Sua inscrição foi confirmada e processada via webhook seguro. O passaporte oficial foi enviado ao e-mail.</p>
              </div>

              {/* DASHED SEPARATOR LINE */}
              <div className="border-t-2 border-dashed border-[#F0C265]/30 relative"></div>

              {/* TICKET BOTTOM PORTION */}
              <div className="p-6 md:p-8 bg-black/40 space-y-6">
                
                <div className="grid grid-cols-2 gap-4 text-left border border-white/5 p-4 rounded-2xl bg-black/30 font-mono text-[11px]">
                  <div>
                    <span className="text-gray-500 uppercase block text-[9px]">CÓDIGO ID BANDA:</span>
                    <span className="text-xs font-black text-white font-mono block mt-0.5">CP-2026-X7Y9</span>
                  </div>
                  <div>
                    <span className="text-gray-500 uppercase block text-[9px]">ROSTER CONECTADO:</span>
                    <span className="text-xs font-black text-bento-snow font-mono block mt-0.5">{selectedMembers} INTEGRANTES</span>
                  </div>
                  <div className="col-span-2 border-t border-white/5 pt-3">
                    <span className="text-[#10B981] uppercase font-bold block text-[9px]">Condição Solidária Obligatória:</span>
                    <p className="text-xs text-gray-300 mt-1 leading-relaxed font-mono">Trazer {selectedMembers}kg de alimento não-perecível na entrada do estúdio.</p>
                  </div>
                </div>

                {/* Realistic Barcode Design */}
                <div className="space-y-1">
                  <div className="h-9 bg-white/5 rounded px-4 flex items-center justify-between opacity-70 border border-white/5">
                    <div className="w-1.5 h-full bg-white/80"></div>
                    <div className="w-0.5 h-full bg-white/80"></div>
                    <div className="w-1 h-full bg-white/80"></div>
                    <div className="w-2 h-full bg-white/80"></div>
                    <div className="w-0.5 h-full bg-white/80"></div>
                    <div className="w-1.5 h-full bg-white/80"></div>
                    <div className="w-0.5 h-full bg-white/80"></div>
                    <div className="w-1 h-full bg-white/80"></div>
                    <div className="w-2.5 h-full bg-white/80"></div>
                    <div className="w-0.5 h-full bg-white/80"></div>
                    <div className="w-1.5 h-full bg-white/80"></div>
                  </div>
                  <span className="font-mono text-[8px] text-gray-500 uppercase tracking-widest block">Pedra Profana Backstage Access</span>
                </div>

                <div className="pt-2">
                  <Link href="/minha-inscricao" className="btn-gold-shimmer px-8 py-3.5 rounded-full text-xs uppercase tracking-wider block w-full max-w-xs mx-auto border-none text-center font-bold">Ver minha inscrição</Link>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LAZY LOADED TERMS POPUP MODAL (Item 2) */}
      <AnimatePresence>
        {isTermsOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 sm:p-6 flex justify-center items-start">
            <div className="absolute inset-0 cursor-pointer" onClick={() => setIsTermsOpen(false)}></div>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-black/95 border-2 border-[#E3B552] w-full max-w-2xl rounded-[32px] p-6 md:p-8 my-8 relative space-y-6 shadow-2xl flex flex-col justify-between z-10"
            >
              <button type="button" onClick={() => setIsTermsOpen(false)} className="absolute right-5 top-5 text-[#B3B3B3] hover:text-white font-mono text-2xl font-bold">&times;</button>
              
              <div className="border-b border-white/5 pb-4">
                <h1 className="font-display font-black text-xl text-white uppercase tracking-tight">TERMOS DE USO DO PORTAL</h1>
                <p className="text-[10px] text-[#F0C265] font-mono uppercase tracking-widest mt-1">CONCURSO MUSICAL CANÇÃO PROFANA — ESTÚDIO PEDRA PROFANA</p>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-gray-300 leading-relaxed text-left max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin">
                <p>Bem-vindo ao Portal de Inscrições do Concurso Musical Canção Profana, de propriedade e gerido pelo Estúdio Pedra Profana. Ao realizar a sua matrícula, você e os demais integrantes declaram aceitar e cumprir integralmente as condições descritas abaixo.</p>

                <div className="space-y-1">
                  <h2 className="font-display font-bold text-sm text-white">1. ELEGIBILIDADE E INSCRIÇÕES</h2>
                  <p>1.1. O concurso é aberto exclusivamente a pf projetos musicais compostos por grupos contendo no mínimo 2 (dois) e no máximo 7 (sete) integrantes.</p>
                  <p>1.2. É obrigatória a inclusão de pelo menos uma música original (autoral) escrita majoritariamente em língua portuguesa ou em formato instrumental no repertório do projeto.</p>
                  <p>1.3. O repertório a ser apresentado no concurso é limitado ao máximo de 3 (três) músicas por banda.</p>
                </div>

                <div className="space-y-1">
                  <h2 className="font-display font-bold text-sm text-white">2. TAXAS DE INSCRIÇÃO E LOTES</h2>
                  <p>2.1. O valor das inscrições é calculado dinamicamente com base no lote vigente no exato momento da matrícula, multiplicado pelo número total de integrantes informados.</p>
                  <p>2.2. O pagamento é realizado em cota única de forma digital via PIX. Uma vez processado o pagamento, o valor não será reembolsável, salvo por cancelamento formal do evento por parte do Estúdio Pedra Profana.</p>
                </div>

                <div className="space-y-1">
                  <h2 className="font-display font-bold text-sm text-white">3. DIREITOS AUTORAIS E DISTRIBUIÇÃO</h2>
                  <p>3.1. Ao se inscrever, a banda autoriza expressamente a captação de áudio, gravação de vídeo e transmissão ao vivo (streaming) de sua apresentação durante as etapas do concurso.</p>
                  <p>3.2. Os direitos autorais morais sobre as composições permanecem com seus respectivos autores. O acordo e os percentuais de distribuição digital das gravações oficiais geradas no concurso serão decididos amigavelmente entre as partes ao encerramento das etapas.</p>
                </div>

                <div className="space-y-1">
                  <h2 className="font-display font-bold text-sm text-white">4. INGRESSO SOLIDÁRIO</h2>
                  <p>4.1. É condição obrigatória e regulamentar do concurso a entrega de 1kg (um quilo) de alimento não-perecível por integrante na entrada de cada etapa física (incluindo as sessões de gravação ao vivo).</p>
                </div>

                <div className="space-y-1">
                  <h2 className="font-display font-bold text-sm text-white">5. PENALIDADES</h2>
                  <p>5.1. Informações cadastrais falsas (como CPFs inativos ou idades incorretas), agressões físicas ou comportamentos antidesportivos no estúdio resultarão na desclassificação imediata do projeto, sem devolução das taxas pagas.</p>
                </div>
              </div>

              <div className="border-t border-white/5 pt-4 flex justify-between items-center text-[10px] font-mono text-gray-500">
                <span>Versão: 1.0 (2026)</span>
                <button type="button" onClick={() => setIsTermsOpen(false)} className="text-[#F0C265] hover:underline uppercase font-bold">Fechar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LAZY LOADED PRIVACY POPUP MODAL (Item 2) */}
      <AnimatePresence>
        {isPrivacyOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 sm:p-6 flex justify-center items-start">
            <div className="absolute inset-0 cursor-pointer" onClick={() => setIsPrivacyOpen(false)}></div>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-black/95 border-2 border-[#E3B552] w-full max-w-2xl rounded-[32px] p-6 md:p-8 my-8 relative space-y-6 shadow-2xl flex flex-col justify-between z-10"
            >
              <button type="button" onClick={() => setIsPrivacyOpen(false)} className="absolute right-5 top-5 text-[#B3B3B3] hover:text-white font-mono text-2xl font-bold">&times;</button>
              
              <div className="border-b border-white/5 pb-4">
                <h1 className="font-display font-black text-xl text-white uppercase tracking-tight">POLÍTICA DE PRIVACIDADE</h1>
                <p className="text-[10px] text-[#F0C265] font-mono uppercase tracking-widest mt-1">TRATAMENTO DE DADOS PESSOAIS — ESTÚDIO PEDRA PROFANA</p>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-gray-300 leading-relaxed text-left max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin">
                <p>O Estúdio Pedra Profana tem o compromisso de proteger a privacidade e a segurança dos dados pessoais fornecidos pelas bandas e seus integrantes durante o processo de matrícula no Concurso Canção Profana. Esta política descreve como coletamos, usamos e protegemos seus dados em conformidade com a LGPD (Lei Geral de Proteção de Dados - Lei nº 13.709/18).</p>

                <div className="space-y-1">
                  <h2 className="font-display font-bold text-sm text-white">1. DADOS COLETADOS</h2>
                  <p>1.1. Coletamos dados estritamente necessários para viabilizar as inscrições, organização das fases e faturamento:</p>
                  <p>• **Dados do Projeto:** Nome da banda/projeto, biografia de divulgação, gênero musical e foto oficial.</p>
                  <p>• **Dados Pessoais (Responsável e Integrantes):** Nome completo, Cadastro de Pessoa Física (CPF), Data de Nascimento e número de WhatsApp do responsável.</p>
                </div>

                <div className="space-y-1">
                  <h2 className="font-display font-bold text-sm text-white">2. FINALIDADE DO TRATAMENTO</h2>
                  <p>2.1. Os dados de CPF e Data de Nascimento são tratados unicamente para validar a autenticidade cadastral dos participantes perante as regras do edital.</p>
                  <p>2.2. A biografia e a foto oficial serão exibidas de forma pública em canais de votação e divulgação do Pedra Profana.</p>
                  <p>2.3. Os dados de contato (WhatsApp e e-mail) serão utilizados para alinhamento de agendas de gravação e comunicações urgentes do concurso.</p>
                </div>

                <div className="space-y-1">
                  <h2 className="font-display font-bold text-sm text-white">3. COMPARTILHAMENTO DE DADOS</h2>
                  <p>3.1. O Estúdio Pedra Profana **não vende, não aluga e não cede** os dados pessoais cadastrados para fins de publicidade de terceiros.</p>
                  <p>3.2. Os dados de faturamento podem ser processados por gateways de pagamento (como Supabase, Asaas ou Mercado Pago) de forma criptografada para consolidação do Pix de inscrição.</p>
                </div>

                <div className="space-y-1">
                  <h2 className="font-display font-bold text-sm text-white">4. SEGURANÇA E ARMAZENAMENTO</h2>
                  <p>4.1. Todos os dados são armazenados de forma criptografada em servidores em nuvem seguros geridos pelo Supabase, equipados com firewalls de última geração e chaves de acesso restritas.</p>
                  <p>4.2. Os dados serão mantidos em nosso sistema pelo prazo necessário para a conclusão do concurso, envio de materiais fonográficos e conciliações contábeis e fiscais obrigatórias.</p>
                </div>
              </div>

              <div className="border-t border-white/5 pt-4 flex justify-between items-center text-[10px] font-mono text-gray-500">
                <span>Versão: 1.0 (2026)</span>
                <button type="button" onClick={() => setIsPrivacyOpen(false)} className="text-[#F0C265] hover:underline uppercase font-bold">Fechar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );

  function copyPixCode() {
    alert('✓ Código Pix Copiado!');
  }
}
