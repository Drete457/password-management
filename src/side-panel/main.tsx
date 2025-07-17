import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SidePanel } from '../components/side-panel';
import '../styles/tailwind.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(
  <StrictMode>
    <SidePanel />
  </StrictMode>
);
