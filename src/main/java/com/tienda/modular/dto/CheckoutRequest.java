package com.tienda.modular.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@Schema(description = "Datos para pagar el carrito y generar el pedido")
public record CheckoutRequest(

        @Schema(example = "3f1c2a9e-8b7d-4e21-9c55-2f0d6a1b7e44")
        @NotBlank(message = "El carrito es obligatorio")
        String carritoId,

        @Schema(example = "Calle 10 # 20-30, Bogota")
        @NotBlank(message = "La direccion de envio es obligatoria")
        @Size(max = 200, message = "La direccion no puede superar 200 caracteres")
        String direccionEnvio,

        @Schema(example = "3001234567")
        @NotBlank(message = "El telefono es obligatorio")
        @Pattern(regexp = "^[0-9+ ]{7,20}$", message = "El telefono solo puede tener digitos, espacios y +")
        String telefono,

        @NotNull(message = "Los datos de pago son obligatorios")
        @Valid
        PagoRequest pago
) {
}
