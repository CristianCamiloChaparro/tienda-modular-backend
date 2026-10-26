package com.tienda.modular.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Como enviar el token CSRF en las operaciones que modifican datos")
public record CsrfResponse(
        @Schema(example = "XSRF-TOKEN") String cookie,
        @Schema(example = "X-XSRF-TOKEN") String cabecera
) {
}
