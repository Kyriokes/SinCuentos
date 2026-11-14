import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useStore } from '../../state/store';
import { mockReducedMotion } from '../../test-setup';
import { Calculo } from './Calculo';

beforeEach(() => {
  useStore.getState().reset();
  useStore.getState().go('calculo');
});

test('con movimiento reducido muestra los seis valores y pasa a la carrera', () => {
  mockReducedMotion(true);
  useStore.getState().setWeight('mundo', 54);
  render(<Calculo />);
  expect(screen.getAllByRole('listitem')).toHaveLength(6);
  expect(screen.getByText('54')).toBeInTheDocument();
  expect(useStore.getState().step).toBe('carrera');
});

test('un toque saltea la animación', async () => {
  render(<Calculo />);
  expect(useStore.getState().step).toBe('calculo');
  await userEvent.click(screen.getByRole('button', { name: 'Saltar' }));
  expect(useStore.getState().step).toBe('carrera');
});
