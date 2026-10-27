package com.tienda.modular.exception;

import java.time.Duration;

/** Se supero el limite de intentos de inicio de sesion. Responde 429 con la cabecera Retry-After. */
public class DemasiadosIntentosException extends RuntimeException {

    private final Duration espera;

    public DemasiadosIntentosException(Duration espera) {
        super("Demasiados intentos fallidos. Espere " + espera.toMinutes() + " minutos e intente de nuevo");
        this.espera = espera;
    }

    public Duration getEspera() {
        return espera;
    }
}
