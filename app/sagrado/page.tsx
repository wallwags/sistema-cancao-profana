'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import {
  Shield, LayoutDashboard, Tags, FileText, ClipboardList, Users, UserCog,
  LogOut, Check, X, Plus, ArrowUp, ArrowDown, Trash2, KeyRound, Loader2, Star, Eye, History, UserPlus
} from 'lucide-react';

interface StaffRow {
  id: string;
  email: string;
  display_name: string;
  role: 'dev' | 'admin' | 'jurado';
  permissions: { manage_lotes?: boolean; manage_content?: boolean; manage_subscriptions?: boolean };
}

interface MemberFull {
  name: string;
  cpf: string;
  birth_date: string;
  phone: string | null;
  email?: string | null;
  is_responsible: boolean;
}

interface ScoreView {
  juror: string;
  presentation: number;
  composition: number;
  aesthetics: number;
  notes: string;
  updated_at: string;
}

interface JuryDraft {
  presentation: number;
  composition: number;
  aesthetics: number;
  notes: string;
}

interface BatchRow {
  id: string;
  name: string;
  status: 'ativo' | 'encerrado' | 'em_breve';
  price_per_member: string | number;
  vagas_total: number;
  vagas_restantes: number;
  starts_at: string | null;
  ends_at: string | null;
}

interface FaqRow {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  active: boolean;
}

interface ProjectRow {
  id: string;
  name: string;
  style: string;
  bio?: string | null;
  instagram?: string | null;
  video_link?: string | null;
  photo_url?: string | null;
  status: string;
  created_at: string;
  members?: { count: number }[];
  subscriptions?: { status: string; amount_paid: number; batches?: { name: string } }[];
}

interface BatchDraft {
  name?: string;
  price?: number | string;
  vagas_total?: number | string;
  vagas_restantes?: number | string;
  starts_at?: string;
  ends_at?: string;
}

const TZ = 'America/Sao_Paulo';
const PERM_KEYS = [
  { key: 'manage_lotes', label: 'Gerenciar lotes e preços' },
  { key: 'manage_content', label: 'Gerenciar conteúdo do site' },
  { key: 'manage_subscriptions', label: 'Gerenciar inscrições e pagamentos' },
] as const;

const PROJECT_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: 'pendente', cls: 'bg-amber-500/15 text-amber-500 border-amber-500/30' },
  paid: { label: 'paga', cls: 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30' },
  failed: { label: 'negada', cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
  blocked: { label: 'bloqueada', cls: 'bg-red-900/30 text-red-300 border-red-800/40' },
  suspended: { label: 'suspensa', cls: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  refunded: { label: 'reembolsada', cls: 'bg-white/5 text-gray-400 border-white/10' },
};

function parseDbDate(v?: string | null): Date | null {
  if (!v) return null;
  const d = new Date(String(v).replace(' ', 'T'));
  return isNaN(d.getTime()) ? null : d;
}

function toInputValue(v?: string | null): string {
  const d = parseDbDate(v);
  if (!d) return '';
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  }).format(d).replace(' ', 'T');
}

function fromInputValue(v: string): string | null {
  if (!v) return null;
  return `${v}:00-03:00`;
}

function fmtDate(v?: string | null): string {
  const d = parseDbDate(v);
  if (!d) return '—';
  return new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d);
}

function Notice({ kind, children }: { kind: 'ok' | 'err' | 'info'; children: React.ReactNode }) {
  if (!children) return null;
  const cls = kind === 'ok'
    ? 'bg-[#10B981]/15 border-[#10B981]/30 text-[#10B981]'
    : kind === 'err'
      ? 'bg-red-500/15 border-red-500/30 text-red-400'
      : 'bg-white/5 border-white/10 text-gray-300';
  return (
    <div className={`border rounded-xl px-4 py-2.5 text-xs font-mono leading-relaxed ${cls}`}>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block font-mono text-[9px] text-[#F0C265] font-bold uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-[#05070B] border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-[#E3B552] font-mono";
const btnGold = "bg-gradient-to-b from-[#FFF2D4] via-[#F0C265] to-[#B88A28] text-black font-display font-black text-[10px] uppercase tracking-widest py-2.5 px-4 rounded-xl border-none shadow-[0_0_15px_rgba(240,194,101,0.2)] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-transform";
const btnGhost = "font-mono text-[10px] font-bold text-white bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl uppercase tracking-wider hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

export default function SagradoPage() {
  const [booting, setBooting] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [me, setMe] = useState<StaffRow | null>(null);
  const [staffList, setStaffList] = useState<StaffRow[]>([]);

  const [tab, setTab] = useState('visao');
  const [pageError, setPageError] = useState('');

  // login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // data
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [batchDrafts, setBatchDrafts] = useState<Record<string, BatchDraft>>({});
  const [liveStatus, setLiveStatus] = useState<string>('em_breve');
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [settingDrafts, setSettingDrafts] = useState<Record<string, string>>({});
  const [faqs, setFaqs] = useState<FaqRow[]>([]);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ proj: Record<string, unknown> | null; members: MemberFull[]; sub: Record<string, unknown> | null; subsTotal: number; scores: ScoreView[] } | null>(null);
  const [ownScores, setOwnScores] = useState<Record<string, JuryDraft>>({});
  const [juryDraft, setJuryDraft] = useState<Record<string, JuryDraft>>({});
  const [openJury, setOpenJury] = useState<string | null>(null);
  const [invite, setInvite] = useState({ email: '', name: '', password: '', role: 'jurado' as 'jurado' | 'admin' });
  const [audit, setAudit] = useState<Array<Record<string, unknown>>>([]);
  const [searchQ, setSearchQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loteFilter, setLoteFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [jurySearch, setJurySearch] = useState('');

  // account
  const [newName, setNewName] = useState('');
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');

  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<Record<string, { kind: 'ok' | 'err' | 'info'; msg: string }>>({});

  const setMsg = (k: string, kind: 'ok' | 'err' | 'info', msg: string) => {
    setNotice(p => ({ ...p, [k]: { kind, msg } }));
    if (kind === 'ok') setTimeout(() => setNotice(p => (p[k]?.msg === msg ? { ...p, [k]: { kind: 'info', msg: '' } } : p)), 3500);
  };

  const isDev = me?.role === 'dev';
  const isAdminRole = me?.role === 'admin';
  const isJudge = !!me && (isDev || me.role === 'jurado');
  const perms = me?.permissions || {};
  const canLotes = isDev || !!perms.manage_lotes;
  const canContent = isDev || !!perms.manage_content;
  const canSubs = isDev || !!perms.manage_subscriptions;

  const loadLive = useCallback(async () => {
    const { data } = await supabase.from('live_broadcast').select('status').eq('id', 1).maybeSingle();
    if (data?.status) setLiveStatus(data.status);
  }, []);

  const loadOwnScores = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('jury_scores').select('*').eq('staff_id', user.id);
    const map: Record<string, JuryDraft> = {};
    (data || []).forEach((s: { project_id: string; presentation: number; composition: number; aesthetics: number; notes: string }) => {
      map[s.project_id] = { presentation: s.presentation, composition: s.composition, aesthetics: s.aesthetics, notes: s.notes };
    });
    setOwnScores(map);
  }, []);

  const loadStaff = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setAuthed(false); setMe(null); return false; }
    const { data: meData, error: meErr } = await supabase.rpc('get_my_staff');
    const self = (meData || null) as unknown as StaffRow | null;
    if (meErr || !self || !self.id) { setAuthed(false); setMe(null); return false; }
    setMe(self);
    setNewName(self.display_name || '');
    if (self.role === 'dev') {
      const { data: list } = await supabase.rpc('list_staff_for_dev');
      setStaffList((list || []) as unknown as StaffRow[]);
    } else if (self.role === 'admin') {
      const { data: list } = await supabase.rpc('list_team_for_admin');
      const rows = ((list || []) as Array<Record<string, string>>).map(r => ({
        id: r.id, email: r.email, display_name: r.display_name, role: 'jurado' as const, permissions: {}
      }));
      setStaffList(rows as StaffRow[]);
    } else {
      setStaffList([]);
    }
    setAuthed(true);
    return true;
  }, []);

  const loadBatches = useCallback(async () => {
    const { data } = await supabase.from('batches').select('*').order('created_at', { ascending: true });
    if (data) setBatches(data as BatchRow[]);
  }, []);

  const loadSettings = useCallback(async () => {
    const { data } = await supabase.from('site_settings').select('key,value');
    const map: Record<string, string> = {};
    (data || []).forEach((r: { key: string; value: unknown }) => {
      map[r.key] = typeof r.value === 'string' ? r.value : String(r.value ?? '');
    });
    setSettings(map);
    setSettingDrafts(map);
  }, []);

  const loadFaqs = useCallback(async () => {
    const { data } = await supabase.from('faq_items').select('*').order('sort_order', { ascending: true });
    if (data) setFaqs(data as FaqRow[]);
  }, []);

  const PAGE_SIZE = 25;

  const loadProjects = useCallback(async () => {
    let query = supabase
      .from('projects')
      .select('id, name, style, bio, instagram, video_link, photo_url, status, created_at, members(count), subscriptions(status, amount_paid, batches(name))', { count: 'exact' });
    if (searchQ.trim()) query = query.ilike('name', `%${searchQ.trim()}%`);
    if (statusFilter) query = query.eq('status', statusFilter);
    if (loteFilter) query = query.eq('subscriptions.batch_id', loteFilter);
    const { data, count } = await query
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    if (data) setProjects(data as unknown as ProjectRow[]);
    setTotalCount(count ?? 0);
  }, [searchQ, statusFilter, loteFilter, page]);

  const loadAudit = useCallback(async () => {
    const { data } = await supabase.rpc('list_audit', { p_limit: 150 });
    setAudit((data || []) as Array<Record<string, unknown>>);
  }, []);

  useEffect(() => {
    (async () => {
      const ok = await loadStaff();
      if (ok) {
        await Promise.all([loadBatches(), loadSettings(), loadFaqs(), loadProjects(), loadLive(), loadOwnScores()]);
      }
      setBooting(false);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((evt) => {
      if (evt === 'SIGNED_OUT') { setAuthed(false); setMe(null); setStaffList([]); }
    });
    return () => sub.subscription.unsubscribe();
  }, [loadStaff, loadBatches, loadSettings, loadFaqs, loadProjects, loadLive, loadOwnScores]);

  useEffect(() => {
    if (!authed || !canSubs) return;
    const t = setTimeout(() => { loadProjects(); }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, searchQ, statusFilter, loteFilter, page]);

  useEffect(() => {
    if (authed && tab === 'auditoria') loadAudit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, tab]);

  useEffect(() => {
    if (!authed) return;
    const recheck = () => { loadStaff(); };
    const iv = setInterval(recheck, 60000);
    window.addEventListener('focus', recheck);
    return () => { clearInterval(iv); window.removeEventListener('focus', recheck); };
  }, [authed, loadStaff]);

  useEffect(() => {
    if (!authed) return;
    const available: string[] = [];
    if (me?.role !== 'jurado') available.push('visao');
    if (canLotes) available.push('lotes');
    if (canContent) available.push('conteudo');
    if (canSubs) available.push('inscritos');
    if (isJudge) available.push('avaliacao');
    if (isDev) available.push('equipe');
    available.push('conta');
    setTab(t => (available.includes(t) ? t : available[0]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, me?.role, canLotes, canContent, canSubs, isJudge]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setLoginError('Credenciais inválidas.');
      setLoggingIn(false);
      return;
    }
    const ok = await loadStaff();
    if (!ok) {
      await supabase.auth.signOut();
      setLoginError('Credenciais inválidas ou sem acesso.');
      setLoggingIn(false);
      return;
    }
    await Promise.all([loadBatches(), loadSettings(), loadFaqs(), loadProjects(), loadLive(), loadOwnScores()]);
    setLoggingIn(false);
    setPassword('');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuthed(false);
    setMe(null);
    setStaffList([]);
  };

  const guarded = async (key: string, fn: () => Promise<'ok' | string>) => {
    setBusy(key);
    const res = await fn();
    setBusy(null);
    if (res !== 'ok') setMsg(key, 'err', res);
  };

  // ---------- lotes ----------
  const draftFor = (b: BatchRow) => ({
    name: batchDrafts[b.id]?.name ?? b.name,
    price: batchDrafts[b.id]?.price ?? Number(b.price_per_member),
    vagasTotal: batchDrafts[b.id]?.vagas_total ?? b.vagas_total,
    vagasRest: batchDrafts[b.id]?.vagas_restantes ?? b.vagas_restantes,
    starts: batchDrafts[b.id]?.starts_at ?? toInputValue(b.starts_at),
    ends: batchDrafts[b.id]?.ends_at ?? toInputValue(b.ends_at),
  });

  const saveBatch = (b: BatchRow) => guarded(`batch-${b.id}`, async () => {
    const d = draftFor(b);
    if (!d.name.trim()) return 'Informe o nome do lote.';
    const price = Number(d.price);
    if (isNaN(price) || price <= 0) return 'Preço inválido.';
    const vTotal = parseInt(String(d.vagasTotal), 10);
    const vRest = parseInt(String(d.vagasRest), 10);
    if (isNaN(vTotal) || vTotal < 0 || isNaN(vRest) || vRest < 0 || vRest > vTotal) return 'Vagas inválidas (restantes ≤ total).';

    const { data: res, error } = await supabase
      .rpc('staff_save_batch', {
        p_id: b.id, p_name: d.name.trim(), p_price: price,
        p_vagas_total: vTotal, p_vagas_restantes: vRest,
        p_starts_at: fromInputValue(d.starts), p_ends_at: fromInputValue(d.ends)
      });
    if (error) return 'Erro ao salvar: ' + error.message;
    if (res !== 'ok') return String(res);
    setBatchDrafts(p => { const c = { ...p }; delete c[b.id]; return c; });
    await loadBatches();
    setMsg(`batch-${b.id}`, 'ok', 'Lote salvo e publicado no site.');
    return 'ok';
  });

  const activateBatch = (b: BatchRow) => guarded(`activate-${b.id}`, async () => {
    const { error } = await supabase.rpc('set_active_lote', { target_id: b.id });
    if (error) return 'Não foi possível ativar: ' + error.message;
    await Promise.all([loadBatches(), loadSettings()]);
    setMsg(`activate-${b.id}`, 'ok', `Lote ativado. Os demais lótes foram ajustados automaticamente e a data do site foi sincronizada.`);
    return 'ok';
  });

  // ---------- conteúdo ----------
  const saveSetting = (key: string, label: string, kind: 'datetime' | 'text' = 'datetime') => guarded(`set-${key}`, async () => {
    const v = settingDrafts[key] ?? '';
    if (kind === 'text' && v.trim() && !/^https?:\/\//i.test(v.trim())) return 'Informe um link começando com http(s)://';
    const value = kind === 'datetime' ? (fromInputValue(v) ?? '') : v.trim();
    const { error } = await supabase.rpc('staff_save_setting', { p_key: key, p_value: value });
    if (error) return 'Erro ao salvar: ' + error.message;
    await loadSettings();
    setMsg(`set-${key}`, 'ok', `${label} atualizado no site.`);
    return 'ok';
  });

  const saveFaq = (item: FaqRow) => guarded(`faq-${item.id}`, async () => {
    if (!item.question.trim() || !item.answer.trim()) return 'Pergunta e resposta são obrigatórias.';
    const { data: res, error } = await supabase
      .rpc('staff_faq_upsert', { p_id: item.id, p_question: item.question, p_answer: item.answer, p_sort_order: item.sort_order, p_active: item.active });
    if (error) return 'Erro ao salvar: ' + error.message;
    if (!res) return 'Sem permissão para salvar.';
    setMsg(`faq-${item.id}`, 'ok', 'Pergunta atualizada no site.');
    return 'ok';
  });

  const deleteFaq = (item: FaqRow) => guarded(`faq-del-${item.id}`, async () => {
    const { error } = await supabase.rpc('staff_faq_delete', { p_id: item.id });
    if (error) return 'Erro ao remover.';
    await loadFaqs();
    setMsg('faq-list', 'ok', 'Pergunta removida do site.');
    return 'ok';
  });

  const addFaq = () => guarded('faq-add', async () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) return 'Preencha pergunta e resposta.';
    const maxOrder = faqs.reduce((m, f) => Math.max(m, f.sort_order), -1);
    const { error } = await supabase.rpc('staff_faq_upsert', {
      p_id: null, p_question: newFaq.question.trim(), p_answer: newFaq.answer.trim(), p_sort_order: maxOrder + 1, p_active: true
    });
    if (error) return 'Erro ao criar: ' + error.message;
    setNewFaq({ question: '', answer: '' });
    await loadFaqs();
    setMsg('faq-list', 'ok', 'Pergunta publicada no site.');
    return 'ok';
  });

  const moveFaq = (idx: number, dir: -1 | 1) => guarded('faq-move', async () => {
    const other = faqs[idx + dir];
    if (!other) return 'ok';
    const cur = faqs[idx];
    await supabase.rpc('staff_faq_upsert', { p_id: cur.id, p_question: cur.question, p_answer: cur.answer, p_sort_order: other.sort_order, p_active: cur.active });
    await supabase.rpc('staff_faq_upsert', { p_id: other.id, p_question: other.question, p_answer: other.answer, p_sort_order: cur.sort_order, p_active: other.active });
    await loadFaqs();
    return 'ok';
  });

  // ---------- inscrições ----------
  const confirmPayment = (p: ProjectRow) => guarded(`pay-${p.id}`, async () => {
    const { data: res, error } = await supabase.rpc('staff_confirm_payment', { p_id: p.id });
    if (error) return 'Erro ao confirmar: ' + error.message;
    if (res !== 'ok') return String(res);
    await Promise.all([loadProjects(), loadBatches()]);
    setMsg(`pay-${p.id}`, 'ok', 'Pagamento confirmado. Status já visível no portal do candidato.');
    return 'ok';
  });

  const setProjectState = (p: ProjectRow, status: string, msg: string) => guarded(`st-${p.id}`, async () => {
    const { data: res, error } = await supabase.rpc('staff_set_project_state', { p_id: p.id, p_status: status });
    if (error) return 'Erro: ' + error.message;
    if (res !== 'ok') return String(res);
    await loadProjects();
    if (detailId === p.id) await openDetail(p.id);
    setMsg(`st-${p.id}`, 'ok', msg);
    return 'ok';
  });

  const openDetail = async (id: string) => {
    setDetailId(id);
    setDetail(null);
    const { data: prof, error } = await supabase.rpc('get_project_profile', { p_id: id });
    if (error || !prof) { setDetail({ proj: null, members: [], sub: null, subsTotal: 0, scores: [] }); return; }
    setDetail({
      proj: (prof.project || null) as Record<string, unknown> | null,
      members: (prof.members || []) as unknown as MemberFull[],
      sub: (prof.subscription || null) as Record<string, unknown> | null,
      subsTotal: prof.subscriptions_total ?? 0,
      scores: (prof.scores || []) as ScoreView[]
    });
  };

  // ---------- avaliação ----------
  const draftScore = (pid: string): JuryDraft =>
    juryDraft[pid] ?? ownScores[pid] ?? { presentation: 0, composition: 0, aesthetics: 0, notes: '' };

  const setScoreDraft = (pid: string, patch: Partial<JuryDraft>) =>
    setJuryDraft(p => ({ ...p, [pid]: { ...draftScore(pid), ...patch } }));

  const saveScore = (pid: string) => guarded(`score-${pid}`, async () => {
    if (!me) return 'Sessão expirada.';
    const d = draftScore(pid);
    const clamp = (n: number) => Math.max(0, Math.min(10, Math.round(Number(n) || 0)));
    const { error } = await supabase
      .from('jury_scores')
      .upsert(
        { project_id: pid, staff_id: me.id, presentation: clamp(d.presentation), composition: clamp(d.composition), aesthetics: clamp(d.aesthetics), notes: d.notes },
        { onConflict: 'project_id,staff_id' }
      );
    if (error) return 'Erro ao salvar nota: ' + error.message;
    await loadOwnScores();
    setMsg(`score-${pid}`, 'ok', 'Nota registrada.');
    return 'ok';
  });

  // ---------- live ----------
  const setLivePhase = (phase: 'ao_vivo' | 'encerrada' | 'em_breve') => guarded('live-phase', async () => {
    const { error } = await supabase.rpc('set_live_phase', { phase });
    if (error) return 'Não foi possível: ' + error.message;
    await Promise.all([loadLive(), loadBatches()]);
    setMsg('live-phase', 'ok', phase === 'ao_vivo' ? 'Live no ar. Lotes ativos foram pausados automaticamente.' : 'Fase da live atualizada.');
    return 'ok';
  });

  // ---------- equipe ----------
  const friendlyStaffError = (m: string): string => {
    if (m.includes('SENHA_CURTA')) return 'A senha inicial precisa ter no mínimo 8 caracteres.';
    if (m.includes('EMAIL_INVALIDO')) return 'E-mail inválido.';
    if (m.includes('EMAIL_EM_USO')) return 'Já existe um acesso com este e-mail.';
    if (m.includes('NIVEL_INVALIDO')) return 'Nível de acesso inválido.';
    if (m.includes('SEM_PERMISSAO')) return 'Operação não permitida.';
    return 'Erro: ' + m;
  };

  const saveStaff = (s: StaffRow) => guarded(`staff-${s.id}`, async () => {
    const args: Record<string, unknown> = { p_id: s.id, p_display_name: s.display_name?.trim() || '' };
    if (isDev) { args.p_role = s.role; args.p_permissions = s.permissions; }
    const { error } = await supabase.rpc('update_staff_member', args);
    if (error) return friendlyStaffError(error.message);
    await loadStaff();
    setMsg(`staff-${s.id}`, 'ok', 'Membro atualizado. O painel dele já reflete as mudanças no próximo acesso.');
    return 'ok';
  });

  const createMember = () => guarded('invite', async () => {
    const args: Record<string, unknown> = {
      p_email: invite.email.trim(), p_name: invite.name.trim(), p_password: invite.password
    };
    if (isDev) args.p_role = invite.role;
    const { error } = await supabase.rpc('create_staff_member', args);
    if (error) return friendlyStaffError(error.message);
    await loadStaff();
    setInvite({ email: '', name: '', password: '', role: 'jurado' });
    setMsg('invite', 'ok', 'Acesso criado. Envie o e-mail e a senha inicial à pessoa — ela deve trocar a senha em Minha conta.');
    return 'ok';
  });

  const openAuditTab = () => { loadAudit(); };

  // ---------- conta ----------
  const saveOwnName = () => guarded('acc-name', async () => {
    if (!newName.trim()) return 'Informe o nome de exibição.';
    const { error } = await supabase.rpc('update_own_staff_name', { new_name: newName.trim() });
    if (error) return 'Erro ao salvar: ' + error.message;
    await loadStaff();
    setMsg('acc-name', 'ok', 'Nome atualizado.');
    return 'ok';
  });

  const savePassword = () => guarded('acc-pw', async () => {
    if (pw1.length < 8) return 'A nova senha precisa ter no mínimo 8 caracteres.';
    if (pw1 !== pw2) return 'As senhas não coincidem.';
    const { error } = await supabase.auth.updateUser({ password: pw1 });
    if (error) return 'Erro ao alterar senha: ' + error.message;
    setPw1(''); setPw2('');
    setMsg('acc-pw', 'ok', 'Senha alterada com sucesso.');
    return 'ok';
  });

  // ================= RENDER =================
  return (
    <div className="min-h-screen bg-[#05070B] text-[#F0EAE0] relative overflow-x-hidden">
      <div className="absolute -right-32 -top-32 w-80 h-80 bg-[#E3B552]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -left-32 -bottom-32 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {booting ? (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 text-[#F0C265] animate-spin" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-gray-400">Verificando sessão segura...</span>
        </div>
      ) : !authed ? (
        <div className="min-h-screen flex items-center justify-center px-6 py-16">
          <div className="glass-card-2 fade-up-800 max-w-sm w-full p-8 rounded-[32px] space-y-6 text-center">
            <div className="space-y-2 border-b border-white/5 pb-5">
              <Shield className="w-10 h-10 text-[#F0C265] mx-auto" />
              <h1 className="font-display font-black text-xl text-[#F0C265] tracking-wider uppercase">Área Restrita</h1>
              <p className="text-xs text-gray-400">Acesso exclusivo da equipe do estúdio.</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4 text-left">
              <Field label="E-mail">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@pedraprofana.com" className={inputCls} required autoComplete="username" />
              </Field>
              <Field label="Senha">
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••" className={inputCls} required autoComplete="current-password" />
              </Field>
              {loginError && <Notice kind="err">{loginError}</Notice>}
              <button type="submit" disabled={loggingIn} className={`${btnGold} w-full py-3`}>
                {loggingIn ? 'Autenticando...' : 'Entrar'}
              </button>
            </form>
            <Link href="/" className="inline-block text-[10px] font-mono text-gray-500 hover:text-white uppercase tracking-widest">← Voltar ao site</Link>
          </div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 relative z-10">
          {/* header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-gradient-to-b from-[#FFF2D4] via-[#F0C265] to-[#B88A28] flex items-center justify-center font-display font-black text-black text-xl border border-black shadow-md">P</div>
              <div>
                <span className="font-display font-black text-white text-md tracking-tight uppercase block leading-none">CENTRAL PEDRA PROFANA</span>
                <span className="font-mono text-[9px] text-[#F0C265] tracking-widest block uppercase mt-1">{me?.display_name || me?.email}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/v2" className="text-[10px] font-mono text-gray-400 hover:text-white uppercase tracking-widest">Ver site</Link>
              <button onClick={handleLogout} className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-gray-400 hover:text-red-400 uppercase tracking-widest transition-colors">
                <LogOut className="w-3.5 h-3.5" /> Sair
              </button>
            </div>
          </div>

          {/* tabs */}
          <div className="flex gap-1.5 overflow-x-auto py-4 scrollbar-thin">
            {[
              { id: 'visao', label: 'Visão geral', icon: LayoutDashboard, show: !!me && me.role !== 'jurado' },
              { id: 'lotes', label: 'Lotes & Live', icon: Tags, show: canLotes },
              { id: 'conteudo', label: 'Conteúdo do site', icon: FileText, show: canContent },
              { id: 'inscritos', label: 'Inscrições', icon: ClipboardList, show: canSubs },
              { id: 'avaliacao', label: 'Avaliação', icon: Star, show: isJudge },
              { id: 'equipe', label: 'Equipe', icon: Users, show: isDev || isAdminRole },
              { id: 'auditoria', label: 'Auditoria', icon: History, show: isDev || isAdminRole },
              { id: 'conta', label: 'Minha conta', icon: UserCog, show: true },
            ].filter(t => t.show).map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider rounded-xl whitespace-nowrap transition-colors ${
                  tab === t.id ? 'bg-[#F0C265] text-black' : 'text-gray-400 hover:text-white bg-white/5 border border-white/5'
                }`}
              >
                <t.icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            ))}
          </div>

          {/* VISÃO GERAL */}
          {tab === 'visao' && (
            <div className="space-y-4 fade-up-800">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Lote vigente', value: (batches.find(b => b.status === 'ativo')?.name || '—'), accent: 'text-[#10B981]' },
                  { label: 'Vagas restantes', value: String(batches.find(b => b.status === 'ativo')?.vagas_restantes ?? '—'), accent: 'text-white' },
                  { label: 'Inscrições', value: String(projects.length), accent: 'text-[#F0C265]' },
                  { label: 'Pagas', value: String(projects.filter(p => p.status === 'paid').length), accent: 'text-[#10B981]' },
                ].map(s => (
                  <div key={s.label} className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-1.5">
                    <span className="font-mono text-[9px] text-gray-400 uppercase tracking-widest block">{s.label}</span>
                    <span className={`font-display font-black text-2xl block ${s.accent}`}>{s.value}</span>
                  </div>
                ))}
              </div>
              <div className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-2">
                <span className="font-mono text-[9px] text-gray-400 uppercase tracking-widest block">Datas vigentes no site</span>
                <p className="text-xs text-gray-300 font-mono">Lote ativo termina: <strong className="text-white">{fmtDate(batches.find(b => b.status === 'ativo')?.ends_at)}</strong></p>
                <p className="text-xs text-gray-300 font-mono">Lançamento da live: <strong className="text-white">{fmtDate(settings.live_launch)}</strong></p>
              </div>
              {!canLotes && !canContent && !canSubs && (
                <Notice kind="info">Sua conta não possui funções ativas neste painel. Fale com quem gerencia o acesso para liberar funções.</Notice>
              )}
            </div>
          )}

          {/* LOTES */}
          {tab === 'lotes' && (
            <div className="space-y-5 fade-up-800">
              <div className="bg-[#0B0F19]/60 backdrop-blur-xl border-2 border-[#E3B552]/40 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-display font-bold text-white uppercase">🔴 Live — Dia 0</h3>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase border ${
                      liveStatus === 'ao_vivo' ? 'bg-red-500/15 text-red-400 border-red-500/30 animate-pulse'
                      : liveStatus === 'encerrada' ? 'bg-[#121215] text-gray-500 border-white/5'
                      : 'bg-[#121215] text-gray-400 border-white/5'}`}>
                      {liveStatus}
                    </span>
                  </div>
                  <span className="font-mono text-[9px] text-gray-400 uppercase">Lançamento: {fmtDate(settings.live_launch)}</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Colocar a live no ar pausa automaticamente qualquer lote ativo (o Dia 0 passa a valer). Ativar um lote depois encerra a transmissão.
                </p>
                <div className="flex flex-wrap gap-2.5">
                  <button type="button" onClick={() => setLivePhase('ao_vivo')} disabled={busy === 'live-phase' || liveStatus === 'ao_vivo'} className={btnGold}>
                    {busy === 'live-phase' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Ativar ao vivo'}
                  </button>
                  <button type="button" onClick={() => setLivePhase('encerrada')} disabled={busy === 'live-phase' || liveStatus === 'encerrada'} className={btnGhost}>Encerrar transmissão</button>
                  <button type="button" onClick={() => setLivePhase('em_breve')} disabled={busy === 'live-phase' || liveStatus === 'em_breve'} className={btnGhost}>Voltar para em breve</button>
                </div>
                {notice['live-phase'] && <Notice kind={notice['live-phase'].kind}>{notice['live-phase'].msg}</Notice>}
              </div>

              <Notice kind="info">Ativar um lote ajusta os demais automaticamente (anteriores ficam encerrados, seguintes em breve), encerra a live se estiver no ar e sincroniza a data exibida no site.</Notice>
              {batches.map(b => {
                const d = draftFor(b);
                const k = `batch-${b.id}`;
                return (
                  <div key={b.id} className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2.5">
                        <h3 className="font-display font-bold text-white uppercase">{b.name}</h3>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase border ${
                          b.status === 'ativo' ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                          : b.status === 'encerrado' ? 'bg-[#121215] text-gray-500 border-white/5'
                          : 'bg-[#121215] text-gray-400 border-white/5'}`}>
                          {b.status}
                        </span>
                      </div>
                      {b.status !== 'ativo' && (
                        <button type="button" onClick={() => activateBatch(b)} disabled={busy === `activate-${b.id}`} className={btnGold}>
                          {busy === `activate-${b.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Ativar este lote'}
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <Field label="Nome"><input className={inputCls} value={d.name} onChange={(e) => setBatchDrafts(p => ({ ...p, [b.id]: { ...p[b.id], name: e.target.value } }))} /></Field>
                      <Field label="Preço por integrante (R$)"><input type="number" min={1} step="0.01" className={inputCls} value={d.price} onChange={(e) => setBatchDrafts(p => ({ ...p, [b.id]: { ...p[b.id], price: e.target.value } }))} /></Field>
                      <div className="grid grid-cols-2 gap-2">
                        <Field label="Vagas total"><input type="number" min={0} className={inputCls} value={d.vagasTotal} onChange={(e) => setBatchDrafts(p => ({ ...p, [b.id]: { ...p[b.id], vagas_total: e.target.value } }))} /></Field>
                        <Field label="Restantes"><input type="number" min={0} className={inputCls} value={d.vagasRest} onChange={(e) => setBatchDrafts(p => ({ ...p, [b.id]: { ...p[b.id], vagas_restantes: e.target.value } }))} /></Field>
                      </div>
                      <Field label={`Início em (${TZ.split('/')[1]})`}><input type="datetime-local" className={inputCls} value={d.starts} onChange={(e) => setBatchDrafts(p => ({ ...p, [b.id]: { ...p[b.id], starts_at: e.target.value } }))} /></Field>
                      <Field label={`Termina em (${TZ.split('/')[1]})`}><input type="datetime-local" className={inputCls} value={d.ends} onChange={(e) => setBatchDrafts(p => ({ ...p, [b.id]: { ...p[b.id], ends_at: e.target.value } }))} /></Field>
                      <div className="flex items-end">
                        <button type="button" onClick={() => saveBatch(b)} disabled={busy === k} className={`${btnGold} w-full`}>
                          {busy === k ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Salvar lote'}
                        </button>
                      </div>
                    </div>
                    {notice[k] && <Notice kind={notice[k].kind}>{notice[k].msg}</Notice>}
                    {notice[`activate-${b.id}`] && <Notice kind={notice[`activate-${b.id}`].kind}>{notice[`activate-${b.id}`].msg}</Notice>}
                  </div>
                );
              })}
            </div>
          )}

          {/* CONTEÚDO */}
          {tab === 'conteudo' && (
            <div className="space-y-5 fade-up-800">
              <div className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4">
                <h3 className="font-display font-bold text-white uppercase border-b border-white/5 pb-3">Datas do site</h3>
                {[
                  { key: 'countdown_target', label: 'Fim do lote vigente (contagem regressiva)', kind: 'datetime' as const, current: fmtDate(settings['countdown_target']) },
                  { key: 'live_launch', label: 'Lançamento oficial da live', kind: 'datetime' as const, current: fmtDate(settings['live_launch']) },
                  { key: 'live_url', label: 'Link da transmissão ao vivo (YouTube)', kind: 'text' as const, current: settings['live_url'] || 'não definido' },
                ].map(s => (
                  <div key={s.key} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
                    <Field label={`${s.label} — atual: ${s.current}`}>
                      {s.kind === 'datetime'
                        ? <input type="datetime-local" className={inputCls} value={settingDrafts[s.key] ?? ''} onChange={(e) => setSettingDrafts(p => ({ ...p, [s.key]: e.target.value }))} />
                        : <input type="url" placeholder="https://youtube.com/live/..." className={inputCls} value={settingDrafts[s.key] ?? ''} onChange={(e) => setSettingDrafts(p => ({ ...p, [s.key]: e.target.value }))} />}
                    </Field>
                    <button type="button" onClick={() => saveSetting(s.key, s.label, s.kind)} disabled={busy === `set-${s.key}`} className={btnGold}>
                      {busy === `set-${s.key}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Salvar'}
                    </button>
                    <div className="md:col-span-2">{notice[`set-${s.key}`] && <Notice kind={notice[`set-${s.key}`].kind}>{notice[`set-${s.key}`].msg}</Notice>}</div>
                  </div>
                ))}
              </div>

              <div className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4">
                <h3 className="font-display font-bold text-white uppercase border-b border-white/5 pb-3">FAQ — perguntas frequentes</h3>
                {notice['faq-list'] && <Notice kind={notice['faq-list'].kind}>{notice['faq-list'].msg}</Notice>}

                <div className="space-y-3">
                  {faqs.map((f, idx) => (
                    <div key={f.id} className="bg-black/40 border border-white/5 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest">#{idx + 1} {f.active ? '' : '· oculta no site'}</span>
                        <div className="flex items-center gap-1">
                          <button type="button" disabled={idx === 0 || busy === 'faq-move'} onClick={() => moveFaq(idx, -1)} className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
                          <button type="button" disabled={idx === faqs.length - 1 || busy === 'faq-move'} onClick={() => moveFaq(idx, 1)} className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
                          <button type="button" onClick={() => { const u = { ...f, active: !f.active }; setFaqs(list => list.map(x => x.id === f.id ? u : x)); saveFaq(u); }} className={`font-mono text-[9px] font-bold px-2 py-1 rounded uppercase border ${f.active ? 'text-[#10B981] border-[#10B981]/30 bg-[#10B981]/10' : 'text-gray-400 border-white/10 bg-white/5'}`}>
                            {f.active ? 'visível' : 'oculta'}
                          </button>
                          <DeleteFaqButton onDelete={() => deleteFaq(f)} />
                        </div>
                      </div>
                      <input className={inputCls} value={f.question} onChange={(e) => setFaqs(list => list.map(x => x.id === f.id ? { ...x, question: e.target.value } : x))} placeholder="Pergunta" />
                      <textarea className={`${inputCls} resize-none`} rows={3} value={f.answer} onChange={(e) => setFaqs(list => list.map(x => x.id === f.id ? { ...x, answer: e.target.value } : x))} placeholder="Resposta" />
                      <div className="flex justify-end items-center gap-3">
                        {notice[`faq-${f.id}`] && <Notice kind={notice[`faq-${f.id}`].kind}>{notice[`faq-${f.id}`].msg}</Notice>}
                        <button type="button" onClick={() => saveFaq(f)} disabled={busy === `faq-${f.id}`} className={btnGold}>
                          {busy === `faq-${f.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Salvar pergunta'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-black/40 border border-dashed border-[#E3B552]/30 rounded-xl p-4 space-y-3">
                  <span className="font-mono text-[9px] text-[#F0C265] uppercase tracking-widest font-bold">Nova pergunta</span>
                  <input className={inputCls} value={newFaq.question} onChange={(e) => setNewFaq(p => ({ ...p, question: e.target.value }))} placeholder="Pergunta" />
                  <textarea className={`${inputCls} resize-none`} rows={2} value={newFaq.answer} onChange={(e) => setNewFaq(p => ({ ...p, answer: e.target.value }))} placeholder="Resposta" />
                  <div className="flex justify-end items-center gap-3">
                    {notice['faq-add'] && <Notice kind={notice['faq-add'].kind}>{notice['faq-add'].msg}</Notice>}
                    <button type="button" onClick={addFaq} disabled={busy === 'faq-add'} className={`${btnGold} flex items-center gap-1.5`}>
                      {busy === 'faq-add' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Plus className="w-3.5 h-3.5" /> Publicar pergunta</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* INSCRIÇÕES */}
          {tab === 'inscritos' && (
            <div className="space-y-4 fade-up-800">
              {detailId ? (() => {
                const p = projects.find(x => x.id === detailId);
                if (!p) return <Notice kind="err">Inscrição não encontrada.</Notice>;
                const st = PROJECT_STATUS[p.status] || { label: p.status, cls: 'bg-white/5 text-gray-400 border-white/10' };
                const sub = detail?.sub as { amount_paid?: number; status?: string; batch_name?: string; charge_id?: string; paid_at?: string | null } | null | undefined;
                const proj = (detail?.proj || {}) as Record<string, string | null>;
                return (
                  <div className="space-y-4">
                    <button type="button" onClick={() => { setDetailId(null); setDetail(null); }} className={btnGhost}>← Voltar para a lista</button>

                    <div className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-5">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-4">
                        <div>
                          <h3 className="font-display font-black text-xl text-white uppercase leading-tight">{p.name}</h3>
                          <span className="font-mono text-[10px] text-gray-400 uppercase block mt-1">{p.style || '—'} • cadastrada em {fmtDate(p.created_at)}</span>
                        </div>
                        <span className={`text-[9px] font-bold px-2.5 py-1 rounded font-mono uppercase border shrink-0 ${st.cls}`}>{st.label}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2 space-y-1">
                          <span className="font-mono text-[8px] text-gray-400 uppercase font-bold block">BIOGRAFIA OFICIAL:</span>
                          <p className="text-xs text-gray-200 leading-relaxed">{proj.bio || '—'}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="font-mono text-[8px] text-gray-400 uppercase font-bold block">INSTAGRAM:</span>
                          {proj.instagram
                            ? <a href={`https://instagram.com/${String(proj.instagram).replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-[#F0C265] font-bold text-xs font-mono hover:underline break-all">{String(proj.instagram)}</a>
                            : <span className="text-xs text-gray-500 font-mono">—</span>}
                        </div>
                        <div className="space-y-1">
                          <span className="font-mono text-[8px] text-gray-400 uppercase font-bold block">LINK DA MÚSICA / VÍDEO:</span>
                          {proj.video_link
                            ? <a href={String(proj.video_link)} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-xs font-mono break-all">{String(proj.video_link)}</a>
                            : <span className="text-xs text-gray-500 font-mono">—</span>}
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <span className="font-mono text-[8px] text-gray-400 uppercase font-bold block">FOTO DE DIVULGAÇÃO ENVIADA:</span>
                          <span className="text-xs font-mono text-gray-300 block">{proj.photo_url ? `✓ ${proj.photo_url}` : '—'}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <span className="font-mono text-[9px] text-[#F0C265] font-bold uppercase tracking-widest block">Integrantes ({detail?.members.length ?? 0})</span>
                        <div className="space-y-2">
                          {(detail?.members || []).map((m, i) => (
                            <div key={i} className={`p-3 rounded-xl border ${m.is_responsible ? 'border-[#F0C265]/20 bg-[#F0C265]/5' : 'border-white/5 bg-black/30'}`}>
                              <div className="flex justify-between items-center gap-2">
                                <span className="text-xs font-bold text-white">{m.name} {m.is_responsible && <span className="font-mono text-[8px] text-[#F0C265] uppercase">(líder responsável)</span>}</span>
                                <span className="font-mono text-[9px] text-gray-500">#{i + 1}</span>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 font-mono text-[10px] text-gray-300">
                                <span>CPF: {m.cpf || '—'}</span>
                                <span>Nasc.: {m.birth_date || '—'}</span>
                                <span>WhatsApp: {m.phone || '—'}</span>
                                <span>E-mail: {(m as any).email || '—'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2 bg-black/40 border border-white/5 rounded-xl p-4">
                        <span className="font-mono text-[9px] text-[#F0C265] font-bold uppercase tracking-widest block">Recibo da cobrança{detail && detail.subsTotal > 1 ? ` (mais recente de ${detail.subsTotal})` : ''}</span>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-[10px] text-gray-300">
                          <span>Valor: <strong className="text-[#10B981]">{sub?.amount_paid != null ? `R$ ${sub.amount_paid},00` : '—'}</strong></span>
                          <span>Lote: {sub?.batch_name || '—'}</span>
                          <span>Cobrança: {sub?.status || '—'}</span>
                          <span>ID: {sub?.charge_id ? String(sub.charge_id).slice(0, 18) : '—'}</span>
                          <span className="md:col-span-2">Pago em: {fmtDate(sub?.paid_at ?? null)}</span>
                        </div>
                      </div>

                      {(detail?.scores?.length ?? 0) > 0 && (
                        <div className="space-y-2 bg-black/40 border border-white/5 rounded-xl p-4">
                          <span className="font-mono text-[9px] text-[#F0C265] font-bold uppercase tracking-widest block">Notas do júri</span>
                          {detail!.scores.map((sc, i) => (
                            <div key={i} className="flex flex-wrap justify-between gap-2 font-mono text-[10px] text-gray-300 border-b border-white/5 pb-1.5 last:border-none">
                              <span className="text-white font-bold">{sc.juror}</span>
                              <span>Apres. {sc.presentation} • Compos. {sc.composition} • Estét. {sc.aesthetics} • Média <strong className="text-[#F0C265]">{((sc.presentation + sc.composition + sc.aesthetics) / 3).toFixed(1)}</strong></span>
                              {sc.notes && <span className="w-full text-gray-500">“{sc.notes}”</span>}
                            </div>
                          ))}
                        </div>
                      )}

                      {canSubs && (
                        <div className="border-t border-white/5 pt-4 space-y-2">
                          <span className="font-mono text-[9px] text-gray-400 uppercase tracking-widest block font-bold">Ações sobre esta inscrição</span>
                          <div className="flex flex-wrap gap-2.5">
                            {(p.status === 'pending' || p.status === 'failed') && (
                              <button type="button" onClick={() => confirmPayment(p)} disabled={busy === `pay-${p.id}`} className="bg-[#10B981] text-black font-mono text-[9px] font-bold px-3 py-2 rounded uppercase disabled:opacity-50">
                                {busy === `pay-${p.id}` ? '...' : 'Confirmar pagamento'}
                              </button>
                            )}
                            {p.status === 'paid' && (
                              <button type="button" onClick={() => setProjectState(p, 'suspended', 'Inscrição suspensa.')} disabled={busy === `st-${p.id}`} className="bg-orange-500 text-black font-mono text-[9px] font-bold px-3 py-2 rounded uppercase disabled:opacity-50">Suspender</button>
                            )}
                            {p.status !== 'blocked' && (
                              <button type="button" onClick={() => setProjectState(p, 'blocked', 'Inscrição bloqueada.')} disabled={busy === `st-${p.id}`} className="bg-red-600 text-white font-mono text-[9px] font-bold px-3 py-2 rounded uppercase disabled:opacity-50">Bloquear</button>
                            )}
                            {p.status === 'paid' && (
                              <button type="button" onClick={() => setProjectState(p, 'refunded', 'Inscrição marcada como reembolsada.')} disabled={busy === `st-${p.id}`} className="bg-white/10 text-gray-300 font-mono text-[9px] font-bold px-3 py-2 rounded uppercase border border-white/10 disabled:opacity-50">Marcar reembolsada</button>
                            )}
                            {(p.status === 'suspended' || p.status === 'blocked' || p.status === 'refunded') && (
                              <button type="button" onClick={() => setProjectState(p, 'paid', 'Inscrição reativada como paga.')} disabled={busy === `st-${p.id}`} className="bg-[#10B981] text-black font-mono text-[9px] font-bold px-3 py-2 rounded uppercase disabled:opacity-50">Reativar (paga)</button>
                            )}
                          </div>
                          {notice[`st-${p.id}`] && <Notice kind={notice[`st-${p.id}`].kind}>{notice[`st-${p.id}`].msg}</Notice>}
                          <p className="text-[10px] text-gray-500 font-mono leading-relaxed">Estas ações alteram apenas o estado da inscrição — os dados cadastrados pela banda permanecem intactos para análise da gerência.</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })() : (
                <div className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4">
                  <h3 className="font-display font-bold text-white uppercase border-b border-white/5 pb-3">Inscrições ({totalCount})</h3>

                  <div className="grid grid-cols-1 md:grid-cols-[1fr_150px_150px] gap-3">
                    <input className={inputCls} placeholder="Buscar por nome da banda..." value={searchQ} onChange={(e) => { setSearchQ(e.target.value); setPage(0); }} />
                    <select className={inputCls} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
                      <option value="">Todos os estados</option>
                      <option value="pending">Pendentes</option>
                      <option value="paid">Pagas</option>
                      <option value="suspended">Suspensas</option>
                      <option value="blocked">Bloqueadas</option>
                      <option value="refunded">Reembolsadas</option>
                      <option value="failed">Negadas</option>
                    </select>
                    <select className={inputCls} value={loteFilter} onChange={(e) => { setLoteFilter(e.target.value); setPage(0); }}>
                      <option value="">Todos os lotes</option>
                      {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>

                  {(searchQ || statusFilter || loteFilter) && (
                    <button type="button" onClick={() => { setSearchQ(''); setStatusFilter(''); setLoteFilter(''); setPage(0); }} className="font-mono text-[9px] text-[#F0C265] hover:underline uppercase font-bold">
                      Limpar filtros
                    </button>
                  )}

                  {projects.length === 0 && <p className="text-xs text-gray-400 font-mono">Nenhuma inscrição encontrada.</p>}
                  <div className="space-y-3">
                    {projects.map(p => {
                      const sub = p.subscriptions?.[0];
                      const count = p.members?.[0]?.count ?? 0;
                      const st = PROJECT_STATUS[p.status] || { label: p.status, cls: 'bg-white/5 text-gray-400 border-white/10' };
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => openDetail(p.id)}
                          className="w-full text-left bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:border-[#E3B552]/30 transition-colors"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <span className="text-sm font-bold text-white block truncate">{p.name}</span>
                            <span className="font-mono text-[10px] text-gray-400 uppercase block">
                              {p.style || '—'} • {count} integrante{count === 1 ? '' : 's'} • {fmtDate(p.created_at)} {sub?.batches?.name ? `• ${sub.batches.name}` : ''} {sub?.amount_paid ? `• R$ ${sub.amount_paid},00` : ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5 shrink-0">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase border ${st.cls}`}>{st.label}</span>
                            <span className="flex items-center gap-1 font-mono text-[9px] font-bold text-[#F0C265] uppercase"><Eye className="w-3 h-3" /> Ficha</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {totalCount > PAGE_SIZE && (
                    <div className="flex justify-between items-center border-t border-white/5 pt-4">
                      <button type="button" disabled={page === 0 || busy !== null} onClick={() => setPage(p => Math.max(0, p - 1))} className={btnGhost}>← Anterior</button>
                      <span className="font-mono text-[10px] text-gray-400 uppercase">Página {page + 1} de {Math.ceil(totalCount / PAGE_SIZE)}</span>
                      <button type="button" disabled={(page + 1) * PAGE_SIZE >= totalCount || busy !== null} onClick={() => setPage(p => p + 1)} className={btnGhost}>Próxima →</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* AVALIAÇÃO */}
          {tab === 'avaliacao' && isJudge && (() => {
            const paidProjects = projects.filter(p => p.status === 'paid');
            const q = jurySearch.trim().toLowerCase();
            const juryList = q ? paidProjects.filter(p => p.name.toLowerCase().includes(q)) : paidProjects;
            return (
            <div className="space-y-4 fade-up-800">
              <Notice kind="info">Somente inscrições com pagamento confirmado entram na avaliação. Abra uma banda para ver a ficha artística e registrar as notas (0 a 10) — sua nota pode ser ajustada a qualquer momento.</Notice>
              <input className={inputCls + ' max-w-md'} placeholder="Buscar banda paga..." value={jurySearch} onChange={(e) => setJurySearch(e.target.value)} />
              {juryList.length === 0 && (
                <div className="bg-[#0B0F19]/60 border border-white/10 rounded-2xl p-5">
                  <p className="text-xs text-gray-400 font-mono">{paidProjects.length === 0 ? 'Nenhuma banda paga disponível para avaliação no momento.' : 'Nenhuma banda encontrada para esta busca.'}</p>
                </div>
              )}
              <div className="space-y-3">
                {juryList.map(p => {
                  const d = draftScore(p.id);
                  const avg = (Math.round((((Number(d.presentation) || 0) + (Number(d.composition) || 0) + (Number(d.aesthetics) || 0)) / 3) * 10) / 10).toFixed(1);
                  return (
                    <div key={p.id} className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4">
                      <button type="button" onClick={() => setOpenJury(o => (o === p.id ? null : p.id))} className="w-full flex justify-between items-center gap-3 text-left">
                        <div>
                          <span className="text-sm font-bold text-white block">{p.name}</span>
                          <span className="font-mono text-[10px] text-gray-400 uppercase block">{p.style || '—'} • {p.members?.[0]?.count ?? 0} integrante{(p.members?.[0]?.count ?? 0) === 1 ? '' : 's'}</span>
                        </div>
                        <span className="font-mono text-lg text-[#F0C265] font-black shrink-0">{avg}</span>
                      </button>

                      {openJury === p.id && (
                        <div className="space-y-4 border-t border-white/5 pt-4">
                          <div className="space-y-2">
                            <span className="font-mono text-[9px] text-gray-400 uppercase tracking-widest block font-bold">Ficha artística</span>
                            <p className="text-xs text-gray-200 leading-relaxed">{p.bio || 'Sem biografia cadastrada.'}</p>
                            <div className="flex flex-wrap gap-3 font-mono text-[10px]">
                              {p.instagram && <a href={`https://instagram.com/${String(p.instagram).replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-[#F0C265] hover:underline">{String(p.instagram)}</a>}
                              {p.video_link && <a href={String(p.video_link)} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">ouvir/ver música ↗</a>}
                              <span className="text-gray-500">foto: {p.photo_url ? 'enviada ✓' : '—'}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <Field label="Apresentação"><input type="number" min={0} max={10} className={inputCls} value={d.presentation} onChange={(e) => setScoreDraft(p.id, { presentation: e.target.value === '' ? 0 : Number(e.target.value) })} /></Field>
                            <Field label="Composição"><input type="number" min={0} max={10} className={inputCls} value={d.composition} onChange={(e) => setScoreDraft(p.id, { composition: e.target.value === '' ? 0 : Number(e.target.value) })} /></Field>
                            <Field label="Estética"><input type="number" min={0} max={10} className={inputCls} value={d.aesthetics} onChange={(e) => setScoreDraft(p.id, { aesthetics: e.target.value === '' ? 0 : Number(e.target.value) })} /></Field>
                          </div>
                          <Field label="Observações (opcional)">
                            <textarea className={`${inputCls} resize-none`} rows={2} value={d.notes} onChange={(e) => setScoreDraft(p.id, { notes: e.target.value })} placeholder="Anotações da avaliação ao vivo" />
                          </Field>

                          <div className="flex justify-end items-center gap-3">
                            {notice[`score-${p.id}`] && <Notice kind={notice[`score-${p.id}`].kind}>{notice[`score-${p.id}`].msg}</Notice>}
                            <button type="button" onClick={() => saveScore(p.id)} disabled={busy === `score-${p.id}`} className={btnGold}>
                              {busy === `score-${p.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Registrar nota'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            );
          })()}

          {/* EQUIPE */}
          {tab === 'equipe' && (isDev || isAdminRole) && (
            <div className="space-y-4 fade-up-800">
              <Notice kind="info">Crie acessos da equipe e ajuste os nomes de exibição. A senha inicial é definida aqui — a pessoa deve trocá-la em Minha conta após o primeiro acesso.</Notice>

              {isDev ? staffList.map(s => {
                const self = s.id === me?.id;
                const k = `staff-${s.id}`;
                const cur = staffList.find(x => x.id === s.id) || s;
                const upd = (patch: Partial<StaffRow>) => setStaffList(list => list.map(x => x.id === s.id ? { ...x, ...patch } : x));
                return (
                  <div key={s.id} className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                      <div>
                        <h3 className="font-display font-bold text-white">{cur.display_name || cur.email}</h3>
                        <span className="font-mono text-[9px] text-gray-500 block">{cur.email}{self ? ' • você' : ''}</span>
                      </div>
                      <span className={`font-mono text-[9px] font-bold px-2.5 py-1 rounded-full uppercase border ${cur.role === 'dev' ? 'text-[#F0C265] border-[#F0C265]/40 bg-[#F0C265]/10' : cur.role === 'jurado' ? 'text-blue-300 border-blue-400/30 bg-blue-400/10' : 'text-gray-400 border-white/10 bg-white/5'}`}>
                        {cur.role}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-4">
                      <Field label="Nome de exibição">
                        <input className={inputCls} value={cur.display_name} disabled={self} onChange={(e) => upd({ display_name: e.target.value })} />
                      </Field>
                      <Field label="Nível de acesso">
                        <select className={inputCls} value={cur.role} disabled={self} onChange={(e) => upd({ role: e.target.value as StaffRow['role'] })}>
                          <option value="admin">admin</option>
                          <option value="jurado">jurado</option>
                          <option value="dev">dev</option>
                        </select>
                      </Field>
                    </div>

                    <div className={`space-y-2 ${cur.role === 'admin' ? '' : 'hidden'}`}>
                      <span className="font-mono text-[9px] text-gray-400 uppercase tracking-widest block font-bold">Funções liberadas no painel</span>
                      {PERM_KEYS.map(pk => (
                        <label key={pk.key} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            className="w-4 h-4 bg-black border-white/20 rounded focus:ring-[#F0C265]"
                            checked={isDev && cur.role === 'dev' ? true : !!cur.permissions?.[pk.key]}
                            disabled={self}
                            onChange={(e) => upd({ permissions: { ...cur.permissions, [pk.key]: e.target.checked } })}
                          />
                          <span className="text-xs text-gray-300">{pk.label}</span>
                        </label>
                      ))}
                    </div>

                    <div className="flex justify-end items-center gap-3">
                      {notice[k] && <Notice kind={notice[k].kind}>{notice[k].msg}</Notice>}
                      <button type="button" onClick={() => saveStaff(cur)} disabled={busy === k || self} className={btnGold}>
                        {busy === k ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : self ? 'Edite em Minha conta' : 'Salvar membro'}
                      </button>
                    </div>
                  </div>
                );
              }) : staffList.filter(x => x.id !== me?.id).map(s => {
                const k = `staff-${s.id}`;
                const upd = (patch: Partial<StaffRow>) => setStaffList(list => list.map(x => x.id === s.id ? { ...x, ...patch } : x));
                return (
                  <div key={s.id} className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4">
                    <div className="border-b border-white/5 pb-3">
                      <h3 className="font-display font-bold text-white">{s.display_name || s.email}</h3>
                      <span className="font-mono text-[9px] text-gray-500 block">{s.email}</span>
                    </div>
                    <Field label="Nome de exibição">
                      <input className={inputCls} value={s.display_name} onChange={(e) => upd({ display_name: e.target.value })} />
                    </Field>
                    <div className="flex justify-end items-center gap-3">
                      {notice[k] && <Notice kind={notice[k].kind}>{notice[k].msg}</Notice>}
                      <button type="button" onClick={() => saveStaff(s)} disabled={busy === k} className={btnGold}>
                        {busy === k ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Salvar'}
                      </button>
                    </div>
                  </div>
                );
              })}

              <div className="bg-black/40 border border-dashed border-[#E3B552]/30 rounded-xl p-4 space-y-3">
                <span className="font-mono text-[9px] text-[#F0C265] uppercase tracking-widest font-bold flex items-center gap-1.5"><UserPlus className="w-3.5 h-3.5" /> Criar novo acesso</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Field label="E-mail"><input className={inputCls} value={invite.email} onChange={(e) => setInvite(p => ({ ...p, email: e.target.value }))} placeholder="pessoa@pedraprofana.com" /></Field>
                  <Field label="Nome de exibição"><input className={inputCls} value={invite.name} onChange={(e) => setInvite(p => ({ ...p, name: e.target.value }))} placeholder="Como aparece no painel" /></Field>
                  <Field label="Senha inicial (mín. 8)"><input type="password" className={inputCls} value={invite.password} onChange={(e) => setInvite(p => ({ ...p, password: e.target.value }))} /></Field>
                  {isDev && (
                    <Field label="Nível de acesso">
                      <select className={inputCls} value={invite.role} onChange={(e) => setInvite(p => ({ ...p, role: e.target.value as 'jurado' | 'admin' }))}>
                        <option value="jurado">jurado</option>
                        <option value="admin">admin</option>
                      </select>
                    </Field>
                  )}
                </div>
                <div className="flex justify-end items-center gap-3">
                  {notice['invite'] && <Notice kind={notice['invite'].kind}>{notice['invite'].msg}</Notice>}
                  <button type="button" onClick={createMember} disabled={busy === 'invite'} className={btnGold}>
                    {busy === 'invite' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Criar acesso'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* AUDITORIA */}
          {tab === 'auditoria' && (isDev || isAdminRole) && (
            <div className="space-y-4 fade-up-800">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">Histórico das ações internas ({audit.length})</span>
                <button type="button" onClick={openAuditTab} className={btnGhost}>Atualizar</button>
              </div>
              {audit.length === 0 && (
                <div className="bg-[#0B0F19]/60 border border-white/10 rounded-2xl p-5">
                  <p className="text-xs text-gray-400 font-mono">Nenhuma ação registrada ainda.</p>
                </div>
              )}
              <div className="space-y-2">
                {audit.map(a => {
                  const d = (a.details && typeof a.details === 'object') ? a.details as Record<string, unknown> : {};
                  const detailText = Object.keys(d).length ? Object.entries(d).map(([kk, vv]) => `${kk}: ${String(vv)}`).join(' · ') : '';
                  return (
                    <div key={String(a.id)} className="bg-black/40 border border-white/5 rounded-xl p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className="min-w-0">
                        <span className="text-xs text-white font-bold block">{String(a.actor_name || '—')} <span className="text-gray-400 font-normal">{String(a.action)}</span></span>
                        <span className="font-mono text-[10px] text-[#F0C265] block truncate">{String(a.target || '')}</span>
                        {detailText && <span className="font-mono text-[9px] text-gray-500 block">{detailText}</span>}
                      </div>
                      <span className="font-mono text-[9px] text-gray-500 shrink-0">{fmtDate(String(a.created_at))}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MINHA CONTA */}
          {tab === 'conta' && (
            <div className="space-y-4 max-w-xl fade-up-800">
              <div className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4">
                <h3 className="font-display font-bold text-white uppercase border-b border-white/5 pb-3">Nome de exibição</h3>
                <Field label="Como seu nome aparece no painel">
                  <input className={inputCls} value={newName} onChange={(e) => setNewName(e.target.value)} />
                </Field>
                <div className="flex justify-end items-center gap-3">
                  {notice['acc-name'] && <Notice kind={notice['acc-name'].kind}>{notice['acc-name'].msg}</Notice>}
                  <button type="button" onClick={saveOwnName} disabled={busy === 'acc-name'} className={btnGold}>
                    {busy === 'acc-name' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Salvar nome'}
                  </button>
                </div>
              </div>

              <div className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4">
                <h3 className="font-display font-bold text-white uppercase border-b border-white/5 pb-3 flex items-center gap-2"><KeyRound className="w-4 h-4 text-[#F0C265]" /> Alterar minha senha</h3>
                <Field label="Nova senha (mínimo 8 caracteres)">
                  <input type="password" className={inputCls} value={pw1} onChange={(e) => setPw1(e.target.value)} autoComplete="new-password" />
                </Field>
                <Field label="Confirmar nova senha">
                  <input type="password" className={inputCls} value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" />
                </Field>
                <div className="flex justify-end items-center gap-3">
                  {notice['acc-pw'] && <Notice kind={notice['acc-pw'].kind}>{notice['acc-pw'].msg}</Notice>}
                  <button type="button" onClick={savePassword} disabled={busy === 'acc-pw'} className={btnGold}>
                    {busy === 'acc-pw' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Alterar senha'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-white/5 mt-8 pt-5 text-center">
            <span className="font-mono text-[9px] text-[#5C5248] uppercase tracking-widest">Estúdio Pedra Profana • Área interna</span>
          </div>
        </div>
      )}
    </div>
  );
}

function DeleteFaqButton({ onDelete }: { onDelete: () => void }) {
  const [armed, setArmed] = useState(false);
  if (!armed) {
    return (
      <button type="button" onClick={() => setArmed(true)} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    );
  }
  return (
    <span className="flex items-center gap-1">
      <button type="button" onClick={onDelete} className="font-mono text-[9px] font-bold px-2 py-1 rounded uppercase bg-red-600 text-white">Confirmar</button>
      <button type="button" onClick={() => setArmed(false)} className="p-1 text-gray-400 hover:text-white"><X className="w-3.5 h-3.5" /></button>
    </span>
  );
}
