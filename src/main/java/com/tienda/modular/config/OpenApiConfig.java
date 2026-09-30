package com.tienda.modular.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI tiendaOpenApi() {
        return new OpenAPI().info(new Info()
                .title("Tienda en Linea Modular - API REST")
                .version("v1 (Semana 11)")
                .description("""
                        API desacoplada que expone en JSON las categorias y productos de la tienda.
                        El backend no renderiza vistas: toda interaccion del frontend pasa por estos endpoints.

                        Errores: todas las respuestas de error usan el esquema ApiError
                        (400 datos invalidos, 404 recurso inexistente, 409 conflicto de integridad).""")
                .contact(new Contact().name("Gustavo Andres Nunez Vega y Cristian Camilo Chaparro")));
    }
}
