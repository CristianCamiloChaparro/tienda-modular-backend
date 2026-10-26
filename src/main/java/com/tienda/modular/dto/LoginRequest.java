package com.tienda.modular.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Credenciales para iniciar sesion")
public record LoginRequest(

        @Schema(example = "cliente@correo.com")
        @NotBlank(message = "El correo es obligatorio")
        @Email(message = "El correo no tiene un formato valido")
        String email,

        @Schema(example = "Clave1234")
        @NotBlank(message = "La contrasena es obligatoria")
        String password
) {
}
