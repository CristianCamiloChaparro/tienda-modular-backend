package com.tienda.modular.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Datos para registrar la cuenta en la app autenticadora (se muestran una sola vez)")
public record ConfiguracionDosFactoresResponse(
        @Schema(description = "Clave para escribir a mano si no se puede leer el QR", example = "JBSWY3DPEHPK3PXP")
        String secreto,
        @Schema(description = "Contenido del codigo QR")
        String otpauthUrl
) {
}
