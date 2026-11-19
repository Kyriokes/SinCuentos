import { memo, useId } from 'react';
import type { Club, Pattern } from '../core/types';

export const PATTERNS: Pattern[] = ['liso', 'bastones', 'aros', 'banda', 'franja', 'mitades', 'v'];

const SHIELD = 'M2 2H26V18C26 26 19 30 14 32C9 30 2 26 2 18Z';

/** El diseño de la camiseta, dibujado con el color secundario sobre el principal. */
function Jersey({ pattern, color }: { pattern: Pattern; color: string }) {
  switch (pattern) {
    case 'bastones':
      return (
        <g data-pattern="bastones" fill={color}>
          <rect x={5.4} y={0} width={3.5} height={34} />
          <rect x={12.3} y={0} width={3.5} height={34} />
          <rect x={19.2} y={0} width={3.5} height={34} />
        </g>
      );
    case 'aros':
      return (
        <g data-pattern="aros" fill={color}>
          <rect x={0} y={5} width={28} height={3.2} />
          <rect x={0} y={11.4} width={28} height={3.2} />
          <rect x={0} y={17.8} width={28} height={3.2} />
        </g>
      );
    case 'banda':
      return <path data-pattern="banda" fill={color} d="M0 0H7L28 19V26H24L0 5Z" />;
    case 'franja':
      return <rect data-pattern="franja" fill={color} x={0} y={8} width={28} height={6.5} />;
    case 'mitades':
      return <rect data-pattern="mitades" fill={color} x={14} y={0} width={14} height={34} />;
    case 'v':
      return <path data-pattern="v" fill={color} d="M3 2H8.5L14 14L19.5 2H25L14 21Z" />;
    default:
      return <rect data-pattern="liso" fill={color} x={0} y={0} width={28} height={3.6} />;
  }
}

/**
 * Insignia propia: un escudo con el diseño de la camiseta del club y sus iniciales.
 * No usa el escudo oficial. Dibuja centrada en (0, 0).
 */
export function Badge({ club, size }: { club: Club; size: number }) {
  const clip = useId();
  const [primary, secondary] = club.colors;
  const scale = size / 34;
  return (
    <g transform={`scale(${scale}) translate(-14 -17)`} aria-hidden="true">
      <clipPath id={clip}>
        <path d={SHIELD} />
      </clipPath>
      <g clipPath={`url(#${clip})`}>
        <rect x={0} y={0} width={28} height={34} fill={primary} />
        <Jersey pattern={club.pattern ?? 'liso'} color={secondary} />
        {/* Las iniciales van sobre una placa oscura para que se lean con cualquier camiseta. */}
        <rect x={0} y={21} width={28} height={13} fill="var(--tinta, #12372a)" />
        <text x={14} y={27.6} textAnchor="middle" fontSize={club.shortName.length > 3 ? 5.6 : 6.6} fontWeight={700} fill="var(--cal, #f4f1e4)">
          {club.shortName}
        </text>
      </g>
      <path d={SHIELD} fill="none" stroke="var(--cal, #f4f1e4)" strokeWidth={2.5} strokeLinejoin="round" />
    </g>
  );
}

/**
 * Memoizada: el club sale de CLUBS (mismo objeto siempre) y el tamaño es fijo, así que al mover el slider
 * las decenas de insignias de la tabla no se vuelven a reconciliar.
 */
export const BadgeIcon = memo(function BadgeIcon({ club, size }: { club: Club; size: number }) {
  return (
    <svg width={size} height={size} viewBox="-17 -18 34 36" aria-hidden="true">
      <Badge club={club} size={32} />
    </svg>
  );
});
