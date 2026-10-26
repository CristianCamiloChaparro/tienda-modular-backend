package com.tienda.modular.controller;

import com.tienda.modular.dto.AgregarItemRequest;
import com.tienda.modular.dto.CantidadRequest;
import com.tienda.modular.dto.CarritoResponse;
import com.tienda.modular.exception.ApiError;
import com.tienda.modular.service.CarritoService;
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

@RestController
@RequestMapping("/api/v1/carritos")
@Tag(name = "Carrito", description = "Carrito de compras: agregar, quitar, modificar cantidades y calcular el total")
public class CarritoController {

    private final CarritoService carritoService;

    public CarritoController(CarritoService carritoService) {
        this.carritoService = carritoService;
    }

    @PostMapping
    @Operation(summary = "Crear carrito",
            description = "Crea un carrito vacio. El frontend guarda su id para las siguientes operaciones.")
    @ApiResponse(responseCode = "201", description = "Carrito creado")
    public ResponseEntity<CarritoResponse> crear() {
        CarritoResponse carrito = carritoService.crear();
        URI ubicacion = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(carrito.id()).toUri();
        return ResponseEntity.created(ubicacion).body(carrito);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Ver carrito", description = "Devuelve los productos con precios vigentes y el total recalculado.")
    @ApiResponse(responseCode = "200", description = "Carrito encontrado")
    @ApiResponse(responseCode = "404", description = "El carrito no existe",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public CarritoResponse obtener(@Parameter(description = "Id del carrito") @PathVariable String id) {
        return carritoService.obtener(id);
    }

    @PostMapping("/{id}/items")
    @Operation(summary = "Agregar producto",
            description = "Si el producto ya esta en el carrito, suma la cantidad. Valida el stock disponible.")
    @ApiResponse(responseCode = "200", description = "Producto agregado; devuelve el carrito con el nuevo total")
    @ApiResponse(responseCode = "400", description = "Cantidad invalida",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "El carrito o el producto no existe",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "No hay stock suficiente",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public CarritoResponse agregar(@PathVariable String id, @Valid @RequestBody AgregarItemRequest datos) {
        return carritoService.agregarProducto(id, datos.productoId(), datos.cantidad());
    }

    @PutMapping("/{id}/items/{productoId}")
    @Operation(summary = "Modificar cantidad", description = "Reemplaza la cantidad de un producto del carrito.")
    @ApiResponse(responseCode = "200", description = "Cantidad actualizada; devuelve el carrito con el nuevo total")
    @ApiResponse(responseCode = "400", description = "Cantidad invalida",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "El carrito no existe o el producto no esta en el",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "No hay stock suficiente",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public CarritoResponse modificar(@PathVariable String id, @PathVariable Long productoId,
                                     @Valid @RequestBody CantidadRequest datos) {
        return carritoService.modificarCantidad(id, productoId, datos.cantidad());
    }

    @DeleteMapping("/{id}/items/{productoId}")
    @Operation(summary = "Quitar producto")
    @ApiResponse(responseCode = "200", description = "Producto quitado; devuelve el carrito con el nuevo total")
    @ApiResponse(responseCode = "404", description = "El carrito no existe o el producto no esta en el",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public CarritoResponse quitar(@PathVariable String id, @PathVariable Long productoId) {
        return carritoService.eliminarProducto(id, productoId);
    }

    @DeleteMapping("/{id}/items")
    @Operation(summary = "Vaciar carrito")
    @ApiResponse(responseCode = "200", description = "Carrito vacio")
    @ApiResponse(responseCode = "404", description = "El carrito no existe",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public CarritoResponse vaciar(@PathVariable String id) {
        return carritoService.vaciar(id);
    }
}
