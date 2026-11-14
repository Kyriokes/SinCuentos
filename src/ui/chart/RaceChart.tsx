import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Timeline } from '../../core/score';
import type { Club } from '../../core/types';
import { Badge } from '../Badge';
import { usePrefersReducedMotion } from '../motion';
import { layoutChart, stackBadges } from './geometry';

interface Props {
  timeline: Timeline;
  clubs: Club[];
  /** Cuántos clubes van a pleno color y con insignia. */
  highlight: number;
  /** Si es false, dibuja el estado final sin animar ni avisar. */
  animate: boolean;
  onDone(): void;
}

const HEIGHT = 420;
const PAD = 30;
const BADGE = 26;
const BADGE_ROOM = 34;
const SECONDS = 11;

export function RaceChart({ timeline, clubs, highlight, animate, onDone }: Props) {
  const reduced = usePrefersReducedMotion();
  const playing = animate && !reduced;
  const wrap = useRef<HTMLDivElement>(null);
  const clip = useRef<SVGRectElement>(null);
  const cursor = useRef<SVGLineElement>(null);
  const yearLabel = useRef<HTMLDivElement>(null);
  const badges = useRef(new Map<string, SVGGElement>());
  const tween = useRef<gsap.core.Tween | null>(null);
  const done = useRef(onDone);
  done.current = onDone;

  const [width, setWidth] = useState(360);
  useLayoutEffect(() => {
    const measure = () => {
      const w = wrap.current?.clientWidth;
      if (w) setWidth(Math.max(300, Math.min(960, w)));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const plot = width - BADGE_ROOM;
  const layout = useMemo(() => layoutChart(timeline, { width: plot, height: HEIGHT, pad: PAD }), [timeline, plot]);
  const clubById = useMemo(() => new Map(clubs.map((c) => [c.id, c])), [clubs]);
  const leaders = timeline.series.slice(0, highlight);
  const lastIndex = timeline.years.length - 1;

  /** Pone el gráfico en el año de índice `position` (puede ser fraccionario). */
  const renderAt = (position: number) => {
    const index = Math.min(lastIndex, Math.max(0, Math.floor(position)));
    const x = layout.xOf(timeline.years[0]) + (layout.xOf(timeline.years[lastIndex]) - layout.xOf(timeline.years[0])) * (lastIndex ? position / lastIndex : 1);
    clip.current?.setAttribute('width', String(Math.max(0, x)));
    cursor.current?.setAttribute('x1', String(x));
    cursor.current?.setAttribute('x2', String(x));
    if (yearLabel.current) yearLabel.current.textContent = String(timeline.years[index]);

    // Las insignias viajan en la punta de cada línea; si se pisan, se apilan hacia arriba.
    const placed = stackBadges(
      leaders.map((s) => ({ id: s.clubId, points: s.cumulative[index], y: layout.yOf(s.cumulative[index]) })),
      BADGE,
    );
    for (const s of leaders) {
      const node = badges.current.get(s.clubId);
      if (!node) continue;
      const y = placed.get(s.clubId);
      node.style.opacity = y === undefined ? '0' : '1';
      if (y !== undefined) node.setAttribute('transform', `translate(${x + BADGE / 2 + 3} ${y})`);
    }
  };

  useGSAP(
    () => {
      tween.current?.kill();
      tween.current = null;
      if (!playing || lastIndex === 0) {
        renderAt(lastIndex);
        return;
      }
      const state = { position: 0 };
      renderAt(0);
      tween.current = gsap.to(state, {
        position: lastIndex,
        duration: SECONDS,
        ease: 'power1.inOut',
        onUpdate: () => renderAt(state.position),
        onComplete: () => done.current(),
      });
    },
    { dependencies: [layout, playing, highlight], scope: wrap },
  );

  // Sin animación posible (movimiento reducido o un solo año), el final es inmediato.
  useEffect(() => {
    if (animate && (reduced || lastIndex === 0)) done.current();
  }, [animate, reduced, lastIndex]);

  const skip = () => tween.current?.progress(1);

  return (
    <div className="race" ref={wrap} onClick={playing ? skip : undefined}>
      {animate && (
        <div className="race-head">
          <div className="race-year" data-year ref={yearLabel}>
            {timeline.years[lastIndex]}
          </div>
          {playing && (
            <button type="button" className="btn-link" onClick={skip}>
              Saltar
            </button>
          )}
        </div>
      )}
      <svg viewBox={`0 0 ${width} ${HEIGHT}`} role="img" aria-label="Puntos acumulados por club, año por año">
        <defs>
          <clipPath id="race-clip">
            <rect ref={clip} x={0} y={0} width={plot} height={HEIGHT} />
          </clipPath>
        </defs>
        {layout.ticksY.map((t) => (
          <g key={t}>
            <line className="race-grid" x1={PAD} x2={plot - PAD} y1={layout.yOf(t)} y2={layout.yOf(t)} />
            <text className="race-tick" x={PAD - 6} y={layout.yOf(t) + 4} textAnchor="end">
              {t}
            </text>
          </g>
        ))}
        {layout.ticksX.map((year) => (
          <text key={year} className="race-tick" x={layout.xOf(year)} y={HEIGHT - 8} textAnchor="middle">
            {year}
          </text>
        ))}
        <g clipPath="url(#race-clip)">
          {[...layout.paths].reverse().map((p) => {
            const rank = timeline.series.findIndex((s) => s.clubId === p.clubId);
            return <path key={p.clubId} data-club={p.clubId} className={rank < highlight ? 'race-line' : 'race-line race-line-dim'} d={p.d} />;
          })}
        </g>
        <line ref={cursor} className="race-cursor" x1={plot - PAD} x2={plot - PAD} y1={PAD - 8} y2={HEIGHT - PAD} />
        {leaders.map((s) => {
          const club = clubById.get(s.clubId);
          return (
            <g key={s.clubId} data-badge={s.clubId} ref={(node) => void (node ? badges.current.set(s.clubId, node) : badges.current.delete(s.clubId))}>
              {club && <Badge club={club} size={BADGE} />}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
