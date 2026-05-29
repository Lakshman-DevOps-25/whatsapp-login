import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import theme from './theme/theme';

// ── Facebook SDK initialisation ─────────────────────────────────────────────
// import.meta.env works here (Vite processes this file).
// %VITE_*% placeholders in index.html are NOT replaced by Vite — never use them.
const META_APP_ID = import.meta.env.VITE_META_APP_ID || '';

function initFacebook() {
  if (!META_APP_ID) {
    console.warn('VITE_META_APP_ID is not set — Facebook login will not work.');
    return;
  }

  if (window.__fbSdkLoaded) {
    // SDK script already loaded before main.jsx ran — init immediately
    window.FB.init({ appId: META_APP_ID, cookie: true, xfbml: true, version: 'v22.0' });
    window.__fbReady = true;
    if (typeof window.__fbReadyCallback === 'function') window.__fbReadyCallback();
  } else {
    // SDK not loaded yet — hook into the callback set in index.html
    window.__fbSdkLoadedCallback = () => {
      window.FB.init({ appId: META_APP_ID, cookie: true, xfbml: true, version: 'v22.0' });
      window.__fbReady = true;
      if (typeof window.__fbReadyCallback === 'function') window.__fbReadyCallback();
    };
  }
}

initFacebook();

// ── Render React app ────────────────────────────────────────────────────────
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
