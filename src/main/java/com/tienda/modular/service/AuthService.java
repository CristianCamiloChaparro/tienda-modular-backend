package com.tienda.modular.service;

import com.tienda.modular.dto.DosFactoresRequeridoResponse;
import com.tienda.modular.dto.LoginRequest;
import com.tienda.modular.dto.RegistroRequest;
import com.tienda.modular.dto.UsuarioResponse;
import com.tienda.modular.exception.DatoInvalidoException;
import com.tienda.modular.exception.DemasiadosIntentosException;
import com.tienda.modular.exception.NoAutorizadoException;
import com.tienda.modular.exception.ReglaNegocioException;
import com.tienda.modular.model.Rol;
import com.tienda.modular.model.Usuario;
import com.tienda.modular.repository.UsuarioRepository;
import com.tienda.modular.security.Totp;
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

import java.io.Serializable;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

/**
 * Registro, inicio y cierre de sesion. La sesion vive en el servidor (cookie JSESSIONID HttpOnly).
 * Si la cuenta tiene verificacion en dos pasos, la contrasena correcta no basta: la sesion queda
 * pendiente hasta que se envie el codigo de la app autenticadora.
 */
@Service
public class AuthService {

    static final String SESION_PENDIENTE = "auth.dosFactores.pendiente";
    static final int MAX_INTENTOS_CODIGO = 5;
    private static final Duration VIGENCIA_PENDIENTE = Duration.ofMinutes(5);

    /** Login a medias: contrasena correcta, falta el codigo. Se guarda en la sesion, nunca en el navegador. */
    record PendienteDosFactores(Long usuarioId, Instant expira, int intentos) implements Serializable {
    }

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

    @Transactional(readOnly = true)
    public Optional<UsuarioResponse> perfil(UsuarioAutenticado usuario) {
        return usuario == null ? Optional.empty() : usuarioRepository.findById(usuario.id()).map(UsuarioResponse::desde);
    }

    @Transactional
    public UsuarioResponse registrar(RegistroRequest datos, HttpServletRequest request, HttpServletResponse response) {
        String email = datos.email().trim().toLowerCase();
        if (usuarioRepository.existsByEmailIgnoreCase(email)) {
            throw new ReglaNegocioException("Ya existe una cuenta con el correo '" + email + "'");
        }
        String nombre = TextoSeguro.limpiar(datos.nombre());
        if (nombre == null) {
            throw new DatoInvalidoException("nombre", "El nombre no puede quedar vacío");
        }
        Usuario usuario = usuarioRepository.save(
                new Usuario(nombre, email, passwordEncoder.encode(datos.password()), Rol.CLIENTE));
        iniciarSesion(UsuarioAutenticado.desde(usuario), request, response);
        return UsuarioResponse.desde(usuario);
    }

    /**
     * Devuelve el usuario con la sesion iniciada, o {@link DosFactoresRequeridoResponse} si la cuenta
     * pide el codigo de la app autenticadora.
     */
    @Transactional(readOnly = true)
    public Object login(LoginRequest datos, HttpServletRequest request, HttpServletResponse response) {
        // Lanza BadCredentialsException (401) si el correo o la contrasena no coinciden.
        Authentication autenticacion = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(datos.email().trim(), datos.password()));
        UsuarioAutenticado principal = (UsuarioAutenticado) autenticacion.getPrincipal();
        Usuario usuario = usuarioRepository.findById(principal.id()).orElseThrow();

        if (usuario.isTotpActivo()) {
            HttpSession sesion = request.getSession(true);
            // Si habia otra sesion iniciada en este navegador, se cierra: aun no se ha probado el segundo factor.
            sesion.removeAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY);
            SecurityContextHolder.clearContext();
            sesion.setAttribute(SESION_PENDIENTE,
                    new PendienteDosFactores(usuario.getId(), Instant.now().plus(VIGENCIA_PENDIENTE), 0));
            return new DosFactoresRequeridoResponse(true, "Ingresa el código de tu app autenticadora");
        }
        iniciarSesion(principal, request, response);
        return UsuarioResponse.desde(usuario);
    }

    /** Segundo paso del login: valida el codigo TOTP contra la sesion pendiente. */
    @Transactional
    public UsuarioResponse verificarSegundoFactor(String codigo, HttpServletRequest request,
                                                  HttpServletResponse response) {
        HttpSession sesion = request.getSession(false);
        PendienteDosFactores pendiente = sesion == null ? null
                : (PendienteDosFactores) sesion.getAttribute(SESION_PENDIENTE);
        if (pendiente == null || Instant.now().isAfter(pendiente.expira())) {
            if (sesion != null) {
                sesion.removeAttribute(SESION_PENDIENTE);
            }
            throw new NoAutorizadoException("La verificación venció. Vuelve a iniciar sesión.");
        }
        Usuario usuario = usuarioRepository.findById(pendiente.usuarioId())
                .orElseThrow(() -> new NoAutorizadoException("Vuelve a iniciar sesión."));

        if (!aceptarCodigo(usuario, codigo)) {
            int intentos = pendiente.intentos() + 1;
            if (intentos >= MAX_INTENTOS_CODIGO) {
                sesion.removeAttribute(SESION_PENDIENTE);
                throw new DemasiadosIntentosException("Demasiados códigos incorrectos. Vuelve a iniciar sesión.");
            }
            sesion.setAttribute(SESION_PENDIENTE,
                    new PendienteDosFactores(pendiente.usuarioId(), pendiente.expira(), intentos));
            throw new DatoInvalidoException("codigo", "El código no es correcto. Te quedan "
                    + (MAX_INTENTOS_CODIGO - intentos) + " intentos.");
        }
        sesion.removeAttribute(SESION_PENDIENTE);
        iniciarSesion(UsuarioAutenticado.desde(usuario), request, response);
        return UsuarioResponse.desde(usuario);
    }

    /**
     * Valida el codigo con el secreto del usuario y guarda el intervalo usado, para que el mismo
     * codigo no sirva dos veces (proteccion contra repeticion).
     */
    boolean aceptarCodigo(Usuario usuario, String codigo) {
        long paso = Totp.verificar(usuario.getTotpSecreto(), codigo, Instant.now());
        if (paso < 0 || (usuario.getTotpUltimoPaso() != null && paso <= usuario.getTotpUltimoPaso())) {
            return false;
        }
        usuario.setTotpUltimoPaso(paso);
        return true;
    }

    public void logout(HttpServletRequest request, HttpServletResponse response) {
        SecurityContextHolder.clearContext();
        HttpSession sesion = request.getSession(false);
        if (sesion != null) {
            sesion.invalidate();
        }
        renovarTokenCsrf(request, response);
    }

    private void iniciarSesion(UsuarioAutenticado usuario, HttpServletRequest request, HttpServletResponse response) {
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
    }

    /** Un token CSRF nuevo despues de cada cambio de sesion. */
    private void renovarTokenCsrf(HttpServletRequest request, HttpServletResponse response) {
        csrfTokenRepository.saveToken(csrfTokenRepository.generateToken(request), request, response);
    }
}
