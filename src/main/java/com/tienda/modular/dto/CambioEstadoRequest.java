package com.tienda.modular.dto;

import com.tienda.modular.model.EstadoPedido;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Nuevo estado del pedido")
public record CambioEstadoRequest(
        @Schema(example = "ENVIADO")
        @NotNull(message = "El estado es obligatorio")
        EstadoPedido estado
) {
}
