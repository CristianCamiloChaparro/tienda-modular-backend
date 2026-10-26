package com.tienda.modular.service;

import com.tienda.modular.dto.CarritoResponse;
import com.tienda.modular.exception.RecursoNoEncontradoException;
import com.tienda.modular.exception.ReglaNegocioException;
import com.tienda.modular.model.Carrito;
import com.tienda.modular.model.Producto;
import com.tienda.modular.repository.CarritoRepository;
import com.tienda.modular.repository.ProductoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Carrito anonimo identificado por UUID: agregar, quitar, modificar cantidades y calcular el total. */
@Service
public class CarritoService {

    private final CarritoRepository carritoRepository;
    private final ProductoRepository productoRepository;

    public CarritoService(CarritoRepository carritoRepository, ProductoRepository productoRepository) {
        this.carritoRepository = carritoRepository;
        this.productoRepository = productoRepository;
    }

    @Transactional
    public CarritoResponse crear() {
        return CarritoResponse.desde(carritoRepository.save(new Carrito()));
    }

    @Transactional
    public CarritoResponse obtener(String id) {
        Carrito carrito = buscarEntidad(id);
        carrito.sincronizarPrecios();
        return CarritoResponse.desde(carrito);
    }

    @Transactional
    public CarritoResponse agregarProducto(String id, Long productoId, int cantidad) {
        Carrito carrito = buscarEntidad(id);
        Producto producto = productoRepository.findById(productoId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Producto con id " + productoId + " no encontrado"));
        if (!producto.isActivo()) {
            throw new ReglaNegocioException("El producto '" + producto.getNombre() + "' no esta disponible");
        }
        validarStock(producto, carrito.cantidadDe(productoId) + cantidad);
        carrito.agregarProducto(producto, cantidad);
        carrito.sincronizarPrecios();
        return CarritoResponse.desde(carritoRepository.save(carrito));
    }

    @Transactional
    public CarritoResponse modificarCantidad(String id, Long productoId, int cantidad) {
        Carrito carrito = buscarEntidad(id);
        Producto producto = productoRepository.findById(productoId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Producto con id " + productoId + " no encontrado"));
        validarStock(producto, cantidad);
        if (!carrito.modificarCantidad(productoId, cantidad)) {
            throw new RecursoNoEncontradoException("El producto " + productoId + " no esta en el carrito");
        }
        carrito.sincronizarPrecios();
        return CarritoResponse.desde(carritoRepository.save(carrito));
    }

    @Transactional
    public CarritoResponse eliminarProducto(String id, Long productoId) {
        Carrito carrito = buscarEntidad(id);
        if (!carrito.eliminarProducto(productoId)) {
            throw new RecursoNoEncontradoException("El producto " + productoId + " no esta en el carrito");
        }
        carrito.sincronizarPrecios();
        return CarritoResponse.desde(carritoRepository.save(carrito));
    }

    @Transactional
    public CarritoResponse vaciar(String id) {
        Carrito carrito = buscarEntidad(id);
        carrito.vaciarCarrito();
        return CarritoResponse.desde(carritoRepository.save(carrito));
    }

    /** Uso interno (PedidoService). */
    @Transactional(readOnly = true)
    public Carrito buscarEntidad(String id) {
        return carritoRepository.findWithItemsById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Carrito " + id + " no encontrado"));
    }

    private void validarStock(Producto producto, int cantidadDeseada) {
        if (cantidadDeseada > producto.getStock()) {
            throw new ReglaNegocioException(producto.getStock() == 0
                    ? "El producto '" + producto.getNombre() + "' esta agotado"
                    : "Solo hay " + producto.getStock() + " unidades disponibles de '" + producto.getNombre() + "'");
        }
    }
}
