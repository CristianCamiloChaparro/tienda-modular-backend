package com.tienda.modular.exception;

/** Dato que pasa la validacion de formato pero no es aceptable (ej. solo contenia HTML). Responde 400. */
public class DatoInvalidoException extends RuntimeException {

    private final String campo;

    public DatoInvalidoException(String campo, String mensaje) {
        super(mensaje);
        this.campo = campo;
    }

    public String getCampo() {
        return campo;
    }
}
