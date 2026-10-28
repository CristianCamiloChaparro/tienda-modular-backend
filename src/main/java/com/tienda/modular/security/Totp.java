package com.tienda.modular.security;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.time.Instant;

/**
 * Codigos de un solo uso basados en tiempo (TOTP, RFC 6238), los mismos que generan Google Authenticator,
 * Microsoft Authenticator o Authy: HMAC-SHA1, 6 digitos, intervalos de 30 segundos.
 */
public final class Totp {

    public static final int DIGITOS = 6;
    public static final long INTERVALO_SEGUNDOS = 30;
    /** Se aceptan el intervalo actual y uno antes o despues, por diferencias de reloj del celular. */
    private static final int TOLERANCIA = 1;
    private static final String ALFABETO = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    private static final SecureRandom ALEATORIO = new SecureRandom();

    private Totp() {
    }

    /** Secreto nuevo de 160 bits en Base32 (32 caracteres). */
    public static String generarSecreto() {
        byte[] bytes = new byte[20];
        ALEATORIO.nextBytes(bytes);
        return base32(bytes);
    }

    /** Enlace otpauth:// que se muestra como codigo QR para la app autenticadora. */
    public static String enlaceOtpauth(String emisor, String cuenta, String secreto) {
        String etiqueta = codificar(emisor) + ":" + codificar(cuenta);
        return "otpauth://totp/" + etiqueta + "?secret=" + secreto + "&issuer=" + codificar(emisor)
                + "&algorithm=SHA1&digits=" + DIGITOS + "&period=" + INTERVALO_SEGUNDOS;
    }

    public static long pasoActual(Instant ahora) {
        return ahora.getEpochSecond() / INTERVALO_SEGUNDOS;
    }

    /**
     * Devuelve el intervalo en que el codigo es valido, o -1 si no coincide.
     * Usa una comparacion de tiempo constante para no filtrar digitos por tiempos de respuesta.
     */
    public static long verificar(String secreto, String codigo, Instant ahora) {
        if (secreto == null || codigo == null || !codigo.matches("\\d{" + DIGITOS + "}")) {
            return -1;
        }
        byte[] clave = desdeBase32(secreto);
        long actual = pasoActual(ahora);
        long encontrado = -1;
        for (long paso = actual - TOLERANCIA; paso <= actual + TOLERANCIA; paso++) {
            if (iguales(codigo, codigo(clave, paso)) && encontrado == -1) {
                encontrado = paso;
            }
        }
        return encontrado;
    }

    /** Codigo de 6 digitos para un intervalo dado. */
    public static String codigo(byte[] clave, long paso) {
        try {
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(clave, "HmacSHA1"));
            byte[] hash = mac.doFinal(ByteBuffer.allocate(8).putLong(paso).array());
            int desplazamiento = hash[hash.length - 1] & 0x0f;
            int binario = ((hash[desplazamiento] & 0x7f) << 24)
                    | ((hash[desplazamiento + 1] & 0xff) << 16)
                    | ((hash[desplazamiento + 2] & 0xff) << 8)
                    | (hash[desplazamiento + 3] & 0xff);
            int otp = binario % (int) Math.pow(10, DIGITOS);
            return String.format("%0" + DIGITOS + "d", otp);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("HmacSHA1 no disponible", e);
        }
    }

    public static String base32(byte[] datos) {
        StringBuilder salida = new StringBuilder();
        int buffer = 0;
        int bits = 0;
        for (byte b : datos) {
            buffer = (buffer << 8) | (b & 0xff);
            bits += 8;
            while (bits >= 5) {
                salida.append(ALFABETO.charAt((buffer >> (bits - 5)) & 31));
                bits -= 5;
            }
        }
        if (bits > 0) {
            salida.append(ALFABETO.charAt((buffer << (5 - bits)) & 31));
        }
        return salida.toString();
    }

    public static byte[] desdeBase32(String texto) {
        String limpio = texto.replace("=", "").replace(" ", "").toUpperCase();
        ByteBuffer salida = ByteBuffer.allocate(limpio.length() * 5 / 8);
        int buffer = 0;
        int bits = 0;
        for (char c : limpio.toCharArray()) {
            int valor = ALFABETO.indexOf(c);
            if (valor < 0) {
                throw new IllegalArgumentException("Secreto Base32 inválido");
            }
            buffer = (buffer << 5) | valor;
            bits += 5;
            if (bits >= 8) {
                salida.put((byte) (buffer >> (bits - 8)));
                bits -= 8;
            }
        }
        return salida.array();
    }

    private static boolean iguales(String a, String b) {
        return java.security.MessageDigest.isEqual(a.getBytes(), b.getBytes());
    }

    private static String codificar(String texto) {
        return java.net.URLEncoder.encode(texto, java.nio.charset.StandardCharsets.UTF_8).replace("+", "%20");
    }
}
