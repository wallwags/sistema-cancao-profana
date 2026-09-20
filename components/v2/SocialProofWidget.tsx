'use client';

// Widget de prova social da home (canto inferior direito): mini-card pulsante com
// mosaico de fotos, bandas que "acabaram de garantir vaga" e visitantes agora.
// Numeros ALEATORIOS dentro das faixas definidas pelo admin na aba Widgets (ficticios por design).
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface SocialProofWidgetProps {
  ativo: boolean;
  imagem: string;
  bMin: number;
  bMax: number;
  vMin: number;
  vMax: number;
}

const aleatorio = (min: number, max: number) => Math.floor(Math.random() * (Math.max(max, min) - Math.min(max, min) + 1)) + Math.min(max, min);

export default function SocialProofWidget({ ativo, imagem, bMin, bMax, vMin, vMax }: SocialProofWidgetProps) {
  const [visivel, setVisivel] = useState(false);
  const [bandas, setBandas] = useState(aleatorio(bMin, bMax));
  const [visitantes, setVisitantes] = useState(aleatorio(vMin, vMax));
  const [dispensado, setDispensado] = useState(true); // true ate montar no cliente (evita mismatch SSR)

  useEffect(() => {
    if (!ativo) return;
    if (typeof window !== 'undefined' && window.sessionStorage.getItem('spw_dispensado') === '1') return;
    setDispensado(false);
    let mostrar: ReturnType<typeof setTimeout> | undefined;
    let ocultar: ReturnType<typeof setTimeout> | undefined;
    let vivo = true;

    const novoCiclo = () => {
      if (!vivo) return;
      setBandas(aleatorio(bMin, bMax));
      setVisitantes(aleatorio(vMin, vMax));
      setVisivel(true);
      ocultar = setTimeout(() => {
        if (!vivo) return;
        setVisivel(false);
        mostrar = setTimeout(novoCiclo, aleatorio(12000, 20000));
      }, aleatorio(8000, 11000));
    };
    mostrar = setTimeout(novoCiclo, 4000);

    return () => {
      vivo = false;
      if (mostrar) clearTimeout(mostrar);
      if (ocultar) clearTimeout(ocultar);
    };
  }, [ativo, bMin, bMax, vMin, vMax]);

  if (!ativo || dispensado) return null;

  return (
    <div
      className={`fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-[60] transition-all duration-500 ${visivel ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
      role="status"
    >
      <div className="relative flex items-center gap-3 bg-[#0B0F19]/95 backdrop-blur-md border border-[#F0C265]/35 rounded-2xl pl-2.5 pr-8 py-2.5 shadow-[0_10px_40px_rgba(0,0,0,0.75)] max-w-[280px] sm:max-w-none">
        <div className="relative shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imagem} alt="Artistas do concurso" className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border border-[#F0C265]/40" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#10B981] border border-black" />
          </span>
        </div>
        <div className="min-w-0 leading-tight">
          <span className="block text-[11px] sm:text-xs font-bold text-white">{bandas} {bandas === 1 ? 'banda acabou de' : 'bandas acabaram de'} garantir vaga</span>
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse shrink-0" />
            {visitantes} visitantes agora
          </span>
        </div>
        <button
          type="button"
          aria-label="Fechar aviso"
          onClick={() => { setDispensado(true); setVisivel(false); try { window.sessionStorage.setItem('spw_dispensado', '1'); } catch { /* */ } }}
          className="absolute top-1.5 right-1.5 text-gray-500 hover:text-white text-sm leading-none"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
