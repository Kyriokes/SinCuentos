import { type PointerEvent, useRef, useState } from 'react';

interface Props {
  min: number;
  max: number;
  from: number;
  to: number;
  onChange(from: number, to: number): void;
}

/** Diámetro del extremo en CSS: el recorrido empieza y termina medio extremo adentro de la pista. */
const THUMB = 28;

/** Doble slider: dos rangos superpuestos sobre la misma pista. */
export function RangeSlider({ min, max, from, to, onChange }: Props) {
  /** Extremo que se está moviendo: su año se invierte, para que se vea cuál de los dos cambia. */
  const [active, setActive] = useState<'from' | 'to' | null>(null);
  // Con el mouse el extremo queda enfocado y se puede seguir con las flechas: la marca se queda hasta que pierde el foco.
  // Con el dedo se apaga al soltar, para que no quede prendida.
  const release = (e: PointerEvent<HTMLInputElement>) => {
    if (e.pointerType !== 'mouse' || document.activeElement !== e.currentTarget) setActive(null);
  };
  const hold = (end: 'from' | 'to') => ({
    onPointerDown: () => setActive(end),
    onFocus: () => setActive(end),
    onPointerUp: release,
    onPointerCancel: release,
    onBlur: () => setActive(null),
  });
  const inputs = useRef<{ from: HTMLInputElement | null; to: HTMLInputElement | null }>({ from: null, to: null });

  // Tocar la pista lleva hasta ahí el extremo más cercano: el rango se puede elegir sin arrastrar nada.
  const tap = (e: PointerEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return; // los extremos se arrastran como siempre
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left - THUMB / 2) / Math.max(1, rect.width - THUMB)));
    const year = Math.round(min + ratio * (max - min));
    const end = year <= from ? 'from' : year >= to ? 'to' : year - from <= to - year ? 'from' : 'to';
    if (end === 'from') onChange(year, to);
    else onChange(from, year);
    inputs.current[end]?.focus();
  };
  const span = Math.max(1, max - min);
  const left = ((from - min) / span) * 100;
  const right = ((to - min) / span) * 100;
  // El extremo que se arrastra sigue siempre al dedo y, si pasa al otro, lo empuja: cuando están juntos,
  // el que quedó arriba se puede llevar para cualquier lado.
  return (
    <div className="rango" role="group" aria-label="Rango de años">
      <div className="rango-valores">
        <span className={active === 'from' ? 'display activo' : 'display'}>{from}</span>
        <span>a</span>
        <span className={active === 'to' ? 'display activo' : 'display'}>{to}</span>
      </div>
      <div className="rango-pista" onPointerDown={tap} style={{ ['--left' as string]: `${left}%`, ['--right' as string]: `${right}%` }}>
        {/* Cuando los dos extremos se juntan a la derecha, "Desde" tiene que quedar arriba: es el único que puede moverse. */}
        <input type="range" aria-label="Desde" ref={(el) => void (inputs.current.from = el)} {...hold('from')} min={min} max={max} step={1} value={from} style={{ zIndex: from - min > span / 2 ? 3 : 1 }} onChange={(e) => onChange(e.target.valueAsNumber, Math.max(e.target.valueAsNumber, to))} />
        <input type="range" aria-label="Hasta" ref={(el) => void (inputs.current.to = el)} {...hold('to')} min={min} max={max} step={1} value={to} style={{ zIndex: 2 }} onChange={(e) => onChange(Math.min(e.target.valueAsNumber, from), e.target.valueAsNumber)} />
      </div>
    </div>
  );
}
