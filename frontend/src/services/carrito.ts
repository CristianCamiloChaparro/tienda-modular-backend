import type { Carrito } from '../types/carrito';
import { request } from './http';

export function crearCarrito(): Promise<Carrito> {
  return request<Carrito>('/carritos', { method: 'POST' });
}

export function obtenerCarrito(id: string): Promise<Carrito> {
  return request<Carrito>(`/carritos/${encodeURIComponent(id)}`);
}

export function agregarItem(id: string, productoId: number, cantidad: number): Promise<Carrito> {
  return request<Carrito>(`/carritos/${encodeURIComponent(id)}/items`, {
    method: 'POST',
    body: { productoId, cantidad },
  });
}

export function actualizarItem(id: string, productoId: number, cantidad: number): Promise<Carrito> {
  return request<Carrito>(`/carritos/${encodeURIComponent(id)}/items/${productoId}`, {
    method: 'PUT',
    body: { cantidad },
  });
}

export function quitarItem(id: string, productoId: number): Promise<Carrito> {
  return request<Carrito>(`/carritos/${encodeURIComponent(id)}/items/${productoId}`, {
    method: 'DELETE',
  });
}

export function vaciarCarrito(id: string): Promise<Carrito> {
  return request<Carrito>(`/carritos/${encodeURIComponent(id)}/items`, { method: 'DELETE' });
}
