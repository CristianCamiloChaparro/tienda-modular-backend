import React from 'react';
import styles from './EmptyState.module.scss';

interface EmptyStateProps {
  categoryName?: string;
  onResetFilter: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  categoryName,
  onResetFilter,
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconWrapper} aria-hidden="true">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
            <path d="M8 11h6" />
          </svg>
        </div>

        <h2 className={styles.title}>No se encontraron productos</h2>

        <p className={styles.description}>
          {categoryName ? (
            <>
              No hay productos disponibles actualmente en la categoría{' '}
              <strong>"{categoryName}"</strong>.
            </>
          ) : (
            'No hay productos disponibles en el catálogo en este momento.'
          )}
        </p>

        <button
          type="button"
          className={styles.resetBtn}
          onClick={onResetFilter}
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
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Ver todos los productos
        </button>
      </div>
    </div>
  );
};
