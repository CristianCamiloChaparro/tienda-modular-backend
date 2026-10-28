package com.tienda.modular.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class TotpTest {

    /** Clave del apendice B del RFC 6238 (SHA1): "12345678901234567890". */
    private static final byte[] CLAVE_RFC = "12345678901234567890".getBytes(StandardCharsets.US_ASCII);

    @Test
    @DisplayName("Coincide con los vectores de prueba del RFC 6238 (ultimos 6 digitos)")
    void vectoresRfc() {
        assertThat(Totp.codigo(CLAVE_RFC, 59 / 30)).isEqualTo("287082");
        assertThat(Totp.codigo(CLAVE_RFC, 1111111109L / 30)).isEqualTo("081804");
        assertThat(Totp.codigo(CLAVE_RFC, 1234567890L / 30)).isEqualTo("005924");
        assertThat(Totp.codigo(CLAVE_RFC, 2000000000L / 30)).isEqualTo("279037");
    }

    @Test
    @DisplayName("Base32 ida y vuelta")
    void base32() {
        assertThat(Totp.base32(CLAVE_RFC)).isEqualTo("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
        assertThat(Totp.desdeBase32("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ")).isEqualTo(CLAVE_RFC);
        assertThat(Totp.generarSecreto()).hasSize(32).matches("[A-Z2-7]+");
    }

    @Test
    @DisplayName("Acepta el intervalo actual y uno de tolerancia; rechaza codigos viejos o mal formados")
    void verificar() {
        String secreto = Totp.base32(CLAVE_RFC);
        Instant ahora = Instant.ofEpochSecond(1234567890L);
        long paso = Totp.pasoActual(ahora);

        assertThat(Totp.verificar(secreto, "005924", ahora)).isEqualTo(paso);
        assertThat(Totp.verificar(secreto, Totp.codigo(CLAVE_RFC, paso - 1), ahora)).isEqualTo(paso - 1);
        assertThat(Totp.verificar(secreto, Totp.codigo(CLAVE_RFC, paso - 3), ahora)).isEqualTo(-1);
        assertThat(Totp.verificar(secreto, "12345", ahora)).isEqualTo(-1);
        assertThat(Totp.verificar(secreto, "abcdef", ahora)).isEqualTo(-1);
    }

    @Test
    void enlaceOtpauth() {
        assertThat(Totp.enlaceOtpauth("Tienda", "ana@correo.com", "ABC"))
                .isEqualTo("otpauth://totp/Tienda:ana%40correo.com?secret=ABC&issuer=Tienda&algorithm=SHA1&digits=6&period=30");
    }
}
