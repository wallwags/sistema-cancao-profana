'use client';

// Aba MINHA CONTA do painel /sagrado · extraída 1:1 do page.tsx (17/09, dívida técnica).
import { Loader2, KeyRound } from 'lucide-react';
import { inputCls, btnGold } from './ui';

interface MinhaContaTabProps {
  newName: string;
  setNewName: (v: string) => void;
  saveOwnName: () => void;
  pw1: string;
  setPw1: (v: string) => void;
  pw2: string;
  setPw2: (v: string) => void;
  savePassword: () => void;
  busy: string | null;
  notice: Record<string, { kind: 'ok' | 'err' | 'info'; msg: string }>;
  Field: (p: { label: string; children: React.ReactNode }) => JSX.Element;
  Notice: (p: { kind: 'ok' | 'err' | 'info'; children: React.ReactNode }) => JSX.Element | null;
}

export default function MinhaContaTab({ newName, setNewName, saveOwnName, pw1, setPw1, pw2, setPw2, savePassword, busy, notice, Field, Notice }: MinhaContaTabProps) {
  return (
    <div className="space-y-4 max-w-xl fade-up-800">
      <div className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4">
        <h3 className="font-display font-bold text-white uppercase border-b border-white/5 pb-3">Nome de exibição</h3>
        <Field label="Como seu nome aparece no painel">
          <input className={inputCls} value={newName} onChange={(e) => setNewName(e.target.value)} />
        </Field>
        <div className="flex justify-end items-center gap-3">
          {notice['acc-name'] && <Notice kind={notice['acc-name'].kind}>{notice['acc-name'].msg}</Notice>}
          <button type="button" onClick={saveOwnName} disabled={busy === 'acc-name'} className={btnGold}>
            {busy === 'acc-name' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Salvar nome'}
          </button>
        </div>
      </div>

      <div className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4">
        <h3 className="font-display font-bold text-white uppercase border-b border-white/5 pb-3 flex items-center gap-2"><KeyRound className="w-4 h-4 text-[#F0C265]" /> Alterar minha senha</h3>
        <Field label="Nova senha (mínimo 8 caracteres)">
          <input type="password" className={inputCls} value={pw1} onChange={(e) => setPw1(e.target.value)} autoComplete="new-password" />
        </Field>
        <Field label="Confirmar nova senha">
          <input type="password" className={inputCls} value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" />
        </Field>
        <div className="flex justify-end items-center gap-3">
          {notice['acc-pw'] && <Notice kind={notice['acc-pw'].kind}>{notice['acc-pw'].msg}</Notice>}
          <button type="button" onClick={savePassword} disabled={busy === 'acc-pw'} className={btnGold}>
            {busy === 'acc-pw' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Alterar senha'}
          </button>
        </div>
      </div>
    </div>
  );
}
