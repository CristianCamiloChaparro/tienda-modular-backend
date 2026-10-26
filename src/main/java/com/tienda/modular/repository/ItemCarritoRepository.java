package com.tienda.modular.repository;

import com.tienda.modular.model.ItemCarrito;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface ItemCarritoRepository extends JpaRepository<ItemCarrito, Long> {

    /** Quita el producto de todos los carritos antes de eliminarlo del catalogo. */
    @Modifying
    @Query("delete from ItemCarrito i where i.producto.id = :productoId")
    void eliminarPorProducto(Long productoId);
}
