package com.tienda.modular.controller;

import com.tienda.modular.dto.CsrfResponse;
import com.tienda.modular.dto.LoginRequest;
import com.tienda.modular.dto.RegistroRequest;
import com.tienda.modular.dto.UsuarioResponse;
import com.tienda.modular.exception.ApiError;
import com.tienda.modular.security.UsuarioAutenticado;
import com.tienda.modular.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Autenticacion", description = "Registro, inicio y cierre de sesion (cookie de sesion HttpOnly + token CSRF)")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/csrf")
    @Operation(summary = "Obtener token CSRF",
            description = "Deja en el navegador la cookie XSRF-TOKEN. Su valor debe enviarse en la cabecera "
                    + "X-XSRF-TOKEN en todo POST, PUT, PATCH y DELETE. Swagger UI lo hace automaticamente.")
    @ApiResponse(responseCode = "200", description = "Cookie XSRF-TOKEN emitida")
    public CsrfResponse csrf() {
        return new CsrfResponse("XSRF-TOKEN", "X-XSRF-TOKEN");
    }

    @GetMapping("/me")
    @Operation(summary = "Usuario con sesion iniciada", description = "204 si nadie ha iniciado sesion.")
    @ApiResponse(responseCode = "200", description = "Sesion activa")
    @ApiResponse(responseCode = "204", description = "Sin sesion", content = @Content)
    public ResponseEntity<UsuarioResponse> me(@AuthenticationPrincipal UsuarioAutenticado usuario) {
        return usuario == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(UsuarioResponse.desde(usuario));
    }

    @PostMapping("/registro")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Crear cuenta de cliente", description = "Crea la cuenta e inicia sesion de inmediato.")
    @ApiResponse(responseCode = "201", description = "Cuenta creada y sesion iniciada")
    @ApiResponse(responseCode = "400", description = "Datos invalidos",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "Falta el token CSRF",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "El correo ya esta registrado",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public UsuarioResponse registro(@Valid @RequestBody RegistroRequest datos,
                                    HttpServletRequest request, HttpServletResponse response) {
        return authService.registrar(datos, request, response);
    }

    @PostMapping("/login")
    @Operation(summary = "Iniciar sesion",
            description = "Valida correo y contrasena y crea la sesion (cookie JSESSIONID, HttpOnly).")
    @ApiResponse(responseCode = "200", description = "Sesion iniciada")
    @ApiResponse(responseCode = "401", description = "Correo o contrasena incorrectos",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "Falta el token CSRF",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public UsuarioResponse login(@Valid @RequestBody LoginRequest datos,
                                 HttpServletRequest request, HttpServletResponse response) {
        return authService.login(datos, request, response);
    }

    @PostMapping("/logout")
    @Operation(summary = "Cerrar sesion")
    @ApiResponse(responseCode = "204", description = "Sesion cerrada")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        authService.logout(request, response);
        return ResponseEntity.noContent().build();
    }
}
