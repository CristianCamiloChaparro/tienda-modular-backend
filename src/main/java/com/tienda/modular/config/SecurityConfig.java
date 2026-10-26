package com.tienda.modular.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tienda.modular.security.ErroresSeguridadJson;
import com.tienda.modular.security.SpaCsrfTokenRequestHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRepository;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;

/**
 * Reglas de seguridad de la API:
 * - Catalogo (GET) y carrito: publicos.
 * - Crear/editar/eliminar categorias y productos, ver todos los pedidos: solo ADMIN.
 * - Pagar y ver mis pedidos: usuario autenticado.
 * - CSRF activo en todo POST/PUT/PATCH/DELETE (cookie XSRF-TOKEN + cabecera X-XSRF-TOKEN).
 * - Cabeceras contra XSS y clickjacking (CSP, X-Frame-Options, nosniff) y HSTS sobre HTTPS.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    static final String CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
            + "img-src 'self' data: https:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; "
            + "form-action 'self'";

    @Value("${app.security.require-https:false}")
    private boolean requiereHttps;

    @Value("${app.http.redirect-port:8080}")
    private int puertoHttp;

    @Value("${server.port:8080}")
    private int puertoHttps;

    @Bean
    public CsrfTokenRepository csrfTokenRepository() {
        // Legible por JavaScript del mismo origen (la SPA) pero no por otros sitios.
        CookieCsrfTokenRepository repositorio = CookieCsrfTokenRepository.withHttpOnlyFalse();
        repositorio.setCookieCustomizer(cookie -> cookie.sameSite("Lax"));
        return repositorio;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, ObjectMapper objectMapper,
                                                   CsrfTokenRepository csrfTokenRepository) throws Exception {
        ErroresSeguridadJson errores = new ErroresSeguridadJson(objectMapper);

        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf
                        .csrfTokenRepository(csrfTokenRepository)
                        .csrfTokenRequestHandler(new SpaCsrfTokenRequestHandler()))
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .exceptionHandling(e -> e
                        .authenticationEntryPoint(errores)
                        .accessDeniedHandler(errores))
                .headers(h -> h
                        .contentSecurityPolicy(csp -> csp.policyDirectives(CSP))
                        .frameOptions(f -> f.deny())
                        .referrerPolicy(r -> r.policy(
                                ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                        .httpStrictTransportSecurity(hsts -> hsts
                                .includeSubDomains(true)
                                .maxAgeInSeconds(31_536_000)))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/", "/error").permitAll()
                        .requestMatchers("/api/v1/docs", "/api/v1/docs/**", "/api/v1/api-docs/**",
                                "/swagger-ui/**", "/swagger-ui.html", "/api/v1/swagger-ui/**").permitAll()
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        .requestMatchers("/api/v1/carritos/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/categorias/**", "/api/v1/productos/**").permitAll()
                        .requestMatchers(HttpMethod.HEAD, "/api/v1/categorias/**", "/api/v1/productos/**").permitAll()
                        .requestMatchers("/api/v1/categorias/**", "/api/v1/productos/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/v1/pedidos").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/pedidos/*/estado").hasRole("ADMIN")
                        .requestMatchers("/api/v1/pedidos/**").authenticated()
                        .anyRequest().denyAll());

        if (requiereHttps) {
            // Cualquier peticion por http:// se redirige a https:// (puerto http -> puerto https)
            http.redirectToHttps(Customizer.withDefaults())
                    .portMapper(p -> p.http(80).mapsTo(443).http(puertoHttp).mapsTo(puertoHttps));
        }
        return http.build();
    }
}
