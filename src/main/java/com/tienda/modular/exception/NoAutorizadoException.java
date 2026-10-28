package com.tienda.modular.exception;

/** Falta una sesion valida para continuar (ej. verificacion en dos pasos vencida). Responde 401. */
public class NoAutorizadoException extends RuntimeException {
    public NoAutorizadoException(String mensaje) {
        super(mensaje);
    }
}
