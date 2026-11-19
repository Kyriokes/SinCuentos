import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useStore } from '../state/store';
import { App } from './App';

beforeEach(() => {
  window.scrollTo = () => {};
  useStore.getState().reset();
});

test('el inicio no muestra la barra', () => {
  render(<App />);
  expect(screen.queryByRole('button', { name: /volver al inicio/ })).toBeNull();
});

test.each(['canchero', 'nerd', 'calculo', 'carrera', 'resultado'] as const)('desde %s se puede volver al inicio sin bajar', async (step) => {
  useStore.setState({ step });
  render(<App />);
  await userEvent.click(screen.getByRole('button', { name: /volver al inicio/ }));
  expect(useStore.getState().step).toBe('inicio');
  expect(screen.getByRole('heading', { level: 1, name: 'Sin cuentos' })).toBeInTheDocument();
});

test('si una pantalla se rompe, se ofrece volver al inicio en vez de dejar la página vacía', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  // Un estado imposible: pesos que no son números hacen fallar el cálculo de la pantalla Nerd.
  useStore.setState({ step: 'nerd', weights: null as never });
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Algo se rompió' })).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Volver al inicio' }));
  expect(useStore.getState().step).toBe('inicio');
  expect(screen.getByRole('heading', { level: 1, name: 'Sin cuentos' })).toBeInTheDocument();
  error.mockRestore();
});

test('cada pantalla tiene su título de pestaña', () => {
  useStore.setState({ step: 'nerd' });
  render(<App />);
  expect(document.title).toBe('Modo nerd · Sin Cuentos');
});
