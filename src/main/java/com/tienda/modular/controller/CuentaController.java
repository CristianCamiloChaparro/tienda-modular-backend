package com.tienda.modular.controller;

import com.tienda.modular.dto.CambioPasswordRequest;
import com.tienda.modular.dto.CodigoRequest;
import com.tienda.modular.dto.ConfiguracionDosFactoresResponse;
import com.tienda.modular.dto.UsuarioResponse;
import com.tienda.modular.exception.ApiError;
import com.tienda.modular.security.UsuarioAutenticado;
import com.tienda.modular.service.CuentaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth/cuenta")
@Tag(name = "Mi cuenta", description = "Cambio de contrasena y verificacion en dos pasos (requiere sesion)")
@ApiResponse(responseCode = "401", description = "Sin sesion",
        content = @Content(schema = @Schema(implementation = ApiError.class)))
@ApiResponse(responseCode = "429", description = "Demasiados intentos fallidos: se cierra la sesion",
        content = @Content(schema = @Schema(implementation = ApiError.class)))
public class CuentaController {

    private final CuentaService cuentaService;

    public CuentaController(CuentaService cuentaService) {
        this.cuentaService = cuentaService;
    }

    @PostMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Cambiar contrasena", description = "Pide la contrasena actual.")
    @ApiResponse(responseCode = "204", description = "Contrasena actualizada")
    @ApiResponse(responseCode = "400", description = "Contrasena actual incorrecta o nueva invalida",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public void cambiarPassword(@AuthenticationPrincipal UsuarioAutenticado usuario,
                                @Valid @RequestBody CambioPasswordRequest datos, HttpSession sesion) {
        cuentaService.cambiarPassword(usuario, datos.actual(), datos.nueva(), sesion);
    }

    @PostMapping("/2fa/iniciar")
    @Operation(summary = "Configurar verificacion en dos pasos",
            description = "Genera el secreto y el enlace otpauth:// para el codigo QR. No se activa hasta confirmar con un codigo.")
    @ApiResponse(responseCode = "200", description = "Secreto generado")
    @ApiResponse(responseCode = "409", description = "Ya estaba activa",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public ConfiguracionDosFactoresResponse iniciarDosFactores(@AuthenticationPrincipal UsuarioAutenticado usuario,
                                                               HttpSession sesion) {
        return cuentaService.iniciarDosFactores(usuario, sesion);
    }

    @PostMapping("/2fa/activar")
    @Operation(summary = "Activar verificacion en dos pasos", description = "Confirma con el primer codigo de la app.")
    @ApiResponse(responseCode = "200", description = "Activada")
    @ApiResponse(responseCode = "400", description = "Codigo incorrecto",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public UsuarioResponse activarDosFactores(@AuthenticationPrincipal UsuarioAutenticado usuario,
                                              @Valid @RequestBody CodigoRequest datos, HttpSession sesion) {
        return cuentaService.activarDosFactores(usuario, datos.codigo(), sesion);
    }

    @PostMapping("/2fa/desactivar")
    @Operation(summary = "Desactivar verificacion en dos pasos", description = "Pide un codigo vigente de la app.")
    @ApiResponse(responseCode = "200", description = "Desactivada")
    @ApiResponse(responseCode = "400", description = "Codigo incorrecto",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public UsuarioResponse desactivarDosFactores(@AuthenticationPrincipal UsuarioAutenticado usuario,
                                                 @Valid @RequestBody CodigoRequest datos, HttpSession sesion) {
        return cuentaService.desactivarDosFactores(usuario, datos.codigo(), sesion);
    }
}
