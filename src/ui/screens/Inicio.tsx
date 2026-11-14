import { TITLES, YEAR_BOUNDS } from '../../data';
import { useStore } from '../../state/store';
import { Cafecito } from '../Cafecito';

export function Inicio() {
  const start = useStore((s) => s.start);
  return (
    <section className="screen inicio">
      <svg className="cal-lines" viewBox="0 0 360 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <path className="cal" pathLength={1} d="M-20 300H380" />
        <path className="cal" pathLength={1} d="M40 300A140 140 0 0 1 320 300" />
        <circle className="cal-dot" cx={180} cy={300} r={5} />
      </svg>
      <h1 className="display inicio-title">Sin cuentos</h1>
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
        {TITLES.length} títulos oficiales desde {YEAR_BOUNDS.min}. Fuentes: AFA y RSSSF.
      </p>
      <Cafecito />
    </section>
  );
}
