package com.tienda.modular.integracion;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tienda.modular.model.Producto;
import com.tienda.modular.repository.ProductoRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Year;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Prueba de punta a punta sobre la aplicacion completa (BD H2): sesion real, token CSRF real,
 * permisos por rol, carrito, pago con la pasarela de prueba y descuento de inventario.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class FlujoCompraIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ProductoRepository productoRepository;

    private Navegador navegador() {
        return new Navegador(mockMvc, objectMapper);
    }

    private Map<String, Object> pago(String numero) {
        return Map.of("titular", "LAURA GOMEZ", "numeroTarjeta", numero, "mesExpiracion", 12,
                "anioExpiracion", Year.now().getValue() + 2, "cvv", "123");
    }

    @Test
    @DisplayName("Sin token CSRF el servidor bloquea la peticion aunque los datos sean validos")
    void sinTokenCsrf_seBloquea() throws Exception {
        mockMvc.perform(post("/api/v1/auth/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Ana\",\"email\":\"ana@correo.com\",\"password\":\"Clave12345\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.mensaje", containsString("CSRF")));
    }

    @Test
    @DisplayName("Cliente: registro -> carrito -> pago rechazado -> pago aprobado -> stock descontado")
    void flujoCompletoDeCompra() throws Exception {
        Navegador cliente = navegador();
        cliente.enviar(post("/api/v1/auth/registro"),
                Map.of("nombre", "Laura Gomez", "email", "laura@correo.com", "password", "Clave12345"), 201);
        cliente.enviar(get("/api/v1/auth/me"), null, 200);

        // Un cliente no puede administrar el catalogo
        cliente.enviar(post("/api/v1/categorias"), Map.of("nombre", "Intrusa"), 403);

        Producto producto = productoRepository.findAllByOrderByNombreAsc().stream()
                .filter(p -> p.getStock() >= 5).findFirst().orElseThrow();
        int stockInicial = producto.getStock();
        BigDecimal precio = producto.getPrecio();

        String carritoId = cliente.json(post("/api/v1/carritos"), null, 201).get("id").asText();
        String items = "/api/v1/carritos/" + carritoId + "/items";

        JsonNode carrito = cliente.json(post(items), Map.of("productoId", producto.getId(), "cantidad", 2), 200);
        assertEquals(0, precio.multiply(BigDecimal.valueOf(2)).compareTo(carrito.get("total").decimalValue()));

        carrito = cliente.json(put(items + "/" + producto.getId()), Map.of("cantidad", 3), 200);
        assertEquals(0, precio.multiply(BigDecimal.valueOf(3)).compareTo(carrito.get("total").decimalValue()));
        assertEquals(3, carrito.get("totalUnidades").asInt());

        // No se puede pedir mas de lo que hay
        cliente.enviar(put(items + "/" + producto.getId()), Map.of("cantidad", stockInicial + 1), 409);

        Map<String, Object> checkout = Map.of("carritoId", carritoId, "direccionEnvio", "Calle 10 # 20-30",
                "telefono", "3001234567", "pago", pago("4000 0000 0000 0002"));
        cliente.enviar(post("/api/v1/pedidos"), checkout, 402);
        assertEquals(stockInicial, productoRepository.findById(producto.getId()).orElseThrow().getStock());

        checkout = Map.of("carritoId", carritoId, "direccionEnvio", "Calle 10 # 20-30",
                "telefono", "3001234567", "pago", pago("4242 4242 4242 4242"));
        JsonNode pedido = cliente.json(post("/api/v1/pedidos"), checkout, 201);
        assertEquals("PAGADO", pedido.get("estado").asText());
        assertEquals("VISA **** 4242", pedido.get("medioPago").asText());
        assertEquals(stockInicial - 3, productoRepository.findById(producto.getId()).orElseThrow().getStock());

        assertEquals(0, cliente.json(get("/api/v1/carritos/" + carritoId), null, 200).get("items").size());
        assertEquals(1, cliente.json(get("/api/v1/pedidos/mios"), null, 200).size());

        // Los pedidos de todos solo los ve el administrador
        cliente.enviar(get("/api/v1/pedidos"), null, 403);
        cliente.enviar(post("/api/v1/auth/logout"), null, 204);
        cliente.enviar(get("/api/v1/pedidos/mios"), null, 401);
    }

    @Test
    @DisplayName("Admin: crea categoria y producto; el HTML malicioso se elimina antes de guardar")
    void adminGestionaCatalogoYSeMitigaXss() throws Exception {
        Navegador anonimo = navegador();
        anonimo.enviar(post("/api/v1/auth/login"), Map.of("email", "admin@tienda.com", "password", "incorrecta1"), 401);

        Navegador admin = navegador();
        JsonNode usuario = admin.json(post("/api/v1/auth/login"),
                Map.of("email", "admin@tienda.com", "password", "ClaveSoloPruebas1"), 200);
        assertEquals("ADMIN", usuario.get("rol").asText());

        JsonNode categoria = admin.json(post("/api/v1/categorias"),
                Map.of("nombre", "<script>alert('xss')</script>Libros", "descripcion", "<b>Novelas</b>"), 201);
        assertEquals("Libros", categoria.get("nombre").asText());
        assertEquals("Novelas", categoria.get("descripcion").asText());

        JsonNode producto = admin.json(post("/api/v1/productos"), Map.of(
                "categoriaId", categoria.get("id").asLong(),
                "nombre", "<img src=x onerror=alert(1)>Cien anos de soledad",
                "precio", 59000, "stock", 10), 201);
        assertEquals("Cien anos de soledad", producto.get("nombre").asText());

        // Una URL javascript: se rechaza
        admin.enviar(put("/api/v1/productos/" + producto.get("id").asLong()), Map.of(
                "categoriaId", categoria.get("id").asLong(), "nombre", "Libro", "precio", 1, "stock", 1,
                "imagenUrl", "javascript:alert(1)"), 400);

        // El producto se puede eliminar aunque este en un carrito
        Navegador visitante = navegador();
        String carritoId = visitante.json(post("/api/v1/carritos"), null, 201).get("id").asText();
        visitante.enviar(post("/api/v1/carritos/" + carritoId + "/items"),
                Map.of("productoId", producto.get("id").asLong(), "cantidad", 1), 200);
        admin.enviar(delete("/api/v1/productos/" + producto.get("id").asLong()), null, 204);
        assertEquals(0, visitante.json(get("/api/v1/carritos/" + carritoId), null, 200).get("items").size());

        assertNotNull(admin.json(get("/api/v1/pedidos"), null, 200));
    }
}
