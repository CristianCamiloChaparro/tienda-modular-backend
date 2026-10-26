import React from 'react';
import type { EstadoPedido } from '../../types/pedido';
import styles from './EstadoPedidoBadge.module.scss';

const ETIQUETAS: Record<EstadoPedido, string> = {
  PAGADO: 'Pagado',
  ENVIADO: 'Enviado',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

export const EstadoPedidoBadge: React.FC<{ estado: EstadoPedido }> = ({ estado }) => (
  <span className={`${styles.badge} ${styles[estado.toLowerCase()]}`}>{ETIQUETAS[estado]}</span>
);
