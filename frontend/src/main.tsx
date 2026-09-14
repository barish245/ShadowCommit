import { Buffer } from 'buffer';

// Polyfill Node Buffer and global in browser environment for Midnight SDK
globalThis.Buffer = Buffer;
if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
  (window as any).global = window;
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

