# Seguridad — guía para la sustentación

Cada medida exigida (HTTPS, XSS, CSRF) tiene un **caso concreto** que se puede mostrar en vivo. Las pruebas automáticas que lo respaldan aparecen al final de cada sección.

---

## 1. HTTPS

**Qué se hizo**
- En producción (Render) todo el tráfico va por HTTPS y la plataforma redirige `http://` a `https://`.
- Con Docker Compose, Caddy termina TLS en `https://localhost` con un certificado local y redirige `http → https`.
- Perfil `https` del backend: TLS propio en `https://localhost:8443` y el puerto `8080` solo redirige (`./scripts/generar-certificado.sh` + `-Dspring-boot.run.profiles=https`).
- Cabecera **HSTS** (`Strict-Transport-Security: max-age=31536000; includeSubDomains`) en respuestas HTTPS: el navegador no vuelve a intentar HTTP.
- Cookies de sesión con `Secure` en producción (`COOKIE_SECURE=true`): nunca viajan por HTTP.

**Demostración**
1. Abrir `http://<dominio>` → el navegador termina en `https://<dominio>` (candado visible).
2. DevTools → Network → cualquier respuesta de `/api/v1/...` → ver `Strict-Transport-Security`.
3. DevTools → Application → Cookies → `JSESSIONID` con `Secure` y `HttpOnly` marcados.

Local con el perfil `https`:
```bash
./scripts/generar-certificado.sh
./mvnw spring-boot:run -Dspring-boot.run.profiles=https
curl -I http://localhost:8080/api/v1/productos      # 302 -> https://localhost:8443/...
curl -kI https://localhost:8443/api/v1/productos    # 200 + Strict-Transport-Security
```

---

## 2. Mitigación de XSS (Cross-Site Scripting)

Se aplica **defensa en profundidad**, en tres capas:

| Capa | Medida | Dónde |
|---|---|---|
| Entrada | Se elimina todo HTML/JS de los textos antes de guardarlos (jsoup, lista blanca vacía) | `util/TextoSeguro.java`, usado en categorías, productos, usuarios y pedidos |
| Entrada | Las URL de imagen solo aceptan `http(s)://` (bloquea `javascript:` y `data:`) | `ProductoRequest.imagenUrl` |
| Salida | React escapa todo lo que imprime; no se usa `dangerouslySetInnerHTML` | Frontend |
| Navegador | `Content-Security-Policy: script-src 'self'; object-src 'none'; frame-ancestors 'none'…` bloquea scripts inyectados aunque llegaran a la página | `SecurityConfig` (API) y `nginx/default.conf.template` (frontend) |
| Robo de sesión | La cookie `JSESSIONID` es `HttpOnly`: un script no puede leerla | `application.properties` |

**Demostración**
1. Como administrador crear un producto con el nombre `<script>alert('xss')</script>Cuaderno` o `<img src=x onerror=alert(1)>Cuaderno`.
2. Resultado: se guarda como **`Cuaderno`**, sin alerta. En Swagger, la respuesta del `POST /api/v1/productos` muestra el nombre ya limpio.
3. Intentar `imagenUrl: "javascript:alert(1)"` → **400** "La imagen debe ser una URL http(s)".
4. DevTools → Network → ver la cabecera `Content-Security-Policy` en la página y en la API.

**Pruebas:** `TextoSeguroTest` (script, eventos `onerror`, HTML codificado como entidades) y `FlujoCompraIntegrationTest.adminGestionaCatalogoYSeMitigaXss`.

---

## 3. Protección CSRF (Cross-Site Request Forgery)

**Problema.** Si el administrador tiene sesión abierta y visita una página maliciosa, esa página podría enviar un `DELETE /api/v1/productos/1` y el navegador adjuntaría la cookie de sesión.

**Qué se hizo** (patrón *double submit cookie* de Spring Security):
- El backend entrega la cookie `XSRF-TOKEN` (legible solo por JavaScript del mismo origen).
- En **todo** `POST/PUT/PATCH/DELETE` el frontend copia ese valor en la cabecera `X-XSRF-TOKEN` (`src/services/http.ts`).
- Spring Security compara cabecera y cookie; si falta o no coincide responde **403** sin ejecutar nada.
- Un sitio de otro dominio no puede leer la cookie ni poner la cabecera, así que no puede falsificar la petición. `SameSite=Lax` en las cookies es una segunda barrera.
- El token se renueva al iniciar y cerrar sesión. Swagger UI también envía la cabecera automáticamente.

**Demostración**
```bash
# Sin token: bloqueado aunque los datos sean válidos
curl -i -X POST https://<dominio>/api/v1/auth/login \
  -H 'Content-Type: application/json' -d '{"email":"admin@tienda.com","password":"..."}'
# -> 403 {"mensaje":"Token CSRF ausente o inválido: la petición fue bloqueada"}
```
En el navegador: DevTools → Network → cualquier `POST` de la aplicación → *Request Headers* → `X-XSRF-TOKEN`.

Página atacante de ejemplo (guardarla como `ataque.html`, abrirla desde otro origen mientras el admin tiene sesión): la categoría **no** se crea y el servidor responde 403, porque la página no puede conocer el token.
```html
<form action="https://<dominio>/api/v1/categorias" method="POST">
  <input type="hidden" name="nombre" value="Categoria falsa">
</form>
<script>document.forms[0].submit()</script>
```

**Pruebas:** `CategoriaControllerTest.eliminar_sinTokenCsrf_retorna403`, `FlujoCompraIntegrationTest.sinTokenCsrf_seBloquea` y `http.test.ts` (envío de la cabecera y renovación del token).

---

## 4. Recuperar contraseña y verificación en dos pasos

**Olvidé mi contraseña** (`/olvide-contrasena` → correo → `/restablecer?token=...`)
- El enlace lleva un token aleatorio de 256 bits. En la base solo se guarda su hash SHA-256 (`tokens_restablecimiento`): quien lea la base no puede usar los enlaces.
- Vence a los 30 minutos y sirve una sola vez; al usarlo, o al pedir uno nuevo, se invalidan los demás.
- La respuesta es la misma exista o no la cuenta (no revela qué correos están registrados) y se envía como máximo un correo por minuto a cada cuenta.
- El correo sale por la API HTTPS de Brevo. Sin `BREVO_API_KEY`, el enlace se escribe en el log del servidor (útil en desarrollo).

**Verificación en dos pasos (2FA)** (`Mi cuenta` → *Configurar verificación en dos pasos*)
- Códigos TOTP del RFC 6238 (los de Google Authenticator, Microsoft Authenticator o Authy): 6 dígitos que cambian cada 30 s. Implementado y probado contra los vectores oficiales del RFC (`TotpTest`).
- Se activa escaneando un QR y confirmando con un código; para desactivarla se pide un código vigente.
- Con 2FA activa, la contraseña correcta deja la sesión **pendiente** (HTTP 202): no hay acceso hasta enviar el código a `/auth/login/2fa`. La espera vence a los 5 minutos y admite 5 intentos; después hay que volver a escribir la contraseña.
- Un código ya usado no sirve otra vez (se guarda el último intervalo aceptado).
- En *Mi cuenta*, 5 intentos fallidos de contraseña o código cierran la sesión.

**Pruebas:** `CuentaIntegrationTest` (enlace de un solo uso, cambio de contraseña, login en dos pasos, límite de intentos) y `TotpTest`.

---

## 5. Otras medidas

| Medida | Detalle |
|---|---|
| Contraseñas | Hash BCrypt; mínimo 8 caracteres con letra y número |
| Mensaje de login | "Correo o contraseña incorrectos" en ambos casos: no revela qué correos existen |
| Fijación de sesión | Nuevo id de sesión al autenticarse (`changeSessionId`) |
| Autorización | Reglas por rol en el servidor (`SecurityConfig`); el frontend solo oculta botones, la API es la que bloquea (401/403) |
| Pedidos ajenos | Un cliente que pide el pedido de otro recibe 404 (no se confirma que exista) |
| Datos de tarjeta | Nunca se guardan ni se escriben en logs: solo la marca y los últimos 4 dígitos |
| Clickjacking | `X-Frame-Options: DENY` y `frame-ancestors 'none'` |
| Sobreventa | Bloqueo de fila (`PESSIMISTIC_WRITE`) y transacción en el pago |
