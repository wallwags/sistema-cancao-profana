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
    <header className="w-full bg-obsidian-deep/90 backdrop-blur-sm border-b border-bento-border sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
        
        {/* LOGO ASSEMBLY */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#F0C265] flex items-center justify-center font-[Space_Grotesk] font-black text-black text-lg border border-black shadow-sm">
            P
          </div>
          <div>
            <span className="font-[Space_Grotesk] font-black text-bento-snow text-sm sm:text-base tracking-tightest block leading-none uppercase">
              CANÇÃO PROFANA
            </span>
            <span className="font-mono text-[8px] text-[#F0C265] tracking-widest block uppercase mt-0.5">
              MÚSICA AUTORAL
            </span>
          </div>
        </div>

        {/* INTERACTIVE NAVIGATION LINKS WITH FRAMER-MOTION UNDERLINE */}
        <nav className="hidden md:flex items-center gap-8 uppercase">
          {menuItems.map((item) => {
            const isActive = activeTab === item;
            return (
              <button
                key={item}
                onClick={() => handleScrollToSection(item)}
                className={`relative py-1 text-xs font-medium transition-colors duration-200 font-mono tracking-wider focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-periwinkle/60 focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian-base ${
                  isActive ? 'text-bento-snow' : 'text-bento-snow/60 hover:text-bento-snow'
                }`}
              >
                {item}
                {isActive && (
                  <motion.span
                    layoutId="activeUnderline"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-bento-periwinkle"
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
            className="btn-gold-shimmer rounded-full px-4 py-2 text-xs sm:text-sm font-bold uppercase tracking-widest transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-periwinkle/60 focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian-base"
          >
            INSCREVER-SE
          </motion.button>
        </div>

      </div>
    </header>
  );
}
