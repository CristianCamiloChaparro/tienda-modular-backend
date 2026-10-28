import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { QuantityStepper } from '../components/QuantityStepper/QuantityStepper';
import { formatearPrecio, mensajeDeError } from '../utils/formato';
import styles from './CarritoPage.module.scss';

export const CarritoPage: React.FC = () => {
  const { carrito, cargando, actualizar, quitar, vaciar } = useCart();
  const { usuario } = useAuth();
  const { notificar } = useToast();
  const navigate = useNavigate();
  const [ocupado, setOcupado] = useState<number | 'todo' | null>(null);

  const ejecutar = async (clave: number | 'todo', accion: () => Promise<void>) => {
    setOcupado(clave);
    try {
      await accion();
    } catch (err) {
      notificar(mensajeDeError(err, 'No se pudo actualizar el carrito'), 'error');
    } finally {
      setOcupado(null);
    }
  };

  const handleVaciar = () => {
    if (window.confirm('¿Vaciar el carrito?')) {
      ejecutar('todo', vaciar);
    }
  };

  const irAPagar = () => {
    navigate(usuario ? '/checkout' : '/login', { state: { desde: '/checkout' } });
  };

  const items = carrito?.items ?? [];

  return (
    <div className="container">
      <header className="page-header">
        <h1 className="page-title">Carrito de compras</h1>
        <p className="page-subtitle">El total se recalcula automáticamente con cada cambio.</p>
      </header>

      {cargando && !carrito ? (
        <div className="panel" aria-busy="true">Cargando carrito...</div>
      ) : items.length === 0 ? (
        <div className="vacio">
          <span className="vacio-marca">Carrito</span>
          <h2 className="vacio-titulo">Tu carrito está vacío</h2>
          <p className="vacio-texto">Agrega productos desde el catálogo; aquí podrás cambiar cantidades y ver el total.</p>
          <Link to="/" className="btn btn-primary">
            Ir al catálogo
          </Link>
        </div>
      ) : (
        <div className={styles.layout}>
          <section className={styles.items} aria-label="Productos en el carrito">
            {items.map((item) => (
              <article key={item.productoId} className={styles.item}>
                <div className={styles.thumb}>
                  {item.imagenUrl ? <img src={item.imagenUrl} alt="" loading="lazy" /> : <span aria-hidden="true">🛍️</span>}
                </div>
                <div className={styles.info}>
                  <h2 className={styles.name}>{item.nombre}</h2>
                  <span className={styles.meta}>
                    {item.categoriaNombre} · {formatearPrecio(item.precioUnitario)} c/u
                  </span>
                  {item.cantidad >= item.stockDisponible && (
                    <span className={styles.warning}>Máximo disponible: {item.stockDisponible}</span>
                  )}
                </div>
                <div className={styles.qty}>
                  <QuantityStepper
                    cantidad={item.cantidad}
                    maximo={item.stockDisponible}
                    etiqueta={item.nombre}
                    disabled={ocupado !== null}
                    onChange={(cantidad) => ejecutar(item.productoId, () => actualizar(item.productoId, cantidad))}
                  />
                </div>
                <strong className={styles.subtotal}>{formatearPrecio(item.subtotal)}</strong>
                <button
                  type="button"
                  className={`btn btn-ghost btn-sm ${styles.quitar}`}
                  onClick={() => ejecutar(item.productoId, () => quitar(item.productoId))}
                  disabled={ocupado !== null}
                  aria-label={`Quitar ${item.nombre} del carrito`}
                >
                  Quitar
                </button>
              </article>
            ))}
          </section>

          <aside className={`panel ${styles.summary}`} aria-label="Resumen del pedido">
            <h2 className={styles.summaryTitle}>Resumen</h2>
            <div className={styles.row}>
              <span>Productos</span>
              <span>{carrito?.totalUnidades}</span>
            </div>
            <div className={`${styles.row} ${styles.total}`}>
              <span>Total</span>
              <span data-testid="carrito-total">{formatearPrecio(carrito?.total ?? 0)}</span>
            </div>
            <button type="button" className="btn btn-primary btn-block" onClick={irAPagar} disabled={ocupado !== null}>
              {usuario ? 'Continuar al pago' : 'Inicia sesión para pagar'}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-block"
              onClick={handleVaciar}
              disabled={ocupado !== null}
            >
              Vaciar carrito
            </button>
            <Link to="/" className={styles.seguir}>
              ← Seguir comprando
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
};
