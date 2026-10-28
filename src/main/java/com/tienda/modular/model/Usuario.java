package com.tienda.modular.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Usuario registrado. La contrasena se guarda solo como hash BCrypt.
 * Tabla: usuarios
 */
@Entity
@Table(name = "usuarios",
        uniqueConstraints = @UniqueConstraint(name = "uk_usuario_email", columnNames = "email"))
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false, length = 150)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Rol rol;

    @Column(name = "creado_en", nullable = false, updatable = false)
    private LocalDateTime creadoEn;

    /** Secreto TOTP (Base32) de la verificacion en dos pasos; null si nunca se configuro. */
    @Column(name = "totp_secreto", length = 64)
    private String totpSecreto;

    @Column(name = "totp_activo", nullable = false, columnDefinition = "boolean default false")
    private boolean totpActivo;

    /** Ultimo intervalo de 30 s aceptado: impide reutilizar el mismo codigo. */
    @Column(name = "totp_ultimo_paso")
    private Long totpUltimoPaso;

    public Usuario() {
    }

    public Usuario(String nombre, String email, String passwordHash, Rol rol) {
        this.nombre = nombre;
        this.email = email;
        this.passwordHash = passwordHash;
        this.rol = rol;
    }

    @PrePersist
    void alCrear() {
        this.creadoEn = LocalDateTime.now();
    }

    public Long getId() { return id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public Rol getRol() { return rol; }
    public void setRol(Rol rol) { this.rol = rol; }

    public LocalDateTime getCreadoEn() { return creadoEn; }

    public String getTotpSecreto() { return totpSecreto; }
    public void setTotpSecreto(String totpSecreto) { this.totpSecreto = totpSecreto; }

    public boolean isTotpActivo() { return totpActivo; }
    public void setTotpActivo(boolean totpActivo) { this.totpActivo = totpActivo; }

    public Long getTotpUltimoPaso() { return totpUltimoPaso; }
    public void setTotpUltimoPaso(Long totpUltimoPaso) { this.totpUltimoPaso = totpUltimoPaso; }
}
