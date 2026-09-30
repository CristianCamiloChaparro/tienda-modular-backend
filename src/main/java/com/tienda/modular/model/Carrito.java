package com.tienda.modular.model;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Carrito de compras identificado por un UUID (sesion anonima del visitante).
 * Tabla: carritos. Sus endpoints se implementan en la semana 13.
 */
@Entity
@Table(name = "carritos")
public class Carrito {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "fecha_actualizacion", nullable = false)
    private LocalDateTime fechaActualizacion;

    @OneToMany(mappedBy = "carrito", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ItemCarrito> items = new ArrayList<>();

    public Carrito() {
    }

    @PrePersist
    void alCrear() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        this.fechaActualizacion = LocalDateTime.now();
    }

    @PreUpdate
    void alActualizar() {
        this.fechaActualizacion = LocalDateTime.now();
    }

    public void agregarProducto(Producto producto, int cantidad) {
        for (ItemCarrito item : items) {
            if (item.getProducto().getId().equals(producto.getId())) {
                item.actualizarCantidad(item.getCantidad() + cantidad);
                return;
            }
        }
        items.add(new ItemCarrito(this, producto, cantidad, producto.getPrecio()));
    }

    public void modificarCantidad(Long productoId, int cantidad) {
        for (ItemCarrito item : items) {
            if (item.getProducto().getId().equals(productoId)) {
                item.actualizarCantidad(cantidad);
                return;
            }
        }
    }

    public void eliminarProducto(Long productoId) {
        items.removeIf(item -> item.getProducto().getId().equals(productoId));
    }

    public void vaciarCarrito() {
        items.clear();
    }

    public BigDecimal calcularTotal() {
        return items.stream()
                .map(ItemCarrito::calcularSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public String getId() { return id; }
    public LocalDateTime getFechaActualizacion() { return fechaActualizacion; }
    public List<ItemCarrito> getItems() { return items; }
}
