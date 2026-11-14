import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useStore } from '../../state/store';
import { Canchero } from './Canchero';

const options = () => within(screen.getByRole('group', { name: 'Opciones' })).getAllByRole('button');

test('tres preguntas, una por vez, y después calcular', async () => {
  useStore.getState().reset();
  useStore.getState().start('c');
  const user = userEvent.setup();
  render(<Canchero />);

  expect(screen.getByRole('heading')).toHaveTextContent(/Sudamericana/);
  expect(options()).toHaveLength(4);
  expect(screen.queryByRole('button', { name: 'Calcular' })).toBeNull();
  await user.click(options()[3]);

  expect(screen.getByRole('heading')).toHaveTextContent(/Libertadores/);
  expect(options()).toHaveLength(3);
  await user.click(options()[2]);

  expect(screen.getByRole('heading')).toHaveTextContent(/mundo/);
  expect(options()).toHaveLength(3);
  await user.click(options()[2]);

  expect(useStore.getState().weights).toMatchObject({ tier_b: 6, tier_a: 18, mundo: 54 });
  await user.click(screen.getByRole('button', { name: 'Calcular' }));
  expect(useStore.getState().step).toBe('calculo');
});
