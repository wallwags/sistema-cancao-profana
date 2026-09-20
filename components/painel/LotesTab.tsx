'use client';

// Aba LOTES & LIVE do painel /sagrado · extraída 1:1 do page.tsx (17/09, dívida técnica).
// Reúne as 4 seções irmãs: Sandbox (dev), Método de cobrança, Cupons e o gerenciador de lotes/live.
import { Loader2 } from 'lucide-react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { inputCls, btnGold, btnGhost } from './ui';

export interface BatchRow {
  id: string;
  name: string;
  status: 'ativo' | 'encerrado' | 'em_breve';
  price_per_member: string | number;
  vagas_total: number;
  vagas_restantes: number;
  starts_at: string | null;
  ends_at: string | null;
}

export interface BatchDraft {
  name?: string;
  price?: number | string;
  vagas_total?: number | string;
  vagas_restantes?: number | string;
  starts_at?: string;
  ends_at?: string;
}

interface LotesTabProps {
  isDev: boolean;
  canLotes: boolean;
  me: { id: string; permissions?: object | null } | null;
  batches: BatchRow[];
  settings: Record<string, string>;
  settingDrafts: Record<string, string>;
  setSettingDrafts: (updater: (p: Record<string, string>) => Record<string, string>) => void;
  loadSettings: () => void;
  batchDrafts: Record<string, BatchDraft>;
  setBatchDrafts: (updater: (p: Record<string, BatchDraft>) => Record<string, BatchDraft>) => void;
  saveBatch: (b: BatchRow) => void;
  activateBatch: (b: BatchRow) => void;
  applyCartOpen: (iso: string) => void;
  cartDays: { lote1: string; lote2: string; lote3: string };
  setCartDays: (updater: (p: { lote1: string; lote2: string; lote3: string }) => { lote1: string; lote2: string; lote3: string }) => void;
  slotMode: string;
  changeSlotMode: (m: 'band' | 'integrante') => void;
  liveStatus: string;
  setLivePhase: (p: 'ao_vivo' | 'encerrada' | 'em_breve') => void;
  toInputValue: (v?: string | null) => string;
  fmtDate: (v: string | null | undefined) => string;
  // sandbox dev
  v2env: { ativo: boolean; preco: number | null; pix_real: boolean } | null;
  saveV2Env: (on: boolean) => void;
  v2preco: string;
  setV2preco: (v: string) => void;
  toggleV2Pix: () => void;
  // cupons
  cupomCodigo: string;
  setCupomCodigo: (v: string) => void;
  cupomLote: string;
  setCupomLote: (v: string) => void;
  cupomMax: string;
  setCupomMax: (v: string) => void;
  criarCupom: () => void;
  cupomLista: Array<Record<string, unknown>>;
  cupomExcluir: string;
  setCupomExcluir: (updater: string | ((e: string) => string)) => void;
  excluirCupom: (codigo: string) => void;
  toggleCupom: (id: string, ativo: boolean) => void;
  // genericos
  busy: string | null;
  notice: Record<string, { kind: 'ok' | 'err' | 'info'; msg: string }>;
  setMsg: (k: string, kind: 'ok' | 'err' | 'info', msg: string) => void;
  guarded: (key: string, fn: () => Promise<string>) => void;
  supabase: SupabaseClient;
  Field: (p: { label: string; children: React.ReactNode }) => JSX.Element;
  Notice: (p: { kind: 'ok' | 'err' | 'info'; children: React.ReactNode }) => JSX.Element | null;
}

export default function LotesTab({ isDev, canLotes, me, batches, settings, settingDrafts, setSettingDrafts, loadSettings, batchDrafts, setBatchDrafts, saveBatch, activateBatch, applyCartOpen, cartDays, setCartDays, slotMode, changeSlotMode, liveStatus, setLivePhase, toInputValue, fmtDate, v2env, saveV2Env, v2preco, setV2preco, toggleV2Pix, cupomCodigo, setCupomCodigo, cupomLote, setCupomLote, cupomMax, setCupomMax, criarCupom, cupomLista, cupomExcluir, setCupomExcluir, excluirCupom, toggleCupom, busy, notice, setMsg, guarded, supabase, Field, Notice }: LotesTabProps) {
  const draftFor = (b: BatchRow) => ({
    name: batchDrafts[b.id]?.name ?? b.name,
    price: batchDrafts[b.id]?.price ?? Number(b.price_per_member),
    vagasTotal: batchDrafts[b.id]?.vagas_total ?? b.vagas_total,
    vagasRest: batchDrafts[b.id]?.vagas_restantes ?? b.vagas_restantes,
    starts: batchDrafts[b.id]?.starts_at ?? toInputValue(b.starts_at),
    ends: batchDrafts[b.id]?.ends_at ?? toInputValue(b.ends_at),
  });

  return (
    <>
      {isDev && (
        <div className="bg-[#0B0F19]/60 backdrop-blur-xl border-2 rounded-2xl p-5 space-y-4 fade-up-800 mb-6 border-amber-400/60">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-white/5 pb-3">
            <div>
              <h3 className="font-display font-bold text-white uppercase">🧪 Sandbox /v2</h3>
              <p className="text-xs text-gray-400 leading-snug mt-1">
                Modo de teste de produção. Ligado: a <strong className="text-amber-400">/v2</strong> aceita inscrições com preço de teste
                {' '}(pré-live também) e pode usar o Pix real, sem afetar em nada a <strong className="text-[#F0C265]">/ home</strong> pública.
                Um aviso fixo marca a página de teste.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => saveV2Env(!(v2env?.ativo ?? false))}
                disabled={busy === 'v2env'}
                className={`font-mono text-[11px] font-black uppercase tracking-wider px-4 py-2 rounded-xl border transition-colors ${
                  (v2env?.ativo ?? false)
                    ? 'bg-amber-400 text-black border-amber-300'
                    : 'text-gray-400 border-white/10 bg-white/5 hover:text-white'
                }`}
              >
                {busy === 'v2env' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (v2env?.ativo ?? false) ? 'Ligado' : 'Desligado'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block font-mono text-[11px] text-[#F0C265] font-bold uppercase tracking-wider">Preço de teste (R$ por integrante)</label>
              <input
                type="number"
                min={0.01}
                step="0.01"
                className={inputCls}
                value={v2preco}
                onChange={(e) => setV2preco(e.target.value)}
                placeholder="Ex: 1.00 (aparece no checkout da /v2)"
              />
              <span className="font-mono text-[10px] text-gray-500 block">Cobrança real apenas com Pix real ligado. Vazio = preço do lote.</span>
            </div>
            <div className="space-y-1.5">
              <label className="block font-mono text-[11px] text-[#F0C265] font-bold uppercase tracking-wider">Pix real no sandbox</label>
              <button
                type="button"
                onClick={toggleV2Pix}
                disabled={busy === 'v2pix' || !(v2env?.ativo ?? false)}
                className={`font-mono text-[11px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl border transition-colors ${
                  (v2env?.pix_real ?? false) ? 'bg-[#10B981] text-black border-[#10B981]/50' : 'text-gray-400 border-white/10 bg-white/5 hover:text-white'
                } disabled:opacity-50`}
              >
                {busy === 'v2pix' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (v2env?.pix_real ?? false) ? 'Pix real ativo na /v2' : 'Simulação (padrão)'}
              </button>
              <span className="font-mono text-[10px] text-gray-500 block">Exige chaves do gateway salvas em Pagamentos.</span>
            </div>
          </div>
          {notice['v2env'] && <Notice kind={notice['v2env'].kind}>{notice['v2env'].msg}</Notice>}
        </div>
      )}

      {(isDev || !!((me?.permissions as Record<string, unknown> | undefined)?.ver_metodo_cobranca)) && (() => {
        const modoAtual = String(settings['payment_mode'] ?? 'individual');
        const setModo = (modo: 'individual' | 'lider') => guarded('paymode', async () => {
          const { data: res, error } = await supabase.rpc('dev_set_payment_mode', { p_mode: modo });
          if (error) return 'Erro: ' + error.message;
          if (res !== 'ok') return String(res);
          await loadSettings();
          setMsg('paymode', 'ok', modo === 'lider'
            ? 'Cobrança pelo LÍDER ativa: 1 único Pix do valor total no checkout do líder; integrantes não pagam.'
            : 'Cobrança INDIVIDUAL ativa: cada integrante paga a própria parte (como antes).');
          return 'ok';
        });
        return (
          <div className="bg-[#0B0F19]/60 backdrop-blur-xl border-2 border-[#E3B552]/50 rounded-2xl p-5 space-y-4 fade-up-800 mb-6">
            <div className="border-b border-white/5 pb-3">
              <h3 className="font-display font-bold text-white uppercase">💳 Método de cobrança da inscrição</h3>
              <p className="text-xs text-gray-400 leading-snug mt-1">
                Define quem paga a inscrição no site. <strong className="text-white">Por integrante:</strong> cada um paga a própria parte pelo link de convite.
                {' '}<strong className="text-white">Líder paga total:</strong> o líder recebe um único Pix do valor de todos e os integrantes não pagam nada.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setModo('individual')}
                disabled={busy === 'paymode' || modoAtual === 'individual'}
                className={`p-4 rounded-2xl border-2 text-left transition-colors ${modoAtual === 'individual' ? 'border-[#F0C265] bg-[#F0C265]/10' : 'border-white/10 bg-white/5 hover:border-white/25'}`}
              >
                <span className="block font-display font-black text-white uppercase text-sm">Por integrante</span>
                <span className="block text-xs text-gray-400 mt-1 leading-snug">Cada integrante paga a própria parte pelo convite do líder (modelo atual).</span>
              </button>
              <button
                type="button"
                onClick={() => setModo('lider')}
                disabled={busy === 'paymode' || modoAtual === 'lider'}
                className={`p-4 rounded-2xl border-2 text-left transition-colors ${modoAtual === 'lider' ? 'border-[#F0C265] bg-[#F0C265]/10' : 'border-white/10 bg-white/5 hover:border-white/25'}`}
              >
                <span className="block font-display font-black text-white uppercase text-sm">Líder paga o total</span>
                <span className="block text-xs text-gray-400 mt-1 leading-snug">O líder gera 1 único Pix do valor total da banda e arca com a parte de todos.</span>
              </button>
            </div>
            {notice['paymode'] && <Notice kind={notice['paymode'].kind}>{notice['paymode'].msg}</Notice>}
          </div>
        );
      })()}

      {(isDev || canLotes) && (
        <div className="bg-[#0B0F19]/60 backdrop-blur-xl border-2 border-sky-400/50 rounded-2xl p-5 space-y-4 fade-up-800 mb-6">
          <div className="border-b border-white/5 pb-3">
            <h3 className="font-display font-bold text-white uppercase">🎟️ Cupom de inscrição por lote</h3>
            <p className="text-xs text-gray-400 leading-snug mt-1">
              Crie um cupom com <strong className="text-white">código próprio</strong> e <strong className="text-white">limite de usos</strong>.
              O inscrito acessa <strong className="text-white">/?cupom=CODIGO</strong> e é inscrito no lote do cupom, com o preço dele,
              mesmo que o lote não esteja vigente. Cupom esgotado ou inválido é recusado no servidor.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_100px_auto] gap-3 items-end">
            <div className="space-y-1.5">
              <label className="block font-mono text-[11px] text-[#F0C265] font-bold uppercase tracking-wider">Código do cupom</label>
              <input
                className={inputCls}
                value={cupomCodigo}
                onChange={(e) => setCupomCodigo(e.target.value.toUpperCase())}
                placeholder="EX: LIVE2026"
                maxLength={24}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block font-mono text-[11px] text-[#F0C265] font-bold uppercase tracking-wider">Lote alvo</label>
              <select className={inputCls} value={cupomLote} onChange={(e) => setCupomLote(e.target.value)}>
                <option value="">Selecione...</option>
                {batches.map(b => (
                  <option key={String(b.id)} value={String(b.id)}>
                    {String(b.name)} · R$ {String(b.price_per_member)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block font-mono text-[11px] text-[#F0C265] font-bold uppercase tracking-wider">Usos</label>
              <input type="number" min={1} className={inputCls} value={cupomMax} onChange={(e) => setCupomMax(e.target.value)} />
            </div>
            <button type="button" onClick={criarCupom} disabled={busy === 'cupom'} className={btnGold}>
              {busy === 'cupom' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Criar'}
            </button>
          </div>
          {notice['cupom'] && <Notice kind={notice['cupom'].kind}>{notice['cupom'].msg}</Notice>}

          {(
            <div className="border-t border-white/5 pt-3 space-y-2">
              <span className="font-mono text-[11px] text-gray-400 uppercase tracking-widest font-bold block">Cupons existentes ({cupomLista.length}){isDev && <span className="font-mono text-[9px] text-gray-600 normal-case tracking-normal"> · exclusão definitiva disponível apenas para dev</span>}</span>
              {notice['cupom-lista']?.msg && <Notice kind="err">{notice['cupom-lista'].msg}</Notice>}
              {cupomLista.length === 0 && !notice['cupom-lista']?.msg && <span className="font-mono text-xs text-gray-500 block">Nenhum cupom criado ainda. Use o formulário acima para criar o primeiro.</span>}
              {cupomLista.map((c, i) => {
                const ativo = !!c.ativo;
                const esgotado = Number(c.usos) >= Number(c.max_usos);
                const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/?cupom=${String(c.codigo)}`;
                return (
                  <div key={String(c.id)} className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 bg-black/30 border border-white/5 rounded-xl px-3.5 py-2.5">
                    <div className="min-w-0">
                      <span className={`font-mono text-sm font-black ${ativo && !esgotado ? 'text-[#10B981]' : 'text-gray-500 line-through'}`}>{String(c.codigo)}</span>
                      <span className="font-mono text-[10px] text-gray-500 uppercase block">
                        {String(c.usos)}/{String(c.max_usos)} usos{c.lote_nome ? ` • ${String(c.lote_nome)} · R$ ${String(c.preco)}` : ''} {esgotado ? '• esgotado' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <button
                        type="button"
                        onClick={async () => { try { await navigator.clipboard.writeText(url); setMsg(`cupom-c-${i}`, 'ok', 'Link copiado: ' + url); } catch { setMsg(`cupom-c-${i}`, 'err', 'Não foi possível copiar.'); } }}
                        className="font-mono text-[10px] font-bold text-white border border-white/15 px-2.5 py-1.5 rounded-lg uppercase hover:bg-white/5"
                      >
                        Copiar link
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleCupom(String(c.id), ativo)}
                        disabled={busy === 'cupom-t'}
                        className={`font-mono text-[10px] font-bold px-2.5 py-1.5 rounded-lg uppercase border ${ativo ? 'text-amber-300 border-amber-500/40 hover:bg-amber-500/10' : 'text-[#10B981] border-[#10B981]/40 hover:bg-[#10B981]/10'}`}
                      >
                        {ativo ? 'Desativar' : 'Ativar'}
                      </button>
                      {isDev && (
                        <button
                          type="button"
                          onClick={() => {
                            const cod = String(c.codigo);
                            if (cupomExcluir === cod) { excluirCupom(cod); return; }
                            setCupomExcluir(cod);
                            setTimeout(() => setCupomExcluir(e => (e === cod ? '' : e)), 4000);
                          }}
                          disabled={busy === 'cupom-del'}
                          className={`font-mono text-[10px] font-bold px-2.5 py-1.5 rounded-lg uppercase border ${cupomExcluir === String(c.codigo) ? 'text-white border-red-500 bg-red-600/80' : 'text-red-400 border-red-500/40 hover:bg-red-500/10'}`}
                        >
                          {busy === 'cupom-del' ? <Loader2 className="w-3 h-3 animate-spin" /> : (cupomExcluir === String(c.codigo) ? 'Confirmar?' : 'Excluir')}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="space-y-5 fade-up-800">
        <div className="bg-[#0B0F19]/60 backdrop-blur-xl border-2 border-[#F0C265]/40 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <h3 className="font-display font-bold text-white uppercase">📅 Abertura do carrinho (inscrições)</h3>
            <span className="font-mono text-[11px] text-gray-400 uppercase">
              Atual: {fmtDate(settings['cart_open_at'])}
            </span>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            Define a data/hora em que o Lote 1 ativa e as inscrições abrem. Os três lotes são reorganizados
            automaticamente em sequência, e o countdown do site aponta para o fim do Lote 1. Se a data já passou,
            o Lote 1 ativa imediatamente.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
            <Field label="Abertura em (BRT)">
              <input type="datetime-local" className={inputCls} value={settingDrafts['cart_open_at'] || toInputValue(settings['cart_open_at'])} onChange={(e) => setSettingDrafts(p => ({ ...p, cart_open_at: e.target.value }))} />
            </Field>
            <Field label="Lote 1 (dias)"><input type="number" min={1} className={inputCls} value={cartDays.lote1} onChange={(e) => setCartDays(p => ({ ...p, lote1: e.target.value }))} /></Field>
            <Field label="Lote 2 (dias)"><input type="number" min={1} className={inputCls} value={cartDays.lote2} onChange={(e) => setCartDays(p => ({ ...p, lote2: e.target.value }))} /></Field>
            <Field label="Lote 3 (dias)"><input type="number" min={1} className={inputCls} value={cartDays.lote3} onChange={(e) => setCartDays(p => ({ ...p, lote3: e.target.value }))} /></Field>
          </div>
          <div className="flex justify-end items-center gap-3 flex-wrap">
            {notice['cartopen'] && <Notice kind={notice['cartopen'].kind}>{notice['cartopen'].msg}</Notice>}
            <button type="button" onClick={() => applyCartOpen(settingDrafts['cart_open_at'] ?? '')} disabled={busy === 'cartopen'} className={btnGold}>
              {busy === 'cartopen' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Reorganizar lotes'}
            </button>
          </div>
        </div>

        <div className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-3">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <span className="font-mono text-[11px] text-[#F0C265] uppercase tracking-widest font-black block">Modo de contagem de vagas</span>
              <span className="text-xs text-gray-400 leading-snug block mt-1">
                {slotMode === 'band'
                  ? 'Por banda/projeto: cada banda consome 1 vaga do lote e a oferta fica travada para todos os integrantes - mesmo após a virada do lote.'
                  : 'Por integrante: cada pagamento consome uma vaga individual e usa a oferta do lote vigente na hora do pagamento.'}
              </span>
            </div>
            <div className="flex gap-2 shrink-0">
              <button type="button" onClick={() => changeSlotMode('band')} disabled={busy === 'slotmode' || slotMode === 'band'} className={`font-mono text-[11px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl border transition-colors ${slotMode === 'band' ? 'bg-[#F0C265] text-black border-black' : 'text-gray-400 border-white/10 bg-white/5 hover:text-white'}`}>
                Por banda
              </button>
              <button type="button" onClick={() => changeSlotMode('integrante')} disabled={busy === 'slotmode' || slotMode === 'integrante'} className={`font-mono text-[11px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl border transition-colors ${slotMode === 'integrante' ? 'bg-[#F0C265] text-black border-black' : 'text-gray-400 border-white/10 bg-white/5 hover:text-white'}`}>
                Por integrante
              </button>
            </div>
          </div>
          {notice['slotmode'] && <Notice kind={notice['slotmode'].kind}>{notice['slotmode'].msg}</Notice>}
        </div>

        <div className="bg-[#0B0F19]/60 backdrop-blur-xl border-2 border-[#E3B552]/40 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <div className="flex items-center gap-2.5">
              <h3 className="font-display font-bold text-white uppercase">🔴 Live · Ao vivo agora</h3>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded font-mono uppercase border ${
                liveStatus === 'ao_vivo' ? 'bg-red-500/15 text-red-400 border-red-500/30 animate-pulse'
                : liveStatus === 'encerrada' ? 'bg-[#121215] text-gray-500 border-white/5'
                : 'bg-[#121215] text-gray-400 border-white/5'}`}>
                {liveStatus}
              </span>
            </div>
            <span className="font-mono text-[11px] text-gray-400 uppercase">Lançamento: {fmtDate(settings.live_launch)}</span>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">
            Colocar a live no ar pausa automaticamente qualquer lote ativo (a oferta da Live passa a valer). Voltar para em breve ou encerrar restaura o lote que estava ativo antes. Ativar um lote também encerra a live.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <button type="button" onClick={() => setLivePhase('ao_vivo')} disabled={busy === 'live-phase' || liveStatus === 'ao_vivo'} className={btnGold}>
              {busy === 'live-phase' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Ativar ao vivo'}
            </button>
            <button type="button" onClick={() => setLivePhase('encerrada')} disabled={busy === 'live-phase' || liveStatus === 'encerrada'} className={btnGhost}>Encerrar live</button>
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
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded font-mono uppercase border ${
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
                <Field label="Oferta por integrante (R$)"><input type="number" min={1} step="0.01" className={inputCls} value={d.price} onChange={(e) => setBatchDrafts(p => ({ ...p, [b.id]: { ...p[b.id], price: e.target.value } }))} /></Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Vagas total"><input type="number" min={0} className={inputCls} value={d.vagasTotal} onChange={(e) => setBatchDrafts(p => ({ ...p, [b.id]: { ...p[b.id], vagas_total: e.target.value } }))} /></Field>
                  <Field label="Restantes"><input type="number" min={0} className={inputCls} value={d.vagasRest} onChange={(e) => setBatchDrafts(p => ({ ...p, [b.id]: { ...p[b.id], vagas_restantes: e.target.value } }))} /></Field>
                </div>
                <Field label="Início em (Sao_Paulo)"><input type="datetime-local" className={inputCls} value={d.starts} onChange={(e) => setBatchDrafts(p => ({ ...p, [b.id]: { ...p[b.id], starts_at: e.target.value } }))} /></Field>
                <Field label="Termina em (Sao_Paulo)"><input type="datetime-local" className={inputCls} value={d.ends} onChange={(e) => setBatchDrafts(p => ({ ...p, [b.id]: { ...p[b.id], ends_at: e.target.value } }))} /></Field>
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
    </>
  );
}
