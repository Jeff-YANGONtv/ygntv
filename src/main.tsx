import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './lib/auth';
import './styles.css';
import './styles/about.css';

window.addEventListener('vite:preloadError', () => {
  const recoveryKey = 'yangon-tv-chunk-recovery';
  if (window.sessionStorage.getItem(recoveryKey) === '1') return;
  window.sessionStorage.setItem(recoveryKey, '1');
  window.location.reload();
});

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><AuthProvider><App /></AuthProvider></React.StrictMode>);
