'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface NavbarProps {
  onOpenQuiz: () => void;
}

// SSR-safe layout effect (avoids React's useLayoutEffect SSR warning)
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default function Navbar({ onOpenQuiz }: NavbarProps) {
  const [activeTab, setActiveTab] = useState('PRINCÍPIOS');
  const menuItems = ['PRINCÍPIOS', 'FASES', 'LOTES', 'DÚVIDAS'];

  const navRef = useRef<HTMLElement | null>(null);
  const underlineRef = useRef<HTMLSpanElement | null>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const moveUnderline = (item: string, animate: boolean) => {
    const btn = btnRefs.current[item];
    const underline = underlineRef.current;
    if (!btn || !underline) return;
    gsap.to(underline, {
      x: btn.offsetLeft,
      width: btn.offsetWidth,
      duration: animate ? 0.4 : 0,
      ease: 'power3.out',
      overwrite: 'auto'
    });
  };

  useIsomorphicLayoutEffect(() => {
    moveUnderline(activeTab, false);
    const handleResize = () => moveUnderline(activeTab, false);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    moveUnderline(activeTab, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

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

        {/* INTERACTIVE NAVIGATION LINKS — gold underline slides via GSAP */}
        <nav ref={navRef} className="hidden md:flex relative items-center gap-8 text-[11px] font-mono font-bold tracking-wider text-[#B3B3B3] uppercase">
          {menuItems.map((item) => {
            const isActive = activeTab === item;
            return (
              <button
                key={item}
                ref={(el) => { btnRefs.current[item] = el; }}
                onClick={() => handleScrollToSection(item)}
                className={`relative py-1 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#F0C265]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070B] ${
                  isActive ? 'text-white' : 'hover:text-white'
                }`}
              >
                {item}
              </button>
            );
          })}
          <span ref={underlineRef} className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#F0C265] pointer-events-none" />
        </nav>

        {/* CTA BUTTON — CSS touch-aware feedback (works on mobile via :active) */}
        <div>
          <button
            onClick={onOpenQuiz}
            className="hover-scale relative overflow-hidden bg-gradient-to-b from-[#FFF2D4] via-[#F0C265] to-[#B88A28] text-black font-display font-black text-xs uppercase tracking-widest px-6 py-3 rounded-full border border-black shadow-[0_0_20px_rgba(240,194,101,0.35)] outline-none focus-visible:ring-2 focus-visible:ring-[#F0C265]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070B]"
          >
            INSCREVER-SE
          </button>
        </div>

      </div>
    </header>
  );
}
