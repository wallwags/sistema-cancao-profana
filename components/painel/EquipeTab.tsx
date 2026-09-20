'use client';

// Aba EQUIPE do painel /sagrado · extraída 1:1 do page.tsx (17/09, dívida técnica).
import { Loader2, UserPlus } from 'lucide-react';
import { useState, type Dispatch, type SetStateAction } from 'react';
import { inputCls, btnGold } from './ui';

export interface StaffRow {
  id: string;
  email?: string;
  username?: string;
  display_name?: string | null;
  role: 'dev' | 'admin' | 'jurado';
  permissions?: object | null;
  active?: boolean;
}

export const PERM_KEYS: Array<{ key: string; label: string }> = [
  { key: 'manage_lotes', label: 'Gerenciar lotes, ofertas e live' },
  { key: 'manage_content', label: 'Gerenciar conteúdo do site (datas, link, oferta da live, FAQ)' },
  { key: 'manage_subscriptions', label: 'Gerenciar inscrições, pagamentos e notas' },
  { key: 'view_sensitive_data', label: 'Visualizar dados pessoais dos inscritos (CPF, contato)' },
  { key: 'manage_team', label: 'Gerenciar acessos da equipe' },
  { key: 'manage_vip', label: 'Gerenciar Grupo VIP e interessados' },
  { key: 'manage_gateway', label: 'Gerenciar integração de pagamentos' },
  { key: 'view_audit', label: 'Visualizar o histórico de auditoria' },
  { key: 'ver_metodo_cobranca', label: 'Ver alternador de método de cobrança (aba Lotes)' },
  { key: 'toggle_pix_fake', label: 'Ligar/desligar Pix fantoche da home (aba Widgets)' },
];

function DisableStaffButton({ onDisable, busy }: { onDisable: () => void; busy: boolean }) {
  const [armed, setArmed] = useState(false);
  if (!armed) {
    return (
      <button type="button" onClick={() => setArmed(true)} disabled={busy} className="font-mono text-xs font-bold text-red-400/80 hover:text-red-400 border border-red-500/20 hover:border-red-500/40 px-4 py-2.5 rounded-xl uppercase tracking-wider transition-colors">
        Desativar acesso
      </button>
    );
  }
  return (
    <button type="button" onClick={onDisable} disabled={busy} className="font-mono text-xs font-bold text-white bg-red-600/90 px-4 py-2.5 rounded-xl uppercase tracking-wider disabled:opacity-50">
      Confirmar desativação
    </button>
  );
}

interface EquipeTabProps {
  isDev: boolean;
  me: { id: string } | null;
  staffList: StaffRow[];
  setStaffList: Dispatch<SetStateAction<StaffRow[]>>;
  disableStaff: (s: StaffRow) => void;
  saveStaff: (s: StaffRow) => void;
  createMember: () => void;
  invite: { username: string; name: string; password: string; role: 'jurado' | 'admin' };
  setInvite: Dispatch<SetStateAction<{ username: string; name: string; password: string; role: 'jurado' | 'admin' }>>;
  busy: string | null;
  notice: Record<string, { kind: 'ok' | 'err' | 'info'; msg: string }>;
  Field: (p: { label: string; children: React.ReactNode }) => JSX.Element;
  Notice: (p: { kind: 'ok' | 'err' | 'info'; children: React.ReactNode }) => JSX.Element | null;
}

export default function EquipeTab({ isDev, me, staffList, setStaffList, disableStaff, saveStaff, createMember, invite, setInvite, busy, notice, Field, Notice }: EquipeTabProps) {
  return (
    <div className="space-y-4 fade-up-800">
      <Notice kind="info">Crie acessos da equipe e ajuste os nomes de exibição. A senha inicial é definida aqui - a pessoa deve trocá-la em Minha conta após o primeiro acesso.</Notice>

      {isDev ? staffList.map(s => {
        const self = s.id === me?.id;
        const k = `staff-${s.id}`;
        const cur = staffList.find(x => x.id === s.id) || s;
        const upd = (patch: Partial<StaffRow>) => setStaffList(list => list.map(x => x.id === s.id ? { ...x, ...patch } : x));
        return (
          <div key={s.id} className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div>
                <h3 className="font-display font-bold text-white">{cur.display_name || cur.email}</h3>
                <span className="font-mono text-[11px] text-gray-500 block">@{cur.username}{self ? ' • você' : ''}</span>
              </div>
              <span className={`font-mono text-[11px] font-bold px-2.5 py-1 rounded-full uppercase border ${cur.role === 'dev' ? 'text-[#F0C265] border-[#F0C265]/40 bg-[#F0C265]/10' : cur.role === 'jurado' ? 'text-blue-300 border-blue-400/30 bg-blue-400/10' : 'text-gray-400 border-white/10 bg-white/5'}`}>
                {cur.role}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-4">
              <Field label="Nome de exibição">
                <input className={inputCls} value={cur.display_name || ''} disabled={self} onChange={(e) => upd({ display_name: e.target.value })} />
              </Field>
              <Field label="Nível de acesso">
                <select className={inputCls} value={cur.role} disabled={self} onChange={(e) => upd({ role: e.target.value as StaffRow['role'] })}>
                  <option value="admin">admin</option>
                  <option value="jurado">jurado</option>
                  <option value="dev">dev</option>
                </select>
              </Field>
            </div>

            <div className={`space-y-2 ${cur.role === 'admin' ? '' : 'hidden'}`}>
              <span className="font-mono text-[11px] text-gray-400 uppercase tracking-widest block font-bold">Funções liberadas no painel</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                {PERM_KEYS.map(pk => (
                  <label key={pk.key} className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-0.5 w-4 h-4 bg-black border-white/20 rounded focus:ring-[#F0C265]"
                      checked={isDev && cur.role === 'dev' ? true : !!((cur.permissions as Record<string, boolean | undefined> | null)?.[pk.key])}
                      disabled={self}
                      onChange={(e) => upd({ permissions: { ...cur.permissions, [pk.key]: e.target.checked } })}
                    />
                    <span className="text-xs text-gray-300 leading-snug">{pk.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end items-center gap-3 flex-wrap">
              {notice[k] && <Notice kind={notice[k].kind}>{notice[k].msg}</Notice>}
              {!self && <DisableStaffButton onDisable={() => disableStaff(cur)} busy={busy === `disable-${cur.id}`} />}
              <button type="button" onClick={() => saveStaff(cur)} disabled={busy === k || self} className={btnGold}>
                {busy === k ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : self ? 'Edite em Minha conta' : 'Salvar membro'}
              </button>
            </div>
          </div>
        );
      }) : staffList.filter(x => x.id !== me?.id).map(s => {
        const k = `staff-${s.id}`;
        const upd = (patch: Partial<StaffRow>) => setStaffList(list => list.map(x => x.id === s.id ? { ...x, ...patch } : x));
        return (
          <div key={s.id} className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="border-b border-white/5 pb-3">
              <h3 className="font-display font-bold text-white">{s.display_name || s.username}</h3>
              <span className="font-mono text-[11px] text-gray-500 block">@{s.username}</span>
            </div>
            <Field label="Nome de exibição">
              <input className={inputCls} value={s.display_name || ''} onChange={(e) => upd({ display_name: e.target.value })} />
            </Field>
            <div className="flex justify-end items-center gap-3">
              {notice[k] && <Notice kind={notice[k].kind}>{notice[k].msg}</Notice>}
              <button type="button" onClick={() => saveStaff(s)} disabled={busy === k} className={btnGold}>
                {busy === k ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Salvar'}
              </button>
            </div>
          </div>
        );
      })}

      <div className="bg-black/40 border border-dashed border-[#E3B552]/30 rounded-xl p-4 space-y-3">
        <span className="font-mono text-[11px] text-[#F0C265] uppercase tracking-widest font-bold flex items-center gap-1.5"><UserPlus className="w-3.5 h-3.5" /> Criar novo acesso</span>
        <p className="text-xs text-gray-500 font-mono">Se o e-mail pertencer a um acesso desativado, ele será reativado no nível escolhido (a senha continua a anterior).</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Nome de usuário"><input className={inputCls} value={invite.username} onChange={(e) => setInvite(p => ({ ...p, username: e.target.value }))} placeholder="ex: carlos.jurado" spellCheck={false} /></Field>
          <Field label="Nome de exibição"><input className={inputCls} value={invite.name} onChange={(e) => setInvite(p => ({ ...p, name: e.target.value }))} placeholder="Como aparece no painel" /></Field>
          <Field label="Senha inicial (mín. 8)"><input type="password" className={inputCls} value={invite.password} onChange={(e) => setInvite(p => ({ ...p, password: e.target.value }))} /></Field>
          {isDev && (
            <Field label="Nível de acesso">
              <select className={inputCls} value={invite.role} onChange={(e) => setInvite(p => ({ ...p, role: e.target.value as 'jurado' | 'admin' }))}>
                <option value="jurado">jurado</option>
                <option value="admin">admin</option>
              </select>
            </Field>
          )}
        </div>
        <div className="flex justify-end items-center gap-3">
          {notice['invite'] && <Notice kind={notice['invite'].kind}>{notice['invite'].msg}</Notice>}
          <button type="button" onClick={createMember} disabled={busy === 'invite'} className={btnGold}>
            {busy === 'invite' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Criar acesso'}
          </button>
        </div>
      </div>
    </div>
  );
}
