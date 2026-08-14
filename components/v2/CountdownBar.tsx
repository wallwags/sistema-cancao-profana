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
    <div className="w-full bg-[#8B1E1E] py-2.5 px-4 flex justify-center items-center gap-2.5 sm:gap-3.5 select-none text-center relative z-50 text-xs md:text-sm border-b border-white/5 shadow-md">
      {/* High-visibility golden/yellow pulsating indicator */}
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F0C265] opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F0C265]"></span>
      </span>
      
      <span className="font-mono text-[#F0EAE0] font-black uppercase tracking-widest text-[10px] sm:text-xs">
        Lote 1 ativo até:
      </span>
      
      {/* Elegantly styled countdown ticking digits */}
      <div className="bg-[#05070B] px-3.5 py-1 rounded-full font-mono font-black text-[#F0C265] tracking-wider flex items-center gap-1.5 shadow-inner border border-white/5 text-[10px] sm:text-xs">
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
