package com.tienda.modular.dto;

import com.tienda.modular.model.EstadoPedido;
import com.tienda.modular.model.ItemPedido;
import com.tienda.modular.model.Pedido;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Schema(description = "Pedido pagado")
public record PedidoResponse(
        @Schema(example = "15") Long id,
        @Schema(example = "PAGADO") EstadoPedido estado,
        @Schema(example = "125000.00") BigDecimal total,
        String direccionEnvio,
        String telefono,
        @Schema(example = "PAY-8F2KQ93LZA") String referenciaPago,
        @Schema(example = "VISA **** 4242") String medioPago,
        @Schema(example = "Laura Gomez") String clienteNombre,
        @Schema(example = "laura@correo.com") String clienteEmail,
        LocalDateTime creadoEn,
        List<Item> items
) {

    @Schema(name = "ItemPedidoResponse", description = "Producto comprado")
    public record Item(
            @Schema(example = "1") Long productoId,
            @Schema(example = "Gorra negra bordada") String nombreProducto,
            @Schema(example = "2") int cantidad,
            @Schema(example = "45000.00") BigDecimal precioUnitario,
            @Schema(example = "90000.00") BigDecimal subtotal
    ) {
        static Item desde(ItemPedido i) {
            return new Item(i.getProductoId(), i.getNombreProducto(), i.getCantidad(),
                    i.getPrecioUnitario(), i.calcularSubtotal());
        }
    }

    public static PedidoResponse desde(Pedido p) {
        return new PedidoResponse(p.getId(), p.getEstado(), p.getTotal(), p.getDireccionEnvio(), p.getTelefono(),
                p.getReferenciaPago(), p.getMedioPago(), p.getUsuario().getNombre(), p.getUsuario().getEmail(),
                p.getCreadoEn(), p.getItems().stream().map(Item::desde).toList());
    }
}
