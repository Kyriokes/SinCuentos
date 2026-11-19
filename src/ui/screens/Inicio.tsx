import { useEffect, useRef } from 'react';
import { TITLES, YEAR_BOUNDS } from '../../data';
import { useStore } from '../../state/store';
import { Cafecito } from '../Cafecito';

export function Inicio() {
  const start = useStore((s) => s.start);
  const linkError = useStore((s) => s.linkError);
  const heading = useRef<HTMLHeadingElement>(null);

  // Al volver desde otra pantalla, el foco queda en el título y no en un botón que ya no existe.
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);
  return (
    <section className="screen inicio">
      <svg className="cal-lines" viewBox="0 0 360 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <path className="cal" pathLength={1} d="M-20 300H380" />
        <path className="cal" pathLength={1} d="M40 300A140 140 0 0 1 320 300" />
        <circle className="cal-dot" cx={180} cy={300} r={5} />
      </svg>
      <h1 className="display inicio-title" ref={heading} tabIndex={-1}>
        Sin cuentos
      </h1>
      {linkError && (
        <p className="aviso-link" role="status">
          Ese link llegó cortado o con algo de más, así que no se pudo abrir el ranking. Armá el tuyo o pedí el link de nuevo.
        </p>
      )}
      <p className="lede">
        El ranking histórico del fútbol argentino, armado con tus reglas. Vos decís cuánto vale cada título. Los datos hacen el resto.
      </p>
      <div className="caminos">
        <button type="button" className="camino" onClick={() => start('c')}>
          <b className="display">Canchero</b>
          <span>Tres preguntas y sale el ranking.</span>
        </button>
        <button type="button" className="camino" onClick={() => start('n')}>
          <b className="display">Nerd de la pelota</b>
          <span>Ponele puntos a cada tipo de título.</span>
        </button>
      </div>
      <p className="fine">
        {TITLES.length} títulos oficiales desde {YEAR_BOUNDS.min}. Fuentes: AFA y RSSSF. Insignias propias: no son los escudos oficiales. Sin
        relación con los clubes ni con la AFA.
      </p>
      <Cafecito />
    </section>
  );
}
