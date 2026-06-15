/**
 * Popup entry point
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { Popup } from './components/Popup';
import '../styles/popup.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <Popup />
    </React.StrictMode>
  );
}
