import { render } from '@testing-library/react';
import type { Club, Pattern } from '../core/types';
import { CLUBS } from '../data';
import { Badge, PATTERNS } from './Badge';

const club = (pattern?: Pattern): Club => ({ id: 'x', name: 'Equis', shortName: 'EQX', colors: ['#112233', '#ffffff'], pattern });

test.each(PATTERNS)('dibuja el diseño %s', (pattern) => {
  const { container } = render(
    <svg>
      <Badge club={club(pattern)} size={30} />
    </svg>,
  );
  expect(container.querySelector(`[data-pattern="${pattern}"]`)).not.toBeNull();
  expect(container.querySelector('text')).toHaveTextContent('EQX');
});

test('sin diseño declarado, la camiseta es lisa', () => {
  const { container } = render(
    <svg>
      <Badge club={club()} size={30} />
    </svg>,
  );
  expect(container.querySelector('[data-pattern="liso"]')).not.toBeNull();
});

test('los clubes cargados usan diseños conocidos', () => {
  expect(CLUBS.filter((c) => c.pattern && !PATTERNS.includes(c.pattern))).toEqual([]);
  const pattern = (id: string) => CLUBS.find((c) => c.id === id)?.pattern;
  expect([pattern('river_plate'), pattern('boca_juniors'), pattern('racing'), pattern('velez'), pattern('newells')]).toEqual([
    'banda',
    'franja',
    'bastones',
    'v',
    'mitades',
  ]);
});
