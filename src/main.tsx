import '@fontsource/big-shoulders-display/900';
import '@fontsource/archivo/400.css';
import '@fontsource/archivo/600.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/app.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { useStore } from './state/store';
import { App } from './ui/App';

useStore.getState().loadFromUrl(window.location.search);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
