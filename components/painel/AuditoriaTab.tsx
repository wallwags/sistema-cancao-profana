'use client';

// Aba AUDITORIA do painel /sagrado · extraída 1:1 do page.tsx (17/09, dívida técnica).
import { btnGhost } from './ui';

interface AuditoriaTabProps {
  audit: Array<Record<string, unknown>>;
  openAuditTab: () => void;
  fmtDate: (v: string | null | undefined) => string;
}

export default function AuditoriaTab({ audit, openAuditTab, fmtDate }: AuditoriaTabProps) {
  return (
    <div className="space-y-4 fade-up-800">
      <div className="flex justify-between items-center">
        <span className="font-mono text-xs text-gray-400 uppercase tracking-widest">Histórico das ações internas ({audit.length})</span>
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
                <span className="text-xs text-white font-bold block">{String(a.actor_name || '-')} <span className="text-gray-400 font-normal">{String(a.action)}</span></span>
                <span className="font-mono text-xs text-[#F0C265] block truncate">{String(a.target || '')}</span>
                {detailText && <span className="font-mono text-[11px] text-gray-500 block">{detailText}</span>}
              </div>
              <span className="font-mono text-[11px] text-gray-500 shrink-0">{fmtDate(String(a.created_at))}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
