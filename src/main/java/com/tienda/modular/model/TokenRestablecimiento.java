package com.tienda.modular.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Enlace de "olvide mi contrasena". Solo se guarda el hash SHA-256 del token: quien lea la base de datos
 * no puede usar los enlaces. Vence a los 30 minutos y sirve una sola vez.
 * Tabla: tokens_restablecimiento
 */
@Entity
@Table(name = "tokens_restablecimiento",
        uniqueConstraints = @UniqueConstraint(name = "uk_token_hash", columnNames = "token_hash"))
public class TokenRestablecimiento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "token_hash", nullable = false, length = 64)
    private String tokenHash;

    @Column(name = "expira_en", nullable = false)
    private LocalDateTime expiraEn;

    @Column(name = "usado_en")
    private LocalDateTime usadoEn;

    @Column(name = "creado_en", nullable = false, updatable = false)
    private LocalDateTime creadoEn;

    public TokenRestablecimiento() {
    }

    public TokenRestablecimiento(Usuario usuario, String tokenHash, LocalDateTime expiraEn) {
        this.usuario = usuario;
        this.tokenHash = tokenHash;
        this.expiraEn = expiraEn;
    }

    @PrePersist
    void alCrear() {
        this.creadoEn = LocalDateTime.now();
    }

    public boolean vigente(LocalDateTime ahora) {
        return usadoEn == null && ahora.isBefore(expiraEn);
    }

    public Long getId() { return id; }
    public Usuario getUsuario() { return usuario; }
    public String getTokenHash() { return tokenHash; }
    public LocalDateTime getExpiraEn() { return expiraEn; }
    public LocalDateTime getUsadoEn() { return usadoEn; }
    public void setUsadoEn(LocalDateTime usadoEn) { this.usadoEn = usadoEn; }
    public LocalDateTime getCreadoEn() { return creadoEn; }
}
