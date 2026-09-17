'use client';

// Aba GATEWAY DE PAGAMENTOS do painel /sagrado — extraída 1:1 do page.tsx (17/09, dívida técnica).
import { Loader2 } from 'lucide-react';
import { inputCls, btnGold, btnGhost } from './ui';

interface GatewayTabProps {
  gwState: { token_set?: boolean; token_mask?: string } | null;
  mpToken: string;
  setMpToken: (v: string) => void;
  mpSecret: string;
  setMpSecret: (v: string) => void;
  saveGateway: () => void;
  busy: string | null;
  notice: Record<string, { kind: 'ok' | 'err' | 'info'; msg: string }>;
  setMsg: (k: string, kind: 'ok' | 'err' | 'info', msg: string) => void;
  guarded: (key: string, fn: () => Promise<string>) => void;
  Notice: (p: { kind: 'ok' | 'err' | 'info'; children: React.ReactNode }) => JSX.Element | null;
}

export default function GatewayTab({ gwState, mpToken, setMpToken, mpSecret, setMpSecret, saveGateway, busy, notice, setMsg, guarded, Notice }: GatewayTabProps) {
  return (
    <div className="space-y-4 max-w-xl fade-up-800">
      <Notice kind="info">
        Conecte sua conta Mercado Pago para ativar o Pix real com confirmação automática. As chaves são armazenadas com criptografia e nunca ficam expostas.
      </Notice>

      <div className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <h3 className="font-display font-bold text-white uppercase">Mercado Pago</h3>
          <span className={`font-mono text-[11px] font-bold px-2.5 py-1 rounded-full uppercase border ${
            gwState?.token_set ? 'text-[#10B981] border-[#10B981]/30 bg-[#10B981]/10' : 'text-amber-500 border-amber-500/30 bg-amber-500/10'
          }`}>
            {gwState?.token_set ? 'conectado' : 'não configurado'}
          </span>
        </div>

        <div className="space-y-1.5">
          <label className="block font-mono text-[11px] text-[#F0C265] font-bold uppercase tracking-wider">Access Token de produção</label>
          <input
            type="password"
            className={inputCls}
            value={mpToken}
            onChange={(e) => setMpToken(e.target.value)}
            placeholder={gwState?.token_mask || 'APP_USR-...'}
            autoComplete="off"
          />
          {gwState?.token_set && (
            <span className="font-mono text-[10px] text-gray-500 block">Chave atual: {gwState.token_mask}. Insira uma nova para substituir.</span>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="block font-mono text-[11px] text-[#F0C265] font-bold uppercase tracking-wider">Webhook Secret (opcional por enquanto)</label>
          <input
            type="password"
            className={inputCls}
            value={mpSecret}
            onChange={(e) => setMpSecret(e.target.value)}
            placeholder="Secret para validação de notificações"
            autoComplete="off"
          />
        </div>

        <div className="flex justify-end items-center gap-3 flex-wrap">
          {notice['gateway'] && <Notice kind={notice['gateway'].kind}>{notice['gateway'].msg}</Notice>}
          {notice['gwtest'] && <Notice kind={notice['gwtest'].kind}>{notice['gwtest'].msg}</Notice>}
          <button type="button" onClick={() => guarded('gwtest', async () => {
            try {
              const res = await fetch('/api/gateway/test');
              const d = await res.json().catch(() => null);
              if (d && d.ok) setMsg('gwtest', 'ok', `Conexão OK${d.nickname ? ' com a conta ' + d.nickname : ''}. O Pix real está ativo.`);
              else setMsg('gwtest', 'err', (d && d.msg) ? d.msg : 'Não foi possível validar a chave.');
            } catch { setMsg('gwtest', 'err', 'Falha de conexão. Tente novamente.'); }
            return 'ok';
          })} disabled={busy === 'gwtest'} className={btnGhost}>
            {busy === 'gwtest' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Testar conexão'}
          </button>
          <button type="button" onClick={saveGateway} disabled={busy === 'gateway'} className={btnGold}>
            {busy === 'gateway' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Salvar chaves'}
          </button>
        </div>
      </div>

      <div className="bg-[#0B0F19]/40 border border-white/5 rounded-2xl p-4 space-y-2">
        <span className="font-mono text-[11px] text-gray-400 uppercase tracking-widest font-bold block">Como obter as chaves</span>
        <p className="text-xs text-gray-300 leading-relaxed">
          1. Acesse developers.mercadopago.com com a conta PJ do estúdio.<br />
          2. Crie uma aplicação e ative Pix + Cartão em modo produção.<br />
          3. Copie o Access Token de produção e cole aqui.<br />
          4. Salve. A partir do próximo pagamento, o sistema usa o gateway real automaticamente.
        </p>
      </div>
    </div>
  );
}
