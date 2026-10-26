import React, { useState } from 'react';
import type { Producto } from '../../types/producto';
import styles from './ProductCard.module.scss';

interface ProductCardProps {
  producto: Producto;
  /** Si se recibe, la tarjeta muestra el botón "Agregar al carrito". */
  onAgregar?: (producto: Producto) => Promise<void> | void;
}

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
});

export const ProductCard: React.FC<ProductCardProps> = ({ producto, onAgregar }) => {
  const [imageError, setImageError] = useState(false);
  const [agregando, setAgregando] = useState(false);

  const handleAgregar = async () => {
    if (!onAgregar) {
      return;
    }
    setAgregando(true);
    try {
      await onAgregar(producto);
    } finally {
      setAgregando(false);
    }
  };

  const getStockBadge = (stock: number) => {
    if (stock <= 0) {
      return {
        label: 'Agotado',
        className: styles.outOfStock,
      };
    }
    if (stock <= 10) {
      return {
        label: `Pocas unidades (${stock})`,
        className: styles.lowStock,
      };
    }
    return {
      label: `En stock (${stock})`,
      className: styles.inStock,
    };
  };

  const stockBadge = getStockBadge(producto.stock);
  const formattedPrice = copFormatter.format(producto.precio);
  const showImage = Boolean(producto.imagenUrl && !imageError);

  return (
    <article className={styles.card}>
      <div className={styles.imageWrapper}>
        <span className={styles.categoryBadge}>{producto.categoriaNombre}</span>

        {showImage ? (
          <img
            src={producto.imagenUrl!}
            alt={producto.nombre}
            className={styles.image}
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className={styles.imageFallback} aria-label="Sin imagen disponible">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
            <span>Sin imagen disponible</span>
          </div>
        )}
      </div>

      <div className={styles.content}>
        <h3 className={styles.title} title={producto.nombre}>
          {producto.nombre}
        </h3>
        <p className={styles.description} title={producto.descripcion}>
          {producto.descripcion}
        </p>

        <div className={styles.footer}>
          <div className={styles.priceWrapper}>
            <span className={styles.priceLabel}>Precio</span>
            <span className={styles.price}>{formattedPrice}</span>
          </div>

          <span
            className={`${styles.stockBadge} ${stockBadge.className}`}
            role="status"
          >
            {stockBadge.label}
          </span>
        </div>

        {onAgregar && (
          <button
            type="button"
            className={`btn btn-primary btn-block ${styles.addBtn}`}
            onClick={handleAgregar}
            disabled={agregando || producto.stock <= 0}
          >
            {producto.stock <= 0 ? 'No disponible' : agregando ? 'Agregando...' : 'Agregar al carrito'}
          </button>
        )}
      </div>
    </article>
  );
};
