export interface Producto {
  id: number;
  categoriaId: number;
  categoriaNombre: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  imagenUrl?: string | null;
  activo: boolean;
  creadoEn?: string;
}

export interface ProductoRequest {
  categoriaId: number;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  stock: number;
  imagenUrl?: string | null;
}
