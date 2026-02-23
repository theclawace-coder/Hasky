import { useId } from 'react';

interface LogoMarkProps {
  /** Width & height in pixels */
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Hasky logomark — techy "H" with a circuit-node crossbar.
 *
 * Uses a unique gradient ID per instance so multiple copies on the
 * same page never share the same SVG <defs> id.
 */
export function LogoMark({ size = 36, className = '', style }: LogoMarkProps) {
  const uid = useId().replace(/:/g, '_');
  const gradId = `hasky_g_${uid}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 36 36"
      fill="none"
      width={size}
      height={size}
      className={className}
      style={style}
      aria-label="Hasky"
      role="img"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#c084fc" />
          <stop offset="0.5" stopColor="#818cf8" />
          <stop offset="1" stopColor="#38bdf8" />
        </linearGradient>
      </defs>

      {/* Background tile */}
      <rect width="36" height="36" rx="9" fill={`url(#${gradId})`} />

      {/* Glass top highlight */}
      <rect x="1" y="1" width="34" height="14" rx="8" fill="white" fillOpacity="0.08" />

      {/* PCB corner markers */}
      <circle cx="4.5"  cy="4.5"  r="1.5" stroke="white" strokeWidth="0.8" strokeOpacity="0.45" />
      <circle cx="31.5" cy="4.5"  r="1.5" stroke="white" strokeWidth="0.8" strokeOpacity="0.45" />
      <circle cx="4.5"  cy="31.5" r="1.5" stroke="white" strokeWidth="0.8" strokeOpacity="0.45" />
      <circle cx="31.5" cy="31.5" r="1.5" stroke="white" strokeWidth="0.8" strokeOpacity="0.45" />

      {/* H — left pillar */}
      <rect x="7"  y="8" width="6" height="20" rx="1.5" fill="white" />
      {/* H — right pillar */}
      <rect x="23" y="8" width="6" height="20" rx="1.5" fill="white" />

      {/* H — crossbar split halves */}
      <rect x="13"   y="15.5" width="3.5" height="5" fill="white" />
      <rect x="19.5" y="15.5" width="3.5" height="5" fill="white" />

      {/* Centre node — gradient fill + white ring (the "circuit port") */}
      <circle cx="18" cy="18" r="3.2" fill={`url(#${gradId})`} />
      <circle cx="18" cy="18" r="3.2" stroke="white" strokeWidth="1.8" />
    </svg>
  );
}
