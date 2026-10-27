package com.tienda.modular.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.junit.jupiter.api.Assertions.*;

class VerificadorDeSecretosTest {

    @Test
    void sinDbPassword_detieneElArranqueConMensajeClaro() {
        MockEnvironment entorno = new MockEnvironment()
                .withProperty("spring.datasource.password", "${DB_PASSWORD}");

        IllegalStateException error = assertThrows(IllegalStateException.class,
                () -> VerificadorDeSecretos.verificar(entorno));
        assertTrue(error.getMessage().startsWith("Falta el secreto DB_PASSWORD"), error.getMessage());
    }

    @Test
    void dbPasswordVacia_tambienSeRechaza() {
        MockEnvironment entorno = new MockEnvironment()
                .withProperty("spring.datasource.password", "${DB_PASSWORD}")
                .withProperty("DB_PASSWORD", " ");

        assertThrows(IllegalStateException.class, () -> VerificadorDeSecretos.verificar(entorno));
    }

    @Test
    void conHttpsExigeSslPassword() {
        MockEnvironment entorno = new MockEnvironment()
                .withProperty("spring.datasource.password", "${DB_PASSWORD}")
                .withProperty("DB_PASSWORD", "clave-de-la-bd")
                .withProperty("server.ssl.enabled", "true")
                .withProperty("server.ssl.key-store-password", "${SSL_PASSWORD}");

        IllegalStateException error = assertThrows(IllegalStateException.class,
                () -> VerificadorDeSecretos.verificar(entorno));
        assertTrue(error.getMessage().contains("SSL_PASSWORD"));

        entorno.setProperty("SSL_PASSWORD", "changeit");
        assertDoesNotThrow(() -> VerificadorDeSecretos.verificar(entorno));
    }
}
