package com.tienda.modular.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;

@Schema(description = """
        Datos de la tarjeta para la pasarela de pagos (modo prueba).
        Tarjetas de prueba: 4242 4242 4242 4242 (aprobada), 4000 0000 0000 0002 (rechazada por fondos insuficientes).
        El numero completo y el CVV nunca se guardan.""")
public record PagoRequest(

        @Schema(example = "LAURA GOMEZ")
        @NotBlank(message = "El titular es obligatorio")
        @Size(max = 100, message = "El titular no puede superar 100 caracteres")
        String titular,

        @Schema(example = "4242 4242 4242 4242")
        @NotBlank(message = "El número de tarjeta es obligatorio")
        @Pattern(regexp = "^[0-9 -]{13,23}$", message = "El número de tarjeta solo puede tener dígitos")
        String numeroTarjeta,

        @Schema(example = "12")
        @NotNull(message = "El mes de expiración es obligatorio")
        @Min(value = 1, message = "Mes inválido")
        @Max(value = 12, message = "Mes inválido")
        Integer mesExpiracion,

        @Schema(example = "2030")
        @NotNull(message = "El año de expiración es obligatorio")
        @Min(value = 2000, message = "Año inválido")
        @Max(value = 2100, message = "Año inválido")
        Integer anioExpiracion,

        @Schema(example = "123")
        @NotBlank(message = "El CVV es obligatorio")
        @Pattern(regexp = "^[0-9]{3,4}$", message = "El CVV debe tener 3 o 4 dígitos")
        String cvv
) {
    @Override
    public String toString() {
        // Nunca imprimir datos de la tarjeta en logs.
        return "PagoRequest[titular=" + titular + ", tarjeta=****]";
    }
}
