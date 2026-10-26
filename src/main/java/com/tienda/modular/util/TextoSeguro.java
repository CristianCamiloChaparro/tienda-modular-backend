package com.tienda.modular.util;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.parser.Parser;
import org.jsoup.safety.Safelist;

/**
 * Mitigacion XSS en la entrada: elimina cualquier etiqueta HTML o script de los textos
 * antes de guardarlos. Ej: "&lt;script&gt;alert(1)&lt;/script&gt;Gorra" se guarda como "Gorra".
 */
public final class TextoSeguro {

    private static final Document.OutputSettings SIN_FORMATO =
            new Document.OutputSettings().prettyPrint(false);

    private TextoSeguro() {
    }

    /** @return el texto sin HTML y sin espacios sobrantes, o null si queda vacio. */
    public static String limpiar(String texto) {
        if (texto == null) {
            return null;
        }
        // Se repite hasta que no cambie para que "&lt;script&gt;" codificado tampoco sobreviva.
        String actual = texto;
        for (int i = 0; i < 5; i++) {
            String limpio = Parser.unescapeEntities(Jsoup.clean(actual, "", Safelist.none(), SIN_FORMATO), false);
            if (limpio.equals(actual)) {
                break;
            }
            actual = limpio;
        }
        actual = actual.trim();
        return actual.isEmpty() ? null : actual;
    }
}
