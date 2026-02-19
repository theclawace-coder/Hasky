export function OnboardingBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="animate-blob absolute -right-32 -top-32 size-[500px] rounded-full opacity-[0.08]"
        style={{ background: 'radial-gradient(circle, #c084fc 0%, #818cf8 70%, transparent 100%)' }}
      />
      <div
        className="animate-blob-2 absolute -bottom-32 -left-32 size-[450px] rounded-full opacity-[0.07]"
        style={{ background: 'radial-gradient(circle, #38bdf8 0%, #818cf8 70%, transparent 100%)' }}
      />
      <div
        className="animate-blob-3 absolute left-1/2 top-1/2 size-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.05]"
        style={{ background: 'radial-gradient(circle, #FA93FA 0%, #6EE7FF 70%, transparent 100%)' }}
      />
    </div>
  );
}
