'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import {
  Shield, LayoutDashboard, Tags, FileText, ClipboardList, Users, UserCog,
  LogOut, Check, X, Plus, ArrowUp, ArrowDown, Trash2, KeyRound, Loader2
} from 'lucide-react';

interface StaffRow {
  id: string;
  email: string;
  display_name: string;
  role: 'dev' | 'admin';
  permissions: { manage_lotes?: boolean; manage_content?: boolean; manage_subscriptions?: boolean };
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
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [settingDrafts, setSettingDrafts] = useState<Record<string, string>>({});
  const [faqs, setFaqs] = useState<FaqRow[]>([]);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });
  const [projects, setProjects] = useState<ProjectRow[]>([]);

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
  const perms = me?.permissions || {};
  const canLotes = isDev || !!perms.manage_lotes;
  const canContent = isDev || !!perms.manage_content;
  const canSubs = isDev || !!perms.manage_subscriptions;

  const loadStaff = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setAuthed(false); setMe(null); return false; }
    const { data, error } = await supabase.from('staff_users').select('*');
    if (error || !data || data.length === 0) { setAuthed(false); setMe(null); return false; }
    const self = data.find((r: StaffRow) => r.id === user.id) || null;
    if (!self) { setAuthed(false); setMe(null); return false; }
    setMe(self);
    setNewName(self.display_name || '');
    setStaffList(data as StaffRow[]);
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

  const loadProjects = useCallback(async () => {
    const { data } = await supabase
      .from('projects')
      .select('id, name, style, status, created_at, members(count), subscriptions(status, amount_paid, batches(name))')
      .order('created_at', { ascending: false })
      .limit(100);
    if (data) setProjects(data as unknown as ProjectRow[]);
  }, []);

  useEffect(() => {
    (async () => {
      const ok = await loadStaff();
      if (ok) {
        await Promise.all([loadBatches(), loadSettings(), loadFaqs(), loadProjects()]);
      }
      setBooting(false);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((evt) => {
      if (evt === 'SIGNED_OUT') { setAuthed(false); setMe(null); setStaffList([]); }
    });
    return () => sub.subscription.unsubscribe();
  }, [loadStaff, loadBatches, loadSettings, loadFaqs, loadProjects]);

  useEffect(() => {
    if (!authed) return;
    const available = ['visao'];
    if (canLotes) available.push('lotes');
    if (canContent) available.push('conteudo');
    if (canSubs) available.push('inscritos');
    if (isDev) available.push('equipe');
    available.push('conta');
    setTab(t => (available.includes(t) ? t : available[0]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

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
    await Promise.all([loadBatches(), loadSettings(), loadFaqs(), loadProjects()]);
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

    const { data, error } = await supabase
      .from('batches')
      .update({
        name: d.name.trim(),
        price_per_member: price,
        vagas_total: vTotal,
        vagas_restantes: vRest,
        starts_at: fromInputValue(d.starts),
        ends_at: fromInputValue(d.ends),
      })
      .eq('id', b.id)
      .select();
    if (error) return 'Erro ao salvar: ' + error.message;
    if (!data || data.length === 0) return 'Sem permissão para salvar.';
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
  const saveSetting = (key: string, label: string) => guarded(`set-${key}`, async () => {
    const v = settingDrafts[key];
    const iso = fromInputValue(v);
    if (v && !iso) return 'Data inválida.';
    const { error } = await supabase.from('site_settings').upsert({ key, value: iso ?? '' }, { onConflict: 'key' });
    if (error) return 'Erro ao salvar: ' + error.message;
    await loadSettings();
    setMsg(`set-${key}`, 'ok', `${label} atualizado no site.`);
    return 'ok';
  });

  const saveFaq = (item: FaqRow) => guarded(`faq-${item.id}`, async () => {
    if (!item.question.trim() || !item.answer.trim()) return 'Pergunta e resposta são obrigatórias.';
    const { data, error } = await supabase
      .from('faq_items')
      .update({ question: item.question, answer: item.answer, active: item.active, sort_order: item.sort_order })
      .eq('id', item.id)
      .select();
    if (error) return 'Erro ao salvar: ' + error.message;
    if (!data || data.length === 0) return 'Sem permissão para salvar.';
    setMsg(`faq-${item.id}`, 'ok', 'Pergunta atualizada no site.');
    return 'ok';
  });

  const deleteFaq = (item: FaqRow) => guarded(`faq-del-${item.id}`, async () => {
    const { error } = await supabase.from('faq_items').delete().eq('id', item.id);
    if (error) return 'Erro ao remover.';
    await loadFaqs();
    setMsg('faq-list', 'ok', 'Pergunta removida do site.');
    return 'ok';
  });

  const addFaq = () => guarded('faq-add', async () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) return 'Preencha pergunta e resposta.';
    const maxOrder = faqs.reduce((m, f) => Math.max(m, f.sort_order), -1);
    const { error } = await supabase.from('faq_items').insert({
      question: newFaq.question.trim(), answer: newFaq.answer.trim(), sort_order: maxOrder + 1, active: true
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
    await supabase.from('faq_items').update({ sort_order: other.sort_order }).eq('id', cur.id);
    await supabase.from('faq_items').update({ sort_order: cur.sort_order }).eq('id', other.id);
    await loadFaqs();
    return 'ok';
  });

  // ---------- inscrições ----------
  const confirmPayment = (p: ProjectRow) => guarded(`pay-${p.id}`, async () => {
    const { error: e1 } = await supabase.from('projects').update({ status: 'paid' }).eq('id', p.id);
    if (e1) return 'Erro ao confirmar: ' + e1.message;
    const { error: e2 } = await supabase
      .from('subscriptions')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('project_id', p.id);
    if (e2) return 'Erro na cobrança: ' + e2.message;
    const { data: activeBatch } = await supabase.from('batches').select('*').eq('status', 'ativo').single();
    if (activeBatch) {
      await supabase.from('batches').update({ vagas_restantes: Math.max(0, activeBatch.vagas_restantes - 1) }).eq('id', activeBatch.id);
    }
    await Promise.all([loadProjects(), loadBatches()]);
    setMsg(`pay-${p.id}`, 'ok', 'Pagamento confirmado. Status já visível no portal do candidato.');
    return 'ok';
  });

  // ---------- equipe ----------
  const saveStaff = (s: StaffRow) => guarded(`staff-${s.id}`, async () => {
    const { data, error } = await supabase
      .from('staff_users')
      .update({ display_name: s.display_name?.trim() || '', role: s.role, permissions: s.permissions })
      .eq('id', s.id)
      .select();
    if (error) return 'Erro ao salvar: ' + error.message;
    if (!data || data.length === 0) return 'Operação não permitida.';
    await loadStaff();
    setMsg(`staff-${s.id}`, 'ok', 'Membro atualizado. O painel dele já reflete as mudanças no próximo acesso.');
    return 'ok';
  });

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
              { id: 'visao', label: 'Visão geral', icon: LayoutDashboard, show: true },
              { id: 'lotes', label: 'Lotes', icon: Tags, show: canLotes },
              { id: 'conteudo', label: 'Conteúdo do site', icon: FileText, show: canContent },
              { id: 'inscritos', label: 'Inscrições', icon: ClipboardList, show: canSubs },
              { id: 'equipe', label: 'Equipe', icon: Users, show: isDev },
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
              <Notice kind="info">Ativar um lote ajusta os demais automaticamente (anteriores ficam encerrados, seguintes em breve) e sincroniza a data exibida no site.</Notice>
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
                  { key: 'countdown_target', label: 'Fim do lote vigente (contagem regressiva)' },
                  { key: 'live_launch', label: 'Lançamento oficial da live' },
                ].map(s => (
                  <div key={s.key} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
                    <Field label={`${s.label} — atual: ${fmtDate(settings[s.key])}`}>
                      <input type="datetime-local" className={inputCls} value={settingDrafts[s.key] ?? ''} onChange={(e) => setSettingDrafts(p => ({ ...p, [s.key]: e.target.value }))} />
                    </Field>
                    <button type="button" onClick={() => saveSetting(s.key, s.label)} disabled={busy === `set-${s.key}`} className={btnGold}>
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
              {notice['faq-list'] && <Notice kind={notice['faq-list'].kind}>{notice['faq-list'].msg}</Notice>}
              <div className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4">
                <h3 className="font-display font-bold text-white uppercase border-b border-white/5 pb-3">Inscrições recentes ({projects.length})</h3>
                {projects.length === 0 && <p className="text-xs text-gray-400 font-mono">Nenhuma inscrição ainda.</p>}
                <div className="space-y-3">
                  {projects.map(p => {
                    const sub = p.subscriptions?.[0];
                    const count = p.members?.[0]?.count ?? 0;
                    return (
                      <div key={p.id} className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="space-y-0.5 min-w-0">
                          <span className="text-sm font-bold text-white block truncate">{p.name}</span>
                          <span className="font-mono text-[10px] text-gray-400 uppercase block">
                            {p.style || '—'} • {count} integrante{count === 1 ? '' : 's'} • {fmtDate(p.created_at)} {sub?.batches?.name ? `• ${sub.batches.name}` : ''} {sub?.amount_paid ? `• R$ ${sub.amount_paid},00` : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase border ${
                            p.status === 'paid' ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                            : p.status === 'failed' ? 'bg-red-500/15 text-red-400 border-red-500/30'
                            : 'bg-amber-500/15 text-amber-500 border-amber-500/30'}`}>
                            {p.status === 'paid' ? 'paga' : p.status === 'failed' ? 'negada' : 'pendente'}
                          </span>
                          {p.status === 'pending' && (
                            <button type="button" onClick={() => confirmPayment(p)} disabled={busy === `pay-${p.id}`} className="bg-[#10B981] text-black font-mono text-[9px] font-bold px-3 py-1.5 rounded uppercase disabled:opacity-50">
                              {busy === `pay-${p.id}` ? '...' : 'Confirmar pagamento'}
                            </button>
                          )}
                          {notice[`pay-${p.id}`] && <span className="hidden">{notice[`pay-${p.id}`].msg}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {notice['inscritos'] && <Notice kind={notice['inscritos'].kind}>{notice['inscritos'].msg}</Notice>}
              </div>
            </div>
          )}

          {/* EQUIPE */}
          {tab === 'equipe' && isDev && (
            <div className="space-y-4 fade-up-800">
              <Notice kind="info">Funções salvas aqui passam a valer imediatamente no painel de cada membro. A senha de cada membro é alterada por ele mesmo em &quot;Minha conta&quot;.</Notice>
              {staffList.map(s => {
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
                      <span className={`font-mono text-[9px] font-bold px-2.5 py-1 rounded-full uppercase border ${cur.role === 'dev' ? 'text-[#F0C265] border-[#F0C265]/40 bg-[#F0C265]/10' : 'text-gray-400 border-white/10 bg-white/5'}`}>
                        {cur.role}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-4">
                      <Field label="Nome de exibição">
                        <input className={inputCls} value={cur.display_name} disabled={self} onChange={(e) => upd({ display_name: e.target.value })} />
                      </Field>
                      <Field label="Nível de acesso">
                        <select className={inputCls} value={cur.role} disabled={self} onChange={(e) => upd({ role: e.target.value as 'dev' | 'admin' })}>
                          <option value="admin">admin</option>
                          <option value="dev">dev</option>
                        </select>
                      </Field>
                    </div>

                    <div className="space-y-2">
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
              })}
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
