package com.tienda.modular.service.pago;

import com.tienda.modular.dto.PagoRequest;
import com.tienda.modular.exception.DatoInvalidoException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Year;

import static org.junit.jupiter.api.Assertions.*;

class PasarelaPagoSimuladaTest {

    private final PasarelaPagoSimulada pasarela = new PasarelaPagoSimulada();
    private final int anioFuturo = Year.now().getValue() + 3;

    private PagoRequest tarjeta(String numero, int mes, int anio) {
        return new PagoRequest("LAURA GOMEZ", numero, mes, anio, "123");
    }

    @Test
    @DisplayName("Tarjeta 4242 4242 4242 4242 -> aprobada, solo guarda los ultimos 4 digitos")
    void tarjetaDePruebaAprobada() {
        ResultadoPago r = pasarela.cobrar(new BigDecimal("50000"), tarjeta("4242 4242 4242 4242", 12, anioFuturo), "test");
        assertTrue(r.aprobado());
        assertEquals("VISA **** 4242", r.medioPago());
        assertTrue(r.referencia().startsWith("PAY-"));
    }

    @Test
    @DisplayName("Tarjeta terminada en 0002 -> rechazada por fondos insuficientes")
    void tarjetaRechazada() {
        ResultadoPago r = pasarela.cobrar(new BigDecimal("50000"), tarjeta("4000000000000002", 12, anioFuturo), "test");
        assertFalse(r.aprobado());
        assertEquals("Pago rechazado: fondos insuficientes", r.mensaje());
    }

    @Test
    @DisplayName("Numero que no pasa Luhn -> 400")
    void numeroInvalido() {
        DatoInvalidoException ex = assertThrows(DatoInvalidoException.class,
                () -> pasarela.cobrar(BigDecimal.TEN, tarjeta("4242424242424241", 12, anioFuturo), "test"));
        assertEquals("pago.numeroTarjeta", ex.getCampo());
    }

    @Test
    @DisplayName("Tarjeta vencida -> 400")
    void tarjetaVencida() {
        assertThrows(DatoInvalidoException.class,
                () -> pasarela.cobrar(BigDecimal.TEN, tarjeta("4242424242424242", 1, 2020), "test"));
    }

    @Test
    @DisplayName("Algoritmo de Luhn")
    void luhn() {
        assertTrue(PasarelaPagoSimulada.pasaLuhn("4242424242424242"));
        assertTrue(PasarelaPagoSimulada.pasaLuhn("5555555555554444"));
        assertFalse(PasarelaPagoSimulada.pasaLuhn("1234567812345678"));
    }
}
