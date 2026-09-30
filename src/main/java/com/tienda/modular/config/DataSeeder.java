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

        guardar(ropa, "Camiseta basica blanca", "Algodon 100%, corte regular", "35000", 40, "camiseta");
        guardar(ropa, "Buzo con capota gris", "Perchado interior, bolsillo canguro", "89900", 15, "buzo");
        guardar(accesorios, "Gorra negra bordada", "Ajustable, logo bordado", "45000", 20, "gorra");
        guardar(accesorios, "Bolso tote de lona", "Lona resistente, asas largas", "52000", 12, "tote");
        guardar(hogar, "Taza de ceramica 350 ml", "Apta para microondas", "18000", 30, "taza");
        guardar(hogar, "Vela aromatica de vainilla", "Cera de soya, 40 horas", "27500", 0, "vela");

        log.info("DataSeeder: se cargaron 3 categorias y 6 productos de ejemplo");
    }

    private void guardar(Categoria c, String nombre, String desc, String precio, int stock, String seed) {
        Producto p = new Producto();
        p.setCategoria(c);
        p.setNombre(nombre);
        p.setDescripcion(desc);
        p.setPrecio(new BigDecimal(precio));
        p.setStock(stock);
        p.setImagenUrl("https://picsum.photos/seed/" + seed + "/400/400");
        productoRepository.save(p);
    }
}
