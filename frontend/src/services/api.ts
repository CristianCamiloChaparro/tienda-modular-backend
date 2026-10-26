import type { Categoria, CategoriaRequest } from '../types/categoria';
import type { Producto, ProductoRequest } from '../types/producto';
import { request } from './http';

export { API_BASE_URL, ApiException } from './http';

// ---------- Catálogo público ----------

export async function getCategorias(): Promise<Categoria[]> {
  return request<Categoria[]>('/categorias');
}

export async function getProductos(categoriaId?: number | null): Promise<Producto[]> {
  const path =
    categoriaId !== undefined && categoriaId !== null
      ? `/productos?categoriaId=${encodeURIComponent(categoriaId)}`
      : '/productos';
  return request<Producto[]>(path);
}

// ---------- Panel de administrador (requiere rol ADMIN) ----------

export function crearCategoria(datos: CategoriaRequest): Promise<Categoria> {
  return request<Categoria>('/categorias', { method: 'POST', body: datos });
}

export function actualizarCategoria(id: number, datos: CategoriaRequest): Promise<Categoria> {
  return request<Categoria>(`/categorias/${id}`, { method: 'PUT', body: datos });
}

export function eliminarCategoria(id: number): Promise<void> {
  return request<void>(`/categorias/${id}`, { method: 'DELETE' });
}

export function crearProducto(datos: ProductoRequest): Promise<Producto> {
  return request<Producto>('/productos', { method: 'POST', body: datos });
}

export function actualizarProducto(id: number, datos: ProductoRequest): Promise<Producto> {
  return request<Producto>(`/productos/${id}`, { method: 'PUT', body: datos });
}

export function eliminarProducto(id: number): Promise<void> {
  return request<void>(`/productos/${id}`, { method: 'DELETE' });
}
