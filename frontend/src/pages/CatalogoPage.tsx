import React, { useEffect, useState } from 'react';
import type { Categoria } from '../types/categoria';
import type { Producto } from '../types/producto';
import { getCategorias, getProductos } from '../services/api';
import { CategoryFilter } from '../components/CategoryFilter/CategoryFilter';
import { ProductGrid } from '../components/ProductGrid/ProductGrid';
import { LoadingState } from '../components/LoadingState/LoadingState';
import { ErrorState } from '../components/ErrorState/ErrorState';
import { EmptyState } from '../components/EmptyState/EmptyState';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { mensajeDeError } from '../utils/formato';
import styles from './CatalogoPage.module.scss';

export const CatalogoPage: React.FC = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<number | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<boolean>(false);
  const { agregar } = useCart();
  const { notificar } = useToast();

  // Initial load
  useEffect(() => {
    let active = true;

    const fetchInitial = async () => {
      try {
        const [cats, prods] = await Promise.all([getCategorias(), getProductos(null)]);
        if (active) {
          setCategorias(cats);
          setProductos(prods);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (active) {
          setError(mensajeDeError(err, 'Error desconocido al conectar con la API'));
          setLoading(false);
        }
      }
    };

    fetchInitial();

    return () => {
      active = false;
    };
  }, []);

  // Handle retry action
  const handleRetry = async () => {
    setRetrying(true);
    setLoading(true);
    setError(null);

    try {
      const [cats, prods] = await Promise.all([getCategorias(), getProductos(selectedCategoriaId)]);
      setCategorias(cats);
      setProductos(prods);
    } catch (err: unknown) {
      setError(mensajeDeError(err, 'Error desconocido al conectar con la API'));
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  // Handle category change without page reload
  const handleSelectCategoria = async (id: number | null) => {
    setSelectedCategoriaId(id);
    setLoading(true);
    setError(null);

    try {
      setProductos(await getProductos(id));
    } catch (err: unknown) {
      setError(mensajeDeError(err, 'Error al filtrar productos'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilter = () => {
    handleSelectCategoria(null);
  };

  const handleAgregar = async (producto: Producto) => {
    try {
      await agregar(producto.id, 1);
      notificar(`"${producto.nombre}" se agregó al carrito`);
    } catch (err) {
      notificar(mensajeDeError(err, 'No se pudo agregar al carrito'), 'error');
    }
  };

  const selectedCategory = categorias.find((c) => c.id === selectedCategoriaId);

  return (
    <div className="container">
      <section className={styles.hero}>
        <div>
          <p className={styles.kicker}>Colección permanente</p>
          <h1 className={styles.heroTitle}>
            Básicos bien hechos, <em>para todos los días.</em>
          </h1>
        </div>
        <div className={styles.heroAside}>
          <p className={styles.heroDescription}>
            Ropa, accesorios y objetos para la casa. Elige por categoría, arma tu pedido y paga en línea con tarjeta.
          </p>
          <ul className={styles.heroFacts}>
            <li>Inventario actualizado al instante</li>
            <li>Pago seguro con tarjeta</li>
          </ul>
        </div>
      </section>

      {/* Category filter bar */}
      {categorias.length > 0 && !error && (
        <CategoryFilter
          categorias={categorias}
          selectedCategoriaId={selectedCategoriaId}
          onSelectCategoria={handleSelectCategoria}
          disabled={loading}
        />
      )}

      {/* Conditional Visual States */}
      {error ? (
        <ErrorState message={error} onRetry={handleRetry} retrying={retrying} />
      ) : loading ? (
        <LoadingState count={6} />
      ) : productos.length === 0 ? (
        <EmptyState categoryName={selectedCategory?.nombre} onResetFilter={handleResetFilter} />
      ) : (
        <ProductGrid productos={productos} onAgregar={handleAgregar} />
      )}
    </div>
  );
};
