package com.tienda.modular.exception;

/** Violacion de una regla de negocio (ej. nombre de categoria repetido). Responde 409. */
public class ReglaNegocioException extends RuntimeException {
    public ReglaNegocioException(String mensaje) {
        super(mensaje);
    }
}
