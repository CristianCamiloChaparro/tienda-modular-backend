package com.tienda.modular.config;

import org.springframework.boot.context.event.ApplicationEnvironmentPreparedEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.core.env.Environment;

/**
 * Detiene el arranque con un mensaje claro si falta un secreto obligatorio. Sin esto, Spring Boot
 * usaria el texto "${DB_PASSWORD}" como clave y fallaria mas tarde con un error confuso de conexion.
 * Se registra en {@code TiendaModularApplication.main}: corre despues de leer el .env y antes de
 * crear cualquier bean.
 */
public class VerificadorDeSecretos implements ApplicationListener<ApplicationEnvironmentPreparedEvent> {

    @Override
    public void onApplicationEvent(ApplicationEnvironmentPreparedEvent event) {
        verificar(event.getEnvironment());
    }

    static void verificar(Environment entorno) {
        exigir(entorno, "spring.datasource.password", "DB_PASSWORD");
        if (entorno.getProperty("server.ssl.enabled", Boolean.class, false)) {
            exigir(entorno, "server.ssl.key-store-password", "SSL_PASSWORD");
        }
    }

    private static void exigir(Environment entorno, String propiedad, String variable) {
        String valor;
        try {
            valor = entorno.getProperty(propiedad);
        } catch (IllegalArgumentException sinDefinir) {
            // "Could not resolve placeholder": la variable no existe en el entorno ni en el .env
            valor = null;
        }
        if (valor == null || valor.isBlank()) {
            throw new IllegalStateException("Falta el secreto " + variable + ": definalo en el archivo .env "
                    + "junto al pom.xml (ver .env.example) o como variable de entorno");
        }
    }
}
