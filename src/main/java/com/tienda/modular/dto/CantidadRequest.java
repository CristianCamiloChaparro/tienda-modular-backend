package com.tienda.modular.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Nueva cantidad de un producto en el carrito")
public record CantidadRequest(

        @Schema(example = "3")
        @NotNull(message = "La cantidad es obligatoria")
        @Min(value = 1, message = "La cantidad debe ser al menos 1")
        @Max(value = 99, message = "La cantidad no puede superar 99")
        Integer cantidad
) {
}
