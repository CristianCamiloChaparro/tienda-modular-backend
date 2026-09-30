package com.tienda.modular.service;

import com.tienda.modular.dto.CategoriaRequest;
import com.tienda.modular.dto.CategoriaResponse;
import com.tienda.modular.exception.RecursoNoEncontradoException;
import com.tienda.modular.exception.ReglaNegocioException;
import com.tienda.modular.model.Categoria;
import com.tienda.modular.repository.CategoriaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CategoriaService {

    private final CategoriaRepository categoriaRepository;

    public CategoriaService(CategoriaRepository categoriaRepository) {
        this.categoriaRepository = categoriaRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoriaResponse> listarCategorias() {
        return categoriaRepository.findAllByOrderByNombreAsc()
                .stream()
                .map(CategoriaResponse::desde)
                .toList();
    }

    @Transactional(readOnly = true)
    public CategoriaResponse obtenerPorId(Long id) {
        return CategoriaResponse.desde(buscarEntidad(id));
    }

    @Transactional
    public CategoriaResponse crearCategoria(CategoriaRequest datos) {
        String nombre = datos.nombre().trim();
        if (categoriaRepository.existsByNombreIgnoreCase(nombre)) {
            throw new ReglaNegocioException("Ya existe una categoria con el nombre '" + nombre + "'");
        }
        Categoria categoria = new Categoria(nombre, limpiar(datos.descripcion()));
        return CategoriaResponse.desde(categoriaRepository.save(categoria));
    }

    /** Uso interno (ProductoService): obtiene la entidad o lanza 404. */
    @Transactional(readOnly = true)
    public Categoria buscarEntidad(Long id) {
        return categoriaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Categoria con id " + id + " no encontrada"));
    }

    private String limpiar(String texto) {
        return (texto == null || texto.isBlank()) ? null : texto.trim();
    }
}
