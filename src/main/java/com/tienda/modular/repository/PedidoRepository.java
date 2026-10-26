package com.tienda.modular.repository;

import com.tienda.modular.model.Pedido;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    @EntityGraph(attributePaths = {"usuario", "items"})
    List<Pedido> findAllByOrderByCreadoEnDesc();

    @EntityGraph(attributePaths = {"usuario", "items"})
    List<Pedido> findByUsuarioIdOrderByCreadoEnDesc(Long usuarioId);

    @EntityGraph(attributePaths = {"usuario", "items"})
    Optional<Pedido> findWithItemsById(Long id);
}
