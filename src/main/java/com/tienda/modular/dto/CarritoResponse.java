package com.tienda.modular.dto;

import com.tienda.modular.model.Carrito;
import com.tienda.modular.model.ItemCarrito;
import com.tienda.modular.model.Producto;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Schema(description = "Carrito con sus productos y el total calculado por el backend")
public record CarritoResponse(
        @Schema(example = "3f1c2a9e-8b7d-4e21-9c55-2f0d6a1b7e44") String id,
        List<Item> items,
        @Schema(description = "Suma de unidades", example = "3") int totalUnidades,
        @Schema(example = "125000.00") BigDecimal total,
        LocalDateTime fechaActualizacion
) {

    @Schema(name = "ItemCarritoResponse", description = "Linea del carrito")
    public record Item(
            @Schema(example = "1") Long productoId,
            @Schema(example = "Gorra negra bordada") String nombre,
            String imagenUrl,
            @Schema(example = "Accesorios") String categoriaNombre,
            @Schema(example = "45000.00") BigDecimal precioUnitario,
            @Schema(example = "2") int cantidad,
            @Schema(example = "90000.00") BigDecimal subtotal,
            @Schema(description = "Unidades en inventario", example = "20") int stockDisponible
    ) {
        static Item desde(ItemCarrito i) {
            Producto p = i.getProducto();
            return new Item(p.getId(), p.getNombre(), p.getImagenUrl(), p.getCategoria().getNombre(),
                    i.getPrecioUnitario(), i.getCantidad(), i.calcularSubtotal(), p.getStock());
        }
    }

    public static CarritoResponse desde(Carrito c) {
        List<Item> items = c.getItems().stream()
                .sorted(Comparator.comparing(i -> i.getProducto().getNombre()))
                .map(Item::desde)
                .toList();
        return new CarritoResponse(c.getId(), items, c.contarUnidades(), c.calcularTotal(), c.getFechaActualizacion());
    }
}
