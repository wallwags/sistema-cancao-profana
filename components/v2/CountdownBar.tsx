'use client';

import React, { useState, useEffect } from 'react';

export default function CountdownBar() {
  const [timeLeft, setTimeLeft] = useState({
    days: '31',
    hours: '12',
    minutes: '45',
    seconds: '00'
  });

  useEffect(() => {
    // Set target date for Lote 1 close: September 14, 2026 at 23:59:00
    const targetDate = new Date("2026-09-14T23:59:00").getTime();

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        clearInterval(timer);
        setTimeLeft({ days: '00', hours: '00', minutes: '00', seconds: '00' });
        return;
      }

      const d = Math.floor(difference / (1000 * 60 * 60 * 24));
      const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({
        days: d < 10 ? `0${d}` : d.toString(),
        hours: h < 10 ? `0${h}` : h.toString(),
        minutes: m < 10 ? `0${m}` : m.toString(),
        seconds: s < 10 ? `0${s}` : s.toString()
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full bg-bento-amber sticky top-0 z-50 px-4 py-2 border-b border-bento-border">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-1 select-none text-center">
        
        {/* High-visibility live dot in Obsidian color */}
        <span className="live-dot text-obsidian-ink text-sm leading-none select-none">
          ●
        </span>
        
        <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-obsidian-ink whitespace-nowrap font-[Inter]">
          Lote 1 ativo até:
        </span>
        
        {/* Elegantly styled countdown ticking digits container */}
        <div className="flex items-center gap-1.5 bg-obsidian-deep rounded-bento-inner px-3 py-1 border border-bento-border select-none">
          <span className="font-black text-sm text-bento-amber tabular-nums font-[Space_Grotesk]">{timeLeft.days}</span>
          <span className="text-[10px] font-bold uppercase text-bento-amber/70 leading-none font-[Inter] mr-0.5">D</span>
          <span className="text-bento-amber/40 text-sm font-bold">:</span>
          <span className="font-black text-sm text-bento-amber tabular-nums font-[Space_Grotesk]">{timeLeft.hours}</span>
          <span className="text-[10px] font-bold uppercase text-bento-amber/70 leading-none font-[Inter] mr-0.5">H</span>
          <span className="text-bento-amber/40 text-sm font-bold">:</span>
          <span className="font-black text-sm text-bento-amber tabular-nums font-[Space_Grotesk]">{timeLeft.minutes}</span>
          <span className="text-[10px] font-bold uppercase text-bento-amber/70 leading-none font-[Inter] mr-0.5">M</span>
          <span className="text-bento-amber/40 text-sm font-bold">:</span>
          <span className="font-black text-sm text-bento-amber tabular-nums font-[Space_Grotesk]">{timeLeft.seconds}</span>
          <span className="text-[10px] font-bold uppercase text-bento-amber/70 leading-none font-[Inter]">S</span>
        </div>
      </div>
    </div>
  );
}
