package com.tienda.modular.repository;

import com.tienda.modular.model.Carrito;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CarritoRepository extends JpaRepository<Carrito, String> {

    @EntityGraph(attributePaths = {"items", "items.producto"})
    Optional<Carrito> findWithItemsById(String id);
}
