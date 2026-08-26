import React from 'react';
import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';

// Self-hosted via next/font — same families as before (variable axis covers every weight used),
// no render-blocking external CSS. NOTE: Space Grotesk has no real 900; `font-black` keeps being
// synthesized by the browser exactly like it was with the old Google Fonts <link>.
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk',
});

export const metadata: Metadata = {
  title: 'Canção Profana — Concurso Musical Oficial 2026',
  description: 'Grave seu som de graça e concorra à produção da sua carreira com o Estúdio Pedra Profana.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`scroll-smooth ${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="bg-[#05070B] text-[#F0EAE0] antialiased">
        <div className="bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#E3B552]/15 via-[#05070B]/80 to-[#05070B] min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
