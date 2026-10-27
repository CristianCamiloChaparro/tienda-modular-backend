package com.tienda.modular.config;

import com.tienda.modular.model.Rol;
import com.tienda.modular.model.Usuario;
import com.tienda.modular.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Crea el primer administrador si todavia no existe ninguno. La contrasena llega por la variable
 * ADMIN_PASSWORD; si no esta definida no se crea ninguno (nunca hay una clave por defecto).
 */
@Component
public class AdminSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminSeeder.class);

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.nombre}")
    private String nombre;

    @Value("${app.admin.email}")
    private String email;

    @Value("${app.admin.password}")
    private String password;

    public AdminSeeder(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (usuarioRepository.existsByRol(Rol.ADMIN)) {
            return;
        }
        if (password == null || password.isBlank()) {
            log.warn("AdminSeeder: ADMIN_PASSWORD no esta definida, no se creo el administrador inicial");
            return;
        }
        usuarioRepository.save(new Usuario(nombre, email.trim().toLowerCase(),
                passwordEncoder.encode(password), Rol.ADMIN));
        log.info("AdminSeeder: se creo el administrador {}", email);
    }
}
