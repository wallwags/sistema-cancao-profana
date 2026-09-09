// Parser tolerante para timestamps vindos do banco/Supabase.
// Aceita '2026-09-14 23:00:00+00', ISO com Z, offsets '-03:00', etc.
// Safari/iOS rejeita offsets '+00' sem os minutos; normaliza para '+00:00'.
export function parseDbDate(value?: string | null): Date | null {
  if (!value) return null;
  let s = String(value).trim().replace(' ', 'T');
  if (/[+-]\d{2}$/.test(s)) s += ':00';
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export function dbDateMs(value?: string | null): number {
  return parseDbDate(value)?.getTime() ?? NaN;
}
