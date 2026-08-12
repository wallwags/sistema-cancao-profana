'use client';

import React, { useState, useEffect } from 'react';

export default function CountdownBar() {
  const [timeLeft, setTimeLeft] = useState({
    days: '09',
    hours: '13',
    minutes: '10',
    seconds: '00'
  });

  useEffect(() => {
    // Simulator countdown target (10 days in the future relative to render)
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 9);
    targetDate.setHours(targetDate.getHours() + 13);
    targetDate.setMinutes(targetDate.getMinutes() + 10);

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate.getTime() - now;

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
    <div className="w-full bg-[#05070B] border-b border-white/5 py-3 px-6 flex justify-center items-center gap-3 select-none text-center relative z-50">
      <span className="font-mono text-xs md:text-sm text-[#B3B3B3] tracking-widest uppercase font-bold">
        FECHAMENTO DO LOTE ATIVO EM:
      </span>
      <div className="font-mono text-sm md:text-base font-black tracking-widest flex items-center gap-1.5">
        <span className="bg-gradient-to-b from-[#FFF2D4] via-[#F0C265] to-[#B88A28] bg-clip-text text-transparent animate-pulse">
          {timeLeft.days} D
        </span>
        <span className="text-white/30">:</span>
        <span className="bg-gradient-to-b from-[#FFF2D4] via-[#F0C265] to-[#B88A28] bg-clip-text text-transparent animate-pulse">
          {timeLeft.hours} H
        </span>
        <span className="text-white/30">:</span>
        <span className="bg-gradient-to-b from-[#FFF2D4] via-[#F0C265] to-[#B88A28] bg-clip-text text-transparent animate-pulse">
          {timeLeft.minutes} M
        </span>
        <span className="text-white/30">:</span>
        <span className="bg-gradient-to-b from-[#FFF2D4] via-[#F0C265] to-[#B88A28] bg-clip-text text-transparent animate-pulse">
          {timeLeft.seconds} S
        </span>
      </div>
      <span className="w-2 h-2 rounded-full bg-[#F0C265] shadow-[0_0_8px_#F0C265] animate-ping hidden sm:inline"></span>
    </div>
  );
}
