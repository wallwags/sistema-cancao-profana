'use client';

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { Trash2, Plus, X, Copy, Share2 } from 'lucide-react';
import Link from 'next/link';
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
}

export default function QuizFlow({ isOpen, onClose, activePrice, activeLoteName, onPaymentSuccess }: QuizFlowProps) {
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

  // Natural dynamic list of additional members (roster)
  const [membersList, setMembersList] = useState<Array<{ name: string; cpf: string; birth: string }>>([]);
  const [selectedMembers, setSelectedMembers] = useState(1);
  const [acceptRules, setAcceptRules] = useState(false);
  const [minPayable, setMinPayable] = useState(2);

  // Inline add-member form
  const [isAddingMemberInline, setIsAddingMemberInline] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberCpf, setNewMemberCpf] = useState('');
  const [newMemberBirth, setNewMemberBirth] = useState('');
  const [memberErrors, setMemberErrors] = useState<Record<string, string>>({});

  // Inline validation errors (no native alerts)
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Draft Recovery
  const [draftToRestore, setDraftToRestore] = useState<any>(null);

  // Legal popups (also reachable from quiz step 5)
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  // Checkout states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
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
  const sessionRef = useRef<string>('');

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
        sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA',
        callback: (token: string) => setTsToken(token)
      });
      tsRenderedRef.current = true;
    }
  };

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

  useEffect(() => {
    setMinPayable(m => Math.min(Math.max(2, m), Math.max(2, selectedMembers)));
  }, [selectedMembers]);

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
    supabase.rpc('log_funnel_event', { p_ref: sessionRef.current, p_event: event, p_step: step })
      .then(() => funnelLogged.current.add(key));
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

  // Step transition — enter-only (slide-in with direction), no exit choreography
  useIsomorphicLayoutEffect(() => {
    if (quizVisible && !draftToRestore) logFunnel('quiz_step', String(quizStep));
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

  useEffect(() => {
    if (quizVisible && quizStep === 5) tryRenderTurnstile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizVisible, quizStep]);

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

  // Member inline form — whole block (container + content) expands together
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

  // Auto-save Quiz progress draft — debounced (500ms) to avoid write-per-keystroke jank
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
      if (!projectName.trim()) errs.projectName = 'Informe o nome da banda / dupla.';
      if (!projectStyle.trim()) errs.projectStyle = 'Informe o estilo musical.';
    }
    if (step === 2) {
      if (!projectBio.trim()) errs.projectBio = 'Escreva uma biografia para avaliação dos jurados.';
      if (!projectPhotoName) errs.projectPhotoName = 'Envie a foto oficial do projeto.';
    }
    if (step === 3) {
      if (!respName.trim()) errs.respName = 'Informe o nome completo do responsável.';
      if (!respCpf) errs.respCpf = 'Informe o CPF.';
      else if (respCpf.length < 14) errs.respCpf = 'CPF incompleto.';
      else if (!isValidCPF(respCpf)) errs.respCpf = 'CPF inválido. Confira os dígitos.';
      if (!respBirth) errs.respBirth = 'Informe a data de nascimento.';
      else if (!isValidBirthDate(respBirth)) errs.respBirth = 'Data inválida (entre 1920 e 2016).';
      if (!respPhone) errs.respPhone = 'Informe o WhatsApp.';
      else if (!isValidWhatsApp(respPhone)) errs.respPhone = 'Informe um celular válido com DDD.';
      if (!respEmail.trim()) errs.respEmail = 'Informe o e-mail.';
      else if (!isValidEmail(respEmail)) errs.respEmail = 'Informe um e-mail válido.';
    }
    if (step === 4) {
      if (isAddingMemberInline) errs.roster = 'Confirme ou descarte o integrante em preenchimento antes de avançar.';
      else if (membersList.length < 1) errs.roster = 'O regulamento exige no mínimo 2 participantes (líder + 1 integrante). Use "+ Escalar Integrante".';
    }
    if (step === 5) {
      if (!acceptRules) errs.acceptRules = 'É obrigatório declarar ciência das regras para gerar o Pix.';
    }
    return errs;
  };

  const handleQuizNext = () => {
    const errs = validateStep(quizStep);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSlideDirection('next');
    setQuizStep(quizStep + 1);
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
    if (!newMemberCpf) errs.newMemberCpf = 'Informe o CPF.';
    else if (newMemberCpf.length < 14) errs.newMemberCpf = 'CPF incompleto.';
    else if (!isValidCPF(newMemberCpf)) errs.newMemberCpf = 'CPF inválido.';
    if (!newMemberBirth) errs.newMemberBirth = 'Informe a data de nascimento.';
    else if (!isValidBirthDate(newMemberBirth)) errs.newMemberBirth = 'Data inválida.';
    setMemberErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const copy = [...membersList];
    copy.push({ name: newMemberName.trim(), cpf: newMemberCpf, birth: newMemberBirth });
    setMembersList(copy);
    setNewMemberName('');
    setNewMemberCpf('');
    setNewMemberBirth('');
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
      setQuizStep(draftToRestore.step || 1);
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
      let photoUrl: string | null = null;
      const dataUrl = typeof window !== 'undefined' ? localStorage.getItem('temp_compressed_photo') : null;
      if (dataUrl && dataUrl.startsWith('data:image')) {
        try {
          const blobResult = await fetch(dataUrl);
          const blob = await blobResult.blob();
          const baseName = (projectPhotoName || 'foto').split('.')[0].replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30) || 'foto';
          const path = `${Date.now()}-${baseName}.jpg`;
          const { error: upErr } = await supabase.storage
            .from('project-photos')
            .upload(path, blob, { contentType: 'image/jpeg', cacheControl: '3600' });
          if (!upErr) {
            const { data: pub } = supabase.storage.from('project-photos').getPublicUrl(path);
            photoUrl = pub?.publicUrl || null;
          }
        } catch { /* segue sem foto */ }
      }

      const membersPayload = membersList.map(m => ({ name: m.name, cpf: m.cpf, birth: m.birth }));
      const minPay = Math.min(Math.max(2, minPayable), 1 + membersList.length);

      const { data, error } = await supabase.rpc('create_band_registration', {
        p_name: projectName,
        p_style: projectStyle,
        p_bio: projectBio,
        p_photo_url: photoUrl || 'default_photo.png',
        p_instagram: projectInstagram || null,
        p_video_link: projectVideoLink || null,
        p_leader: { name: respName, cpf: respCpf, birth: respBirth, phone: respPhone, email: respEmail },
        p_members: membersPayload,
        p_min_payable: minPay
      });

      if (error || !data) throw new Error(error?.message || 'Falha ao registrar a banda.');

      setInviteCode(data.invite_code);
      localStorage.removeItem('quiz_draft_v2');
      localStorage.removeItem('temp_compressed_photo');
      localStorage.setItem('current_project_id', data.project_id);
      localStorage.setItem('current_cpf_v2', respCpf);
      return data.project_id;
    } catch (err: any) {
      console.warn('Falha no registro da banda:', err);
      setCheckoutError('Não foi possível concluir o registro agora. Verifique sua conexão e tente de novo — seus dados continuam aqui.');
      setShowManualConfirm(true);
      webhookDoneRef.current = false;
      setIsCheckoutLoading(false);
      return '';
    }
  };

  // ---------- Checkout flow ----------
  const handleLaunchCheckout = () => {
    const errs = validateStep(5);
    if (honey.trim()) {
      setErrors({ acceptRules: 'Não foi possível validar o envio. Recarregue a página e tente novamente.' });
      return;
    }
    if (quizOpenedAt.current && Date.now() - quizOpenedAt.current < 4000) {
      setErrors({ acceptRules: 'Revise com calma as informações antes de gerar o Pix.' });
      return;
    }
    if (!tsToken && !demoRef.current) {
      errs.acceptRules = 'Confirme a verificação anti-robô antes de gerar o Pix.';
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

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

  // Dynamic automatic payment confirmation polling (reduced: ~5s total, was ~10.5s)
  useEffect(() => {
    let t1: ReturnType<typeof setTimeout>, t2: ReturnType<typeof setTimeout>, t3: ReturnType<typeof setTimeout>, tManual: ReturnType<typeof setTimeout>;
    if (isCheckoutOpen && !checkoutExpired) {
      setShowManualConfirm(false);
      t1 = setTimeout(() => setPollingStep(1), 1800);
      t2 = setTimeout(() => setPollingStep(2), 3600);
      t3 = setTimeout(() => { handleSimulateWebhook(); }, 5100);
      // Manual fallback only if something failed after 15s
      tManual = setTimeout(() => {
        if (!webhookDoneRef.current) setShowManualConfirm(true);
      }, 15000);
    }
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(tManual); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCheckoutOpen, checkoutExpired]);

  const handleSimulateWebhook = async () => {
    // Guard against double execution (auto polling + manual click)
    if (webhookDoneRef.current) return;
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

      if (!inviteCode) {
        webhookDoneRef.current = false;
        setIsCheckoutLoading(false);
        setShowManualConfirm(true);
        setCheckoutError('Registro não localizado. Tente novamente.');
        return;
      }

      const { data: payRes, error: payErr } = await supabase.rpc('confirm_leader_payment', { p_code: inviteCode });
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

  const deriveTicketCode = (id: string): string => {
    if (!id) return 'CP-2026-0000';
    const clean = id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return 'CP-2026-' + clean.substring(0, 4);
  };

  const renewReservation = () => {
    setCheckoutTimeLeft(600);
    setCheckoutExpired(false);
    setPollingStep(0);
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
      } catch { /* user cancelled or unsupported — fall back to clipboard */ }
    }
    try {
      await navigator.clipboard.writeText(text);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    } catch { /* clipboard blocked */ }
  };

  const copyPixCode = async () => {
    try {
      await navigator.clipboard.writeText(`PIX CANCAO PROFANA | ${activeLoteName} | R$ ${totalCost},00 | Estudio Pedra Profana`);
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 2500);
    } catch { /* clipboard blocked */ }
  };

  // ---------- Demo filler (production-safe: fills valid data, validations stay on) ----------
  const fillDemoData = () => {
    demoRef.current = true;
    if (quizStep === 1) {
      setProjectName("[DEMO] Os Profanos do Ritmo");
      setProjectStyle("Rock Autoral");
      clearError('projectName'); clearError('projectStyle');
    } else if (quizStep === 2) {
      setProjectBio("Formada em 2025 nas garagens da serra, a banda une timbres clássicos de fuzz a letras densas e poéticas em português. Nosso objetivo é o palco principal do festival Pedra Profana Sessions 2026.");
      setProjectPhotoName("foto_backstage.jpg (Simulada)");
      setProjectInstagram("@osprofanos");
      setProjectVideoLink("https://youtube.com/watch?v=demo-profana");
      clearError('projectBio'); clearError('projectPhotoName');
    } else if (quizStep === 3) {
      setRespName("Emily Bryan");
      setRespCpf("123.456.789-09"); // 100% mathematically valid CPF
      setRespBirth("12/10/1998");
      setRespPhone("(21) 98765-4321");
      setRespEmail("contato@osprofanos.com.br");
      clearError('respName'); clearError('respCpf'); clearError('respBirth'); clearError('respPhone'); clearError('respEmail');
    } else if (quizStep === 4) {
      setNewMemberName("John Bryan");
      setNewMemberCpf("123.456.789-09");
      setNewMemberBirth("24/05/2000");
      openMemberForm();
    } else if (quizStep === 5) {
      setAcceptRules(true);
      clearError('acceptRules');
    }
  };

  const fieldError = (key: string) => errors[key] ? (
    <p className="text-[11px] text-red-400 font-mono mt-1 flex items-start gap-1"><span>⚠</span><span>{errors[key]}</span></p>
  ) : null;

  const inputClass = (key: string, base: string) => errors[key] ? base.replace('border-white/10', 'border-red-500/60') : base;

  return (
    <>
      {isOpen && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="lazyOnload"
          onLoad={tryRenderTurnstile}
        />
      )}

      {/* QUIZ INTERACTIVE POPUP MODAL — external page scroll, no internal modal scroll */}
      {quizVisible && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 sm:p-6 flex justify-center items-start sm:items-center">

          <div className="absolute inset-0 cursor-pointer" onClick={requestCloseQuiz}></div>

          <div
            ref={quizCardRef}
            className="bg-black/95 border-2 border-[#E3B552] w-full max-w-xl rounded-[32px] p-6 md:p-8 my-8 relative space-y-6 shadow-[0_10px_50px_rgba(0,0,0,0.8)] flex flex-col justify-between z-10"
          >
            <button type="button" onClick={requestCloseQuiz} className="absolute right-5 top-5 text-[#B3B3B3] hover:text-white font-mono text-2xl font-bold">&times;</button>

              {/* DRAFT RECOVERY */}
              {draftToRestore ? (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-6">
                  <div className="w-12 h-12 rounded-full bg-[#F0C265]/10 text-[#F0C265] border border-[#F0C265]/20 flex items-center justify-center text-xl shadow">⚡</div>
                  <div className="space-y-2">
                    <h3 className="font-display font-black text-xl text-white uppercase tracking-tight">Rascunho de Inscrição Ativo</h3>
                    <p className="text-xs text-gray-300 max-w-sm mx-auto leading-relaxed">
                      Encontramos um progresso de matrícula salvo localmente para a banda/dupla <strong className="text-[#F0C265]">&quot;{draftToRestore.projectName}&quot;</strong> no Passo <strong className="text-[#F0C265]">0{draftToRestore.step}/05</strong>. Deseja retomar?
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs pt-2">
                    <button type="button" onClick={handleDiscardDraft} className="w-full sm:w-1/2 font-mono text-xs font-bold text-gray-400 px-4 py-3 border border-white/10 rounded-full hover:bg-white/5 transition-colors uppercase">Descartar</button>
                    <button type="button" onClick={handleRestoreDraft} className="w-full sm:w-1/2 btn-gold-shimmer px-4 py-3 rounded-full text-xs uppercase tracking-widest font-black text-black">Continuar</button>
                  </div>
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

                    <div ref={stepRef} className="space-y-6">
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
                                  onChange={(e) => { setProjectName(e.target.value); clearError('projectName'); }}
                                  placeholder="Ex: The Jackson Five"
                                  className={inputClass('projectName', "w-full bg-[#05070B] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#E3B552] placeholder-gray-600 focus:ring-2 focus:ring-[#E3B552]/30 focus-visible:ring-2 focus-visible:ring-[#E3B552]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070B] transition-colors")}
                                  required
                                />
                                {fieldError('projectName')}
                              </div>
                              <div className="space-y-1">
                                <label className="block font-mono text-sm text-[#F0C265] font-bold uppercase">Estilo / Gênero *</label>
                                <input
                                  type="text"
                                  value={projectStyle}
                                  onChange={(e) => { setProjectStyle(e.target.value); clearError('projectStyle'); }}
                                  placeholder="Ex: R&B"
                                  className={inputClass('projectStyle', "w-full bg-[#05070B] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#E3B552] placeholder-gray-600 focus:ring-2 focus:ring-[#E3B552]/30 focus-visible:ring-2 focus-visible:ring-[#E3B552]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070B] transition-colors")}
                                  required
                                />
                                {fieldError('projectStyle')}
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
                                <div className="flex justify-between items-baseline">
                                  <label className="block font-mono text-sm text-[#F0C265] font-bold uppercase">Biografia *</label>

                                  {/* Dynamic Profile Strength Meter */}
                                  <span className="font-mono text-[9px] uppercase tracking-wider font-bold">
                                    {projectBio.length <= 80 && <span className="text-red-500">Fraca 🔴 (Adicione mais detalhes)</span>}
                                    {projectBio.length > 80 && projectBio.length <= 220 && <span className="text-yellow-500">Boa 🟡 (Fale de influências e objetivos)</span>}
                                    {projectBio.length > 220 && <span className="text-emerald-500">Excelente! 🟢 (Lineup qualificado)</span>}
                                  </span>
                                </div>
                                <textarea
                                  value={projectBio}
                                  onChange={(e) => { setProjectBio(e.target.value.slice(0, 400)); clearError('projectBio'); }}
                                  rows={3}
                                  maxLength={400}
                                  className={inputClass('projectBio', "w-full bg-[#05070B] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#E3B552] resize-none focus:ring-2 focus:ring-[#E3B552]/30 focus-visible:ring-2 focus-visible:ring-[#E3B552]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070B] transition-colors")}
                                  required
                                />
                                {fieldError('projectBio')}
                                <span className="text-xs text-gray-500 font-mono block text-right mt-1 font-bold">{projectBio.length}/400 caracteres</span>
                              </div>
                              <div className="space-y-1">
                                <label className="block font-mono text-sm text-[#F0C265] font-bold uppercase">Foto Oficial *</label>

                                {/* Real-time browser canvas compression upload */}
                                <div className={`border border-dashed rounded-xl p-5 text-center cursor-pointer bg-black/40 relative ${errors.projectPhotoName ? 'border-red-500/60' : 'border-white/10 hover:border-[#E3B552]'}`}>
                                  <input type="file" onChange={handleImageCompression} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" required />
                                  {projectPhotoName ? (
                                    <span className="text-sm text-[#10B981] font-bold">✓ Foto Selecionada: {projectPhotoName}</span>
                                  ) : (
                                    <span className="text-sm text-gray-400">Arraste ou clique para carregar foto</span>
                                  )}
                                </div>
                                {fieldError('projectPhotoName')}
                                <span className="text-[10px] text-gray-500 font-mono block mt-1">Formatos: JPEG, PNG, WEBP. Max: 5MB. Compressor client-side ativo (peso reduzido a &lt; 250KB).</span>
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
                                <input type="text" value={respName} onChange={(e) => { setRespName(e.target.value); clearError('respName'); }} className={inputClass('respName', "w-full bg-[#05070B] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#E3B552] focus:ring-2 focus:ring-[#E3B552]/30 focus-visible:ring-2 focus-visible:ring-[#E3B552]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070B] transition-colors")} required />
                                {fieldError('respName')}
                              </div>
                              <div className="space-y-1">
                                <label className="block font-mono text-sm text-[#F0C265] font-bold uppercase">CPF *</label>
                                <input type="text" value={respCpf} onChange={(e) => { setRespCpf(applyCpfMask(e.target.value)); clearError('respCpf'); }} className={inputClass('respCpf', "w-full bg-[#05070B] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#E3B552] focus:ring-2 focus:ring-[#E3B552]/30 focus-visible:ring-2 focus-visible:ring-[#E3B552]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070B] transition-colors")} maxLength={14} required />
                                {fieldError('respCpf')}
                              </div>
                              <div className="space-y-1">
                                <label className="block font-mono text-sm text-[#F0C265] font-bold uppercase">Nascimento *</label>
                                <input type="text" value={respBirth} onChange={(e) => { setRespBirth(applyDateMask(e.target.value)); clearError('respBirth'); }} className={inputClass('respBirth', "w-full bg-[#05070B] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#E3B552] focus:ring-2 focus:ring-[#E3B552]/30 focus-visible:ring-2 focus-visible:ring-[#E3B552]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070B] transition-colors")} maxLength={10} required />
                                {fieldError('respBirth')}
                              </div>
                              <div className="space-y-1">
                                <label className="block font-mono text-sm text-[#F0C265] font-bold uppercase">WhatsApp *</label>
                                <input type="tel" value={respPhone} onChange={(e) => { setRespPhone(applyPhoneMask(e.target.value)); clearError('respPhone'); }} className={inputClass('respPhone', "w-full bg-[#05070B] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#E3B552] focus:ring-2 focus:ring-[#E3B552]/30 focus-visible:ring-2 focus-visible:ring-[#E3B552]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070B] transition-colors")} maxLength={15} required />
                                {fieldError('respPhone')}
                              </div>
                              <div className="space-y-1 md:col-span-2">
                                <label className="block font-mono text-sm text-[#F0C265] font-bold uppercase">E-mail *</label>
                                <input type="email" inputMode="email" value={respEmail} onChange={(e) => { setRespEmail(e.target.value); clearError('respEmail'); }} placeholder="Ex: contato@suabanda.com" className={inputClass('respEmail', "w-full bg-[#05070B] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#E3B552] placeholder-gray-600 focus:ring-2 focus:ring-[#E3B552]/30 focus-visible:ring-2 focus-visible:ring-[#E3B552]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070B] transition-colors")} required />
                                {fieldError('respEmail')}
                                <span className="text-[10px] text-gray-500 font-mono block">Usado para confirmar a matrícula e comunicados oficiais do concurso.</span>
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
                                onClick={openMemberForm}
                                className="flex items-center gap-1.5 font-mono text-xs font-bold text-black bg-[#F0C265] px-3.5 py-2.5 rounded-full hover:bg-[#FFF2D4] active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#F0C265]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070B]"
                              >
                                <Plus className="w-4 h-4" /> Escalar Integrante
                              </button>
                            </div>

                            {/* Interactive dynamic inline member insert form — whole block expands together (GSAP height auto) */}
                            {memberFormRendered && (
                              <div ref={collapseRef} className="overflow-hidden">
                                <div className="bg-black/50 p-4 border border-[#E3B552]/30 rounded-2xl space-y-4">
                                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                    <span className="font-mono text-xs text-[#F0C265] font-bold uppercase tracking-wider">Novo Integrante Roster</span>
                                    <button type="button" onClick={closeMemberForm} className="text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                      <label className="block font-mono text-[10px] text-gray-400 uppercase">Nome Completo</label>
                                      <input type="text" value={newMemberName} onChange={(newE) => { setNewMemberName(newE.target.value); setMemberErrors(prev => { const c = { ...prev }; delete c.newMemberName; return c; }); }} className={`w-full bg-[#05070B] border rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#E3B552] ${memberErrors.newMemberName ? 'border-red-500/60' : 'border-white/10'}`} />
                                      {memberErrors.newMemberName && <p className="text-[10px] text-red-400 font-mono">⚠ {memberErrors.newMemberName}</p>}
                                    </div>
                                    <div className="space-y-1">
                                      <label className="block font-mono text-[10px] text-gray-400 uppercase">CPF</label>
                                      <input type="text" value={newMemberCpf} onChange={(newE) => { setNewMemberCpf(applyCpfMask(newE.target.value)); setMemberErrors(prev => { const c = { ...prev }; delete c.newMemberCpf; return c; }); }} className={`w-full bg-[#05070B] border rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#E3B552] ${memberErrors.newMemberCpf ? 'border-red-500/60' : 'border-white/10'}`} maxLength={14} />
                                      {memberErrors.newMemberCpf && <p className="text-[10px] text-red-400 font-mono">⚠ {memberErrors.newMemberCpf}</p>}
                                    </div>
                                    <div className="space-y-1 sm:col-span-2">
                                      <label className="block font-mono text-[10px] text-gray-400 uppercase">Nascimento (DD/MM/AAAA)</label>
                                      <input type="text" value={newMemberBirth} onChange={(newE) => { setNewMemberBirth(applyDateMask(newE.target.value)); setMemberErrors(prev => { const c = { ...prev }; delete c.newMemberBirth; return c; }); }} className={`w-full bg-[#05070B] border rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#E3B552] ${memberErrors.newMemberBirth ? 'border-red-500/60' : 'border-white/10'}`} maxLength={10} />
                                      {memberErrors.newMemberBirth && <p className="text-[10px] text-red-400 font-mono">⚠ {memberErrors.newMemberBirth}</p>}
                                    </div>
                                  </div>

                                  <div className="flex justify-end gap-2.5 pt-2">
                                    <button type="button" onClick={closeMemberForm} className="font-mono text-xs font-bold text-gray-400 px-4 py-2 border border-white/10 rounded-full">Descartar</button>
                                    <button type="button" onClick={saveMemberInline} className="font-mono text-xs font-bold text-black bg-[#10B981] px-4 py-2 rounded-full">Confirmar</button>
                                  </div>
                                </div>
                              </div>
                            )}

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
                            {fieldError('roster')}
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
                                  <span className="font-mono text-sm text-gray-300 block font-bold">SUA PARTE AGORA (LÍDER):</span>
                                  <span className="text-3xl font-display font-black text-[#F0C265] block mt-1">R$ {activePrice},00</span>
                                  <span className="text-xs text-gray-300 font-mono block mt-1 uppercase">Cada integrante paga a própria parte pelo link — total da banda: R$ {totalCost},00</span>
                                </div>
                              </div>
                            </div>

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
                                <input type="checkbox" checked={acceptRules} onChange={(e) => { setAcceptRules(e.target.checked); clearError('acceptRules'); }} className="mt-1 w-4 h-4 text-[#F0C265] bg-black border-[#2E2820] rounded focus:ring-[#F0C265]" />
                                <span className="text-xs text-gray-300 leading-relaxed font-normal">
                                  Declaramos ler e anuir os <button type="button" onClick={(e) => { e.preventDefault(); setIsTermsOpen(true); }} className="text-[#F0C265] underline hover:text-[#FFF2D4]">termos de uso</button> e <button type="button" onClick={(e) => { e.preventDefault(); setIsPrivacyOpen(true); }} className="text-[#F0C265] underline hover:text-[#FFF2D4]">política de privacidade</button>, concordando com as etapas.
                                </span>
                              </label>
                              {fieldError('acceptRules')}
                                <div className="pt-2 flex justify-center">
                                  <div id="cf-ts" />
                                  {!tsToken && (
                                    <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest">Verificação anti-robô ativa</span>
                                  )}
                                </div>
                            </div>
                          </div>
                        )}
                    </div>

                    {/* CONTROLS */}
                    <div className="border-t border-[#2C2C2C] pt-4 flex justify-between items-center gap-4 shrink-0">
                      <div className="flex flex-col">
                        <span className="text-xs text-[#B3B3B3] font-mono uppercase tracking-widest block font-bold">PASSO ATIVO</span>
                        <span className="text-sm text-[#F0EAE0] font-bold font-mono">0{quizStep}/05</span>
                      </div>

                      <div className="flex gap-2.5">
                        {/* Golden test demo filler button (fills valid data; validations stay active) */}
                        <button type="button" onClick={fillDemoData} className="font-mono text-xs font-bold text-[#F0C265] bg-[#F0C265]/10 border border-[#F0C265]/20 px-3.5 py-2 rounded-xl uppercase hover:bg-[#F0C265] hover:text-black transition-colors">Testar Demo</button>

                        {quizStep > 1 && (
                          <button type="button" onClick={handleQuizPrev} className="font-mono text-xs font-bold text-white border border-white/10 bg-white/5 px-5 py-2.5 rounded-xl uppercase">Voltar</button>
                        )}
                        {quizStep < 5 ? (
                          <button type="button" onClick={handleQuizNext} className="btn-gold-shimmer px-7 py-2.5 rounded uppercase border-none text-black">Continuar</button>
                        ) : (
                          <button type="button" onClick={handleLaunchCheckout} className="font-mono text-xs font-bold text-black bg-lime px-7 py-2.5 rounded-xl uppercase border-none">
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

      {/* CHECKOUT POPUP MODAL — external page scroll */}
      {checkoutVisible && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 sm:p-6 flex justify-center items-start sm:items-center">

            <div className="absolute inset-0 cursor-pointer" onClick={requestCloseCheckout}></div>

            <div
              ref={checkoutCardRef}
              className="bg-black/95 border-2 border-[#E3B552] max-w-sm w-full p-6 rounded-[32px] relative space-y-6 shadow-2xl z-10"
            >
              <button onClick={requestCloseCheckout} className="absolute right-4 top-4 text-gray-400 hover:text-white font-mono text-xl">&times;</button>

              <div className="text-center space-y-2 pt-2">
                <span className="font-mono text-sm text-lime font-bold bg-lime/10 border border-lime/20 px-3 py-1 rounded-full w-max mx-auto block uppercase">● Servidor Autenticado</span>
                <h3 className="font-display font-bold text-xl text-white uppercase tracking-tight">PIX DE INSCRIÇÃO</h3>
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
                    <span className="font-mono text-[10px] text-gray-500 block uppercase font-bold">SUA PARTE (LÍDER):</span>
                    <span className="text-2xl font-mono font-black text-lime block mt-0.5">R$ {activePrice},00</span>
  </div>

                  {/* Live polling status line (feedback while QR is on screen) */}
                  {!checkoutExpired && !isCheckoutLoading && (
                    <span className="font-mono text-[10px] text-gray-400 block animate-pulse uppercase tracking-widest">
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
                      <span className="text-[11px] uppercase tracking-widest">Preço garantido por</span>
                      <span className="text-sm text-[#F0C265]">{formatCheckoutTime(checkoutTimeLeft)}</span>
                    </div>
                  ) : (
                    <span className="font-mono text-[10px] text-red-400 block uppercase font-bold tracking-widest">Tempo do preço garantido esgotado</span>
                  )}
                </div>
              </div>

              {checkoutExpired ? (
                <div className="space-y-3">
                  <div className="bg-[#8B1E1E]/10 border border-[#8B1E1E]/40 rounded-xl p-4 text-center space-y-2">
                    <span className="font-mono text-xs text-[#FF4B2E] uppercase font-bold tracking-widest block">⏰ Reserva de preço expirada</span>
                    <p className="text-xs text-gray-300 leading-relaxed">Seus dados continuam salvos. Renove o prazo e gere o Pix novamente para garantir o valor do {activeLoteName}.</p>
                  </div>
                  <button onClick={renewReservation} className="font-mono text-sm font-bold text-black btn-gold-shimmer py-3 rounded-xl w-full uppercase border-none">Renovar 10 minutos</button>
                  <button onClick={closeCheckout} className="font-mono text-xs font-bold text-gray-400 border border-white/10 py-2.5 rounded-xl w-full hover:bg-white/5 transition-colors uppercase">Fechar e continuar depois</button>
                </div>
              ) : (
                <div className="space-y-3">
                  <button onClick={copyPixCode} className="font-mono text-sm font-bold text-white bg-white/5 border border-[#2E2820] py-3 rounded-xl w-full hover:bg-white/10 transition-colors uppercase">
                    {pixCopied ? '✓ Código Pix Copiado!' : 'Copiar Código Pix'}
                  </button>
                  {showManualConfirm && (
                    <button onClick={handleSimulateWebhook} className="font-mono text-[10px] text-gray-400 hover:text-[#F0C265] uppercase tracking-widest w-full py-1 transition-colors">
                      Pagamento não identificado? Verificar novamente
                    </button>
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
                    <button onClick={closeCheckout} className="font-mono text-xs font-bold text-gray-400 border border-white/10 py-2.5 rounded-full hover:bg-white/5 transition-colors uppercase">Fechar por agora</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      {/* SUCCESS STATE — BACKSTAGE PASS / CONCERT TICKET */}
      {successVisible && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 sm:p-6 flex justify-center items-start sm:items-center">

            <div
              ref={successCardRef}
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

                <p className="text-xs text-gray-400 leading-relaxed max-w-xs mx-auto">Inscrição registrada com sucesso! Após a confirmação do Pix pela equipe do estúdio, sua matrícula fica ativa no portal do candidato.</p>
              </div>

              {/* DASHED SEPARATOR LINE */}
              <div className="border-t-2 border-dashed border-[#F0C265]/30 relative"></div>

              {/* TICKET BOTTOM PORTION */}
              <div className="p-6 md:p-8 bg-black/40 space-y-6">

                <div className="grid grid-cols-2 gap-4 text-left border border-white/5 p-4 rounded-2xl bg-black/30 font-mono text-[11px]">
                  <div>
                    <span className="text-gray-500 uppercase block text-[9px]">CÓDIGO ID BANDA:</span>
                    <span className="text-xs font-black text-white font-mono block mt-0.5">{ticketCode}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 uppercase block text-[9px]">ROSTER CONECTADO:</span>
                    <span className="text-xs font-black text-[#F0EAE0] font-mono block mt-0.5">{selectedMembers} INTEGRANTES</span>
                  </div>
                  <div className="col-span-2 border-t border-white/5 pt-3">
                    <span className="text-gray-500 uppercase block text-[9px]">RESPONSÁVEL:</span>
                    <span className="text-xs font-black text-white font-mono block mt-0.5">{respName || '—'}</span>
                    {respEmail && <span className="text-[10px] text-gray-400 font-mono block mt-0.5">{respEmail}</span>}
                  </div>
                  <div className="col-span-2 border-t border-white/5 pt-3">
                    <span className="text-[#10B981] uppercase font-bold block text-[9px]">Condição Solidária Obrigatória:</span>
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

                {/* Convite da banda */}
                {inviteCode && (
                  <div className="space-y-3 bg-black/40 border border-[#F0C265]/25 rounded-2xl p-4">
                    <span className="font-mono text-[10px] text-[#F0C265] uppercase tracking-widest font-black block">🔗 Link exclusivo da banda — envie aos integrantes</span>
                    <p className="text-xs text-gray-300 leading-relaxed">Cada integrante acessa, confirma os próprios dados e paga a parte dele. A banda ativa no concurso ao atingir {bandResult?.minimo ?? 2} partes pagas{bandResult ? ` (agora: ${bandResult.pago})` : ''}.</p>
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(`${window.location.origin}/v2?b=${inviteCode}`);
                            setInviteCopied(true);
                            setTimeout(() => setInviteCopied(false), 2500);
                          } catch { /* clipboard */ }
                        }}
                        className="w-full sm:flex-1 font-mono text-xs font-bold text-white bg-white/5 border border-white/10 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors uppercase"
                      >
                        {inviteCopied ? '✓ Link copiado!' : 'Copiar link do convite'}
                      </button>
                      <a
                        href={`/api/wa/${inviteCode}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:flex-1 flex items-center justify-center gap-1.5 font-mono text-xs font-bold text-black bg-[#10B981] px-3 py-2.5 rounded-xl uppercase tracking-wide"
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
                    className="w-full sm:w-1/2 flex items-center justify-center gap-1.5 font-mono text-xs font-bold text-white bg-white/5 border border-white/10 px-4 py-3 rounded-full hover:bg-white/10 transition-colors uppercase"
                  >
                    {shareCopied ? '✓ Convocação Copiada!' : (<><Share2 className="w-3.5 h-3.5" /> Compartilhar</>)}
                  </button>
                  <Link
                    href="/minha-inscricao"
                    className="w-full sm:w-1/2 btn-gold-shimmer px-4 py-3 rounded-full text-xs uppercase tracking-widest font-black text-black text-center"
                  >
                    Ver minha inscrição
                  </Link>
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
