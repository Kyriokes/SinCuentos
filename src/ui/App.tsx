import { useEffect } from 'react';
import { useStore } from '../state/store';
import { Calculo } from './screens/Calculo';
import { Canchero } from './screens/Canchero';
import { Inicio } from './screens/Inicio';
import { Nerd } from './screens/Nerd';
import { Resultado } from './screens/Resultado';

export function App() {
  const step = useStore((s) => s.step);
  const reset = useStore((s) => s.reset);
  const showsResult = step === 'carrera' || step === 'resultado';

  useEffect(() => {
    window.scrollTo(0, 0);
    // Fuera del resultado, la dirección no lleva ningún ranking.
    if (!showsResult && window.location.search) window.history.replaceState(null, '', window.location.pathname);
  }, [step, showsResult]);

  return (
    <main className="app">
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
            Empezar de nuevo
          </button>
        </header>
      )}
      {step === 'inicio' && <Inicio />}
      {step === 'canchero' && <Canchero />}
      {step === 'nerd' && <Nerd />}
      {step === 'calculo' && <Calculo />}
      {/* Carrera y resultado son la misma pantalla: el gráfico no se desmonta al terminar la animación. */}
      {showsResult && <Resultado />}
    </main>
  );
}
