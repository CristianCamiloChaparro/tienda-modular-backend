package com.tienda.modular.repository;

import com.tienda.modular.model.TokenRestablecimiento;
import com.tienda.modular.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.Optional;

public interface TokenRestablecimientoRepository extends JpaRepository<TokenRestablecimiento, Long> {

    Optional<TokenRestablecimiento> findByTokenHash(String tokenHash);

    boolean existsByUsuarioAndCreadoEnAfter(Usuario usuario, LocalDateTime desde);

    /** Invalida los enlaces pendientes del usuario (al pedir uno nuevo o al cambiar la contrasena). */
    @Modifying
    @Query("update TokenRestablecimiento t set t.usadoEn = :ahora where t.usuario = :usuario and t.usadoEn is null")
    int invalidarPendientes(Usuario usuario, LocalDateTime ahora);
}
