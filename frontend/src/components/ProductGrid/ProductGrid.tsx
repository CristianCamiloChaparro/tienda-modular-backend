import React from 'react';
import type { Producto } from '../../types/producto';
import { ProductCard } from '../ProductCard/ProductCard';
import styles from './ProductGrid.module.scss';

interface ProductGridProps {
  productos: Producto[];
  onAgregar?: (producto: Producto) => Promise<void> | void;
  /** Controles opcionales a la derecha del contador (búsqueda y orden). */
  herramientas?: React.ReactNode;
  /** Mensaje cuando la búsqueda no deja resultados. */
  sinResultados?: React.ReactNode;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ productos, onAgregar, herramientas, sinResultados }) => {
  return (
    <section className={styles.section} aria-label="Listado de productos">
      <div className={styles.metaBar}>
        <span className={styles.count}>
          Mostrando <strong>{productos.length}</strong> {productos.length === 1 ? 'producto' : 'productos'}
        </span>
        {herramientas}
      </div>

      {productos.length === 0 && sinResultados ? (
        sinResultados
      ) : (
        <div className={styles.grid}>
          {productos.map((producto) => (
            <ProductCard key={producto.id} producto={producto} onAgregar={onAgregar} />
          ))}
        </div>
      )}
    </section>
  );
};
