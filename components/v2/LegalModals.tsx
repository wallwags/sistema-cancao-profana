'use client';

import React from 'react';

interface LegalModalProps {
  open: boolean;
  onClose: () => void;
}

// CSS-animated popups (no framer-motion) so they cost zero JS unless opened.
export function TermsModal({ open, onClose }: LegalModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 sm:p-6 flex justify-center items-start">
      <div className="absolute inset-0 cursor-pointer" onClick={onClose}></div>
      <div className="legal-pop bg-black/95 border-2 border-[#E3B552] w-full max-w-2xl rounded-[32px] p-6 md:p-8 my-8 relative space-y-6 shadow-2xl flex flex-col justify-between z-10">
        <button type="button" onClick={onClose} className="absolute right-5 top-5 text-[#B3B3B3] hover:text-white font-mono text-2xl font-bold">&times;</button>

        <div className="border-b border-white/5 pb-4">
          <h1 className="font-display font-black text-xl text-white uppercase tracking-tight">TERMOS DE USO DO PORTAL</h1>
          <p className="text-[10px] text-[#F0C265] font-mono uppercase tracking-widest mt-1">CONCURSO MUSICAL CANÇÃO PROFANA — ESTÚDIO PEDRA PROFANA</p>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-gray-300 leading-relaxed text-left max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin">
          <p>Bem-vindo ao Portal de Inscrições do Concurso Musical Canção Profana, de propriedade e gerido pelo Estúdio Pedra Profana. Ao realizar a sua matrícula, você e os demais integrantes declaram aceitar e cumprir integralmente as condições descritas abaixo.</p>

          <div className="space-y-1">
            <h2 className="font-display font-bold text-sm text-white">1. ELEGIBILIDADE E INSCRIÇÕES</h2>
            <p>1.1. O concurso é aberto exclusivamente a projetos musicais compostos por grupos contendo no mínimo 2 (dois) e no máximo 7 (sete) integrantes.</p>
            <p>1.2. É obrigatória a inclusão de pelo menos uma música original (autoral) escrita majoritariamente em língua portuguesa ou em formato instrumental no repertório do projeto.</p>
            <p>1.3. O repertório a ser apresentado no concurso é limitado ao máximo de 3 (três) músicas por banda.</p>
          </div>

          <div className="space-y-1">
            <h2 className="font-display font-bold text-sm text-white">2. TAXAS DE INSCRIÇÃO E LOTES</h2>
            <p>2.1. O valor das inscrições é calculado dinamicamente com base no lote vigente no exato momento da matrícula, multiplicado pelo número total de integrantes informados.</p>
            <p>2.2. O pagamento é realizado em cota única de forma digital via PIX. Uma vez processado o pagamento, o valor não será reembolsável, salvo por cancelamento formal do evento por parte do Estúdio Pedra Profana.</p>
          </div>

          <div className="space-y-1">
            <h2 className="font-display font-bold text-sm text-white">3. DIREITOS AUTORAIS E DISTRIBUIÇÃO</h2>
            <p>3.1. Ao se inscrever, a banda autoriza expressamente a captação de áudio, gravação de vídeo e transmissão ao vivo (streaming) de sua apresentação durante as etapas do concurso.</p>
            <p>3.2. Os direitos autorais morais sobre as composições permanecem com seus respectivos autores. O acordo e os percentuais de distribuição digital das gravações oficiais geradas no concurso serão decididos amigavelmente entre as partes ao encerramento das etapas.</p>
          </div>

          <div className="space-y-1">
            <h2 className="font-display font-bold text-sm text-white">4. INGRESSO SOLIDÁRIO</h2>
            <p>4.1. É condição obrigatória e regulamentar do concurso a entrega de 1kg (um quilo) de alimento não-perecível por integrante na entrada de cada etapa física (incluindo as sessões de gravação ao vivo).</p>
          </div>

          <div className="space-y-1">
            <h2 className="font-display font-bold text-sm text-white">5. PENALIDADES</h2>
            <p>5.1. Informações cadastrais falsas (como CPFs inativos ou idades incorretas), agressões físicas ou comportamentos antidesportivos no estúdio resultarão na desclassificação imediata do projeto, sem devolução das taxas pagas.</p>
          </div>
        </div>

        <div className="border-t border-white/5 pt-4 flex justify-between items-center text-[10px] font-mono text-gray-500">
          <span>Versão: 1.0 (2026)</span>
          <button type="button" onClick={onClose} className="text-[#F0C265] hover:underline uppercase font-bold">Fechar</button>
        </div>
      </div>
    </div>
  );
}

export function PrivacyModal({ open, onClose }: LegalModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 sm:p-6 flex justify-center items-start">
      <div className="absolute inset-0 cursor-pointer" onClick={onClose}></div>
      <div className="legal-pop bg-black/95 border-2 border-[#E3B552] w-full max-w-2xl rounded-[32px] p-6 md:p-8 my-8 relative space-y-6 shadow-2xl flex flex-col justify-between z-10">
        <button type="button" onClick={onClose} className="absolute right-5 top-5 text-[#B3B3B3] hover:text-white font-mono text-2xl font-bold">&times;</button>

        <div className="border-b border-white/5 pb-4">
          <h1 className="font-display font-black text-xl text-white uppercase tracking-tight">POLÍTICA DE PRIVACIDADE</h1>
          <p className="text-[10px] text-[#F0C265] font-mono uppercase tracking-widest mt-1">TRATAMENTO DE DADOS PESSOAIS — ESTÚDIO PEDRA PROFANA</p>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-gray-300 leading-relaxed text-left max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin">
          <p>O Estúdio Pedra Profana tem o compromisso de proteger a privacidade e a segurança dos dados pessoais fornecidos pelas bandas e seus integrantes durante o processo de matrícula no Concurso Canção Profana. Esta política descreve como coletamos, usamos e protegemos seus dados em conformidade com a LGPD (Lei Geral de Proteção de Dados - Lei nº 13.709/18).</p>

          <div className="space-y-1">
            <h2 className="font-display font-bold text-sm text-white">1. DADOS COLETADOS</h2>
            <p>1.1. Coletamos dados estritamente necessários para viabilizar as inscrições, organização das fases e faturamento:</p>
            <p>• **Dados do Projeto:** Nome da banda/projeto, biografia de divulgação, gênero musical e foto oficial.</p>
            <p>• **Dados Pessoais (Responsável e Integrantes):** Nome completo, Cadastro de Pessoa Física (CPF), Data de Nascimento, e-mail e número de WhatsApp do responsável.</p>
          </div>

          <div className="space-y-1">
            <h2 className="font-display font-bold text-sm text-white">2. FINALIDADE DO TRATAMENTO</h2>
            <p>2.1. Os dados de CPF e Data de Nascimento são tratados unicamente para validar a autenticidade cadastral dos participantes perante as regras do edital.</p>
            <p>2.2. A biografia e a foto oficial serão exibidas de forma pública em canais de votação e divulgação do Pedra Profana.</p>
            <p>2.3. Os dados de contato (WhatsApp e e-mail) serão utilizados para alinhamento de agendas de gravação e comunicações urgentes do concurso.</p>
          </div>

          <div className="space-y-1">
            <h2 className="font-display font-bold text-sm text-white">3. COMPARTILHAMENTO DE DADOS</h2>
            <p>3.1. O Estúdio Pedra Profana **não vende, não aluga e não cede** os dados pessoais cadastrados para fins de publicidade de terceiros.</p>
            <p>3.2. Os dados de faturamento podem ser processados por gateways de pagamento (como Supabase, Asaas ou Mercado Pago) de forma criptografada para consolidação do Pix de inscrição.</p>
          </div>

          <div className="space-y-1">
            <h2 className="font-display font-bold text-sm text-white">4. SEGURANÇA E ARMAZENAMENTO</h2>
            <p>4.1. Todos os dados são armazenados de forma criptografada em servidores em nuvem seguros geridos pelo Supabase, equipados com firewalls de última geração e chaves de acesso restritas.</p>
            <p>4.2. Os dados serão mantidos em nosso sistema pelo prazo necessário para a conclusão do concurso, envio de materiais fonográficos e conciliações contábeis e fiscais obrigatórias.</p>
          </div>
        </div>

        <div className="border-t border-white/5 pt-4 flex justify-between items-center text-[10px] font-mono text-gray-500">
          <span>Versão: 1.0 (2026)</span>
          <button type="button" onClick={onClose} className="text-[#F0C265] hover:underline uppercase font-bold">Fechar</button>
        </div>
      </div>
    </div>
  );
}
