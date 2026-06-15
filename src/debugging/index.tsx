/**
 * Debugging page entry point
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { DebuggingPage } from './components/DebuggingPage';
import '../styles/debugging.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <DebuggingPage />
    </React.StrictMode>
  );
}
