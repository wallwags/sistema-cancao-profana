'use client';

// ABA FUNIL do painel /sagrado · extraída do page.tsx na dívida técnica de 17/09.
// Componente puro de exibição: recebe os dados e callbacks prontos via props.
// Nenhum visual ou cálculo foi alterado na extração (movimentação 1:1).

import { btnGhost } from './ui';

interface FunilTabProps {
  funnel: Record<string, unknown> | null;
  funnelDays: number;
  setFunnelDays: (d: number) => void;
  loadFunnel: (days: number) => void;
}

export default function FunilTab({ funnel, funnelDays, setFunnelDays, loadFunnel }: FunilTabProps) {
  const f = (funnel || {}) as Record<string, any>;
  const leads = (f.leads || {}) as Record<string, any>;
  const trafego = (f.trafego || {}) as Record<string, any>;
  const checkout = (f.checkout || {}) as Record<string, any>;
  const real = (f.real || {}) as Record<string, any>;
  const fases = (f.fases || {}) as Record<string, Record<string, number>>;
  const janela = (f.janela_live || {}) as Record<string, string>;
  const fontes = (trafego.fontes || []) as Array<{ ref: string; n: number }>;
  const porDia = (leads.por_dia || []) as Array<{ dia: string; n: number }>;
  const ultimos = (leads.ultimos || []) as Array<{ email: string; quando: string }>;
  const steps = (f.quiz_steps || []) as Array<{ step: string; n: number }>;
  const detalhe = (real.detalhe || []) as Array<{ nome: string; status: string; valor: string | number; pago_em: string | null; criado_em: string | null }>;
  const stepMap: Record<string, number> = {};
  steps.forEach(x => { stepMap[x.step] = Number(x.n); });
  const stepLabels: Record<string, string> = { '1': 'WhatsApp', '2': 'Banda e Instagram', '3': 'Estilo', '4': 'Nome do líder', '5': 'E-mail', '6': 'CPF', '7': 'Tamanho da banda', '8': 'Integrante 2', '9': 'Integrante 3', '10': 'Revisão' };
  const maxDia = Math.max(1, ...porDia.map(d => Number(d.n)));
  const totalLeads = Number(leads.total || 0);
  const pageviews = Number(trafego.pageviews || 0);
  const ipsUnicos = Number(trafego.ips_unicos || 0);
  const quizInicio = stepMap['1'] || 0;
  const fmtBRT = (iso?: string | null, comHora = true) => {
    if (!iso) return 'a definir';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 'a definir';
    const opts: Intl.DateTimeFormatOptions = comHora
      ? { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }
      : { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo' };
    return new Intl.DateTimeFormat('pt-BR', opts).format(d);
  };
  const fmtMoeda = (v: unknown) => `R$ ${Number(v || 0).toFixed(2).replace('.', ',').replace(',00', '')}`;

  const periodos: Array<{ label: string; days: number }> = [
    { label: 'Tudo', days: 0 },
    { label: '7 dias', days: 7 },
    { label: '30 dias', days: 30 },
  ];

  // FUNIL PRINCIPAL: etapas de comportamento (eventos) + etapas finais REAIS (banco)
  const stages = [
    { label: 'Visitou o site', n: pageviews, fonte: 'eventos' },
    { label: 'Começou a inscrição', n: quizInicio, fonte: 'eventos' },
    { label: 'Abriu o checkout', n: Number(checkout.abertos || 0), fonte: 'eventos' },
    { label: 'Banda inscrita', n: Number(real.bandas_total || 0), fonte: 'banco' },
    { label: 'Pagamento confirmado', n: Number(real.pix_pagos || 0), fonte: 'banco' },
  ];
  const stageWidths = [100, 84, 70, 58, 48];
  const maxStage = Math.max(1, ...stages.map(x => x.n));

  const maxStep = Math.max(1, ...steps.map(x => Number(x.n)));
  const maxFonte = Math.max(1, ...fontes.map(x => Number(x.n)));
  const fasesArr = [
    { key: 'pre', label: 'Pré-live', desc: janela.ini ? `até ${fmtBRT(janela.ini)}` : 'janela não definida', dot: 'bg-[#34D399]' },
    { key: 'live', label: 'Durante a live', desc: janela.ini && janela.fim ? `${fmtBRT(janela.ini)} até ${fmtBRT(janela.fim)}` : 'janela não definida', dot: 'bg-red-400' },
    { key: 'pos', label: 'Pós-live · Lote 1', desc: janela.fim ? `desde ${fmtBRT(janela.fim)}` : 'janela não definida', dot: 'bg-[#F0C265]' },
  ];

  const Card = ({ label, value, accent = 'text-white', sub }: { label: string; value: string | number; accent?: string; sub?: string }) => (
    <div className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-1">
      <span className="font-mono text-[11px] text-gray-400 uppercase tracking-widest block">{label}</span>
      <span className={`font-display font-black text-2xl block ${accent}`}>{value}</span>
      {sub && <span className="font-mono text-[10px] text-gray-500 block">{sub}</span>}
    </div>
  );

  return (
    <div className="space-y-5 fade-up-800">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <span className="font-mono text-[11px] text-gray-400 uppercase tracking-widest font-bold">Analytics do evento · visitantes reais (testes do painel excluídos automaticamente)</span>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-white/5 border border-white/10 rounded-full p-0.5">
            {periodos.map(pd => (
              <button
                key={pd.days}
                type="button"
                onClick={() => { setFunnelDays(pd.days); loadFunnel(pd.days); }}
                className={`font-mono text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full transition-colors ${funnelDays === pd.days ? 'bg-[#F0C265] text-black' : 'text-gray-400 hover:text-white'}`}
              >
                {pd.label}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => loadFunnel(funnelDays)} className={btnGhost}>Atualizar</button>
        </div>
      </div>

      {/* ============ LINHA DO TEMPO DO EVENTO ============ */}
      <div className="space-y-3">
        <div className="flex items-center gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F0C265] animate-pulse" />
          <h3 className="font-display font-black text-white uppercase text-sm tracking-tight">Linha do tempo · pré-live, live e pós-live</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {fasesArr.map(fa => {
            const d = (fases[fa.key] || {}) as Record<string, number>;
            return (
              <div key={fa.key} className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${fa.dot} animate-pulse`} />
                  <span className="font-display font-black text-white uppercase text-xs tracking-tight">{fa.label}</span>
                </div>
                <span className="font-mono text-[10px] text-gray-500 block -mt-2">{fa.desc}</span>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div><span className="font-mono text-[9px] text-gray-500 uppercase block">Visitas</span><span className="font-display font-black text-lg text-white">{Number(d.views || 0)}</span></div>
                  <div><span className="font-mono text-[9px] text-gray-500 uppercase block">Bandas</span><span className="font-display font-black text-lg text-[#F0C265]">{Number(d.bandas || 0)}</span></div>
                  <div><span className="font-mono text-[9px] text-gray-500 uppercase block">Pagos</span><span className="font-display font-black text-lg text-[#10B981]">{Number(d.pagos || 0)}</span></div>
                  <div><span className="font-mono text-[9px] text-gray-500 uppercase block">Receita</span><span className="font-display font-black text-lg text-[#10B981]">{fmtMoeda(d.receita)}</span></div>
                </div>
                <span className="font-mono text-[9px] text-gray-500 block border-t border-white/5 pt-2">{Number(d.leads || 0)} leads VIP · {Number(d.checkouts || 0)} checkouts abertos</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============ FUNIL DE CONVERSAO ============ */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F0C265] animate-pulse" />
          <h3 className="font-display font-black text-white uppercase text-sm tracking-tight">Do primeiro clique à vaga confirmada</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card label="Visitas ao site" value={pageviews} accent="text-[#F0C265]" sub={`${ipsUnicos} IPs únicos reais`} />
          <Card label="Pix gerados" value={Number(real.pix_gerados || 0)} sub={`${Number(checkout.abandonados || 0)} checkouts abandonados`} />
          <Card label="Pix pagos" value={Number(real.pix_pagos || 0)} accent="text-[#10B981]" sub={`${Number(real.bandas_pagas || 0)} de ${Number(real.bandas_total || 0)} bandas ativas`} />
          <Card label="Receita confirmada" value={fmtMoeda(real.receita)} accent="text-[#F0C265]" sub={`${Number(real.membros_pagos || 0)}/${Number(real.membros_total || 0)} integrantes pagos`} />
        </div>

        <div className="bg-[#0B0F19]/60 border border-white/10 rounded-2xl p-6 space-y-1.5">
          <div className="flex justify-between items-center mb-3 gap-2 flex-wrap">
            <span className="font-mono text-[11px] text-[#F0C265] uppercase tracking-widest font-black block">Funil de conversão</span>
            <span className="font-mono text-[9px] text-gray-500 uppercase">comportamento = eventos · etapas finais = banco (real)</span>
          </div>
          {stages.map((st, i) => {
            const prev = i > 0 ? stages[i - 1].n : st.n;
            const conv = prev > 0 ? Math.round((st.n / prev) * 100) : 100;
            const perdidos = Math.max(prev - st.n, 0);
            return (
              <div key={st.label} className="relative">
                {i > 0 && (
                  <div className="flex justify-center items-center gap-2 py-0.5">
                    <span className={`font-mono text-[11px] font-black px-2 py-0.5 rounded-full border ${conv >= 70 ? 'text-[#10B981] border-[#10B981]/30 bg-[#10B981]/10' : conv >= 40 ? 'text-[#F0C265] border-[#F0C265]/30 bg-[#F0C265]/10' : 'text-red-400 border-red-500/30 bg-red-500/10'}`}>
                      {conv}%{perdidos > 0 ? ` · ${perdidos} perdidos` : ''}
                    </span>
                  </div>
                )}
                <div className="mx-auto" style={{ width: `${stageWidths[i]}%` }}>
                  <div
                    className={`h-14 rounded-lg bg-gradient-to-b ${['from-[#FFF2D4] to-[#F0C265]', 'from-[#F0C265] to-[#E3B552]', 'from-[#E3B552] to-[#D4A843]', 'from-[#D4A843] to-[#B88A28]', st.fonte === 'banco' ? 'from-[#10B981] to-[#059669]' : 'from-[#B88A28] to-[#8B6F47]'][i]} flex items-center justify-center gap-3 shadow-lg`}
                    style={{ clipPath: 'polygon(4% 0, 96% 0, 100% 100%, 0% 100%)', opacity: 0.55 + 0.45 * (st.n / maxStage) }}
                  >
                    <span className="font-display font-black text-lg text-black">{st.n}</span>
                    <span className="font-mono text-[11px] text-black/80 uppercase tracking-widest font-bold">{st.label}{st.fonte === 'banco' ? ' ✓ real' : ''}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Onde travaram: etapas do quiz */}
          <div className="bg-[#0B0F19]/40 border border-white/5 rounded-2xl p-5 space-y-3">
            <span className="font-mono text-[11px] text-gray-400 uppercase tracking-widest font-bold block">Onde travaram · etapas do quiz</span>
            {steps.length === 0 && <span className="text-xs text-gray-500 font-mono">Sem dados ainda</span>}
            {steps.map(st => (
              <div key={st.step} className="space-y-1">
                <div className="flex justify-between font-mono text-[11px] text-gray-300">
                  <span>Etapa {st.step} · {stepLabels[st.step] || 'Quiz'}</span><span>{st.n}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#F0C265] to-[#B88A28]" style={{ width: `${Math.max(3, (Number(st.n) / maxStep) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Origens do trafego */}
          <div className="bg-[#0B0F19]/40 border border-white/5 rounded-2xl p-5 space-y-3">
            <span className="font-mono text-[11px] text-gray-400 uppercase tracking-widest font-bold block">Origem do tráfego · {pageviews} visitas</span>
            {fontes.length === 0 && <span className="text-xs text-gray-500 font-mono">Sem dados ainda</span>}
            {fontes.slice(0, 8).map(fo => (
              <div key={fo.ref} className="space-y-1">
                <div className="flex justify-between font-mono text-[11px] text-gray-300">
                  <span className="truncate">{fo.ref === 'direto' ? 'direto (digitou ou atalho)' : fo.ref}</span><span>{fo.n}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#34D399] to-[#059669]" style={{ width: `${Math.max(3, (Number(fo.n) / maxFonte) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagamentos por projeto (REAL, do banco) */}
        <div className="bg-[#0B0F19]/40 border border-white/5 rounded-2xl p-5 space-y-3">
          <span className="font-mono text-[11px] text-gray-400 uppercase tracking-widest font-bold block">Pagamentos por projeto · fonte: banco (subscriptions)</span>
          {detalhe.length === 0 && <span className="text-xs text-gray-500 font-mono">Nenhum Pix gerado no período</span>}
          {detalhe.map((d, i) => (
            <div key={i} className="flex justify-between items-center gap-3 border-t border-white/5 pt-2 first:border-0 first:pt-0">
              <span className="font-mono text-xs text-white font-bold truncate">{d.nome}</span>
              <span className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-[11px] text-gray-400">{fmtMoeda(d.valor)}</span>
                <span className={`font-mono text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${d.status === 'paid' ? 'text-[#10B981] border-[#10B981]/40 bg-[#10B981]/10' : 'text-[#F0C265] border-[#F0C265]/40 bg-[#F0C265]/10'}`}>
                  {d.status === 'paid' ? `pago ${d.pago_em ? fmtBRT(d.pago_em) : ''}` : 'aguardando'}
                </span>
              </span>
            </div>
          ))}
          <span className="font-mono text-[9px] text-gray-600 block pt-1">Mais de uma linha por banda = mais de um Pix gerado (abandonado ou substituído). Conta como confirmado apenas status pago.</span>
        </div>
      </div>

      {/* ============ PRE-LIVE: interessados no grupo vip ============ */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
          <h3 className="font-display font-black text-white uppercase text-sm tracking-tight">Grupo VIP · Interessados cadastrados</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card label="Interessados" value={totalLeads} accent="text-[#34D399]" sub={`${Number(leads.hoje || 0)} hoje`} />
          <Card label="Visitas ao site" value={pageviews} sub={`${ipsUnicos} IPs únicos`} />
          <Card label="Popups VIP abertos" value={Number(trafego.popups_vip || 0)} sub={totalLeads > 0 && Number(trafego.popups_vip || 0) > 0 ? `${Math.round((totalLeads / Number(trafego.popups_vip)) * 100)}% deixaram o e-mail` : undefined} />
          <Card label="Cliques no WhatsApp" value={Number(trafego.cliques_whatsapp || 0)} sub="saídas para o grupo" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-[#0B0F19]/60 border border-white/10 rounded-2xl p-5 space-y-3">
            <span className="font-mono text-[11px] text-[#F0C265] uppercase tracking-widest font-black block">Interessados por dia</span>
            <div className="flex items-end gap-1.5 h-32">
              {porDia.map(d => (
                <div key={d.dia} className="flex-1 flex flex-col items-center justify-end gap-1.5 h-full min-w-0" title={`${d.dia}: ${d.n}`}>
                  <span className={`font-mono text-[10px] font-black ${Number(d.n) > 0 ? 'text-[#F0C265]' : 'text-gray-600'}`}>{Number(d.n) > 0 ? d.n : ''}</span>
                  <div
                    className={`w-full rounded-t-md transition-all ${Number(d.n) > 0 ? 'bg-gradient-to-t from-[#8B1E1E] to-[#F0C265]' : 'bg-white/5'}`}
                    style={{ height: `${Math.max(3, (Number(d.n) / maxDia) * 100)}%` }}
                  />
                  <span className="font-mono text-[9px] text-gray-500 rotate-45 origin-top-left translate-y-1 whitespace-nowrap">{d.dia}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0B0F19]/60 border border-white/10 rounded-2xl p-5 space-y-3">
            <span className="font-mono text-[11px] text-[#F0C265] uppercase tracking-widest font-black block">Origem dos leads</span>
            <div className="space-y-2.5">
              {((leads.fontes || []) as Array<{ fonte: string; n: number }>).length === 0 && <span className="text-xs text-gray-500 font-mono">Sem dados ainda</span>}
              {((leads.fontes || []) as Array<{ fonte: string; n: number }>).map(fo => (
                <div key={fo.fonte} className="space-y-1">
                  <div className="flex justify-between font-mono text-[11px] text-gray-300">
                    <span className="truncate">{fo.fonte}</span><span>{fo.n}</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#34D399] to-[#059669]" style={{ width: `${totalLeads > 0 ? Math.max(4, (fo.n / totalLeads) * 100) : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-1 border-t border-white/5 space-y-1.5">
              <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest block pt-1">Últimos interessados</span>
              {ultimos.slice(0, 4).map((u, i) => (
                <div key={i} className="flex justify-between font-mono text-[10px] text-gray-400">
                  <span className="truncate">{u.email}</span><span className="text-gray-600 shrink-0">{u.quando}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
