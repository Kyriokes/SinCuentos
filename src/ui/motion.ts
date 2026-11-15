import gsap from 'gsap';
import { type RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => window.matchMedia(QUERY).matches);
  useEffect(() => {
    const media = window.matchMedia(QUERY);
    const onChange = () => setReduced(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

/**
 * Cuando cambia el orden de las filas (`[data-club]`, hijas directas del contenedor), cada una se desliza
 * desde donde estaba hasta su puesto nuevo: se ve quién pasó a quién. Si el orden no cambió, no se mueve nada.
 */
export function useSlideRows(container: RefObject<HTMLElement | null>) {
  const before = useRef<{ order: string; tops: Map<string, number> }>({ order: '', tops: new Map() });

  useLayoutEffect(() => {
    const root = container.current;
    if (!root) {
      before.current = { order: '', tops: new Map() };
      return;
    }
    const rows = [...root.children].filter((el): el is HTMLElement => el instanceof HTMLElement && !!el.dataset.club);
    const order = rows.map((el) => el.dataset.club).join(',');
    // offsetTop no depende del scroll ni de la transformación en curso.
    const tops = new Map(rows.map((el) => [el.dataset.club!, el.offsetTop - root.offsetTop]));
    const prev = before.current;
    before.current = { order, tops };
    if (order === prev.order || !prev.order || window.matchMedia(QUERY).matches) return;

    for (const el of rows) {
      const was = prev.tops.get(el.dataset.club!);
      const now = tops.get(el.dataset.club!)!;
      if (was === undefined || was === now) continue;
      const current = Number(gsap.getProperty(el, 'y')) || 0;
      gsap.fromTo(el, { y: was - now + current }, { y: 0, duration: 0.25, ease: 'power2.out', overwrite: true, clearProps: 'transform' });
    }
  });

  useEffect(() => {
    const root = container.current;
    return () => {
      if (root) gsap.killTweensOf([...root.children]);
    };
  }, [container]);
}
