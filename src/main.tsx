import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerPWA } from './lib/pwa-service';
import { initInstallPrompt } from './lib/install';

// Tangkap event pemasangan PWA sedini mungkin & daftarkan Service Worker (Web Push)
initInstallPrompt();
registerPWA();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
