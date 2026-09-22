'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { inputCls, btnGold, btnGhost } from '../../components/painel/ui';
import FunilTab from '../../components/painel/FunilTab';
import AuditoriaTab from '../../components/painel/AuditoriaTab';
import MinhaContaTab from '../../components/painel/MinhaContaTab';
import GatewayTab from '../../components/painel/GatewayTab';
import VipTab from '../../components/painel/VipTab';
import ConteudoTab, { FaqRow } from '../../components/painel/ConteudoTab';
import LotesTab, { BatchRow, BatchDraft } from '../../components/painel/LotesTab';
import WidgetsTab from '../../components/painel/WidgetsTab';
import AbandonosCard from '../../components/painel/AbandonosCard';
import EquipeTab, { StaffRow } from '../../components/painel/EquipeTab';
import {
  Shield, LayoutDashboard, Tags, FileText, ClipboardList, Users, UserCog,
  LogOut, Check, X, Plus, Trash2, KeyRound, Loader2, Star, Eye, History, BarChart3, UsersRound, Sparkles } from 'lucide-react';

// StaffRow agora vem de components/painel/EquipeTab (fonte unica)

interface MemberFull {
  id?: string;
  name: string;
  cpf?: string;
  birth_date?: string;
  phone?: string | null;
  email?: string | null;
  is_responsible: boolean;
  payment_status?: string;
  claimed_at?: string | null;
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



// FaqRow agora vem de components/painel/ConteudoTab (fonte unica)

interface ProjectRow {
  id: string;
  name: string;
  style: string;
  bio?: string | null;
  instagram?: string | null;
  video_link?: string | null;
  photo_url?: string | null;
  status: string;
  batch_id?: string | null;
  pre_registrado?: boolean;
  stage?: number;
  min_payable?: number;
  total_members?: number;
  created_at: string;
  members?: { count: number }[];
  subscriptions?: { status: string; amount_paid: number; batches?: { name: string } }[];
}



const TZ = 'America/Sao_Paulo';
const PROJECT_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: 'pendente', cls: 'bg-amber-500/15 text-amber-500 border-amber-500/30' },
  awaiting_members: { label: 'aguardando integrantes', cls: 'bg-sky-500/15 text-sky-400 border-sky-500/30' },
  paid: { label: 'paga', cls: 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30' },
  failed: { label: 'negada', cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
  blocked: { label: 'bloqueada', cls: 'bg-red-900/30 text-red-300 border-red-800/40' },
  suspended: { label: 'suspensa', cls: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  refunded: { label: 'reembolsada', cls: 'bg-white/5 text-gray-400 border-white/10' },
};

function parseDbDate(v?: string | null): Date | null {
  if (!v) return null;
  let s = String(v).trim().replace(' ', 'T');
  // Offsets '+00' sem minutos sao rejeitados pelo Safari/Firefox: normaliza para '+00:00'
  if (/[+-]\d{2}$/.test(s)) s += ':00';
  const d = new Date(s);
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
  if (!d) return '-';
  return new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d);
}

function Notice({ kind, children }: { kind: 'ok' | 'err' | 'info'; children: React.ReactNode }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    setVisible(true);
    if (kind === 'err') {
      const t = setTimeout(() => setVisible(false), 9000);
      return () => clearTimeout(t);
    }
  }, [kind, children]);
  if (!children || !visible) return null;
  const cls = kind === 'ok'
    ? 'bg-[#10B981]/15 border-[#10B981]/30 text-[#10B981]'
    : kind === 'err'
      ? 'bg-red-500/10 border-red-500/40 text-red-300'
      : 'bg-white/5 border-white/10 text-gray-300';
  return (
    <div className={`border rounded-xl px-4 py-3 flex items-start gap-2.5 text-xs leading-relaxed ${cls}`}>
      <span className="text-base leading-none mt-0.5">{kind === 'ok' ? '✓' : kind === 'err' ? '⚠' : 'ℹ'}</span>
      <div className="flex-1">
        {kind === 'err' && <span className="text-[11px] font-bold uppercase tracking-wide block">Atenção</span>}
        <span className="font-mono leading-snug">{children}</span>
      </div>
      {kind === 'err' && (
        <button type="button" onClick={() => setVisible(false)} className="text-red-300/70 hover:text-white text-lg leading-none">×</button>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block font-mono text-[11px] text-[#F0C265] font-bold uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}


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
  const [removing, setRemoving] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ proj: Record<string, unknown> | null; members: MemberFull[]; sub: Record<string, unknown> | null; subsTotal: number; scores: ScoreView[]; member_edits: Array<Record<string, unknown>>; invite_code: string | null; whatsapp_clicks: number } | null>(null);
  const [ownScores, setOwnScores] = useState<Record<string, JuryDraft>>({});
  const [juryDraft, setJuryDraft] = useState<Record<string, JuryDraft>>({});
  const [openJury, setOpenJury] = useState<string | null>(null);
  const [invite, setInvite] = useState({ username: '', name: '', password: '', role: 'jurado' as 'jurado' | 'admin' });
  const [audit, setAudit] = useState<Array<Record<string, unknown>>>([]);
  const [searchQ, setSearchQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loteFilter, setLoteFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [paidCount, setPaidCount] = useState(0);
  const [jurySearch, setJurySearch] = useState('');
  const [photoView, setPhotoView] = useState<string | null>(null);
  const [funnel, setFunnel] = useState<Record<string, unknown> | null>(null);
  const [funnelDays, setFunnelDays] = useState(0);
  const [v2env, setV2env] = useState<{ ativo: boolean; preco: number | null; pix_real: boolean } | null>(null);
  const [linkLote, setLinkLote] = useState('');
  const [linkGerado, setLinkGerado] = useState<string | null>(null);
  const [cupomCodigo, setCupomCodigo] = useState('');
  const [cupomLote, setCupomLote] = useState('');
  const [cupomMax, setCupomMax] = useState('1');
  const [cupomLista, setCupomLista] = useState<Array<Record<string, unknown>>>([]);
  const [cupomExcluir, setCupomExcluir] = useState(''); // codigo aguardando 2o clique de confirmacao (somente dev)
  const [v2preco, setV2preco] = useState('');
  const [prePage, setPrePage] = useState(0);
  const [preOpen, setPreOpen] = useState(false);
  const [slotMode, setSlotMode] = useState<'band' | 'integrante'>('band');
  const [cartDays, setCartDays] = useState({ lote1: '10', lote2: '10', lote3: '12' });
  const [homeMode, setHomeMode] = useState<'classic' | 'vip'>('classic');
  const [homeCtaMode, setHomeCtaMode] = useState<'waitlist' | 'quiz'>('waitlist');
  const [gwState, setGwState] = useState<{ token_set: boolean; token_mask: string; secret_set: boolean; updated_at?: string } | null>(null);
  const [mpToken, setMpToken] = useState('');
  const [mpSecret, setMpSecret] = useState('');
  const [mpPublicKey, setMpPublicKey] = useState('');
  const [vip, setVip] = useState<Record<string, string>>({});
  const [vipLeads, setVipLeads] = useState<Array<Record<string, unknown>>>([]);

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
  const perms = (me?.permissions as Record<string, boolean | undefined> | undefined) || {};
  const canLotes = isDev || !!perms.manage_lotes;
  const canContent = isDev || !!perms.manage_content;
  const canSubs = isDev || !!perms.manage_subscriptions;
  const canSensitive = isDev || !!perms.view_sensitive_data;
  const canTeam = isDev || (isAdminRole && !!perms.manage_team);
  const canVip = isDev || (isAdminRole && !!perms.manage_vip);
  const canGateway = isDev || (isAdminRole && !!perms.manage_gateway);
  const canAudit = isDev || (isAdminRole && !!perms.view_audit);

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
    // Ordem fixa por sort_order (1,2,3): created_at e identico entre lotes e a ordem fisica muda apos UPDATE
    const { data } = await supabase.from('batches').select('*').order('sort_order', { ascending: true });
    if (data) setBatches(data as BatchRow[]);
  }, []);

  const loadSettings = useCallback(async () => {
    const { data } = await supabase.from('site_settings').select('key,value');
    const map: Record<string, string> = {};
    (data || []).forEach((r: { key: string; value: unknown }) => {
      map[r.key] = typeof r.value === 'string' ? r.value : String(r.value ?? '');
    });
    setSettings(map);
    // Campos de data precisam de YYYY-MM-DDTHH:mm para o input datetime-local exibir o valor salvo
    const drafts = { ...map };
    (['cart_open_at', 'countdown_target', 'live_launch'] as const).forEach(k => {
      if (drafts[k]) drafts[k] = toInputValue(drafts[k]);
    });
    setSettingDrafts(drafts);
  }, []);

  const loadSlotMode = useCallback(async () => {
    const { data } = await supabase.rpc('get_slot_mode');
    if (data === 'integrante') setSlotMode('integrante'); else setSlotMode('band');
  }, []);

  const loadHomeMode = useCallback(async () => {
    const { data } = await supabase.rpc('get_home_mode');
    if (data === 'vip') setHomeMode('vip'); else setHomeMode('classic');
  }, []);

  const loadHomeCtaMode = useCallback(async () => {
    const { data } = await supabase.rpc('get_home_cta_mode');
    if (data === 'quiz') setHomeCtaMode('quiz'); else setHomeCtaMode('waitlist');
  }, []);

  const loadVip = useCallback(async () => {
    const keys = ['vip_badge','vip_title_start','vip_title_highlight','vip_subtitle','vip_benefit1_title','vip_benefit1_desc','vip_benefit2_title','vip_benefit2_desc','vip_benefit3_title','vip_benefit3_desc','vip_whatsapp_url','vip_active'];
    const { data } = await supabase.from('site_settings').select('key,value').in('key', keys);
    const map: Record<string, string> = {};
    (data || []).forEach((r: { key: string; value: unknown }) => {
      map[r.key] = typeof r.value === 'string' ? r.value : String(r.value ?? '');
    });
    setVip(map);
  }, []);

  const loadVipLeads = useCallback(async () => {
    const { data } = await supabase.rpc('list_vip_leads', { p_limit: 300 });
    setVipLeads((data || []) as Array<Record<string, unknown>>);
  }, []);

  const loadGateway = useCallback(async () => {
    const { data } = await supabase.rpc('dev_get_gateway_state');
    if (data && typeof data === 'object') {
      setGwState(data as any);
      const st = data as { public_key?: string };
      if (st.public_key) setMpPublicKey(st.public_key);
    }
  }, []);

  const loadFaqs = useCallback(async () => {
    const { data } = await supabase.from('faq_items').select('*').order('sort_order', { ascending: true });
    if (data) setFaqs(data as FaqRow[]);
  }, []);

  const PAGE_SIZE = 10;

  const loadProjects = useCallback(async () => {
    if (me?.role === 'jurado') {
      const { data: juryData } = await supabase.rpc('list_projects_for_jury');
      const rows = ((juryData || []) as Array<Record<string, unknown>>).map(r => ({
        id: String(r.id), name: String(r.name), style: String(r.style || ''),
        bio: String(r.bio || ''), instagram: (r.instagram as string) || null,
        video_link: (r.video_link as string) || null, photo_url: (r.photo_url as string) || null,
        status: String(r.status), created_at: String(r.created_at),
        members: [{ count: Number(r.members_count || 0) }], subscriptions: []
      }));
      setProjects(rows as unknown as ProjectRow[]);
      setTotalCount(rows.length);
      return;
    }
    // SEM embedded joins: members/subscriptions negam SELECT e derrubam a query inteira (lista vazia)
    let query = supabase
      .from('projects')
      .select('id, name, style, bio, instagram, video_link, photo_url, status, batch_id, created_at', { count: 'exact' });
    if (searchQ.trim()) query = query.ilike('name', `%${searchQ.trim()}%`);
    if (statusFilter) query = query.eq('status', statusFilter);
    // filtro por lote passou a ser feito client-side (batches ja carregados)
    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    if (error) {
      console.error('loadProjects falhou:', error);
      setMsg('lista', 'err', 'Erro ao carregar a lista: ' + error.message);
    }
    if (data) setProjects(data as unknown as ProjectRow[]);
    setTotalCount(count ?? 0);
    const { count: paidTotal } = await supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'paid');
    setPaidCount(paidTotal ?? 0);
  }, [searchQ, statusFilter, loteFilter, page, me?.role]);

  const loadAudit = useCallback(async () => {
    const { data } = await supabase.rpc('list_audit', { p_limit: 150 });
    setAudit((data || []) as Array<Record<string, unknown>>);
  }, []);

  const loadCupons = useCallback(async () => {
    // RPC SECURITY DEFINER (permite manage_lotes); fallback: select direto.
    // Se ambos falharem, EXIBE o erro na tela · lista de cupons nunca fica vazia em silencio.
    const { data: rpc, error: errRpc } = await supabase.rpc('list_cupons_lote');
    if (Array.isArray(rpc)) { setCupomLista(rpc as Array<Record<string, unknown>>); setNotice(p => ({ ...p, 'cupom-lista': { kind: 'info', msg: '' } })); return; }
    const { data, error: errSel } = await supabase.from('lote_cupons').select('*').order('created_at', { ascending: false });
    if (Array.isArray(data)) { setCupomLista(data as Array<Record<string, unknown>>); return; }
    setCupomLista([]);
    setMsg('cupom-lista', 'err', `Não foi possível carregar os cupons: ${(errRpc?.message || errSel?.message || 'sem permissão').slice(0, 120)}`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const criarCupom = () => guarded('cupom', async () => {
    const codigo = cupomCodigo.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
    if (codigo.length < 4) return 'Código deve ter ao menos 4 caracteres (letras/números/hífen).';
    if (!cupomLote) return 'Selecione o lote do cupom.';
    const maxU = parseInt(cupomMax, 10);
    if (isNaN(maxU) || maxU < 1) return 'Informe um limite de usos válido.';
    const { data: res, error } = await supabase.rpc('dev_criar_cupom_lote', { p_codigo: codigo, p_lote_id: cupomLote, p_max_usos: maxU });
    if (error) return 'Erro: ' + error.message;
    if (res !== 'ok') return String(res);
    setCupomCodigo('');
    setCupomMax('1');
    await loadCupons();
    setMsg('cupom', 'ok', `Cupom ${codigo} criado. Link: ${window.location.origin}/?cupom=${codigo}`);
    return 'ok';
  });

  const excluirCupom = (codigo: string) => guarded('cupom-del', async () => {
    // Exclusao TOTAL do banco (hard delete), restrita ao dev na funcao SQL
    const { data, error } = await supabase.rpc('dev_delete_cupom_lote', { p_codigo: codigo });
    if (error) return 'Erro: ' + error.message;
    setCupomExcluir('');
    await loadCupons();
    const r = (typeof data === 'object' && data ? data : {}) as { usos_perdidos?: number };
    setMsg('cupom', 'ok', `Cupom ${codigo} excluído definitivamente do banco.${r.usos_perdidos ? ` (${r.usos_perdidos} uso(s) removido(s) junto)` : ''}`);
    return 'ok';
  });

  const toggleCupom = (id: string, ativo: boolean) => guarded('cupom-t', async () => {
    const { error: errRpc } = await supabase.rpc('toggle_cupom_lote', { p_id: id });
    if (errRpc) await supabase.from('lote_cupons').update({ ativo: !ativo }).eq('id', id);
    await loadCupons();
    return 'ok';
  });

  const loadV2Env = useCallback(async () => {
    const { data, error } = await supabase.rpc('dev_get_v2_env');
    if (error || !data) { setV2env(null); return; }
    const env = data as { ativo: boolean; preco: number | null; pix_real: boolean };
    setV2env(env);
    setV2preco(env.preco != null ? String(env.preco) : '');
  }, []);

  const saveV2Env = (ativo: boolean) => guarded('v2env', async () => {
    const preco = v2preco.trim() ? Number(v2preco) : null;
    if (v2preco.trim() && (isNaN(Number(preco)) || Number(preco) <= 0)) return 'Informe um preço de teste válido.';
    const { data: res, error } = await supabase.rpc('dev_set_v2_env', { p_ativo: ativo, p_preco: preco, p_pix_real: v2env?.pix_real ?? false });
    if (error) return 'Erro: ' + error.message;
    if (res !== 'ok') return String(res);
    setMsg('v2env', 'ok', ativo ? 'SANDBOX /v2 LIGADO. A /v2 aceita inscrições de teste e a / home segue intocada.' : 'SANDBOX /v2 DESLIGADO. A /v2 volta ao comportamento padrão.');
    await loadV2Env();
    return 'ok';
  });

  const toggleV2Pix = () => guarded('v2pix', async () => {
    const novo = !(v2env?.pix_real ?? false);
    const preco = v2preco.trim() ? Number(v2preco) : null;
    const { data: res, error } = await supabase.rpc('dev_set_v2_env', { p_ativo: v2env?.ativo ?? false, p_preco: preco, p_pix_real: novo });
    if (error) return 'Erro: ' + error.message;
    if (res !== 'ok') return String(res);
    await loadV2Env();
    return 'ok';
  });

  const loadFunnel = useCallback(async (days = 0) => {
    const { data } = await supabase.rpc('get_funnel_stats', { p_days: days });
    setFunnel((data || null) as Record<string, unknown> | null);
  }, []);

  useEffect(() => {
    (async () => {
      const ok = await loadStaff();
      if (ok) {
        await Promise.all([loadBatches(), loadSettings(), loadFaqs(), loadProjects(), loadLive(), loadOwnScores(), loadSlotMode(), loadVip(), loadVipLeads(), loadHomeMode(), loadHomeCtaMode(), loadGateway()]);
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
    if (authed && tab === 'funil') loadFunnel(funnelDays);
    if (authed && tab === 'vip') loadVipLeads();
    if (authed && tab === 'gateway') loadGateway();
    if (authed && tab === 'lotes' && (isDev || canLotes)) { if (isDev) loadV2Env(); loadCupons(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, tab, funnelDays, isDev]);

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
    if (canVip) available.push('vip');
    if (canGateway) available.push('gateway');
    if (canSubs) available.push('inscritos');
    if (canSubs) available.push('funil');
    if (isJudge) available.push('avaliacao');
    if (canTeam) available.push('equipe');
    if (canAudit) available.push('auditoria');
    available.push('conta');
    setTab(t => (available.includes(t) ? t : available[0]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, me?.role, canLotes, canContent, canSubs, canTeam, canAudit, canVip, canGateway, isJudge]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    const { error } = await supabase.auth.signInWithPassword({ email: `${email.trim().toLowerCase()}@painel.local`, password });
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
    await Promise.all([loadBatches(), loadSettings(), loadFaqs(), loadProjects(), loadLive(), loadOwnScores(), loadSlotMode(), loadVip(), loadVipLeads(), loadHomeMode(), loadHomeCtaMode(), loadGateway()]);
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
    if (isNaN(price) || price <= 0) return 'Oferta inválida.';
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
    setMsg(`activate-${b.id}`, 'ok', `Lote ativado. Os demais lotes foram ajustados automaticamente e a data do site foi sincronizada.`);
    return 'ok';
  });

  // ---------- conteúdo ----------
  const saveSetting = (key: string, label: string, kind: 'datetime' | 'text' | 'number' = 'datetime') => guarded(`set-${key}`, async () => {
    const v = settingDrafts[key] ?? '';
    if (kind === 'text' && v.trim() && !/^https?:\/\//i.test(v.trim())) return 'Informe um link começando com http(s)://';
    if (kind === 'number') {
      const n = Number(v);
      if (!v || isNaN(n) || n <= 0) return 'Informe um valor numérico válido.';
    }
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
    if (error || !prof) { setDetail({ proj: null, members: [], sub: null, subsTotal: 0, scores: [], member_edits: [], invite_code: null, whatsapp_clicks: 0 }); setMsg(`st-${id}`, 'err', 'Não foi possível carregar a ficha: ' + (error?.message || 'vazia')); return; }
    setDetail({
      proj: (prof.project || null) as Record<string, unknown> | null,
      members: (prof.members || []) as unknown as MemberFull[],
      sub: (prof.subscription || null) as Record<string, unknown> | null,
      subsTotal: prof.subscriptions_total ?? 0,
      scores: (prof.scores || []) as ScoreView[],
      member_edits: (prof.member_edits || []) as Array<Record<string, unknown>>,
      invite_code: (prof.invite_code as string) || null,
      whatsapp_clicks: Number(prof.whatsapp_clicks || 0)
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
    setMsg('live-phase', 'ok', phase === 'ao_vivo' ? 'Live no ar. Lotes ativos foram pausados automaticamente.' : 'Fase da live atualizada. O lote que estava ativo antes da live foi restaurado.');
    return 'ok';
  });

  // ---------- equipe ----------
  const friendlyStaffError = (m: string): string => {
    if (m.includes('SENHA_CURTA')) return 'A senha inicial precisa ter no mínimo 8 caracteres.';
    if (m.includes('USUARIO_INVALIDO')) return 'Use de 3 a 20 caracteres: letras minúsculas, números, ponto ou underline.';
    if (m.includes('USUARIO_EM_USO')) return 'Este nome de usuário já está em uso.';
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
      p_username: invite.username.trim().toLowerCase(), p_name: invite.name.trim(), p_password: invite.password
    };
    if (isDev) args.p_role = invite.role;
    const { error } = await supabase.rpc('create_staff_member', args);
    if (error) return friendlyStaffError(error.message);
    await loadStaff();
    setInvite({ username: '', name: '', password: '', role: 'jurado' });
    setMsg('invite', 'ok', 'Acesso criado. Envie o e-mail e a senha inicial à pessoa - ela deve trocar a senha em Minha conta.');
    return 'ok';
  });

  const disableStaff = (s: StaffRow) => guarded(`disable-${s.id}`, async () => {
    if (!isDev) return 'Operação não permitida.';
    const { data: res, error } = await supabase.rpc('disable_staff_member', { p_id: s.id });
    if (error) return 'Erro: ' + error.message;
    if (res !== 'ok') return String(res);
    await loadStaff();
    setMsg(`disable-${s.id}`, 'ok', 'Acesso desativado. O painel desta pessoa fica inacessível imediatamente.');
    return 'ok';
  });

  const changeSlotMode = (mode: 'band' | 'integrante') => guarded('slotmode', async () => {
    const { data: res, error } = await supabase.rpc('set_slot_mode', { p_mode: mode });
    if (error) return 'Erro: ' + error.message;
    if (res !== 'ok') return String(res);
    setSlotMode(mode);
    await loadBatches();
    setMsg('slotmode', 'ok', mode === 'band'
      ? 'Vagas por banda/projeto: oferta travada para todos os integrantes da banda.'
      : 'Vagas por integrante: cada pagamento usa a oferta do lote vigente na hora.');
    return 'ok';
  });

  const applyCartOpen = (openAt: string) => guarded('cartopen', async () => {
    const iso = fromInputValue(openAt);
    if (!iso) return 'Informe a data de abertura.';
    const d1 = Math.max(1, parseInt(cartDays.lote1, 10) || 10);
    const d2 = Math.max(1, parseInt(cartDays.lote2, 10) || 10);
    const d3 = Math.max(1, parseInt(cartDays.lote3, 10) || 12);
    const { data: res, error } = await supabase.rpc('admin_set_cart_open', {
      p_open_at: iso, p_days_lote1: d1, p_days_lote2: d2, p_days_lote3: d3
    });
    if (error) return 'Erro: ' + error.message;
    if (res !== 'ok') return String(res);
    await Promise.all([loadBatches(), loadSettings()]);
    setMsg('cartopen', 'ok', 'Datas reorganizadas. Lote 1 ativa quando a data chegar (o countdown do site já aponta para o fim dele).');
    return 'ok';
  });

  const grantSlot = (p: ProjectRow) => guarded(`grant-${p.id}`, async () => {
    const { data: res, error } = await supabase.rpc('admin_grant_slot', { p_project_id: p.id });
    if (error) return 'Erro: ' + error.message;
    if (res !== 'ok') return String(res);
    await loadProjects();
    setMsg(`grant-${p.id}`, 'ok', 'Vaga concedida e banda ativada.');
    return 'ok';
  });

  const returnSlot = (p: ProjectRow) => guarded(`ret-${p.id}`, async () => {
    const { data: res, error } = await supabase.rpc('admin_return_slot', { p_project_id: p.id });
    if (error) return 'Erro: ' + error.message;
    if (res !== 'ok') return String(res);
    await loadProjects();
    setMsg(`ret-${p.id}`, 'ok', 'Vaga devolvida ao pool do lote.');
    return 'ok';
  });

  const saveVip = (key: string, label: string, kind: 'text' | 'url' | 'bool' = 'text') => guarded(`vip-${key}`, async () => {
    let value: string;
    if (kind === 'bool') {
      value = (vip[key] === 'true') ? 'true' : 'false';
    } else {
      value = (vip[key] ?? '').trim();
      if (kind === 'url' && value && !/^https:\/\//i.test(value)) return 'Informe um link começando com https://';
      if (kind !== 'url' && !value) return `Preencha: ${label}`;
    }
    const { error } = await supabase.rpc('staff_save_setting', { p_key: key, p_value: value });
    if (error) return 'Erro ao salvar: ' + error.message;
    await loadVip();
    setMsg(`vip-${key}`, 'ok', 'Grupo VIP atualizado. A página já reflete no ar.');
    return 'ok';
  });

  const changeHomeMode = (mode: 'classic' | 'vip') => guarded('homemode', async () => {
    const { data: res, error } = await supabase.rpc('set_home_mode', { p_mode: mode });
    if (error) return 'Erro: ' + error.message;
    if (res !== 'ok') return String(res);
    setHomeMode(mode);
    setMsg('homemode', 'ok', mode === 'vip'
      ? 'Página principal agora é o Grupo VIP. A landing clássica continua em /v2.'
      : 'Página principal agora é a landing clássica (em /v2). O Grupo VIP fica em /grupovip.');
    return 'ok';
  });

  const changeHomeCtaMode = (mode: 'waitlist' | 'quiz') => guarded('homecta', async () => {
    const { data: res, error } = await supabase.rpc('set_home_cta_mode', { p_mode: mode });
    if (error) return 'Erro: ' + error.message;
    if (res !== 'ok') return String(res);
    setHomeCtaMode(mode);
    setMsg('homecta', 'ok', mode === 'waitlist'
      ? 'Botão Inscrever-se abre o popup de e-mail + Grupo VIP (pré-inscrição).'
      : 'Botão Inscrever-se abre o quiz de inscrição completo (período de inscrições ativo).');
    return 'ok';
  });

  const saveGateway = () => guarded('gateway', async () => {
    if (!mpToken.trim()) return 'Informe o Access Token de produção do Mercado Pago.';
    const { data: res, error } = await supabase.rpc('dev_save_gateway_keys', {
      p_token: mpToken.trim(), p_secret: mpSecret.trim(), p_public_key: mpPublicKey.trim()
    });
    if (error) return 'Erro ao salvar: ' + error.message;
    if (res !== 'ok') return String(res);
    setMpToken(''); setMpSecret('');
    await loadGateway();
    setMsg('gateway', 'ok', 'Chaves do gateway salvas com segurança.');
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
          <span className="font-mono text-xs uppercase tracking-widest text-gray-400">Verificando sessão segura...</span>
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
              <Field label="Usuário">
                <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu.usuario" className={inputCls} required autoComplete="username" spellCheck={false} />
              </Field>
              <Field label="Senha">
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••" className={inputCls} required autoComplete="current-password" />
              </Field>
              {loginError && <Notice kind="err">{loginError}</Notice>}
              <button type="submit" disabled={loggingIn} className={`${btnGold} w-full py-3`}>
                {loggingIn ? 'Autenticando...' : 'Entrar'}
              </button>
            </form>
            <Link href="/" className="inline-block text-xs font-mono text-gray-500 hover:text-white uppercase tracking-widest">← Voltar ao site</Link>
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
                <span className="font-mono text-[11px] text-[#F0C265] tracking-widest block uppercase mt-1">{me?.display_name || me?.username}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/v2" className="text-xs font-mono text-gray-400 hover:text-white uppercase tracking-widest">Ver site</Link>
              <button onClick={handleLogout} className="flex items-center gap-1.5 font-mono text-xs font-bold text-gray-400 hover:text-red-400 uppercase tracking-widest transition-colors">
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
              { id: 'widgets', label: 'Widgets', icon: Sparkles, show: canContent },
              { id: 'inscritos', label: 'Inscrições', icon: ClipboardList, show: canSubs },
              { id: 'avaliacao', label: 'Avaliação', icon: Star, show: isJudge },
              { id: 'equipe', label: 'Equipe', icon: Users, show: canTeam },
              { id: 'auditoria', label: 'Auditoria', icon: History, show: canAudit },
              { id: 'funil', label: 'Funil', icon: BarChart3, show: canSubs },
              { id: 'vip', label: 'Grupo VIP', icon: Users, show: canVip },
              { id: 'gateway', label: 'Pagamentos', icon: KeyRound, show: canGateway },
              { id: 'conta', label: 'Minha conta', icon: UserCog, show: true },
            ].filter(t => t.show).map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider rounded-xl whitespace-nowrap transition-colors ${
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
                  { label: 'Lote vigente', value: (batches.find(b => b.status === 'ativo')?.name || '-'), accent: 'text-[#10B981]' },
                  { label: 'Vagas restantes', value: String(batches.find(b => b.status === 'ativo')?.vagas_restantes ?? '-'), accent: 'text-white' },
                  { label: 'Inscrições', value: String(totalCount), accent: 'text-[#F0C265]' },
                  { label: 'Pagas', value: String(paidCount), accent: 'text-[#10B981]' },
                ].map(s => (
                  <div key={s.label} className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-1.5">
                    <span className="font-mono text-[11px] text-gray-400 uppercase tracking-widest block">{s.label}</span>
                    <span className={`font-display font-black text-2xl block ${s.accent}`}>{s.value}</span>
                  </div>
                ))}
              </div>
              <div className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-2">
                <span className="font-mono text-[11px] text-gray-400 uppercase tracking-widest block">Datas vigentes no site</span>
                <p className="text-xs text-gray-300 font-mono">Lote ativo termina: <strong className="text-white">{fmtDate(batches.find(b => b.status === 'ativo')?.ends_at)}</strong></p>
                <p className="text-xs text-gray-300 font-mono">Lançamento da live: <strong className="text-white">{fmtDate(settings.live_launch)}</strong></p>
              </div>
              {!canLotes && !canContent && !canSubs && (
                <Notice kind="info">Sua conta não possui funções ativas neste painel. Fale com quem gerencia o acesso para liberar funções.</Notice>
              )}
            </div>
          )}

          {/* LOTES - componente extraido (4 secoes) */}
          {tab === 'lotes' && (
            <LotesTab isDev={isDev} canLotes={canLotes} me={me} batches={batches} settings={settings} settingDrafts={settingDrafts} setSettingDrafts={setSettingDrafts} loadSettings={loadSettings} batchDrafts={batchDrafts} setBatchDrafts={setBatchDrafts} saveBatch={saveBatch} activateBatch={activateBatch} applyCartOpen={applyCartOpen} cartDays={cartDays} setCartDays={setCartDays} slotMode={slotMode} changeSlotMode={changeSlotMode} liveStatus={liveStatus} setLivePhase={setLivePhase} toInputValue={toInputValue} fmtDate={fmtDate} v2env={v2env} saveV2Env={saveV2Env} v2preco={v2preco} setV2preco={setV2preco} toggleV2Pix={toggleV2Pix} cupomCodigo={cupomCodigo} setCupomCodigo={setCupomCodigo} cupomLote={cupomLote} setCupomLote={setCupomLote} cupomMax={cupomMax} setCupomMax={setCupomMax} criarCupom={criarCupom} cupomLista={cupomLista} cupomExcluir={cupomExcluir} setCupomExcluir={setCupomExcluir} excluirCupom={excluirCupom} toggleCupom={toggleCupom} busy={busy} notice={notice} setMsg={setMsg} guarded={guarded} supabase={supabase} Field={Field} Notice={Notice} />
          )}

          {/* CONTEÚDO - componente extraido */}
          {tab === 'conteudo' && (
            <ConteudoTab settings={settings} settingDrafts={settingDrafts} setSettingDrafts={setSettingDrafts} loadSettings={loadSettings} saveSetting={saveSetting} toInputValue={toInputValue} faqs={faqs} setFaqs={setFaqs} moveFaq={moveFaq} saveFaq={saveFaq} deleteFaq={deleteFaq} newFaq={newFaq} setNewFaq={setNewFaq} addFaq={addFaq} busy={busy} notice={notice} setMsg={setMsg} guarded={guarded} fmtDate={fmtDate} supabase={supabase} Field={Field} Notice={Notice} />
          )}

          {/* WIDGETS - componente extraido */}
          {tab === 'widgets' && canContent && (
            <WidgetsTab settings={settings} loadSettings={loadSettings} supabase={supabase} Field={Field} Notice={Notice} devOnly={isDev} />
          )}

          {/* INSCRIÇÕES */}
          {tab === 'inscritos' && (
            <div className="space-y-4 fade-up-800">
              <div className="bg-[#F0C265]/10 border border-[#F0C265]/30 rounded-2xl px-4 py-3 flex flex-col sm:flex-row justify-between gap-2">
                <span className="text-xs text-[#F0C265] leading-snug">
                  <strong className="font-black uppercase tracking-wider">Como ler esta aba:</strong> <strong className="text-white">Pré-interessados</strong> = deixaram e-mail no Grupo VIP (sem pagar). <strong className="text-white">Bandas</strong> = inscritos reais · clique na banda para ver integrantes, pagamentos e contato.
                </span>
                <a href="/sagrado?tab=vip" className="font-mono text-[11px] font-bold text-[#F0C265] underline whitespace-nowrap self-start sm:self-center">Ver Grupo VIP →</a>
              </div>
              <AbandonosCard supabase={supabase} fmtDate={fmtDate} isDev={isDev} />
              {canVip && (() => {
                const preSize = 8;
                const prePages = Math.max(1, Math.ceil(vipLeads.length / preSize));
                const rows = vipLeads.slice(prePage * preSize, prePage * preSize + preSize);
                return (
                <div className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => { setPreOpen(!preOpen); if (!vipLeads.length) loadVipLeads(); }}
                    className="w-full flex justify-between items-center px-5 py-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                      <span className="font-display font-bold text-white uppercase text-sm">Pré-interessados · Grupo VIP</span>
                      <span className="font-mono text-[11px] text-sky-400 font-bold px-2 py-0.5 rounded-full border border-sky-500/30 bg-sky-500/10">{preOpen ? vipLeads.length : ''}</span>
                    </div>
                    <span className="font-mono text-[11px] text-gray-400">{preOpen ? 'fechar ▲' : 'abrir ▼'}</span>
                  </button>
                  {preOpen && (
                    <div className="border-t border-white/5 px-5 py-4 space-y-2">
                      {vipLeads.length === 0 && <p className="text-xs text-gray-500 font-mono">Nenhum pré-interessado ainda.</p>}
                      {rows.map((l, i) => (
                        <div key={i} className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 bg-black/30 border border-white/5 rounded-xl px-3.5 py-2.5">
                          <span className="text-xs text-white font-mono truncate">{String(l.email || '')}</span>
                          <span className="font-mono text-[10px] text-gray-500 uppercase">{String(l.source || '')} • {String(l.created_at || '').slice(0, 10)}</span>
                        </div>
                      ))}
                      {vipLeads.length > preSize && (
                        <div className="flex justify-between items-center border-t border-white/5 pt-3">
                          <button type="button" disabled={prePage === 0} onClick={() => setPrePage(x => Math.max(0, x - 1))} className={btnGhost}>← Anterior</button>
                          <span className="font-mono text-xs text-gray-400 uppercase">Página {prePage + 1} de {prePages}</span>
                          <button type="button" disabled={(prePage + 1) >= prePages} onClick={() => setPrePage(x => x + 1)} className={btnGhost}>Próxima →</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                );
              })()}

                <div className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4">
                  <h3 className="font-display font-bold text-white uppercase border-b border-white/5 pb-3">Bandas inscritas ({totalCount}) · clique para abrir a ficha completa</h3>

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
                    <button type="button" onClick={() => { setSearchQ(''); setStatusFilter(''); setLoteFilter(''); setPage(0); }} className="font-mono text-[11px] text-[#F0C265] hover:underline uppercase font-bold">
                      Limpar filtros
                    </button>
                  )}

                  {projects.length === 0 && <p className="text-xs text-gray-400 font-mono">Nenhuma inscrição encontrada.</p>}
                  <div className="space-y-3">
                    {projects.map(p => {
                      const st = PROJECT_STATUS[p.status] || { label: p.status, cls: 'bg-white/5 text-gray-400 border-white/10' };
                      const loteNome = p.batch_id ? (batches.find(b => b.id === p.batch_id)?.name as string || null) : null;
                      return (
                        <div key={p.id}>
                        <button
                          type="button"
                          onClick={() => { if (detailId === p.id) { setDetailId(null); setDetail(null); } else openDetail(p.id); }}
                          className="w-full text-left bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:border-[#E3B552]/30 transition-colors"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <span className="text-sm font-bold text-white block truncate">{p.name}</span>
                            <span className="font-mono text-xs text-gray-400 uppercase block">
                              {p.style || '-'} • {fmtDate(p.created_at)} {loteNome ? `• ${loteNome}` : ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5 shrink-0">
                            {p.status === 'awaiting_members' && !p.batch_id && (
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded font-mono uppercase border bg-red-500/10 text-red-300 border-red-500/30">sem reserva</span>
                            )}
                            {p.status === 'awaiting_members' && (
                              <span className="text-[11px] font-black px-2 py-0.5 rounded font-mono uppercase border bg-amber-500/15 text-amber-300 border-amber-500/40">Não-pago</span>
                            )}
                            {p.status === 'paid' && (
                              <span className="text-[11px] font-black px-2 py-0.5 rounded font-mono uppercase border bg-[#10B981]/15 text-[#10B981] border-[#10B981]/40">Pago ✓</span>
                            )}
                            <span className="flex items-center gap-1 font-mono text-[11px] font-bold text-[#F0C265] uppercase"><Eye className="w-3 h-3" /> {detailId === p.id ? 'Fechar' : 'Ficha'}</span>
                          </div>
                        </button>
                        {detailId === p.id && (
                          <div className="pt-3">
                            {(() => {
                              const sub = detail?.sub as { amount_paid?: number; status?: string; batch_name?: string; charge_id?: string; paid_at?: string | null } | null | undefined;
                              const proj = (detail?.proj || {}) as Record<string, string | null>;
                              return (
                  <div className="space-y-4">
                    <button type="button" onClick={() => { setDetailId(null); setDetail(null); }} className={btnGhost}>× Fechar ficha</button>
                    {isDev && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm(`EXCLUIR "${p.name}" permanentemente?\n\nTodos os integrantes, pagamentos e registros dessa banda serão apagados. Ação irreversível.`)) return;
                          setBusy('del-' + p.id);
                          const { error } = await supabase.rpc('dev_delete_band', { p_id: p.id });
                          setBusy(null);
                          if (error) { setMsg('del-' + p.id, 'err', 'Erro: ' + error.message); return; }
                          setDetailId(null); setDetail(null);
                          await loadProjects();
                          setMsg('del', 'ok', 'Banda excluída e vagas restauradas.');
                        }}
                        disabled={busy === 'del-' + p.id}
                        className="font-mono text-xs font-bold text-red-300 border border-red-500/40 px-4 py-2.5 rounded-lg uppercase hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                      >
                        {busy === 'del-' + p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '🗑 Excluir banda (dev)'}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={async () => {
                        setBusy('portal-' + p.id);
                        try {
                          const { data: token, error } = await supabase.rpc('create_portal_bypass', { p_code: detail?.invite_code });
                          setBusy(null);
                          if (error || !token) { setMsg('portal-' + p.id, 'err', 'Erro: ' + (error?.message || 'sem token')); return; }
                          const w = window.open(`/minha-inscricao?k=${detail?.invite_code}&t=${token}`, '_blank');
                          if (!w) window.location.href = `/minha-inscricao?k=${detail?.invite_code}&t=${token}`;
                        } catch { setBusy(null); setMsg('portal-' + p.id, 'err', 'Falha de conexão.'); }
                      }}
                      disabled={busy === 'portal-' + p.id || !detail?.invite_code}
                      className={btnGold}
                    >
                      {busy === 'portal-' + p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Abrir portal da banda (sem CPF) ↗'}
                    </button>
                    {notice['portal-' + p.id] && <span className="font-mono text-[11px] text-red-300">{notice['portal-' + p.id].msg}</span>}

                    <div className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-5">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-4">
                        <div>
                          <h3 className="font-display font-black text-xl text-white uppercase leading-tight">{p.name}</h3>
                          <span className="font-mono text-xs text-gray-400 uppercase block mt-1">{p.style || '-'} • cadastrada em {fmtDate(p.created_at)}</span>
                        </div>
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded font-mono uppercase border shrink-0 ${st.cls}`}>{st.label}</span>
                      </div>

                      {canSubs && p.status === 'awaiting_members' && (
                        <div className="flex items-center gap-2.5 flex-wrap bg-black/30 border border-white/5 rounded-xl p-3">
                          <span className="font-mono text-[11px] text-gray-400 uppercase tracking-widest font-bold">Vaga do lote:</span>
                          {p.batch_id && (
                            <button type="button" onClick={() => returnSlot(p)} disabled={busy === `ret-${p.id}`} className="font-mono text-xs font-bold text-white border border-white/20 px-3 py-1.5 rounded-lg uppercase hover:bg-white/5 disabled:opacity-50">
                              {busy === `ret-${p.id}` ? '...' : 'Devolver ao pool'}
                            </button>
                          )}
                          <button type="button" onClick={() => grantSlot(p)} disabled={busy === `grant-${p.id}`} className="bg-[#10B981] text-black font-mono text-xs font-bold px-3 py-1.5 rounded-lg uppercase disabled:opacity-50">
                            {busy === `grant-${p.id}` ? '...' : 'Conceder vaga (ativar)'}
                          </button>
                          {notice[`ret-${p.id}`] && <span className="font-mono text-[11px] text-gray-400">{notice[`ret-${p.id}`].msg}</span>}
                          {notice[`grant-${p.id}`] && <span className="font-mono text-[11px] text-gray-400">{notice[`grant-${p.id}`].msg}</span>}
                        </div>
                      )}

                      {canSubs && (
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-mono text-[11px] text-gray-400 uppercase tracking-widest font-bold">Etapa atual do concurso:</span>
                          <select
                            className="bg-[#05070B] border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-xs outline-none focus:border-[#E3B552] font-mono"
                            value={String((detail?.proj as Record<string, unknown> | null)?.stage ?? 1)}
                            disabled={busy === 'stage'}
                            onChange={async (e) => {
                              const nv = Number(e.target.value);
                              setBusy('stage');
                              const { error } = await supabase.rpc('set_project_stage', { p_id: p.id, p_stage: nv });
                              setBusy(null);
                              if (!error) { await loadProjects(); await openDetail(p.id); }
                              else setMsg('stage', 'err', 'Erro ao definir etapa: ' + error.message);
                            }}
                          >
                            <option value="1">Etapa 1 - Ao Vivo</option>
                            <option value="2">Etapa 2 - Podcast</option>
                            <option value="3">Etapa 3 - Grande Final</option>
                          </select>
                          {notice['stage'] && <Notice kind={notice['stage'].kind}>{notice['stage'].msg}</Notice>}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2 space-y-1">
                          <span className="font-mono text-xs text-gray-400 uppercase font-bold block">BIOGRAFIA OFICIAL:</span>
                          <p className="text-xs text-gray-200 leading-relaxed">{proj.bio || '-'}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="font-mono text-xs text-gray-400 uppercase font-bold block">INSTAGRAM:</span>
                          {proj.instagram
                            ? <a href={`https://instagram.com/${String(proj.instagram).replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-[#F0C265] font-bold text-xs font-mono hover:underline break-all">{String(proj.instagram)}</a>
                            : <span className="text-xs text-gray-500 font-mono">-</span>}
                        </div>
                        <div className="space-y-1">
                          <span className="font-mono text-xs text-gray-400 uppercase font-bold block">LINK DA MÚSICA / VÍDEO:</span>
                          {proj.video_link
                            ? <a href={String(proj.video_link)} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-xs font-mono break-all">{String(proj.video_link)}</a>
                            : <span className="text-xs text-gray-500 font-mono">-</span>}
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <span className="font-mono text-xs text-gray-400 uppercase font-bold block">FOTO DE DIVULGAÇÃO ENVIADA:</span>
                          {proj.photo_url && String(proj.photo_url).startsWith('http') ? (
                            <img
                              src={String(proj.photo_url)}
                              alt={`Foto de divulgação de ${p.name}`}
                              className="w-full max-w-[220px] h-32 object-cover rounded-xl border border-white/10 cursor-zoom-in hover:border-[#E3B552]/50 transition-colors"
                              onClick={() => setPhotoView(String(proj.photo_url))}
                            />
                          ) : (
                            <span className="text-xs text-gray-500 font-mono">Nenhuma foto foi enviada nesta inscrição.</span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <span className="font-mono text-[11px] text-[#F0C265] font-bold uppercase tracking-widest block">
                          Integrantes ({detail?.members.length ?? 0}){!canSensitive && detail && detail.members.length > 0 && <span className="text-gray-500"> • dados pessoais restritos</span>}
                        </span>
                        <div className="space-y-2">
                          {(detail?.members || []).map((m, i) => (
                            <div key={i} className={`p-3 rounded-xl border ${m.is_responsible ? 'border-[#F0C265]/20 bg-[#F0C265]/5' : 'border-white/5 bg-black/30'}`}>
                              <div className="flex justify-between items-center gap-2">
                                <span className="text-xs font-bold text-white">{m.name} {m.is_responsible && <span className="font-mono text-xs text-[#F0C265] uppercase">(líder responsável)</span>}</span>
                                <span className="flex items-center gap-2 shrink-0">
                                  {m.payment_status && (
                                    <span className={`font-mono text-[11px] font-bold uppercase px-2 py-0.5 rounded border ${m.payment_status === 'paid' ? 'text-[#10B981] border-[#10B981]/30 bg-[#10B981]/10' : 'text-amber-500 border-amber-500/30 bg-amber-500/10'}`}>
                                      {m.payment_status === 'paid' ? 'parte paga' : m.claimed_at ? 'confirmou · não pagou' : 'não apareceu'}
                                    </span>
                                  )}
                                  {canSubs && m.payment_status !== 'paid' && m.claimed_at && m.id && (
                                    <button type="button" onClick={async () => {
                                      setBusy(`mem-${m.id}`);
                                      const { error } = await supabase.rpc('staff_confirm_member_payment', { p_member_id: m.id });
                                      setBusy(null);
                                      if (!error) await openDetail(p.id); else setMsg(`mem-${m.id}`, 'err', 'Erro ao confirmar.');
                                    }} disabled={busy === `mem-${m.id}`} className="bg-[#10B981] text-black font-mono text-[11px] font-bold px-2 py-1 rounded uppercase disabled:opacity-50">
                                      {busy === `mem-${m.id}` ? '...' : 'Marcar como pago'}
                                    </button>
                                  )}
                                  {isDev && m.payment_status !== 'paid' && m.id && (
                                    removing === m.id ? (
                                      <span className="flex items-center gap-1">
                                        <button type="button" onClick={async () => {
                                          setBusy(`rm-${m.id}`);
                                          const { error } = await supabase.rpc('staff_remove_member', { p_member_id: m.id });
                                          setBusy(null);
                                          if (error) { setMsg(`rm-${m.id}`, 'err', 'Erro: ' + error.message); return; }
                                          setRemoving(null);
                                          await openDetail(p.id);
                                          setMsg(`rm-${m.id}`, 'ok', 'Integrante removido.');
                                        }} disabled={busy === `rm-${m.id}`} className="bg-red-600 text-white font-mono text-[11px] font-bold px-2.5 py-1 rounded uppercase">Confirmar remoção</button>
                                        <button onClick={() => setRemoving(null)} className="text-gray-400 hover:text-white px-1">×</button>
                                      </span>
                                    ) : (
                                      <button onClick={() => setRemoving(m.id!)} className="font-mono text-[11px] font-bold text-red-400/80 hover:text-red-400 uppercase border border-red-500/30 px-2 py-1 rounded">Excluir</button>
                                    )
                                  )}
                                </span>
                                <span className="font-mono text-[11px] text-gray-500">#{i + 1}</span>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 font-mono text-xs text-gray-300">
                                <span>CPF: {m.cpf || '-'}</span>
                                <span>Nasc.: {m.birth_date || '-'}</span>
                                <span>WhatsApp: {m.phone || '-'}</span>
                                <span>E-mail: {(m as any).email || '-'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2 bg-black/40 border border-white/5 rounded-xl p-4">
                        <span className="font-mono text-[11px] text-[#F0C265] font-bold uppercase tracking-widest block">Recibo da cobrança{detail && detail.subsTotal > 1 ? ` (mais recente de ${detail.subsTotal})` : ''}{detail?.invite_code ? ' - convite: link ativo' : ' - modelo antigo (pagamento único)'}</span>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs text-gray-300">
                          <span>Valor: <strong className="text-[#10B981]">{sub?.amount_paid != null ? `R$ ${sub.amount_paid},00` : '-'}</strong></span>
                          <span>Lote: {sub?.batch_name || '-'}</span>
                          <span>Cobrança: {sub?.status || '-'}</span>
                          <span>ID: {sub?.charge_id ? String(sub.charge_id).slice(0, 18) : '-'}</span>
                          <span className="md:col-span-2">Pago em: {fmtDate(sub?.paid_at ?? null)}</span>
                        </div>
                      </div>

                      {detail && detail.member_edits && detail.member_edits.length > 0 && (
                        <div className="space-y-2 bg-black/40 border border-amber-500/20 rounded-xl p-4">
                          <span className="font-mono text-[11px] text-amber-400 font-bold uppercase tracking-widest block">Histórico de edições dos integrantes</span>
                          {detail.member_edits.map((e: Record<string, unknown>, i: number) => (
                            <div key={i} className="font-mono text-xs text-gray-300 border-b border-white/5 pb-1.5 last:border-none">
                              <strong className="text-white">{String(e.member)}</strong> alterou <span className="text-amber-400">{String(e.field)}</span>:
                              <span className="text-red-400/80 line-through"> {String(e.old_value)}</span> → <span className="text-[#10B981]">{String(e.new_value)}</span>
                              <span className="text-gray-500"> • {fmtDate(String(e.created_at))}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {(detail?.scores?.length ?? 0) > 0 && (
                        <div className="space-y-2 bg-black/40 border border-white/5 rounded-xl p-4">
                          <span className="font-mono text-[11px] text-[#F0C265] font-bold uppercase tracking-widest block">Notas do júri</span>
                          {detail!.scores.map((sc, i) => (
                            <div key={i} className="flex flex-wrap justify-between gap-2 font-mono text-xs text-gray-300 border-b border-white/5 pb-1.5 last:border-none">
                              <span className="text-white font-bold">{sc.juror}</span>
                              <span>Apres. {sc.presentation} • Compos. {sc.composition} • Estét. {sc.aesthetics} • Média <strong className="text-[#F0C265]">{((sc.presentation + sc.composition + sc.aesthetics) / 3).toFixed(1)}</strong></span>
                              {sc.notes && <span className="w-full text-gray-500">“{sc.notes}”</span>}
                            </div>
                          ))}
                        </div>
                      )}

                      {canSubs && (
                        <div className="border-t border-white/5 pt-4 space-y-2">
                          <span className="font-mono text-[11px] text-gray-400 uppercase tracking-widest block font-bold">Ações sobre esta inscrição</span>
                          <div className="flex flex-wrap gap-2.5">
                            {(p.status === 'pending' || p.status === 'failed') && (
                              <button type="button" onClick={() => confirmPayment(p)} disabled={busy === `pay-${p.id}`} className="bg-[#10B981] text-black font-mono text-[11px] font-bold px-3 py-2 rounded uppercase disabled:opacity-50">
                                {busy === `pay-${p.id}` ? '...' : 'Confirmar pagamento'}
                              </button>
                            )}
                            {p.status === 'paid' && (
                              <button type="button" onClick={() => setProjectState(p, 'suspended', 'Inscrição suspensa.')} disabled={busy === `st-${p.id}`} className="bg-orange-500 text-black font-mono text-[11px] font-bold px-3 py-2 rounded uppercase disabled:opacity-50">Suspender</button>
                            )}
                            {p.status !== 'blocked' && (
                              <button type="button" onClick={() => setProjectState(p, 'blocked', 'Inscrição bloqueada.')} disabled={busy === `st-${p.id}`} className="bg-red-600 text-white font-mono text-[11px] font-bold px-3 py-2 rounded uppercase disabled:opacity-50">Bloquear</button>
                            )}
                            {p.status === 'paid' && (
                              <button type="button" onClick={() => setProjectState(p, 'refunded', 'Inscrição marcada como reembolsada.')} disabled={busy === `st-${p.id}`} className="bg-white/10 text-gray-300 font-mono text-[11px] font-bold px-3 py-2 rounded uppercase border border-white/10 disabled:opacity-50">Marcar reembolsada</button>
                            )}
                            {(p.status === 'suspended' || p.status === 'blocked' || p.status === 'refunded') && (
                              <button type="button" onClick={() => setProjectState(p, 'paid', 'Inscrição reativada como paga.')} disabled={busy === `st-${p.id}`} className="bg-[#10B981] text-black font-mono text-[11px] font-bold px-3 py-2 rounded uppercase disabled:opacity-50">Reativar (paga)</button>
                            )}
                            {(p.status === 'blocked' || p.status === 'suspended') && (
                              <button type="button" onClick={() => setProjectState(p, 'awaiting_members', 'Inscrição devolvida para aguardando pagamentos.')} disabled={busy === `st-${p.id}`} className="bg-white/10 text-gray-300 font-mono text-[11px] font-bold px-3 py-2 rounded uppercase border border-white/10 disabled:opacity-50">Devolver (aguardando)</button>
                            )}
                          </div>
                          {notice[`st-${p.id}`] && <Notice kind={notice[`st-${p.id}`].kind}>{notice[`st-${p.id}`].msg}</Notice>}
                          <p className="text-xs text-gray-500 font-mono leading-relaxed">Estas ações alteram apenas o estado da inscrição - os dados cadastrados pela banda permanecem intactos para análise da gerência.</p>
                        </div>
                      )}
                    </div>
                  </div>
                              );
                            })()}
                          </div>
                        )}
                        </div>
                      );
                    })}
                  </div>

                  {totalCount > 0 && (
                    <div className="flex justify-between items-center border-t border-white/5 pt-4">
                      <button type="button" disabled={page === 0 || busy !== null} onClick={() => setPage(p => Math.max(0, p - 1))} className={btnGhost}>← Anterior</button>
                      <span className="font-mono text-xs text-gray-400 uppercase">Página {page + 1} de {Math.ceil(totalCount / PAGE_SIZE)}</span>
                      <button type="button" disabled={(page + 1) * PAGE_SIZE >= totalCount || busy !== null} onClick={() => setPage(p => p + 1)} className={btnGhost}>Próxima →</button>
                    </div>
                  )}
                </div>
            </div>
          )}

          {/* AVALIAÇÃO */}
          {tab === 'avaliacao' && isJudge && (() => {
            const paidProjects = projects.filter(p => p.status === 'paid');
            const q = jurySearch.trim().toLowerCase();
            const juryList = q ? paidProjects.filter(p => p.name.toLowerCase().includes(q)) : paidProjects;
            return (
            <div className="space-y-4 fade-up-800">
              <Notice kind="info">Somente inscrições com pagamento confirmado entram na avaliação. Abra uma banda para ver a ficha artística e registrar as notas (0 a 10) - sua nota pode ser ajustada a qualquer momento.</Notice>
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
                          <span className="font-mono text-xs text-gray-400 uppercase block">{p.style || '-'} • {p.members?.[0]?.count ?? 0} integrante{(p.members?.[0]?.count ?? 0) === 1 ? '' : 's'}</span>
                        </div>
                        <span className="font-mono text-lg text-[#F0C265] font-black shrink-0">{avg}</span>
                      </button>

                      {openJury === p.id && (
                        <div className="space-y-4 border-t border-white/5 pt-4">
                          <div className="space-y-2">
                            <span className="font-mono text-[11px] text-gray-400 uppercase tracking-widest block font-bold">Ficha artística</span>
                            <p className="text-xs text-gray-200 leading-relaxed">{p.bio || 'Sem biografia cadastrada.'}</p>
                            <div className="flex flex-wrap gap-3 font-mono text-xs">
                              {p.instagram && <a href={`https://instagram.com/${String(p.instagram).replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-[#F0C265] hover:underline">{String(p.instagram)}</a>}
                              {p.video_link && <a href={String(p.video_link)} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">ouvir/ver música ↗</a>}
                              <span className="text-gray-500">foto: {p.photo_url ? 'enviada ✓' : '-'}</span>
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

          {/* FUNIL - componente extraido (components/painel/FunilTab.tsx) */}
          {tab === 'funil' && canSubs && (
            <FunilTab funnel={funnel} funnelDays={funnelDays} setFunnelDays={setFunnelDays} loadFunnel={loadFunnel} />
          )}

          {/* GRUPO VIP - componente extraido */}
          {tab === 'vip' && canVip && (
            <VipTab canVip={canVip} vip={vip} setVip={setVip} saveVip={saveVip} loadVip={loadVip} loadVipLeads={loadVipLeads} vipLeads={vipLeads} homeCtaMode={homeCtaMode} changeHomeCtaMode={changeHomeCtaMode} homeMode={homeMode} changeHomeMode={changeHomeMode} isDev={isDev} busy={busy} setBusy={setBusy} notice={notice} setMsg={setMsg} fmtDate={fmtDate} supabase={supabase} Field={Field} Notice={Notice} />
          )}

          {/* GATEWAY - componente extraido */}
          {tab === 'gateway' && canGateway && (
            <GatewayTab gwState={gwState} mpToken={mpToken} setMpToken={setMpToken} mpSecret={mpSecret} setMpSecret={setMpSecret} mpPublicKey={mpPublicKey} setMpPublicKey={setMpPublicKey} saveGateway={saveGateway} busy={busy} notice={notice} setMsg={setMsg} guarded={guarded} Notice={Notice} />
          )}

          {/* EQUIPE - componente extraido */}
          {tab === 'equipe' && canTeam && (
            <EquipeTab isDev={isDev} me={me} staffList={staffList} setStaffList={setStaffList} disableStaff={disableStaff} saveStaff={saveStaff} createMember={createMember} invite={invite} setInvite={setInvite} busy={busy} notice={notice} Field={Field} Notice={Notice} />
          )}

          {/* AUDITORIA - componente extraido */}
          {tab === 'auditoria' && canAudit && (
            <AuditoriaTab audit={audit} openAuditTab={openAuditTab} fmtDate={fmtDate} />
          )}

          {/* MINHA CONTA - componente extraido */}
          {tab === 'conta' && (
            <MinhaContaTab newName={newName} setNewName={setNewName} saveOwnName={saveOwnName} pw1={pw1} setPw1={setPw1} pw2={pw2} setPw2={setPw2} savePassword={savePassword} busy={busy} notice={notice} Field={Field} Notice={Notice} />
          )}

          <div className="border-t border-white/5 mt-8 pt-5 text-center">
            <span className="font-mono text-[11px] text-[#5C5248] uppercase tracking-widest">Estúdio Pedra Profana • Área interna</span>
          </div>
        </div>
      )}

      {/* VISUALIZADOR DE FOTO EM TELA CHEIA */}
      {photoView && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-6" onClick={() => setPhotoView(null)}>
          <img
            src={photoView}
            alt="Foto de divulgação ampliada"
            className="legal-pop max-h-[80vh] max-w-full rounded-2xl border-2 border-[#F0C265]/40 shadow-2xl"
          />
          <button type="button" className="mt-5 font-mono text-xs text-gray-400 hover:text-white uppercase tracking-widest border border-white/10 px-4 py-2 rounded-full">
            Fechar
          </button>
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
      <button type="button" onClick={onDelete} className="font-mono text-[11px] font-bold px-2 py-1 rounded uppercase bg-red-600 text-white">Confirmar</button>
      <button type="button" onClick={() => setArmed(false)} className="p-1 text-gray-400 hover:text-white"><X className="w-3.5 h-3.5" /></button>
    </span>
  );
}
