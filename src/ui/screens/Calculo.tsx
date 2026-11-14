import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { useEffect, useRef } from 'react';
import { SCORED_ORDER } from '../../core/weights';
import { useStore } from '../../state/store';
import { CATEGORY_LABEL } from '../labels';
import { usePrefersReducedMotion } from '../motion';

gsap.registerPlugin(MotionPathPlugin);

/** Trayectoria de la pelota: desde el punto penal hasta el ángulo superior derecho. */
const SHOT = 'M180 286C200 210 250 110 281 74';

export function Calculo() {
  const reduced = usePrefersReducedMotion();
  const weights = useStore((s) => s.weights);
  const go = useStore((s) => s.go);
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (reduced) go('carrera');
  }, [reduced, go]);

  useGSAP(
    () => {
      if (reduced) return;
      // La pelota vive en el mismo sistema de coordenadas que la trayectoria: no hace falta alinear.
      const onPath = { path: '#calc-shot' };
      gsap
        .timeline({ onComplete: () => go('carrera') })
        .set('.calc-ball', { motionPath: { ...onPath, start: 0, end: 0 } })
        .from('.calc-line', { strokeDashoffset: 1, duration: 0.7, stagger: 0.12, ease: 'power2.out' })
        .from('.calc-item', { opacity: 0, y: 14, duration: 0.3, stagger: 0.16 }, '-=0.25')
        .to('.calc-ball', { motionPath: onPath, duration: 0.7, ease: 'power1.in' }, '+=0.15')
        .to('.calc-net', { x: 7, y: -4, duration: 0.07, yoyo: true, repeat: 3 })
        .to({}, { duration: 0.35 });
    },
    { scope: root, dependencies: [reduced] },
  );

  return (
    <section className="screen calculo" ref={root}>
      <p className="paso">Calculando con tus reglas</p>
      <svg className="arco" viewBox="0 0 360 300" aria-hidden="true">
        <g className="calc-net">
          {[100, 130, 160, 190, 220, 250].map((x) => (
            <path key={x} className="red" d={`M${x} 62V196`} />
          ))}
          {[92, 124, 156, 188].map((y) => (
            <path key={y} className="red" d={`M70 ${y}H290`} />
          ))}
        </g>
        <path className="cal calc-line" pathLength={1} d="M70 200V60H290V200" />
        <path className="cal calc-line" pathLength={1} d="M10 200H350" />
        <path className="cal calc-line" pathLength={1} d="M130 300A52 52 0 0 1 230 300" />
        <path id="calc-shot" d={SHOT} fill="none" />
        <g className="calc-ball">
          <circle r={11} className="pelota" />
          <path className="pelota-gajo" d="M0 -5L4.8 -1.5L3 4H-3L-4.8 -1.5Z" />
        </g>
      </svg>
      <ul className="valores">
        {SCORED_ORDER.map((cat) => (
          <li key={cat} className="calc-item">
            <span>{CATEGORY_LABEL[cat]}</span>
            <b className="display">{weights[cat]}</b>
          </li>
        ))}
      </ul>
      <button type="button" className="btn-link" onClick={() => go('carrera')}>
        Saltar
      </button>
    </section>
  );
}
