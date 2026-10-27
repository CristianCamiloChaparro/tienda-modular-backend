package com.tienda.modular.integracion;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tienda.modular.model.Producto;
import com.tienda.modular.model.Rol;
import com.tienda.modular.repository.ProductoRepository;
import com.tienda.modular.repository.UsuarioRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Year;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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

    @Autowired
    private ProductoRepository productoRepository;

    /** IP propia por prueba: el limite de intentos de login se cuenta por IP y no debe cruzarse. */
    private Navegador navegador(String ip) {
        return new Navegador(mockMvc, objectMapper, ip);
    }

    private Navegador cliente(String ip, String email) throws Exception {
        Navegador cliente = navegador(ip);
        cliente.enviar(post("/api/v1/auth/registro"),
                Map.of("nombre", "Cliente", "email", email, "password", "ClaveSegura2026"), 201);
        return cliente;
    }

    private Navegador admin(String ip) throws Exception {
        Navegador admin = navegador(ip);
        admin.enviar(post("/api/v1/auth/login"),
                Map.of("email", "admin@tienda.com", "password", "ClaveSoloPruebas1"), 200);
        return admin;
    }

    private Producto productoConStock() {
        return productoRepository.findAllByOrderByNombreAsc().stream()
                .filter(p -> p.isActivo() && p.getStock() >= 5).findFirst().orElseThrow();
    }

    /** Compra un producto con la tarjeta de prueba aprobada y devuelve el id del pedido. */
    private long comprar(Navegador cliente) throws Exception {
        String carritoId = cliente.json(post("/api/v1/carritos"), null, 201).get("id").asText();
        cliente.enviar(post("/api/v1/carritos/" + carritoId + "/items"),
                Map.of("productoId", productoConStock().getId(), "cantidad", 1), 200);
        Map<String, Object> pago = Map.of("titular", "CLIENTE", "numeroTarjeta", "4242 4242 4242 4242",
                "mesExpiracion", 12, "anioExpiracion", Year.now().getValue() + 2, "cvv", "123");
        return cliente.json(post("/api/v1/pedidos"), Map.of("carritoId", carritoId,
                "direccionEnvio", "Calle 1", "telefono", "3001234567", "pago", pago), 201).get("id").asLong();
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

    // ---------- Parte 3: roles y control de acceso ----------

    @Test
    @DisplayName("Parte 3: un cliente que intenta DELETE /productos/{id} recibe 403; el administrador 204")
    void eliminarProducto_soloAdmin() throws Exception {
        Navegador admin = admin("10.0.3.1");
        long categoriaId = admin.json(post("/api/v1/categorias"), Map.of("nombre", "Parte 3"), 201)
                .get("id").asLong();
        long productoId = admin.json(post("/api/v1/productos"), Map.of("categoriaId", categoriaId,
                "nombre", "Producto de prueba", "precio", 1000, "stock", 1), 201).get("id").asLong();

        cliente("10.0.3.2", "parte3@correo.com").enviar(delete("/api/v1/productos/" + productoId), null, 403);
        navegador("10.0.3.3").enviar(delete("/api/v1/productos/" + productoId), null, 401);
        admin.enviar(delete("/api/v1/productos/" + productoId), null, 204);
    }

    @Test
    @DisplayName("Parte 3 / IDOR: B pidiendo el pedido de A recibe 404; A y el administrador lo ven")
    void pedidoAjeno_404() throws Exception {
        Navegador a = cliente("10.0.3.4", "cliente.a@correo.com");
        Navegador b = cliente("10.0.3.5", "cliente.b@correo.com");
        long pedidoDeA = comprar(a);

        b.enviar(get("/api/v1/pedidos/" + pedidoDeA), null, 404);
        b.enviar(get("/api/v1/pedidos/999999"), null, 404); // mismo resultado que un id inexistente
        assertEquals(0, b.json(get("/api/v1/pedidos/mios"), null, 200).size());

        assertEquals(pedidoDeA, a.json(get("/api/v1/pedidos/" + pedidoDeA), null, 200).get("id").asLong());
        assertEquals(pedidoDeA, admin("10.0.3.6").json(get("/api/v1/pedidos/" + pedidoDeA), null, 200)
                .get("id").asLong());
    }

    @Test
    @DisplayName("Parte 3: solo el administrador cambia el estado de un pedido")
    void cambiarEstado_soloAdmin() throws Exception {
        Navegador cliente = cliente("10.0.3.7", "estado@correo.com");
        long pedido = comprar(cliente);
        cliente.enviar(patch("/api/v1/pedidos/" + pedido + "/estado"), Map.of("estado", "ENTREGADO"), 403);
        admin("10.0.3.8").enviar(patch("/api/v1/pedidos/" + pedido + "/estado"), Map.of("estado", "ENVIADO"), 200);
    }

    // ---------- Parte 4: XSS ----------

    @Test
    @DisplayName("Parte 4: el HTML en el nombre de usuario se elimina antes de guardarlo")
    void registro_nombreConHtml_seLimpia() throws Exception {
        JsonNode usuario = navegador("10.0.4.1").json(post("/api/v1/auth/registro"), Map.of(
                "nombre", "<img src=x onerror=\"alert('XSS')\">Mario",
                "email", "xss@correo.com", "password", "ClaveSegura2026"), 201);
        assertEquals("Mario", usuario.get("nombre").asText());
        assertEquals("Mario", usuarioRepository.findByEmailIgnoreCase("xss@correo.com").orElseThrow().getNombre());
    }

    @Test
    @DisplayName("Parte 4: toda respuesta lleva CSP, nosniff, X-Frame-Options y Referrer-Policy")
    void cabecerasDeSeguridad() throws Exception {
        MvcResult respuesta = navegador("10.0.4.2").enviar(get("/api/v1/productos"), null, 200);
        String csp = respuesta.getResponse().getHeader("Content-Security-Policy");
        assertNotNull(csp);
        assertTrue(csp.contains("script-src 'self'") && csp.contains("object-src 'none'")
                && csp.contains("frame-ancestors 'none'"), csp);
        assertEquals("nosniff", respuesta.getResponse().getHeader("X-Content-Type-Options"));
        assertEquals("DENY", respuesta.getResponse().getHeader("X-Frame-Options"));
        assertEquals("strict-origin-when-cross-origin", respuesta.getResponse().getHeader("Referrer-Policy"));
    }

    // ---------- Parte 5: CSRF ----------

    @Test
    @DisplayName("Parte 5: la cookie XSRF-TOKEN es legible por JavaScript pero SameSite=Strict")
    void cookieXsrf_sameSiteStrict() throws Exception {
        Cookie xsrf = mockMvc.perform(get("/api/v1/auth/csrf")).andReturn().getResponse().getCookie("XSRF-TOKEN");
        assertNotNull(xsrf);
        assertEquals("Strict", xsrf.getAttribute("SameSite"));
        assertFalse(xsrf.isHttpOnly(), "La SPA debe poder leerla para copiarla en la cabecera");
    }

    @Test
    @DisplayName("Parte 5: con la sesion del administrador pero sin la cabecera X-XSRF-TOKEN se responde 403")
    void sesionValidaSinCabeceraCsrf_403() throws Exception {
        Navegador admin = admin("10.0.5.1");
        mockMvc.perform(post("/api/v1/categorias").session(admin.sesion())
                        .contentType("application/json").content("{\"nombre\":\"sin-token\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.mensaje").value("Token CSRF ausente o invalido: la peticion fue bloqueada"));
    }
}
