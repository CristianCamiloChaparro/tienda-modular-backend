package com.tienda.modular.config;

import com.tienda.modular.model.Categoria;
import com.tienda.modular.model.Producto;
import com.tienda.modular.repository.CategoriaRepository;
import com.tienda.modular.repository.ProductoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/** Carga datos de ejemplo la primera vez (si no hay categorias). */
@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final CategoriaRepository categoriaRepository;
    private final ProductoRepository productoRepository;

    public DataSeeder(CategoriaRepository categoriaRepository, ProductoRepository productoRepository) {
        this.categoriaRepository = categoriaRepository;
        this.productoRepository = productoRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (categoriaRepository.count() > 0) {
            return;
        }
        Categoria ropa = categoriaRepository.save(new Categoria("Ropa", "Camisetas, buzos y pantalones"));
        Categoria accesorios = categoriaRepository.save(new Categoria("Accesorios", "Gorras, bolsos y complementos"));
        Categoria hogar = categoriaRepository.save(new Categoria("Hogar", "Decoracion y articulos para la casa"));

        guardar(ropa, "Camiseta basica blanca", "Algodon 100%, corte regular", "35000", 40, "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80");
        guardar(ropa, "Buzo con capota gris", "Perchado interior, bolsillo canguro", "89900", 15, "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80");
        guardar(accesorios, "Gorra negra bordada", "Ajustable, logo bordado", "45000", 20, "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=600&q=80");
        guardar(accesorios, "Bolso tote de lona", "Lona resistente, asas largas", "52000", 12, "https://images.unsplash.com/photo-1597484661643-2f5fef640dd1?auto=format&fit=crop&w=600&q=80");
        guardar(hogar, "Taza de ceramica 350 ml", "Apta para microondas", "18000", 30, "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80");
        guardar(hogar, "Vela aromatica de vainilla", "Cera de soya, 40 horas", "27500", 0, "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=600&q=80");

        log.info("DataSeeder: se cargaron 3 categorias y 6 productos de ejemplo");
    }

    private void guardar(Categoria c, String nombre, String desc, String precio, int stock, String imagenUrl) {
        Producto p = new Producto();
        p.setCategoria(c);
        p.setNombre(nombre);
        p.setDescripcion(desc);
        p.setPrecio(new BigDecimal(precio));
        p.setStock(stock);
        p.setImagenUrl(imagenUrl);
        productoRepository.save(p);
    }
}
