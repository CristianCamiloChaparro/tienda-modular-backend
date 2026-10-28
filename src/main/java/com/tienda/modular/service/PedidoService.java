package com.tienda.modular.service;

import com.tienda.modular.dto.CheckoutRequest;
import com.tienda.modular.dto.PedidoResponse;
import com.tienda.modular.exception.DatoInvalidoException;
import com.tienda.modular.exception.PagoRechazadoException;
import com.tienda.modular.exception.RecursoNoEncontradoException;
import com.tienda.modular.exception.ReglaNegocioException;
import com.tienda.modular.model.*;
import com.tienda.modular.repository.PedidoRepository;
import com.tienda.modular.repository.UsuarioRepository;
import com.tienda.modular.security.UsuarioAutenticado;
import com.tienda.modular.service.pago.PasarelaPago;
import com.tienda.modular.service.pago.ResultadoPago;
import com.tienda.modular.util.TextoSeguro;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

/** Checkout: valida stock, cobra con la pasarela, descuenta inventario y registra el pedido. */
@Service
public class PedidoService {

    private final PedidoRepository pedidoRepository;
    private final UsuarioRepository usuarioRepository;
    private final CarritoService carritoService;
    private final PasarelaPago pasarelaPago;
    private final EntityManager entityManager;

    public PedidoService(PedidoRepository pedidoRepository, UsuarioRepository usuarioRepository,
                         CarritoService carritoService, PasarelaPago pasarelaPago, EntityManager entityManager) {
        this.pedidoRepository = pedidoRepository;
        this.usuarioRepository = usuarioRepository;
        this.carritoService = carritoService;
        this.pasarelaPago = pasarelaPago;
        this.entityManager = entityManager;
    }

    /**
     * Todo ocurre en una transaccion: si el pago se rechaza o falta stock, nada se guarda
     * y el inventario queda como estaba.
     */
    @Transactional
    public PedidoResponse pagar(UsuarioAutenticado usuario, CheckoutRequest datos) {
        Carrito carrito = carritoService.buscarEntidad(datos.carritoId());
        if (carrito.getItems().isEmpty()) {
            throw new ReglaNegocioException("El carrito está vacío");
        }
        String direccion = TextoSeguro.limpiar(datos.direccionEnvio());
        if (direccion == null) {
            throw new DatoInvalidoException("direccionEnvio", "La dirección de envío no puede quedar vacía");
        }

        Pedido pedido = new Pedido();
        BigDecimal total = BigDecimal.ZERO;
        // Orden fijo por id para que dos compras simultaneas no se bloqueen entre si.
        List<ItemCarrito> items = carrito.getItems().stream()
                .sorted(Comparator.comparing(i -> i.getProducto().getId()))
                .toList();
        for (ItemCarrito item : items) {
            Producto producto = item.getProducto();
            // Relee el producto con bloqueo de fila: evita vender mas unidades de las que hay.
            entityManager.refresh(producto, LockModeType.PESSIMISTIC_WRITE);
            if (!producto.isActivo() || !producto.actualizarStock(-item.getCantidad())) {
                throw new ReglaNegocioException("Stock insuficiente para '" + producto.getNombre()
                        + "': quedan " + producto.getStock() + " unidades");
            }
            pedido.agregarItem(new ItemPedido(producto.getId(), producto.getNombre(),
                    item.getCantidad(), producto.getPrecio()));
            total = total.add(producto.getPrecio().multiply(BigDecimal.valueOf(item.getCantidad())));
        }

        ResultadoPago resultado = pasarelaPago.cobrar(total, datos.pago(), "Pedido de " + usuario.email());
        if (!resultado.aprobado()) {
            throw new PagoRechazadoException(resultado.mensaje());
        }

        pedido.setUsuario(usuarioRepository.getReferenceById(usuario.id()));
        pedido.setEstado(EstadoPedido.PAGADO);
        pedido.setTotal(total);
        pedido.setDireccionEnvio(direccion);
        pedido.setTelefono(datos.telefono().trim());
        pedido.setReferenciaPago(resultado.referencia());
        pedido.setMedioPago(resultado.medioPago());
        Pedido guardado = pedidoRepository.save(pedido);

        carrito.vaciarCarrito();
        return PedidoResponse.desde(pedidoRepository.findWithItemsById(guardado.getId()).orElseThrow());
    }

    @Transactional(readOnly = true)
    public List<PedidoResponse> listarDelUsuario(Long usuarioId) {
        return pedidoRepository.findByUsuarioIdOrderByCreadoEnDesc(usuarioId).stream()
                .map(PedidoResponse::desde).toList();
    }

    @Transactional(readOnly = true)
    public List<PedidoResponse> listarTodos() {
        return pedidoRepository.findAllByOrderByCreadoEnDesc().stream()
                .map(PedidoResponse::desde).toList();
    }

    /** Un cliente solo puede ver sus propios pedidos; el administrador ve todos. */
    @Transactional(readOnly = true)
    public PedidoResponse obtener(Long id, UsuarioAutenticado usuario) {
        Pedido pedido = buscarEntidad(id);
        if (!usuario.esAdmin() && !pedido.getUsuario().getId().equals(usuario.id())) {
            throw new RecursoNoEncontradoException("Pedido con id " + id + " no encontrado");
        }
        return PedidoResponse.desde(pedido);
    }

    @Transactional
    public PedidoResponse cambiarEstado(Long id, EstadoPedido estado) {
        Pedido pedido = buscarEntidad(id);
        pedido.setEstado(estado);
        return PedidoResponse.desde(pedido);
    }

    private Pedido buscarEntidad(Long id) {
        return pedidoRepository.findWithItemsById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Pedido con id " + id + " no encontrado"));
    }
}
