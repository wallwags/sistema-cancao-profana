'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function HeroCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-3xl p-10 md:p-16 border border-[#E3B552]/20 bg-[#0B0F19]/60 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_20px_40px_-15px_rgba(0,0,0,0.5)] flex flex-col justify-between items-center text-center space-y-4"
    >
      {/* Glow Mesh Vector representation behind */}
      <div className="absolute -right-32 -top-32 w-80 h-80 bg-[#E3B552]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -left-32 -bottom-32 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="space-y-3 relative z-10">
        <span className="font-mono text-sm md:text-base text-[#F0C265] font-black tracking-widest uppercase block">
          VALOR TOTAL ESTIMADO DE CARREIRA (1º LUGAR)
        </span>
        
        {/* Massive 3D Drop Shadow Price Title */}
        <h1 className="text-6xl md:text-8xl font-black font-display bg-gradient-to-b from-[#FFF2D4] via-[#F0C265] to-[#B88A28] bg-clip-text text-transparent drop-shadow-[0_0_45px_rgba(240,194,101,0.45)] select-none">
          R$ 20.000,00
        </h1>
        
        <p className="text-sm md:text-base text-[#E0E0E0] max-w-xl mx-auto leading-relaxed font-normal pt-2">
          Um pacote completo de estúdio físico e lançamentos digitais garantidos, entregues diretamente pela equipe Pedra Profana.
        </p>
      </div>

      <div className="w-full flex justify-center pt-4 relative z-10">
        <div className="flex items-center gap-1.5 font-mono text-xs text-[#B3B3B3] uppercase tracking-wider bg-black/40 border border-white/5 px-4 py-2 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F0C265] animate-ping mr-1"></span>
          MASTER MIX COMPLETE STUDIO UNIT
        </div>
      </div>
    </motion.div>
  );
}
