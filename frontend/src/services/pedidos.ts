import type { CheckoutRequest, EstadoPedido, Pedido } from '../types/pedido';
import { request } from './http';

/** Paga el carrito con la pasarela (modo prueba) y crea el pedido. */
export function pagarCarrito(datos: CheckoutRequest): Promise<Pedido> {
  return request<Pedido>('/pedidos', { method: 'POST', body: datos });
}

export function getMisPedidos(): Promise<Pedido[]> {
  return request<Pedido[]>('/pedidos/mios');
}

export function getTodosLosPedidos(): Promise<Pedido[]> {
  return request<Pedido[]>('/pedidos');
}

export function cambiarEstadoPedido(id: number, estado: EstadoPedido): Promise<Pedido> {
  return request<Pedido>(`/pedidos/${id}/estado`, { method: 'PATCH', body: { estado } });
}
