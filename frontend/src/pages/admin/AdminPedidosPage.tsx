import React, { useEffect, useState } from 'react';
import type { EstadoPedido, Pedido } from '../../types/pedido';
import { cambiarEstadoPedido, getTodosLosPedidos } from '../../services/pedidos';
import { useToast } from '../../context/ToastContext';
import { EstadoPedidoBadge } from '../../components/EstadoPedidoBadge/EstadoPedidoBadge';
import { formatearFecha, formatearPrecio, mensajeDeError } from '../../utils/formato';
import styles from './Admin.module.scss';

const ESTADOS: EstadoPedido[] = ['PAGADO', 'ENVIADO', 'ENTREGADO', 'CANCELADO'];

export const AdminPedidosPage: React.FC = () => {
  const { notificar } = useToast();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTodosLosPedidos()
      .then(setPedidos)
      .catch((err) => setError(mensajeDeError(err)))
      .finally(() => setCargando(false));
  }, []);

  const handleEstado = async (pedido: Pedido, estado: EstadoPedido) => {
    try {
      const actualizado = await cambiarEstadoPedido(pedido.id, estado);
      setPedidos((ps) => ps.map((p) => (p.id === actualizado.id ? actualizado : p)));
      notificar(`Pedido #${pedido.id} marcado como ${estado.toLowerCase()}`);
    } catch (err) {
      notificar(mensajeDeError(err), 'error');
    }
  };

  const totalVendido = pedidos
    .filter((p) => p.estado !== 'CANCELADO')
    .reduce((suma, p) => suma + p.total, 0);

  if (cargando) {
    return <div className="panel" aria-busy="true">Cargando pedidos...</div>;
  }

  return (
    <section aria-label="Pedidos de la tienda">
      {error && <div className="alert alert-error">{error}</div>}
      <div className={styles.stats}>
        <div className="panel">
          <span className={styles.muted}>Pedidos</span>
          <strong className={styles.statValue}>{pedidos.length}</strong>
        </div>
        <div className="panel">
          <span className={styles.muted}>Total vendido</span>
          <strong className={styles.statValue}>{formatearPrecio(totalVendido)}</strong>
        </div>
      </div>

      <div className={`panel ${styles.tablePanel}`}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Pedido</th>
              <th scope="col">Cliente</th>
              <th scope="col">Productos</th>
              <th scope="col" className={styles.num}>Total</th>
              <th scope="col">Estado</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map((p) => (
              <tr key={p.id}>
                <td>
                  <strong>#{p.id}</strong>
                  <div className={styles.muted}>{formatearFecha(p.creadoEn)}</div>
                </td>
                <td data-label="Cliente">
                  {p.clienteNombre}
                  <div className={styles.muted}>{p.clienteEmail}</div>
                </td>
                <td data-label="Productos">
                  {p.items.map((i) => (
                    <div key={i.productoId}>
                      {i.cantidad} × {i.nombreProducto}
                    </div>
                  ))}
                </td>
                <td data-label="Total" className={styles.num}>{formatearPrecio(p.total)}</td>
                <td data-label="Estado">
                  <div className={styles.estadoCell}>
                    <EstadoPedidoBadge estado={p.estado} />
                    <select
                      className={`input ${styles.estadoSelect}`}
                      value={p.estado}
                      onChange={(e) => handleEstado(p, e.target.value as EstadoPedido)}
                      aria-label={`Cambiar estado del pedido ${p.id}`}
                    >
                      {ESTADOS.map((e) => (
                        <option key={e} value={e}>
                          {e.charAt(0) + e.slice(1).toLowerCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
              </tr>
            ))}
            {pedidos.length === 0 && (
              <tr>
                <td colSpan={5} className={styles.emptyRow}>
                  Aún no hay pedidos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
