package com.tienda.modular.service;

import com.tienda.modular.dto.LoginRequest;
import com.tienda.modular.dto.RegistroRequest;
import com.tienda.modular.dto.UsuarioResponse;
import com.tienda.modular.exception.DatoInvalidoException;
import com.tienda.modular.exception.ReglaNegocioException;
import com.tienda.modular.model.Rol;
import com.tienda.modular.model.Usuario;
import com.tienda.modular.repository.UsuarioRepository;
import com.tienda.modular.security.UsuarioAutenticado;
import com.tienda.modular.util.TextoSeguro;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfTokenRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Registro, inicio y cierre de sesion. La sesion vive en el servidor (cookie JSESSIONID HttpOnly). */
@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final CsrfTokenRepository csrfTokenRepository;
    private final SecurityContextRepository securityContextRepository = new HttpSessionSecurityContextRepository();

    public AuthService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager, CsrfTokenRepository csrfTokenRepository) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.csrfTokenRepository = csrfTokenRepository;
    }

    @Transactional
    public UsuarioResponse registrar(RegistroRequest datos, HttpServletRequest request, HttpServletResponse response) {
        String email = datos.email().trim().toLowerCase();
        if (usuarioRepository.existsByEmailIgnoreCase(email)) {
            throw new ReglaNegocioException("Ya existe una cuenta con el correo '" + email + "'");
        }
        String nombre = TextoSeguro.limpiar(datos.nombre());
        if (nombre == null) {
            throw new DatoInvalidoException("nombre", "El nombre no puede quedar vacio");
        }
        Usuario usuario = usuarioRepository.save(
                new Usuario(nombre, email, passwordEncoder.encode(datos.password()), Rol.CLIENTE));
        return iniciarSesion(UsuarioAutenticado.desde(usuario), request, response);
    }

    public UsuarioResponse login(LoginRequest datos, HttpServletRequest request, HttpServletResponse response) {
        // Lanza BadCredentialsException (401) si el correo o la contrasena no coinciden.
        Authentication autenticacion = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(datos.email().trim(), datos.password()));
        return iniciarSesion((UsuarioAutenticado) autenticacion.getPrincipal(), request, response);
    }

    public void logout(HttpServletRequest request, HttpServletResponse response) {
        SecurityContextHolder.clearContext();
        HttpSession sesion = request.getSession(false);
        if (sesion != null) {
            sesion.invalidate();
        }
        renovarTokenCsrf(request, response);
    }

    private UsuarioResponse iniciarSesion(UsuarioAutenticado usuario, HttpServletRequest request,
                                          HttpServletResponse response) {
        // Proteccion contra fijacion de sesion: nuevo id de sesion al autenticarse.
        if (request.getSession(false) != null) {
            request.changeSessionId();
        }
        UsuarioAutenticado principal = usuario.sinCredenciales();
        SecurityContext contexto = SecurityContextHolder.createEmptyContext();
        contexto.setAuthentication(UsernamePasswordAuthenticationToken.authenticated(
                principal, null, principal.getAuthorities()));
        SecurityContextHolder.setContext(contexto);
        securityContextRepository.saveContext(contexto, request, response);
        renovarTokenCsrf(request, response);
        return UsuarioResponse.desde(principal);
    }

    /** Un token CSRF nuevo despues de cada cambio de sesion. */
    private void renovarTokenCsrf(HttpServletRequest request, HttpServletResponse response) {
        csrfTokenRepository.saveToken(csrfTokenRepository.generateToken(request), request, response);
    }
}
