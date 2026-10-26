package com.tienda.modular.service.pago;

import com.tienda.modular.dto.PagoRequest;
import com.tienda.modular.exception.DatoInvalidoException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.UUID;

/**
 * Pasarela de pagos en modo prueba (sandbox), al estilo de Wompi o Stripe en modo test:
 * valida la tarjeta (algoritmo de Luhn y vencimiento) y decide segun el numero de prueba.
 * <ul>
 *   <li>4242 4242 4242 4242: aprobada</li>
 *   <li>terminada en 0002: rechazada por fondos insuficientes</li>
 *   <li>terminada en 0069: rechazada por tarjeta reportada</li>
 * </ul>
 * Solo se conservan la marca y los ultimos 4 digitos; el numero completo y el CVV se descartan.
 */
@Service
public class PasarelaPagoSimulada implements PasarelaPago {

    private static final Logger log = LoggerFactory.getLogger(PasarelaPagoSimulada.class);

    @Override
    public ResultadoPago cobrar(BigDecimal monto, PagoRequest pago, String descripcion) {
        String numero = pago.numeroTarjeta().replaceAll("[ -]", "");
        if (numero.length() < 13 || numero.length() > 19 || !pasaLuhn(numero)) {
            throw new DatoInvalidoException("pago.numeroTarjeta", "El numero de tarjeta no es valido");
        }
        if (YearMonth.of(pago.anioExpiracion(), pago.mesExpiracion()).isBefore(YearMonth.now())) {
            throw new DatoInvalidoException("pago.anioExpiracion", "La tarjeta esta vencida");
        }

        String ultimos4 = numero.substring(numero.length() - 4);
        String medio = marca(numero) + " **** " + ultimos4;
        String referencia = "PAY-" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();

        ResultadoPago resultado = switch (ultimos4) {
            case "0002" -> new ResultadoPago(false, referencia, medio, "Pago rechazado: fondos insuficientes");
            case "0069" -> new ResultadoPago(false, referencia, medio, "Pago rechazado: tarjeta reportada");
            default -> new ResultadoPago(true, referencia, medio, "Pago aprobado");
        };
        log.info("Pasarela simulada: {} {} por {} ({}) -> {}", referencia, medio, monto, descripcion, resultado.mensaje());
        return resultado;
    }

    static boolean pasaLuhn(String numero) {
        int suma = 0;
        boolean duplicar = false;
        for (int i = numero.length() - 1; i >= 0; i--) {
            int digito = numero.charAt(i) - '0';
            if (duplicar) {
                digito *= 2;
                if (digito > 9) {
                    digito -= 9;
                }
            }
            suma += digito;
            duplicar = !duplicar;
        }
        return suma % 10 == 0;
    }

    private static String marca(String numero) {
        if (numero.startsWith("4")) {
            return "VISA";
        }
        if (numero.matches("^(5[1-5]|2[2-7]).*")) {
            return "MASTERCARD";
        }
        if (numero.matches("^3[47].*")) {
            return "AMEX";
        }
        return "TARJETA";
    }
}
