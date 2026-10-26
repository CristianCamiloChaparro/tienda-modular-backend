package com.tienda.modular.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Permite que el frontend en otro origen consuma la API enviando la cookie de sesion.
 * En desarrollo y produccion el frontend pasa por un proxy (mismo origen), asi que esto
 * solo aplica si se llama a la API directamente desde otro dominio permitido.
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Value("${app.cors.allowed-origins}")
    private String[] origenesPermitidos;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(origenesPermitidos)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("Content-Type", "Accept", "X-XSRF-TOKEN")
                .allowCredentials(true);
    }
}
