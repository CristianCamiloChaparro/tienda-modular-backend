package com.tienda.modular.config;

import com.tienda.modular.security.UsuarioDetailsService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/** Autenticacion por correo y contrasena (hash BCrypt). */
@Configuration
public class AuthConfig {

    /** Costo 12 (2^12 rondas): hash lento con sal propia; los hashes de costo 10 ya guardados siguen siendo validos. */
    static final int COSTO_BCRYPT = 12;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(COSTO_BCRYPT);
    }

    @Bean
    public AuthenticationManager authenticationManager(UsuarioDetailsService usuarioDetailsService,
                                                       PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider proveedor = new DaoAuthenticationProvider(usuarioDetailsService);
        proveedor.setPasswordEncoder(passwordEncoder);
        return new ProviderManager(proveedor);
    }
}
