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
