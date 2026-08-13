'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function HeroCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-[32px] p-8 md:p-14 border-2 border-[#F0C265]/30 hover:border-[#F0C265]/50 bg-gradient-to-b from-[#0B1220] via-[#060A14] to-[#03050A] backdrop-blur-2xl shadow-[0_0_60px_rgba(240,194,101,0.12),inset_0_1px_1px_rgba(255,255,255,0.1)] flex flex-col justify-between items-center text-center space-y-6 transition-all duration-500 group"
    >
      {/* Luxury Golden Glow Leak Overlay Vectors */}
      <div className="absolute -right-40 -top-40 w-96 h-90 bg-gradient-to-br from-[#F0C265]/20 to-transparent rounded-full blur-[100px] pointer-events-none group-hover:opacity-100 transition-opacity duration-700"></div>
      <div className="absolute -left-40 -bottom-40 w-96 h-90 bg-gradient-to-tr from-purple-600/15 to-transparent rounded-full blur-[100px] pointer-events-none"></div>
      
      {/* Gold grid lines background details */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(240,194,101,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(240,194,101,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

      <div className="space-y-4 relative z-10 w-full">
        <span className="font-mono text-[11px] md:text-xs text-[#F0C265] font-black tracking-widest uppercase block bg-[#F0C265]/10 border border-[#F0C265]/20 px-4 py-1.5 rounded-full w-max mx-auto">
          VALOR TOTAL ESTIMADO DE CARREIRA (1º LUGAR)
        </span>
        
        {/* Massive 3D Drop Shadow Price Title - Fully Responsive single line */}
        <h1 className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black font-display bg-gradient-to-b from-[#FFF2D4] via-[#F0C265] to-[#B88A28] bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(240,194,101,0.45)] select-none whitespace-nowrap tracking-tight leading-none">
          R$ 20.000,00
        </h1>
        
        {/* Texts with contrast hierarchy reversed according to instructions */}
        <p className="text-sm md:text-base text-white font-semibold max-w-xl mx-auto leading-relaxed pt-2">
          Um pacote completo de estúdio físico e lançamentos digitais garantidos, entregues diretamente pela equipe Pedra Profana.
        </p>
        
        <p className="text-[11px] md:text-xs text-gray-500 max-w-lg mx-auto font-normal leading-normal pt-1">
          Os valores indicados representam custos equivalentes em serviços de produção profissional no estúdio, e não prêmio em dinheiro físico.
        </p>
      </div>

      <div className="w-full flex justify-center pt-2 relative z-10">
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-gray-400 uppercase tracking-wider bg-black/50 border border-white/5 px-4 py-2 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F0C265] animate-ping mr-1"></span>
          MASTER MIX COMPLETE STUDIO UNIT
        </div>
      </div>
    </motion.div>
  );
}
