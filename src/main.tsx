import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {ErrorBoundary} from './ErrorBoundary.tsx';
import './index.css';

const ROOT_ID = 'root';

function mount() {
  let el = document.getElementById(ROOT_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = ROOT_ID;
    document.body.appendChild(el);
  }
  el.style.width = '100%';
  el.style.maxWidth = '100%';
  el.style.minHeight = 'clamp(36rem, 100dvh, 2200px)';
  el.style.boxSizing = 'border-box';

  try {
    createRoot(el).render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    el.innerHTML = `<div style="padding:16px;font-family:monospace;color:#fecaca;background:#1a0505;border:1px solid #f87171;">AC_OS 脚本未能启动：${msg}</div>`;
    console.error('[AC_OS] createRoot failed', e);
  }
}

mount();
