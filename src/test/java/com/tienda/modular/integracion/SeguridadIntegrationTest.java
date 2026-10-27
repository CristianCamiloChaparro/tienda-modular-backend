package com.tienda.modular.integracion;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tienda.modular.model.Rol;
import com.tienda.modular.repository.UsuarioRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

/** Pruebas del laboratorio de seguridad (ver INFORME_SEGURIDAD.md) sobre la aplicacion completa. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SeguridadIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UsuarioRepository usuarioRepository;

    /** IP propia por prueba: el limite de intentos de login se cuenta por IP y no debe cruzarse. */
    private Navegador navegador(String ip) {
        return new Navegador(mockMvc, objectMapper, ip);
    }

    // ---------- Parte 2: registro, hash y limite de intentos ----------

    @Test
    @DisplayName("Parte 2: la contrasena se guarda como hash BCrypt de costo 12, nunca la clave original")
    void registro_guardaHashBcrypt() throws Exception {
        navegador("10.0.2.1").enviar(post("/api/v1/auth/registro"),
                Map.of("nombre", "Hash", "email", "hash@correo.com", "password", "ClaveSegura2026"), 201);

        String hash = usuarioRepository.findByEmailIgnoreCase("hash@correo.com").orElseThrow().getPasswordHash();
        assertTrue(hash.startsWith("$2a$12$"), "Debe ser BCrypt costo 12: " + hash);
        assertFalse(hash.contains("ClaveSegura2026"));
    }

    @Test
    @DisplayName("Parte 2: una contrasena de menos de 10 caracteres se rechaza en el servidor")
    void registro_claveCorta_400() throws Exception {
        JsonNode error = navegador("10.0.2.2").json(post("/api/v1/auth/registro"),
                Map.of("nombre", "Corta", "email", "corta@correo.com", "password", "Clave1234"), 400);
        assertTrue(error.get("campos").has("password"));
    }

    @Test
    @DisplayName("Parte 2 / A06: el rol enviado en el registro se ignora; el servidor asigna CLIENTE")
    void registro_rolAdminEnElCuerpo_seIgnora() throws Exception {
        Navegador atacante = navegador("10.0.2.3");
        JsonNode usuario = atacante.json(post("/api/v1/auth/registro"), Map.of("nombre", "Atacante",
                "email", "rol@correo.com", "password", "ClaveSegura2026", "rol", "ADMIN"), 201);

        assertEquals("CLIENTE", usuario.get("rol").asText());
        assertEquals(Rol.CLIENTE, usuarioRepository.findByEmailIgnoreCase("rol@correo.com").orElseThrow().getRol());
        atacante.enviar(get("/api/v1/pedidos"), null, 403);
    }

    @Test
    @DisplayName("Parte 2: el sexto intento fallido de login responde 429 aunque la clave sea correcta")
    void login_sextoIntento_429() throws Exception {
        Navegador atacante = navegador("10.0.2.4");
        Map<String, String> incorrecta = Map.of("email", "admin@tienda.com", "password", "NoEsLaClave1");
        for (int i = 0; i < 5; i++) {
            JsonNode error = atacante.json(post("/api/v1/auth/login"), incorrecta, 401);
            // Mismo mensaje generico si el correo no existe o si la clave falla
            assertEquals("Correo o contrasena incorrectos", error.get("mensaje").asText());
        }
        MvcResult bloqueado = atacante.enviar(post("/api/v1/auth/login"),
                Map.of("email", "admin@tienda.com", "password", "ClaveSoloPruebas1"), 429);
        assertEquals("900", bloqueado.getResponse().getHeader("Retry-After"));

        // Otra IP no queda bloqueada
        navegador("10.0.2.5").enviar(post("/api/v1/auth/login"),
                Map.of("email", "admin@tienda.com", "password", "ClaveSoloPruebas1"), 200);
    }

    @Test
    @DisplayName("Parte 2: un login correcto reinicia el contador de intentos fallidos")
    void login_correcto_reiniciaContador() throws Exception {
        Navegador usuario = navegador("10.0.2.6");
        Map<String, String> incorrecta = Map.of("email", "admin@tienda.com", "password", "NoEsLaClave1");
        Map<String, String> correcta = Map.of("email", "admin@tienda.com", "password", "ClaveSoloPruebas1");
        for (int i = 0; i < 4; i++) {
            usuario.enviar(post("/api/v1/auth/login"), incorrecta, 401);
        }
        usuario.enviar(post("/api/v1/auth/login"), correcta, 200);
        for (int i = 0; i < 4; i++) {
            usuario.enviar(post("/api/v1/auth/login"), incorrecta, 401);
        }
        usuario.enviar(post("/api/v1/auth/login"), correcta, 200);
    }

    @Test
    @DisplayName("Parte 2: una ruta privada sin sesion responde 401")
    void rutaPrivada_sinSesion_401() throws Exception {
        navegador("10.0.2.7").enviar(get("/api/v1/pedidos/mios"), null, 401);
    }
}
