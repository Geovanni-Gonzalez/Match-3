/**
 * @file index.tsx
 * @description Punto de entrada principal de la aplicación React.
 * 
 * Configura el renderizado de la aplicación y envuelve el componente raíz
 * con los proveedores de contexto necesarios (AuthProvider).
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';

import { BrowserRouter } from 'react-router-dom';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
