import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SidePanel } from '../components/side-panel';
import { ThemeProvider } from '../contexts/theme-context';
import { backupPasswordService } from '../services/backup-service';
import '../styles/tailwind.css';

// Initialize auto backup when the extension loads
backupPasswordService.autoBackup();

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(
  <StrictMode>
    <ThemeProvider>
      <SidePanel />
    </ThemeProvider>
  </StrictMode>
);
