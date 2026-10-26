package com.tienda.modular.exception;

/** La pasarela de pagos rechazo la transaccion. Responde 402. */
public class PagoRechazadoException extends RuntimeException {
    public PagoRechazadoException(String mensaje) {
        super(mensaje);
    }
}
