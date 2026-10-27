# Pruebas end-to-end — Tienda en Línea Modular

Pruebas de caja negra contra la API real (backend desplegado o local) y revisiones estáticas del proyecto `frontend/`. Están escritas en Node.js nativo (ESM), **sin dependencias**: no requieren `npm install`.

## Niveles

| Nivel | Enfoque | Backend | Frontend |
|---|---|---|---|
| 1 | Funcionalidad (camino feliz) | CRUD de categorías y productos (200/201/204) y documentación OpenAPI | Estructura del proyecto y `npm run build` sin errores |
| 2 | Límites y validaciones | Longitudes, nombres repetidos (409), precio ≤ 0 y stock < 0 (400), ids inexistentes (404), integridad referencial | Arquitectura SCSS: variables, mixins y CSS Modules |
| 3 | Integración entre funciones | Bloqueo y liberación de categorías al mover y eliminar productos | Tipos de TypeScript alineados con los DTO, cliente HTTP con token CSRF |
| 4 | Escenarios reales | Descuentos masivos, stock en 0, caracteres especiales del español | Estados visuales de carga, error y vacío; formato de precios en COP |

## Ejecución

El backend debe estar en marcha. Las operaciones de escritura necesitan rol ADMIN, así que se indican las credenciales del administrador por variables de entorno:

```bash
E2E_ADMIN_PASSWORD=<clave del admin> node e2e-tests/run-all.js
```

Opciones:

```bash
node e2e-tests/run-all.js --backend      # solo backend
node e2e-tests/run-all.js --frontend     # solo frontend (no necesita el backend)
node e2e-tests/run-all.js --nivel=2      # un solo nivel
```

El cliente HTTP (`utils/http-client.js`) se comporta como un navegador: inicia sesión, guarda las cookies de sesión y envía la cabecera `X-XSRF-TOKEN` en cada operación de escritura.

## Variables de entorno

| Variable | Por defecto | Uso |
|---|---|---|
| `API_BASE_URL` | `http://localhost:8080/api/v1` | URL base de la API |
| `OPENAPI_JSON_URL` | `http://localhost:8080/api/v1/api-docs` | Especificación OpenAPI |
| `SWAGGER_UI_URL` | `http://localhost:8080/api/v1/docs` | Swagger UI |
| `FRONTEND_DIR` | `../frontend` | Carpeta del proyecto frontend |
| `E2E_ADMIN_EMAIL` | `admin@tienda.com` | Administrador para las operaciones de escritura |
| `E2E_ADMIN_PASSWORD` | *(obligatoria)* | Contraseña de ese administrador (no se versiona) |
| `REQUEST_TIMEOUT_MS` | `8000` | Tiempo máximo por petición |
