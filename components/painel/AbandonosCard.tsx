'use client';

// Cartao da aba INSCRICOES: pessoas que comecaram o quiz e nao concluiram,
// com tags de onde pararam. Somente leitura (RPC staff_list_quiz_funnels).
import { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { btnGhost } from './ui';

interface SessaoFunil {
  ref: string;
  max_step: number | null;
  abriu_pix: boolean;
  travou_pix: boolean;
  ultima: string;
  ip: string;
  ua: string;
  is_test: boolean;
}

type Filtro = 'todos' | 'quiz' | 'pix' | 'travou';

const resumoNavegador = (ua: string) => {
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/iPad/i.test(ua)) return 'iPad';
  if (/Android/i.test(ua)) return 'Android';
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Mac/i.test(ua)) return 'Mac';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Outro';
};

export default function AbandonosCard({ supabase, fmtDate, isDev = false }: { supabase: SupabaseClient; fmtDate: (v: string | null | undefined) => string; isDev?: boolean }) {
  const [lista, setLista] = useState<SessaoFunil[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [excluirRef, setExcluirRef] = useState('');
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc('staff_list_quiz_funnels', { p_days: 30 });
      if (error) { setErro('Não foi possível carregar: ' + error.message); setCarregando(false); return; }
      setLista((Array.isArray(data) ? data : []) as SessaoFunil[]);
      setCarregando(false);
    })();
  }, [supabase]);

  const excluirSessao = async (ref: string) => {
    setMsg(null);
    const { data, error } = await supabase.rpc('staff_delete_funnel_session', { p_ref: ref });
    if (error) { setMsg({ kind: 'err', text: 'Erro: ' + error.message }); return; }
    setLista(l => l.filter(x => x.ref !== ref));
    setExcluirRef('');
    setMsg({ kind: 'ok', text: `Sessão removida (${Number(data) || 0} eventos).` });
  };

  const filtrada = lista.filter(s =>
    filtro === 'quiz' ? !s.abriu_pix && !s.travou_pix
    : filtro === 'pix' ? s.abriu_pix && !s.travou_pix
    : filtro === 'travou' ? s.travou_pix
    : true
  );

  const chips: Array<{ k: Filtro; label: string; n: number }> = [
    { k: 'todos', label: 'Todos', n: lista.length },
    { k: 'quiz', label: 'Sumiu no quiz', n: lista.filter(s => !s.abriu_pix && !s.travou_pix).length },
    { k: 'pix', label: 'Abriu o Pix', n: lista.filter(s => s.abriu_pix && !s.travou_pix).length },
    { k: 'travou', label: 'Travou no Pix', n: lista.filter(s => s.travou_pix).length },
  ];

  return (
    <div className="bg-[#0B0F19]/60 backdrop-blur-xl border border-sky-400/30 rounded-2xl p-5 space-y-3">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
        <span className="font-display font-bold text-white uppercase text-sm">Pessoas no meio do caminho · últimos 30 dias</span>
        <span className="font-mono text-[10px] text-gray-500 uppercase">quiz_step, checkout e pix · sem identificação pessoal</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {chips.map(c => (
          <button
            key={c.k}
            type="button"
            onClick={() => setFiltro(c.k)}
            className={`font-mono text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-full border transition-colors ${filtro === c.k ? 'bg-[#F0C265] text-black border-black' : 'text-gray-400 border-white/10 bg-white/5 hover:text-white'}`}
          >
            {c.label} · {c.n}
          </button>
        ))}
      </div>
      {carregando && <p className="text-xs text-gray-500 font-mono">Carregando sessões...</p>}
      {erro && <p className="text-xs text-red-400 font-mono">{erro}</p>}
      {!carregando && !erro && filtrada.length === 0 && <p className="text-xs text-gray-500 font-mono">Nenhuma sessão neste filtro.</p>}
      {msg && <p className={`text-xs font-mono ${msg.kind === 'ok' ? 'text-[#10B981]' : 'text-red-400'}`}>{msg.text}</p>}
      <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
        {filtrada.map(s => (
          <div key={s.ref} className="bg-black/30 border border-white/5 rounded-xl px-3.5 py-2.5 flex flex-col sm:flex-row justify-between sm:items-center gap-1.5">
            <div className="min-w-0 flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded-full border border-[#F0C265]/40 bg-[#F0C265]/10 text-[#F0C265] uppercase">
                Etapa {s.max_step ?? '?'}/5
              </span>
              {s.travou_pix && <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded-full border border-red-500/40 bg-red-500/10 text-red-300 uppercase">Travou no Pix</span>}
              {!s.travou_pix && s.abriu_pix && <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-300 uppercase">Abriu o Pix</span>}
              {!s.abriu_pix && !s.travou_pix && <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-gray-400 uppercase">Sumiu no quiz</span>}
                      {s.is_test && <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded-full border border-sky-400/40 bg-sky-400/10 text-sky-300 uppercase">teste</span>}
              <span className="font-mono text-[10px] text-gray-500 truncate">ref {String(s.ref).slice(0, 8)}… · {s.ip || 'ip oculto'} · {resumoNavegador(String(s.ua || ''))}</span>
            </div>
            <span className="flex items-center gap-2 shrink-0">
              {isDev && (
                <button
                  type="button"
                  onClick={() => {
                    if (excluirRef === s.ref) { excluirSessao(s.ref); return; }
                    setExcluirRef(s.ref);
                    setTimeout(() => setExcluirRef(e => (e === s.ref ? '' : e)), 4000);
                  }}
                  className={`font-mono text-[10px] font-bold px-2 py-1 rounded-lg uppercase border ${excluirRef === s.ref ? 'text-white border-red-500 bg-red-600/80' : 'text-red-400/80 border-red-500/30 hover:bg-red-500/10'}`}
                >
                  {excluirRef === s.ref ? 'Confirmar?' : 'Excluir'}
                </button>
              )}
              <span className="font-mono text-[10px] text-gray-500">{fmtDate(s.ultima)}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
