import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { FIXTURE_CLUBS, FIXTURE_COMPETITIONS, FIXTURE_ROWS } from '../../core/fixture';
import { resolveTitles } from '../../core/resolve';
import { decodeShare } from '../../core/share';
import { DEFAULT_WEIGHTS } from '../../core/weights';
import { useStore } from '../../state/store';
import { Resultado, type ResultadoData } from './Resultado';

const DATA: ResultadoData = {
  clubs: FIXTURE_CLUBS,
  competitions: FIXTURE_COMPETITIONS,
  titles: resolveTitles(FIXTURE_ROWS, FIXTURE_COMPETITIONS),
  bounds: { min: 1920, max: 2015 },
};

function setup(patch: Partial<ReturnType<typeof useStore.getState>> = {}) {
  useStore.getState().reset();
  useStore.setState({
    step: 'resultado',
    mode: 'c',
    answers: [1, 1, 1],
    weights: { ...DEFAULT_WEIGHTS },
    filters: { includeAmateur: true, from: 1920, to: 2015 },
    ...patch,
  });
  return render(<Resultado data={DATA} />);
}

const rows = () =>
  screen.getAllByTestId('fila').map((r) => [r.dataset.club, within(r).getByTestId('puntos').textContent]);

test('lista el ranking en orden', () => {
  setup();
  expect(rows()).toEqual([
    ['beta', '14'],
    ['zeta', '8'],
    ['alfa', '1'],
  ]);
});

test('apagar el amateurismo recalcula', async () => {
  setup();
  await userEvent.click(screen.getByLabelText('Contar el amateurismo'));
  expect(rows()[1]).toEqual(['zeta', '6']);
});

test('mover el rango recalcula', () => {
  setup();
  fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2000' } });
  expect(rows()[0]).toEqual(['beta', '12']);
});

test('el desglose muestra cantidad por valor y los títulos con su fuente', async () => {
  setup();
  const beta = screen.getAllByTestId('fila')[0];
  await userEvent.click(within(beta).getByRole('button'));
  expect(within(beta).getByText('1 × 8 = 8')).toBeInTheDocument();
  expect(within(beta).getByText(/Copa Intercontinental/)).toBeInTheDocument();
  expect(within(beta).getAllByRole('link', { name: 'fuente' }).length).toBe(4);
});

test('compartir copia un link que reproduce el estado', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  setup();
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  fireEvent.click(screen.getByRole('button', { name: 'Compartir' }));
  expect(writeText).toHaveBeenCalledTimes(1);
  const link = new URL(writeText.mock.calls[0][0]);
  expect(decodeShare(link.search, DATA.bounds)).toEqual({
    mode: 'c',
    answers: [1, 1, 1],
    filters: { includeAmateur: true, from: 1920, to: 2015 },
  });
  expect(await screen.findByText('Link copiado')).toBeInTheDocument();
});

test('con todos los pesos en cero hay mensaje y no hay tabla', async () => {
  setup({ mode: 'n', weights: { liga_corta: 0, liga_anual: 0, copa_nacional: 0, tier_b: 0, tier_a: 0, mundo: 0 } });
  expect(screen.getByText('Con todo en cero no hay ranking')).toBeInTheDocument();
  expect(screen.queryAllByTestId('fila')).toHaveLength(0);
  await userEvent.click(screen.getByRole('button', { name: 'Volver a la calculadora' }));
  expect(useStore.getState().step).toBe('nerd');
});

test('"Quiero más control" solo aparece en modo canchero', () => {
  const { unmount } = setup();
  expect(screen.getByRole('button', { name: 'Quiero más control' })).toBeInTheDocument();
  unmount();
  setup({ mode: 'n' });
  expect(screen.queryByRole('button', { name: 'Quiero más control' })).toBeNull();
});

test('durante la carrera no se ve el ranking', () => {
  setup({ step: 'carrera' });
  expect(screen.queryAllByTestId('fila')).toHaveLength(0);
  expect(screen.getByRole('button', { name: 'Saltar' })).toBeInTheDocument();
});

test('durante la carrera hay una tabla en vivo con quien ya sumó', () => {
  setup({ step: 'carrera' });
  const vivo = screen.getAllByTestId('vivo');
  expect(vivo).toHaveLength(1);
  expect(vivo[0]).toHaveTextContent('Zeta');
  expect(vivo[0]).toHaveTextContent('2');
  fireEvent.click(screen.getByRole('button', { name: 'Saltar' }));
  expect(screen.queryAllByTestId('vivo')).toHaveLength(0);
  expect(rows()[0]).toEqual(['beta', '14']);
});

test('sin amateurismo el slider arranca en el primer año profesional y vuelve al prender', async () => {
  setup();
  const desde = () => screen.getByLabelText('Desde') as HTMLInputElement;
  await userEvent.click(screen.getByLabelText('Contar el amateurismo'));
  expect(desde().min).toBe('1950');
  expect(desde().value).toBe('1950');
  expect(useStore.getState().filters.from).toBe(1950);
  await userEvent.click(screen.getByLabelText('Contar el amateurismo'));
  expect(desde().min).toBe('1920');
  expect(desde().value).toBe('1920');
});

test('un link sin amateurismo con años amateurs se recorta al abrir', () => {
  setup({ filters: { includeAmateur: false, from: 1920, to: 2015 } });
  expect(useStore.getState().filters.from).toBe(1950);
});

test('las copas que no suman se llaman copas secundarias', () => {
  setup();
  const filas = screen.getAllByTestId('fila');
  expect(filas[0]).toHaveTextContent('0 copas secundarias');
  expect(filas[1]).toHaveTextContent('1 copa secundaria');
  expect(screen.queryByText(/vitrina/i)).toBeNull();
});

test('la tabla avisa que cada club se abre y cada fila lleva su flecha', () => {
  setup();
  expect(screen.getByText('Tocá un club para ver sus títulos')).toBeInTheDocument();
  expect(document.querySelectorAll('[data-testid="fila"] [data-chevron]')).toHaveLength(3);
});

test('las líneas destacadas llevan el color de su club y la tabla lo repite', () => {
  setup();
  const linea = document.querySelector('path[data-club="beta"]') as SVGPathElement;
  const muestra = document.querySelector('[data-testid="fila"][data-club="beta"] [data-swatch]') as HTMLElement;
  expect(linea.style.stroke).not.toBe('');
  expect(muestra.style.background).toBe(linea.style.stroke);
});

test('un rango sin títulos avisa sin esconder los filtros', () => {
  setup({ filters: { includeAmateur: true, from: 1921, to: 1949 } });
  expect(screen.getByText('Nadie suma puntos acá')).toBeInTheDocument();
  expect(screen.queryByText('Con todo en cero no hay ranking')).toBeNull();
  fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2015' } });
  expect(rows().length).toBeGreaterThan(0);
});

test('la dirección se actualiza una sola vez aunque el rango cambie muchas veces', () => {
  vi.useFakeTimers();
  try {
    setup();
    vi.advanceTimersByTime(1000);
    const replace = vi.spyOn(window.history, 'replaceState');
    for (const year of [1930, 1940, 1950, 1960, 2000]) fireEvent.change(screen.getByLabelText('Desde'), { target: { value: String(year) } });
    expect(replace).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(replace).toHaveBeenCalledTimes(1);
    expect(String(replace.mock.calls[0][2])).toContain('d=2000-2015');
    replace.mockRestore();
  } finally {
    vi.useRealTimers();
  }
});

test('con los dos extremos a la derecha, Desde queda arriba para poder moverlo', () => {
  setup({ filters: { includeAmateur: true, from: 2015, to: 2015 } });
  expect(Number((screen.getByLabelText('Desde') as HTMLInputElement).style.zIndex)).toBeGreaterThan(
    Number((screen.getByLabelText('Hasta') as HTMLInputElement).style.zIndex),
  );
});

describe('amateurismo: ida y vuelta año a año', () => {
  const check = () => screen.getByLabelText('Contar el amateurismo');
  const range = () => {
    const { from, to } = useStore.getState().filters;
    return [from, to];
  };

  // Fixture: datos de 1920 a 2015; el profesionalismo arranca en 1950.
  test.each(
    Array.from({ length: 2015 - 1920 + 1 }, (_, i) => 1920 + i).flatMap((from) => [
      [from, 2015],
      [from, from],
      [from, Math.min(2015, from + 7)],
    ]),
  )('destildar y volver a tildar deja el rango %i a %i como estaba', async (from, to) => {
    setup({ filters: { includeAmateur: true, from, to } });
    await userEvent.click(check());
    expect(range()).toEqual([Math.max(from, 1950), to < 1950 ? 2015 : to]);
    await userEvent.click(check());
    expect(range()).toEqual([from, to]);
  });

  test('si se movió el slider sin amateurismo, al tildar se respeta lo movido', async () => {
    setup({ filters: { includeAmateur: true, from: 1930, to: 1940 } });
    await userEvent.click(check());
    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '1950' } });
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '1980' } });
    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '1960' } });
    await userEvent.click(check());
    expect(range()).toEqual([1960, 1980]);
  });

  test('un link sin amateurismo que arranca en el piso se estira al tildar', async () => {
    setup({ filters: { includeAmateur: false, from: 1950, to: 2015 } });
    await userEvent.click(check());
    expect(range()).toEqual([1920, 2015]);
  });
});

test('el extremo arrastrado sigue al dedo y empuja al otro', () => {
  setup({ filters: { includeAmateur: true, from: 1970, to: 1970 } });
  fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '1960' } });
  expect(useStore.getState().filters).toMatchObject({ from: 1960, to: 1960 });
  fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '1955' } });
  expect(useStore.getState().filters).toMatchObject({ from: 1955, to: 1955 });
  fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '1980' } });
  expect(useStore.getState().filters).toMatchObject({ from: 1955, to: 1980 });
  fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '1990' } });
  expect(useStore.getState().filters).toMatchObject({ from: 1990, to: 1990 });
});

test('si el rango queda vacío el slider sigue siendo el mismo: no se corta el arrastre', () => {
  setup({ filters: { includeAmateur: true, from: 1920, to: 1949 } });
  const hasta = screen.getByLabelText('Hasta');
  fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '1921' } });
  expect(screen.getByText('Nadie suma puntos acá')).toBeInTheDocument();
  expect(screen.getByLabelText('Hasta')).toBe(hasta);
  fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '1920' } });
  expect(screen.getByLabelText('Hasta')).toBe(hasta);
  expect(rows().length).toBeGreaterThan(0);
});

test('un link sin amateurismo con el rango entero amateur se abre hasta hoy', () => {
  setup({ filters: { includeAmateur: false, from: 1920, to: 1940 } });
  expect(useStore.getState().filters).toMatchObject({ from: 1950, to: 2015 });
});

describe('elegir clubes para comparar', () => {
  const badges = (c: HTMLElement) => [...c.querySelectorAll('g[data-badge]')].map((g) => g.getAttribute('data-badge'));
  const row = (id: string) => within(screen.getAllByTestId('fila').find((r) => r.dataset.club === id)!).getByRole('button');
  const compare = () => userEvent.click(screen.getByRole('button', { name: 'Elegir clubes para comparar' }));

  test('por defecto van los primeros y tocar una fila abre el detalle', async () => {
    const { container } = setup();
    expect(badges(container)).toEqual(['beta', 'zeta', 'alfa']);
    await userEvent.click(row('alfa'));
    expect(row('alfa')).toHaveAttribute('aria-expanded', 'true');
    expect(useStore.getState().selected).toBeNull();
  });

  test('en modo comparar, tocar una fila la saca o la pone en el gráfico', async () => {
    const { container } = setup();
    await compare();
    expect(screen.getByText('Tocá los clubes que querés comparar: 3 de 8')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Listo' })).toBeInTheDocument();
    expect(row('zeta')).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(row('zeta'));
    expect(row('zeta')).toHaveAttribute('aria-pressed', 'false');
    expect(badges(container)).toEqual(['beta', 'alfa']);
    expect(container.querySelector('path[data-club="zeta"]')).toHaveClass('race-line-dim');
    expect(within(row('zeta')).queryByText('', { selector: '[data-swatch]' })).toBeNull();
    await userEvent.click(row('zeta'));
    expect(badges(container)).toEqual(['beta', 'zeta', 'alfa']);
    await userEvent.click(screen.getByRole('button', { name: 'Listo' }));
    expect(screen.getByText('Comparando 3 clubes. Tocá uno para ver sus títulos')).toBeInTheDocument();
    expect(row('zeta')).toHaveAttribute('aria-expanded', 'false');
  });

  test('siempre queda al menos un club', async () => {
    setup({ selected: ['alfa'] });
    await compare();
    expect(screen.getByText('Tiene que quedar al menos uno. Tocá otros clubes para sumarlos')).toBeInTheDocument();
    expect(row('alfa')).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(row('alfa'));
    expect(useStore.getState().selected).toEqual(['alfa']);
  });

  test('volver a los primeros borra la selección', async () => {
    const { container } = setup({ selected: ['alfa'] });
    expect(badges(container)).toEqual(['alfa']);
    await userEvent.click(screen.getByRole('button', { name: 'Volver a los primeros' }));
    expect(useStore.getState().selected).toBeNull();
    expect(badges(container)).toEqual(['beta', 'zeta', 'alfa']);
  });

  test('un elegido que no suma en el rango no se dibuja ni se reemplaza, y vuelve al ampliar', () => {
    const { container } = setup({ selected: ['alfa', 'beta'] });
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '1980' } });
    expect(badges(container)).toEqual(['beta']);
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '1960' } });
    expect(badges(container)).toEqual([]);
    expect(screen.getByText('Ninguno de los clubes elegidos suma puntos en estos años')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2015' } });
    expect(badges(container)).toEqual(['beta', 'alfa']);
  });

  test('la selección viaja en el link con el código corto', async () => {
    vi.useFakeTimers();
    try {
      setup({ selected: ['alfa', 'zeta'] });
      vi.advanceTimersByTime(300);
      expect(window.location.search).toMatch(/&e=ALF\.ZET$/);
    } finally {
      vi.useRealTimers();
    }
  });

  test('en la carrera, la tabla en vivo muestra solo a los elegidos', () => {
    setup({ step: 'carrera', selected: ['alfa'] });
    // Zeta ya suma en el primer año, pero no está elegido.
    expect(screen.queryAllByTestId('vivo')).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Saltar' }));
    expect(useStore.getState().step).toBe('resultado');
  });

  test('en la carrera aparece el elegido cuando suma', () => {
    setup({ step: 'carrera', selected: ['zeta'] });
    expect(screen.getAllByTestId('vivo').map((li) => li.textContent)).toEqual([expect.stringContaining('Zeta')]);
  });

  test('si ningún elegido suma, la carrera se corre con los primeros', () => {
    const { container } = setup({ step: 'carrera', selected: ['alfa'], filters: { includeAmateur: true, from: 1920, to: 1980 } });
    expect(screen.getAllByTestId('vivo').length).toBeGreaterThan(0);
    expect(badges(container)).toEqual(['zeta', 'beta']);
    expect(useStore.getState().selected).toEqual(['alfa']);
  });

  test('tocar otra fila no pierde a los elegidos que hoy no suman', async () => {
    const { container } = setup({ selected: ['alfa', 'beta'] });
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '1980' } });
    await compare();
    await userEvent.click(row('zeta'));
    expect(useStore.getState().selected).toEqual(['alfa', 'beta', 'zeta']);
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2015' } });
    expect(badges(container)).toEqual(['beta', 'zeta', 'alfa']);
  });

  test('con ocho elegidos avisa que hay que sacar uno', async () => {
    setup({ selected: ['alfa', 'beta', 'x1', 'x2', 'x3', 'x4', 'x5', 'x6'] });
    await compare();
    expect(screen.getByText('Ya hay 8 elegidos: sacá uno para sumar otro')).toBeInTheDocument();
    expect(row('zeta')).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(row('zeta'));
    expect(useStore.getState().selected).not.toContain('zeta');
  });
});
