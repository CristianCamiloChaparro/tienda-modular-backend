import React from 'react';
import styles from './ErrorState.module.scss';

interface ErrorStateProps {
  message?: string;
  onRetry: () => void;
  retrying?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  onRetry,
  retrying = false,
}) => {
  return (
    <div className={styles.container} role="alert">
      <div className={styles.card}>
        <div className={styles.iconWrapper} aria-hidden="true">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h2 className={styles.title}>No pudimos cargar la tienda</h2>

        <p className={styles.description}>
          El servidor está iniciando o no responde en este momento. Si la tienda llevaba un rato sin
          visitas, el servidor tarda alrededor de un minuto en encenderse: intenta de nuevo en un momento.
        </p>

        {message && (
          <div className={styles.codeBlock}>
            {message}
          </div>
        )}

        <button
          type="button"
          className={styles.retryBtn}
          onClick={onRetry}
          disabled={retrying}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 21h5v-5" />
          </svg>
          {retrying ? 'Reintentando...' : 'Reintentar conexión'}
        </button>
      </div>
    </div>
  );
};
