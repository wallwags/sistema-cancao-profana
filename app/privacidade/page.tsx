'use client';

import React from 'react';
import Link from 'next/link';

export default function PrivacidadePage() {
  return (
    <div className="py-16 px-6 bg-[#05070B] min-h-screen text-[#F0EAE0] flex items-center justify-center">
      <div className="max-w-4xl mx-auto space-y-8 bg-[#0B0F19]/60 border border-white/10 p-8 md:p-12 rounded-[32px] backdrop-blur-xl shadow-2xl">
        
        <div className="border-b border-white/5 pb-6 text-center md:text-left">
          <h1 className="font-display font-black text-3xl text-white uppercase tracking-tight">POLÍTICA DE PRIVACIDADE</h1>
          <p className="text-xs text-[#F0C265] font-mono uppercase tracking-widest mt-2">TRATAMENTO DE DADOS PESSOAIS — ESTÚDIO PEDRA PROFANA</p>
        </div>

        <div className="space-y-6 text-sm text-[#A89880] leading-relaxed">
          <p>O Estúdio Pedra Profana tem o compromisso de proteger a privacidade e a segurança dos dados pessoais fornecidos pelas bandas e seus integrantes durante o processo de matrícula no Concurso Canção Profana. Esta política descreve como coletamos, usamos e protegemos seus dados em conformidade com a LGPD (Lei Geral de Proteção de Dados - Lei nº 13.709/18).</p>

          <div className="space-y-2">
            <h2 className="font-display font-bold text-lg text-white">1. DADOS COLETADOS</h2>
            <p>1.1. Coletamos dados estritamente necessários para viabilizar as inscrições, organização das fases e faturamento:</p>
            <p>• **Dados do Projeto:** Nome da banda/projeto, biografia de divulgação, gênero musical e foto oficial.</p>
            <p>• **Dados Pessoais (Responsável e Integrantes):** Nome completo, Cadastro de Pessoa Física (CPF), Data de Nascimento e número de WhatsApp do responsável.</p>
          </div>

          <div className="space-y-2">
            <h2 className="font-display font-bold text-lg text-white">2. FINALIDADE DO TRATAMENTO</h2>
            <p>2.1. Os dados de CPF e Data de Nascimento são tratados unicamente para validar a autenticidade cadastral dos participantes perante as regras do edital.</p>
            <p>2.2. A biografia e a foto oficial serão exibidas de forma pública em canais de votação e divulgação do Pedra Profana.</p>
            <p>2.3. Os dados de contato (WhatsApp e e-mail) serão utilizados para alinhamento de agendas de gravação e comunicações urgentes do concurso.</p>
          </div>

          <div className="space-y-2">
            <h2 className="font-display font-bold text-lg text-white">3. COMPARTILHAMENTO DE DADOS</h2>
            <p>3.1. O Estúdio Pedra Profana **não vende, não aluga e não cede** os dados pessoais cadastrados para fins de publicidade de terceiros.</p>
            <p>3.2. Os dados de faturamento podem ser processados por parceiros e gateways de pagamento (como Supabase, Asaas ou Mercado Pago) de forma criptografada para consolidação do Pix de inscrição.</p>
          </div>

          <div className="space-y-2">
            <h2 className="font-display font-bold text-lg text-white">4. SEGURANÇA E ARMAZENAMENTO</h2>
            <p>4.1. Todos os dados são armazenados de forma criptografada em servidores em nuvem seguros geridos pelo Supabase, equipados com firewalls de última geração e chaves de acesso restritas.</p>
            <p>4.2. Os dados serão mantidos em nosso sistema pelo prazo necessário para a conclusão do concurso, envio de materiais fonográficos e conciliações contábeis e fiscais obrigatórias.</p>
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
