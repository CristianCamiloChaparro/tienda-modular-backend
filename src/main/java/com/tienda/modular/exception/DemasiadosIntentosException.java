package com.tienda.modular.exception;

/** Se superaron los intentos permitidos (ej. codigos de verificacion). Responde 429. */
public class DemasiadosIntentosException extends RuntimeException {
    public DemasiadosIntentosException(String mensaje) {
        super(mensaje);
    }
}
