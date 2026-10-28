import React, { useEffect, useMemo, useState } from 'react';
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

type Orden = 'recientes' | 'precio-asc' | 'precio-desc' | 'nombre';

const ORDENES: { valor: Orden; etiqueta: string }[] = [
  { valor: 'recientes', etiqueta: 'Destacados' },
  { valor: 'precio-asc', etiqueta: 'Precio: menor a mayor' },
  { valor: 'precio-desc', etiqueta: 'Precio: mayor a menor' },
  { valor: 'nombre', etiqueta: 'Nombre (A-Z)' },
];

/** Compara sin tildes ni mayúsculas: "ceramica" encuentra "Cerámica". */
const normalizar = (texto: string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export const CatalogoPage: React.FC = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<number | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<boolean>(false);
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState<Orden>('recientes');
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

  const visibles = useMemo(() => {
    const termino = normalizar(busqueda.trim());
    const filtrados = termino
      ? productos.filter((p) => normalizar(`${p.nombre} ${p.descripcion} ${p.categoriaNombre}`).includes(termino))
      : [...productos];
    if (orden === 'precio-asc') filtrados.sort((a, b) => a.precio - b.precio);
    if (orden === 'precio-desc') filtrados.sort((a, b) => b.precio - a.precio);
    if (orden === 'nombre') filtrados.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    return filtrados;
  }, [productos, busqueda, orden]);

  const herramientas = (
    <div className={styles.herramientas}>
      <label className={styles.buscar}>
        <span className="visually-hidden">Buscar productos</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar productos"
        />
      </label>
      <label className={styles.ordenar}>
        <span className="visually-hidden">Ordenar por</span>
        <select value={orden} onChange={(e) => setOrden(e.target.value as Orden)}>
          {ORDENES.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.etiqueta}
            </option>
          ))}
        </select>
      </label>
    </div>
  );

  const sinResultados = (
    <div className="vacio">
      <span className="vacio-marca">Búsqueda</span>
      <h2 className="vacio-titulo">Sin resultados para "{busqueda.trim()}"</h2>
      <p className="vacio-texto">Prueba con otra palabra o revisa otra categoría.</p>
      <button type="button" className="btn btn-secondary" onClick={() => setBusqueda('')}>
        Limpiar búsqueda
      </button>
    </div>
  );

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
        <ProductGrid
          productos={visibles}
          onAgregar={handleAgregar}
          herramientas={herramientas}
          sinResultados={sinResultados}
        />
      )}
    </div>
  );
};
