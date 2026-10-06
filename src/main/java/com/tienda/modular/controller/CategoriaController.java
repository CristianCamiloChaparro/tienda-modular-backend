package com.tienda.modular.controller;

import com.tienda.modular.dto.CategoriaRequest;
import com.tienda.modular.dto.CategoriaResponse;
import com.tienda.modular.exception.ApiError;
import com.tienda.modular.service.CategoriaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/categorias")
@Tag(name = "Categorias", description = "Gestion de categorias de productos")
public class CategoriaController {

    private final CategoriaService categoriaService;

    public CategoriaController(CategoriaService categoriaService) {
        this.categoriaService = categoriaService;
    }

    @GetMapping
    @Operation(summary = "Listar categorias", description = "Devuelve todas las categorias ordenadas por nombre.")
    @ApiResponse(responseCode = "200", description = "Listado obtenido")
    public List<CategoriaResponse> listar() {
        return categoriaService.listarCategorias();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener una categoria por id")
    @ApiResponse(responseCode = "200", description = "Categoria encontrada")
    @ApiResponse(responseCode = "404", description = "No existe una categoria con ese id",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public CategoriaResponse obtener(@Parameter(description = "Id de la categoria", example = "1")
                                     @PathVariable Long id) {
        return categoriaService.obtenerPorId(id);
    }

    @PostMapping
    @Operation(summary = "Crear categoria", description = "Registra una categoria con nombre unico (RF-01).")
    @ApiResponse(responseCode = "201", description = "Categoria creada")
    @ApiResponse(responseCode = "400", description = "Datos invalidos",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "Ya existe una categoria con ese nombre",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public ResponseEntity<CategoriaResponse> crear(@Valid @RequestBody CategoriaRequest datos) {
        CategoriaResponse creada = categoriaService.crearCategoria(datos);
        URI ubicacion = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(creada.id()).toUri();
        return ResponseEntity.created(ubicacion).body(creada);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar categoria", description = "Actualiza los datos de una categoria validando nombre obligatorio, longitud y unicidad.")
    @ApiResponse(responseCode = "200", description = "Categoria actualizada exitosamente")
    @ApiResponse(responseCode = "400", description = "Datos invalidos",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "Categoria no encontrada",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "Ya existe otra categoria con ese nombre",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public ResponseEntity<CategoriaResponse> actualizar(
            @Parameter(description = "Id de la categoria", example = "1") @PathVariable Long id,
            @Valid @RequestBody CategoriaRequest datos) {
        return ResponseEntity.ok(categoriaService.actualizarCategoria(id, datos));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar categoria", description = "Elimina una categoria si no tiene productos asociados.")
    @ApiResponse(responseCode = "204", description = "Categoria eliminada exitosamente")
    @ApiResponse(responseCode = "404", description = "Categoria no encontrada",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "No se puede eliminar la categoria porque tiene productos asociados",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public ResponseEntity<Void> eliminar(
            @Parameter(description = "Id de la categoria", example = "1") @PathVariable Long id) {
        categoriaService.eliminarCategoria(id);
        return ResponseEntity.noContent().build();
    }
}
