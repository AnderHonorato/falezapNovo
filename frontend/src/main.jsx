// frontend/src/main.jsx

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css' // Importa Tailwind e estilos globais MD3
import App from './App.jsx'
import { Toaster } from 'react-hot-toast'

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <App />

    {/* Toast Configurado com Material Design 3 */}
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        className: '',
        duration: 5000,
        style: {
          background: 'var(--md-sys-color-surface-container)',
          color: 'var(--md-sys-color-on-surface)',
          borderRadius: '16px',
          fontSize: '14px',
          padding: '12px 16px',
          border: '1px solid var(--md-sys-color-outline-variant)',
          boxShadow: 'var(--shadow-elevation-2)',
        },

        success: {
          duration: 3000,
          style: {
            background: 'var(--md-sys-color-secondary-container)',
            color: 'var(--md-sys-color-on-secondary-container)',
            borderRadius: '16px',
            border: '1px solid var(--md-sys-color-secondary)',
          },
          iconTheme: {
            primary: 'var(--md-sys-color-secondary)',
            secondary: 'var(--md-sys-color-on-secondary-container)',
          },
        },

        error: {
          duration: 5000,
          style: {
            background: 'var(--md-sys-color-error-container)',
            color: 'var(--md-sys-color-on-error-container)',
            borderRadius: '16px',
            border: '1px solid var(--md-sys-color-error)',
          },
          iconTheme: {
            primary: 'var(--md-sys-color-error)',
            secondary: 'var(--md-sys-color-on-error-container)',
          },
        },

        loading: {
          style: {
            background: 'var(--md-sys-color-primary-container)',
            color: 'var(--md-sys-color-on-primary-container)',
            borderRadius: '16px',
            border: '1px solid var(--md-sys-color-primary)',
          },
        },
      }}
    />
  </StrictMode>,
)