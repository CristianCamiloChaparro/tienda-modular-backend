package com.tienda.modular.security;

import com.tienda.modular.model.Rol;
import com.tienda.modular.model.Usuario;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.io.Serializable;
import java.util.Collection;
import java.util.List;

/** Datos del usuario que viajan en la sesion (sin la entidad JPA completa). */
public record UsuarioAutenticado(Long id, String nombre, String email, String passwordHash, Rol rol)
        implements UserDetails, Serializable {

    public static UsuarioAutenticado desde(Usuario u) {
        return new UsuarioAutenticado(u.getId(), u.getNombre(), u.getEmail(), u.getPasswordHash(), u.getRol());
    }

    /** Copia sin el hash, que es lo que se guarda en la sesion despues del login. */
    public UsuarioAutenticado sinCredenciales() {
        return new UsuarioAutenticado(id, nombre, email, null, rol);
    }

    public boolean esAdmin() {
        return rol == Rol.ADMIN;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + rol.name()));
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }
}
