import { SCORED_ORDER } from '../../core/weights';
import { COMPETITIONS } from '../../data';
import { useStore } from '../../state/store';
import { CATEGORY_LABEL, LIGA_INCLUDES } from '../labels';

const includes = (cat: (typeof SCORED_ORDER)[number]) =>
  cat === 'liga_corta' || cat === 'liga_anual'
    ? LIGA_INCLUDES[cat]
    : COMPETITIONS.filter((c) => c.category === cat)
        .map((c) => c.name)
        .join(', ');

export function Nerd() {
  const weights = useStore((s) => s.weights);
  const setWeight = useStore((s) => s.setWeight);
  const go = useStore((s) => s.go);

  return (
    <section className="screen">
      <p className="paso">Modo nerd</p>
      <h2 className="display pregunta">Ponele puntos a todo</h2>
      <p className="ayuda">Números enteros de 0 a 99. Un cero deja ese tipo de título fuera de la cuenta.</p>
      <div className="campos">
        {SCORED_ORDER.map((cat) => (
          <div className="campo" key={cat}>
            <div>
              <label htmlFor={`peso-${cat}`}>{CATEGORY_LABEL[cat]}</label>
              <p>{includes(cat)}</p>
            </div>
            <input
              id={`peso-${cat}`}
              className="display"
              type="number"
              inputMode="numeric"
              min={0}
              max={99}
              step={1}
              value={weights[cat]}
              onChange={(e) => setWeight(cat, e.target.valueAsNumber)}
              onFocus={(e) => e.target.select()}
            />
          </div>
        ))}
      </div>
      <p className="fine">Las copas secundarias (supercopas, recopas y copas menores) no suman puntos: solo desempatan.</p>
      <div className="acciones">
        <button type="button" className="btn btn-primary" onClick={() => go('calculo')}>
          Calcular
        </button>
        <button type="button" className="btn-link" onClick={() => go('inicio')}>
          Volver
        </button>
      </div>
    </section>
  );
}
