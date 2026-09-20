'use client';

// Aba CONTEÚDO do painel /sagrado · extraída 1:1 do page.tsx (17/09, dívida técnica).
import { useState } from 'react';
import { Loader2, ArrowUp, ArrowDown, Plus, Trash2, X } from 'lucide-react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { inputCls, btnGold } from './ui';

export interface FaqRow {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  active: boolean;
}

type Invite = { username: string; name: string; password: string; role: 'jurado' | 'admin' };

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

interface ConteudoTabProps {
  settings: Record<string, string>;
  settingDrafts: Record<string, string>;
  setSettingDrafts: (updater: (p: Record<string, string>) => Record<string, string>) => void;
  loadSettings: () => void;
  saveSetting: (key: string, label: string, kind: 'datetime' | 'text' | 'number') => void;
  toInputValue: (v?: string | null) => string;
  faqs: FaqRow[];
  setFaqs: (updater: (list: FaqRow[]) => FaqRow[]) => void;
  moveFaq: (idx: number, dir: -1 | 1) => Promise<void>;
  saveFaq: (item: FaqRow) => void;
  deleteFaq: (item: FaqRow) => void;
  newFaq: { question: string; answer: string };
  setNewFaq: (updater: (p: { question: string; answer: string }) => { question: string; answer: string }) => void;
  addFaq: () => void;
  busy: string | null;
  notice: Record<string, { kind: 'ok' | 'err' | 'info'; msg: string }>;
  setMsg: (k: string, kind: 'ok' | 'err' | 'info', msg: string) => void;
  guarded: (key: string, fn: () => Promise<string>) => void;
  fmtDate: (v: string | null | undefined) => string;
  supabase: SupabaseClient;
  Field: (p: { label: string; children: React.ReactNode }) => JSX.Element;
  Notice: (p: { kind: 'ok' | 'err' | 'info'; children: React.ReactNode }) => JSX.Element | null;
}

export default function ConteudoTab({ settings, settingDrafts, setSettingDrafts, loadSettings, saveSetting, toInputValue, faqs, setFaqs, moveFaq, saveFaq, deleteFaq, newFaq, setNewFaq, addFaq, busy, notice, setMsg, guarded, fmtDate, supabase, Field, Notice }: ConteudoTabProps) {
  return (
    <div className="space-y-5 fade-up-800">
      <div className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <h3 className="font-display font-bold text-white uppercase">Aviso do portal do candidato</h3>
          <button
            type="button"
            onClick={() => {
              const ativo = (settings['portal_aviso_ativo'] === 'true');
              const novo = !ativo;
              setSettingDrafts(p => ({ ...p, portal_aviso_ativo: novo ? 'true' : 'false' }));
              (async () => {
                const { data: res, error } = await supabase.rpc('staff_save_setting', { p_key: 'portal_aviso_ativo', p_value: novo ? 'true' : 'false' });
                if (error || res !== 'ok') { setMsg('portal-aviso', 'err', 'Erro: ' + (error?.message || res)); return; }
                await loadSettings();
                setMsg('portal-aviso', 'ok', novo ? 'Aviso ATIVO - aparece como popup no portal.' : 'Aviso desativado.');
              })();
            }}
            disabled={busy === 'portal-aviso-toggle'}
            className={`font-mono text-[11px] font-black uppercase tracking-wider px-3.5 py-2 rounded-xl border transition-colors ${
              settings['portal_aviso_ativo'] === 'true' ? 'bg-amber-400 text-black border-amber-300' : 'text-gray-400 border-white/10 bg-white/5 hover:text-white'
            }`}
          >
            {settings['portal_aviso_ativo'] === 'true' ? 'Ativo' : 'Desativado'}
          </button>
        </div>
        <div className="space-y-1.5">
          <label className="block font-mono text-[11px] text-[#F0C265] font-bold uppercase tracking-wider">Texto do aviso (aparece como popup destacado no portal Minha Inscrição)</label>
          <textarea
            rows={3}
            className={`${inputCls} resize-none`}
            value={settingDrafts['portal_aviso'] ?? settings['portal_aviso'] ?? ''}
            onChange={(e) => setSettingDrafts(p => ({ ...p, portal_aviso: e.target.value }))}
            placeholder="Ex: A gravação da Etapa 1 será dia 20/10. Confirme sua presença com o líder até sexta."
          />
          <div className="flex justify-end items-center gap-3 flex-wrap">
            {notice['portal-aviso'] && <Notice kind={notice['portal-aviso'].kind}>{notice['portal-aviso'].msg}</Notice>}
            <button
              type="button"
              onClick={() => guarded('portal-aviso-save', async () => {
                const v = (settingDrafts['portal_aviso'] ?? settings['portal_aviso'] ?? '').trim();
                if (!v) return 'Escreva o texto do aviso.';
                const { data: res, error } = await supabase.rpc('staff_save_setting', { p_key: 'portal_aviso', p_value: v });
                if (error) return 'Erro: ' + error.message;
                if (res !== 'ok') return String(res);
                await loadSettings();
                setMsg('portal-aviso', 'ok', 'Aviso publicado no portal (se estiver Ativo).');
                return 'ok';
              })}
              disabled={busy === 'portal-aviso-save'}
              className={btnGold}
            >
              {busy === 'portal-aviso-save' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Publicar aviso'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4">
        <h3 className="font-display font-bold text-white uppercase border-b border-white/5 pb-3">Datas do site</h3>
        {[
          { key: 'countdown_target', label: 'Fim do lote vigente (contagem regressiva)', kind: 'datetime' as const, current: fmtDate(settings['countdown_target']) },
          { key: 'live_launch', label: 'Lançamento oficial da live', kind: 'datetime' as const, current: fmtDate(settings['live_launch']) },
          { key: 'live_url', label: 'Link da live (YouTube)', kind: 'text' as const, current: settings['live_url'] || 'não definido' },
          { key: 'dia0_price', label: 'Oferta da Live (R$)', kind: 'number' as const, current: settings['dia0_price'] || '25' },
        ].map(s => (
          <div key={s.key} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
            <Field label={`${s.label} - atual: ${s.current}`}>
              {s.kind === 'datetime'
                ? <input type="datetime-local" className={inputCls} value={settingDrafts[s.key] || (s.kind === 'datetime' ? toInputValue(settings[s.key]) : '')} onChange={(e) => setSettingDrafts(p => ({ ...p, [s.key]: e.target.value }))} />
                : s.kind === 'number'
                  ? <input type="number" min={1} step="0.01" className={inputCls} value={settingDrafts[s.key] ?? ''} onChange={(e) => setSettingDrafts(p => ({ ...p, [s.key]: e.target.value }))} />
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
        <h3 className="font-display font-bold text-white uppercase border-b border-white/5 pb-3">FAQ - perguntas frequentes</h3>
        {notice['faq-list'] && <Notice kind={notice['faq-list'].kind}>{notice['faq-list'].msg}</Notice>}

        <div className="space-y-3">
          {faqs.map((f, idx) => (
            <div key={f.id} className="bg-black/40 border border-white/5 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center gap-2">
                <span className="font-mono text-[11px] text-gray-500 uppercase tracking-widest">#{idx + 1} {f.active ? '' : '· oculta no site'}</span>
                <div className="flex items-center gap-1">
                  <button type="button" disabled={idx === 0 || busy === 'faq-move'} onClick={() => moveFaq(idx, -1)} className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
                  <button type="button" disabled={idx === faqs.length - 1 || busy === 'faq-move'} onClick={() => moveFaq(idx, 1)} className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => { const u = { ...f, active: !f.active }; setFaqs(list => list.map(x => x.id === f.id ? u : x)); saveFaq(u); }} className={`font-mono text-[11px] font-bold px-2 py-1 rounded uppercase border ${f.active ? 'text-[#10B981] border-[#10B981]/30 bg-[#10B981]/10' : 'text-gray-400 border-white/10 bg-white/5'}`}>
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
          <span className="font-mono text-[11px] text-[#F0C265] uppercase tracking-widest font-bold">Nova pergunta</span>
        <p className="text-[11px] text-gray-400 font-mono leading-relaxed">
          Tags dinâmicas disponíveis (substituídas no site pelos valores atuais): <span className="text-[#F0C265]">[data-lote1]</span> <span className="text-[#F0C265]">[data-lote2]</span> <span className="text-[#F0C265]">[data-lote3]</span> abertura de cada lote • <span className="text-[#F0C265]">[data-lote1-fim]</span> <span className="text-[#F0C265]">[data-lote2-fim]</span> <span className="text-[#F0C265]">[data-lote3-fim]</span> encerramento de cada lote • <span className="text-[#F0C265]">[data-live]</span> lançamento da live • <span className="text-[#F0C265]">[data-link-live]</span> link da live • <span className="text-[#F0C265]">[data-preco-lote1]</span> <span className="text-[#F0C265]">[data-preco-lote2]</span> <span className="text-[#F0C265]">[data-preco-lote3]</span> <span className="text-[#F0C265]">[data-preco-dia0]</span> ofertas • <span className="text-[#F0C265]">[data-vagas]</span> vagas restantes do lote vigente.
        </p>
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
  );
}
