'use client';

import React from 'react';
import Link from 'next/link';

export default function TermosPage() {
  return (
    <div className="py-16 px-6 bg-[#05070B] min-h-screen text-[#F0EAE0] flex items-center justify-center">
      <div className="max-w-4xl mx-auto space-y-8 bg-[#0B0F19]/60 border border-white/10 p-8 md:p-12 rounded-[32px] backdrop-blur-xl shadow-2xl">
        
        <div className="border-b border-white/5 pb-6 text-center md:text-left">
          <h1 className="font-display font-black text-3xl text-white uppercase tracking-tight">TERMOS DE USO DO PORTAL</h1>
          <p className="text-xs text-[#F0C265] font-mono uppercase tracking-widest mt-2">CONCURSO MUSICAL CANÇÃO PROFANA — ESTÚDIO PEDRA PROFANA</p>
        </div>

        <div className="space-y-6 text-sm text-[#A89880] leading-relaxed">
          <p>Bem-vindo ao Portal de Inscrições do Concurso Musical Canção Profana, de propriedade e gerido pelo Estúdio Pedra Profana. Ao realizar a sua matrícula, você e os demais integrantes declaram aceitar e cumprir integralmente as condições descritas abaixo.</p>

          <div className="space-y-2">
            <h2 className="font-display font-bold text-lg text-white">1. ELEGIBILIDADE E INSCRIÇÕES</h2>
            <p>1.1. O concurso é aberto exclusivamente a projetos musicais compostos por grupos contendo no mínimo 2 (dois) e no máximo 7 (sete) integrantes.</p>
            <p>1.2. É obrigatória a inclusão de pelo menos uma música original (autoral) escrita majoritariamente em língua portuguesa ou em formato instrumental no repertório do projeto.</p>
            <p>1.3. O repertório a ser apresentado no concurso é limitado ao máximo de 3 (três) músicas por banda.</p>
                  <p>1.4. O concurso recebe até 30 (trinta) bandas/projetos, totalizando até 210 (duzentas e dez) vagas individuais, respeitando o limite de 7 (sete) integrantes por banda.</p>
          </div>

          <div className="space-y-2">
            <h2 className="font-display font-bold text-lg text-white">2. TAXAS DE INSCRIÇÃO E LOTES</h2>
            <p>2.1. O valor das inscrições é calculado dinamicamente com base no lote vigente no exato momento da matrícula, multiplicado pelo número total de integrantes informados.</p>
            <p>2.2. O pagamento é realizado em cota única de forma digital via PIX. Uma vez processado o pagamento, o valor não será reembolsável, salvo por cancelamento formal do evento por parte do Estúdio Pedra Profana.</p>
          </div>

          <div className="space-y-2">
            <h2 className="font-display font-bold text-lg text-white">3. DIREITOS AUTORAIS E DISTRIBUIÇÃO</h2>
            <p>3.1. Ao se inscrever, a banda autoriza expressamente a captação de áudio, gravação de vídeo e transmissão ao vivo (streaming) de sua apresentação durante as etapas do concurso.</p>
            <p>3.2. Os direitos autorais morais sobre as composições permanecem com seus respectivos autores. O acordo e os percentuais de distribuição digital das gravações oficiais geradas no concurso serão decididos amigavelmente entre as partes ao encerramento das etapas.</p>
          </div>

          <div className="space-y-2">
            <h2 className="font-display font-bold text-lg text-white">4. INGRESSO SOLIDÁRIO</h2>
            <p>4.1. É condição obrigatória e regulamentar do concurso a entrega de 1kg (um quilo) de alimento não-perecível por integrante na entrada de cada etapa física (incluindo as sessões de gravação ao vivo).</p>
          </div>

          <div className="space-y-2">
            <h2 className="font-display font-bold text-lg text-white">5. PENALIDADES</h2>
            <p>5.1. Informações cadastrais falsas (como CPFs inativos ou idades incorretas), agressões físicas ou comportamentos antidesportivos no estúdio resultarão na desclassificação imediata do projeto, sem devolução das taxas pagas.</p>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 flex justify-between items-center text-xs font-mono">
          <span>Versão: 1.0 (2026)</span>
          <Link href="/" className="text-[#F0C265] hover:underline uppercase">Voltar ao Console</Link>
        </div>

      </div>
    </div>
  );
}
