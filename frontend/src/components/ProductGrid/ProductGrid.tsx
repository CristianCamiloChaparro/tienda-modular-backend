import React from 'react';
import type { Producto } from '../../types/producto';
import { ProductCard } from '../ProductCard/ProductCard';
import styles from './ProductGrid.module.scss';

interface ProductGridProps {
  productos: Producto[];
  onAgregar?: (producto: Producto) => Promise<void> | void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ productos, onAgregar }) => {
  return (
    <section className={styles.section} aria-label="Listado de productos">
      <div className={styles.metaBar}>
        <span className={styles.count}>
          Mostrando <strong>{productos.length}</strong> {productos.length === 1 ? 'producto' : 'productos'}
        </span>
      </div>

      <div className={styles.grid}>
        {productos.map((producto) => (
          <ProductCard key={producto.id} producto={producto} onAgregar={onAgregar} />
        ))}
      </div>
    </section>
  );
};
