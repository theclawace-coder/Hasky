interface Props {
  current: number; // 0-indexed
  total: number;
}

export function StepIndicator({ current, total }: Props) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={[
            'h-[3px] rounded-full transition-all duration-500',
            i < current
              ? 'w-5 bg-gradient-to-r from-violet-400 to-cyan-400 opacity-60'
              : i === current
              ? 'w-8 bg-gradient-to-r from-violet-500 to-cyan-400 shadow-[0_0_8px_rgba(139,92,246,0.5)]'
              : 'w-4 bg-slate-300',
          ].join(' ')}
        />
      ))}
    </div>
  );
}
