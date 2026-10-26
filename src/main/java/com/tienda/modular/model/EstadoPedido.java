package com.tienda.modular.model;

/** Ciclo de vida de un pedido despues de un pago aprobado. */
public enum EstadoPedido {
    PAGADO,
    ENVIADO,
    ENTREGADO,
    CANCELADO
}
