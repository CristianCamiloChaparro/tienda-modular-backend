package com.tienda.modular.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "La contrasena es correcta pero falta el codigo de la app autenticadora")
public record DosFactoresRequeridoResponse(
        @Schema(example = "true") boolean requiereDosFactores,
        @Schema(example = "Ingresa el codigo de tu app autenticadora") String mensaje
) {
}
