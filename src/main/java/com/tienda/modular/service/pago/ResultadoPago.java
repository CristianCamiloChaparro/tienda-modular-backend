package com.tienda.modular.service.pago;

/** Respuesta de la pasarela: si aprobo, la referencia de la transaccion y el medio enmascarado. */
public record ResultadoPago(boolean aprobado, String referencia, String medioPago, String mensaje) {
}
