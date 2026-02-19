import { Toaster } from 'sonner';

export const Toast = () => (
  <Toaster
    position="top-right"
    gap={8}
    offset={16}
    toastOptions={{
      duration: 4000,
      style: {
        // Glass card
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.65)',
        borderRadius: '18px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)',
        fontFamily: '"Inter", "Instrument Sans", "Segoe UI", sans-serif',
        fontSize: '14px',
        fontWeight: '500',
        color: '#0f172a',
        padding: '14px 18px',
        minWidth: '300px',
      },
    }}
  />
);
