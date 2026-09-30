package com.tienda.modular.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Categoria de productos (ej. Ropa, Accesorios).
 * Tabla: categorias
 */
@Entity
@Table(name = "categorias",
        uniqueConstraints = @UniqueConstraint(name = "uk_categoria_nombre", columnNames = "nombre"))
public class Categoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String nombre;

    @Column(length = 255)
    private String descripcion;

    @Column(name = "creado_en", nullable = false, updatable = false)
    private LocalDateTime creadoEn;

    public Categoria() {
    }

    public Categoria(String nombre, String descripcion) {
        this.nombre = nombre;
        this.descripcion = descripcion;
    }

    @PrePersist
    void alCrear() {
        this.creadoEn = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public LocalDateTime getCreadoEn() { return creadoEn; }
}
