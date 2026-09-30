package com.tienda.modular.dto;

import com.tienda.modular.model.Producto;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Schema(description = "Producto devuelto por la API")
public record ProductoResponse(
        @Schema(example = "1") Long id,
        @Schema(example = "1") Long categoriaId,
        @Schema(example = "Accesorios") String categoriaNombre,
        @Schema(example = "Gorra negra bordada") String nombre,
        String descripcion,
        @Schema(example = "45000.00") BigDecimal precio,
        @Schema(example = "20") Integer stock,
        String imagenUrl,
        boolean activo,
        LocalDateTime creadoEn
) {
    public static ProductoResponse desde(Producto p) {
        return new ProductoResponse(
                p.getId(),
                p.getCategoria().getId(),
                p.getCategoria().getNombre(),
                p.getNombre(),
                p.getDescripcion(),
                p.getPrecio(),
                p.getStock(),
                p.getImagenUrl(),
                p.isActivo(),
                p.getCreadoEn()
        );
    }
}
