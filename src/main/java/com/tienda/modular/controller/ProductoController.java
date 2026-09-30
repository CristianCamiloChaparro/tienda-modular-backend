package com.tienda.modular.controller;

import com.tienda.modular.dto.ProductoRequest;
import com.tienda.modular.dto.ProductoResponse;
import com.tienda.modular.exception.ApiError;
import com.tienda.modular.service.ProductoService;
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
@RequestMapping("/api/v1/productos")
@Tag(name = "Productos", description = "Gestion y consulta del catalogo de productos")
public class ProductoController {

    private final ProductoService productoService;

    public ProductoController(ProductoService productoService) {
        this.productoService = productoService;
    }

    @GetMapping
    @Operation(summary = "Listar productos",
            description = "Devuelve el catalogo completo. Si se envia categoriaId, solo los productos de esa categoria (RF-05, RF-06).")
    @ApiResponse(responseCode = "200", description = "Listado obtenido")
    @ApiResponse(responseCode = "404", description = "La categoria indicada no existe",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public List<ProductoResponse> listar(
            @Parameter(description = "Filtra por categoria (opcional)", example = "1")
            @RequestParam(required = false) Long categoriaId) {
        return productoService.listar(categoriaId);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener un producto por id")
    @ApiResponse(responseCode = "200", description = "Producto encontrado")
    @ApiResponse(responseCode = "404", description = "No existe un producto con ese id",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public ProductoResponse obtener(@Parameter(description = "Id del producto", example = "1")
                                    @PathVariable Long id) {
        return productoService.obtenerPorId(id);
    }

    @PostMapping
    @Operation(summary = "Crear producto",
            description = "Registra un producto vinculado a una categoria existente, con precio > 0 y stock >= 0 (RF-03).")
    @ApiResponse(responseCode = "201", description = "Producto creado")
    @ApiResponse(responseCode = "400", description = "Datos invalidos",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "La categoria indicada no existe",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public ResponseEntity<ProductoResponse> crear(@Valid @RequestBody ProductoRequest datos) {
        ProductoResponse creado = productoService.crearProducto(datos);
        URI ubicacion = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(creado.id()).toUri();
        return ResponseEntity.created(ubicacion).body(creado);
    }
}
