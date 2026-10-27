# Informe de seguridad — Tienda en Línea Modular

**Laboratorio de Seguridad — Spring Boot (Java)** · Desarrollo de Aplicaciones Web

**Estudiantes:** Gustavo Andrés Núñez Vega y Cristian Camilo Chaparro
**Fecha:** 27/10/2026
**Repositorio:** https://github.com/CristianCamiloChaparro/tienda-modular-backend (rama `seguridad`)

> Proyecto: API REST en Spring Boot 3.5 + Spring Security 6 + PostgreSQL, con un frontend React en `frontend/`.
> Los nombres de la guía se adaptaron al proyecto: `Usuario`, `Pedido`, `/api/v1/productos`, `/api/v1/pedidos`.

---

## Parte 0 — Preparación y diagnóstico

1. El proyecto arranca y la suite de pruebas pasa **antes** de tocar nada (`./mvnw test`).
2. Se trabajó en una rama aparte: `git checkout -b seguridad`.
3. Se creó este archivo `INFORME_SEGURIDAD.md`.

### Diagnóstico inicial (estado del proyecto antes del laboratorio)

| Pregunta | Qué se buscó | Sí / No | Detalle encontrado |
|---|---|---|---|
| ⚠ ¿Hay contraseñas guardadas tal cual? | Campo `password` que se guarda sin hash | **No** | `Usuario.passwordHash` guarda un hash BCrypt (`AuthService.registrar`). |
| ⚠ ¿Hay credenciales en el código? | `password`, `secret` en `application.properties` o en clases Java | **Sí** | Valores por defecto en la configuración: `spring.datasource.password=${DB_PASSWORD:postgres}`, `server.ssl.key-store-password=${SSL_KEYSTORE_PASSWORD:tienda-local}`, `-storepass tienda-local` en `scripts/generar-certificado.sh` y `DB_PASSWORD:-tienda_local` en `docker-compose.yml`. |
| ⚠ ¿Hay archivos de secretos en git? | `git ls-files` muestra `.env` o similares | **No** (archivos) / **Sí** (historial) | `git ls-files` no muestra `.env`, `.p12` ni `.pem`. Pero `git log -p -S"Admin12345"` muestra la clave del administrador escrita en el commit `a902452` (quitada en `dfc48de`). |
| ⚠ ¿Se muestra texto de usuarios como HTML? | `innerHTML`, `dangerouslySetInnerHTML` | **No** | El frontend es React y no usa `dangerouslySetInnerHTML` ni `innerHTML`; el backend además limpia el HTML con jsoup. |
| ⚠ ¿Se puede ver un recurso de otro usuario cambiando el id? | Rutas `/api/pedidos/:id` sin comprobar propietario | **No** (pedidos) / **Sí** (carritos) | `GET /api/v1/pedidos/{id}` responde 404 si el pedido es de otro cliente. Los carritos son anónimos: quien conozca el id (UUID) de un carrito puede verlo y modificarlo. |
| ⚠ ¿Las rutas de administrador solo están «ocultas» en el frontend? | Botones escondidos, endpoint sin rol | **No** | `SecurityConfig` exige `hasRole("ADMIN")` en POST/PUT/DELETE de categorías y productos, en `GET /api/v1/pedidos` y en `PATCH /api/v1/pedidos/*/estado`. |
| ⚠ ¿CORS está abierto a cualquier origen? | `@CrossOrigin` sin parámetros, `allowedOrigins("*")` | **No** | `CorsConfig` solo permite los orígenes de `CORS_ORIGINS` (por defecto `http://localhost:5173`). |
| ⚠ ¿El proyecto usa HTTP simple? | Se abre con `http://` | **Sí** (desarrollo) | En producción (Render) y con Docker Compose (Caddy) hay HTTPS, pero el arranque local por defecto es `http://localhost:8080` y el perfil `https` usaba una clave escrita en el código. |

Comandos usados para el diagnóstico:

```bash
git ls-files | grep -Ei '\.env|\.p12|\.pem|\.key|secret'      # sin resultados
git log --all -p -S"Admin12345" --format='%h %ad %s' --date=short
grep -rn "innerHTML\|dangerouslySetInnerHTML" frontend/src     # sin resultados
grep -rn "@CrossOrigin\|allowedOrigins" src/main               # solo CorsConfig con lista de orígenes
```

### Hallazgos

| # | Hallazgo | OWASP | Evidencia (cómo lo comprobé) | Corrección aplicada | Estado |
|---|---|---|---|---|---|
| 1 | Credenciales por defecto escritas en la configuración (BD, keystore, Docker Compose) | A02 / A04 | Diagnóstico: búsqueda de `password` en `application*.properties`, script y `docker-compose.yml` | — | Pendiente |
| 2 | Clave del administrador (`Admin12345`) en el historial de git | A04 / A07 | `git log --all -p -S"Admin12345"` → commit `a902452` | — | Pendiente |
| 3 | HTTP simple en desarrollo; clave del certificado escrita en el código | A04 | Diagnóstico: arranque local en `http://localhost:8080` | — | Pendiente |
| 4 | Carritos anónimos accesibles por su id | A01 | `GET /api/v1/carritos/{id}` responde 200 sin sesión | — | Pendiente |
