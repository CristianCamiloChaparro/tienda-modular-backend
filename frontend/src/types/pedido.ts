export type EstadoPedido = 'PAGADO' | 'ENVIADO' | 'ENTREGADO' | 'CANCELADO';

export interface ItemPedido {
  productoId: number;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Pedido {
  id: number;
  estado: EstadoPedido;
  total: number;
  direccionEnvio: string;
  telefono: string;
  referenciaPago: string;
  medioPago: string;
  clienteNombre: string;
  clienteEmail: string;
  creadoEn: string;
  items: ItemPedido[];
}

export interface PagoRequest {
  titular: string;
  numeroTarjeta: string;
  mesExpiracion: number;
  anioExpiracion: number;
  cvv: string;
}

export interface CheckoutRequest {
  carritoId: string;
  direccionEnvio: string;
  telefono: string;
  pago: PagoRequest;
}
