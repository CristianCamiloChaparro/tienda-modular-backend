import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import type { Pedido } from '../types/pedido';
import { getMisPedidos } from '../services/pedidos';
import { EstadoPedidoBadge } from '../components/EstadoPedidoBadge/EstadoPedidoBadge';
import { formatearFecha, formatearPrecio, mensajeDeError } from '../utils/formato';
import styles from './MisPedidosPage.module.scss';

export const MisPedidosPage: React.FC = () => {
  const location = useLocation();
  const pedidoNuevo = (location.state as { pedidoNuevo?: number } | null)?.pedidoNuevo;
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMisPedidos()
      .then(setPedidos)
      .catch((err) => setError(mensajeDeError(err)))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div className="container">
      <header className="page-header">
        <h1 className="page-title">Mis pedidos</h1>
      </header>

      {pedidoNuevo && (
        <div className="alert alert-success" role="status">
          ¡Pago aprobado! Tu pedido #{pedidoNuevo} fue registrado.
        </div>
      )}
      {error && <div className="alert alert-error">{error}</div>}

      {cargando ? (
        <div className="panel" aria-busy="true">Cargando pedidos...</div>
      ) : pedidos.length === 0 && !error ? (
        <div className="vacio">
          <span className="vacio-marca">Pedidos</span>
          <h2 className="vacio-titulo">Todavía no tienes pedidos</h2>
          <p className="vacio-texto">Cuando pagues una compra, el pedido aparecerá aquí con su estado y referencia de pago.</p>
          <Link to="/" className="btn btn-primary">
            Ir al catálogo
          </Link>
        </div>
      ) : (
        <div className={styles.list}>
          {pedidos.map((p) => (
            <article
              key={p.id}
              className={`panel ${styles.pedido} ${p.id === pedidoNuevo ? styles.nuevo : ''}`}
            >
              <header className={styles.head}>
                <div>
                  <h2 className={styles.numero}>Pedido #{p.id}</h2>
                  <span className={styles.meta}>
                    {formatearFecha(p.creadoEn)} · {p.medioPago} · Ref. {p.referenciaPago}
                  </span>
                </div>
                <EstadoPedidoBadge estado={p.estado} />
              </header>
              <ul className={styles.items}>
                {p.items.map((i) => (
                  <li key={i.productoId}>
                    <span>
                      {i.cantidad} × {i.nombreProducto}
                    </span>
                    <span>{formatearPrecio(i.subtotal)}</span>
                  </li>
                ))}
              </ul>
              <footer className={styles.foot}>
                <span className={styles.meta}>Envío a: {p.direccionEnvio}</span>
                <strong>{formatearPrecio(p.total)}</strong>
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
