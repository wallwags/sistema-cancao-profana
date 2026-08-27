'use client';

import React, { useState, useEffect } from 'react';

interface CountdownBarProps {
  targetDate?: string | null;
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

export default function CountdownBar({ targetDate }: CountdownBarProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: '—',
    hours: '--',
    minutes: '--',
    seconds: '--'
  });

  useEffect(() => {
    const parsed = targetDate ? new Date(String(targetDate).replace(' ', 'T')).getTime() : NaN;
    const fallback = new Date('2026-09-14T23:59:00-03:00').getTime();
    const target = !isNaN(parsed) ? parsed : fallback;

    const tick = () => {
      const left = computeLeft(target);
      setTimeLeft({ days: left.days, hours: left.hours, minutes: left.minutes, seconds: left.seconds });
      return left.over;
    };

    if (tick()) return;

    const timer = setInterval(() => {
      if (tick()) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="w-full bg-[#8B1E1E] py-2 px-4 flex justify-center items-center gap-2 sm:gap-3 select-none text-center relative z-50 text-xs sm:text-sm border-b border-white/5 shadow-md">
      {/* High-visibility golden/yellow pulsating indicator */}
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F0C265] opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F0C265]"></span>
      </span>
      
      <span className="font-mono text-[#F0EAE0] font-bold uppercase tracking-widest text-[10px] sm:text-[11px] whitespace-nowrap">
        Lote 1 ativo até:
      </span>
      
      {/* Elegantly styled countdown ticking digits */}
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
        <span className="text-[#F0C265] font-extrabold text-[#FFF2D4]">{timeLeft.seconds}</span>
        <span className="text-gray-500 text-[9px] font-bold">S</span>
      </div>
    </div>
  );
}
