package com.tienda.modular.model;

import jakarta.persistence.*;

import java.math.BigDecimal;

/**
 * Linea de un pedido. Guarda el id, nombre y precio del producto al momento de la compra
 * (sin llave foranea) para conservar el historial aunque el producto se elimine.
 * Tabla: items_pedido
 */
@Entity
@Table(name = "items_pedido")
public class ItemPedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pedido_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_item_pedido"))
    private Pedido pedido;

    @Column(name = "producto_id", nullable = false)
    private Long productoId;

    @Column(name = "nombre_producto", nullable = false, length = 120)
    private String nombreProducto;

    @Column(nullable = false)
    private Integer cantidad;

    @Column(name = "precio_unitario", nullable = false, precision = 12, scale = 2)
    private BigDecimal precioUnitario;

    public ItemPedido() {
    }

    public ItemPedido(Long productoId, String nombreProducto, int cantidad, BigDecimal precioUnitario) {
        this.productoId = productoId;
        this.nombreProducto = nombreProducto;
        this.cantidad = cantidad;
        this.precioUnitario = precioUnitario;
    }

    public BigDecimal calcularSubtotal() {
        return precioUnitario.multiply(BigDecimal.valueOf(cantidad));
    }

    public Long getId() { return id; }

    public Pedido getPedido() { return pedido; }
    void setPedido(Pedido pedido) { this.pedido = pedido; }

    public Long getProductoId() { return productoId; }
    public String getNombreProducto() { return nombreProducto; }
    public Integer getCantidad() { return cantidad; }
    public BigDecimal getPrecioUnitario() { return precioUnitario; }
}
