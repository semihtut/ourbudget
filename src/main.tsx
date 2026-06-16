import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import { ensureSeeded } from './db/db';
import './styles/index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found');

// Mount immediately so the shell paints even if local storage is slow; the app
// shows its loading state until the first-run seed (settings + categories)
// completes and the live queries re-fire. Seeding is fire-and-forget here.
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

void ensureSeeded().catch((error) => {
  console.error('Startup seeding failed', error);
});
