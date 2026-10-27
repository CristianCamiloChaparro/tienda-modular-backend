# Tienda en Línea Modular — Backend (API REST)

Backend desacoplado del proyecto **Tienda en Línea Modular**. Expone datos en JSON (no renderiza vistas) y está documentado con OpenAPI / Swagger UI. El frontend es un proyecto independiente dentro de la carpeta [`frontend/`](frontend) de este mismo repositorio: tiene su propio `package.json`, build y contenedor, y solo se comunica con el backend por la API.

**Equipo:** Gustavo Andrés Núñez Vega y Cristian Camilo Chaparro

| Documento | Contenido |
|---|---|
| [docs/DOCUMENTO_TECNICO.md](docs/DOCUMENTO_TECNICO.md) | Problema, objetivos, alcance, requerimientos, modelo de datos, arquitectura, metodología, pruebas y criterios de aceptación |
| [docs/SEGURIDAD.md](docs/SEGURIDAD.md) | HTTPS, XSS y CSRF con un caso demostrable para cada uno |
| [docs/DESPLIEGUE.md](docs/DESPLIEGUE.md) | Desarrollo local, Docker Compose con HTTPS y despliegue en Render |

## Funcionalidades

- **Catálogo:** CRUD de categorías y productos; listado público con filtro por categoría.
- **Carrito:** agregar, quitar, modificar cantidades y total calculado por el servidor, validando stock.
- **Usuarios:** registro, inicio y cierre de sesión; roles `ADMIN` y `CLIENTE`.
- **Pagos:** checkout con pasarela de pagos en modo prueba, descuento de inventario y registro del pedido.
- **Pedidos:** historial del cliente; el administrador ve todos y cambia su estado.
- **Seguridad:** sesiones HttpOnly, CSRF, limpieza de HTML (XSS), CSP, HSTS, BCrypt y reglas por rol.

## Tecnologías

| Capa | Tecnología |
|---|---|
| Lenguaje | Java 21 |
| Framework | Spring Boot 3.5 (Web, Data JPA, Validation, Security) |
| ORM | Hibernate / JPA |
| Base de datos | PostgreSQL 17 (H2 solo en pruebas) |
| Documentación | springdoc-openapi 2.8 (OpenAPI 3 + Swagger UI) |
| Seguridad | Spring Security 6, BCrypt, jsoup (limpieza XSS) |
| Build | Maven (wrapper `./mvnw`) |
| Contenedores | Docker, Docker Compose, Render |

## Estructura

```
src/main/java/com/tienda/modular
├── config/        Seguridad, autenticación, OpenAPI, CORS, HTTPS y datos iniciales
├── controller/    Controladores REST (/api/v1/...)
├── dto/           Objetos de entrada/salida con validaciones
├── exception/     Errores JSON uniformes (ApiError)
├── model/         Entidades JPA: Categoria, Producto, Carrito, ItemCarrito, Usuario, Pedido, ItemPedido
├── repository/    Repositorios Spring Data JPA
├── security/      Usuario autenticado, CSRF para SPA y errores 401/403 en JSON
├── service/       Lógica de negocio (+ service/pago: pasarela de pagos)
└── util/          TextoSeguro (mitigación XSS)
```

## Cómo ejecutarlo

1. Tener PostgreSQL corriendo y crear la base `tienda_modular`.
2. Ejecutar (o abrir en IntelliJ y correr `TiendaModularApplication` con la variable `DB_PASSWORD`):
   ```bash
   DB_PASSWORD=tu_contraseña ADMIN_PASSWORD=clave_del_admin ./mvnw spring-boot:run
   ```
3. Abrir **http://localhost:8080/api/v1/docs** (Swagger UI).

En el primer arranque Hibernate crea las tablas y se cargan 3 categorías, 6 productos y el administrador inicial.

Para todo junto (base de datos, backend, frontend y HTTPS) con Docker: `docker compose up --build` y abrir https://localhost. Detalles en [docs/DESPLIEGUE.md](docs/DESPLIEGUE.md).

### Cuentas para probar

| Rol | Cómo obtenerla |
|---|---|
| Administrador | Se crea al primer arranque con `ADMIN_EMAIL` y `ADMIN_PASSWORD`. La contraseña no tiene valor por defecto ni se versiona: si no se define, no se crea ningún administrador |
| Cliente | Crear una cuenta desde la página *Crear cuenta* o con `POST /api/v1/auth/registro` |

**Tarjetas de prueba de la pasarela:** `4242 4242 4242 4242` aprobada · `4000 0000 0000 0002` rechazada (fondos insuficientes). Cualquier CVV y una fecha futura.

## Endpoints

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/v1/categorias` · `/{id}` | Público | Listar / obtener categorías |
| POST · PUT · DELETE | `/api/v1/categorias` · `/{id}` | ADMIN | Crear / editar / eliminar (409 si tiene productos) |
| GET | `/api/v1/productos?categoriaId=` · `/{id}` | Público | Listar (filtro opcional) / obtener |
| POST · PUT · DELETE | `/api/v1/productos` · `/{id}` | ADMIN | Crear / editar / eliminar |
| POST | `/api/v1/carritos` | Público | Crear carrito |
| GET | `/api/v1/carritos/{id}` | Público | Ver carrito con total |
| POST | `/api/v1/carritos/{id}/items` | Público | Agregar producto |
| PUT · DELETE | `/api/v1/carritos/{id}/items/{productoId}` | Público | Modificar cantidad / quitar |
| DELETE | `/api/v1/carritos/{id}/items` | Público | Vaciar |
| GET | `/api/v1/auth/csrf` | Público | Emitir cookie `XSRF-TOKEN` |
| GET | `/api/v1/auth/me` | Público | Usuario con sesión (204 si no hay) |
| POST | `/api/v1/auth/registro` · `/login` · `/logout` | Público | Cuenta y sesión |
| POST | `/api/v1/pedidos` | Con sesión | Pagar el carrito (checkout) |
| GET | `/api/v1/pedidos/mios` · `/{id}` | Con sesión | Mis pedidos / detalle |
| GET | `/api/v1/pedidos` | ADMIN | Todos los pedidos |
| PATCH | `/api/v1/pedidos/{id}/estado` | ADMIN | Cambiar estado |

Toda petición `POST`, `PUT`, `PATCH` o `DELETE` debe llevar la cabecera `X-XSRF-TOKEN` con el valor de la cookie `XSRF-TOKEN`. Swagger UI la envía automáticamente.

## Pruebas

```bash
./mvnw test
```

Incluye pruebas unitarias, de controladores (MockMvc) y de integración con Spring Boot + H2 que recorren el flujo completo con sesión y token CSRF reales. Ver la sección 11 del [documento técnico](docs/DOCUMENTO_TECNICO.md).
