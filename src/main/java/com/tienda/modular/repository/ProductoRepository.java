package com.tienda.modular.repository;

import com.tienda.modular.model.Producto;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductoRepository extends JpaRepository<Producto, Long> {

    @EntityGraph(attributePaths = "categoria")
    List<Producto> findAllByOrderByNombreAsc();

    @EntityGraph(attributePaths = "categoria")
    List<Producto> findByCategoriaIdOrderByNombreAsc(Long categoriaId);

    boolean existsByCategoriaId(Long categoriaId);
}
