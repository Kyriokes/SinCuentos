import { useEffect, useRef, useState } from 'react';
import type { ScoredCategory } from '../../core/types';
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

/**
 * Campo de un peso. Lleva su propio texto: así se puede borrar para escribir otro número sin que salte a 0,
 * y lo que no es un entero de 0 a 99 (un decimal, un signo, una e) no se acepta en vez de transformarse en otra cosa.
 */
function Peso({ cat, value, onChange }: { cat: ScoredCategory; value: number; onChange(cat: ScoredCategory, value: number): void }) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  return (
    <input
      id={`peso-${cat}`}
      className="display"
      type="number"
      inputMode="numeric"
      min={0}
      max={99}
      step={1}
      value={text}
      onChange={(e) => {
        const raw = e.target.value;
        if (!/^\d{0,2}$/.test(raw)) return;
        setText(raw);
        if (raw !== '') onChange(cat, Number(raw));
      }}
      onBlur={() => {
        if (text === '') setText(String(value));
      }}
      onFocus={(e) => e.target.select()}
    />
  );
}

export function Nerd() {
  const weights = useStore((s) => s.weights);
  const setWeight = useStore((s) => s.setWeight);
  const go = useStore((s) => s.go);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);

  return (
    <section className="screen">
      <p className="paso">Modo nerd</p>
      <h1 className="display pregunta" ref={heading} tabIndex={-1}>
        Ponele puntos a todo
      </h1>
      <p className="ayuda">Números enteros de 0 a 99. Un cero deja ese tipo de título fuera de la cuenta.</p>
      <div className="campos">
        {SCORED_ORDER.map((cat) => (
          <div className="campo" key={cat}>
            <div>
              <label htmlFor={`peso-${cat}`}>{CATEGORY_LABEL[cat]}</label>
              <p>{includes(cat)}</p>
            </div>
            <Peso cat={cat} value={weights[cat]} onChange={setWeight} />
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
