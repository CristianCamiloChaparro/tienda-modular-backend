package com.tienda.modular.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tienda.modular.dto.CategoriaRequest;
import com.tienda.modular.dto.CategoriaResponse;
import com.tienda.modular.exception.GlobalExceptionHandler;
import com.tienda.modular.exception.RecursoNoEncontradoException;
import com.tienda.modular.exception.ReglaNegocioException;
import com.tienda.modular.service.CategoriaService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CategoriaController.class)
@Import(GlobalExceptionHandler.class)
class CategoriaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private CategoriaService categoriaService;

    @Test
    @DisplayName("GET /api/v1/categorias -> 200 OK con lista de categorias")
    void listar_retorna200ConLista() throws Exception {
        CategoriaResponse cat1 = new CategoriaResponse(1L, "Ropa", "Prendas de vestir", LocalDateTime.now());
        CategoriaResponse cat2 = new CategoriaResponse(2L, "Hogar", "Articulos del hogar", LocalDateTime.now());

        when(categoriaService.listarCategorias()).thenReturn(List.of(cat1, cat2));

        mockMvc.perform(get("/api/v1/categorias"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id", is(1)))
                .andExpect(jsonPath("$[0].nombre", is("Ropa")))
                .andExpect(jsonPath("$[1].id", is(2)))
                .andExpect(jsonPath("$[1].nombre", is("Hogar")));

        verify(categoriaService).listarCategorias();
    }

    @Test
    @DisplayName("GET /api/v1/categorias/{id} -> 200 OK cuando existe la categoria")
    void obtener_cuandoExiste_retorna200() throws Exception {
        CategoriaResponse cat = new CategoriaResponse(1L, "Ropa", "Prendas de vestir", LocalDateTime.now());

        when(categoriaService.obtenerPorId(1L)).thenReturn(cat);

        mockMvc.perform(get("/api/v1/categorias/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.nombre", is("Ropa")));

        verify(categoriaService).obtenerPorId(1L);
    }

    @Test
    @DisplayName("GET /api/v1/categorias/{id} -> 404 Not Found cuando no existe")
    void obtener_cuandoNoExiste_retorna404() throws Exception {
        when(categoriaService.obtenerPorId(99L))
                .thenThrow(new RecursoNoEncontradoException("Categoria con id 99 no encontrada"));

        mockMvc.perform(get("/api/v1/categorias/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.error", is("Not Found")))
                .andExpect(jsonPath("$.mensaje", is("Categoria con id 99 no encontrada")));

        verify(categoriaService).obtenerPorId(99L);
    }

    @Test
    @DisplayName("POST /api/v1/categorias -> 201 Created cuando datos son validos")
    void crear_conDatosValidos_retorna201() throws Exception {
        CategoriaRequest request = new CategoriaRequest("Calzado", "Zapatos y tenis");
        CategoriaResponse response = new CategoriaResponse(3L, "Calzado", "Zapatos y tenis", LocalDateTime.now());

        when(categoriaService.crearCategoria(any(CategoriaRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/categorias")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", org.hamcrest.Matchers.containsString("/api/v1/categorias/3")))
                .andExpect(jsonPath("$.id", is(3)))
                .andExpect(jsonPath("$.nombre", is("Calzado")));

        verify(categoriaService).crearCategoria(any(CategoriaRequest.class));
    }

    @Test
    @DisplayName("POST /api/v1/categorias -> 400 Bad Request cuando nombre es blanco")
    void crear_conNombreBlanco_retorna400() throws Exception {
        CategoriaRequest request = new CategoriaRequest("   ", "Descripcion");

        mockMvc.perform(post("/api/v1/categorias")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.campos.nombre").exists());

        verify(categoriaService, never()).crearCategoria(any());
    }

    @Test
    @DisplayName("POST /api/v1/categorias -> 409 Conflict cuando nombre ya existe")
    void crear_conNombreDuplicado_retorna409() throws Exception {
        CategoriaRequest request = new CategoriaRequest("Ropa", "Prendas");

        when(categoriaService.crearCategoria(any(CategoriaRequest.class)))
                .thenThrow(new ReglaNegocioException("Ya existe una categoria con el nombre 'Ropa'"));

        mockMvc.perform(post("/api/v1/categorias")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status", is(409)))
                .andExpect(jsonPath("$.mensaje", is("Ya existe una categoria con el nombre 'Ropa'")));

        verify(categoriaService).crearCategoria(any(CategoriaRequest.class));
    }

    @Test
    @DisplayName("PUT /api/v1/categorias/{id} -> 200 OK cuando actualizacion es valida")
    void actualizar_conDatosValidos_retorna200() throws Exception {
        CategoriaRequest request = new CategoriaRequest("Ropa Deportiva", "Prendas deportivas");
        CategoriaResponse response = new CategoriaResponse(1L, "Ropa Deportiva", "Prendas deportivas", LocalDateTime.now());

        when(categoriaService.actualizarCategoria(eq(1L), any(CategoriaRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/v1/categorias/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.nombre", is("Ropa Deportiva")))
                .andExpect(jsonPath("$.descripcion", is("Prendas deportivas")));

        verify(categoriaService).actualizarCategoria(eq(1L), any(CategoriaRequest.class));
    }

    @Test
    @DisplayName("PUT /api/v1/categorias/{id} -> 400 Bad Request cuando nombre es blanco")
    void actualizar_conNombreBlanco_retorna400() throws Exception {
        CategoriaRequest request = new CategoriaRequest("", "Descripcion");

        mockMvc.perform(put("/api/v1/categorias/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.campos.nombre").exists());

        verify(categoriaService, never()).actualizarCategoria(any(), any());
    }

    @Test
    @DisplayName("PUT /api/v1/categorias/{id} -> 400 Bad Request cuando nombre supera 80 caracteres")
    void actualizar_conNombreExcedeLongitud_retorna400() throws Exception {
        String nombreLargo = "A".repeat(81);
        CategoriaRequest request = new CategoriaRequest(nombreLargo, "Descripcion");

        mockMvc.perform(put("/api/v1/categorias/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.campos.nombre").exists());

        verify(categoriaService, never()).actualizarCategoria(any(), any());
    }

    @Test
    @DisplayName("PUT /api/v1/categorias/{id} -> 404 Not Found cuando no existe categoria")
    void actualizar_cuandoNoExiste_retorna404() throws Exception {
        CategoriaRequest request = new CategoriaRequest("Ropa Deportiva", "Descripcion");

        when(categoriaService.actualizarCategoria(eq(99L), any(CategoriaRequest.class)))
                .thenThrow(new RecursoNoEncontradoException("Categoria con id 99 no encontrada"));

        mockMvc.perform(put("/api/v1/categorias/99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.mensaje", is("Categoria con id 99 no encontrada")));

        verify(categoriaService).actualizarCategoria(eq(99L), any(CategoriaRequest.class));
    }

    @Test
    @DisplayName("PUT /api/v1/categorias/{id} -> 409 Conflict cuando nombre ya pertenece a otra categoria")
    void actualizar_conNombreDuplicadoEnOtraCategoria_retorna409() throws Exception {
        CategoriaRequest request = new CategoriaRequest("Accesorios", "Descripcion");

        when(categoriaService.actualizarCategoria(eq(1L), any(CategoriaRequest.class)))
                .thenThrow(new ReglaNegocioException("Ya existe una categoria con el nombre 'Accesorios'"));

        mockMvc.perform(put("/api/v1/categorias/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status", is(409)))
                .andExpect(jsonPath("$.mensaje", is("Ya existe una categoria con el nombre 'Accesorios'")));

        verify(categoriaService).actualizarCategoria(eq(1L), any(CategoriaRequest.class));
    }

    @Test
    @DisplayName("DELETE /api/v1/categorias/{id} -> 204 No Content cuando no tiene productos asociados")
    void eliminar_sinProductos_retorna204() throws Exception {
        doNothing().when(categoriaService).eliminarCategoria(1L);

        mockMvc.perform(delete("/api/v1/categorias/1"))
                .andExpect(status().isNoContent())
                .andExpect(content().string(""));

        verify(categoriaService).eliminarCategoria(1L);
    }

    @Test
    @DisplayName("DELETE /api/v1/categorias/{id} -> 404 Not Found cuando categoria no existe")
    void eliminar_cuandoNoExiste_retorna404() throws Exception {
        doThrow(new RecursoNoEncontradoException("Categoria con id 99 no encontrada"))
                .when(categoriaService).eliminarCategoria(99L);

        mockMvc.perform(delete("/api/v1/categorias/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.mensaje", is("Categoria con id 99 no encontrada")));

        verify(categoriaService).eliminarCategoria(99L);
    }

    @Test
    @DisplayName("DELETE /api/v1/categorias/{id} -> 409 Conflict cuando tiene productos asociados")
    void eliminar_conProductosAsociados_retorna409() throws Exception {
        doThrow(new ReglaNegocioException("No se puede eliminar la categoría porque tiene productos asociados"))
                .when(categoriaService).eliminarCategoria(1L);

        mockMvc.perform(delete("/api/v1/categorias/1"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status", is(409)))
                .andExpect(jsonPath("$.mensaje", is("No se puede eliminar la categoría porque tiene productos asociados")));

        verify(categoriaService).eliminarCategoria(1L);
    }
}
