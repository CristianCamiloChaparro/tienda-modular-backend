package com.tienda.modular.model;

import jakarta.persistence.*;
import org.hibernate.annotations.Check;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Producto del catalogo, vinculado obligatoriamente a una Categoria.
 * Tabla: productos  (FK categoria_id -> categorias.id)
 */
@Entity
@Table(name = "productos")
@Check(constraints = "precio > 0 AND stock >= 0")
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "categoria_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_producto_categoria"))
    private Categoria categoria;

    @Column(nullable = false, length = 120)
    private String nombre;

    @Column(length = 1000)
    private String descripcion;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal precio;

    @Column(nullable = false)
    private Integer stock;

    @Column(name = "imagen_url", length = 500)
    private String imagenUrl;

    @Column(nullable = false)
    private boolean activo = true;

    @Column(name = "creado_en", nullable = false, updatable = false)
    private LocalDateTime creadoEn;

    public Producto() {
    }

    @PrePersist
    void alCrear() {
        this.creadoEn = LocalDateTime.now();
    }

    /**
     * Descuenta (cantidad negativa) o repone (cantidad positiva) existencias.
     * @return false si la operacion dejaria el stock en negativo.
     */
    public boolean actualizarStock(int cantidad) {
        int nuevo = this.stock + cantidad;
        if (nuevo < 0) {
            return false;
        }
        this.stock = nuevo;
        return true;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Categoria getCategoria() { return categoria; }
    public void setCategoria(Categoria categoria) { this.categoria = categoria; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public BigDecimal getPrecio() { return precio; }
    public void setPrecio(BigDecimal precio) { this.precio = precio; }

    public Integer getStock() { return stock; }
    public void setStock(Integer stock) { this.stock = stock; }

    public String getImagenUrl() { return imagenUrl; }
    public void setImagenUrl(String imagenUrl) { this.imagenUrl = imagenUrl; }

    public boolean isActivo() { return activo; }
    public void setActivo(boolean activo) { this.activo = activo; }

    public LocalDateTime getCreadoEn() { return creadoEn; }
}
