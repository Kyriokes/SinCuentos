import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { computeRanking, computeTimeline, type ClubResult } from '../../core/score';
import { encodeShare, MAX_SELECTED } from '../../core/share';
import type { CancheroAnswers, Club, Competition, Title } from '../../core/types';
import { SCORED_ORDER } from '../../core/weights';
import { CLUBS, COMPETITIONS, TITLES, YEAR_BOUNDS } from '../../data';
import { useStore } from '../../state/store';
import { BadgeIcon } from '../Badge';
import { Cafecito } from '../Cafecito';
import { assignLineColors } from '../chart/colors';
import { RaceChart } from '../chart/RaceChart';
import { CATEGORY_LABEL } from '../labels';
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

  const [open, setOpen] = useState<string | null>(null);
  /** En modo comparar, tocar una fila la elige para el gráfico en vez de abrir su detalle. */
  const [comparing, setComparing] = useState(false);
  /** Año por el que va la carrera, como índice de la serie. */
  const [raceIndex, setRaceIndex] = useState(0);
  const [copied, setCopied] = useState<'no' | 'yes' | 'manual'>('no');

  const ranking = useMemo(() => computeRanking(data.titles, weights, filters, data.clubs), [data, weights, filters]);
  const timeline = useMemo(() => computeTimeline(data.titles, weights, filters, data.clubs), [data, weights, filters]);
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
  const firstProfessional = useMemo(
    () => Math.min(data.bounds.max, ...data.titles.filter((t) => t.era === 'profesional').map((t) => t.year)),
    [data],
  );
  const sliderMin = filters.includeAmateur ? data.bounds.min : firstProfessional;

  /** El rango que queda sin amateurismo. Si era entero amateur no se aplasta en un solo año: se abre hasta hoy. */
  const professionalRange = useCallback(
    (from: number, to: number) => ({ from: Math.max(from, firstProfessional), to: to < firstProfessional ? data.bounds.max : to }),
    [firstProfessional, data],
  );

  // Un link sin amateurismo puede traer años anteriores al profesionalismo.
  useEffect(() => {
    if (!filters.includeAmateur && filters.from < firstProfessional) setFilters(professionalRange(filters.from, filters.to));
  }, [filters.includeAmateur, filters.from, filters.to, firstProfessional, professionalRange, setFilters]);

  /** Rango que había al destildar el amateurismo, para devolverlo tal cual al volver a tildar. */
  const beforeOff = useRef<{ from: number; to: number } | null>(null);

  const toggleAmateur = (include: boolean) => {
    if (!include) {
      beforeOff.current = { from: filters.from, to: filters.to };
      return setFilters({ includeAmateur: false, ...professionalRange(filters.from, filters.to) });
    }
    const saved = beforeOff.current;
    beforeOff.current = null;
    let { from, to } = filters;
    if (saved) {
      // Cada extremo vuelve a donde estaba, salvo que se lo haya movido mientras tanto.
      const clamped = professionalRange(saved.from, saved.to);
      if (from === clamped.from) from = saved.from;
      if (to === clamped.to && saved.to >= from) to = saved.to;
    } else if (from === firstProfessional) {
      // Sin rango anterior (un link sin amateurismo): el piso profesional equivale a "desde el principio".
      from = data.bounds.min;
    }
    setFilters({ includeAmateur: true, from, to });
  };

  const empty = ranking.length === 0;
  const racing = step === 'carrera' && !empty;

  // Una carrera sin nadie no muestra nada: si ningún elegido suma, se corre con los primeros.
  const fallback = racing && selected !== null && lit.length === 0;
  const shown = fallback ? ranking.slice(0, MAX_SELECTED).map((r) => r.clubId) : lit;

  const codes = selected?.flatMap((id) => clubById.get(id)?.shortName ?? []);
  const query =
    mode === 'c' && answers.every((a) => a !== null)
      ? encodeShare({ mode: 'c', answers: answers as CancheroAnswers, filters, selected: codes })
      : encodeShare({ mode: 'n', weights, filters, selected: codes });

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

  const share = () => {
    const url = `${window.location.origin}${window.location.pathname}?${query}`;
    const clipboard = navigator.clipboard;
    if (!clipboard) return setCopied('manual');
    clipboard.writeText(url).then(
      () => setCopied('yes'),
      () => setCopied('manual'),
    );
  };

  const titlesOf = (clubId: string) =>
    data.titles
      .filter((t) => t.clubId === clubId && t.year >= filters.from && t.year <= filters.to && (filters.includeAmateur || t.era === 'profesional'))
      .sort((a, b) => a.year - b.year);

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

  return (
    <section className="screen resultado">
      {empty ? (
        <>
          <h2 className="display pregunta">{allZero ? 'Con todo en cero no hay ranking' : 'Nadie suma puntos acá'}</h2>
          <p className="ayuda">
            {allZero ? 'Todos los valores están en cero. Subí alguno en la calculadora.' : 'Ningún club ganó un título que cuente en estos años. Ampliá el rango.'}
          </p>
        </>
      ) : (
        !racing && (
          <>
            <p className="paso">
              {filters.from} a {filters.to}
              {filters.includeAmateur ? '' : ', sin amateurismo'}
            </p>
            <h2 className="display pregunta">Tu ranking</h2>
            <Podio ranking={ranking} clubById={clubById} />
          </>
        )
      )}

      {/* Con el rango vacío el gráfico se oculta pero los controles siguen en su lugar: el slider no se desmonta en pleno arrastre. */}
      {!empty && (
        <RaceChart
          timeline={timeline}
          clubs={data.clubs}
          highlight={shown}
          rescale={selected !== null && !fallback}
          animate={step === 'carrera'}
          onDone={() => go('resultado')}
          onYear={setRaceIndex}
          colors={lineColors}
        />
      )}

      {racing && (
        <ol className="vivo" aria-hidden="true">
          {timeline.series
            .map((s) => ({ clubId: s.clubId, points: s.cumulative[Math.min(raceIndex, s.cumulative.length - 1)] }))
            .filter((s) => s.points > 0 && (!selected || fallback || lit.includes(s.clubId)))
            .sort((a, b) => b.points - a.points)
            .slice(0, LIVE_ROWS)
            .map((s, i) => {
              const club = clubById.get(s.clubId);
              return (
                <li key={s.clubId} data-testid="vivo">
                  <span className="display puesto">{i + 1}</span>
                  {club && <BadgeIcon club={club} size={30} />}
                  <span className="club">
                    {club?.name ?? s.clubId}
                    {lineColors.has(s.clubId) && <i className="muestra" style={{ background: lineColors.get(s.clubId) }} />}
                  </span>
                  <span className="display puntos">{s.points}</span>
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
          <ol className={comparing ? 'tabla comparando' : 'tabla'} hidden={empty}>
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
                    <span className="display puesto">{r.rank}</span>
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

          <div className="acciones">
            {!empty && (
              <>
                <button type="button" className="btn btn-primary" onClick={share}>
                  Compartir
                </button>
                <p className="aviso" role="status">
                  {copied === 'yes' && 'Link copiado'}
                  {copied === 'manual' && 'Copiá el link de la barra de direcciones'}
                </p>
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
          {!empty && <Cafecito />}
        </>
      )}
    </section>
  );
}

function Podio({ ranking, clubById }: { ranking: ClubResult[]; clubById: Map<string, Club> }) {
  // Orden visual de podio: segundo, primero, tercero.
  const order = [ranking[1], ranking[0], ranking[2]].filter(Boolean);
  return (
    <div className="podio" aria-hidden="true">
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
  weights: Record<string, number>;
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
      <ul className="titulos">
        {titles.map((t, i) => (
          <li key={i} className={t.category === 'vitrina_nacional' || t.category === 'tier_c' ? 'en-vitrina' : undefined}>
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
