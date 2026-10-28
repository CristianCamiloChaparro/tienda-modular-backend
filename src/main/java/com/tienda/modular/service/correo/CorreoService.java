package com.tienda.modular.service.correo;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.HtmlUtils;

import java.util.List;
import java.util.Map;

/**
 * Envio de correos transaccionales con la API HTTP de Brevo (plan gratuito: 300 correos al dia).
 * Se usa HTTPS y no SMTP porque muchos servicios en la nube (como el plan gratuito de Render) bloquean
 * los puertos SMTP. Sin BREVO_API_KEY el correo no se envia y el enlace se escribe en el log del servidor,
 * lo que basta para desarrollo local.
 */
@Service
public class CorreoService {

    private static final Logger log = LoggerFactory.getLogger(CorreoService.class);
    private static final String URL_BREVO = "https://api.brevo.com/v3/smtp/email";

    private final RestClient restClient;
    private final String apiKey;
    private final String remitente;
    private final String nombreRemitente;

    public CorreoService(@Value("${app.correo.brevo-api-key:}") String apiKey,
                         @Value("${app.correo.remitente:}") String remitente,
                         @Value("${app.correo.nombre-remitente:Tienda}") String nombreRemitente) {
        this.restClient = RestClient.create();
        this.apiKey = apiKey;
        this.remitente = remitente;
        this.nombreRemitente = nombreRemitente;
        if (!configurado()) {
            log.warn("Correo sin configurar (BREVO_API_KEY / MAIL_FROM): los enlaces se escribiran en el log");
        }
    }

    public boolean configurado() {
        return !apiKey.isBlank() && !remitente.isBlank();
    }

    public void enviarRestablecimiento(String email, String nombre, String enlace) {
        String asunto = "Restablece tu contraseña de Tienda";
        String texto = "Hola " + nombre + ",\n\nRecibimos una solicitud para cambiar la contraseña de tu cuenta. "
                + "Abre este enlace para crear una nueva (vence en 30 minutos):\n\n" + enlace
                + "\n\nSi no fuiste tú, ignora este correo: tu contraseña no cambiará.\n\nTienda";
        String html = """
                <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:auto;color:#1c1a17">
                  <h1 style="font-family:Georgia,serif;font-style:italic;font-weight:normal">Tienda<span style="color:#b5552e">.</span></h1>
                  <p>Hola %s,</p>
                  <p>Recibimos una solicitud para cambiar la contraseña de tu cuenta.</p>
                  <p style="margin:28px 0">
                    <a href="%s" style="background:#1c1a17;color:#fffdf9;padding:12px 22px;text-decoration:none;border-radius:4px">
                      Crear nueva contraseña</a>
                  </p>
                  <p style="color:#6e675d;font-size:13px">El enlace vence en 30 minutos y solo sirve una vez.
                    Si no fuiste tú, ignora este correo: tu contraseña no cambiará.</p>
                </div>""".formatted(HtmlUtils.htmlEscape(nombre), HtmlUtils.htmlEscape(enlace));

        if (!configurado()) {
            log.info("[correo no enviado: sin configurar] Restablecimiento para {}: {}", email, enlace);
            return;
        }
        try {
            restClient.post()
                    .uri(URL_BREVO)
                    .header("api-key", apiKey)
                    .body(Map.of(
                            "sender", Map.of("email", remitente, "name", nombreRemitente),
                            "to", List.of(Map.of("email", email, "name", nombre)),
                            "subject", asunto,
                            "htmlContent", html,
                            "textContent", texto))
                    .retrieve()
                    .toBodilessEntity();
            log.info("Correo de restablecimiento enviado a {}", email);
        } catch (RestClientException e) {
            // No se propaga: la respuesta al usuario es la misma exista o no la cuenta.
            log.error("No se pudo enviar el correo de restablecimiento a {}: {}", email, e.getMessage());
        }
    }
}
