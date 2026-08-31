'use client';

import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useEffect } from 'react';
import { X, Users, Music, Sparkles, Mic2, Loader2, Check } from 'lucide-react';

const WHATSAPP_LINK = 'https://chat.whatsapp.com/SEU-CODIGO-DO-GRUPO';

const inputCls = "w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm outline-none focus:border-[#E3B552] placeholder-gray-600 transition-colors";

export default function GrupoVipPage() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [content, setContent] = useState<Record<string, string>>({
    vip_badge: 'Grupo VIP · Vagas antecipadas',
    vip_title_start: 'Entre antes de',
    vip_title_highlight: 'todo mundo',
    vip_subtitle: 'O Grupo VIP do Concurso Canção Profana recebe as inscrições antes da abertura oficial, os avisos de cada lote e as notícias da live. Gratuito, direto no seu WhatsApp.',
    vip_benefit1_title: 'Acesso antecipado',
    vip_benefit1_desc: 'Inscreva sua banda antes dos lotes abrirem',
    vip_benefit2_title: 'Notícias da live',
    vip_benefit2_desc: 'Lineups, datas e bastidores em primeira mão',
    vip_benefit3_title: 'Sem custo nenhum',
    vip_benefit3_desc: 'Saia quando quiser, sem burocracia',
    vip_whatsapp_url: ''
  });
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    (async () => {
      const keys = ['vip_badge','vip_title_start','vip_title_highlight','vip_subtitle','vip_benefit1_title','vip_benefit1_desc','vip_benefit2_title','vip_benefit2_desc','vip_benefit3_title','vip_benefit3_desc','vip_whatsapp_url','vip_active'];
      const { data } = await supabase.from('site_settings').select('key,value').in('key', keys);
      if (!data) return;
      setContent(prev => {
        const next = { ...prev };
        (data as Array<{ key: string; value: unknown }>).forEach(r => {
          next[r.key] = typeof r.value === 'string' ? r.value : String(r.value ?? '');
        });
        return next;
      });
      setHidden(false);
    })();
  }, []);

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSubmit = name.trim().length >= 2 && validEmail && !busy;

  const join = async () => {
    setError('');
    if (!canSubmit) {
      setError(name.trim().length < 2 ? 'Informe seu nome.' : 'Informe um e-mail válido.');
      return;
    }
    setBusy(true);
    const { error: err } = await supabase
      .from('vip_leads')
      .insert({ name: name.trim(), email: email.trim().toLowerCase(), source: 'grupovip' });
    setBusy(false);
    if (err) {
      setError('Não foi possível registrar agora. Tente novamente.');
      return;
    }
    setDone(true);
    setTimeout(() => { window.open(content.vip_whatsapp_url || WHATSAPP_LINK, '_blank'); }, 600);
  };

  if (hidden) {
    return (
      <div className="min-h-screen bg-[#05070B] flex flex-col items-center justify-center px-6 text-center space-y-3">
        <Music className="w-10 h-10 text-[#F0C265]" />
        <p className="font-display font-black text-xl text-white uppercase">Página em preparo</p>
        <p className="text-sm text-gray-400">Volte em breve para entrar no grupo VIP.</p>
        <a href="/v2" className="font-mono text-[11px] text-gray-500 hover:text-white uppercase tracking-widest pt-2">Voltar ao site</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05070B] text-[#F0EAE0] relative overflow-hidden font-sans antialiased">
      {/* Glows de fundo */}
      <div className="absolute -top-40 -left-40 w-[480px] h-[480px] bg-[#E3B552]/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[480px] h-[480px] bg-purple-700/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(240,194,101,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(240,194,101,0.02)_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />

      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-16 text-center">
        {/* Selo */}
        <span className="inline-flex items-center gap-2 font-mono text-[11px] font-black uppercase tracking-widest text-[#F0C265] bg-[#F0C265]/10 border border-[#F0C265]/30 px-4 py-1.5 rounded-full fade-up-800">
          <Sparkles className="w-3.5 h-3.5" />
          {content.vip_badge}
        </span>

        {/* Headline */}
        <h1 className="fade-up-800 [animation-delay:100ms] font-display font-black text-4xl sm:text-5xl lg:text-6xl text-white uppercase leading-[1.05] tracking-tight max-w-3xl mt-6">
          {content.vip_title_start}{' '}
          <span className="bg-gradient-to-b from-[#FFF2D4] via-[#F0C265] to-[#B88A28] bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(240,194,101,0.45)]">
            {content.vip_title_highlight}
          </span>
        </h1>

        {/* Subheadline */}
        <p className="fade-up-800 [animation-delay:180ms] text-sm sm:text-base text-gray-300 leading-relaxed max-w-xl mt-5">
          O Grupo VIP do Concurso Canção Profana recebe as inscrições{' '}
          <strong className="text-white">antes da abertura oficial</strong>, os avisos de cada lote e as
          notícias da live. Gratuito, direto no seu WhatsApp.
        </p>

        {/* Benefícios */}
        <div className="fade-up-800 [animation-delay:260ms] grid grid-cols-1 sm:grid-cols-3 gap-3 mt-10 w-full max-w-2xl">
          {[
            { icon: Users, t: content.vip_benefit1_title, d: content.vip_benefit1_desc },
            { icon: Mic2, t: content.vip_benefit2_title, d: content.vip_benefit2_desc },
            { icon: Music, t: content.vip_benefit3_title, d: content.vip_benefit3_desc },
          ].map(b => (
            <div key={b.t} className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-1.5 text-center">
              <b.icon className="w-5 h-5 text-[#F0C265] mx-auto" />
              <span className="block text-sm font-bold text-white">{b.t}</span>
              <span className="block text-xs text-gray-400 leading-snug">{b.d}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={() => setOpen(true)}
          className="fade-up-800 [animation-delay:340ms] btn-gold-shimmer mt-10 px-10 py-4 rounded-full text-sm sm:text-base uppercase tracking-widest font-black text-black shadow-[0_0_35px_rgba(227,181,82,0.35)] active:scale-[0.98] transition-transform"
        >
          Entrar no grupo VIP
        </button>

        <span className="fade-up-800 [animation-delay:400ms] font-mono text-[11px] text-gray-500 uppercase tracking-widest mt-4">
          Estúdio Pedra Profana · Concurso Canção Profana
        </span>
      </main>

      {/* POPUP */}
      {open && (
        <div className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="legal-pop w-full max-w-md bg-[#05070B] border-2 border-[#E3B552] rounded-[28px] p-6 sm:p-8 space-y-5 shadow-[0_10px_60px_rgba(0,0,0,0.9)] relative">
            <button onClick={() => setOpen(false)} className="absolute right-4 top-4 text-gray-400 hover:text-white text-2xl leading-none">×</button>

            {!done ? (
              <>
                <div className="text-center space-y-2">
                  <Users className="w-9 h-9 text-[#F0C265] mx-auto" />
                  <h2 className="font-display font-black text-xl text-white uppercase tracking-tight">Entrar no grupo VIP</h2>
                  <p className="text-sm text-gray-400 leading-snug">Deixe seu nome e e-mail para registrar seu acesso. Em seguida você vai direto para o WhatsApp.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-mono text-[11px] text-[#F0C265] font-bold uppercase tracking-wider">Seu nome</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Como você se chama"
                    className={inputCls}
                    autoComplete="name"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-mono text-[11px] text-[#F0C265] font-bold uppercase tracking-wider">Seu e-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@email.com"
                    className={inputCls}
                    autoComplete="email"
                  />
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/40 rounded-xl px-4 py-3 flex items-start gap-2.5">
                    <span className="text-red-400 text-base leading-none mt-0.5">⚠</span>
                    <span className="text-xs text-red-200/90 leading-snug flex-1">{error}</span>
                    <button onClick={() => setError('')} className="text-red-300/70 hover:text-white text-lg leading-none">×</button>
                  </div>
                )}

                <button
                  onClick={join}
                  disabled={busy}
                  className="w-full flex items-center justify-center gap-2 font-display font-black text-base uppercase tracking-widest text-black bg-gradient-to-b from-[#FFF2D4] via-[#F0C265] to-[#B88A28] py-4 rounded-full shadow-[0_0_30px_rgba(227,181,82,0.35)] disabled:opacity-50 active:scale-[0.98] transition-transform"
                >
                  {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Users className="w-5 h-5" />}
                  {busy ? 'Registrando...' : 'Ir para o WhatsApp'}
                </button>

                <p className="text-[11px] text-gray-500 text-center leading-snug">Usamos seu e-mail apenas para o acesso VIP. Nada de spam.</p>
              </>
            ) : (
              <div className="text-center space-y-4 py-2">
                <div className="w-14 h-14 mx-auto rounded-full bg-[#10B981]/10 text-[#10B981] border-2 border-[#10B981] flex items-center justify-center"><Check className="w-7 h-7" /></div>
                <h2 className="font-display font-black text-xl text-white uppercase">Tudo pronto!</h2>
                <p className="text-sm text-gray-300 leading-relaxed">
                  Bem-vindo(a) ao VIP, <strong className="text-[#F0C265]">{name.split(' ')[0]}</strong>. Abrindo o WhatsApp para você finalizar a entrada...
                </p>
                <a
                  href={content.vip_whatsapp_url || WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-gold-shimmer inline-block px-8 py-3.5 rounded-full text-sm uppercase tracking-widest font-black text-black"
                >
                  Abrir WhatsApp
                </a>
                <button onClick={() => setOpen(false)} className="block w-full font-mono text-[11px] text-gray-500 hover:text-white uppercase tracking-widest pt-1">Fechar</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
