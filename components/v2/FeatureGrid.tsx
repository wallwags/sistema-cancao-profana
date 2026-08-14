'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Music, Video, Camera, Globe } from 'lucide-react';

interface FeatureCardProps {
  badge: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  isLarge: boolean;
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

function FeatureCard({ badge, icon, title, description, isLarge }: FeatureCardProps) {
  return (
    <motion.div
      variants={itemVariants}
      className={`bento-card group relative flex flex-col justify-between transition-all duration-200 ${
        isLarge 
          ? 'col-span-12 md:col-span-7' 
          : 'col-span-12 sm:col-span-6 md:col-span-5'
      }`}
    >
      {/* Floating Estimated Value Badge in Top Right */}
      <div className="absolute top-4 right-4 bg-obsidian-deep border border-bento-border px-3 py-1 rounded-full font-mono text-[10px] text-bento-amber font-bold uppercase tracking-wider">
        {badge}
      </div>

      <div className="space-y-4 pt-4">
        {/* Lucide Icon Display with clean styling */}
        <div className="w-10 h-10 rounded-xl bg-obsidian-base flex items-center justify-center text-bento-periwinkle group-hover:bg-bento-periwinkle/15 group-hover:text-bento-periwinkle transition-colors duration-200">
          {icon}
        </div>
        
        <div className="bento-divider" />
        
        <div className="space-y-2">
          <h4 className="font-black text-lg tracking-tightest text-bento-snow mb-2 font-[Space_Grotesk] uppercase">
            {title}
          </h4>
          <p className="text-sm font-medium text-bento-snow/60 leading-relaxed font-[Inter]">
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
      icon: <Music className="w-5 h-5 stroke-[2.2]" />,
      title: 'GRAVAÇÃO DE EP',
      description: 'Produção completa de 5 faixas autorais inéditas, mixagem e masterização de estúdio.',
      isLarge: true
    },
    {
      badge: '~~R$ 5K~~',
      icon: <Video className="w-5 h-5 stroke-[2.2]" />,
      title: 'WEBCLIP OFICIAL',
      description: 'Captação profissional em alta resolução de um webclipe de divulgação da faixa foco.',
      isLarge: false
    },
    {
      badge: '~~R$ 1.5K~~',
      icon: <Camera className="w-5 h-5 stroke-[2.2]" />,
      title: 'SESSÃO DE FOTOS',
      description: 'Fotos oficiais de divulgação com fotógrafo veterano de estúdio e direção artística.',
      isLarge: false
    },
    {
      badge: '~~R$ 1.5K~~',
      icon: <Globe className="w-5 h-5 stroke-[2.2]" />,
      title: 'DISTRIBUIÇÃO DIGITAL',
      description: 'Lançamento de carreira fonográfica do EP oficial em todas as plataformas de streaming.',
      isLarge: true
    }
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-100px' }}
      className="grid grid-cols-12 gap-4 md:gap-6 w-full"
    >
      {cards.map((card, i) => (
        <FeatureCard
          key={i}
          badge={card.badge}
          icon={card.icon}
          title={card.title}
          description={card.description}
          isLarge={card.isLarge}
        />
      ))}
    </motion.div>
  );
}
