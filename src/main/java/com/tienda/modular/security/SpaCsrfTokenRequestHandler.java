package com.tienda.modular.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.csrf.CsrfTokenRequestHandler;
import org.springframework.security.web.csrf.XorCsrfTokenRequestAttributeHandler;
import org.springframework.util.StringUtils;

import java.util.function.Supplier;

/**
 * Proteccion CSRF para una SPA (patron "double submit cookie" de Spring Security):
 * el backend envia la cookie XSRF-TOKEN y el frontend debe devolver su valor en la
 * cabecera X-XSRF-TOKEN en cada POST/PUT/PATCH/DELETE. Un sitio malicioso no puede leer
 * esa cookie, asi que no puede falsificar la cabecera.
 */
public final class SpaCsrfTokenRequestHandler implements CsrfTokenRequestHandler {

    private final CsrfTokenRequestHandler plano = new CsrfTokenRequestAttributeHandler();
    private final CsrfTokenRequestHandler xor = new XorCsrfTokenRequestAttributeHandler();

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, Supplier<CsrfToken> csrfToken) {
        // Proteccion BREACH cuando el token se incluye en el cuerpo de una respuesta.
        this.xor.handle(request, response, csrfToken);
        // Fuerza que la cookie se genere en cada respuesta.
        csrfToken.get();
    }

    @Override
    public String resolveCsrfTokenValue(HttpServletRequest request, CsrfToken csrfToken) {
        String cabecera = request.getHeader(csrfToken.getHeaderName());
        // La SPA envia el valor crudo de la cookie en la cabecera; un formulario enviaria el token enmascarado.
        return (StringUtils.hasText(cabecera) ? this.plano : this.xor).resolveCsrfTokenValue(request, csrfToken);
    }
}
