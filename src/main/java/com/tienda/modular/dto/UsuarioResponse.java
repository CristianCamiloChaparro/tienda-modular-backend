package com.tienda.modular.dto;

import com.tienda.modular.model.Rol;
import com.tienda.modular.model.Usuario;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Usuario con sesion iniciada")
public record UsuarioResponse(
        @Schema(example = "2") Long id,
        @Schema(example = "Laura Gomez") String nombre,
        @Schema(example = "laura@correo.com") String email,
        @Schema(example = "CLIENTE") Rol rol,
        @Schema(description = "Verificacion en dos pasos activa", example = "false") boolean dosFactoresActivo
) {
    public static UsuarioResponse desde(Usuario u) {
        return new UsuarioResponse(u.getId(), u.getNombre(), u.getEmail(), u.getRol(), u.isTotpActivo());
    }
}
