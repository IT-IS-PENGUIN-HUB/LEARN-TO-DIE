import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import './styles/global.css';
import App from './App.jsx';
import { initAppUpdate } from './services/appUpdate.js';

// Service worker: tải bản mới về nhưng CHỜ lúc an toàn mới áp dụng (App quyết định)
initAppUpdate();

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
