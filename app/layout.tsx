import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="pt-BR" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <!-- GOOGLE FONTS STYLESHEET (The Missing Link!) -->
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700;900&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#05070B] text-[#F0EAE0] antialiased">
        <div className="bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#E3B552]/15 via-[#05070B]/80 to-[#05070B] min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
