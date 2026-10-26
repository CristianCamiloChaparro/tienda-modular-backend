# Ejecución y despliegue

Hay tres formas de correr la aplicación completa:

| Opción | Para qué | HTTPS |
|---|---|---|
| A. Desarrollo local | Programar con recarga en caliente | No (opcional con el perfil `https`) |
| B. Docker Compose | Demostración local completa con un comando | Sí (`https://localhost`) |
| C. Render (nube) | **Sustentación**: URL pública para todo el curso | Sí |

Un solo repositorio con dos proyectos independientes:
```
tienda-modular-backend/
├── src/, pom.xml, Dockerfile   → backend (Spring Boot)
└── frontend/                   → frontend (React + Vite), con su propio package.json y Dockerfile
```

---

## A. Desarrollo local

**Requisitos:** Java 21, Node 20+, PostgreSQL con la base `tienda_modular`.

```bash
# Terminal 1 - backend (http://localhost:8080)
cd tienda-modular-backend
DB_PASSWORD=tu_clave ./mvnw spring-boot:run

# Terminal 2 - frontend (http://localhost:5173)
cd tienda-modular-backend/frontend
npm install
npm run dev
```
Vite reenvía `/api` al backend, así que se abre solo `http://localhost:5173`.

---

## B. Docker Compose (todo en contenedores, con HTTPS)

**Requisito:** Docker Desktop. Los puertos 80 y 443 deben estar libres.

```bash
cd tienda-modular-backend
docker compose up --build
```
- Aplicación: **https://localhost** (Caddy emite un certificado local; la primera vez el navegador puede pedir confirmarlo).
- Swagger: https://localhost/api/v1/docs
- `http://localhost` redirige a `https://localhost`.

Contenedores: `db` (PostgreSQL 17) → `backend` (Spring Boot) → `frontend` (nginx con la SPA y proxy `/api`) → `https` (Caddy, TLS).

Variables opcionales (archivo `.env` junto al `docker-compose.yml`): `DB_PASSWORD`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.

Detener: `docker compose down` (agregar `-v` para borrar también la base de datos).

---

## C. Render (URL pública para la sustentación)

**Despliegue actual (Render):**
- Tienda (frontend): **https://tienda-frontend-v18v.onrender.com**
- API (backend): https://tienda-backend-8nul.onrender.com/api/v1 — Swagger en https://tienda-frontend-v18v.onrender.com/api/v1/docs

Opción manual (como está desplegado):
1. **New → Postgres** (plan Free): nombre `tienda-db`, base `tienda_modular`, usuario `tienda`.
2. **New → Web Service → Public Git Repository** con la URL de este repositorio, plan Free, sin *Root Directory*. Variables: `DB_HOST` (hostname interno de la base), `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `COOKIE_SECURE=true`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
3. **New → Web Service** con el mismo repositorio y **Root Directory `frontend`**, plan Free. Variable: `BACKEND_URL` = URL pública del backend.

Opción automática: **New → Blueprint** → este repositorio. `render.yaml` crea `tienda-db`, `tienda-backend` y `tienda-frontend` (este último desde la carpeta `frontend/`), y pide:
- `ADMIN_EMAIL` y `ADMIN_PASSWORD`: credenciales del administrador inicial (usar una contraseña nueva, no la de desarrollo).
- `BACKEND_URL` (frontend): la URL pública del backend.

En ambos casos se abre la URL del frontend; Swagger también queda disponible en `<url-del-frontend>/api/v1/docs`.

**Notas del plan gratuito**
- Los servicios se "duermen" tras 15 minutos sin uso; la primera visita tarda ~1 minuto. **Abrir la aplicación unos minutos antes de la sustentación.**
- La base de datos gratuita de Render vence a los 30 días. Alternativa sin vencimiento: [Neon](https://neon.tech) y en `tienda-backend` definir `DB_URL=jdbc:postgresql://<host>/<db>?sslmode=require`, `DB_USER`, `DB_PASSWORD`.

---

## Variables de entorno del backend

| Variable | Por defecto | Uso |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}` | URL JDBC completa |
| `DB_HOST` / `DB_PORT` / `DB_NAME` | `localhost` / `5432` / `tienda_modular` | Alternativa a `DB_URL` |
| `DB_USER` / `DB_PASSWORD` | `postgres` / `postgres` | Credenciales de la BD |
| `PORT` | `8080` | Puerto HTTP |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | `admin@tienda.com` / `Admin12345` | Administrador inicial (solo si no existe ninguno) |
| `COOKIE_SECURE` | `false` | `true` en producción (cookies solo por HTTPS) |
| `REQUIRE_HTTPS` | `false` | `true` para redirigir toda petición HTTP a HTTPS |
| `CORS_ORIGINS` | `http://localhost:5173` | Solo si el frontend llama a la API desde otro dominio |
| `SHOW_SQL` | `false` | Mostrar el SQL de Hibernate en consola |

## Variables del frontend

| Variable | Dónde | Uso |
|---|---|---|
| `VITE_PROXY_TARGET` | `npm run dev` | Backend al que Vite reenvía `/api` (por defecto `http://localhost:8080`) |
| `BACKEND_URL` | Imagen Docker | Backend al que nginx reenvía `/api` |
| `PORT` | Imagen Docker | Puerto de nginx (Render lo asigna solo) |

---

## Lista de verificación para la sustentación

- [ ] Abrir la URL pública desde un equipo que no sea de un integrante.
- [ ] Catálogo → filtrar por categoría.
- [ ] Agregar al carrito, cambiar cantidades y ver el total recalculado.
- [ ] Crear cuenta → pagar con `4000 0000 0000 0002` (rechazado) y luego con `4242 4242 4242 4242` (aprobado) → Mis pedidos.
- [ ] Ingresar como administrador → crear un producto desde el formulario → verlo en el catálogo.
- [ ] Seguridad: seguir [`SEGURIDAD.md`](SEGURIDAD.md) (HTTPS, XSS, CSRF).
- [ ] Swagger: `/api/v1/docs`.
