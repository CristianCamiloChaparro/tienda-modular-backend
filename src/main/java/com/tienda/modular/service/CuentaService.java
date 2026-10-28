package com.tienda.modular.service;

import com.tienda.modular.dto.ConfiguracionDosFactoresResponse;
import com.tienda.modular.dto.UsuarioResponse;
import com.tienda.modular.exception.DatoInvalidoException;
import com.tienda.modular.exception.DemasiadosIntentosException;
import com.tienda.modular.exception.NoAutorizadoException;
import com.tienda.modular.exception.ReglaNegocioException;
import com.tienda.modular.model.TokenRestablecimiento;
import com.tienda.modular.model.Usuario;
import com.tienda.modular.repository.TokenRestablecimientoRepository;
import com.tienda.modular.repository.UsuarioRepository;
import com.tienda.modular.security.Totp;
import com.tienda.modular.security.UsuarioAutenticado;
import com.tienda.modular.service.correo.CorreoService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;

/** Seguridad de la cuenta: olvide mi contrasena, cambio de contrasena y verificacion en dos pasos. */
@Service
public class CuentaService {

    static final String SESION_SECRETO_NUEVO = "cuenta.dosFactores.secretoNuevo";
    static final String SESION_FALLOS = "cuenta.fallos";
    static final int MAX_FALLOS = 5;
    private static final int MINUTOS_VIGENCIA_ENLACE = 30;
    private static final int SEGUNDOS_ENTRE_CORREOS = 60;
    private static final SecureRandom ALEATORIO = new SecureRandom();

    private final UsuarioRepository usuarioRepository;
    private final TokenRestablecimientoRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final CorreoService correoService;
    private final AuthService authService;
    private final String urlAplicacion;

    public CuentaService(UsuarioRepository usuarioRepository, TokenRestablecimientoRepository tokenRepository,
                         PasswordEncoder passwordEncoder, CorreoService correoService, AuthService authService,
                         @Value("${app.url:http://localhost:5173}") String urlAplicacion) {
        this.usuarioRepository = usuarioRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.correoService = correoService;
        this.authService = authService;
        this.urlAplicacion = urlAplicacion.replaceAll("/+$", "");
    }

    // ---------- Olvide mi contrasena ----------

    /**
     * Envia el enlace de restablecimiento si el correo existe. No avisa si la cuenta no existe
     * (la respuesta es la misma) para no revelar que correos estan registrados.
     */
    @Transactional
    public void solicitarRestablecimiento(String email) {
        usuarioRepository.findByEmailIgnoreCase(email.trim()).ifPresent(usuario -> {
            LocalDateTime ahora = LocalDateTime.now();
            // Un correo por minuto como maximo, para que nadie pueda inundar el buzon de otra persona.
            if (tokenRepository.existsByUsuarioAndCreadoEnAfter(usuario, ahora.minusSeconds(SEGUNDOS_ENTRE_CORREOS))) {
                return;
            }
            tokenRepository.invalidarPendientes(usuario, ahora);
            byte[] bytes = new byte[32];
            ALEATORIO.nextBytes(bytes);
            String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
            tokenRepository.save(new TokenRestablecimiento(usuario, sha256(token), ahora.plusMinutes(MINUTOS_VIGENCIA_ENLACE)));
            correoService.enviarRestablecimiento(usuario.getEmail(), usuario.getNombre(),
                    urlAplicacion + "/restablecer?token=" + token);
        });
    }

    @Transactional
    public void restablecer(String token, String nuevaPassword) {
        LocalDateTime ahora = LocalDateTime.now();
        TokenRestablecimiento registro = tokenRepository.findByTokenHash(sha256(token))
                .filter(t -> t.vigente(ahora))
                .orElseThrow(() -> new DatoInvalidoException("token",
                        "El enlace no es válido o ya venció. Pide uno nuevo."));
        Usuario usuario = registro.getUsuario();
        usuario.setPasswordHash(passwordEncoder.encode(nuevaPassword));
        tokenRepository.invalidarPendientes(usuario, ahora);
    }

    // ---------- Cambio de contrasena con sesion ----------

    @Transactional
    public void cambiarPassword(UsuarioAutenticado principal, String actual, String nueva, HttpSession sesion) {
        Usuario usuario = cargar(principal);
        if (!passwordEncoder.matches(actual, usuario.getPasswordHash())) {
            registrarFallo(sesion);
            throw new DatoInvalidoException("actual", "La contraseña actual no es correcta");
        }
        usuario.setPasswordHash(passwordEncoder.encode(nueva));
        tokenRepository.invalidarPendientes(usuario, LocalDateTime.now());
        sesion.removeAttribute(SESION_FALLOS);
    }

    // ---------- Verificacion en dos pasos ----------

    /** Genera un secreto nuevo; queda en la sesion hasta que el usuario confirme con un codigo. */
    @Transactional(readOnly = true)
    public ConfiguracionDosFactoresResponse iniciarDosFactores(UsuarioAutenticado principal, HttpSession sesion) {
        Usuario usuario = cargar(principal);
        if (usuario.isTotpActivo()) {
            throw new ReglaNegocioException("La verificación en dos pasos ya está activa");
        }
        String secreto = Totp.generarSecreto();
        sesion.setAttribute(SESION_SECRETO_NUEVO, secreto);
        return new ConfiguracionDosFactoresResponse(secreto, Totp.enlaceOtpauth("Tienda", usuario.getEmail(), secreto));
    }

    @Transactional
    public UsuarioResponse activarDosFactores(UsuarioAutenticado principal, String codigo, HttpSession sesion) {
        Usuario usuario = cargar(principal);
        String secreto = (String) sesion.getAttribute(SESION_SECRETO_NUEVO);
        if (secreto == null) {
            throw new ReglaNegocioException("Primero genera el código QR");
        }
        long paso = Totp.verificar(secreto, codigo, Instant.now());
        if (paso < 0) {
            registrarFallo(sesion);
            throw new DatoInvalidoException("codigo", "El código no es correcto. Revisa la hora del celular y prueba con el código nuevo.");
        }
        usuario.setTotpSecreto(secreto);
        usuario.setTotpActivo(true);
        usuario.setTotpUltimoPaso(paso);
        sesion.removeAttribute(SESION_SECRETO_NUEVO);
        sesion.removeAttribute(SESION_FALLOS);
        return UsuarioResponse.desde(usuario);
    }

    @Transactional
    public UsuarioResponse desactivarDosFactores(UsuarioAutenticado principal, String codigo, HttpSession sesion) {
        Usuario usuario = cargar(principal);
        if (!usuario.isTotpActivo()) {
            throw new ReglaNegocioException("La verificación en dos pasos no está activa");
        }
        if (!authService.aceptarCodigo(usuario, codigo)) {
            registrarFallo(sesion);
            throw new DatoInvalidoException("codigo", "El código no es correcto");
        }
        usuario.setTotpActivo(false);
        usuario.setTotpSecreto(null);
        usuario.setTotpUltimoPaso(null);
        sesion.removeAttribute(SESION_FALLOS);
        return UsuarioResponse.desde(usuario);
    }

    private Usuario cargar(UsuarioAutenticado principal) {
        return usuarioRepository.findById(principal.id())
                .orElseThrow(() -> new NoAutorizadoException("Vuelve a iniciar sesión."));
    }

    /** Tras varios intentos fallidos con la sesion abierta se cierra la sesion (alguien puede estar adivinando). */
    private void registrarFallo(HttpSession sesion) {
        Integer fallos = (Integer) sesion.getAttribute(SESION_FALLOS);
        int total = fallos == null ? 1 : fallos + 1;
        if (total >= MAX_FALLOS) {
            sesion.invalidate();
            throw new DemasiadosIntentosException("Demasiados intentos fallidos. Por seguridad cerramos tu sesión.");
        }
        sesion.setAttribute(SESION_FALLOS, total);
    }

    static String sha256(String texto) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(texto.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
