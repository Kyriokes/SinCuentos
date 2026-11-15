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
