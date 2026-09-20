import { createClient } from '@supabase/supabase-js';
import HomeClient, { HomeCfg } from '../components/v2/HomeClient';

// HOME RENDERIZADA NO SERVIDOR (ISR): o HTML ja sai do CDN da Vercel com a
// configuracao real (lote ativo, fase da live, precos, FAQ). Zero flash para o
// visitante em qualquer conexao, inclusive na primeira visita. Revalida a cada 60s.
export const revalidate = 60;

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nzsbyfxcefmlclagoyii.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_HN7YVIWVNC08pjgKnGzsLg_sMlUMKSK'
);

export default async function Page() {
  let cfg: HomeCfg | null = null;
  try {
    const [batchesRes, liveRes, settingsRes, faqRes] = await Promise.all([
      sb.from('batches').select('*').order('sort_order', { ascending: true }),
      sb.from('live_broadcast').select('*').eq('id', 1).maybeSingle(),
      sb.from('site_settings').select('key,value'),
      sb.from('faq_items').select('question,answer,sort_order').eq('active', true).order('sort_order', { ascending: true })
    ]);

    const batches = (batchesRes.data || []) as Array<Record<string, any>>;
    const liveData = liveRes.data as Record<string, any> | null;
    const map: Record<string, string> = {};
    ((settingsRes.data || []) as Array<Record<string, unknown>>).forEach((r) => {
      map[String(r.key)] = typeof r.value === 'string' ? r.value : String(r.value ?? '');
    });

    if (batches.length >= 3) {
      // MAPEAMENTO POR NOME: o lote "Live (lançamento)" (sort_order 0) nao ocupa a posicao de lote1/2/3
      const lotesOnly = batches
        .filter((b) => /^lote/i.test(String(b?.name || '')))
        .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
      const rows = lotesOnly.length >= 3 ? lotesOnly : batches.slice(-3);
      const [b1, b2, b3] = rows;
      const dp = Number(map.dia0_price);

      cfg = {
        lotes: {
          lote1: { status: b1.status, vagasRestantes: b1.vagas_restantes, total: Number(b1.vagas_total ?? 10), valor: Number(b1.price_per_member), desc: 'Primeiras inscrições. Menor oferta histórica.' },
          lote2: { status: b2.status, vagasRestantes: b2.vagas_restantes, total: Number(b2.vagas_total ?? 10), valor: Number(b2.price_per_member), desc: 'Disponível na fase intermediária.' },
          lote3: { status: b3.status, vagasRestantes: b3.vagas_restantes, total: Number(b3.vagas_total ?? 10), valor: Number(b3.price_per_member), desc: 'Reta final de inscrições regulamentares.' },
          live: { status: liveData ? liveData.status : 'em_breve' }
        },
        loteDates: {
          lote1: b1.starts_at ?? null, lote1_end: b1.ends_at ?? null,
          lote2: b2.starts_at ?? null, lote2_end: b2.ends_at ?? null,
          lote3: b3.starts_at ?? null, lote3_end: b3.ends_at ?? null
        },
        liveStatusBar: (liveData?.status ?? 'em_breve') as HomeCfg['liveStatusBar'],
        countdownTarget: map.countdown_target || null,
        liveLaunch: map.live_launch || null,
        cartOpen: map.cart_open_at || null,
        liveUrl: map.live_url || null,
        dia0Price: !isNaN(dp) && dp > 0 ? dp : undefined,
        slotMode: map.slot_mode === 'integrante' ? 'integrante' : 'band',
        homeCtaMode: map.home_cta_mode === 'quiz' ? 'quiz' : (map.home_cta_mode === 'waitlist' ? 'waitlist' : null),
        vipWaUrl: map.vip_whatsapp_url || null,
        suporteWa: map.suporte_whatsapp_url || map.vip_whatsapp_url || null,
        homeFakePix: map.home_pix_fake === 'true',
        socialVagasPct: map.social_vagas_pct === '0' ? 0 : (Number(map.social_vagas_pct) || 40),
        widget: {
          ativo: map.widget_ativo !== 'false',
          imagem: map.widget_imagem || '/widgets/mosaic.png',
          bMin: Number(map.widget_bandas_min) || 2,
          bMax: Number(map.widget_bandas_max) || 4,
          vMin: Number(map.widget_visitantes_min) || 25,
          vMax: Number(map.widget_visitantes_max) || 78
        },
        faq: ((faqRes.data || []) as Array<Record<string, string>>).map((f) => ({ q: f.question, a: f.answer }))
      };
    }
  } catch {
    // Supabase inacessivel no build: serve padroes e o cliente corrige em segundos
  }

  return <HomeClient cfg={cfg} />;
}
