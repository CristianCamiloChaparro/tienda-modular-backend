package com.tienda.modular.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Datos para registrar una categoria")
public record CategoriaRequest(

        @Schema(description = "Nombre unico de la categoria", example = "Accesorios")
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 80, message = "El nombre no puede superar 80 caracteres")
        String nombre,

        @Schema(description = "Descripcion breve", example = "Bolsos, gorras y complementos")
        @Size(max = 255, message = "La descripcion no puede superar 255 caracteres")
        String descripcion
) {
}
