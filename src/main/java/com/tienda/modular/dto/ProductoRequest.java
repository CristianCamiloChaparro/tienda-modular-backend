package com.tienda.modular.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

@Schema(description = "Datos para registrar un producto")
public record ProductoRequest(

        @Schema(description = "Id de una categoria existente", example = "1")
        @NotNull(message = "La categoria es obligatoria")
        Long categoriaId,

        @Schema(example = "Gorra negra bordada")
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 120, message = "El nombre no puede superar 120 caracteres")
        String nombre,

        @Schema(example = "Gorra ajustable de algodon con logo bordado")
        @Size(max = 1000, message = "La descripcion no puede superar 1000 caracteres")
        String descripcion,

        @Schema(description = "Precio unitario, mayor que 0", example = "45000.00")
        @NotNull(message = "El precio es obligatorio")
        @DecimalMin(value = "0.01", message = "El precio debe ser mayor que 0")
        @Digits(integer = 10, fraction = 2, message = "Precio con maximo 10 enteros y 2 decimales")
        BigDecimal precio,

        @Schema(description = "Unidades disponibles, 0 o mas", example = "20")
        @NotNull(message = "El stock es obligatorio")
        @Min(value = 0, message = "El stock no puede ser negativo")
        Integer stock,

        @Schema(example = "https://picsum.photos/seed/gorra/400/400")
        @Size(max = 500, message = "La URL no puede superar 500 caracteres")
        @Pattern(regexp = "^$|^https?://.+", message = "La imagen debe ser una URL http(s)")
        String imagenUrl
) {
}
