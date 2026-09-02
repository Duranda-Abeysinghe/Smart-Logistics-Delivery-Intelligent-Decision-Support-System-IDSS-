import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Entry point of the application - mounts the root <App /> component
// into the #root div defined in index.html.
// StrictMode enables extra dev-time checks (e.g. detecting unsafe
// lifecycles, double-invoking effects to surface side-effect bugs)
// and has no effect in production builds.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
