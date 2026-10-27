package com.tienda.modular;

import com.tienda.modular.config.VerificadorDeSecretos;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class TiendaModularApplication {

    public static void main(String[] args) {
        SpringApplication aplicacion = new SpringApplication(TiendaModularApplication.class);
        aplicacion.addListeners(new VerificadorDeSecretos());
        aplicacion.run(args);
    }
}
