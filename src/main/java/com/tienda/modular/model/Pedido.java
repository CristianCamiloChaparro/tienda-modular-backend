package com.tienda.modular.model;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Pedido generado al pagar un carrito. Guarda una copia de los productos y precios
 * para que el historial no cambie si luego se edita o elimina el producto.
 * Tabla: pedidos
 */
@Entity
@Table(name = "pedidos")
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_pedido_usuario"))
    private Usuario usuario;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoPedido estado;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal total;

    @Column(name = "direccion_envio", nullable = false, length = 200)
    private String direccionEnvio;

    @Column(nullable = false, length = 20)
    private String telefono;

    @Column(name = "referencia_pago", nullable = false, length = 40)
    private String referenciaPago;

    @Column(name = "medio_pago", nullable = false, length = 40)
    private String medioPago;

    @Column(name = "creado_en", nullable = false, updatable = false)
    private LocalDateTime creadoEn;

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ItemPedido> items = new ArrayList<>();

    public Pedido() {
    }

    @PrePersist
    void alCrear() {
        this.creadoEn = LocalDateTime.now();
    }

    public void agregarItem(ItemPedido item) {
        item.setPedido(this);
        items.add(item);
    }

    public Long getId() { return id; }

    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }

    public EstadoPedido getEstado() { return estado; }
    public void setEstado(EstadoPedido estado) { this.estado = estado; }

    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }

    public String getDireccionEnvio() { return direccionEnvio; }
    public void setDireccionEnvio(String direccionEnvio) { this.direccionEnvio = direccionEnvio; }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }

    public String getReferenciaPago() { return referenciaPago; }
    public void setReferenciaPago(String referenciaPago) { this.referenciaPago = referenciaPago; }

    public String getMedioPago() { return medioPago; }
    public void setMedioPago(String medioPago) { this.medioPago = medioPago; }

    public LocalDateTime getCreadoEn() { return creadoEn; }

    public List<ItemPedido> getItems() { return items; }
}
