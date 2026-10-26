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
                .version("v1")
                .description("""
                        API desacoplada de la tienda: catalogo, carrito, autenticacion, pagos y pedidos.
                        El backend no renderiza vistas: toda interaccion del frontend pasa por estos endpoints.

                        **Como probar desde esta pagina**
                        1. `GET /api/v1/auth/csrf` deja la cookie `XSRF-TOKEN`; Swagger la envia sola en la cabecera
                           `X-XSRF-TOKEN` en cada POST/PUT/PATCH/DELETE.
                        2. `POST /api/v1/auth/login` con el usuario administrador para crear, editar o eliminar
                           categorias y productos, o con una cuenta de cliente (`POST /api/v1/auth/registro`) para pagar.
                        3. Carrito: `POST /api/v1/carritos`, luego `POST /api/v1/carritos/{id}/items`.
                        4. Pago: `POST /api/v1/pedidos` con la tarjeta de prueba 4242 4242 4242 4242.

                        **Permisos**: catalogo y carrito son publicos; crear/editar/eliminar categorias y productos
                        requiere rol ADMIN; pagar y ver pedidos requiere sesion.

                        **Errores**: todas las respuestas de error usan el esquema ApiError
                        (400 datos invalidos, 401 sin sesion, 402 pago rechazado, 403 sin permiso o sin token CSRF,
                        404 recurso inexistente, 409 conflicto de negocio).""")
                .contact(new Contact().name("Gustavo Andres Nunez Vega y Cristian Camilo Chaparro")));
    }
}
