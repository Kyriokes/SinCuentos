import { useEffect, useRef } from 'react';
import { SCORED_ORDER } from '../../core/weights';
import { useStore } from '../../state/store';
import { CATEGORY_LABEL, QUESTIONS } from '../labels';

export function Canchero() {
  const answers = useStore((s) => s.answers);
  const weights = useStore((s) => s.weights);
  const answer = useStore((s) => s.answer);
  const go = useStore((s) => s.go);

  const current = answers.findIndex((a) => a === null);
  const heading = useRef<HTMLHeadingElement>(null);

  // Cada pregunta nueva se anuncia: el foco va a su enunciado, no queda en un botón que ahora significa otra cosa.
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [current]);
  const finished = current === -1;
  const lastAnswered = finished ? QUESTIONS.length - 1 : current - 1;

  const back = () => {
    if (lastAnswered < 0) return go('inicio');
    const next = [...answers];
    next[lastAnswered] = null;
    useStore.setState({ answers: next });
  };

  if (finished) {
    return (
      <section className="screen">
        <p className="paso">Listo</p>
        <h1 className="display pregunta" ref={heading} tabIndex={-1}>
          Así quedó tu tabla
        </h1>
        <ul className="valores" role="list">
          {SCORED_ORDER.map((cat) => (
            <li key={cat}>
              <span>{CATEGORY_LABEL[cat]}</span>
              <b className="display">{weights[cat]}</b>
            </li>
          ))}
        </ul>
        <div className="acciones">
          <button type="button" className="btn btn-primary" onClick={() => go('calculo')}>
            Calcular
          </button>
          <button type="button" className="btn-link" onClick={back}>
            Cambiar la última respuesta
          </button>
        </div>
      </section>
    );
  }

  const question = QUESTIONS[current];
  // La clave remonta solo el enunciado: entra de nuevo en cada pregunta y se nota que se avanzó.
  // Las opciones y "Volver" quedan afuera para no perder el foco del teclado.
  return (
    <section className="screen">
      <div className="entra" key={current}>
        <p className="paso">
          Pregunta {current + 1} de {QUESTIONS.length}
        </p>
        <h1 className="display pregunta" ref={heading} tabIndex={-1}>
          {question.title}
        </h1>
        <p className="ayuda">{question.help}</p>
      </div>
      <div className="opciones" role="group" aria-label="Opciones" data-count={question.options.length}>
        {question.options.map((option, value) => (
          <button type="button" key={option.label} className="opcion" onClick={() => answer(current as 0 | 1 | 2, value)}>
            <b className="display">{option.big}</b>
            <span>{option.label}</span>
          </button>
        ))}
      </div>
      <button type="button" className="btn-link volver" onClick={back}>
        Volver
      </button>
    </section>
  );
}
