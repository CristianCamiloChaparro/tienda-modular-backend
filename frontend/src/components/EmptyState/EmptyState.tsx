import React from 'react';

interface EmptyStateProps {
  categoryName?: string;
  onResetFilter: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ categoryName, onResetFilter }) => {
  return (
    <div className="vacio">
      <span className="vacio-marca">Catálogo</span>
      <h2 className="vacio-titulo">No se encontraron productos</h2>

      <p className="vacio-texto">
        {categoryName ? (
          <>
            No hay productos disponibles actualmente en la categoría <strong>"{categoryName}"</strong>.
          </>
        ) : (
          'No hay productos disponibles en el catálogo en este momento.'
        )}
      </p>

      <button type="button" className="btn btn-primary" onClick={onResetFilter}>
        Ver todos los productos
      </button>
    </div>
  );
};
