package com.tienda.modular.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class TextoSeguroTest {

    @Test
    @DisplayName("Elimina etiquetas script junto con su contenido")
    void eliminaScript() {
        assertEquals("Gorra", TextoSeguro.limpiar("<script>alert('xss')</script>Gorra"));
    }

    @Test
    @DisplayName("Elimina atributos de eventos como onerror")
    void eliminaEventos() {
        assertEquals("Taza", TextoSeguro.limpiar("<img src=x onerror=alert(1)>Taza"));
    }

    @Test
    @DisplayName("Tampoco deja pasar HTML codificado como entidades")
    void eliminaHtmlCodificado() {
        assertEquals("Vela", TextoSeguro.limpiar("&lt;script&gt;alert(1)&lt;/script&gt;Vela"));
    }

    @Test
    @DisplayName("Conserva texto normal con tildes, simbolos y saltos de linea")
    void conservaTextoNormal() {
        assertEquals("Café & té 100% < 5 kg\nsegunda línea",
                TextoSeguro.limpiar("  Café & té 100% < 5 kg\nsegunda línea "));
    }

    @Test
    @DisplayName("Devuelve null si solo habia HTML o espacios")
    void soloHtmlDevuelveNull() {
        assertNull(TextoSeguro.limpiar("<b></b>   "));
        assertNull(TextoSeguro.limpiar(null));
    }
}
