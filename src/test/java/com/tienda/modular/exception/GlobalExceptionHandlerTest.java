package com.tienda.modular.exception;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Parte 6.4: los errores salen genericos hacia afuera; el detalle queda en el log. */
class GlobalExceptionHandlerTest {

    @RestController
    static class ControladorQueFalla {
        @GetMapping("/falla")
        String falla() {
            throw new IllegalStateException("Conexion a jdbc:postgresql://db-interna:5432 con usuario tienda fallo");
        }

        @GetMapping("/argumento")
        String argumento() {
            throw new IllegalArgumentException("Invalid UUID string: com.tienda.modular.model.Carrito#42");
        }
    }

    private final MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new ControladorQueFalla())
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();

    @Test
    @DisplayName("Un error no controlado responde 500 con un mensaje generico, sin detalles internos")
    void errorNoControlado_500Generico() throws Exception {
        mockMvc.perform(get("/falla"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.mensaje").value("Ocurrio un error interno. Intente de nuevo mas tarde"))
                .andExpect(content().string(not(containsString("jdbc"))))
                .andExpect(content().string(not(containsString("Exception"))));
    }

    @Test
    @DisplayName("Un IllegalArgumentException no expone su mensaje interno")
    void argumentoInvalido_400SinDetalle() throws Exception {
        mockMvc.perform(get("/argumento"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensaje").value("La solicitud contiene datos invalidos"))
                .andExpect(content().string(not(containsString("com.tienda"))));
    }

    @Test
    @DisplayName("Los errores de Spring MVC conservan su codigo (405) en lugar de convertirse en 500")
    void metodoNoPermitido_405() throws Exception {
        mockMvc.perform(post("/falla"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.status").value(405));
    }
}
