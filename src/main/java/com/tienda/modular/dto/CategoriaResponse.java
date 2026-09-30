package com.tienda.modular.dto;

import com.tienda.modular.model.Categoria;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

@Schema(description = "Categoria devuelta por la API")
public record CategoriaResponse(
        @Schema(example = "1") Long id,
        @Schema(example = "Accesorios") String nombre,
        @Schema(example = "Bolsos, gorras y complementos") String descripcion,
        LocalDateTime creadoEn
) {
    public static CategoriaResponse desde(Categoria c) {
        return new CategoriaResponse(c.getId(), c.getNombre(), c.getDescripcion(), c.getCreadoEn());
    }
}
