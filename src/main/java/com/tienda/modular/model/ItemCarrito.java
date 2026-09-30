package com.tienda.modular.model;

import jakarta.persistence.*;

import java.math.BigDecimal;

/**
 * Linea del carrito: un producto con su cantidad y el precio unitario congelado
 * al momento de agregarlo. Tabla: items_carrito
 */
@Entity
@Table(name = "items_carrito",
        uniqueConstraints = @UniqueConstraint(name = "uk_item_carrito_producto",
                columnNames = {"carrito_id", "producto_id"}))
public class ItemCarrito {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "carrito_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_item_carrito"))
    private Carrito carrito;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "producto_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_item_producto"))
    private Producto producto;

    @Column(nullable = false)
    private Integer cantidad;

    @Column(name = "precio_unitario", nullable = false, precision = 12, scale = 2)
    private BigDecimal precioUnitario;

    public ItemCarrito() {
    }

    public ItemCarrito(Carrito carrito, Producto producto, int cantidad, BigDecimal precioUnitario) {
        this.carrito = carrito;
        this.producto = producto;
        this.cantidad = cantidad;
        this.precioUnitario = precioUnitario;
    }

    public BigDecimal calcularSubtotal() {
        return precioUnitario.multiply(BigDecimal.valueOf(cantidad));
    }

    public void actualizarCantidad(int nuevaCantidad) {
        if (nuevaCantidad < 1) {
            throw new IllegalArgumentException("La cantidad debe ser al menos 1");
        }
        this.cantidad = nuevaCantidad;
    }

    public Long getId() { return id; }
    public Carrito getCarrito() { return carrito; }
    public Producto getProducto() { return producto; }
    public Integer getCantidad() { return cantidad; }
    public BigDecimal getPrecioUnitario() { return precioUnitario; }
}
