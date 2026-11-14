interface Props {
  min: number;
  max: number;
  from: number;
  to: number;
  onChange(from: number, to: number): void;
}

/** Doble slider: dos rangos superpuestos sobre la misma pista. */
export function RangeSlider({ min, max, from, to, onChange }: Props) {
  const span = Math.max(1, max - min);
  const left = ((from - min) / span) * 100;
  const right = ((to - min) / span) * 100;
  return (
    <div className="rango">
      <div className="rango-valores">
        <span className="display">{from}</span>
        <span>a</span>
        <span className="display">{to}</span>
      </div>
      <div className="rango-pista" style={{ ['--left' as string]: `${left}%`, ['--right' as string]: `${right}%` }}>
        <input type="range" aria-label="Desde" min={min} max={max} step={1} value={from} onChange={(e) => onChange(Math.min(e.target.valueAsNumber, to), to)} />
        <input type="range" aria-label="Hasta" min={min} max={max} step={1} value={to} onChange={(e) => onChange(from, Math.max(e.target.valueAsNumber, from))} />
      </div>
    </div>
  );
}
