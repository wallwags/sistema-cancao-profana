'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Key, Users, Settings, Lock, Check, X, ClipboardList } from 'lucide-react';

export default function SagradoPage() {
  const [isLoggedIn, setIsCheckoutOpen] = useState(false);
  const [pass, setPass] = useState('');
  const [role, setRole] = useState<'DEV' | 'ADMIN' | 'MOD'>('DEV');
  const [activeTab, setActiveTab] = useState<'lotes' | 'inscritos' | 'integracoes'>('lotes');

  // Lotes config states
  const [lotes, setLotes] = useState({
    lote1: 'ativo',
    lote2: 'em_breve',
    lote3: 'em_breve',
    live: 'em_breve',
    vagas: 25
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pass === 'profana2026') {
      setIsCheckoutOpen(true);
      setActiveTab('lotes');
    } else {
      alert('Senha incorreta!');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert('✓ Configurações salvas localmente! (Para persistência global, conecte com o banco Supabase).');
  };

  return (
    <div className="py-16 px-6 bg-[#05070B] min-h-screen text-[#F0EAE0] flex items-center justify-center relative overflow-hidden">
      
      {/* Background radial gold glow leaks */}
      <div className="absolute -right-32 -top-32 w-80 h-80 bg-[#E3B552]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -left-32 -bottom-32 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <AnimatePresence mode="wait">
        {!isLoggedIn ? (
          /* 1. AUTHENTICATION LOGIN CARD */
          <motion.div
            key="login"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 p-8 rounded-[32px] max-w-sm w-full space-y-6 shadow-2xl text-center"
          >
            <div className="space-y-2 border-b border-white/5 pb-4">
              <Shield className="w-10 h-10 text-[#F0C265] mx-auto animate-pulse" />
              <h1 className="font-display font-black text-xl text-[#F0C265] tracking-wider uppercase">AUTENTICAÇÃO RESTRITA</h1>
              <p className="text-xs text-gray-400">Insira as credenciais administrativas para gerenciar o console.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="block font-mono text-[9px] text-[#F0C265] font-bold uppercase tracking-wider">Selecionar Perfil *</label>
                <select 
                  value={role} 
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full bg-[#05070B] border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none font-semibold"
                >
                  <option value="DEV">Wagner — @ww.wagner (Líder Developer)</option>
                  <option value="ADMIN">Estúdio Admin (Diretor do Concurso)</option>
                  <option value="MOD">Moderador de Cadastro (Apenas Leitura)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono text-[9px] text-gray-400 uppercase tracking-wider">Senha de Segurança *</label>
                <input 
                  type="password" 
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#05070B] border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none"
                  required 
                />
              </div>

              <button 
                type="submit" 
                className="bg-gradient-to-b from-[#FFF2D4] via-[#F0C265] to-[#B88A28] text-black font-display font-black text-xs uppercase tracking-widest py-3 rounded-xl w-full border-none shadow-[0_0_20px_rgba(240,194,101,0.25)] mt-4"
              >
                AUTENTICAR SESSÃO
              </button>
            </form>
          </motion.div>
        ) : (
          /* 2. DYNAMIC UNIFIED DASHBOARD PANEL */
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-[32px] max-w-2xl w-full space-y-6 shadow-2xl relative"
          >
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <div>
                <span className="font-mono text-sm text-[#F0C265] font-bold uppercase tracking-wider block">MÓDULO CENTRAL DE ADMINISTRAÇÃO UNIFICADA</span>
                <p className="text-xs text-gray-400 mt-1">
                  {role === 'DEV' && "Você está logado com acesso root completo (Developer)."}
                  {role === 'ADMIN' && "Acesso de Gestão (Diretor). Permissões de escrita completas, exceto chaves de API."}
                  {role === 'MOD' && "Acesso de Auditoria (Moderador). Visualização em tempo de leitura de inscrições."}
                </p>
              </div>
              <span className="bg-gradient-to-b from-[#FFF2D4] via-[#F0C265] to-[#B88A28] text-black font-mono text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-black shadow">
                {role}
              </span>
            </div>

            {/* Tab controls */}
            <div className="flex gap-2 border-b border-white/5 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab('lotes')}
                className={`px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider ${
                  activeTab === 'lotes'
                    ? 'bg-white/10 text-white rounded-lg border border-white/10'
                    : 'text-[#A89880] hover:text-white transition-colors border border-transparent'
                }`}
              >
                Lotes & Live
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('inscritos')}
                className={`px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider ${
                  activeTab === 'inscritos'
                    ? 'bg-white/10 text-white rounded-lg border border-white/10'
                    : 'text-[#A89880] hover:text-white transition-colors border border-transparent'
                }`}
              >
                Inscritos (Tabela)
              </button>
              <button
                type="button"
                disabled={role !== 'DEV'}
                onClick={() => setActiveTab('integracoes')}
                className="px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed text-[#A89880] hover:text-white transition-colors"
              >
                Integrações {role !== 'DEV' && '🔒'}
              </button>
            </div>

            {/* TAB 1: LOTES & LIVE */}
            {activeTab === 'lotes' && (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-white/5">
                  <span className="font-mono text-sm text-white uppercase">Lote 1 Status:</span>
                  <select 
                    disabled={role === 'MOD'}
                    value={lotes.lote1}
                    onChange={(e) => setLotes({...lotes, lote1: e.target.value})}
                    className="bg-[#0B0F19] border border-white/5 text-white text-sm rounded px-2.5 py-1.5 outline-none disabled:opacity-50"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="encerrado">Encerrado</option>
                    <option value="em_breve">Em Breve</option>
                  </select>
                </div>
                <div className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-white/5">
                  <span className="font-mono text-sm text-white uppercase">Lote 2 Status:</span>
                  <select 
                    disabled={role === 'MOD'}
                    value={lotes.lote2}
                    onChange={(e) => setLotes({...lotes, lote2: e.target.value})}
                    className="bg-[#0B0F19] border border-white/5 text-white text-sm rounded px-2.5 py-1.5 outline-none disabled:opacity-50"
                  >
                    <option value="em_breve">Em Breve</option>
                    <option value="ativo">Ativo</option>
                    <option value="encerrado">Encerrado</option>
                  </select>
                </div>
                <div className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-white/5">
                  <span className="font-mono text-sm text-white uppercase">Lote 3 Status:</span>
                  <select 
                    disabled={role === 'MOD'}
                    value={lotes.lote3}
                    onChange={(e) => setLotes({...lotes, lote3: e.target.value})}
                    className="bg-[#0B0F19] border border-white/5 text-white text-sm rounded px-2.5 py-1.5 outline-none disabled:opacity-50"
                  >
                    <option value="em_breve">Em Breve</option>
                    <option value="ativo">Ativo</option>
                    <option value="encerrado">Encerrado</option>
                  </select>
                </div>
                <div className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-white/5">
                  <span className="font-mono text-sm text-white uppercase">Live Transmissão:</span>
                  <select 
                    disabled={role === 'MOD'}
                    value={lotes.live}
                    onChange={(e) => setLotes({...lotes, live: e.target.value})}
                    className="bg-[#0B0F19] border border-white/5 text-white text-sm rounded px-2.5 py-1.5 outline-none disabled:opacity-50"
                  >
                    <option value="em_breve">Em Breve</option>
                    <option value="ao_vivo">🔴 Ao Vivo Agora</option>
                    <option value="encerrada">Encerrada</option>
                  </select>
                </div>
                <div className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-white/5">
                  <span className="font-mono text-sm text-white uppercase">Vagas Lote Ativo:</span>
                  <input 
                    disabled={role === 'MOD'}
                    type="number" 
                    value={lotes.vagas}
                    onChange={(e) => setLotes({...lotes, vagas: parseInt(e.target.value) || 0})}
                    className="w-20 bg-[#0B0F19] border border-white/5 text-white text-sm rounded px-2.5 py-1.5 text-center outline-none disabled:opacity-50"
                  />
                </div>
                <button 
                  disabled={role === 'MOD'}
                  type="submit" 
                  className="bg-gradient-to-b from-[#FFF2D4] via-[#F0C265] to-[#B88A28] text-black font-display font-black text-xs uppercase tracking-widest py-3 rounded-xl w-full border-none shadow-[0_0_20px_rgba(240,194,101,0.25)] mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  SALVAR CONFIGURAÇÃO
                </button>
              </form>
            )}

            {/* TAB 2: INSCRITOS */}
            {activeTab === 'inscritos' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs md:text-sm">
                  <thead>
                    <tr className="border-b border-[#2C2C2C] text-gray-400 font-mono">
                      <th className="py-3 px-2 uppercase tracking-widest text-[9px]">ID</th>
                      <th className="py-3 px-2 uppercase tracking-widest text-[9px]">Projeto / Banda</th>
                      <th className="py-3 px-2 uppercase tracking-widest text-[9px]">Gênero</th>
                      <th className="py-3 px-2 uppercase tracking-widest text-[9px]">Lineup</th>
                      <th className="py-3 px-2 uppercase tracking-widest text-[9px]">Status</th>
                      {role !== 'MOD' && <th className="py-3 px-2 uppercase tracking-widest text-[9px] text-right">Ações</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <tr>
                      <td className="py-3 px-2 font-mono text-gray-400">#001</td>
                      <td className="py-3 px-2 font-bold text-white">Os Profanos do Ritmo</td>
                      <td className="py-3 px-2 text-gray-300">Rock Autoral</td>
                      <td className="py-3 px-2 font-mono text-gray-300">4 Membros</td>
                      <td className="py-3 px-2"><span className="bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 text-[9px] font-bold px-2 py-0.5 rounded font-mono">PAGO</span></td>
                      {role !== 'MOD' && (
                        <td className="py-3 px-2 text-right">
                          <button type="button" onClick={() => alert('Recibo homologado.')} className="bg-white/5 border border-white/10 text-white font-mono text-[9px] font-bold px-2.5 py-1 rounded">Ver Recibo</button>
                        </td>
                      )}
                    </tr>
                    <tr>
                      <td className="py-3 px-2 font-mono text-gray-400">#002</td>
                      <td className="py-3 px-2 font-bold text-white">Daily Chaos</td>
                      <td className="py-3 px-2 text-gray-300">Metal Core</td>
                      <td className="py-3 px-2 font-mono text-gray-300">3 Membros</td>
                      <td className="py-3 px-2"><span className="bg-amber-500/15 text-amber-500 border border-amber-500/30 text-[9px] font-bold px-2 py-0.5 rounded font-mono">PENDENTE</span></td>
                      {role !== 'MOD' && (
                        <td className="py-3 px-2 text-right space-x-1">
                          <button type="button" onClick={() => alert('Aprovado manualmente!')} className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[9px] font-bold px-2.5 py-1 rounded">Aprovar</button>
                          <button type="button" onClick={() => alert('Rejeitado.')} className="bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white font-mono text-[9px] font-bold px-2.5 py-1 rounded">Rejeitar</button>
                        </td>
                      )}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 3: INTEGRAÇÕES */}
            {activeTab === 'integracoes' && role === 'DEV' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block font-mono text-[9px] text-[#F0C265] font-bold uppercase tracking-wider">Gateway de Pagamento Ativo *</label>
                  <select className="w-full bg-[#05070B] border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none">
                    <option value="asaas">Asaas (PIX Transparente)</option>
                    <option value="mercadopago">Mercado Pago (PIX + Cartão Bricks)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block font-mono text-[9px] text-gray-400 uppercase tracking-wider">Asaas API Production Token *</label>
                  <div className="bg-black/50 border border-white/5 rounded-xl p-1.5">
                    <input type="password" value="****************************************" readOnly className="w-full bg-transparent border-none outline-none px-4 py-2 text-white text-xs" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block font-mono text-[9px] text-gray-400 uppercase tracking-wider">Mercado Pago Access Token *</label>
                  <div className="bg-black/50 border border-white/5 rounded-xl p-1.5">
                    <input type="password" value="****************************************" readOnly className="w-full bg-transparent border-none outline-none px-4 py-2 text-white text-xs" />
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-white/5 pt-4 flex justify-between items-center text-xs font-mono">
              <span className="text-[#8B6F47]">Sessão Administrador Ativa</span>
              <button onClick={() => setIsCheckoutOpen(false)} className="text-[#F0C265] hover:underline uppercase">Sair</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
