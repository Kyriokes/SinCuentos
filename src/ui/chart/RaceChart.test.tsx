import { fireEvent, render } from '@testing-library/react';
import { vi } from 'vitest';
import { FIXTURE_CLUBS, FIXTURE_COMPETITIONS, FIXTURE_ROWS } from '../../core/fixture';
import { resolveTitles } from '../../core/resolve';
import { computeTimeline } from '../../core/score';
import { DEFAULT_WEIGHTS } from '../../core/weights';
import { mockReducedMotion } from '../../test-setup';
import { RaceChart } from './RaceChart';

const timeline = computeTimeline(
  resolveTitles(FIXTURE_ROWS, FIXTURE_COMPETITIONS),
  DEFAULT_WEIGHTS,
  { includeAmateur: true, from: 1920, to: 2015 },
  FIXTURE_CLUBS,
);

const all = timeline.series.map((s) => s.clubId);

test('la carrera corre aunque el sistema pida menos movimiento, y se puede saltear', () => {
  mockReducedMotion(true);
  const onDone = vi.fn();
  const onYear = vi.fn();
  const { container, getByRole } = render(<RaceChart timeline={timeline} clubs={FIXTURE_CLUBS} highlight={all} animate onDone={onDone} onYear={onYear} />);
  expect(container.querySelectorAll('path[data-club]')).toHaveLength(3);
  expect(container.querySelectorAll('g[data-badge]')).toHaveLength(3);
  expect(container.querySelector('[data-year]')).toHaveTextContent('1920');
  expect(onDone).not.toHaveBeenCalled();
  fireEvent.click(getByRole('button', { name: 'Saltar' }));
  expect(container.querySelector('[data-year]')).toHaveTextContent('2015');
  expect(onYear).toHaveBeenLastCalledWith(95);
  expect(onDone).toHaveBeenCalledTimes(1);
});

test('sin animación no avisa y no muestra el contador de año', () => {
  const onDone = vi.fn();
  const { container } = render(<RaceChart timeline={timeline} clubs={FIXTURE_CLUBS} highlight={all} animate={false} onDone={onDone} />);
  expect(container.querySelectorAll('path[data-club]')).toHaveLength(3);
  expect(container.querySelector('[data-year]')).toBeNull();
  expect(onDone).not.toHaveBeenCalled();
});

test('solo los destacados llevan insignia', () => {
  const { container } = render(<RaceChart timeline={timeline} clubs={FIXTURE_CLUBS} highlight={all.slice(0, 2)} animate={false} onDone={() => {}} />);
  expect(container.querySelectorAll('g[data-badge]')).toHaveLength(2);
});

test('un elegido fuera de los primeros va a pleno, con insignia y pintado encima de los tenues', () => {
  const last = all[all.length - 1];
  const { container } = render(<RaceChart timeline={timeline} clubs={FIXTURE_CLUBS} highlight={[last]} rescale animate={false} onDone={() => {}} />);
  expect([...container.querySelectorAll('g[data-badge]')].map((g) => g.getAttribute('data-badge'))).toEqual([last]);
  const paths = [...container.querySelectorAll('path[data-club]')];
  expect(paths[paths.length - 1].getAttribute('data-club')).toBe(last);
  expect(paths[paths.length - 1]).not.toHaveClass('race-line-dim');
  expect(container.querySelector(`g[data-badge="${last}"]`)?.getAttribute('transform')).toMatch(/^translate\(/);
});
