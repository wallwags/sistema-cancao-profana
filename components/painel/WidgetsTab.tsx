'use client';

// Aba WIDGETS do painel /sagrado: prova social na home, selo de vagas e WhatsApp de suporte.
// Os valores sao exibicao (ficticios por design) · nada aqui interfere em pagamentos ou vagas reais.
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { inputCls, btnGold } from './ui';

interface WidgetsTabProps {
  settings: Record<string, string>;
  loadSettings: () => void;
  supabase: SupabaseClient;
  Field: (p: { label: string; children: React.ReactNode }) => JSX.Element;
  Notice: (p: { kind: 'ok' | 'err' | 'info'; children: React.ReactNode }) => JSX.Element | null;
}

const CHAVES: Array<{ key: string; label: string; kind: 'bool' | 'text' | 'url' | 'number'; dica?: string }> = [
  { key: 'widget_ativo', label: 'Widget de prova social ativo', kind: 'bool', dica: 'Mini-card pulsante no canto inferior direito da home.' },
  { key: 'widget_imagem', label: 'Imagem do widget (URL)', kind: 'text', dica: 'Padrão: /widgets/mosaic.webp (mosaico de artistas). Pode ser qualquer imagem.' },
  { key: 'widget_bandas_min', label: 'Bandas · mínimo', kind: 'number', dica: 'Padrão 2.' },
  { key: 'widget_bandas_max', label: 'Bandas · máximo', kind: 'number', dica: 'Padrão 4.' },
  { key: 'widget_visitantes_min', label: 'Visitantes agora · mínimo', kind: 'number', dica: 'Padrão 25.' },
  { key: 'widget_visitantes_max', label: 'Visitantes agora · máximo', kind: 'number', dica: 'Padrão 78.' },
  { key: 'modo_teste', label: 'Modo teste (marcar meus eventos como teste)', kind: 'bool', dica: 'ON: eventos deste navegador vao marcados como TESTE e saem dos totais de visitantes reais no painel.' },
  { key: 'social_vagas_pct', label: 'Selo "X% das vagas já preenchidas"', kind: 'number', dica: 'Número fictício exibido acima da tabela de lotes. Padrao 40. 0 = oculta o selo.' },
];

export default function WidgetsTab({ settings, loadSettings, supabase, Field, Notice, devOnly = false }: WidgetsTabProps & { devOnly?: boolean }) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const val = (k: string) => drafts[k] ?? settings[k] ?? '';
  const setVal = (k: string, v: string) => {
    setDrafts(p => ({ ...p, [k]: v }));
    if (k === 'modo_teste' && typeof window !== 'undefined') {
      try {
        if (v === 'true') window.localStorage.setItem('cp_modo_teste', '1');
        else window.localStorage.removeItem('cp_modo_teste');
      } catch { /* storage bloqueado */ }
    }
  };

  const salvarTudo = async () => {
    setBusy(true); setMsg(null);
    let primeiroErro = '';
    for (const c of CHAVES) {
      if (!(c.key in drafts)) continue;
      let v = String(drafts[c.key]).trim();
      if (c.kind === 'bool') v = v === 'true' ? 'true' : 'false';
      const { error } = await supabase.rpc('staff_save_setting', { p_key: c.key, p_value: v });
      if (error && !primeiroErro) primeiroErro = error.message;
    }
    setBusy(false);
    if (primeiroErro) { setMsg({ kind: 'err', text: 'Erro ao salvar: ' + primeiroErro }); return; }
    await loadSettings();
    setDrafts({});
    setMsg({ kind: 'ok', text: 'Salvo. A home reflete em até 60 segundos (ou ao recarregar).' });
  };

  return (
    <div className="space-y-5 fade-up-800 max-w-3xl">
      <div className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4">
        <div className="border-b border-white/5 pb-3">
          <h3 className="font-display font-bold text-white uppercase">✨ Widgets e prova social</h3>
          <p className="text-xs text-gray-400 leading-snug mt-1">
            Controla o mini-card pulsante da home (foto + bandas + visitantes) e o selo de porcentagem de vagas.
            Os números são de <strong className="text-white">exibição</strong>, gerados dentro das faixas abaixo · não são estatísticas reais.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CHAVES.map(c => (
            <div key={c.key} className="space-y-1.5">
              {c.key === 'home_pix_fake' && !devOnly ? (
                <div className="flex items-center h-[42px] font-mono text-[11px] text-gray-400 uppercase">somente dev</div>
              ) : c.kind === 'bool' ? (
                <Field label={c.label}>
                  <button
                    type="button"
                    onClick={() => setVal(c.key, val(c.key) === 'false' ? 'true' : 'false')}
                    className={`font-mono text-[11px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl border transition-colors ${
                      val(c.key) !== 'false' ? 'bg-[#10B981] text-black border-[#10B981]/50' : 'text-gray-400 border-white/10 bg-white/5'
                    }`}
                  >
                    {val(c.key) !== 'false' ? 'Ativo' : 'Desligado'}
                  </button>
                </Field>
              ) : (
                <Field label={c.label + (c.dica?.includes('Padrão') ? ` (${c.dica.split('Padrão')[1].replace('.', '').trim()})` : '')}>
                  <input
                    className={inputCls}
                    value={val(c.key)}
                    onChange={(e) => setVal(c.key, e.target.value)}
                    placeholder={c.kind === 'url' ? 'https://...' : c.kind === 'number' ? '0' : ''}
                    inputMode={c.kind === 'number' ? 'numeric' : undefined}
                  />
                </Field>
              )}
              {c.dica && <span className="font-mono text-[10px] text-gray-500 block -mt-0.5">{c.dica}</span>}
            </div>
          ))}
        </div>

        <div className="flex justify-end items-center gap-3">
          {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
          <button type="button" onClick={salvarTudo} disabled={busy} className={btnGold}>
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Salvar widgets'}
          </button>
        </div>
      </div>

      <div className="bg-[#0B0F19]/60 backdrop-blur-xl border border-[#25D366]/30 rounded-2xl p-5 space-y-4">
        <div className="border-b border-white/5 pb-3">
          <h3 className="font-display font-bold text-white uppercase">💬 WhatsApp "Tenho dúvidas"</h3>
          <p className="text-xs text-gray-400 leading-snug mt-1">
            Aparece como botão verde durante o quiz e na tela de sucesso. Deixe vazio para usar o link do Grupo VIP.
          </p>
        </div>
        <Field label="Link do WhatsApp de atendimento (wa.me/5521999999999 ou convite)">
          <input className={inputCls} value={val('suporte_whatsapp_url')} onChange={(e) => setVal('suporte_whatsapp_url', e.target.value)} placeholder="https://wa.me/5521999999999" />
        </Field>
        <div className="flex justify-end items-center gap-3">
          {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
          <button type="button" onClick={async () => {
            setBusy(true);
            const { error } = await supabase.rpc('staff_save_setting', { p_key: 'suporte_whatsapp_url', p_value: (drafts['suporte_whatsapp_url'] ?? settings['suporte_whatsapp_url'] ?? '').trim() });
            setBusy(false);
            if (error) { setMsg({ kind: 'err', text: 'Erro: ' + error.message }); return; }
            await loadSettings();
            setDrafts(p => { const c = { ...p }; delete c.suporte_whatsapp_url; return c; });
            setMsg({ kind: 'ok', text: 'Link do atendimento salvo.' });
          }} disabled={busy} className={btnGold}>
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Salvar atendimento'}
          </button>
        </div>
      </div>

      <div className="bg-[#0B0F19]/40 border border-white/5 rounded-2xl p-5">
        <span className="font-mono text-[11px] text-[#F0C265] uppercase tracking-widest font-bold block mb-2">Prévia do widget</span>
        <div className="inline-flex items-center gap-3 bg-[#0B0F19]/95 border border-[#F0C265]/35 rounded-2xl pl-2.5 pr-8 py-2.5 max-w-[300px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={val('widget_imagem') || '/widgets/mosaic.webp'} alt="Prévia" className="w-14 h-14 rounded-xl object-cover border border-[#F0C265]/40" />
          <div className="leading-tight">
            <span className="block text-xs font-bold text-white">{val('widget_bandas_min') || 2} bandas acabaram de garantir vaga</span>
            <span className="font-mono text-[10px] text-gray-400 uppercase tracking-wider mt-0.5 block">{val('widget_visitantes_min') || 25} visitantes agora</span>
          </div>
        </div>
      </div>
    </div>
  );
}
