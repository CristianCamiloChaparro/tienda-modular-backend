package com.tienda.modular.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tienda.modular.dto.ProductoRequest;
import com.tienda.modular.dto.ProductoResponse;
import com.tienda.modular.exception.GlobalExceptionHandler;
import com.tienda.modular.exception.RecursoNoEncontradoException;
import com.tienda.modular.service.ProductoService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProductoController.class)
@Import(GlobalExceptionHandler.class)
class ProductoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ProductoService productoService;

    private ProductoResponse mockProductoResponse(Long id, Long catId, String catNombre, String nombre, BigDecimal precio, int stock) {
        return new ProductoResponse(
                id,
                catId,
                catNombre,
                nombre,
                "Descripcion de prueba",
                precio,
                stock,
                "https://picsum.photos/seed/test/400/400",
                true,
                LocalDateTime.now()
        );
    }

    @Test
    @DisplayName("GET /api/v1/productos -> 200 OK con catalogo completo")
    void listar_sinCategoriaId_retorna200ConTodos() throws Exception {
        ProductoResponse p1 = mockProductoResponse(1L, 1L, "Ropa", "Camiseta", new BigDecimal("35000.00"), 20);
        ProductoResponse p2 = mockProductoResponse(2L, 2L, "Accesorios", "Gorra", new BigDecimal("45000.00"), 10);

        when(productoService.listar(null)).thenReturn(List.of(p1, p2));

        mockMvc.perform(get("/api/v1/productos"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id", is(1)))
                .andExpect(jsonPath("$[0].nombre", is("Camiseta")))
                .andExpect(jsonPath("$[1].id", is(2)))
                .andExpect(jsonPath("$[1].nombre", is("Gorra")));

        verify(productoService).listar(null);
    }

    @Test
    @DisplayName("GET /api/v1/productos?categoriaId={id} -> 200 OK filtrado por categoria")
    void listar_conCategoriaId_retorna200ConFiltrados() throws Exception {
        ProductoResponse p1 = mockProductoResponse(1L, 1L, "Ropa", "Camiseta", new BigDecimal("35000.00"), 20);

        when(productoService.listar(1L)).thenReturn(List.of(p1));

        mockMvc.perform(get("/api/v1/productos").param("categoriaId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].categoriaId", is(1)))
                .andExpect(jsonPath("$[0].nombre", is("Camiseta")));

        verify(productoService).listar(1L);
    }

    @Test
    @DisplayName("GET /api/v1/productos?categoriaId={id} -> 404 Not Found si categoria no existe")
    void listar_conCategoriaIdInexistente_retorna404() throws Exception {
        when(productoService.listar(99L))
                .thenThrow(new RecursoNoEncontradoException("Categoria con id 99 no encontrada"));

        mockMvc.perform(get("/api/v1/productos").param("categoriaId", "99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.mensaje", is("Categoria con id 99 no encontrada")));

        verify(productoService).listar(99L);
    }

    @Test
    @DisplayName("GET /api/v1/productos/{id} -> 200 OK cuando existe el producto")
    void obtener_cuandoExiste_retorna200() throws Exception {
        ProductoResponse p = mockProductoResponse(1L, 1L, "Ropa", "Camiseta", new BigDecimal("35000.00"), 20);

        when(productoService.obtenerPorId(1L)).thenReturn(p);

        mockMvc.perform(get("/api/v1/productos/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.nombre", is("Camiseta")))
                .andExpect(jsonPath("$.precio", is(35000.00)));

        verify(productoService).obtenerPorId(1L);
    }

    @Test
    @DisplayName("GET /api/v1/productos/{id} -> 404 Not Found cuando no existe")
    void obtener_cuandoNoExiste_retorna404() throws Exception {
        when(productoService.obtenerPorId(99L))
                .thenThrow(new RecursoNoEncontradoException("Producto con id 99 no encontrado"));

        mockMvc.perform(get("/api/v1/productos/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.mensaje", is("Producto con id 99 no encontrado")));

        verify(productoService).obtenerPorId(99L);
    }

    @Test
    @DisplayName("POST /api/v1/productos -> 201 Created cuando datos son validos")
    void crear_conDatosValidos_retorna201() throws Exception {
        ProductoRequest request = new ProductoRequest(
                1L, "Camiseta Nueva", "Descripcion",
                new BigDecimal("42000.00"), 15, "https://picsum.photos/seed/nueva/400/400"
        );
        ProductoResponse response = mockProductoResponse(3L, 1L, "Ropa", "Camiseta Nueva", new BigDecimal("42000.00"), 15);

        when(productoService.crearProducto(any(ProductoRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/productos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", org.hamcrest.Matchers.containsString("/api/v1/productos/3")))
                .andExpect(jsonPath("$.id", is(3)))
                .andExpect(jsonPath("$.nombre", is("Camiseta Nueva")));

        verify(productoService).crearProducto(any(ProductoRequest.class));
    }

    @Test
    @DisplayName("POST /api/v1/productos -> 400 Bad Request cuando precio es menor o igual a 0")
    void crear_conPrecioInvalido_retorna400() throws Exception {
        ProductoRequest request = new ProductoRequest(
                1L, "Camiseta", "Descripcion",
                new BigDecimal("0.00"), 10, null
        );

        mockMvc.perform(post("/api/v1/productos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.campos.precio").exists());

        verify(productoService, never()).crearProducto(any());
    }

    @Test
    @DisplayName("POST /api/v1/productos -> 400 Bad Request cuando stock es negativo")
    void crear_conStockNegativo_retorna400() throws Exception {
        ProductoRequest request = new ProductoRequest(
                1L, "Camiseta", "Descripcion",
                new BigDecimal("25000.00"), -1, null
        );

        mockMvc.perform(post("/api/v1/productos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.campos.stock").exists());

        verify(productoService, never()).crearProducto(any());
    }

    @Test
    @DisplayName("POST /api/v1/productos -> 400 Bad Request cuando categoriaId es nulo")
    void crear_conCategoriaIdNulo_retorna400() throws Exception {
        ProductoRequest request = new ProductoRequest(
                null, "Camiseta", "Descripcion",
                new BigDecimal("25000.00"), 10, null
        );

        mockMvc.perform(post("/api/v1/productos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.campos.categoriaId").exists());

        verify(productoService, never()).crearProducto(any());
    }

    @Test
    @DisplayName("POST /api/v1/productos -> 404 Not Found cuando la categoria no existe")
    void crear_cuandoCategoriaNoExiste_retorna404() throws Exception {
        ProductoRequest request = new ProductoRequest(
                99L, "Camiseta", "Descripcion",
                new BigDecimal("25000.00"), 10, null
        );

        when(productoService.crearProducto(any(ProductoRequest.class)))
                .thenThrow(new RecursoNoEncontradoException("Categoria con id 99 no encontrada"));

        mockMvc.perform(post("/api/v1/productos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.mensaje", is("Categoria con id 99 no encontrada")));

        verify(productoService).crearProducto(any(ProductoRequest.class));
    }

    @Test
    @DisplayName("PUT /api/v1/productos/{id} -> 200 OK cuando actualizacion es valida")
    void actualizar_conDatosValidos_retorna200() throws Exception {
        ProductoRequest request = new ProductoRequest(
                1L, "Camiseta Blanca Editada", "Nueva descripcion",
                new BigDecimal("39900.00"), 35, "https://picsum.photos/seed/editada/400/400"
        );
        ProductoResponse response = mockProductoResponse(1L, 1L, "Ropa", "Camiseta Blanca Editada", new BigDecimal("39900.00"), 35);

        when(productoService.actualizarProducto(eq(1L), any(ProductoRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/v1/productos/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.nombre", is("Camiseta Blanca Editada")))
                .andExpect(jsonPath("$.precio", is(39900.00)))
                .andExpect(jsonPath("$.stock", is(35)));

        verify(productoService).actualizarProducto(eq(1L), any(ProductoRequest.class));
    }

    @Test
    @DisplayName("PUT /api/v1/productos/{id} -> 400 Bad Request cuando precio es 0 o menor")
    void actualizar_conPrecioInvalido_retorna400() throws Exception {
        ProductoRequest request = new ProductoRequest(
                1L, "Camiseta", "Descripcion",
                new BigDecimal("0.00"), 10, null
        );

        mockMvc.perform(put("/api/v1/productos/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.campos.precio").exists());

        verify(productoService, never()).actualizarProducto(any(), any());
    }

    @Test
    @DisplayName("PUT /api/v1/productos/{id} -> 400 Bad Request cuando stock es negativo")
    void actualizar_conStockNegativo_retorna400() throws Exception {
        ProductoRequest request = new ProductoRequest(
                1L, "Camiseta", "Descripcion",
                new BigDecimal("25000.00"), -5, null
        );

        mockMvc.perform(put("/api/v1/productos/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.campos.stock").exists());

        verify(productoService, never()).actualizarProducto(any(), any());
    }

    @Test
    @DisplayName("PUT /api/v1/productos/{id} -> 400 Bad Request cuando nombre esta en blanco")
    void actualizar_conNombreBlanco_retorna400() throws Exception {
        ProductoRequest request = new ProductoRequest(
                1L, "   ", "Descripcion",
                new BigDecimal("25000.00"), 10, null
        );

        mockMvc.perform(put("/api/v1/productos/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.campos.nombre").exists());

        verify(productoService, never()).actualizarProducto(any(), any());
    }

    @Test
    @DisplayName("PUT /api/v1/productos/{id} -> 404 Not Found cuando producto no existe")
    void actualizar_cuandoProductoNoExiste_retorna404() throws Exception {
        ProductoRequest request = new ProductoRequest(
                1L, "Camiseta", "Descripcion",
                new BigDecimal("25000.00"), 10, null
        );

        when(productoService.actualizarProducto(eq(99L), any(ProductoRequest.class)))
                .thenThrow(new RecursoNoEncontradoException("Producto con id 99 no encontrado"));

        mockMvc.perform(put("/api/v1/productos/99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.mensaje", is("Producto con id 99 no encontrado")));

        verify(productoService).actualizarProducto(eq(99L), any(ProductoRequest.class));
    }

    @Test
    @DisplayName("PUT /api/v1/productos/{id} -> 404 Not Found cuando categoria no existe")
    void actualizar_cuandoCategoriaNoExiste_retorna404() throws Exception {
        ProductoRequest request = new ProductoRequest(
                99L, "Camiseta", "Descripcion",
                new BigDecimal("25000.00"), 10, null
        );

        when(productoService.actualizarProducto(eq(1L), any(ProductoRequest.class)))
                .thenThrow(new RecursoNoEncontradoException("Categoria con id 99 no encontrada"));

        mockMvc.perform(put("/api/v1/productos/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.mensaje", is("Categoria con id 99 no encontrada")));

        verify(productoService).actualizarProducto(eq(1L), any(ProductoRequest.class));
    }

    @Test
    @DisplayName("DELETE /api/v1/productos/{id} -> 204 No Content cuando producto existe")
    void eliminar_cuandoExiste_retorna204() throws Exception {
        doNothing().when(productoService).eliminarProducto(1L);

        mockMvc.perform(delete("/api/v1/productos/1"))
                .andExpect(status().isNoContent())
                .andExpect(content().string(""));

        verify(productoService).eliminarProducto(1L);
    }

    @Test
    @DisplayName("DELETE /api/v1/productos/{id} -> 404 Not Found cuando producto no existe")
    void eliminar_cuandoNoExiste_retorna404() throws Exception {
        doThrow(new RecursoNoEncontradoException("Producto con id 99 no encontrado"))
                .when(productoService).eliminarProducto(99L);

        mockMvc.perform(delete("/api/v1/productos/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.mensaje", is("Producto con id 99 no encontrado")));

        verify(productoService).eliminarProducto(99L);
    }
}
