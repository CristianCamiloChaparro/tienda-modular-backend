export interface ItemCarrito {
  productoId: number;
  nombre: string;
  imagenUrl?: string | null;
  categoriaNombre: string;
  precioUnitario: number;
  cantidad: number;
  subtotal: number;
  stockDisponible: number;
}

export interface Carrito {
  id: string;
  items: ItemCarrito[];
  totalUnidades: number;
  total: number;
  fechaActualizacion?: string;
}
