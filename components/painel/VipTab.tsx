'use client';

// Aba GRUPO VIP do painel /sagrado — extraída 1:1 do page.tsx (17/09, dívida técnica).
import { Loader2 } from 'lucide-react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { inputCls, btnGold, btnGhost } from './ui';

interface VipTabProps {
  canVip: boolean;
  vip: Record<string, string>;
  setVip: (updater: (p: Record<string, string>) => Record<string, string>) => void;
  saveVip: (key: string, label: string, kind?: 'text' | 'url' | 'bool') => Promise<void>;
  loadVip: () => void;
  loadVipLeads: () => void;
  vipLeads: Array<Record<string, unknown>>;
  homeCtaMode: string;
  changeHomeCtaMode: (m: 'waitlist' | 'quiz') => void;
  homeMode: string;
  changeHomeMode: (m: 'classic' | 'vip') => void;
  isDev: boolean;
  busy: string | null;
  setBusy: (v: string | null) => void;
  notice: Record<string, { kind: 'ok' | 'err' | 'info'; msg: string }>;
  setMsg: (k: string, kind: 'ok' | 'err' | 'info', msg: string) => void;
  fmtDate: (v: string | null | undefined) => string;
  supabase: SupabaseClient;
  Field: (p: { label: string; children: React.ReactNode }) => JSX.Element;
  Notice: (p: { kind: 'ok' | 'err' | 'info'; children: React.ReactNode }) => JSX.Element | null;
}

export default function VipTab({ canVip, vip, setVip, saveVip, loadVip, loadVipLeads, vipLeads, homeCtaMode, changeHomeCtaMode, homeMode, changeHomeMode, isDev, busy, setBusy, notice, setMsg, fmtDate, supabase, Field, Notice }: VipTabProps) {
  if (!canVip) return null;
  const fields: Array<{ key: string; label: string; kind?: 'text' | 'url' }> = [
    { key: 'vip_badge', label: 'Selo (acima do título)' },
    { key: 'vip_title_start', label: 'Título, parte fixa' },
    { key: 'vip_title_highlight', label: 'Título, palavra destacada em dourado' },
    { key: 'vip_subtitle', label: 'Subtítulo' },
    { key: 'vip_benefit1_title', label: 'Benefício 1, título' },
    { key: 'vip_benefit1_desc', label: 'Benefício 1, descrição' },
    { key: 'vip_benefit2_title', label: 'Benefício 2, título' },
    { key: 'vip_benefit2_desc', label: 'Benefício 2, descrição' },
    { key: 'vip_benefit3_title', label: 'Benefício 3, título' },
    { key: 'vip_benefit3_desc', label: 'Benefício 3, descrição' },
    { key: 'vip_whatsapp_url', label: 'Link do grupo no WhatsApp', kind: 'url' },
  ];
  const active = vip['vip_active'] === 'true';
  return (
    <div className="space-y-4 fade-up-800">
      <Notice kind="info">Tudo aqui atualiza a página /grupovip no ar imediatamente após salvar.</Notice>

      <div className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-3">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <span className="font-mono text-[11px] text-[#F0C265] uppercase tracking-widest font-black block">Botão Inscrever-se (home)</span>
            <span className="text-xs text-gray-400 leading-snug block mt-1">
              {homeCtaMode === 'waitlist'
                ? 'Pré-inscrição: abre o popup de e-mail + entrada no Grupo VIP.'
                : 'Inscrições ativas: abre o quiz de inscrição completo.'}
            </span>
          </div>
          <div className="flex gap-2 shrink-0">
            <button type="button" onClick={() => changeHomeCtaMode('waitlist')} disabled={busy === 'homecta' || homeCtaMode === 'waitlist'} className={`font-mono text-[11px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl border transition-colors ${homeCtaMode === 'waitlist' ? 'bg-[#F0C265] text-black border-black' : 'text-gray-400 border-white/10 bg-white/5 hover:text-white'}`}>
              Pré-inscrição
            </button>
            <button type="button" onClick={() => changeHomeCtaMode('quiz')} disabled={busy === 'homecta' || homeCtaMode === 'quiz'} className={`font-mono text-[11px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl border transition-colors ${homeCtaMode === 'quiz' ? 'bg-[#F0C265] text-black border-black' : 'text-gray-400 border-white/10 bg-white/5 hover:text-white'}`}>
              Inscrições abertas
            </button>
          </div>
        </div>
        {notice['homecta'] && <Notice kind={notice['homecta'].kind}>{notice['homecta'].msg}</Notice>}
      </div>

      <div className="bg-[#0B0F19]/60 backdrop-blur-xl border-2 border-[#E3B552]/40 rounded-2xl p-5 space-y-3">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <span className="font-mono text-[11px] text-[#F0C265] uppercase tracking-widest font-black block">Página principal do site</span>
            <span className="text-xs text-gray-400 leading-snug block mt-1">
              {homeMode === 'vip'
                ? 'O domínio principal abre o Grupo VIP. A landing clássica continua acessível em /v2.'
                : 'O domínio principal abre a landing clássica (hoje em /v2). O Grupo VIP fica em /grupovip.'}
              {' '}Alteração exclusiva do nível máximo.
            </span>
            {!isDev && (
              <span className="text-[11px] text-gray-500 font-mono block">A alternância de página principal é definida pelo nível máximo.</span>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <button type="button" onClick={() => changeHomeMode('classic')} disabled={busy === 'homemode' || homeMode === 'classic' || !isDev} className={`font-mono text-[11px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl border transition-colors ${homeMode === 'classic' ? 'bg-[#F0C265] text-black border-black' : 'text-gray-400 border-white/10 bg-white/5 hover:text-white'} disabled:opacity-50`}>
              Landing clássica
            </button>
            <button type="button" onClick={() => changeHomeMode('vip')} disabled={busy === 'homemode' || homeMode === 'vip' || !isDev} className={`font-mono text-[11px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl border transition-colors ${homeMode === 'vip' ? 'bg-[#F0C265] text-black border-black' : 'text-gray-400 border-white/10 bg-white/5 hover:text-white'} disabled:opacity-50`}>
              Grupo VIP
            </button>
          </div>
        </div>
        {notice['homemode'] && <Notice kind={notice['homemode'].kind}>{notice['homemode'].msg}</Notice>}
      </div>

      <div className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <h3 className="font-display font-bold text-white uppercase">Link do grupo</h3>
          <span className={`font-mono text-[11px] font-bold px-2.5 py-1 rounded-full uppercase border ${active ? 'text-[#10B981] border-[#10B981]/30 bg-[#10B981]/10' : 'text-gray-500 border-white/10 bg-white/5'}`}>
            {active ? 'página ativa' : 'página oculta'}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-end">
          <Field label="Link de convite do WhatsApp">
            <input className={inputCls} value={vip['vip_whatsapp_url'] ?? ''} onChange={(e) => setVip(p => ({ ...p, vip_whatsapp_url: e.target.value }))} placeholder="https://chat.whatsapp.com/..." />
          </Field>
          <button type="button" onClick={() => saveVip('vip_whatsapp_url', 'Link do grupo', 'url')} disabled={busy === 'vip-vip_whatsapp_url'} className={btnGold}>
            {busy === 'vip-vip_whatsapp_url' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Salvar'}
          </button>
          <button type="button" onClick={() => { const nv = active ? 'false' : 'true'; setVip(x => ({ ...x, vip_active: nv })); saveVip('vip_active', 'Página', 'bool'); }} className={btnGhost}>
            {active ? 'Ocultar página' : 'Ativar página'}
          </button>
        </div>
        {notice['vip-vip_whatsapp_url'] && <Notice kind={notice['vip-vip_whatsapp_url'].kind}>{notice['vip-vip_whatsapp_url'].msg}</Notice>}
        {notice['vip-vip_active'] && <Notice kind={notice['vip-vip_active'].kind}>{notice['vip-vip_active'].msg}</Notice>}
      </div>

      <div className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4">
        <h3 className="font-display font-bold text-white uppercase border-b border-white/5 pb-3">Textos da página</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.filter(x => x.key !== 'vip_whatsapp_url').map(x => (
            <div key={x.key} className="space-y-1.5">
              <label className="block font-mono text-[11px] text-[#F0C265] font-bold uppercase tracking-wider">{x.label}</label>
              {x.key === 'vip_subtitle' ? (
                <textarea className={`${inputCls} resize-none`} rows={3} value={vip[x.key] ?? ''} onChange={(e) => setVip(y => ({ ...y, [x.key]: e.target.value }))} />
              ) : (
                <input className={inputCls} value={vip[x.key] ?? ''} onChange={(e) => setVip(y => ({ ...y, [x.key]: e.target.value }))} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <button type="button" onClick={() => {
            setBusy('vip-save-all');
            (async () => {
              let firstError = '';
              for (const x of fields) {
                if (x.kind === 'url') continue;
                const value = (vip[x.key] ?? '').trim();
                const { error } = await supabase.rpc('staff_save_setting', { p_key: x.key, p_value: value });
                if (error && !firstError) firstError = error.message;
              }
              setBusy(null);
              if (firstError) { setMsg('vip-all', 'err', 'Erro ao salvar: ' + firstError); return; }
              await loadVip();
              setMsg('vip-all', 'ok', 'Textos salvos. A página já está no ar com o novo conteúdo.');
            })();
          }} disabled={busy === 'vip-save-all'} className={btnGold}>
            {busy === 'vip-save-all' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Salvar todos os textos'}
          </button>
        </div>
        {notice['vip-all'] && <Notice kind={notice['vip-all'].kind}>{notice['vip-all'].msg}</Notice>}
      </div>

      <div className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-display font-bold text-white uppercase">Interessados ({vipLeads.length})</h3>
          <button type="button" onClick={loadVipLeads} className={btnGhost}>Atualizar</button>
        </div>
        {vipLeads.length === 0 && <p className="text-xs text-gray-500 font-mono">Nenhum interessado registrado ainda.</p>}
        <div className="space-y-2">
          {vipLeads.map(l => (
            <div key={String(l.id)} className="bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 flex flex-col sm:flex-row justify-between sm:items-center gap-1.5">
              <span className="text-sm font-bold text-white">{String(l.name)}</span>
              <span className="flex items-center gap-3 font-mono text-xs text-gray-400">
                <a href={`mailto:${String(l.email)}`} className="hover:text-[#F0C265]">{String(l.email)}</a>
                <span>{fmtDate(String(l.created_at))}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
