'use client';

// Aba AUDITORIA do painel /sagrado · extraída 1:1 do page.tsx (17/09, dívida técnica).
import { useState } from 'react';
import { Globe } from 'lucide-react';
import { btnGhost } from './ui';

interface AuditoriaTabProps {
  audit: Array<Record<string, unknown>>;
  openAuditTab: () => void;
  fmtDate: (v: string | null | undefined) => string;
}

export default function AuditoriaTab({ audit, openAuditTab, fmtDate, supabase, isDev }: AuditoriaTabProps & { supabase: import('@supabase/supabase-js').SupabaseClient; isDev: boolean }) {
  const [abas, setAbas] = useState<'acoes' | 'acessos'>('acoes');
  const [acessos, setAcessos] = useState<Array<{ id: number; actor_name: string; ip: string; ua: string; quando: string }> | null>(null);
  const [totalAcessos, setTotalAcessos] = useState(0);
  const [pag, setPag] = useState(0);
  const [carregandoAcessos, setCarregandoAcessos] = useState(false);
  const [ipTeste, setIpTeste] = useState<Record<string, boolean>>({});
  const PER_PAGE = 25;

  const loadAcessos = async (offset: number) => {
    setCarregandoAcessos(true);
    const { data, error } = await supabase.rpc('staff_list_painel_acessos', { p_limit: PER_PAGE, p_offset: offset });
    setCarregandoAcessos(false);
    if (error) return;
    setAcessos((data?.itens || []) as never);
    setTotalAcessos(Number(data?.total || 0));
  };

  const abrirAcessos = () => { setAbas('acessos'); if (acessos === null) loadAcessos(0); };

  const toggleIp = async (ip: string, teste: boolean) => {
    const { error } = await supabase.rpc('staff_toggle_ip_teste', { p_ip: ip, p_teste: teste });
    if (!error) setIpTeste(prev => ({ ...prev, [ip]: teste }));
  };
  return (
    <div className="space-y-4 fade-up-800">
      <div className="flex justify-between items-center gap-2 flex-wrap">
        <div className="flex bg-white/5 border border-white/10 rounded-full p-0.5">
          <button type="button" onClick={() => setAbas('acoes')} className={`font-mono text-[11px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full transition-colors ${abas === 'acoes' ? 'bg-[#F0C265] text-black' : 'text-gray-300 hover:text-white'}`}>Ações internas · {audit.length}</button>
          <button type="button" onClick={abrirAcessos} className={`flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full transition-colors ${abas === 'acessos' ? 'bg-[#F0C265] text-black' : 'text-gray-300 hover:text-white'}`}><Globe className="w-3 h-3" /> Acessos ao painel</button>
        </div>
        {abas === 'acoes' && <button type="button" onClick={openAuditTab} className={btnGhost}>Atualizar</button>}
      </div>
      {audit.length === 0 && (
        <div className="bg-[#0B0F19]/60 border border-white/10 rounded-2xl p-5">
          <p className="text-xs text-gray-400 font-mono">Nenhuma ação registrada ainda.</p>
        </div>
      )}
      {abas === 'acoes' && (
      <div className="space-y-2">
        {audit.map(a => {
          const d = (a.details && typeof a.details === 'object') ? a.details as Record<string, unknown> : {};
          const detailText = Object.keys(d).length ? Object.entries(d).map(([kk, vv]) => `${kk}: ${String(vv)}`).join(' · ') : '';
          return (
            <div key={String(a.id)} className="bg-black/40 border border-white/5 rounded-xl p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="min-w-0">
                <span className="text-xs text-white font-bold block">{String(a.actor_name || '-')} <span className="text-gray-400 font-normal">{String(a.action)}</span></span>
                <span className="font-mono text-xs text-[#F0C265] block truncate">{String(a.target || '')}</span>
                {detailText && <span className="font-mono text-[11px] text-gray-500 block">{detailText}</span>}
              </div>
              <span className="font-mono text-[11px] text-gray-500 shrink-0">{fmtDate(String(a.created_at))}</span>
            </div>
          );
        })}
      </div>
      )}

      {abas === 'acessos' && (
        <div className="space-y-3">
          <span className="font-mono text-[11px] text-gray-300 uppercase tracking-widest block">
            {totalAcessos} acessos registrados · horários de São Paulo (BRT) · registrados automaticamente a cada entrada no painel
          </span>
          {carregandoAcessos && <p className="text-xs text-gray-300 font-mono">Carregando...</p>}
          {!carregandoAcessos && acessos !== null && acessos.length === 0 && (
            <p className="text-xs text-gray-300 font-mono">Nenhum acesso registrado ainda.</p>
          )}
          <div className="space-y-2">
            {acessos && acessos.map(a => {
              const este = ipTeste[a.ip];
              return (
                <div key={a.id} className="bg-black/40 border border-white/5 rounded-xl p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="min-w-0">
                    <span className="text-xs text-white font-bold block">{a.actor_name}</span>
                    <span className="font-mono text-[11px] text-gray-300 block truncate">IP {a.ip || 'oculto'} · {(a.ua || '').slice(0, 60)}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-[11px] text-gray-300">{a.quando}</span>
                    {isDev && (
                      <button
                        type="button"
                        onClick={() => toggleIp(a.ip, !(ipTeste[a.ip] ?? false))}
                        title={ipTeste[a.ip] ? 'Desmarcar como teste (IP volta a contar como visitante real)' : 'Marcar IP como teste (eventos dele saem dos visitantes reais)'}
                        className={`font-mono text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase border transition-colors ${(ipTeste[a.ip] ?? false) ? 'text-sky-300 border-sky-400/40 bg-sky-400/10' : 'text-gray-300 border-white/20 bg-white/5 hover:text-white'}`}
                      >
                        {(ipTeste[a.ip] ?? false) ? 'teste ✓' : 'marcar teste'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {totalAcessos > PER_PAGE && (
            <div className="flex justify-between items-center border-t border-white/5 pt-3">
              <button type="button" disabled={pag === 0} onClick={() => { setPag(x => x - 1); loadAcessos((pag - 1) * PER_PAGE); }} className={btnGhost}>← Anterior</button>
              <span className="font-mono text-xs text-gray-300 uppercase">Página {pag + 1} de {Math.ceil(totalAcessos / PER_PAGE)}</span>
              <button type="button" disabled={(pag + 1) * PER_PAGE >= totalAcessos} onClick={() => { setPag(x => x + 1); loadAcessos((pag + 1) * PER_PAGE); }} className={btnGhost}>Próxima →</button>
            </div>
          )}
          <span className="font-mono text-[9px] text-gray-400 block">Marcados como teste ficam fora dos totais de visitantes reais no funil e nas inscrições.</span>
        </div>
      )}
    </div>
  );
}
