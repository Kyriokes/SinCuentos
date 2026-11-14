import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useStore } from '../../state/store';
import { Nerd } from './Nerd';

test('seis campos con los valores actuales, torneos a la vista y calcular', async () => {
  useStore.getState().reset();
  useStore.getState().start('n');
  render(<Nerd />);

  const fields = screen.getAllByRole('spinbutton') as HTMLInputElement[];
  expect(fields.map((f) => f.value)).toEqual(['1', '2', '1', '2', '4', '8']);
  expect(screen.getByText(/Copa CONMEBOL/)).toBeInTheDocument();
  expect(screen.getByText(/Copa de la Liga Profesional/)).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText('Campeón del mundo'), { target: { value: '20' } });
  expect(useStore.getState().weights.mundo).toBe(20);

  await userEvent.click(screen.getByRole('button', { name: 'Calcular' }));
  expect(useStore.getState().step).toBe('calculo');
});
