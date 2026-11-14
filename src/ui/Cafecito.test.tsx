import { render, screen } from '@testing-library/react';
import { useStore } from '../state/store';
import { Cafecito } from './Cafecito';
import { Inicio } from './screens/Inicio';
import { Resultado } from './screens/Resultado';

test('el cafecito abre Ko-fi en otra pestaña', () => {
  render(<Cafecito />);
  const link = screen.getByRole('link', { name: 'Invitame un cafecito' });
  expect(link).toHaveAttribute('href', 'https://ko-fi.com/R5R21UFJBX');
  expect(link).toHaveAttribute('target', '_blank');
  expect(link).toHaveAttribute('rel', 'noreferrer');
});

test('está en el inicio', () => {
  render(<Inicio />);
  expect(screen.getByRole('link', { name: 'Invitame un cafecito' })).toBeInTheDocument();
});

test('está en el resultado, pero no durante la carrera', () => {
  useStore.getState().reset();
  useStore.setState({ step: 'carrera' });
  const { unmount } = render(<Resultado />);
  expect(screen.queryByRole('link', { name: 'Invitame un cafecito' })).toBeNull();
  unmount();
  useStore.setState({ step: 'resultado' });
  render(<Resultado />);
  expect(screen.getByRole('link', { name: 'Invitame un cafecito' })).toBeInTheDocument();
});
