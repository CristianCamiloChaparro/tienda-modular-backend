package com.tienda.modular.repository;

import com.tienda.modular.model.Carrito;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CarritoRepository extends JpaRepository<Carrito, String> {
}
