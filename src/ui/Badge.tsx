import type { Club } from '../core/types';

const SHIELD = 'M2 2H26V18C26 26 19 30 14 32C9 30 2 26 2 18Z';

function isLight(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 150;
}

/** Insignia propia: forma de escudo con los colores y las iniciales del club. Dibuja centrada en (0, 0). */
export function Badge({ club, size }: { club: Club; size: number }) {
  const [primary, secondary] = club.colors;
  const scale = size / 34;
  return (
    <g transform={`scale(${scale}) translate(-14 -17)`} aria-hidden="true">
      <path d={SHIELD} fill={primary} stroke="var(--cal)" strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M3.2 9.5H24.8V15.5H3.2Z" fill={secondary} />
      <text x={14} y={26} textAnchor="middle" fontSize={club.shortName.length > 3 ? 6 : 7.5} fontWeight={700} fill={isLight(primary) ? '#12221b' : '#ffffff'}>
        {club.shortName}
      </text>
    </g>
  );
}

export function BadgeIcon({ club, size }: { club: Club; size: number }) {
  return (
    <svg width={size} height={size} viewBox="-17 -17 34 34" className="badge-icon" aria-hidden="true">
      <Badge club={club} size={32} />
    </svg>
  );
}
