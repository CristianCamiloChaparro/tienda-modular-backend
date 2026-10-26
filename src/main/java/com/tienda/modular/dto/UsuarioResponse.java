package com.tienda.modular.dto;

import com.tienda.modular.model.Rol;
import com.tienda.modular.security.UsuarioAutenticado;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Usuario con sesion iniciada")
public record UsuarioResponse(
        @Schema(example = "2") Long id,
        @Schema(example = "Laura Gomez") String nombre,
        @Schema(example = "laura@correo.com") String email,
        @Schema(example = "CLIENTE") Rol rol
) {
    public static UsuarioResponse desde(UsuarioAutenticado u) {
        return new UsuarioResponse(u.id(), u.nombre(), u.email(), u.rol());
    }
}
