package com.tienda.modular.service;

import com.tienda.modular.dto.ProductoRequest;
import com.tienda.modular.dto.ProductoResponse;
import com.tienda.modular.exception.DatoInvalidoException;
import com.tienda.modular.exception.RecursoNoEncontradoException;
import com.tienda.modular.model.Categoria;
import com.tienda.modular.model.Producto;
import com.tienda.modular.repository.ItemCarritoRepository;
import com.tienda.modular.repository.ProductoRepository;
import com.tienda.modular.util.TextoSeguro;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final CategoriaService categoriaService;
    private final ItemCarritoRepository itemCarritoRepository;

    public ProductoService(ProductoRepository productoRepository, CategoriaService categoriaService,
                           ItemCarritoRepository itemCarritoRepository) {
        this.productoRepository = productoRepository;
        this.categoriaService = categoriaService;
        this.itemCarritoRepository = itemCarritoRepository;
    }

    /** Lista todos los productos o, si se envia categoriaId, solo los de esa categoria. */
    @Transactional(readOnly = true)
    public List<ProductoResponse> listar(Long categoriaId) {
        List<Producto> productos;
        if (categoriaId == null) {
            productos = productoRepository.findAllByOrderByNombreAsc();
        } else {
            categoriaService.buscarEntidad(categoriaId); // 404 si la categoria no existe
            productos = productoRepository.findByCategoriaIdOrderByNombreAsc(categoriaId);
        }
        return productos.stream().map(ProductoResponse::desde).toList();
    }

    @Transactional(readOnly = true)
    public ProductoResponse obtenerPorId(Long id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Producto con id " + id + " no encontrado"));
        return ProductoResponse.desde(producto);
    }

    @Transactional
    public ProductoResponse crearProducto(ProductoRequest datos) {
        Categoria categoria = categoriaService.buscarEntidad(datos.categoriaId());

        Producto producto = new Producto();
        producto.setCategoria(categoria);
        producto.setNombre(nombreLimpio(datos.nombre()));
        producto.setDescripcion(TextoSeguro.limpiar(datos.descripcion()));
        producto.setPrecio(datos.precio());
        producto.setStock(datos.stock());
        producto.setImagenUrl(urlLimpia(datos.imagenUrl()));
        producto.setActivo(true);

        return ProductoResponse.desde(productoRepository.save(producto));
    }

    @Transactional
    public ProductoResponse actualizarProducto(Long id, ProductoRequest datos) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Producto con id " + id + " no encontrado"));
        Categoria categoria = categoriaService.buscarEntidad(datos.categoriaId());

        producto.setCategoria(categoria);
        producto.setNombre(nombreLimpio(datos.nombre()));
        producto.setDescripcion(TextoSeguro.limpiar(datos.descripcion()));
        producto.setPrecio(datos.precio());
        producto.setStock(datos.stock());
        producto.setImagenUrl(urlLimpia(datos.imagenUrl()));

        return ProductoResponse.desde(productoRepository.save(producto));
    }

    @Transactional
    public void eliminarProducto(Long id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Producto con id " + id + " no encontrado"));
        // Los pedidos guardan una copia del producto, pero los carritos lo referencian: se retira de ellos.
        itemCarritoRepository.eliminarPorProducto(id);
        productoRepository.delete(producto);
    }

    /** Quita HTML del nombre (mitigacion XSS); si no queda texto, es un dato invalido. */
    private String nombreLimpio(String nombre) {
        String limpio = TextoSeguro.limpiar(nombre);
        if (limpio == null) {
            throw new DatoInvalidoException("nombre", "El nombre no puede quedar vacio ni contener solo HTML");
        }
        return limpio;
    }

    /** La URL ya viene validada como http(s) por el DTO, asi que no admite javascript: ni data:. */
    private String urlLimpia(String url) {
        return (url == null || url.isBlank()) ? null : url.trim();
    }
}
