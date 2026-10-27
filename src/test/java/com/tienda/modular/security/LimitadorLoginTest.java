package com.tienda.modular.security;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LimitadorLoginTest {

    /** Reloj que se puede adelantar a mano. */
    private static final class RelojManual extends Clock {
        private Instant ahora = Instant.parse("2026-10-27T10:00:00Z");

        void avanzar(Duration d) {
            ahora = ahora.plus(d);
        }

        @Override
        public Instant instant() {
            return ahora;
        }

        @Override
        public ZoneOffset getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(java.time.ZoneId zone) {
            return this;
        }
    }

    private final RelojManual reloj = new RelojManual();
    private final LimitadorLogin limitador = new LimitadorLogin(reloj);

    @Test
    void bloqueaDespuesDeCincoFallos() {
        for (int i = 0; i < LimitadorLogin.MAX_FALLOS; i++) {
            assertTrue(limitador.permitido("1.1.1.1"));
            limitador.registrarFallo("1.1.1.1");
        }
        assertFalse(limitador.permitido("1.1.1.1"));
        assertTrue(limitador.permitido("2.2.2.2"), "Otra IP no se ve afectada");
    }

    @Test
    void desbloqueaCuandoPasaLaVentana() {
        for (int i = 0; i < LimitadorLogin.MAX_FALLOS; i++) {
            limitador.registrarFallo("1.1.1.1");
        }
        reloj.avanzar(LimitadorLogin.VENTANA.minusSeconds(1));
        assertFalse(limitador.permitido("1.1.1.1"));
        reloj.avanzar(Duration.ofSeconds(1));
        assertTrue(limitador.permitido("1.1.1.1"));
    }

    @Test
    void reiniciarBorraLosFallos() {
        for (int i = 0; i < LimitadorLogin.MAX_FALLOS; i++) {
            limitador.registrarFallo("1.1.1.1");
        }
        limitador.reiniciar("1.1.1.1");
        assertTrue(limitador.permitido("1.1.1.1"));
    }
}
