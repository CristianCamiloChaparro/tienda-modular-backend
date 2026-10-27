package com.tienda.modular.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Convierte las excepciones en respuestas JSON uniformes (nunca HTML). Hacia afuera solo salen
 * mensajes pensados para el usuario; trazas, nombres de clases y SQL quedan en el log del servidor.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(RecursoNoEncontradoException.class)
    public ResponseEntity<ApiError> noEncontrado(RecursoNoEncontradoException ex, HttpServletRequest req) {
        return construir(HttpStatus.NOT_FOUND, ex.getMessage(), req, null);
    }

    @ExceptionHandler(ReglaNegocioException.class)
    public ResponseEntity<ApiError> reglaNegocio(ReglaNegocioException ex, HttpServletRequest req) {
        return construir(HttpStatus.CONFLICT, ex.getMessage(), req, null);
    }

    @ExceptionHandler(DatoInvalidoException.class)
    public ResponseEntity<ApiError> datoInvalido(DatoInvalidoException ex, HttpServletRequest req) {
        return construir(HttpStatus.BAD_REQUEST, ex.getMessage(), req, Map.of(ex.getCampo(), ex.getMessage()));
    }

    @ExceptionHandler(PagoRechazadoException.class)
    public ResponseEntity<ApiError> pagoRechazado(PagoRechazadoException ex, HttpServletRequest req) {
        return construir(HttpStatus.PAYMENT_REQUIRED, ex.getMessage(), req, null);
    }

    @ExceptionHandler(DemasiadosIntentosException.class)
    public ResponseEntity<ApiError> demasiadosIntentos(DemasiadosIntentosException ex, HttpServletRequest req) {
        ResponseEntity<ApiError> respuesta = construir(HttpStatus.TOO_MANY_REQUESTS, ex.getMessage(), req, null);
        return ResponseEntity.status(respuesta.getStatusCode())
                .header(HttpHeaders.RETRY_AFTER, String.valueOf(ex.getEspera().toSeconds()))
                .body(respuesta.getBody());
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiError> credenciales(AuthenticationException ex, HttpServletRequest req) {
        // Mismo mensaje si el correo no existe o si la clave es incorrecta: no revela que cuentas existen.
        return construir(HttpStatus.UNAUTHORIZED, "Correo o contrasena incorrectos", req, null);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> accesoDenegado(AccessDeniedException ex, HttpServletRequest req) {
        return construir(HttpStatus.FORBIDDEN, "No tienes permisos para realizar esta operacion", req, null);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> argumentoInvalido(IllegalArgumentException ex, HttpServletRequest req) {
        // El mensaje puede venir de una libreria y revelar detalles internos: solo va al log.
        log.warn("Argumento invalido en {} {}: {}", req.getMethod(), req.getRequestURI(), ex.getMessage());
        return construir(HttpStatus.BAD_REQUEST, "La solicitud contiene datos invalidos", req, null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> validacion(MethodArgumentNotValidException ex, HttpServletRequest req) {
        Map<String, String> campos = new LinkedHashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            campos.putIfAbsent(fe.getField(), fe.getDefaultMessage());
        }
        return construir(HttpStatus.BAD_REQUEST, "Hay datos invalidos en la solicitud", req, campos);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> jsonInvalido(HttpMessageNotReadableException ex, HttpServletRequest req) {
        return construir(HttpStatus.BAD_REQUEST, "El cuerpo JSON esta mal formado o tiene tipos incorrectos", req, null);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiError> tipoParametro(MethodArgumentTypeMismatchException ex, HttpServletRequest req) {
        return construir(HttpStatus.BAD_REQUEST,
                "El parametro '" + ex.getName() + "' tiene un valor invalido", req, null);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> integridad(DataIntegrityViolationException ex, HttpServletRequest req) {
        return construir(HttpStatus.CONFLICT,
                "La operacion viola una restriccion de integridad de la base de datos", req, null);
    }

    /**
     * Ultima red: errores propios de Spring MVC (ruta inexistente, metodo no permitido...) conservan su
     * codigo; cualquier otro error falla de forma segura con un 500 generico y el detalle en el log.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> noControlada(Exception ex, HttpServletRequest req) {
        if (ex instanceof ErrorResponse errorSpring) {
            HttpStatus status = HttpStatus.valueOf(errorSpring.getStatusCode().value());
            return construir(status, status.getReasonPhrase(), req, null);
        }
        log.error("Error no controlado en {} {}", req.getMethod(), req.getRequestURI(), ex);
        return construir(HttpStatus.INTERNAL_SERVER_ERROR,
                "Ocurrio un error interno. Intente de nuevo mas tarde", req, null);
    }

    private ResponseEntity<ApiError> construir(HttpStatus status, String mensaje,
                                               HttpServletRequest req, Map<String, String> campos) {
        ApiError body = new ApiError(LocalDateTime.now(), status.value(), status.getReasonPhrase(),
                mensaje, req.getRequestURI(), campos);
        return ResponseEntity.status(status).body(body);
    }
}
