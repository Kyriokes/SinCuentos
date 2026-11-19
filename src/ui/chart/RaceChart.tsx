import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Timeline } from '../../core/score';
import type { Club } from '../../core/types';
import { Badge } from '../Badge';
import { layoutChart, stackBadges } from './geometry';

interface Props {
  timeline: Timeline;
  clubs: Club[];
  /** Clubes que van a pleno color y con insignia. */
  highlight: string[];
  /** Ajusta la escala vertical a los destacados (cuando los eligió el usuario). */
  rescale?: boolean;
  /** Si es false, dibuja el estado final sin animar ni avisar. */
  animate: boolean;
  onDone(): void;
  /** Avisa cada vez que la carrera entra en un año nuevo (índice dentro de `timeline.years`). */
  onYear?(index: number): void;
  /** Color de la línea de cada club destacado. Sin esto, las líneas van en cal. */
  colors?: Map<string, string>;
}

const HEIGHT = 420;
const PAD = 30;
const BADGE = 26;
const BADGE_ROOM = 34;
const ORDINAL = ['primero', 'segundo', 'tercero'];
/** La carrera recorre todos los años en este tiempo. */
export const RACE_SECONDS = 10;

/**
 * La carrera es el contenido, no un adorno: la dispara el usuario, se puede saltear y por eso
 * corre también cuando el sistema pide menos movimiento.
 *
 * Va memoizado: durante la carrera la pantalla se vuelve a renderizar con cada año de la tabla en vivo,
 * y el gráfico no tiene por qué reconciliar sus líneas cada vez.
 */
export const RaceChart = memo(function RaceChart({ timeline, clubs, highlight, rescale, animate, onDone, onYear, colors }: Props) {
  const lastIndex = timeline.years.length - 1;
  const playing = animate && lastIndex > 0;
  const wrap = useRef<HTMLDivElement>(null);
  const clip = useRef<SVGRectElement>(null);
  const cursor = useRef<SVGLineElement>(null);
  const yearLabel = useRef<HTMLDivElement>(null);
  const badges = useRef(new Map<string, SVGGElement>());
  const tween = useRef<gsap.core.Tween | null>(null);
  const reported = useRef(-1);
  const shownYear = useRef(-1);
  /** Por dónde va la carrera de esta serie: si cambia solo el dibujo (ancho, destacados), sigue desde ahí. */
  const race = useRef<{ timeline: Timeline | null; progress: number }>({ timeline: null, progress: 0 });
  const done = useRef(onDone);
  done.current = onDone;
  const year = useRef(onYear);
  year.current = onYear;

  const [width, setWidth] = useState(360);
  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      if (w) setWidth(Math.max(300, Math.min(960, w)));
    };
    measure();
    // Como mucho una medición por frame, aunque el borde de la ventana se arrastre sin parar.
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', schedule);
      return () => {
        window.removeEventListener('resize', schedule);
        cancelAnimationFrame(frame);
      };
    }
    // Observa el contenedor y no la ventana: también se entera cuando aparece la barra de scroll.
    const observer = new ResizeObserver(schedule);
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  const plot = width - BADGE_ROOM;
  const litKey = highlight.join(',');
  const layout = useMemo(
    () => layoutChart(timeline, { width: plot, height: HEIGHT, pad: PAD }, rescale ? litKey.split(',') : undefined),
    [timeline, plot, rescale, litKey],
  );
  const lit = useMemo(() => new Set(litKey.split(',')), [litKey]);
  const clubById = useMemo(() => new Map(clubs.map((c) => [c.id, c])), [clubs]);
  const leaders = timeline.series.filter((s) => lit.has(s.clubId));

  // Para el lector de pantalla, el gráfico se resume en cómo termina.
  const summary = useMemo(() => {
    const podium = timeline.series
      .slice(0, 3)
      .map((s, i) => `${ORDINAL[i]} ${clubById.get(s.clubId)?.name ?? s.clubId} con ${s.cumulative[s.cumulative.length - 1]} puntos`);
    return `Puntos acumulados por club de ${timeline.years[0]} a ${timeline.years[lastIndex]}${podium.length ? `: ${podium.join(', ')}` : ''}.`;
  }, [timeline, clubById, lastIndex]);

  /** Pone el gráfico en el año de índice `position` (puede ser fraccionario). */
  const renderAt = (position: number) => {
    const index = Math.min(lastIndex, Math.max(0, Math.floor(position)));
    const start = layout.xOf(timeline.years[0]);
    const x = start + (layout.xOf(timeline.years[lastIndex]) - start) * (lastIndex ? position / lastIndex : 1);
    clip.current?.setAttribute('width', String(Math.max(0, x)));
    cursor.current?.setAttribute('x1', String(x));
    cursor.current?.setAttribute('x2', String(x));
    // El año gigante cambia unas 13 veces por segundo, no en cada frame: no hace falta volver a escribirlo.
    if (yearLabel.current && index !== shownYear.current) {
      shownYear.current = index;
      yearLabel.current.textContent = String(timeline.years[index]);
    }
    if (animate && index !== reported.current) {
      reported.current = index;
      year.current?.(index);
    }

    // Las insignias viajan en la punta de cada línea.
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
      reported.current = -1;
      shownYear.current = -1;
      if (!playing) {
        race.current = { timeline: null, progress: 0 };
        renderAt(lastIndex);
        return;
      }
      // Una serie nueva es una carrera nueva. Si solo cambió el dibujo (rotar el celular, por ejemplo),
      // la carrera sigue desde donde iba en vez de volver al primer año.
      if (race.current.timeline !== timeline) race.current = { timeline, progress: 0 };
      const from = race.current.progress;
      const state = { position: from * lastIndex };
      renderAt(state.position);
      tween.current = gsap.to(state, {
        position: lastIndex,
        duration: RACE_SECONDS * (1 - from),
        ease: 'none',
        onUpdate: () => {
          race.current.progress = state.position / lastIndex;
          renderAt(state.position);
        },
        onComplete: () => done.current(),
      });
    },
    { dependencies: [layout, playing, litKey], scope: wrap },
  );

  // Con un solo año no hay nada que recorrer: el final es inmediato.
  useEffect(() => {
    if (animate && lastIndex === 0) done.current();
  }, [animate, lastIndex]);

  const skip = () => tween.current?.progress(1);

  return (
    <div className={playing ? 'race corriendo' : 'race'} ref={wrap} onClick={playing ? skip : undefined}>
      {animate && (
        <div className="race-head">
          <div className="race-year" data-year ref={yearLabel} aria-hidden="true">
            {timeline.years[playing ? 0 : lastIndex]}
          </div>
          {playing && (
            <button
              type="button"
              className="btn-link"
              onClick={(e) => {
                // El contenedor también saltea al tocarlo: sin esto, el mismo toque saltearía dos veces.
                e.stopPropagation();
                skip();
              }}
            >
              Saltar
            </button>
          )}
        </div>
      )}
      <svg viewBox={`0 0 ${width} ${HEIGHT}`} role="img" aria-label={summary}>
        <defs>
          <clipPath id="race-clip">
            {/* Arranca apenas arriba del tope: con la escala ajustada a los elegidos, las líneas tenues de los más grandes se cortan ahí. */}
            <rect ref={clip} x={0} y={PAD - 4} width={plot} height={HEIGHT - PAD + 4} />
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
        {layout.ticksX.map((tick) => (
          <text key={tick} className="race-tick" x={layout.xOf(tick)} y={HEIGHT - 8} textAnchor="middle">
            {tick}
          </text>
        ))}
        <g clipPath="url(#race-clip)">
          {/* Las tenues van al fondo y las destacadas encima, con el primero del ranking arriba de todo. */}
          {[...layout.paths]
            .reverse()
            .sort((a, b) => Number(lit.has(a.clubId)) - Number(lit.has(b.clubId)))
            .map((p) => {
              const on = lit.has(p.clubId);
              return (
                <path
                  key={p.clubId}
                  data-club={p.clubId}
                  className={on ? 'race-line' : 'race-line race-line-dim'}
                  style={on && colors?.has(p.clubId) ? { stroke: colors.get(p.clubId) } : undefined}
                  d={p.d}
                />
              );
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
});
