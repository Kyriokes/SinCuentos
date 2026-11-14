import { useEffect, useMemo, useState } from 'react';
import { computeRanking, computeTimeline, type ClubResult } from '../../core/score';
import { encodeShare } from '../../core/share';
import type { CancheroAnswers, Club, Competition, Title } from '../../core/types';
import { SCORED_ORDER } from '../../core/weights';
import { CLUBS, COMPETITIONS, TITLES, YEAR_BOUNDS } from '../../data';
import { useStore } from '../../state/store';
import { BadgeIcon } from '../Badge';
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
const HIGHLIGHT = 8;

export function Resultado({ data = REAL }: { data?: ResultadoData }) {
  const step = useStore((s) => s.step);
  const mode = useStore((s) => s.mode);
  const answers = useStore((s) => s.answers);
  const weights = useStore((s) => s.weights);
  const filters = useStore((s) => s.filters);
  const setFilters = useStore((s) => s.setFilters);
  const go = useStore((s) => s.go);
  const start = useStore((s) => s.start);
  const reset = useStore((s) => s.reset);

  const [open, setOpen] = useState<string | null>(null);
  const [copied, setCopied] = useState<'no' | 'yes' | 'manual'>('no');

  const ranking = useMemo(() => computeRanking(data.titles, weights, filters, data.clubs), [data, weights, filters]);
  const timeline = useMemo(() => computeTimeline(data.titles, weights, filters, data.clubs), [data, weights, filters]);
  const clubById = useMemo(() => new Map(data.clubs.map((c) => [c.id, c])), [data]);
  const competitionName = useMemo(() => new Map(data.competitions.map((c) => [c.id, c.name])), [data]);

  const empty = ranking.length === 0;
  const racing = step === 'carrera' && !empty;

  const query =
    mode === 'c' && answers.every((a) => a !== null)
      ? encodeShare({ mode: 'c', answers: answers as CancheroAnswers, filters })
      : encodeShare({ mode: 'n', weights, filters });

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
        <input type="checkbox" checked={filters.includeAmateur} onChange={(e) => setFilters({ includeAmateur: e.target.checked })} />
        <span>Contar el amateurismo</span>
      </label>
      <RangeSlider min={data.bounds.min} max={data.bounds.max} from={filters.from} to={filters.to} onChange={(from, to) => setFilters({ from, to })} />
    </div>
  );

  if (empty) {
    const allZero = SCORED_ORDER.every((cat) => weights[cat] === 0);
    return (
      <section className="screen">
        <h2 className="display pregunta">{allZero ? 'Con todo en cero no hay ranking' : 'Nadie suma puntos acá'}</h2>
        <p className="ayuda">
          {allZero ? 'Todos los valores están en cero. Subí alguno en la calculadora.' : 'Ningún club ganó un título que cuente en estos años. Ampliá el rango.'}
        </p>
        {!allZero && controls}
        <div className="acciones">
          <button type="button" className="btn btn-primary" onClick={() => start('n')}>
            Volver a la calculadora
          </button>
          <button type="button" className="btn-link" onClick={reset}>
            Empezar de nuevo
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="screen resultado">
      {!racing && (
        <>
          <p className="paso">
            {filters.from} a {filters.to}
            {filters.includeAmateur ? '' : ', sin amateurismo'}
          </p>
          <h2 className="display pregunta">Tu ranking</h2>
          <Podio ranking={ranking} clubById={clubById} />
        </>
      )}

      <RaceChart timeline={timeline} clubs={data.clubs} highlight={HIGHLIGHT} animate={step === 'carrera'} onDone={() => go('resultado')} />

      {!racing && (
        <>
          {controls}

          <ol className="tabla">
            {ranking.map((r) => {
              const club = clubById.get(r.clubId);
              const isOpen = open === r.clubId;
              return (
                <li key={r.clubId} data-testid="fila" data-club={r.clubId} className={isOpen ? 'fila abierta' : 'fila'}>
                  <button type="button" className="fila-btn" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : r.clubId)}>
                    <span className="display puesto">{r.rank}</span>
                    {club && <BadgeIcon club={club} size={34} />}
                    <span className="club">
                      {club?.name ?? r.clubId}
                      <small>{r.vitrina === 1 ? '1 copa en la vitrina' : `${r.vitrina} copas en la vitrina`}</small>
                    </span>
                    <span className="display puntos" data-testid="puntos">
                      {r.points}
                    </span>
                  </button>
                  {isOpen && <Desglose result={r} weights={weights} titles={titlesOf(r.clubId)} competitionName={competitionName} />}
                </li>
              );
            })}
          </ol>

          <div className="acciones">
            <button type="button" className="btn btn-primary" onClick={share}>
              Compartir
            </button>
            <p className="aviso" role="status">
              {copied === 'yes' && 'Link copiado'}
              {copied === 'manual' && 'Copiá el link de la barra de direcciones'}
            </p>
            {mode === 'c' ? (
              <button type="button" className="btn" onClick={() => start('n')}>
                Quiero más control
              </button>
            ) : (
              <button type="button" className="btn" onClick={() => start('n')}>
                Cambiar los valores
              </button>
            )}
            <button type="button" className="btn-link" onClick={reset}>
              Empezar de nuevo
            </button>
          </div>
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
