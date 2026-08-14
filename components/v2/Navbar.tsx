'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface NavbarProps {
  onOpenQuiz: () => void;
}

export default function Navbar({ onOpenQuiz }: NavbarProps) {
  const [activeTab, setActiveTab] = useState('PRINCÍPIOS');
  const menuItems = ['PRINCÍPIOS', 'FASES', 'LOTES', 'DÚVIDAS'];

  const handleScrollToSection = (item: string) => {
    setActiveTab(item);
    let elementId = item.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (elementId === 'duvidas') {
      elementId = 'faq';
    } else if (elementId === 'fases') {
      elementId = 'cronograma';
    }

    const targetElement = document.getElementById(elementId) || document.getElementById(elementId.toUpperCase());
    if (targetElement) {
      const headerOffset = 130;
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <header className="w-full bg-[#05070B]/90 backdrop-blur-md border-b border-white/5 py-3 px-4 sm:px-6 lg:px-8 relative z-40">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        
        {/* LOGO ASSEMBLY */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-[#F0C265] flex items-center justify-center font-display font-black text-black text-xl border-2 border-black shadow-[0_0_15px_rgba(240,194,101,0.2)]">
            P
          </div>
          <div>
            <span className="font-display font-black text-white text-md sm:text-lg tracking-tight uppercase block leading-none">
              CANÇÃO PROFANA
            </span>
            <span className="font-mono text-[9px] text-[#F0C265] tracking-widest block uppercase mt-1">
              MÚSICA AUTORAL
            </span>
          </div>
        </div>

        {/* INTERACTIVE NAVIGATION LINKS WITH FRAMER-MOTION UNDERLINE */}
        <nav className="hidden md:flex items-center gap-8 text-[11px] font-mono font-bold tracking-wider text-[#B3B3B3] uppercase">
          {menuItems.map((item) => {
            const isActive = activeTab === item;
            return (
              <button
                key={item}
                onClick={() => handleScrollToSection(item)}
                className={`relative py-1 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#F0C265]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070B] ${
                  isActive ? 'text-white' : 'hover:text-white'
                }`}
              >
                {item}
                {isActive && (
                  <motion.span
                    layoutId="activeUnderline"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#F0C265]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* CTA BUTTON */}
        <div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenQuiz}
            className="relative overflow-hidden bg-gradient-to-b from-[#FFF2D4] via-[#F0C265] to-[#B88A28] text-black font-display font-black text-xs uppercase tracking-widest px-6 py-3 rounded-full border border-black shadow-[0_0_20px_rgba(240,194,101,0.35)] transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#F0C265]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070B] animate-none"
          >
            INSCREVER-SE
          </motion.button>
        </div>

      </div>
    </header>
  );
}
