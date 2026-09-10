'use client';

// Botao CTA global do site: um unico componente usado em toda a home,
// alternado pelos parametros do painel (modo do CTA, fase da live e lote ativo).
// O texto e o comportamento chegam prontos via props.
export default function GlobalCta({
  onClick,
  onMouseEnter,
  label,
  waitlistMode,
}: {
  onClick: () => void;
  onMouseEnter?: () => void;
  label: string;
  waitlistMode: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`w-full sm:w-auto sm:min-w-[300px] px-10 py-3.5 rounded-full text-xs sm:text-sm uppercase tracking-widest font-black text-center outline-none focus-visible:ring-2 focus-visible:ring-[#F0C265]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070B] active:scale-[0.98] transition-all ${
        waitlistMode
          ? 'bg-gradient-to-b from-[#34D399] to-[#059669] text-black shadow-[0_0_25px_rgba(52,211,153,0.3)] border border-[#10B981]/50'
          : 'btn-gold-shimmer shadow-[0_0_30px_rgba(227,181,82,0.35)]'
      }`}
    >
      {label}
    </button>
  );
}
