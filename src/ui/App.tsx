import { useEffect } from 'react';
import { useStore } from '../state/store';
import { Calculo } from './screens/Calculo';
import { Canchero } from './screens/Canchero';
import { Inicio } from './screens/Inicio';
import { Nerd } from './screens/Nerd';
import { Resultado } from './screens/Resultado';

export function App() {
  const step = useStore((s) => s.step);
  const showsResult = step === 'carrera' || step === 'resultado';

  useEffect(() => {
    window.scrollTo(0, 0);
    // Fuera del resultado, la dirección no lleva ningún ranking.
    if (!showsResult && window.location.search) window.history.replaceState(null, '', window.location.pathname);
  }, [step, showsResult]);

  return (
    <main className="app">
      {step === 'inicio' && <Inicio />}
      {step === 'canchero' && <Canchero />}
      {step === 'nerd' && <Nerd />}
      {step === 'calculo' && <Calculo />}
      {/* Carrera y resultado son la misma pantalla: el gráfico no se desmonta al terminar la animación. */}
      {showsResult && <Resultado />}
    </main>
  );
}
