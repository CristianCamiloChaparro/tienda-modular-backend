import React from 'react';
import styles from './LoadingState.module.scss';

interface LoadingStateProps {
  count?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ count = 6 }) => {
  const items = Array.from({ length: count }, (_, index) => index);

  return (
    <div aria-busy="true" aria-label="Cargando productos...">
      <div className={styles.loadingMessage}>
        <div className={styles.spinner} aria-hidden="true" />
        <span>Cargando catálogo de productos...</span>
      </div>

      <div className={styles.grid}>
        {items.map((key) => (
          <div key={key} className={styles.skeletonCard}>
            <div className={styles.imageSkeleton} />
            <div className={styles.contentSkeleton}>
              <div className={styles.pillSkeleton} />
              <div className={styles.titleSkeleton} />
              <div className={styles.descSkeleton} />
              <div className={`${styles.descSkeleton} ${styles.short}`} />
              <div className={styles.footerSkeleton}>
                <div className={styles.priceSkeleton} />
                <div className={styles.badgeSkeleton} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
