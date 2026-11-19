import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { firstProfessionalYear, professionalRange, toggleAmateur as toggledRange, type YearRange } from '../../core/range';
import { computeRanking, computeTimeline, inRange, isVitrina, type ClubResult } from '../../core/score';
import { encodeShare, MAX_SELECTED } from '../../core/share';
import type { CancheroAnswers, Club, Competition, Title, Weights } from '../../core/types';
import { SCORED_ORDER } from '../../core/weights';
import { CLUBS, COMPETITIONS, TITLES, YEAR_BOUNDS } from '../../data';
import { useStore } from '../../state/store';
import { BadgeIcon } from '../Badge';
import { Cafecito } from '../Cafecito';
import { assignLineColors } from '../chart/colors';
import { RaceChart } from '../chart/RaceChart';
import { CATEGORY_LABEL } from '../labels';
import { useSlideRows } from '../motion';
import { RangeSlider } from '../RangeSlider';

export interface ResultadoData {
  clubs: Club[];
  competitions: Competition[];
  titles: Title[];
  bounds: { min: number; max: number };
}

const REAL: ResultadoData = { clubs: CLUBS, competitions: COMPETITIONS, titles: TITLES, bounds: YEAR_BOUNDS };
/** Filas de la tabla en vivo que acompaña a la carrera. */
const LIVE_ROWS = 5;

type ShareState = 'no' | 'yes' | 'manual';

export function Resultado({ data = REAL }: { data?: ResultadoData }) {
  const step = useStore((s) => s.step);
  const mode = useStore((s) => s.mode);
  const answers = useStore((s) => s.answers);
  const weights = useStore((s) => s.weights);
  const filters = useStore((s) => s.filters);
  const setFilters = useStore((s) => s.setFilters);
  const go = useStore((s) => s.go);
  const start = useStore((s) => s.start);
  const selected = useStore((s) => s.selected);
  const setSelected = useStore((s) => s.setSelected);
  const fromLink = useStore((s) => s.fromLink);

  const [open, setOpen] = useState<string | null>(null);
  /** En modo comparar, tocar una fila la elige para el gráfico en vez de abrir su detalle. */
  const [comparing, setComparing] = useState(false);
  /** Año por el que va la carrera, como índice de la serie. */
  const [raceIndex, setRaceIndex] = useState(0);
  const [copied, setCopied] = useState<ShareState>('no');
  /** El podio se levanta solo cuando viene de terminar la carrera, no al mover filtros. */
  const [reveal, setReveal] = useState(false);

  const liveRef = useRef<HTMLOListElement>(null);
  const tableRef = useRef<HTMLOListElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useSlideRows(liveRef);
  useSlideRows(tableRef);

  // Lo que sigue al dedo (los años del slider) usa `filters`; lo caro (ranking, gráfico, tabla) usa la versión
  // diferida: React la recalcula cuando hay tiempo y descarta los pasos intermedios de un arrastre rápido.
  const view = useDeferredValue(filters);
  const ranking = useMemo(() => computeRanking(data.titles, weights, view, data.clubs), [data, weights, view]);
  const timeline = useMemo(() => computeTimeline(data.titles, weights, view, data.clubs), [data, weights, view]);
  const clubById = useMemo(() => new Map(data.clubs.map((c) => [c.id, c])), [data]);
  const competitionName = useMemo(() => new Map(data.competitions.map((c) => [c.id, c.name])), [data]);

  // Destacados del gráfico, en orden de ranking: los que eligió el usuario o, si no eligió, los primeros.
  // Un elegido que no suma puntos en este rango no se dibuja, pero tampoco se lo reemplaza por otro.
  const lit = useMemo(
    () => (selected ? ranking.filter((r) => selected.includes(r.clubId)) : ranking.slice(0, MAX_SELECTED)).map((r) => r.clubId),
    [ranking, selected],
  );

  // Los colores se reparten de arriba a abajo entre los destacados; al cambiar el ranking, se reparten de nuevo.
  const lineColors = useMemo(() => assignLineColors(lit.flatMap((id) => clubById.get(id) ?? [])), [lit, clubById]);

  /** Todos los elegidos, incluso los que hoy no suman: cuentan para el tope y no se pierden al tocar otra fila. */
  const chosen = selected ?? lit;
  const toggleRef = useRef<HTMLButtonElement>(null);

  const toggleClub = (clubId: string) => {
    if (lit.includes(clubId)) {
      // Siempre queda al menos uno dibujado: un gráfico sin nadie no compara nada.
      if (lit.length > 1) setSelected(chosen.filter((id) => id !== clubId));
    } else if (chosen.length < MAX_SELECTED) {
      setSelected([...chosen, clubId]);
    }
  };

  // Sin amateurismo, los años anteriores al profesionalismo quedan vacíos: el slider no los ofrece.
  const firstProfessional = useMemo(() => firstProfessionalYear(data.titles, data.bounds.max), [data]);
  const sliderMin = filters.includeAmateur ? data.bounds.min : firstProfessional;

  // Un link sin amateurismo puede traer años anteriores al profesionalismo.
  useEffect(() => {
    if (!filters.includeAmateur && filters.from < firstProfessional) setFilters(professionalRange(filters, firstProfessional, data.bounds.max));
  }, [filters, firstProfessional, data, setFilters]);

  /** Rango que había al destildar el amateurismo, para devolverlo tal cual al volver a tildar. */
  const beforeOff = useRef<YearRange | null>(null);

  const toggleAmateur = (include: boolean) => {
    const next = toggledRange(filters, include, beforeOff.current, firstProfessional, data.bounds);
    beforeOff.current = next.saved;
    setFilters(next.filters);
  };

  const empty = ranking.length === 0;
  const racing = step === 'carrera' && !empty;

  // Una carrera sin nadie no muestra nada: si ningún elegido suma, se corre con los primeros.
  const fallback = racing && selected !== null && lit.length === 0;
  const shown = useMemo(() => (fallback ? ranking.slice(0, MAX_SELECTED).map((r) => r.clubId) : lit), [fallback, ranking, lit]);

  const codes = selected?.flatMap((id) => clubById.get(id)?.shortName ?? []);
  const query =
    mode === 'c' && answers.every((a) => a !== null)
      ? encodeShare({ mode: 'c', answers: answers as CancheroAnswers, filters, selected: codes })
      : encodeShare({ mode: 'n', weights, filters, selected: codes });
  const url = `${window.location.origin}${window.location.pathname}?${query}`;

  // La barra de direcciones siempre lleva el resultado que se está viendo.
  // Se espera a que el slider se quede quieto: Safari corta la página si se la actualiza
  // más de cien veces en medio minuto.
  useEffect(() => {
    setCopied('no');
    const timer = window.setTimeout(() => {
      try {
        window.history.replaceState(null, '', `${window.location.pathname}?${query}`);
      } catch {
        // Sin dirección actualizada el resultado sigue funcionando; compartir usa `query` directamente.
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (step === 'carrera' && empty) go('resultado');
  }, [step, empty, go]);

  // Si el rango queda vacío el podio se desmonta; al volver no tiene que levantarse otra vez.
  useEffect(() => {
    if (empty) setReveal(false);
  }, [empty]);

  // Al empezar la carrera y al terminar, el foco va al título de lo que se está viendo: con teclado o lector
  // de pantalla, sin esto queda en un botón que ya no existe y no se anuncia nada.
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [racing]);

  const onRaceDone = useCallback(() => {
    setReveal(true);
    go('resultado');
  }, [go]);

  const share = async () => {
    // En el celular, el menú de compartir del sistema lleva directo a WhatsApp o donde sea, con un texto que
    // cuenta qué es el link antes de tocarlo. En la compu, copiar es lo esperable.
    const podium = ranking
      .slice(0, 3)
      .map((r) => `${r.rank}. ${clubById.get(r.clubId)?.name ?? r.clubId} ${r.points}`)
      .join(', ');
    const text = `${fromLink ? 'Este ranking' : 'Mi ranking'} del fútbol argentino: ${podium}. ¿Cuál es el tuyo?`;
    if (window.matchMedia('(pointer: coarse)').matches && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: 'Sin Cuentos', text, url });
        return;
      } catch (error) {
        // Cerrar el menú sin elegir nada no es un error: no hay nada que avisar.
        if ((error as DOMException)?.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied('yes');
    } catch {
      setCopied('manual');
    }
  };

  const titlesOf = (clubId: string) => data.titles.filter((t) => t.clubId === clubId && inRange(t, view)).sort((a, b) => a.year - b.year);

  const controls = (
    <div className="controles">
      <label className="check">
        <input type="checkbox" checked={filters.includeAmateur} onChange={(e) => toggleAmateur(e.target.checked)} />
        <span>Contar el amateurismo</span>
      </label>
      <RangeSlider min={sliderMin} max={data.bounds.max} from={filters.from} to={filters.to} onChange={(from, to) => setFilters({ from, to })} />
    </div>
  );

  const allZero = empty && SCORED_ORDER.every((cat) => weights[cat] === 0);

  const shareButton = (
    <button type="button" className={fromLink ? 'btn' : 'btn btn-primary'} onClick={share}>
      Compartir
    </button>
  );

  return (
    <section className="screen resultado">
      {empty ? (
        <>
          <h1 className="display pregunta" ref={heading} tabIndex={-1}>
            {allZero ? 'Con todo en cero no hay ranking' : 'Nadie suma puntos acá'}
          </h1>
          <p className="ayuda">
            {allZero ? 'Todos los valores están en cero. Subí alguno en la calculadora.' : 'Ningún club ganó un título que cuente en estos años. Ampliá el rango.'}
          </p>
        </>
      ) : racing ? (
        <h1 className="sr-only" ref={heading} tabIndex={-1}>
          Carrera de {view.from} a {view.to}
        </h1>
      ) : (
        <>
          <p className="paso">
            {view.from} a {view.to}
            {view.includeAmateur ? '' : ', sin amateurismo'}
          </p>
          <h1 className="display pregunta" ref={heading} tabIndex={-1}>
            {fromLink ? 'El ranking que te pasaron' : 'Tu ranking'}
          </h1>
          {fromLink && (
            <p className="ayuda reglas">
              Con estas reglas: {SCORED_ORDER.map((cat) => `${CATEGORY_LABEL[cat]} ${weights[cat]}`).join(' · ')}.
            </p>
          )}
          <Podio ranking={ranking} clubById={clubById} reveal={reveal} />
        </>
      )}

      {/* Con el rango vacío el gráfico se oculta pero los controles siguen en su lugar: el slider no se desmonta en pleno arrastre. */}
      {!empty && (
        <RaceChart
          timeline={timeline}
          clubs={data.clubs}
          highlight={shown}
          rescale={selected !== null && !fallback}
          animate={step === 'carrera'}
          onDone={onRaceDone}
          onYear={setRaceIndex}
          colors={lineColors}
        />
      )}

      {racing && (
        <ol className="vivo" aria-hidden="true" ref={liveRef}>
          {timeline.series
            .map((s) => ({ clubId: s.clubId, points: s.cumulative[Math.min(raceIndex, s.cumulative.length - 1)] }))
            .filter((s) => s.points > 0 && (!selected || fallback || lit.includes(s.clubId)))
            .sort((a, b) => b.points - a.points)
            .slice(0, LIVE_ROWS)
            .map((s, i) => {
              const club = clubById.get(s.clubId);
              return (
                <li key={s.clubId} data-testid="vivo" data-club={s.clubId}>
                  <span className="display puesto">{i + 1}</span>
                  {club && <BadgeIcon club={club} size={30} />}
                  <span className="club">
                    {club?.name ?? s.clubId}
                    {lineColors.has(s.clubId) && <i className="muestra" style={{ background: lineColors.get(s.clubId) }} />}
                  </span>
                  <span className="display puntos">
                    <Golpe value={s.points} />
                  </span>
                </li>
              );
            })}
        </ol>
      )}

      {!racing && (
        <>
          {!allZero && controls}

          {!empty && (
            <div className={comparing ? 'pista-fila fija' : 'pista-fila'}>
              <p className="pista" role="status">
                {comparing
                  ? chosen.length >= MAX_SELECTED
                    ? `Ya hay ${MAX_SELECTED} elegidos: sacá uno para sumar otro`
                    : lit.length === 1
                      ? 'Tiene que quedar al menos uno. Tocá otros clubes para sumarlos'
                      : `Tocá los clubes que querés comparar: ${chosen.length} de ${MAX_SELECTED}`
                  : !selected
                    ? 'Tocá un club para ver sus títulos'
                    : lit.length === 0
                      ? 'Ninguno de los clubes elegidos suma puntos en estos años'
                      : `Comparando ${lit.length === 1 ? '1 club' : `${lit.length} clubes`}. Tocá uno para ver sus títulos`}
              </p>
              <div className="pista-acciones">
                {/* Este botón va primero para no moverse de lugar cuando aparece el otro. */}
                <button
                  ref={toggleRef}
                  type="button"
                  className="btn-link"
                  onClick={() => {
                    setOpen(null);
                    setComparing(!comparing);
                  }}
                >
                  {comparing ? 'Listo' : 'Elegir clubes para comparar'}
                </button>
                {selected && (
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => {
                      setSelected(null);
                      toggleRef.current?.focus();
                    }}
                  >
                    Volver a los primeros
                  </button>
                )}
              </div>
            </div>
          )}
          <ol className={comparing ? 'tabla comparando' : 'tabla'} hidden={empty} ref={tableRef} role="list">
            {ranking.map((r) => {
              const club = clubById.get(r.clubId);
              const isOpen = !comparing && open === r.clubId;
              const isLit = lit.includes(r.clubId);
              // Bloqueadas: las que no entran por el tope y la única elegida, que no se puede sacar.
              const full = isLit ? lit.length === 1 : chosen.length >= MAX_SELECTED;
              return (
                <li key={r.clubId} data-testid="fila" data-club={r.clubId} className={`fila${isOpen ? ' abierta' : ''}${comparing && !isLit ? ' apagada' : ''}`}>
                  <button
                    type="button"
                    className="fila-btn"
                    {...(comparing ? { 'aria-pressed': isLit, 'aria-disabled': full } : { 'aria-expanded': isOpen })}
                    onClick={() => (comparing ? toggleClub(r.clubId) : setOpen(isOpen ? null : r.clubId))}
                  >
                    <span className="display puesto">
                      <span className="sr-only">Puesto </span>
                      {r.rank}
                    </span>
                    {club && <BadgeIcon club={club} size={34} />}
                    <span className="club">
                      {club?.name ?? r.clubId}
                      <small>
                        {lineColors.has(r.clubId) && <i className="muestra" data-swatch style={{ background: lineColors.get(r.clubId) }} />}
                        {r.vitrina === 1 ? '1 copa secundaria' : `${r.vitrina} copas secundarias`}
                      </small>
                    </span>
                    <span className="display puntos" data-testid="puntos">
                      {r.points}
                    </span>
                    <span className="sr-only"> puntos</span>
                    {comparing ? (
                      <i className="casilla" data-on={isLit || undefined} />
                    ) : (
                      <svg className="flecha" data-chevron viewBox="0 0 16 16" width={16} height={16} aria-hidden="true">
                        <path d="M3 6L8 11L13 6" />
                      </svg>
                    )}
                  </button>
                  {isOpen && <Desglose result={r} weights={weights} titles={titlesOf(r.clubId)} competitionName={competitionName} />}
                </li>
              );
            })}
          </ol>
          {!empty && <p className="fine">Copas secundarias: supercopas, recopas y copas menores. No suman puntos; desempatan.</p>}

          <div className="acciones">
            {!empty && (
              <>
                {fromLink && (
                  <button type="button" className="btn btn-primary" onClick={() => start('c')}>
                    Armá el tuyo
                  </button>
                )}
                {shareButton}
                <div className="aviso" role="status">
                  {copied === 'yes' && 'Link copiado'}
                  {copied === 'manual' && (
                    <label className="copiar">
                      <span>No se pudo copiar solo. Copialo de acá:</span>
                      <input type="text" readOnly value={url} onFocus={(e) => e.target.select()} autoFocus />
                    </label>
                  )}
                </div>
              </>
            )}
            {empty ? (
              <button type="button" className="btn btn-primary" onClick={() => start('n')}>
                Volver a la calculadora
              </button>
            ) : mode === 'c' ? (
              <button type="button" className="btn" onClick={() => start('n')}>
                Quiero más control
              </button>
            ) : (
              <button type="button" className="btn" onClick={() => start('n')}>
                Cambiar los valores
              </button>
            )}
          </div>
          {!empty && (
            <>
              <Cafecito />
              <p className="fine">Insignias propias: no son los escudos oficiales. Sin relación con los clubes ni con la AFA.</p>
            </>
          )}
        </>
      )}
    </section>
  );
}

/** El número da un golpe invertido cada vez que cambia: los puntos se ganan de golpe, no se cuentan de a uno. */
function Golpe({ value }: { value: number }) {
  const last = useRef(value);
  const hits = useRef(0);
  if (last.current !== value) {
    last.current = value;
    hits.current += 1;
  }
  return (
    <b key={hits.current} className={hits.current ? 'golpe' : undefined}>
      {value}
    </b>
  );
}

function Podio({ ranking, clubById, reveal }: { ranking: ClubResult[]; clubById: Map<string, Club>; reveal: boolean }) {
  // Orden visual de podio: segundo, primero, tercero.
  const order = [ranking[1], ranking[0], ranking[2]].filter(Boolean);
  const root = useRef<HTMLDivElement>(null);

  // Al terminar la carrera los escalones se levantan del tercero al primero y recién después se apoyan las insignias.
  useGSAP(
    () => {
      if (!reveal || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const steps = [3, 2, 1].flatMap((rank) => gsap.utils.toArray<HTMLElement>(`.escalon-${rank}`, root.current));
      gsap
        .timeline()
        .from(
          steps.map((step) => step.querySelector('.escalon-base')),
          { scaleY: 0, transformOrigin: '50% 100%', duration: 0.35, ease: 'power2.out', stagger: 0.12, clearProps: 'transform' },
        )
        .from(
          steps.flatMap((step) => [...step.children].filter((el) => !el.classList.contains('escalon-base'))),
          { y: -8, opacity: 0, duration: 0.2, ease: 'power2.out', stagger: 0.03, clearProps: 'transform,opacity' },
          '-=0.15',
        );
    },
    { scope: root },
  );

  return (
    <div className="podio" aria-hidden="true" ref={root}>
      {order.map((r) => {
        const club = clubById.get(r.clubId);
        return (
          <div key={r.clubId} className={`escalon escalon-${r.rank}`}>
            {club && <BadgeIcon club={club} size={r.rank === 1 ? 64 : 48} />}
            <span className="escalon-nombre">{club?.name ?? r.clubId}</span>
            <div className="escalon-base">
              <b className="display">{r.points}</b>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface DesgloseProps {
  result: ClubResult;
  weights: Weights;
  titles: Title[];
  competitionName: Map<string, string>;
}

function Desglose({ result, weights, titles, competitionName }: DesgloseProps) {
  return (
    <div className="desglose">
      <dl>
        {SCORED_ORDER.filter((cat) => result.counts[cat] > 0).map((cat) => (
          <div key={cat}>
            <dt>{CATEGORY_LABEL[cat]}</dt>
            <dd>{`${result.counts[cat]} × ${weights[cat]} = ${result.counts[cat] * weights[cat]}`}</dd>
          </div>
        ))}
      </dl>
      <ul className="titulos" role="list">
        {titles.map((t, i) => (
          <li key={i} className={isVitrina(t.category) ? 'en-vitrina' : undefined}>
            <span className="anio">{t.year}</span>
            <span>
              {competitionName.get(t.competitionId) ?? t.competitionId}
              {t.edition ? ` (${t.edition})` : ''}
            </span>
            <a href={t.source} target="_blank" rel="noreferrer">
              fuente
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
