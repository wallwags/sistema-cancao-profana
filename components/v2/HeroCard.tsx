'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function HeroCard() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      
      {/* CARD PRINCIPAL: O PRÊMIO (1º LUGAR) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="bento-card-coral col-span-12 md:col-span-7 flex flex-col justify-between relative overflow-hidden group min-h-[340px]"
      >
        {/* Decorative subtle light leaks */}
        <div className="absolute -right-32 -top-32 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none group-hover:opacity-100 transition-opacity duration-700"></div>
        <div className="absolute -left-32 -bottom-32 w-80 h-80 bg-black/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="space-y-4 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-widest font-bold text-obsidian-ink/70 font-[Inter]">
              VALOR ESTIMADO DE CARREIRA (1º LUGAR)
            </span>
            <span className="bento-badge bg-obsidian-deep text-bento-snow text-[9px] font-bold px-2.5 py-1">
              PRÊMIO MÁXIMO
            </span>
          </div>

          <h1 className="font-black text-5xl sm:text-6xl lg:text-7xl tracking-tightest text-obsidian-ink font-[Space_Grotesk] leading-none select-none">
            R$ 20.000,00
          </h1>

          <p className="text-sm font-semibold text-obsidian-ink/80 leading-relaxed max-w-lg">
            Um pacote completo de estúdio físico e lançamentos digitais garantidos, entregues diretamente pela equipe técnica Pedra Profana.
          </p>
        </div>

        <div className="border-t border-obsidian-ink/15 pt-4 mt-6 relative z-10 flex flex-wrap justify-between items-center gap-2">
          <span className="text-[11px] font-bold uppercase text-obsidian-ink/60 font-[Inter] tracking-wide">
            * Valores equivalentes em serviços de estúdio profissional.
          </span>
          <div className="flex items-center gap-1 font-mono text-[9px] text-bento-snow uppercase tracking-wider bg-obsidian-deep px-3 py-1.5 rounded-full font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF8F7A] animate-pulse mr-1"></span>
            MASTER MIX STUDIO
          </div>
        </div>
      </motion.div>

      {/* CARDS SECUNDÁRIOS: 2º E 3º LUGAR EM BENTO GRID */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
        className="col-span-12 md:col-span-5 flex flex-col gap-4 md:gap-6 justify-between"
      >
        {/* CARD 2º LUGAR */}
        <div className="bento-card flex-1 flex flex-col justify-between p-6 relative overflow-hidden group min-h-[160px]">
          <div className="space-y-2 relative z-10">
            <div className="flex justify-between items-start">
              <span className="text-xs uppercase tracking-widest font-bold text-bento-snow/60 font-[Inter]">
                PRODUÇÃO PARCIAL (2º LUGAR)
              </span>
              <span className="bento-badge bg-bento-periwinkle/15 text-bento-periwinkle text-[9px] font-bold font-mono tracking-wider px-2.5 py-1">
                VAGA 2
              </span>
            </div>
            
            <h2 className="font-black text-2xl md:text-3xl tracking-tightest text-bento-snow font-[Space_Grotesk]">
              R$ 5.000,00
            </h2>
            
            <p className="text-xs font-medium text-bento-snow/60 font-[Inter]">
              Produção completa de 2 singles autorais com gravação, mixagem e masterização de alta definição no estúdio.
            </p>
          </div>
        </div>

        {/* CARD 3º LUGAR */}
        <div className="bento-card flex-1 flex flex-col justify-between p-6 relative overflow-hidden group min-h-[160px]">
          <div className="space-y-2 relative z-10">
            <div className="flex justify-between items-start">
              <span className="text-xs uppercase tracking-widest font-bold text-bento-snow/60 font-[Inter]">
                PRODUÇÃO INICIAL (3º LUGAR)
              </span>
              <span className="bento-badge bg-bento-amber/15 text-bento-amber text-[9px] font-bold font-mono tracking-wider px-2.5 py-1">
                VAGA 3
              </span>
            </div>
            
            <h2 className="font-black text-2xl md:text-3xl tracking-tightest text-bento-snow font-[Space_Grotesk]">
              R$ 2.500,00
            </h2>
            
            <p className="text-xs font-medium text-bento-snow/60 font-[Inter]">
              Gravação e produção de 1 single de trabalho autoral com masterização incluída pela equipe.
            </p>
          </div>
        </div>

      </motion.div>

    </div>
  );
}
