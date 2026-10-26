package com.tienda.modular.controller;

import com.tienda.modular.dto.CambioEstadoRequest;
import com.tienda.modular.dto.CheckoutRequest;
import com.tienda.modular.dto.PedidoResponse;
import com.tienda.modular.exception.ApiError;
import com.tienda.modular.security.UsuarioAutenticado;
import com.tienda.modular.service.PedidoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/pedidos")
@Tag(name = "Pedidos y pagos", description = "Pago del carrito con la pasarela y seguimiento de pedidos")
public class PedidoController {

    private final PedidoService pedidoService;

    public PedidoController(PedidoService pedidoService) {
        this.pedidoService = pedidoService;
    }

    @PostMapping
    @Operation(summary = "Pagar carrito (checkout)",
            description = """
                    Requiere sesion iniciada. Cobra el total del carrito con la pasarela de pagos (modo prueba),
                    descuenta el stock, registra el pedido y vacia el carrito.
                    Tarjetas de prueba: 4242 4242 4242 4242 aprobada; 4000 0000 0000 0002 rechazada.""")
    @ApiResponse(responseCode = "201", description = "Pago aprobado y pedido creado")
    @ApiResponse(responseCode = "400", description = "Datos de envio o de tarjeta invalidos",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "401", description = "No ha iniciado sesion",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "402", description = "La pasarela rechazo el pago",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "El carrito no existe",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "Carrito vacio o stock insuficiente",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public ResponseEntity<PedidoResponse> pagar(@AuthenticationPrincipal UsuarioAutenticado usuario,
                                                @Valid @RequestBody CheckoutRequest datos) {
        PedidoResponse pedido = pedidoService.pagar(usuario, datos);
        URI ubicacion = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(pedido.id()).toUri();
        return ResponseEntity.created(ubicacion).body(pedido);
    }

    @GetMapping("/mios")
    @Operation(summary = "Mis pedidos", description = "Historial de compras del usuario con sesion iniciada.")
    @ApiResponse(responseCode = "200", description = "Listado obtenido")
    @ApiResponse(responseCode = "401", description = "No ha iniciado sesion",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public List<PedidoResponse> misPedidos(@AuthenticationPrincipal UsuarioAutenticado usuario) {
        return pedidoService.listarDelUsuario(usuario.id());
    }

    @GetMapping
    @Operation(summary = "Todos los pedidos (ADMIN)")
    @ApiResponse(responseCode = "200", description = "Listado obtenido")
    @ApiResponse(responseCode = "403", description = "Solo el administrador",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public List<PedidoResponse> listar() {
        return pedidoService.listarTodos();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Detalle de un pedido", description = "El cliente solo puede ver sus propios pedidos.")
    @ApiResponse(responseCode = "200", description = "Pedido encontrado")
    @ApiResponse(responseCode = "404", description = "No existe o pertenece a otro usuario",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PedidoResponse obtener(@Parameter(description = "Id del pedido", example = "1") @PathVariable Long id,
                                  @AuthenticationPrincipal UsuarioAutenticado usuario) {
        return pedidoService.obtener(id, usuario);
    }

    @PatchMapping("/{id}/estado")
    @Operation(summary = "Cambiar estado del pedido (ADMIN)", description = "PAGADO, ENVIADO, ENTREGADO o CANCELADO.")
    @ApiResponse(responseCode = "200", description = "Estado actualizado")
    @ApiResponse(responseCode = "403", description = "Solo el administrador",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "El pedido no existe",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PedidoResponse cambiarEstado(@PathVariable Long id, @Valid @RequestBody CambioEstadoRequest datos) {
        return pedidoService.cambiarEstado(id, datos.estado());
    }
}
