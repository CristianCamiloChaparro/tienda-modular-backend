package com.tienda.modular.service;

import com.tienda.modular.dto.ProductoRequest;
import com.tienda.modular.dto.ProductoResponse;
import com.tienda.modular.exception.RecursoNoEncontradoException;
import com.tienda.modular.model.Categoria;
import com.tienda.modular.model.Producto;
import com.tienda.modular.repository.ProductoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final CategoriaService categoriaService;

    public ProductoService(ProductoRepository productoRepository, CategoriaService categoriaService) {
        this.productoRepository = productoRepository;
        this.categoriaService = categoriaService;
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
        producto.setNombre(datos.nombre().trim());
        producto.setDescripcion(limpiar(datos.descripcion()));
        producto.setPrecio(datos.precio());
        producto.setStock(datos.stock());
        producto.setImagenUrl(limpiar(datos.imagenUrl()));
        producto.setActivo(true);

        return ProductoResponse.desde(productoRepository.save(producto));
    }

    private String limpiar(String texto) {
        return (texto == null || texto.isBlank()) ? null : texto.trim();
    }
}
