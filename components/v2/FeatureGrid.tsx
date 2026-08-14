'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Music, Video, Camera, Globe } from 'lucide-react';

interface FeatureCardProps {
  badge: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
};

function FeatureCard({ badge, icon, title, description }: FeatureCardProps) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -6, scale: 1.01 }}
      className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 hover:border-[#E3B552]/30 rounded-2xl p-5 sm:p-6 relative space-y-4 flex flex-col justify-between shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_15px_30px_rgba(0,0,0,0.4)] transition-colors h-full group"
    >
      {/* Floating Estimated Value Badge in Top Right */}
      <div className="absolute top-4 right-4 bg-black/50 px-2.5 py-1 rounded border border-[#E3B552]/30 font-mono text-xs text-[#F0C265] font-bold">
        {badge}
      </div>

      <div className="space-y-4 pt-4">
        {/* Lucide Icon Display with clean styling */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-b from-[#FFF2D4] via-[#F0C265] to-[#B88A28] flex items-center justify-center text-black shadow-[0_0_15px_rgba(240,194,101,0.2)]">
          {icon}
        </div>
        
        <div className="border-t border-[#2E2820] pt-4 space-y-2">
          <h4 className="font-display font-black text-md text-white uppercase tracking-tight">
            {title}
          </h4>
          <p className="text-xs text-[#B3B3B3] leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function FeatureGrid() {
  const cards = [
    {
      badge: '~~R$ 12K~~',
      icon: <Music className="w-6 h-6 stroke-[2.2]" />,
      title: 'GRAVAÇÃO DE EP',
      description: 'Produção completa de 5 faixas autorais inéditas, mixagem e masterização de estúdio.'
    },
    {
      badge: '~~R$ 5K~~',
      icon: <Video className="w-6 h-6 stroke-[2.2]" />,
      title: 'WEBCLIP OFICIAL',
      description: 'Captação profissional em alta resolução de um webclipe de divulgação da faixa foco.'
    },
    {
      badge: '~~R$ 1.5K~~',
      icon: <Camera className="w-6 h-6 stroke-[2.2]" />,
      title: 'SESSÃO DE FOTOS',
      description: 'Fotos oficiais de divulgação com fotógrafo veterano de estúdio e direção artística.'
    },
    {
      badge: '~~R$ 1.5K~~',
      icon: <Globe className="w-6 h-6 stroke-[2.2]" />,
      title: 'DISTRIBUIÇÃO DIGITAL',
      description: 'Lançamento de carreira fonográfica do EP oficial em todas as plataformas de streaming.'
    }
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-100px' }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      {cards.map((card, i) => (
        <FeatureCard
          key={i}
          badge={card.badge}
          icon={card.icon}
          title={card.title}
          description={card.description}
        />
      ))}
    </motion.div>
  );
}
