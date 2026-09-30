# Tienda en Línea Modular — Backend (API REST)

Backend desacoplado del proyecto **Tienda en Línea Modular**. Expone datos en JSON (no renderiza vistas) y está documentado con OpenAPI / Swagger UI.

**Equipo:** Gustavo Andrés Núñez Vega y Cristian Camilo Chaparro
**Entrega:** Semana 11 — Modelos, conexión a base de datos y primeros endpoints

## Tecnologías

| Capa | Tecnología |
|---|---|
| Lenguaje | Java 21 |
| Framework | Spring Boot 3.5 (Web, Data JPA, Validation) |
| ORM | Hibernate / JPA |
| Base de datos | PostgreSQL 17 |
| Documentación | springdoc-openapi 2.8 (OpenAPI 3 + Swagger UI) |
| Build | Maven |

## Estructura

```
src/main/java/com/tienda/modular
├── config/        OpenAPI, CORS y carga de datos de ejemplo
├── controller/    Controladores REST (/api/v1/...)
├── dto/           Objetos de entrada/salida con validaciones
├── exception/     Errores JSON uniformes (ApiError)
├── model/         Entidades JPA: Categoria, Producto, Carrito, ItemCarrito
├── repository/    Repositorios Spring Data JPA
└── service/       Lógica de negocio
```

## Cómo ejecutarlo

1. Tener PostgreSQL corriendo y crear la base `tienda_modular` (en pgAdmin: *Databases → Create → Database*).
2. Abrir la carpeta en IntelliJ (se detecta como proyecto Maven).
3. Configurar la contraseña de PostgreSQL: en *Run → Edit Configurations → Environment variables* agregar `DB_PASSWORD=tu_contraseña`. Si tu usuario no es `postgres` agrega también `DB_USER`.
4. Ejecutar `TiendaModularApplication`.
5. Abrir **http://localhost:8080/api/v1/docs** (Swagger UI).

Al primer arranque Hibernate crea las tablas y se cargan 3 categorías y 6 productos de ejemplo.

## Variables de entorno

| Variable | Por defecto | Uso |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/tienda_modular` | URL JDBC |
| `DB_USER` | `postgres` | Usuario |
| `DB_PASSWORD` | `postgres` | Contraseña |
| `PORT` | `8080` | Puerto HTTP |
| `CORS_ORIGINS` | `http://localhost:5173` | Origen permitido del frontend |

## Endpoints (Semana 11)

| Método | Ruta | Descripción | Respuestas |
|---|---|---|---|
| GET | `/api/v1/categorias` | Listar categorías | 200 |
| GET | `/api/v1/categorias/{id}` | Obtener categoría | 200, 404 |
| POST | `/api/v1/categorias` | Crear categoría | 201, 400, 409 |
| GET | `/api/v1/productos?categoriaId=` | Listar productos (filtro opcional) | 200, 404 |
| GET | `/api/v1/productos/{id}` | Obtener producto | 200, 404 |
| POST | `/api/v1/productos` | Crear producto | 201, 400, 404 |

Edición y eliminación (PUT/DELETE) se completan en la Semana 12; el carrito en la Semana 13.
