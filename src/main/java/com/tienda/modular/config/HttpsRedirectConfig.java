package com.tienda.modular.config;

import org.apache.catalina.connector.Connector;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/** Perfil "https": abre tambien el puerto http para que Spring Security lo redirija a https. */
@Configuration
@Profile("https")
public class HttpsRedirectConfig {

    @Bean
    public WebServerFactoryCustomizer<TomcatServletWebServerFactory> conectorHttp(
            @Value("${app.http.redirect-port}") int puertoHttp,
            @Value("${server.port}") int puertoHttps) {
        return factory -> {
            Connector conector = new Connector(TomcatServletWebServerFactory.DEFAULT_PROTOCOL);
            conector.setScheme("http");
            conector.setPort(puertoHttp);
            conector.setSecure(false);
            conector.setRedirectPort(puertoHttps);
            factory.addAdditionalTomcatConnectors(conector);
        };
    }
}
