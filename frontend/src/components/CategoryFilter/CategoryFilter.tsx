import React from 'react';
import type { Categoria } from '../../types/categoria';
import styles from './CategoryFilter.module.scss';

interface CategoryFilterProps {
  categorias: Categoria[];
  selectedCategoriaId: number | null;
  onSelectCategoria: (id: number | null) => void;
  disabled?: boolean;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categorias,
  selectedCategoriaId,
  onSelectCategoria,
  disabled = false,
}) => {
  return (
    <nav className={styles.filterContainer} aria-label="Filtro de categorías">
      <span className={styles.label}>Filtrar por categoría:</span>
      <div className={styles.bar} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={selectedCategoriaId === null}
          className={`${styles.filterBtn} ${selectedCategoriaId === null ? styles.active : ''}`}
          onClick={() => onSelectCategoria(null)}
          disabled={disabled}
        >
          Todos los productos
        </button>

        {categorias.map((cat) => (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={selectedCategoriaId === cat.id}
            className={`${styles.filterBtn} ${selectedCategoriaId === cat.id ? styles.active : ''}`}
            onClick={() => onSelectCategoria(cat.id)}
            disabled={disabled}
          >
            {cat.nombre}
          </button>
        ))}
      </div>
    </nav>
  );
};
