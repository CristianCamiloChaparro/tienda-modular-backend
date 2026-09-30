package com.tienda.modular.exception;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.Map;

@Schema(description = "Formato estandar de error de la API")
public record ApiError(
        LocalDateTime timestamp,
        @Schema(example = "404") int status,
        @Schema(example = "Not Found") String error,
        @Schema(example = "Categoria con id 99 no encontrada") String mensaje,
        @Schema(example = "/api/v1/categorias/99") String ruta,
        @Schema(description = "Errores por campo (solo en validaciones)") Map<String, String> campos
) {
}
