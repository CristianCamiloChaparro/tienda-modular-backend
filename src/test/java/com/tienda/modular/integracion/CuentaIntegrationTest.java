package com.tienda.modular.integracion;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tienda.modular.security.Totp;
import com.tienda.modular.service.correo.CorreoService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/** Olvide mi contrasena, cambio de contrasena y verificacion en dos pasos, de punta a punta. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CuentaIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private CorreoService correoService;

    private Navegador nuevo() {
        return new Navegador(mockMvc, objectMapper);
    }

    private Navegador registrar(String email) throws Exception {
        Navegador n = nuevo();
        n.enviar(post("/api/v1/auth/registro"), Map.of("nombre", "Ana", "email", email, "password", "Clave1234"), 201);
        return n;
    }

    private static String codigo(String secreto, long desfase) {
        return Totp.codigo(Totp.desdeBase32(secreto), Totp.pasoActual(Instant.now()) + desfase);
    }

    @Test
    @DisplayName("Olvide mi contrasena: el enlace del correo cambia la clave una sola vez")
    void olvidoPassword() throws Exception {
        registrar("olvido@correo.com");
        Navegador anonimo = nuevo();

        // Correo inexistente: misma respuesta, sin correo enviado.
        anonimo.enviar(post("/api/v1/auth/password/olvido"), Map.of("email", "nadie@correo.com"), 202);
        verify(correoService, never()).enviarRestablecimiento(eq("nadie@correo.com"), anyString(), anyString());

        anonimo.enviar(post("/api/v1/auth/password/olvido"), Map.of("email", "OLVIDO@correo.com"), 202);
        ArgumentCaptor<String> enlace = ArgumentCaptor.forClass(String.class);
        verify(correoService).enviarRestablecimiento(eq("olvido@correo.com"), eq("Ana"), enlace.capture());
        assertThat(enlace.getValue()).startsWith("http://localhost:5173/restablecer?token=");
        String token = enlace.getValue().substring(enlace.getValue().indexOf("token=") + 6);

        // Un segundo pedido inmediato no manda otro correo (limite de un correo por minuto).
        anonimo.enviar(post("/api/v1/auth/password/olvido"), Map.of("email", "olvido@correo.com"), 202);
        verify(correoService, times(1)).enviarRestablecimiento(eq("olvido@correo.com"), anyString(), anyString());

        anonimo.enviar(post("/api/v1/auth/password/restablecer"), Map.of("token", token, "password", "corta"), 400);
        anonimo.enviar(post("/api/v1/auth/password/restablecer"), Map.of("token", "inventado", "password", "NuevaClave1"), 400);
        anonimo.enviar(post("/api/v1/auth/password/restablecer"), Map.of("token", token, "password", "NuevaClave1"), 204);
        anonimo.enviar(post("/api/v1/auth/password/restablecer"), Map.of("token", token, "password", "OtraClave2"), 400);

        nuevo().enviar(post("/api/v1/auth/login"), Map.of("email", "olvido@correo.com", "password", "Clave1234"), 401);
        nuevo().enviar(post("/api/v1/auth/login"), Map.of("email", "olvido@correo.com", "password", "NuevaClave1"), 200);
    }

    @Test
    @DisplayName("Cambio de contrasena: exige la actual")
    void cambioPassword() throws Exception {
        Navegador ana = registrar("cambio@correo.com");
        ana.enviar(post("/api/v1/auth/cuenta/password"), Map.of("actual", "Incorrecta1", "nueva", "NuevaClave1"), 400);
        ana.enviar(post("/api/v1/auth/cuenta/password"), Map.of("actual", "Clave1234", "nueva", "NuevaClave1"), 204);
        nuevo().enviar(post("/api/v1/auth/login"), Map.of("email", "cambio@correo.com", "password", "NuevaClave1"), 200);
        nuevo().enviar(post("/api/v1/auth/cuenta/password"), Map.of("actual", "x", "nueva", "NuevaClave1"), 401);
    }

    @Test
    @DisplayName("2FA: se activa con un codigo, el login pide el codigo y un codigo usado no sirve dos veces")
    void dosFactores() throws Exception {
        Navegador ana = registrar("dospasos@correo.com");

        ana.enviar(post("/api/v1/auth/cuenta/2fa/activar"), Map.of("codigo", "123456"), 409);
        JsonNode config = ana.json(post("/api/v1/auth/cuenta/2fa/iniciar"), null, 200);
        String secreto = config.get("secreto").asText();
        assertThat(config.get("otpauthUrl").asText()).contains("secret=" + secreto).contains("issuer=Tienda");

        ana.enviar(post("/api/v1/auth/cuenta/2fa/activar"), Map.of("codigo", "000000"), 400);
        JsonNode activado = ana.json(post("/api/v1/auth/cuenta/2fa/activar"), Map.of("codigo", codigo(secreto, 0)), 200);
        assertThat(activado.get("dosFactoresActivo").asBoolean()).isTrue();
        assertThat(ana.json(get("/api/v1/auth/me"), null, 200).get("dosFactoresActivo").asBoolean()).isTrue();

        // Login: la contrasena sola deja la sesion pendiente (202) y no da acceso.
        Navegador otro = nuevo();
        JsonNode pendiente = otro.json(post("/api/v1/auth/login"),
                Map.of("email", "dospasos@correo.com", "password", "Clave1234"), 202);
        assertThat(pendiente.get("requiereDosFactores").asBoolean()).isTrue();
        otro.enviar(get("/api/v1/auth/me"), null, 204);
        otro.enviar(get("/api/v1/pedidos/mios"), null, 401);

        otro.enviar(post("/api/v1/auth/login/2fa"), Map.of("codigo", "000000"), 400);
        // El codigo con el que se activo ya se uso: no sirve de nuevo.
        otro.enviar(post("/api/v1/auth/login/2fa"), Map.of("codigo", codigo(secreto, 0)), 400);
        JsonNode usuario = otro.json(post("/api/v1/auth/login/2fa"), Map.of("codigo", codigo(secreto, 1)), 200);
        assertThat(usuario.get("email").asText()).isEqualTo("dospasos@correo.com");
        otro.enviar(get("/api/v1/pedidos/mios"), null, 200);

        // Desactivar exige un codigo nuevo.
        otro.enviar(post("/api/v1/auth/cuenta/2fa/desactivar"), Map.of("codigo", codigo(secreto, 1)), 400);
        ana.enviar(post("/api/v1/auth/cuenta/2fa/iniciar"), null, 409);
    }

    @Test
    @DisplayName("2FA: sin login pendiente no hay segundo paso, y 5 codigos malos obligan a empezar de nuevo")
    void dosFactoresIntentos() throws Exception {
        nuevo().enviar(post("/api/v1/auth/login/2fa"), Map.of("codigo", "123456"), 401);

        Navegador ana = registrar("intentos@correo.com");
        String secreto = ana.json(post("/api/v1/auth/cuenta/2fa/iniciar"), null, 200).get("secreto").asText();
        ana.enviar(post("/api/v1/auth/cuenta/2fa/activar"), Map.of("codigo", codigo(secreto, 0)), 200);

        Navegador atacante = nuevo();
        atacante.enviar(post("/api/v1/auth/login"), Map.of("email", "intentos@correo.com", "password", "Clave1234"), 202);
        for (int i = 0; i < 4; i++) {
            atacante.enviar(post("/api/v1/auth/login/2fa"), Map.of("codigo", "000000"), 400);
        }
        atacante.enviar(post("/api/v1/auth/login/2fa"), Map.of("codigo", "000000"), 429);
        atacante.enviar(post("/api/v1/auth/login/2fa"), Map.of("codigo", codigo(secreto, 1)), 401);
    }
}
