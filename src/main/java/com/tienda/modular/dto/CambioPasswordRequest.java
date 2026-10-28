package com.tienda.modular.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@Schema(description = "Cambio de contrasena con la sesion iniciada")
public record CambioPasswordRequest(
        @NotBlank(message = "La contraseña actual es obligatoria")
        String actual,

        @Schema(description = "Minimo 8 caracteres, con al menos una letra y un numero", example = "NuevaClave1")
        @NotBlank(message = "La contraseña nueva es obligatoria")
        @Size(min = 8, max = 72, message = "La contraseña debe tener entre 8 y 72 caracteres")
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$", message = "La contraseña debe tener al menos una letra y un número")
        String nueva
) {
}
