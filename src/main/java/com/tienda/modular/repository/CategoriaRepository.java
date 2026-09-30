package com.tienda.modular.repository;

import com.tienda.modular.model.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CategoriaRepository extends JpaRepository<Categoria, Long> {

    boolean existsByNombreIgnoreCase(String nombre);

    List<Categoria> findAllByOrderByNombreAsc();
}
