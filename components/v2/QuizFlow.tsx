'use client';

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { Trash2, Plus, X, Copy, Share2, Ticket, MessageCircle } from 'lucide-react';
import Script from 'next/script';
import { supabase } from '../../lib/supabase';
import {
  applyCpfMask, applyDateMask, applyPhoneMask,
  isValidCPF, isValidBirthDate, isValidWhatsApp, isValidEmail
} from '../../lib/validators';
import { TermsModal, PrivacyModal } from './LegalModals';

interface QuizFlowProps {
  isOpen: boolean;
  onClose: () => void;
  activePrice: number;
  activeLoteName: string;
  onPaymentSuccess: () => void;
  onJoinBand?: (inviteCode: string) => void;
  waitlistMode?: boolean;
  origem?: 'home' | 'v2';
  sandboxPix?: boolean;
  linkLoteId?: string | null;
  cupom?: string | null;
  suporteWa?: string | null;
}


const ESTILOS = ['Rap', 'Trap', 'Funk', 'Rock', 'MPB', 'Pop', 'Sertanejo', 'Outro'];
const FUNCOES = ['Vocalista', 'MC', 'Beatmaker', 'Guitarrista', 'Baixista', 'Baterista', 'Tecladista', 'DJ'];

export default function QuizFlow({ isOpen, onClose, activePrice, activeLoteName, onPaymentSuccess, onJoinBand, waitlistMode = false, origem = 'home', sandboxPix = false, linkLoteId = null, cupom = null, suporteWa = null }: QuizFlowProps) {
  const [quizStep, setQuizStep] = useState(1);

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
  const [respEmail, setRespEmail] = useState('');
  const [respRole, setRespRole] = useState('');
  const [respRoleOther, setRespRoleOther] = useState('');

  // Natural dynamic list of additional members (roster)
  const [membersList, setMembersList] = useState<Array<{ name: string; cpf: string; birth: string; role: string; phone?: string; email?: string }>>([]);
  const [selectedMembers, setSelectedMembers] = useState(1);
  const [acceptRules, setAcceptRules] = useState(false);

  // Inline add-member form
  const [isAddingMemberInline, setIsAddingMemberInline] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberBirth, setNewMemberBirth] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [newMemberRoleOther, setNewMemberRoleOther] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [memberErrors, setMemberErrors] = useState<Record<string, string>>({});

  // Inline validation errors (no native alerts)
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Draft Recovery
  const [draftToRestore, setDraftToRestore] = useState<any>(null);

  // Cupom via link (?cupom=): valida ANTECIPADAMENTE so para EXIBIR o desconto na revisao.
  // Nao altera nada fora do quiz; o desconto real e aplicado pelo servidor.
  useEffect(() => {
    if (!isOpen || !cupom) { setCupomInfo(null); return; }
    let alive = true;
    (async () => {
      try {
        const { data } = await supabase.rpc('validar_cupom_lote', { p_codigo: cupom });
        if (!alive) return;
        const r = (typeof data === 'string' ? JSON.parse(data) : data) as { valido?: boolean; preco?: number; lote_nome?: string } | null;
        setCupomInfo(r && r.valido ? { valido: true, preco: Number(r.preco), loteNome: r.lote_nome } : { valido: false });
      } catch {
        // Falha de rede/rate-limit = DESCONHECIDO (null): o servidor continua validando.
        // Nunca marcamos invalido sem resposta definitiva do servidor.
        if (alive) setCupomInfo(null);
      }
    })();
    return () => { alive = false; };
  }, [isOpen, cupom]);

  // Legal popups (also reachable from quiz step 5)
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  // Checkout states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [entryPrice, setEntryPrice] = useState<number | null>(null); // preco unitario real retornado pelo servidor (cupom aplicado)
  const [cupomInfo, setCupomInfo] = useState<{ valido: boolean; preco?: number; loteNome?: string } | null>(null); // validacao antecipada do cupom (revisao)
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [checkoutTimeLeft, setCheckoutTimeLeft] = useState(600);
  const [checkoutExpired, setCheckoutExpired] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [showManualConfirm, setShowManualConfirm] = useState(false);
  const [pollingStep, setPollingStep] = useState(0);
  const [pixCopied, setPixCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Success ticket
  const [ticketCode, setTicketCode] = useState('CP-2026-');
  const [inviteCode, setInviteCode] = useState('');
  const [inviteCopied, setInviteCopied] = useState(false);
  const [bandResult, setBandResult] = useState<{ pago: number; minimo: number; total: number; ativa: boolean } | null>(null);
  const [similarBands, setSimilarBands] = useState<string[]>([]);
  const [similarChoice, setSimilarChoice] = useState<'none' | 'mine' | 'other'>('none');
  const [mineCpf, setMineCpf] = useState('');
  const [mineChecking, setMineChecking] = useState(false);
  const [mineResult, setMineResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // Fluxo "essa banda e minha": prova por CPF (servidor responde sim/nao + destino; nunca expoe codigos)
  const handleMineCheck = async () => {
    const cpf = mineCpf.replace(/\D/g, '');
    if (cpf.length !== 11) { setMineResult({ ok: false, msg: 'Digite seu CPF completo (11 números).' }); return; }
    setMineChecking(true);
    setMineResult(null);
    try {
      const { data, error } = await supabase.rpc('claim_band_check', { p_name: projectName.trim(), p_cpf: cpf });
      setMineChecking(false);
      if (error || !data) { setMineResult({ ok: false, msg: 'Não foi possível verificar agora. Tente novamente.' }); return; }
      const r = (typeof data === 'string' ? JSON.parse(data) : data) as { status: string; msg?: string; link?: string };
      if (r.status === 'found' && r.link) {
        setMineResult({ ok: true, msg: (r.msg || 'Banda localizada!') + ' Abrindo seu portal...' });
        setTimeout(() => { window.location.href = r.link as string; }, 1200);
      } else if (r.status === 'full') {
        setMineResult({ ok: false, msg: r.msg || 'Essa banda já está com as vagas de integrantes completas.' });
      } else if (r.status === 'not_member') {
        setMineResult({ ok: false, msg: r.msg || 'Seu CPF não está entre os integrantes escalados. Peça ao líder para escalar você pelo portal da banda.' });
      } else {
        setMineResult({ ok: false, msg: r.msg || 'Banda não localizada. Continue como nova inscrição.' });
      }
    } catch {
      setMineChecking(false);
      setMineResult({ ok: false, msg: 'Falha de conexão. Tente novamente.' });
    }
  };
  const [joinState, setJoinState] = useState<'idle' | 'asking' | 'picking' | 'declined'>('idle');
  const sessionRef = useRef<string>('');
  const inviteCodeRef = useRef<string>('');

  const [slideDirection, setSlideDirection] = useState<'next' | 'prev'>('next');

  // GSAP render mirrors (logical state stays separate from animated visibility)
  const [quizVisible, setQuizVisible] = useState(false);
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [memberFormRendered, setMemberFormRendered] = useState(false);

  const quizCardRef = useRef<HTMLDivElement | null>(null);
  const checkoutCardRef = useRef<HTMLDivElement | null>(null);
  const successCardRef = useRef<HTMLDivElement | null>(null);
  const stepRef = useRef<HTMLDivElement | null>(null);
  const collapseRef = useRef<HTMLDivElement | null>(null);
  const confirmRef = useRef<HTMLDivElement | null>(null);
  const quizClosingRef = useRef(false);
  const checkoutClosingRef = useRef(false);
  const quizOpenedAt = useRef<number>(0);

  // Gateway Pix real (ativado pelo dev no painel): definem o modo do checkout
  const [pixGatewayOn, setPixGatewayOn] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'individual' | 'lider'>('individual');
  const [sandboxV2, setSandboxV2] = useState<{ ativo: boolean; pix_real: boolean }>({ ativo: false, pix_real: false });
  const [pixData, setPixData] = useState<{ paymentId: string; qr: string | null; qrBase64: string | null; amount?: number; expiresAt?: string | null } | null>(null);
  const pixDataRef = useRef<{ paymentId: string; qr: string | null; qrBase64: string | null; amount?: number; expiresAt?: string | null } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const applyPixData = (d: { paymentId: string; qr: string | null; qrBase64: string | null; amount?: number; expiresAt?: string | null } | null) => {
    pixDataRef.current = d;
    setPixData(d);
  };

  const demoRef = useRef(false);
  const funnelLogged = useRef<Set<string>>(new Set());
  const tsRenderedRef = useRef(false);
  const [honey, setHoney] = useState('');
  const [tsToken, setTsToken] = useState('');

  const tryRenderTurnstile = () => {
    if (tsRenderedRef.current) return;
    const el = document.getElementById('cf-ts');
    const w = window as unknown as { turnstile?: { render: (el: HTMLElement | string, opts: Record<string, unknown>) => void } };
    if (el && w.turnstile) {
      w.turnstile.render(el, {
        sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '0x4AAAAAAE0kTUa2G49aYxX-',
        callback: (token: string) => setTsToken(token)
      });
      tsRenderedRef.current = true;
    }
  };

  // Backexit: alerta nativo do navegador quando checkout Pix está aberto
  useEffect(() => {
    if (!isCheckoutOpen || checkoutExpired) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isCheckoutOpen, checkoutExpired]);

  // SSR-safe layout effect
  const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

  // HARDENING: refs for save/webhook race protection (fix: stale createdProjectId closure)
  const saveIdRef = useRef<string | null>(null);
  const savePromiseRef = useRef<Promise<string> | null>(null);
  const webhookDoneRef = useRef(false);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync total selectedMembers dynamically (prevents phantom-member bug)
  useEffect(() => {
    setSelectedMembers(1 + membersList.length);
  }, [membersList]);



  // ---------- funil ----------
  const logFunnel = (event: string, step = '') => {
    const key = event + ':' + step;
    if (funnelLogged.current.has(key)) return;
    if (!sessionRef.current && typeof window !== 'undefined') {
      sessionRef.current = sessionStorage.getItem('cp_funnel_session') || '';
      if (!sessionRef.current) {
        sessionRef.current = Math.random().toString(36).slice(2) + Date.now().toString(36);
        sessionStorage.setItem('cp_funnel_session', sessionRef.current);
      }
    }
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: sessionRef.current, event, step }),
      keepalive: true
    }).then(() => funnelLogged.current.add(key)).catch(() => {});
  };

  // checa nomes de banda parecidos AO DIGITAR (passo 1): aviso imediato, no lugar certo
  useEffect(() => {
    if (quizStep !== 2) return;
    if (!projectName.trim() || projectName.trim().length < 3) { setSimilarBands([]); setSimilarChoice('none'); setMineResult(null); return; }
    const t = setTimeout(() => { checkSimilarBands(); }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectName, quizStep]);

  // checa nomes de banda parecidos antes do pagamento
  const checkSimilarBands = async () => {
    if (!projectName.trim()) return;
    try {
      const { data } = await supabase.rpc('find_similar_bands', { p_name: projectName.trim() });
      setSimilarBands((data || []).map(String));
    } catch { /* silencioso */ }
  };

  // ---------- GSAP choreography ----------
  // Open/close sync: logical isOpen -> visible mirror
  useEffect(() => {
    if (isOpen) {
      quizClosingRef.current = false;
      setQuizVisible(true);
      quizOpenedAt.current = Date.now();
    }
  }, [isOpen]);

  // Quiz card entrance
  useIsomorphicLayoutEffect(() => {
    if (quizVisible && quizCardRef.current) {
      gsap.fromTo(quizCardRef.current,
        { scale: 0.95, y: 30, opacity: 0 },
        { scale: 1, y: 0, opacity: 1, duration: 0.3, ease: 'power2.out', clearProps: 'transform' });
    }
  }, [quizVisible]);

  // Step transition - enter-only (slide-in with direction), no exit choreography
  useIsomorphicLayoutEffect(() => {
    if (quizVisible && !draftToRestore) {
      logFunnel('quiz_step', String(quizStep));

    }
    if (quizVisible && stepRef.current && !draftToRestore) {
      gsap.fromTo(stepRef.current,
        { x: slideDirection === 'next' ? 48 : -48, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.25, ease: 'power2.out', clearProps: 'transform,opacity' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizStep, quizVisible]);

  // Checkout card entrance
  useIsomorphicLayoutEffect(() => {
    if (checkoutVisible && checkoutCardRef.current) {
      gsap.fromTo(checkoutCardRef.current,
        { scale: 0.95, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.25, ease: 'power2.out', clearProps: 'transform' });
    }
  }, [checkoutVisible]);

  // Success ticket entrance
  useIsomorphicLayoutEffect(() => {
    if (successVisible && successCardRef.current) {
      gsap.fromTo(successCardRef.current,
        { scale: 0.95, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, ease: 'power2.out', clearProps: 'transform' });
    }
  }, [successVisible]);

  // Bloqueia o scroll do fundo enquanto qualquer popup estiver aberto
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const anyOpen = isOpen || isCheckoutOpen || isSuccessOpen;
    document.body.style.overflow = anyOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, isCheckoutOpen, isSuccessOpen]);

  useEffect(() => {
    if (quizVisible) setTimeout(tryRenderTurnstile, 350);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizVisible]);

  // Renderiza/re-tenta quando o usuario esta no passo 1 (onde o widget vive)
  useEffect(() => {
    if (isOpen && quizStep === 1) {
      tryRenderTurnstile();
      const t1 = setTimeout(tryRenderTurnstile, 600);
      const t2 = setTimeout(tryRenderTurnstile, 2000);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, quizStep]);

  // Close quiz with exit animation, then unmount + notify parent
  const requestCloseQuiz = () => {
    if (quizClosingRef.current) return;
    quizClosingRef.current = true;
    if (quizCardRef.current && typeof window !== 'undefined') {
      gsap.to(quizCardRef.current, {
        scale: 0.95, y: 30, opacity: 0, duration: 0.22, ease: 'power2.in',
        onComplete: () => {
          quizClosingRef.current = false;
          setQuizVisible(false);
          onClose();
        }
      });
    } else {
      quizClosingRef.current = false;
      setQuizVisible(false);
      onClose();
    }
  };

  // Member inline form - whole block (container + content) expands together
  const openMemberForm = () => {
    setMemberErrors({});
    setIsAddingMemberInline(true);
    setMemberFormRendered(true);
  };

  const closeMemberForm = () => {
    setMemberErrors({});
    if (collapseRef.current && typeof window !== 'undefined') {
      gsap.to(collapseRef.current, {
        height: 0, opacity: 0, duration: 0.25, ease: 'power2.in',
        onComplete: () => {
          setIsAddingMemberInline(false);
          setMemberFormRendered(false);
        }
      });
    } else {
      setIsAddingMemberInline(false);
      setMemberFormRendered(false);
    }
  };

  // Member form entrance (height 0 -> auto, container and content as one block)
  useIsomorphicLayoutEffect(() => {
    if (memberFormRendered && collapseRef.current) {
      gsap.fromTo(collapseRef.current,
        { height: 0, opacity: 0 },
        { height: 'auto', opacity: 1, duration: 0.3, ease: 'power2.out' });
    }
  }, [memberFormRendered]);

  // Offer draft recovery every time the quiz is opened (only if form is empty)
  useEffect(() => {
    if (isOpen) {
      try {
        const savedDraft = localStorage.getItem('quiz_draft_v2');
        if (savedDraft && !projectName) {
          const parsed = JSON.parse(savedDraft);
          if (parsed.projectName) setDraftToRestore(parsed);
        }
      } catch (e) {
        console.error(e);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Auto-save Quiz progress draft - debounced (500ms) to avoid write-per-keystroke jank
  useEffect(() => {
    if (!isOpen || draftToRestore) return;
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      const draft = {
        step: quizStep,
        projectName,
        projectStyle,
        projectBio,
        projectPhotoName,
        projectInstagram,
        projectVideoLink,
        respName,
        respCpf,
        respBirth,
        respPhone,
        respEmail,
        membersList
      };
      try { localStorage.setItem('quiz_draft_v2', JSON.stringify(draft)); } catch { /* storage full/blocked */ }
    }, 500);
    return () => { if (draftTimerRef.current) clearTimeout(draftTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, quizStep, projectName, projectStyle, projectBio, projectPhotoName, projectInstagram, projectVideoLink, respName, respCpf, respBirth, respPhone, respEmail, membersList, draftToRestore]);

  const totalCost = selectedMembers * activePrice;
  // Preco final do Pix: entry_price vem do servidor (RPC aplica o cupom); fallback = preco antecipado do cupom ou lote ativo
  const unitEstimado = cupomInfo?.valido && cupomInfo.preco != null ? cupomInfo.preco : activePrice;
  const cupomDescUn = cupomInfo?.valido && cupomInfo.preco != null ? Math.max(activePrice - cupomInfo.preco, 0) : 0;
  const unitFinal = entryPrice != null ? entryPrice : unitEstimado;
  const fullTotal = paymentMode === 'lider' ? totalCost : activePrice;
  const finalTotal = paymentMode === 'lider' ? selectedMembers * unitFinal : unitFinal;
  // Valor verdadeiro cobrado pelo gateway (quando o Pix ja foi gerado)
  const displayTotal = pixData?.amount && pixData.amount > 0 ? pixData.amount : finalTotal;
  const cupomValidado = cupomInfo?.valido === true;
  // progresso por tela do fluxo
  const totalTelas = selectedMembers + 7;
  const pct = Math.min(97, Math.round(4 + Math.pow(Math.max(quizStep - 1, 0) / (totalTelas - 1), 0.6) * 93));
  const setTamanhoBanda = (n: number) => {
    setSelectedMembers(n);
    setMembersList(prev => {
      const list = [...prev];
      while (list.length < n - 1) list.push({ name: '', cpf: '', birth: '', role: '', phone: '', email: '' });
      if (list.length > n - 1) list.length = n - 1;
      return list;
    });
  };
  const cupomDiscount = cupomValidado ? Math.max(fullTotal - displayTotal, 0) : 0;

  // ---------- Inline validation helpers ----------
  const clearError = (key: string) => setErrors(prev => {
    if (!prev[key]) return prev;
    const copy = { ...prev };
    delete copy[key];
    return copy;
  });

  const validateStep = (step: number): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (step === 1) {
      if (!respPhone) errs.respPhone = 'Informe o WhatsApp.';
      else if (!isValidWhatsApp(respPhone)) errs.respPhone = 'Informe um celular válido com DDD.';
    }
    if (step === 2) {
      if (!projectName.trim() || projectName.trim().length < 2) errs.projectName = 'Informe o nome da banda / dupla.';
      if (projectInstagram.replace(/@/g, '').trim().length < 2) errs.projectInstagram = 'Informe o @ do Instagram da banda.';
    }
    if (step === 3) {
      if (!projectStyle.trim()) errs.projectStyle = 'Selecione o estilo (ou marque Outro).';
    }
    if (step === 4) {
      if (!respName.trim()) errs.respName = 'Informe o nome completo do responsável.';
    }
    if (step === 5) {
      if (!respEmail.trim()) errs.respEmail = 'Informe o e-mail.';
      else if (!isValidEmail(respEmail)) errs.respEmail = 'Informe um e-mail válido.';
    }
    if (step === 6) {
      if (!respCpf) errs.respCpf = 'Informe o CPF.';
      else if (respCpf.length < 14) errs.respCpf = 'CPF incompleto.';
      else if (!isValidCPF(respCpf)) errs.respCpf = 'CPF inválido. Confira os dígitos.';
    }
    if (step === 7) {
      if (selectedMembers < 2 || selectedMembers > 7) errs.tamanho = 'Escolha o tamanho da banda (2 a 7).';
    }
    if (step > 7 && step < selectedMembers + 7) {
      const mi = step - 8;
      const m = membersList[mi];
      if (!m || m.name.trim().length < 2) errs['memb' + mi] = 'Informe o nome completo do integrante.';
    }
    if (step === selectedMembers + 7) {
      if (!acceptRules) errs.acceptRules = 'É obrigatório declarar ciência das regras para gerar o Pix.';
    }
    return errs;
  };

  const handleQuizNext = () => {
    const errs = validateStep(quizStep);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSlideDirection('next');
    setQuizStep(Math.min(quizStep + 1, selectedMembers + 7));
  };

  const handleQuizPrev = () => {
    setErrors({});
    if (quizStep > 1) {
      setSlideDirection('prev');
      setQuizStep(quizStep - 1);
    }
  };

  // ---------- Members roster ----------
  const saveMemberInline = () => {
    const errs: Record<string, string> = {};
    if (selectedMembers >= 7) {
      errs.newMemberName = 'O limite máximo do regulamento é de 7 integrantes por projeto.';
      setMemberErrors(errs);
      return;
    }
    if (!newMemberName.trim()) errs.newMemberName = 'Informe o nome completo.';
    if (!newMemberPhone || newMemberPhone.replace(/\D/g, '').length < 10) errs.newMemberPhone = 'Informe o WhatsApp com DDD.';
    if (!newMemberEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newMemberEmail)) errs.newMemberEmail = 'Informe um e-mail válido.';
    if (newMemberBirth && !isValidBirthDate(newMemberBirth)) errs.newMemberBirth = 'Data inválida (ou deixe vazio).';
    const effRole = newMemberRole === 'Outro' ? newMemberRoleOther.trim() : newMemberRole;
    if (!effRole) errs.newMemberRole = 'Selecione ou descreva a função.';
    setMemberErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const copy = [...membersList];
    copy.push({ name: newMemberName.trim(), cpf: '', birth: newMemberBirth, role: effRole, phone: newMemberPhone.trim(), email: newMemberEmail.trim() });
    setMembersList(copy);
    setNewMemberName('');
    setNewMemberBirth('');
    setNewMemberPhone('');
    setNewMemberEmail('');
    setMemberErrors({});
    closeMemberForm();
    clearError('roster');
  };

  const removeQuizMember = (index: number) => {
    const copy = [...membersList];
    copy.splice(index, 1);
    setMembersList(copy);
  };

  // ---------- Photo upload with browser canvas compression ----------
  const handleImageCompression = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, projectPhotoName: 'Imagem acima de 5MB. Envie um arquivo menor.' }));
      return;
    }

    setProjectPhotoName("Processando imagem...");
    clearError('projectPhotoName');

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setProjectPhotoName(file.name + " (Web Comprimida)");
          try { localStorage.setItem('temp_compressed_photo', compressedDataUrl); } catch { /* quota */ }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // ---------- Draft restore/discard ----------
  const handleRestoreDraft = () => {
    if (draftToRestore) {
      setProjectName(draftToRestore.projectName || '');
      setProjectStyle(draftToRestore.projectStyle || '');
      setProjectBio(draftToRestore.projectBio || '');
      setProjectPhotoName(draftToRestore.projectPhotoName || null);
      setProjectInstagram(draftToRestore.projectInstagram || '');
      setProjectVideoLink(draftToRestore.projectVideoLink || '');
      setRespName(draftToRestore.respName || '');
      setRespCpf(draftToRestore.respCpf || '');
      setRespBirth(draftToRestore.respBirth || '');
      setRespPhone(draftToRestore.respPhone || '');
      setRespEmail(draftToRestore.respEmail || '');
      setMembersList(draftToRestore.membersList || []);
      const dv = Number(draftToRestore.step) || 1;
      const mapaAntigo: Record<number, number> = { 1: 2, 2: 2, 3: 4, 4: 8, 5: 10 };
      setQuizStep(dv <= 5 ? (mapaAntigo[dv] ?? 1) : dv);
      setDraftToRestore(null);
    }
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem('quiz_draft_v2');
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
    setRespEmail('');
    setMembersList([]);
    setQuizStep(1);
    setErrors({});
    setDraftToRestore(null);
  };

  // ---------- Database save (network/adblock resilient with local fallback) ----------
  // Registro da banda: gravação atômica no servidor (projeto + líder + integrantes + lote + convite)
  const saveRegistrationToSupabase = async (): Promise<string> => {
    try {
      // Foto e bio saem do fluxo de matricula: sao convidadas na tela de sucesso (via WhatsApp do estudio)
      const membersPayload = membersList.map(m => ({ name: m.name, cpf: '', birth: '', role: m.role, phone: '', email: '' }));

      const { data, error } = await supabase.rpc('create_band_registration', {
        p_origem: origem === 'v2' ? 'v2' : 'home',
        p_lote_id: linkLoteId || null,
        p_cupom: cupomInfo && cupomInfo.valido === false ? null : (cupom || null),
        p_name: projectName,
        p_style: projectStyle,
        p_bio: '',
        p_photo_url: null,
        p_instagram: projectInstagram ? projectInstagram.replace(/@/g, '') : null,
        p_video_link: projectVideoLink || null,
        p_leader: { name: respName, cpf: respCpf, birth: '', phone: respPhone, email: respEmail, role: 'Líder' },
        p_members: membersPayload
      });

      if (error || !data) throw new Error(error?.message || 'Falha ao registrar a banda.');

      setInviteCode(data.invite_code);
      inviteCodeRef.current = data.invite_code;
      if (data.entry_price != null) setEntryPrice(Number(data.entry_price));
      if (Array.isArray(data.similar_bands) && data.similar_bands.length > 0) setSimilarBands(data.similar_bands.map(String));
      localStorage.removeItem('quiz_draft_v2');
      localStorage.removeItem('temp_compressed_photo');
      localStorage.setItem('current_project_id', data.project_id);
      localStorage.setItem('current_cpf_v2', respCpf);
      return data.project_id;
    } catch (err: any) {
      console.warn('Falha no registro da banda:', err);
      const em = String(err?.message || '');
      setCheckoutError(em.includes('SEM_VAGAS')
        ? 'As inscrições ainda não estão abertas ou as vagas se esgotaram. Entre no Grupo VIP para ser avisado na abertura.'
        : 'Não foi possível concluir o registro agora. Verifique sua conexão e tente de novo. Seus dados continuam aqui.');
      setShowManualConfirm(true);
      webhookDoneRef.current = false;
      setIsCheckoutLoading(false);
      return '';
    }
  };

  // ---------- Checkout flow ----------
  const handleLaunchCheckout = () => {
    const errs = validateStep(selectedMembers + 7);
    if (honey.trim()) {
      setErrors({ acceptRules: 'Não foi possível validar o envio. Recarregue a página e tente novamente.' });
      return;
    }
    if (similarBands.length > 0 && similarChoice === 'none') {
      errs.acceptRules = 'Confirme se sua banda é uma das bandas com nome parecido listadas acima.';
      return errs;
    }
    if (similarBands.length > 0 && similarChoice === 'mine' && (!mineResult || !mineResult.ok)) {
      errs.acceptRules = 'Localize sua banda pelo CPF ou declare que é outra banda.';
    }
    // Turnstile desativado temporariamente (widget em ajuste) - rate limits por CPF continuam ativos no servidor
    if (false && !tsToken && !(demoRef.current && origem === 'v2')) {
      errs.acceptRules = 'Confirme a verificação anti-robô antes de gerar o Pix.';
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (isCheckoutOpen || isCheckoutLoading) return; // anti double-click

    // Reset checkout state and launch instantly (save runs in background)
    webhookDoneRef.current = false;
    saveIdRef.current = null;
    setPollingStep(0);
    setCheckoutTimeLeft(600);
    setCheckoutExpired(false);
    setConfirmClose(false);
    setCheckoutError(null);
    setShowManualConfirm(false);
    setPixCopied(false);
    setEntryPrice(null);
    setIsCheckoutOpen(true);
    setCheckoutVisible(true);
    setIsCheckoutLoading(false);
    logFunnel('checkout_opened');

    savePromiseRef.current = saveRegistrationToSupabase().then(id => {
      saveIdRef.current = id;
      return id;
    });
  };

  const requestCloseCheckout = () => {
    if (checkoutExpired) {
      closeCheckout();
      return;
    }
    setConfirmClose(true);
  };

  const closeCheckout = () => {
    if (checkoutClosingRef.current) return;
    if (!webhookDoneRef.current && !checkoutExpired) logFunnel('checkout_abandoned');
    checkoutClosingRef.current = true;
    const finish = () => {
      checkoutClosingRef.current = false;
      setIsCheckoutOpen(false);
      setCheckoutVisible(false);
      setConfirmClose(false);
      setIsCheckoutLoading(false);
      setPollingStep(0);
      setShowManualConfirm(false);
      applyPixData(null);
    };
    if (checkoutCardRef.current && typeof window !== 'undefined') {
      gsap.to(checkoutCardRef.current, {
        scale: 0.95, opacity: 0, duration: 0.2, ease: 'power2.in',
        onComplete: finish
      });
    } else {
      finish();
    }
  };

  // Checkout 10-minute price-guarantee timer (graceful expiry, no data loss)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isCheckoutOpen && !checkoutExpired) {
      interval = setInterval(() => {
        setCheckoutTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setCheckoutExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCheckoutOpen, checkoutExpired]);

  // Flag do gateway (lido do painel): Pix real x simulacao.
  // Na home vale o flag global; na /v2 o dev decide via sandbox.
  useEffect(() => {
    if (!isOpen) return;
    supabase.from('site_settings').select('key,value').in('key', ['gateway_pix_active', 'payment_mode'])
      .then(({ data }) => {
        const map: Record<string, string> = {};
        (data || []).forEach(r => { map[r.key] = typeof r.value === 'string' ? r.value : String(r.value ?? ''); });
        setPixGatewayOn(map['gateway_pix_active'] === 'true');
        setPaymentMode(map['payment_mode'] === 'lider' ? 'lider' : 'individual');
        // Sandbox /v2: config do dev (ativa o layout de teste e o botao de simulacao)
        if (origem === 'v2' && map['v2_env']) {
          try {
            const raw = typeof map['v2_env'] === 'string' ? JSON.parse(map['v2_env']) : (map['v2_env'] as unknown);
            const o = (raw || {}) as { ativo?: boolean; pix_real?: boolean };
            setSandboxV2({ ativo: o.ativo === true, pix_real: o.pix_real === true });
          } catch { /* ignora */ }
        }
      }, () => { setPixGatewayOn(false); setPaymentMode('individual'); });
  }, [isOpen]);

  // Gerar QR de simulacao (sandbox): payload EMV fake visualmente correto
  const gerarSimulacao = () => {
    setPollingStep(0);
    setIsCheckoutLoading(false);
    const payload = `00020126580014BR.GOV.BCB.PIX0136sandbox-cancao-profana-teste-5204000053039865802BR5909PROFANA6009SAO PAULO62070503***6304${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
    applyPixData({ paymentId: 'sandbox-' + Date.now(), qr: payload, qrBase64: null });
  };
  const simularPagamento = () => {
    webhookDoneRef.current = true;
    handleSimulateWebhook(true);
  };

  const pixActive = origem === 'v2' ? (pixGatewayOn && sandboxPix) : pixGatewayOn;
  // Na /v2 com sandbox ativo e Pix real desligado: checkout de SIMULACAO com layout real
  const sandboxSimulacao = origem === 'v2' && sandboxV2.ativo && !pixActive;

  // Confirmacao de pagamento: Pix real (gateway) ou simulacao local (fallback pre-chaves)
  useEffect(() => {
    if (!isCheckoutOpen || checkoutExpired) return;
    if (!pixActive) {
      let t1: ReturnType<typeof setTimeout>, t2: ReturnType<typeof setTimeout>, t3: ReturnType<typeof setTimeout>, tManual: ReturnType<typeof setTimeout>;
      setShowManualConfirm(false);
      t1 = setTimeout(() => setPollingStep(1), 1800);
      t2 = setTimeout(() => setPollingStep(2), 3600);
      t3 = setTimeout(() => { handleSimulateWebhook(); }, 5100);
      // Manual fallback only if something failed after 15s
      tManual = setTimeout(() => {
        if (!webhookDoneRef.current) setShowManualConfirm(true);
      }, 15000);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(tManual); };
    }
    // Sandbox simulacao: QR fake + botao de confirmacao manual (sem gateway)
    if (sandboxSimulacao) {
      (async () => {
        const id = savePromiseRef.current ? await savePromiseRef.current : saveIdRef.current;
        const codeNow = inviteCodeRef.current;
        if (!id || !codeNow) { setShowManualConfirm(true); return; }
        gerarSimulacao();
      })();
      return;
    }
    // Pix real: gera a cobranca no gateway e consulta o status a cada 5s
    let cancelled = false;
    const run = async () => {
      try {
        const id = savePromiseRef.current ? await savePromiseRef.current : saveIdRef.current;
        const codeNow = inviteCodeRef.current;
        if (cancelled) return;
        if (!id || !codeNow) { setShowManualConfirm(true); return; }
        const res = await fetch('/api/pix/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: codeNow, email: respEmail, name: respName })
        });
        const data = await res.json().catch(() => null);
        if (cancelled) return;
        // Ja pagou antes (reabriu o checkout): confirma direto, sem nova cobranca
        if (data?.ok && data?.alreadyPaid) {
          webhookDoneRef.current = true;
          handleSimulateWebhook(true);
          return;
        }
        if (!res.ok || !data?.ok || !data?.paymentId) {
          setCheckoutError('Não foi possível gerar o Pix agora. Toque em "Verificar novamente".');
          setShowManualConfirm(true);
          return;
        }
        applyPixData({ paymentId: String(data.paymentId), qr: data.qr ? String(data.qr) : null, qrBase64: data.qrBase64 ? String(data.qrBase64) : null, amount: typeof data.amount === 'number' ? data.amount : undefined, expiresAt: data.expiresAt ? String(data.expiresAt) : null });
        setIsCheckoutLoading(false);
      } catch {
        if (!cancelled) {
          setCheckoutError('Falha de conexão com o gateway. Toque em "Verificar novamente".');
          setShowManualConfirm(true);
        }
      }
    };
    run();
    const poll = setInterval(async () => {
      if (webhookDoneRef.current || !pixDataRef.current?.paymentId) return;
      try {
        const sres = await fetch(`/api/pix/status?id=${pixDataRef.current.paymentId}`);
        const sdata = await sres.json().catch(() => null);
        if (sdata?.paid && !webhookDoneRef.current) {
          webhookDoneRef.current = true;
          clearInterval(poll);
          handleSimulateWebhook(true);
        }
      } catch { /* tenta no proximo tick */ }
    }, 5000);
    pollRef.current = poll;
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCheckoutOpen, checkoutExpired, pixActive, sandboxSimulacao]);

  const handleSimulateWebhook = async (force = false) => {
    // Guard against double execution (auto polling + manual click)
    if (webhookDoneRef.current && !force) return;
    webhookDoneRef.current = true;
    setCheckoutError(null);
    setIsCheckoutLoading(true);

    try {
      // Espera o registro da banda terminar (o polling já só dispara após o save)
      const id = savePromiseRef.current ? await savePromiseRef.current : saveIdRef.current;

      if (!id) {
        webhookDoneRef.current = false;
        setIsCheckoutLoading(false);
        setShowManualConfirm(true);
        setCheckoutError('Não foi possível validar o cadastro. Verifique sua conexão e tente novamente.');
        return;
      }

      const codeNow = inviteCodeRef.current;
      if (!codeNow) {
        webhookDoneRef.current = false;
        setIsCheckoutLoading(false);
        setShowManualConfirm(true);
        setCheckoutError('Registro não localizado. Tente novamente.');
        return;
      }

      const { data: payRes, error: payErr } = await supabase.rpc('confirm_leader_payment', { p_code: codeNow });
      if (payErr || !payRes) {
        webhookDoneRef.current = false;
        setIsCheckoutLoading(false);
        setShowManualConfirm(true);
        setCheckoutError('Não foi possível confirmar agora. Use "Verificar novamente" em instantes.');
        return;
      }
      setBandResult({ pago: Number(payRes.pago), minimo: Number(payRes.minimo), total: Number(payRes.total), ativa: Boolean(payRes.banda_ativa) });

      setTicketCode(deriveTicketCode(id));
      onPaymentSuccess();

      setTimeout(() => {
        closeCheckout();
        setIsSuccessOpen(true);
        setSuccessVisible(true);
      }, 1200);
    } catch (err) {
      console.error(err);
      webhookDoneRef.current = false;
      setIsCheckoutLoading(false);
      setShowManualConfirm(true);
      setCheckoutError('Erro ao confirmar o pagamento. Tente novamente.');
    }
  };

  // Verificacao manual no modo Pix real: consulta o gateway agora
  const handleManualPixCheck = async () => {
    const pid = pixDataRef.current?.paymentId;
    if (!pid) { handleSimulateWebhook(); return; }
    setCheckoutError(null);
    setIsCheckoutLoading(true);
    try {
      const sres = await fetch(`/api/pix/status?id=${pid}`);
      const sdata = await sres.json().catch(() => null);
      setIsCheckoutLoading(false);
      if (sdata?.paid) {
        webhookDoneRef.current = true;
        handleSimulateWebhook(true);
      } else {
        setCheckoutError('Pagamento ainda não identificado no banco. Aguarde alguns segundos e verifique de novo.');
      }
    } catch {
      setIsCheckoutLoading(false);
      setCheckoutError('Falha ao consultar o gateway. Tente novamente.');
    }
  };

  const deriveTicketCode = (id: string): string => {
    if (!id) return 'CP-2026-0000';
    const clean = id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return 'CP-2026-' + clean.substring(0, 8);
  };

  const renewReservation = () => {
    setCheckoutTimeLeft(600);
    setCheckoutExpired(false);
    setPollingStep(0);
  };

  const fmtValidade = (iso: string) => {
    try {
      return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }).format(new Date(iso));
    } catch { return ''; }
  };
  const formatCheckoutTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // ---------- Share / copy tools (no native alerts) ----------
  const handleViralShare = async () => {
    const text = `Matrícula confirmada para a nossa banda "${projectName || 'Canção Profana'}" no Concurso Musical Canção Profana 2026! Nos vemos nos palcos da Pedra Profana! 🎸🔥`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'Canção Profana 2026', text });
        return;
      } catch { /* user cancelled or unsupported - fall back to clipboard */ }
    }
    try {
      await navigator.clipboard.writeText(text);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    } catch { /* clipboard blocked */ }
  };

  const copyPixCode = async () => {
    try {
      await navigator.clipboard.writeText(pixData?.qr || `PIX CANCAO PROFANA | ${activeLoteName} | R$ ${displayTotal},00 | Estudio Pedra Profana`);
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 2500);
    } catch { /* clipboard blocked */ }
  };

  // ---------- Demo filler (production-safe: fills valid data, validations stay on) ----------
  const fillDemoData = () => {
    demoRef.current = true;
    setRespPhone('(21) 99999-0000');
    setProjectName('Banda Demo');
    setProjectInstagram('bandademo');
    setProjectStyle('Rock');
    setRespName('Líder Demo');
    setRespEmail('demo@teste.com');
    setRespCpf('529.982.247-28');
    setSelectedMembers(3);
    setMembersList([
      { name: 'Integrante Dois', cpf: '', birth: '', role: 'Guitarrista', phone: '', email: '' },
      { name: 'Integrante Três', cpf: '', birth: '', role: 'Baterista', phone: '', email: '' },
    ]);
    setAcceptRules(true);
    setErrors({});
    setQuizStep(10);
  };

  const leaderRoleEffective = respRole === 'Outro' ? respRoleOther.trim() : respRole;

  const fieldError = (key: string) => errors[key] ? (
    <p className="text-[11px] text-red-400 font-mono mt-1 flex items-start gap-1"><span>⚠</span><span>{errors[key]}</span></p>
  ) : null;

  const inputClass = (key: string, base: string) => errors[key] ? base.replace('border-white/[0.14]', 'border-red-500/60') : base;

  return (
    <>
      {isOpen && suporteWa && (
        <a
          href={suporteWa}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed left-3 bottom-3 z-40 flex items-center gap-1.5 bg-[#0B0F19]/90 backdrop-blur-sm border border-[#F0C265]/30 text-[#F0C265] font-mono text-[11px] font-bold uppercase tracking-wider px-3.5 py-2.5 rounded-full shadow-lg hover:border-[#F0C265]/70 transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5" /> Tenho dúvidas <span className="text-gray-400">›</span>
        </a>
      )}
      {isOpen && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="afterInteractive"
          onLoad={tryRenderTurnstile}
        />
      )}

      {/* QUIZ INTERACTIVE POPUP MODAL - external page scroll, no internal modal scroll */}
      {quizVisible && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 backdrop-blur-sm px-4 py-8 sm:p-6 flex justify-center items-start">

          <div className="absolute inset-0 cursor-pointer" onClick={requestCloseQuiz}></div>

          <div
            ref={quizCardRef}
            className="bg-[#161B26] border-2 border-[#E3B552] w-full max-w-xl rounded-[32px] p-6 md:p-8 my-auto relative space-y-6 shadow-[0_10px_50px_rgba(0,0,0,0.8)] flex flex-col justify-between z-10"
          >
            <button type="button" onClick={requestCloseQuiz} className="absolute right-5 top-5 text-[#B3B3B3] hover:text-white font-mono text-2xl font-bold">&times;</button>

              {/* DRAFT RECOVERY */}
              {draftToRestore ? (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-6">
                  <div className="w-12 h-12 rounded-full bg-[#F0C265]/10 text-[#F0C265] border border-[#F0C265]/20 flex items-center justify-center text-xl shadow">⚡</div>
                  <div className="space-y-2">
                    <h3 className="font-display font-black text-xl text-white uppercase tracking-tight">Rascunho de Inscrição Ativo</h3>
                    <p className="text-xs text-gray-300 max-w-sm mx-auto leading-relaxed">
                      Encontramos um progresso de matrícula salvo localmente para a banda/dupla <strong className="text-[#F0C265]">&quot;{draftToRestore.projectName}&quot;</strong>. Deseja retomar de onde parou?
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs pt-2">
                    <button type="button" onClick={handleDiscardDraft} className="w-full sm:w-1/2 font-mono text-xs font-bold text-gray-300 px-4 py-3 border border-white/[0.14] rounded-full hover:bg-white/[0.08] transition-colors uppercase">Descartar</button>
                    <button type="button" onClick={handleRestoreDraft} className="w-full sm:w-1/2 btn-gold-shimmer px-4 py-3 rounded-full text-xs uppercase tracking-widest font-black text-black">Continuar</button>
                  </div>
                </div>
              ) : (
                <>
                  {/* PROGRESSO */}
                  <div className="space-y-2 shrink-0">
                    <div className="flex justify-end items-baseline">
                      <span className="font-mono text-sm md:text-base text-[#F0C265] font-black">{pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#FFF2D4] via-[#F0C265] to-[#B88A28] transition-all duration-300" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>

                  {/* STEP CONTENTS */}
                  <form onSubmit={(e) => e.preventDefault()} className="grow flex flex-col justify-between gap-6">

                    <div ref={stepRef} className="space-y-6">
                        {quizStep === 1 && (
                          <div className="space-y-4">
                            <h3 className="font-display font-black text-2xl text-white uppercase tracking-tight">Seu WhatsApp</h3>
                            <p className="text-sm text-gray-300 leading-relaxed">Antes de tudo: um contato direto seu para garantir e recuperar sua vaga quando precisar.</p>
                            <div className="space-y-1 pt-1">
                              <label className="block font-mono text-sm text-[#F0C265] font-bold uppercase">WhatsApp <span className="text-red-400">*</span></label>
                              <input type="tel" inputMode="numeric" value={respPhone} onChange={(e) => { setRespPhone(applyPhoneMask(e.target.value)); clearError('respPhone'); }} placeholder="(21) 99999-9999" autoComplete="tel" className={`w-full bg-[#1E2434] border rounded-xl px-4 py-3.5 text-white text-base outline-none placeholder-gray-500 transition-colors ${errors.respPhone ? 'border-red-500/60' : 'border-white/[0.14] focus:border-[#E3B552]'}`} />
                              {fieldError('respPhone')}
                            </div>
                          </div>
                        )}

                        {quizStep === 2 && (
                          <div className="space-y-4">
                            <h3 className="font-display font-black text-2xl text-white uppercase tracking-tight">Qual o nome da banda?</h3>
                            <div className="space-y-1">
                              <label className="block font-mono text-sm text-[#F0C265] font-bold uppercase">Nome da Banda / Dupla de Rap <span className="text-red-400">*</span></label>
                              <input type="text" value={projectName} onChange={(e) => { setProjectName(e.target.value.slice(0, 60)); clearError('projectName'); }} placeholder="Ex: Tempestade de Aço" autoComplete="organization" className={`w-full bg-[#1E2434] border rounded-xl px-4 py-3.5 text-white text-base outline-none placeholder-gray-500 transition-colors ${errors.projectName ? 'border-red-500/60' : 'border-white/[0.14] focus:border-[#E3B552]'}`} />
                              {fieldError('projectName')}
                            </div>
                            <div className="space-y-1 pt-2">
                              <label className="block font-mono text-sm text-[#F0C265] font-bold uppercase">Instagram <span className="text-red-400">*</span></label>
                              <div className={`flex items-stretch bg-[#1E2434] border rounded-xl overflow-hidden transition-colors ${errors.projectInstagram ? 'border-red-500/60' : 'border-white/[0.14] focus-within:border-[#E3B552]'}`}>
                                <span className="flex items-center pl-3.5 pr-0.5 font-mono text-sm text-gray-300 select-none pointer-events-none">@</span>
                                <input
                                  type="text"
                                  value={projectInstagram}
                                  onChange={(e) => { setProjectInstagram(e.target.value.replace(/[^a-zA-Z0-9._]/g, '').slice(0, 30)); clearError('projectInstagram'); }}
                                  placeholder="suabanda"
                                  autoComplete="off"
                                  className="flex-1 min-w-0 bg-transparent px-1 py-3.5 text-white text-base outline-none placeholder-gray-500"
                                />
                              </div>
                              {fieldError('projectInstagram')}
                            </div>
                          </div>
                        )}

                        {quizStep === 3 && (
                          <div className="space-y-4">
                            <h3 className="font-display font-black text-2xl text-white uppercase tracking-tight">Qual é o estilo?</h3>
                            <p className="text-sm text-gray-300">Escolha o que mais representa o som de vocês.</p>
                            <div className="flex flex-wrap gap-2 pt-1">
                              {ESTILOS.map(es => (
                                <button key={es} type="button" onClick={() => { setProjectStyle(projectStyle === es ? '' : es); clearError('projectStyle'); }} className={`font-mono text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-full border transition-colors ${projectStyle === es ? 'bg-[#F0C265] text-black border-black' : 'text-gray-300 border-white/[0.22] bg-white/[0.08] hover:border-[#F0C265]/50 hover:text-white'}`}>
                                  {es}
                                </button>
                              ))}
                            </div>
                            {projectStyle !== '' && !ESTILOS.includes(projectStyle) && (
                              <input type="text" value={projectStyle} onChange={(e) => setProjectStyle(e.target.value)} placeholder="Descreva o estilo" className="w-full bg-[#1E2434] border border-white/[0.14] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#E3B552] placeholder-gray-500" />
                            )}
                            {fieldError('projectStyle')}
                          </div>
                        )}

                        {quizStep === 4 && (
                          <div className="space-y-4">
                            <h3 className="font-display font-black text-2xl text-white uppercase tracking-tight">Como você se chama?</h3>
                            <p className="text-sm text-gray-300">Você será o líder responsável pela inscrição.</p>
                            <div className="space-y-1 pt-1">
                              <label className="block font-mono text-sm text-[#F0C265] font-bold uppercase">Nome completo <span className="text-red-400">*</span></label>
                              <input type="text" value={respName} onChange={(e) => { setRespName(e.target.value); clearError('respName'); }} placeholder="Nome completo" autoComplete="name" className={`w-full bg-[#1E2434] border rounded-xl px-4 py-3.5 text-white text-base outline-none placeholder-gray-500 transition-colors ${errors.respName ? 'border-red-500/60' : 'border-white/[0.14] focus:border-[#E3B552]'}`} />
                              {fieldError('respName')}
                            </div>
                          </div>
                        )}

                        {quizStep === 5 && (
                          <div className="space-y-4">
                            <h3 className="font-display font-black text-2xl text-white uppercase tracking-tight">Seu melhor e-mail</h3>
                            <p className="text-sm text-gray-300">Usado para confirmar a matrícula e comunicados oficiais do concurso.</p>
                            <div className="space-y-1 pt-1">
                              <label className="block font-mono text-sm text-[#F0C265] font-bold uppercase">E-mail <span className="text-red-400">*</span></label>
                              <input type="email" inputMode="email" value={respEmail} onChange={(e) => { setRespEmail(e.target.value); clearError('respEmail'); }} placeholder="voce@email.com" autoComplete="email" className={`w-full bg-[#1E2434] border rounded-xl px-4 py-3.5 text-white text-base outline-none placeholder-gray-500 transition-colors ${errors.respEmail ? 'border-red-500/60' : 'border-white/[0.14] focus:border-[#E3B552]'}`} />
                              {fieldError('respEmail')}
                            </div>
                          </div>
                        )}

                        {quizStep === 6 && (
                          <div className="space-y-4">
                            <h3 className="font-display font-black text-2xl text-white uppercase tracking-tight">Seu CPF</h3>
                            <p className="text-sm text-gray-300">Serve para recuperar seu acesso à inscrição a qualquer momento.</p>
                            <div className="space-y-1 pt-1">
                              <label className="block font-mono text-sm text-[#F0C265] font-bold uppercase">CPF <span className="text-red-400">*</span></label>
                              <input type="text" inputMode="numeric" value={respCpf} onChange={(e) => { setRespCpf(applyCpfMask(e.target.value)); clearError('respCpf'); }} placeholder="000.000.000-00" autoComplete="off" className={`w-full bg-[#1E2434] border rounded-xl px-4 py-3.5 text-white text-base outline-none placeholder-gray-500 transition-colors ${errors.respCpf ? 'border-red-500/60' : 'border-white/[0.14] focus:border-[#E3B552]'}`} />
                              {fieldError('respCpf')}
                            </div>
                          </div>
                        )}

                        {quizStep === 7 && (
                          <div className="space-y-4">
                            <h3 className="font-display font-black text-2xl text-white uppercase tracking-tight">Quantas pessoas na banda?</h3>
                            <p className="text-sm text-gray-300">Contando com você. Mínimo 2, máximo 7 (regulamento).</p>
                            <div className="flex flex-wrap gap-2 pt-1">
                              {[2, 3, 4, 5, 6, 7].map(n => (
                                <button key={n} type="button" onClick={() => setTamanhoBanda(n)} className={`w-12 h-12 rounded-full font-display font-black text-lg transition-colors ${selectedMembers === n ? 'bg-[#F0C265] text-black border border-black' : 'text-gray-300 border border-white/[0.22] bg-white/[0.08] hover:border-[#F0C265]/50 hover:text-white'}`}>
                                  {n}
                                </button>
                              ))}
                            </div>
                            {fieldError('tamanho')}
                            <p className="text-[11px] text-gray-400 font-mono">A seguir, só o nome de cada integrante — cada um confirma os próprios dados depois pelo link do convite.</p>
                          </div>
                        )}

                        {quizStep > 7 && quizStep < selectedMembers + 7 && (() => {
                          const mi = quizStep - 8;
                          const m = membersList[mi];
                          if (!m) return null;
                          const mKey = 'memb' + mi;
                          const roleEhOutro = !!m.role && !FUNCOES.includes(m.role);
                          return (
                            <div className="space-y-4">
                              <h3 className="font-display font-black text-2xl text-white uppercase tracking-tight">Integrante {mi + 2} de {selectedMembers}</h3>
                              <p className="text-sm text-gray-300">Só o nome por enquanto — cada integrante confirma os próprios dados pelo link do convite.</p>
                              <div className="space-y-1 pt-1">
                                <label className="block font-mono text-sm text-[#F0C265] font-bold uppercase">Nome <span className="text-red-400">*</span></label>
                                <input type="text" value={m.name} onChange={(e) => { const v = e.target.value; setMembersList(l => l.map((x, i2) => i2 === mi ? { ...x, name: v } : x)); if (errors[mKey]) clearError(mKey); }} placeholder="Nome completo" autoComplete="off" className={`w-full bg-[#1E2434] border rounded-xl px-4 py-3.5 text-white text-base outline-none placeholder-gray-500 transition-colors ${errors[mKey] ? 'border-red-500/60' : 'border-white/[0.14] focus:border-[#E3B552]'}`} />
                                {errors[mKey] && <p className="text-xs text-red-400 font-mono">{errors[mKey]}</p>}
                              </div>
                              <div className="space-y-2 pt-2">
                                <label className="block font-mono text-sm text-[#F0C265] font-bold uppercase">Função <span className="text-[10px] text-gray-400 font-normal normal-case tracking-normal">(opcional)</span></label>
                                <div className="flex flex-wrap gap-2">
                                  {FUNCOES.map(f => (
                                    <button key={f} type="button" onClick={() => setMembersList(l => l.map((x, i2) => i2 === mi ? { ...x, role: x.role === f ? '' : f } : x))} className={`font-mono text-[11px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-full border transition-colors ${m.role === f ? 'bg-[#F0C265] text-black border-black' : 'text-gray-300 border-white/[0.22] bg-white/[0.08] hover:border-[#F0C265]/50 hover:text-white'}`}>
                                      {f}
                                    </button>
                                  ))}
                                  <button type="button" onClick={() => setMembersList(l => l.map((x, i2) => i2 === mi ? { ...x, role: roleEhOutro ? '' : 'Outro' } : x))} className={`font-mono text-[11px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-full border transition-colors ${roleEhOutro ? 'bg-[#F0C265] text-black border-black' : 'text-gray-300 border-white/[0.22] bg-white/[0.08] hover:border-[#F0C265]/50 hover:text-white'}`}>
                                    Outro
                                  </button>
                                </div>
                                {roleEhOutro && (
                                  <input type="text" value={m.role === 'Outro' ? '' : m.role} onChange={(e) => setMembersList(l => l.map((x, i2) => i2 === mi ? { ...x, role: e.target.value } : x))} placeholder="Descreva a função (ex: Percussionista)" className="w-full bg-[#1E2434] border border-white/[0.14] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#E3B552] placeholder-gray-500" />
                                )}
                              </div>
                            </div>
                          );
                        })()}

                        {quizStep === selectedMembers + 7 && (
                          <div className="space-y-4">
                            <h3 className="font-display font-black text-2xl text-white uppercase tracking-tight">Revise e gere o Pix</h3>
                            <p className="text-sm text-gray-300">Confirme os dados consolidados do sinal.</p>

                            <div className="bg-[#1B2130] p-4 md:p-6 rounded-2xl border border-white/10 space-y-4 md:space-y-5 text-sm font-mono">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                                <div>
                                  <span className="text-gray-300 block text-[13px] font-bold uppercase">PROJETO BANDA:</span>
                                  <span className="font-bold text-white text-base block mt-1">{projectName || '-'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-300 block text-[13px] font-bold uppercase">RESPONSÁVEL LÍDER:</span>
                                  <span className="font-bold text-white text-base block mt-1">{respName || '-'}{(respRole === 'Outro' ? respRoleOther : respRole) ? ` • ${(respRole === 'Outro' ? respRoleOther : respRole)}` : ''}</span>
                                </div>
                                <div>
                                  <span className="text-gray-300 block text-[13px] font-bold uppercase">LOTE VIGENTE:</span>
                                  <span className="font-bold text-[#F0C265] text-base block mt-1 uppercase">{activeLoteName} (R$ {activePrice} / integrante)</span>
                                </div>
                                <div>
                                  <span className="text-gray-300 block text-[13px] font-bold uppercase">INTEGRANTES CONECTADOS:</span>
                                  <span className="font-bold text-white text-base block mt-1">{selectedMembers}</span>
                                </div>
                              </div>

                              <div className="border-t border-white/10 pt-4 space-y-4">
                                <div>
                                  <span className="font-mono text-sm text-[#F0C265] font-bold block mb-2.5">RETORNO GARANTIDO INCLUÍDO:</span>
                                  <div className="grid grid-cols-1 gap-2.5">
                                    {[
                                      { t: 'Apresentação ao vivo no Estúdio Pedra Profana', v: 'R$ 1.500' },
                                      { t: 'Gravação profissional da live', v: 'Incluída' },
                                    ].map(b => (
                                      <div key={b.t} className="bg-[#1B2130] border border-white/10 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2">
                                        <span className="text-xs text-gray-200 leading-snug">{b.t}</span>
                                        <span className="text-right shrink-0">
                                          <span className="block text-[11px] text-gray-400 line-through leading-none">{b.v}</span>
                                          <span className="block text-[11px] text-[#10B981] font-black uppercase leading-tight">Grátis</span>
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="bg-[#F0C265]/10 border border-[#F0C265]/30 rounded-2xl p-4 text-center">
                                  <span className="font-mono text-[13px] text-gray-200 uppercase tracking-widest font-bold block">{paymentMode === 'lider' ? 'Pagamento único do líder' : 'Sua parte agora (líder)'}</span>
                                  {cupomDescUn > 0 && (
                                    <span className="font-mono text-xs text-gray-400 line-through block mt-0.5">R$ {(paymentMode === 'lider' ? selectedMembers * activePrice : activePrice).toFixed(0)},00</span>
                                  )}
                                  <span className="font-display font-black text-4xl text-[#F0C265] block leading-tight mt-0.5">R$ {(paymentMode === 'lider' ? selectedMembers * unitFinal : unitFinal).toFixed(0)},00</span>
                                  {cupomDescUn > 0 && cupomValidado && (
                                    <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold text-[#F0C265] bg-[#F0C265]/10 border border-[#F0C265]/30 px-2.5 py-1 rounded-full mt-1.5">Cupom {cupom} · -R$ {cupomDescUn.toFixed(0)},00 por integrante</span>
                                  )}
                                  {cupom && cupomInfo && cupomInfo.valido === false && (
                                    <span className="block font-mono text-[10px] text-gray-400 uppercase tracking-wider mt-1.5">Cupom {cupom} não está ativo · valor normal do lote aplicado</span>
                                  )}
                                  <span className="text-sm text-gray-300 block mt-1.5 leading-relaxed">
                                    {paymentMode === 'lider'
                                      ? <>Um único Pix cobre todos os {selectedMembers} integrantes.<br /></>
                                      : <>Cada integrante paga a própria parte pelo link exclusivo.<br /></>
                                    }
                                    Total da banda: <strong className="text-white">R$ {(selectedMembers * unitFinal).toFixed(0)},00</strong> + {selectedMembers}kg de alimento
                                  </span>
                                </div>
                              </div>
                            </div>

                            {similarBands.length > 0 && similarChoice === 'other' && (
                              <p className="text-[11px] text-amber-300/80 font-mono">Ok, registraremos como uma banda diferente. Nomes parecidos ficam sinalizados para a organização.</p>
                            )}

                            <div className="p-1">
                              {/* anti-bot: campo isca invisível para humanos */}
                              <input
                                type="text"
                                name="website"
                                value={honey}
                                onChange={(e) => setHoney(e.target.value)}
                                tabIndex={-1}
                                autoComplete="off"
                                aria-hidden="true"
                                className="absolute opacity-0 h-0 w-0 pointer-events-none"
                              />
                              <label className="flex items-start gap-3 cursor-pointer">
                                <input type="checkbox" checked={acceptRules} onChange={(e) => { setAcceptRules(e.target.checked); clearError('acceptRules'); }} className="mt-1 w-4 h-4 text-[#F0C265] bg-black border-white/25 rounded focus:ring-[#F0C265]" />
                                <span className="text-xs text-gray-300 leading-relaxed font-normal">
                                  <span className="text-red-400">*</span> Declaramos ciência das regras do concurso e autorizamos a captação de áudio e vídeo da apresentação, concordando com as etapas.
                                </span>
                              </label>
                              {fieldError('acceptRules')}
                              {similarBands.length > 0 && (similarChoice === 'none' || (similarChoice === 'mine' && (!mineResult || !mineResult.ok))) && (
                                <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl px-4 py-3 space-y-2.5">
                                  <span className="text-xs text-amber-300 font-bold uppercase tracking-wide block">Nome parecido pendente: {similarBands.join(', ')}</span>
                                  {similarChoice !== 'mine' ? (
                                    <div className="flex flex-col sm:flex-row gap-2">
                                      <button type="button" onClick={() => { setSimilarChoice('mine'); }} className="font-mono text-[11px] font-black text-black bg-gradient-to-b from-[#10B981] to-[#059669] px-3 py-2.5 rounded-xl uppercase flex-1">É minha banda (verificar CPF)</button>
                                      <button type="button" onClick={() => setSimilarChoice('other')} className="font-mono text-[11px] font-black text-white bg-gradient-to-b from-red-500 to-red-700 px-3 py-2.5 rounded-xl uppercase flex-1">É outra banda</button>
                                    </div>
                                  ) : (
                                    <div className="space-y-2.5">
                                      <label className="block font-mono text-[11px] text-gray-300 font-bold uppercase tracking-wider">Seu CPF para localizar sua vaga</label>
                                      <input
                                        inputMode="numeric"
                                        value={mineCpf}
                                        onChange={(e) => { setMineCpf(e.target.value.replace(/\D/g, '').slice(0, 11)); setMineResult(null); }}
                                        placeholder="000.000.000-00"
                                        className="w-full bg-black/45 border border-white/[0.22] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#10B981] placeholder-gray-500"
                                      />
                                      {mineResult && (
                                        <div className={`rounded-xl px-4 py-3 text-xs leading-snug ${mineResult.ok ? 'bg-[#10B981]/10 border border-[#10B981]/40 text-[#10B981]' : 'bg-red-500/10 border border-red-500/40 text-red-200'}`}>
                                          {mineResult.ok ? '✓ ' : '⚠ '}{mineResult.msg}
                                        </div>
                                      )}
                                      <div className="grid grid-cols-2 gap-2.5">
                                        <button type="button" onClick={handleMineCheck} disabled={mineChecking || mineCpf.length !== 11} className="font-mono text-sm font-black text-black bg-gradient-to-b from-[#10B981] to-[#059669] px-3 py-3 rounded-xl uppercase tracking-wider disabled:opacity-50 active:scale-[0.98] transition-transform">
                                          {mineChecking ? 'Verificando...' : 'Localizar'}
                                        </button>
                                        <button type="button" onClick={() => { setSimilarChoice('none'); setMineCpf(''); setMineResult(null); }} className="font-mono text-sm font-bold text-gray-300 border border-white/[0.14] px-3 py-3 rounded-xl uppercase hover:text-white transition-colors">Voltar</button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                    </div>

                    {/* verificação anti-robô - somente na primeira etapa */}
                    {quizStep === 1 && (
                      <div className="flex justify-center pt-1 shrink-0">
                        <div id="cf-ts" />
                      </div>
                    )}

                    {/* CONTROLS */}
                    <div className="border-t border-white/15 pt-4 space-y-3 shrink-0">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#F0EAE0] font-bold font-mono">{quizStep}/{selectedMembers + 7}</span>
                        {origem === 'v2' && (
                          <button type="button" onClick={fillDemoData} className="font-mono text-[11px] font-bold text-[#F0C265] bg-[#F0C265]/10 border border-[#F0C265]/20 px-3 py-1.5 rounded-lg uppercase hover:bg-[#F0C265] hover:text-black transition-colors">🧪 Testar Demo</button>
                        )}
                      </div>

                      <div className="flex gap-2.5">
                        {quizStep > 1 && (
                          <button type="button" onClick={handleQuizPrev} className="font-mono text-xs font-bold text-white border border-white/[0.14] bg-white/[0.08] px-5 py-3 rounded-xl uppercase flex-1 sm:flex-none">Voltar</button>
                        )}
                        {quizStep < selectedMembers + 7 ? (
                          <button type="button" onClick={handleQuizNext} className="btn-gold-shimmer px-7 py-3 rounded uppercase border-none text-black flex-1 sm:flex-none">Continuar</button>
                        ) : (
                          <button type="button" onClick={handleLaunchCheckout} className="font-mono text-xs font-bold text-black bg-lime px-7 py-3 rounded-xl uppercase border-none flex-1 sm:flex-none">
                            Gerar Pix
                          </button>
                        )}
                      </div>
                    </div>

                  </form>
                </>
              )}
          </div>
        </div>
      )}

      {/* CHECKOUT POPUP MODAL - external page scroll */}
      {checkoutVisible && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 backdrop-blur-sm px-4 py-8 sm:p-6 flex justify-center items-start">

            <div className="absolute inset-0 cursor-pointer" onClick={requestCloseCheckout}></div>

            <div
              ref={checkoutCardRef}
              className="bg-[#161B26] border-2 border-[#E3B552] max-w-sm w-full p-6 rounded-[32px] relative space-y-6 shadow-2xl z-10 my-auto"
            >
              <button onClick={requestCloseCheckout} className="absolute right-4 top-4 text-gray-300 hover:text-white font-mono text-xl">&times;</button>

              <div className="text-center space-y-2 pt-1">
                <span className="font-mono text-[11px] text-lime font-bold bg-lime/10 border border-lime/20 px-3 py-1 rounded-full w-max mx-auto block uppercase">● {pixActive ? 'Pagamento seguro via Mercado Pago' : (sandboxSimulacao ? 'Ambiente de teste (sandbox)' : 'Servidor autenticado')}</span>
                <h3 className="font-display font-bold text-xl text-white uppercase tracking-tight">PIX DE INSCRIÇÃO</h3>
                <p className="text-[11px] text-gray-300 leading-snug max-w-[260px] mx-auto">Escaneie o QR no app do banco ou use o Pix Copia e Cola. A confirmação é automática.</p>
              </div>

              {/* RESUMO DO PEDIDO */}
              <div className="bg-white/[0.07] border border-white/[0.14] rounded-2xl px-4 py-3 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-300 font-mono uppercase tracking-wider">Inscrição · {activeLoteName}</span>
                  <span className="text-white font-bold font-mono">{projectName || 'Banda'}</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-white/10 pt-1.5">
                  <span className="text-gray-300 font-mono uppercase tracking-wider">{selectedMembers} integrante{selectedMembers > 1 ? 's' : ''} · R$ {Number.isInteger(unitFinal) ? unitFinal : unitFinal.toFixed(2).replace('.', ',')},00 cada</span>
                  <span className="text-gray-300 font-mono">{selectedMembers}kg alimento</span>
                </div>
                {cupomDiscount > 0 && (
                  <div className="flex justify-between items-center border-t border-[#F0C265]/20 pt-1.5">
                    <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider font-bold text-[#F0C265]">
                      <Ticket className="w-3.5 h-3.5 shrink-0" />Cupom {cupom}
                    </span>
                    <span className="font-mono text-xs font-bold text-[#F0C265]">-R$ {Number.isInteger(cupomDiscount) ? cupomDiscount : cupomDiscount.toFixed(2).replace('.', ',')},00</span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t border-white/10 pt-2">
                  <span className="font-mono text-[11px] text-gray-300 uppercase tracking-widest font-bold">{paymentMode === 'lider' ? 'Total único (líder)' : 'Sua parte'}</span>
                  <span className="font-display font-black text-xl text-[#F0C265]">
                    {cupomDiscount > 0 && (
                      <span className="font-mono text-xs text-gray-400 line-through mr-1.5 font-bold">R$ {Number.isInteger(displayTotal + cupomDiscount) ? displayTotal + cupomDiscount : (displayTotal + cupomDiscount).toFixed(2).replace('.', ',')},00</span>
                    )}
                    R$ {Number.isInteger(displayTotal) ? displayTotal : displayTotal.toFixed(2).replace('.', ',')},00
                  </span>
                </div>
              </div>

              <div className="bg-[#10141D] p-4 rounded-xl flex flex-col items-center space-y-4 border border-white/10">
                <div className="w-48 h-48 bg-white p-3 rounded-xl flex items-center justify-center relative shadow-lg">
                  {pixData?.qrBase64 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`data:image/png;base64,${pixData.qrBase64}`} alt="QR Code Pix" className="w-full h-full object-contain rounded-lg" />
                  ) : (
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
                  )}
                  {isCheckoutLoading && (
                    <div className="absolute inset-0 bg-[#1E2434]/95 flex flex-col items-center justify-center text-center p-3 rounded-xl">
                      <span className="w-8 h-8 rounded-full border-2 border-[#F0C265] border-t-transparent animate-spin mb-3"></span>
                      <div className="space-y-1 mt-2 text-center relative z-20">
                        <span className="font-mono text-xs text-[#F0C265] uppercase tracking-widest font-bold block animate-pulse">
                          {pollingStep < 3 ? "Confirmando sua vaga..." : "Confirmando sua vaga..."}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-center space-y-3 w-full">
                  <div>
                    {paymentMode === 'lider' ? (
                      <span className="font-mono text-[10px] text-gray-400 block uppercase font-bold">PAGAMENTO ÚNICO DO LÍDER · cobre os {selectedMembers} integrantes</span>
                    ) : (
                      <span className="font-mono text-[10px] text-gray-400 block uppercase font-bold">SUA PARTE (LÍDER)</span>
                    )}
                    {pixData?.expiresAt && !checkoutExpired && (
                      <span className="font-mono text-[10px] text-gray-300 block uppercase mt-1">QR Code válido até {fmtValidade(pixData.expiresAt)} (BRT)</span>
                    )}
                  </div>

                  {/* Live polling status line (feedback while QR is on screen) */}
                  {!checkoutExpired && !isCheckoutLoading && (
                    <span className="font-mono text-[10px] text-gray-300 block animate-pulse uppercase tracking-widest">
                      {pollingStep === 0 && "● Aguardando pagamento Pix..."}
                      {pollingStep === 1 && "● Consultando compensação..."}
                      {pollingStep === 2 && "● Identificando Pix bancário..."}
                    </span>
                  )}

                  {/* 10m guarantee countdown positioned below the green total */}
                  {!checkoutExpired ? (
                    <div className={`flex items-center justify-center gap-2 font-mono font-black bg-[#8B1E1E]/30 border-2 py-2 px-4 rounded-full w-max mx-auto shadow-[0_0_18px_rgba(139,30,30,0.45)] ${checkoutTimeLeft <= 120 ? 'border-red-500 text-red-200 animate-pulse shadow-[0_0_25px_rgba(239,68,68,0.5)]' : 'border-[#F0C265]/60 text-[#FFF2D4]'}`}>
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F0C265] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F0C265]"></span>
                      </span>
                      <span className="text-[11px] uppercase tracking-widest">Oferta garantida por</span>
                      <span className="text-sm text-[#F0C265]">{formatCheckoutTime(checkoutTimeLeft)}</span>
                    </div>
                  ) : (
                    <span className="font-mono text-[10px] text-red-400 block uppercase font-bold tracking-widest">Tempo da oferta garantida esgotado</span>
                  )}
                </div>
              </div>

              {checkoutExpired ? (
                <div className="space-y-3">
                  <div className="bg-[#8B1E1E]/10 border border-[#8B1E1E]/40 rounded-xl p-4 text-center space-y-2">
                    <span className="font-mono text-xs text-[#FF4B2E] uppercase font-bold tracking-widest block">⏰ Reserva de oferta expirada</span>
                    <p className="text-xs text-gray-300 leading-relaxed">Seus dados continuam salvos{pixData?.expiresAt ? <> e o QR Code permanece válido até {fmtValidade(pixData.expiresAt)} (BRT) — pode pagá-lo normalmente que a vaga confirma sozinha</> : ''}. Renove o prazo para manter a garantia do valor do {activeLoteName}.</p>
                  </div>
                  <button onClick={renewReservation} className="font-mono text-sm font-bold text-black btn-gold-shimmer py-3 rounded-xl w-full uppercase border-none">Renovar 10 minutos</button>
                  <button onClick={closeCheckout} className="font-mono text-xs font-bold text-gray-300 border border-white/[0.14] py-2.5 rounded-xl w-full hover:bg-white/[0.08] transition-colors uppercase">Fechar e continuar depois</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {sandboxSimulacao && pixData && (
                    <button onClick={simularPagamento} className="font-mono text-sm font-black text-black bg-gradient-to-b from-amber-300 to-amber-500 py-3.5 rounded-xl w-full uppercase tracking-widest active:scale-[0.98] transition-transform">
                      ⚡ Simular pagamento (teste)
                    </button>
                  )}
                  <button onClick={copyPixCode} className="font-mono text-sm font-bold text-white bg-white/[0.08] border border-white/25 py-3 rounded-xl w-full hover:bg-white/[0.12] transition-colors uppercase">
                    {pixCopied ? '✓ Código Pix Copiado!' : 'Copiar Código Pix'}
                  </button>
                  {showManualConfirm && (
                    pixActive ? (
                      <button onClick={handleManualPixCheck} className="font-mono text-[10px] text-gray-300 hover:text-[#F0C265] uppercase tracking-widest w-full py-1 transition-colors">
                        Pagamento não identificado? Verificar novamente
                      </button>
                    ) : (
                      <button onClick={() => handleSimulateWebhook()} className="font-mono text-[10px] text-gray-300 hover:text-[#F0C265] uppercase tracking-widest w-full py-1 transition-colors">
                        Pagamento não identificado? Verificar novamente
                      </button>
                    )
                  )}
                  {checkoutError && (
                    <div className="bg-red-500/10 border border-red-500/40 rounded-xl px-4 py-3 flex items-start gap-2.5">
                      <span className="text-red-400 text-base leading-none mt-0.5">⚠</span>
                      <div className="text-left">
                        <span className="text-xs text-red-300 font-bold uppercase tracking-wide block">Atenção</span>
                        <span className="text-xs text-red-200/90 leading-snug">{checkoutError}</span>
                      </div>
                      <button type="button" onClick={() => setCheckoutError(null)} className="ml-auto text-red-300/70 hover:text-white text-lg leading-none">×</button>
                    </div>
                  )}
                </div>
              )}

              {/* Barra de seguranca e credibilidade (rodape) */}
              <div className="border-t border-white/10 pt-3">
                <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap opacity-70">
                  <span className="flex items-center gap-1 font-mono text-[9px] text-gray-300 uppercase tracking-wider">
                    <svg width="10" height="12" viewBox="0 0 10 12" fill="none"><rect x="0.5" y="5" width="9" height="6.5" rx="1.5" stroke="#F0C265"/><path d="M2.5 5V3.5a2.5 2.5 0 0 1 5 0V5" stroke="#F0C265"/></svg>
                    SSL 256-bit
                  </span>
                  <span className="w-1 h-1 rounded-full bg-gray-700" />
                  <span className="font-mono text-[9px] text-gray-300 uppercase tracking-wider font-black">Mercado Pago</span>
                  <span className="w-1 h-1 rounded-full bg-gray-700" />
                  <span className="font-mono text-[9px] text-gray-300 uppercase tracking-wider">Pix · Banco Central</span>
                  <span className="w-1 h-1 rounded-full bg-gray-700" />
                  <span className="flex items-center gap-1 font-mono text-[9px] text-gray-300 uppercase tracking-wider">
                    <svg width="10" height="12" viewBox="0 0 10 12" fill="none"><path d="M5 1L1 2.5v3c0 2.8 1.7 4.6 4 5.5 2.3-.9 4-2.7 4-5.5v-3L5 1z" stroke="#F0C265"/></svg>
                    Dados protegidos
                  </span>
                </div>
                <p className="text-center font-mono text-[8px] text-gray-600 uppercase tracking-widest mt-2">Estúdio Pedra Profana · Transação processada pelo Mercado Pago</p>
              </div>

              {/* In-modal close confirmation (no data loss, no native confirm) */}
              {confirmClose && (
                <div ref={confirmRef} className="legal-pop absolute inset-0 bg-black/90 rounded-[32px] z-20 flex flex-col items-center justify-center text-center p-8 space-y-5">
                  <span className="text-3xl">🎵</span>
                  <div className="space-y-2">
                    <h4 className="font-display font-black text-lg text-white uppercase tracking-tight">Fechar o checkout?</h4>
                    <p className="text-xs text-gray-300 leading-relaxed max-w-[240px]">Seus dados ficam salvos no rascunho e você pode retomar a inscrição a qualquer momento.</p>
                  </div>
                  <div className="flex flex-col gap-3 w-full max-w-[240px] pt-1">
                    <button onClick={() => setConfirmClose(false)} className="btn-gold-shimmer px-4 py-3 rounded-full text-xs uppercase tracking-widest font-black text-black">Continuar pagando</button>
                    <button onClick={closeCheckout} className="font-mono text-xs font-bold text-gray-300 border border-white/[0.14] py-2.5 rounded-full hover:bg-white/[0.08] transition-colors uppercase">Fechar por agora</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      {/* SUCCESS STATE - BACKSTAGE PASS / CONCERT TICKET */}
      {successVisible && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 backdrop-blur-sm px-4 py-8 sm:p-6 flex justify-center items-start">

            <div
              ref={successCardRef}
              className="bg-[#161B26] border-2 border-[#F0C265] max-w-md w-full rounded-[32px] text-center overflow-hidden shadow-2xl relative my-auto"
            >

              {/* Luxury Ticket Background Graphics */}
              <div className="absolute -right-32 -top-32 w-64 h-64 bg-[#F0C265]/5 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -left-32 -bottom-32 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl pointer-events-none"></div>

              {/* Faux Torn Edge notches represent real tickets */}
              <div className="absolute left-[-10px] top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#1E2434] border-r border-[#F0C265]"></div>
              <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#1E2434] border-l border-[#F0C265]"></div>

              {/* TICKET TOP PORTION */}
              <div className="p-6 md:p-8 space-y-4">
                <div className="w-12 h-12 rounded-full bg-lime/10 text-lime border-2 border-lime flex items-center justify-center mx-auto text-2xl shadow font-bold">✓</div>

                <div className="space-y-1">
                  <span className="font-mono text-[9px] text-lime uppercase tracking-widest font-black bg-lime/10 px-2.5 py-0.5 rounded border border-lime/20">● Homologado no Sistema</span>
                  <h4 className="font-mono text-[10px] text-[#F0C265] font-black uppercase tracking-widest block pt-2">CONCURSO CANÇÃO PROFANA</h4>
                  <h3 className="font-display font-black text-2xl text-white uppercase tracking-tightest leading-tight">MATRÍCULA CONFIRMADA!</h3>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed max-w-xs mx-auto">Inscrição registrada com sucesso! Sua matrícula fica ativa no portal do candidato após a confirmação do pagamento.</p>
              </div>

              {/* DASHED SEPARATOR LINE */}
              <div className="border-t-2 border-dashed border-[#F0C265]/30 relative"></div>

              {/* TICKET BOTTOM PORTION */}
              <div className="p-6 md:p-8 bg-[#1B2130] space-y-6">

                <div className="grid grid-cols-2 gap-4 text-left border border-white/10 p-4 rounded-2xl bg-white/[0.06] font-mono text-[11px]">
                  <div>
                    <span className="text-gray-400 uppercase block text-[9px]">CÓDIGO DE ACESSO DA BANDA:</span>
                    <span className="text-xs font-black text-[#F0C265] font-mono block mt-0.5">{(inviteCode || '').toUpperCase()}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 uppercase block text-[9px]">ROSTER CONECTADO:</span>
                    <span className="text-xs font-black text-[#F0EAE0] font-mono block mt-0.5">{selectedMembers} INTEGRANTES</span>
                  </div>
                  <div className="col-span-2 border-t border-white/10 pt-3">
                    <span className="text-gray-400 uppercase block text-[9px]">RESPONSÁVEL:</span>
                    <span className="text-xs font-black text-white font-mono block mt-0.5">{respName || 'não informado'}</span>
                    {respEmail && <span className="text-[10px] text-gray-300 font-mono block mt-0.5">{respEmail}</span>}
                  </div>
                  <div className="col-span-2 border-t border-white/10 pt-3">
                    <span className="text-[#10B981] uppercase font-bold block text-[9px]">Condição Solidária Obrigatória:</span>
                    <p className="text-xs text-gray-300 mt-1 leading-relaxed font-mono">Trazer {selectedMembers}kg de alimento não-perecível na entrada do estúdio.</p>
                  </div>
                </div>

                {/* Realistic Barcode Design */}
                <div className="space-y-1">
                  <div className="h-9 bg-white/[0.08] rounded px-4 flex items-center justify-between opacity-70 border border-white/10">
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
                  <span className="font-mono text-[8px] text-gray-400 uppercase tracking-widest block">Pedra Profana Backstage Access</span>
                </div>

                {/* Complemento pos-matricula: bio + foto via WhatsApp do estudio */}
                {suporteWa && (
                  <div className="space-y-2.5 bg-[#1B2130] border border-white/[0.14] rounded-2xl p-4 text-left">
                    <span className="font-mono text-[11px] text-[#F0C265] uppercase tracking-widest font-black block">Falta pouco para o dossiê completo</span>
                    <p className="text-xs text-gray-300 leading-relaxed">Envie pelo WhatsApp do estúdio a <strong className="text-white">história da banda</strong> (bio) e a <strong className="text-white">foto oficial</strong> para os jurados. Leva 2 minutos.</p>
                    <a
                      href={suporteWa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-1.5 font-mono text-xs font-bold text-black bg-[#10B981] px-3 py-3 rounded-xl uppercase tracking-wide"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> Enviar bio e foto pelo WhatsApp
                    </a>
                  </div>
                )}

                {/* Convite da banda */}
                {inviteCode && (
                  <div className="space-y-3.5 bg-[#1B2130] border border-[#F0C265]/25 rounded-2xl p-5 text-left">
                    <span className="font-mono text-xs text-[#F0C265] uppercase tracking-widest font-black block">🔗 Link exclusivo da banda</span>
                    {paymentMode === 'lider' ? (
                      <>
                        <p className="text-sm text-gray-200 leading-relaxed">Envie aos integrantes: cada um acessa, confirma os próprios dados e aparece no roster com a função dele. A parte de todos já está coberta pelo seu Pix.</p>
                        <p className="text-sm text-white leading-snug">
                          Banda <strong className="text-[#10B981]">ativa</strong> no concurso{bandResult ? <> · <strong className="text-[#F0C265]">{bandResult.pago}</strong>/<strong className="text-[#F0C265]">{bandResult.total}</strong> integrantes confirmados</> : ''}.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-gray-200 leading-relaxed">Envie aos integrantes: cada um acessa, confirma os próprios dados e paga a parte dele.</p>
                        <p className="text-sm text-white leading-snug">
                          A banda ativa no concurso ao atingir <strong className="text-[#F0C265]">{bandResult?.minimo ?? 2} partes pagas</strong>
                          {bandResult ? <> agora: <strong className="text-[#F0C265]">{bandResult.pago}</strong></> : ''}.
                        </p>
                      </>
                    )}
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(`${window.location.origin}${origem === 'v2' ? '/v2' : ''}?b=${inviteCode}`);
                            setInviteCopied(true);
                            setTimeout(() => setInviteCopied(false), 2500);
                          } catch { /* clipboard */ }
                        }}
                        className="w-full sm:flex-1 font-mono text-sm font-bold text-white bg-white/[0.12] border border-white/[0.22] px-3 py-3 rounded-xl hover:bg-white/15 transition-colors uppercase"
                      >
                        {inviteCopied ? '✓ Link copiado!' : 'Copiar link'}
                      </button>
                      <a
                        href={`/api/wa/${inviteCode}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:flex-1 flex items-center justify-center gap-1.5 font-mono text-sm font-bold text-black bg-[#10B981] px-3 py-3 rounded-xl uppercase tracking-wide"
                      >
                        Enviar por WhatsApp
                      </a>
                    </div>
                  </div>
                )}

                {/* Viral Stage Pass share CTA buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleViralShare}
                    className="w-full sm:w-1/2 flex items-center justify-center gap-1.5 font-mono text-xs font-bold text-white bg-white/[0.08] border border-white/[0.14] px-4 py-3 rounded-full hover:bg-white/[0.12] transition-colors uppercase"
                  >
                    {shareCopied ? '✓ Convocação Copiada!' : (<><Share2 className="w-3.5 h-3.5" /> Compartilhar</>)}
                  </button>
                  <a
                    href={inviteCode ? `/minha-inscricao?k=${inviteCode}` : '/v2'}
                    className="w-full sm:w-1/2 btn-gold-shimmer px-4 py-3 rounded-full text-xs uppercase tracking-widest font-black text-black text-center"
                  >
                    Ver minha inscrição
                  </a>
                </div>
              </div>

            </div>
          </div>
        )}

      {/* Legal popups (shared, CSS-animated, zero JS cost when closed) */}
      <TermsModal open={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
      <PrivacyModal open={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
    </>
  );
}
