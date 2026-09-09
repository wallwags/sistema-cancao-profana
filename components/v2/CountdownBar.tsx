'use client';

import React, { useState, useEffect } from 'react';

interface CountdownBarProps {
  targetDate?: string | null;
  liveStatus?: 'em_breve' | 'ao_vivo' | 'encerrada';
  dia0Price?: number;
  liveUrl?: string | null;
}

function computeLeft(targetMs: number) {
  const difference = targetMs - Date.now();
  if (difference <= 0) return { days: '00', hours: '00', minutes: '00', seconds: '00', over: true };
  const d = Math.floor(difference / (1000 * 60 * 60 * 24));
  const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((difference % (1000 * 60)) / 1000);
  return {
    days: d < 10 ? `0${d}` : d.toString(),
    hours: h < 10 ? `0${h}` : h.toString(),
    minutes: m < 10 ? `0${m}` : m.toString(),
    seconds: s < 10 ? `0${s}` : s.toString(),
    over: false
  };
}

export default function CountdownBar({ targetDate, liveStatus = 'em_breve', dia0Price }: CountdownBarProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: '00',
    hours: '00',
    minutes: '00',
    seconds: '00'
  });
  const [targetOver, setTargetOver] = useState(false);

  useEffect(() => {
    const parsed = targetDate ? new Date(String(targetDate).replace(' ', 'T')).getTime() : NaN;
    if (isNaN(parsed)) {
      setTimeLeft({ days: '00', hours: '00', minutes: '00', seconds: '00' });
      setTargetOver(false);
      return;
    }
    const target = parsed;

    const tick = () => {
      const left = computeLeft(target);
      setTimeLeft({ days: left.days, hours: left.hours, minutes: left.minutes, seconds: left.seconds });
      setTargetOver(left.over);
      return left.over;
    };

    if (tick()) return;

    const timer = setInterval(() => {
      if (tick()) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const isLive = liveStatus === 'ao_vivo';
  const isPreLive = liveStatus === 'em_breve';

  // Faixa contextual por fase do evento
  let phaseLabel = '';
  let phaseValue = '';
  let barCls = 'bg-[#8B1E1E]';

  if (isLive) {
    phaseLabel = 'AO VIVO AGORA';
    phaseValue = `$${dia0Price ?? 25} até o fim da Live`;
    barCls = 'bg-gradient-to-r from-red-800 via-red-600 to-red-800';
  } else if (isPreLive && !targetOver) {
    phaseLabel = 'Live de Abertura · 14/09';
    phaseValue = '';
    barCls = 'bg-gradient-to-r from-[#3b1a4a] via-[#8B1E1E] to-[#3b1a4a]';
  } else if (targetDate && !targetOver) {
    // Lote vigente com live fora do ar: inscricoes abertas com contagem do lote
    phaseLabel = 'Inscrições abertas';
    phaseValue = '';
    barCls = 'bg-[#121215]';
  } else {
    phaseLabel = 'Inscrições encerradas';
    phaseValue = '';
    barCls = 'bg-[#121215]';
  }

  return (
    <div className={`w-full ${barCls} py-2 px-4 flex justify-center items-center gap-2 sm:gap-3 select-none text-center relative z-50 text-xs sm:text-sm border-b border-white/5 shadow-md transition-colors duration-500`}>
      <span className={`relative flex h-2 w-2 shrink-0 ${isLive || isPreLive ? '' : 'hidden'}`}>
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F0C265] opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F0C265]"></span>
      </span>

      <span className="font-mono text-[#F0EAE0] font-bold uppercase tracking-widest text-[10px] sm:text-[11px] whitespace-nowrap">
        {phaseLabel}
      </span>

      {isPreLive && (
        <span className="font-mono text-[#F0C265] font-bold uppercase tracking-wider text-[10px] sm:text-[11px] whitespace-nowrap">
          {phaseValue}
        </span>
      )}

      {/* countdown */}
      {(targetDate && !isLive && !targetOver) && (
        <div className="bg-[#05070B] px-3 py-1 rounded-full font-mono font-black text-[#F0C265] tracking-wider flex items-center gap-1.5 shadow-inner border border-white/5 text-[10px] sm:text-xs">
          <span className="text-[#F0C265] font-extrabold">{timeLeft.days}</span>
          <span className="text-gray-500 text-[9px] font-bold">D</span>
          <span className="text-[#F0C265]/40 font-bold">:</span>
          <span className="text-[#F0C265] font-extrabold">{timeLeft.hours}</span>
          <span className="text-gray-500 text-[9px] font-bold">H</span>
          <span className="text-[#F0C265]/40 font-bold">:</span>
          <span className="text-[#F0C265] font-extrabold">{timeLeft.minutes}</span>
          <span className="text-gray-500 text-[9px] font-bold">M</span>
          <span className="text-[#F0C265]/40 font-bold">:</span>
          <span className="text-[#FFF2D4] font-extrabold">{timeLeft.seconds}</span>
          <span className="text-gray-500 text-[9px] font-bold">S</span>
        </div>
      )}
    </div>
  );
}
