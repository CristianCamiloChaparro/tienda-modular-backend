package com.tienda.modular.controller;

import com.tienda.modular.dto.CodigoRequest;
import com.tienda.modular.dto.CsrfResponse;
import com.tienda.modular.dto.DosFactoresRequeridoResponse;
import com.tienda.modular.dto.LoginRequest;
import com.tienda.modular.dto.OlvidoPasswordRequest;
import com.tienda.modular.dto.RegistroRequest;
import com.tienda.modular.dto.RestablecerPasswordRequest;
import com.tienda.modular.dto.UsuarioResponse;
import com.tienda.modular.exception.ApiError;
import com.tienda.modular.security.UsuarioAutenticado;
import com.tienda.modular.service.AuthService;
import com.tienda.modular.service.CuentaService;
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
    private final CuentaService cuentaService;

    public AuthController(AuthService authService, CuentaService cuentaService) {
        this.authService = authService;
        this.cuentaService = cuentaService;
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
        return authService.perfil(usuario).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.noContent().build());
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
            description = "Valida correo y contrasena y crea la sesion (cookie JSESSIONID, HttpOnly). "
                    + "Si la cuenta tiene verificacion en dos pasos responde 202 y la sesion queda pendiente "
                    + "hasta enviar el codigo a /auth/login/2fa.")
    @ApiResponse(responseCode = "200", description = "Sesion iniciada",
            content = @Content(schema = @Schema(implementation = UsuarioResponse.class)))
    @ApiResponse(responseCode = "202", description = "Falta el codigo de la app autenticadora",
            content = @Content(schema = @Schema(implementation = DosFactoresRequeridoResponse.class)))
    @ApiResponse(responseCode = "401", description = "Correo o contrasena incorrectos",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "Falta el token CSRF",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public ResponseEntity<Object> login(@Valid @RequestBody LoginRequest datos,
                                        HttpServletRequest request, HttpServletResponse response) {
        Object resultado = authService.login(datos, request, response);
        return ResponseEntity.status(resultado instanceof DosFactoresRequeridoResponse
                ? HttpStatus.ACCEPTED : HttpStatus.OK).body(resultado);
    }

    @PostMapping("/login/2fa")
    @Operation(summary = "Segundo paso del login",
            description = "Codigo de 6 digitos de la app autenticadora. Vence a los 5 minutos y admite 5 intentos.")
    @ApiResponse(responseCode = "200", description = "Sesion iniciada")
    @ApiResponse(responseCode = "400", description = "Codigo incorrecto",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "401", description = "No hay un login pendiente o ya vencio",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "429", description = "Demasiados codigos incorrectos",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public UsuarioResponse loginDosFactores(@Valid @RequestBody CodigoRequest datos,
                                            HttpServletRequest request, HttpServletResponse response) {
        return authService.verificarSegundoFactor(datos.codigo(), request, response);
    }

    @PostMapping("/password/olvido")
    @ResponseStatus(HttpStatus.ACCEPTED)
    @Operation(summary = "Olvide mi contrasena",
            description = "Envia un enlace de restablecimiento al correo (vence en 30 minutos). Responde igual "
                    + "exista o no la cuenta, para no revelar que correos estan registrados.")
    @ApiResponse(responseCode = "202", description = "Solicitud recibida")
    public void olvidoPassword(@Valid @RequestBody OlvidoPasswordRequest datos) {
        cuentaService.solicitarRestablecimiento(datos.email());
    }

    @PostMapping("/password/restablecer")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Restablecer contrasena con el enlace del correo",
            description = "El enlace sirve una sola vez; al usarlo se invalidan los demas enlaces pendientes.")
    @ApiResponse(responseCode = "204", description = "Contrasena actualizada")
    @ApiResponse(responseCode = "400", description = "Enlace invalido o vencido, o contrasena debil",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public void restablecerPassword(@Valid @RequestBody RestablecerPasswordRequest datos) {
        cuentaService.restablecer(datos.token(), datos.password());
    }

    @PostMapping("/logout")
    @Operation(summary = "Cerrar sesion")
    @ApiResponse(responseCode = "204", description = "Sesion cerrada")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        authService.logout(request, response);
        return ResponseEntity.noContent().build();
    }
}
