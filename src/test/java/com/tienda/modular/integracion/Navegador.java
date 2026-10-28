package com.tienda.modular.integracion;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Simula el navegador: guarda la sesion y la cookie XSRF-TOKEN, y envia la cabecera X-XSRF-TOKEN. */
final class Navegador {

    private final MockMvc mockMvc;
    private final ObjectMapper objectMapper;
    private final MockHttpSession sesion = new MockHttpSession();
    private Cookie xsrf;

    Navegador(MockMvc mockMvc, ObjectMapper objectMapper) {
        this.mockMvc = mockMvc;
        this.objectMapper = objectMapper;
    }

    MvcResult enviar(MockHttpServletRequestBuilder peticion, Object cuerpo, int estadoEsperado) throws Exception {
        if (xsrf == null) {
            xsrf = mockMvc.perform(get("/api/v1/auth/csrf").session(sesion)).andReturn()
                    .getResponse().getCookie("XSRF-TOKEN");
        }
        peticion.session(sesion).cookie(xsrf).header("X-XSRF-TOKEN", xsrf.getValue());
        if (cuerpo != null) {
            peticion.contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(cuerpo));
        }
        MvcResult resultado = mockMvc.perform(peticion).andExpect(status().is(estadoEsperado)).andReturn();
        Cookie nueva = resultado.getResponse().getCookie("XSRF-TOKEN");
        if (nueva != null && !nueva.getValue().isEmpty()) {
            xsrf = nueva;
        }
        return resultado;
    }

    JsonNode json(MockHttpServletRequestBuilder peticion, Object cuerpo, int estadoEsperado) throws Exception {
        return objectMapper.readTree(enviar(peticion, cuerpo, estadoEsperado).getResponse().getContentAsString());
    }
}
