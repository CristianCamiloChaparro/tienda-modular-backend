package com.tienda.modular.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/** Convierte las excepciones en respuestas JSON uniformes (nunca HTML). */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RecursoNoEncontradoException.class)
    public ResponseEntity<ApiError> noEncontrado(RecursoNoEncontradoException ex, HttpServletRequest req) {
        return construir(HttpStatus.NOT_FOUND, ex.getMessage(), req, null);
    }

    @ExceptionHandler(ReglaNegocioException.class)
    public ResponseEntity<ApiError> reglaNegocio(ReglaNegocioException ex, HttpServletRequest req) {
        return construir(HttpStatus.CONFLICT, ex.getMessage(), req, null);
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

    private ResponseEntity<ApiError> construir(HttpStatus status, String mensaje,
                                               HttpServletRequest req, Map<String, String> campos) {
        ApiError body = new ApiError(LocalDateTime.now(), status.value(), status.getReasonPhrase(),
                mensaje, req.getRequestURI(), campos);
        return ResponseEntity.status(status).body(body);
    }
}
