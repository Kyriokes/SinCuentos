import { Component, lazy, Suspense, useEffect, type ReactNode } from 'react';
import { type Step, useStore } from '../state/store';
import { Canchero } from './screens/Canchero';
import { Inicio } from './screens/Inicio';
import { Nerd } from './screens/Nerd';

// Cálculo y resultado traen gsap y el gráfico: no hacen falta para pintar el Inicio, así que llegan aparte.
const loadCalculo = () => import('./screens/Calculo');
const loadResultado = () => import('./screens/Resultado');
const Calculo = lazy(() => loadCalculo().then((m) => ({ default: m.Calculo })));
const Resultado = lazy(() => loadResultado().then((m) => ({ default: m.Resultado })));

const TITLE: Record<Step, string> = {
  inicio: 'Sin Cuentos: el ranking del fútbol argentino con tus reglas',
  canchero: 'Tres preguntas · Sin Cuentos',
  nerd: 'Modo nerd · Sin Cuentos',
  calculo: 'Calculando · Sin Cuentos',
  carrera: 'La carrera · Sin Cuentos',
  resultado: 'El ranking · Sin Cuentos',
};

/** Si algo se rompe al dibujar una pantalla, se muestra un aviso con salida en vez de una página vacía. */
class Guard extends Component<{ children: ReactNode; onReset(): void }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <section className="screen">
        <h1 className="display pregunta">Algo se rompió</h1>
        <p className="ayuda">No pudimos mostrar esta pantalla. Volvé al inicio y armá el ranking de nuevo.</p>
        <div className="acciones">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              this.setState({ failed: false });
              this.props.onReset();
            }}
          >
            Volver al inicio
          </button>
        </div>
      </section>
    );
  }
}

export function App() {
  const step = useStore((s) => s.step);
  const reset = useStore((s) => s.reset);
  const showsResult = step === 'carrera' || step === 'resultado';

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = TITLE[step];
    // Fuera del resultado, la dirección no lleva ningún ranking.
    if (!showsResult && window.location.search) window.history.replaceState(null, '', window.location.pathname);
    // Mientras se responden las preguntas, el resto de la app se baja de fondo: al calcular ya está.
    if (step === 'canchero' || step === 'nerd') {
      void loadCalculo();
      void loadResultado();
    }
  }, [step, showsResult]);

  return (
    <div className="app">
      {/* Siempre a mano: la marca vuelve al inicio desde cualquier pantalla, también en plena carrera. */}
      {step !== 'inicio' && (
        <header className="barra">
          <button type="button" className="display barra-marca" onClick={reset} aria-label="Sin cuentos: volver al inicio">
            Sin cuentos
          </button>
          <button type="button" className="barra-reinicio" onClick={reset}>
            <svg viewBox="0 0 16 16" width={16} height={16} aria-hidden="true">
              <path d="M3 8a5 5 0 1 0 1.6-3.7M3 2.5V5h2.5" />
            </svg>
            <span className="barra-texto">Empezar de nuevo</span>
          </button>
        </header>
      )}
      <main className="contenido">
        <Guard onReset={reset}>
          <Suspense fallback={null}>
            {step === 'inicio' && <Inicio />}
            {step === 'canchero' && <Canchero />}
            {step === 'nerd' && <Nerd />}
            {step === 'calculo' && <Calculo />}
            {/* Carrera y resultado son la misma pantalla: el gráfico no se desmonta al terminar la animación. */}
            {showsResult && <Resultado />}
          </Suspense>
        </Guard>
      </main>
    </div>
  );
}
