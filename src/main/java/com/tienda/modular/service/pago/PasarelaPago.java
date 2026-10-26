package com.tienda.modular.service.pago;

import com.tienda.modular.dto.PagoRequest;

import java.math.BigDecimal;

/**
 * Contrato con la pasarela de pagos. La implementacion actual es un sandbox simulado;
 * para cobrar de verdad se reemplaza por una que use Wompi, Mercado Pago o Stripe.
 */
public interface PasarelaPago {

    ResultadoPago cobrar(BigDecimal monto, PagoRequest pago, String descripcion);
}
