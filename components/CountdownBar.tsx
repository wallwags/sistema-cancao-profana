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
    <div className="w-full bg-[#8B1E1E] py-2.5 px-4 flex justify-center items-center gap-2 md:gap-3 select-none text-center relative z-50 text-xs md:text-sm">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_8px_#FF4B2E] animate-ping shrink-0"></span>
      <span className="font-mono text-[#F0EAE0] font-bold uppercase tracking-wider">
        Lote 1 ativo até:
      </span>
      <div className="bg-[#05070B] px-3.5 py-1 rounded-full font-mono font-black text-[#8B1E1E] tracking-widest flex items-center gap-1 shadow-inner">
        <span className="text-[#8B1E1E]">14 de Setembro</span>
      </div>
    </div>
  );
}
