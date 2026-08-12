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
    <div className="w-full bg-[#120F0D] border-b border-white/5 py-3 px-6 flex justify-center items-center gap-3 select-none text-center relative z-50">
      <span className="font-mono text-xs md:text-sm text-[#A89880] tracking-widest uppercase font-bold">
        FECHAMENTO DO LOTE ATIVO EM:
      </span>
      <div className="font-mono text-sm md:text-base font-bold tracking-widest flex items-center gap-1.5 text-[#F0EAE0]">
        <span className="text-[#FF4B2E] font-black animate-pulse">
          {timeLeft.days} D
        </span>
        <span className="text-white/20">:</span>
        <span className="text-[#FF4B2E] font-black animate-pulse">
          {timeLeft.hours} H
        </span>
        <span className="text-white/20">:</span>
        <span className="text-[#FF4B2E] font-black animate-pulse">
          {timeLeft.minutes} M
        </span>
        <span className="text-white/20">:</span>
        <span className="text-[#FF4B2E] font-black animate-pulse">
          {timeLeft.seconds} S
        </span>
      </div>
      <span className="w-1.5 h-1.5 rounded-full bg-[#FF4B2E] shadow-[0_0_8px_#FF4B2E] animate-ping hidden sm:inline"></span>
    </div>
  );
}
