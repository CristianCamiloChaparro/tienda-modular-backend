# Tienda en Línea Modular — Frontend

Aplicación web (SPA) de la **Tienda en Línea Modular**. Es un proyecto independiente dentro del repositorio `tienda-modular-backend` (el backend está en la raíz). Consume exclusivamente la API REST del backend; no tiene lógica de negocio propia: totales, stock y permisos los decide la API.

**Equipo:** Gustavo Andrés Núñez Vega y Cristian Camilo Chaparro

## Funcionalidades

| Pantalla | Ruta | Acceso |
|---|---|---|
| Catálogo con filtro por categoría | `/` | Público |
| Carrito (agregar, quitar, cantidades, total) | `/carrito` | Público |
| Iniciar sesión / Crear cuenta | `/login`, `/registro` | Público |
| Pago con tarjeta (pasarela en modo prueba) | `/checkout` | Con sesión |
| Mis pedidos | `/pedidos` | Con sesión |
| Panel de administrador: productos, categorías y pedidos | `/admin` | Rol ADMIN |

## Tecnologías

- **React 19 + TypeScript**, enrutamiento con **React Router 7**.
- **Vite** como automatizador de tareas (servidor de desarrollo, build, proxy) y **npm** como gestor de dependencias.
- **SCSS**: variables (`styles/_variables.scss`), mixins (`styles/_mixins.scss`), clases globales reutilizables (`styles/main.scss`) y **CSS Modules** por componente (`*.module.scss`). No hay CSS plano.
- **Vitest + Testing Library** para pruebas y **oxlint** como linter.
- **nginx** (imagen Docker) para servir la aplicación en producción con cabeceras de seguridad.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm install` | Instala las dependencias |
| `npm run dev` | Servidor de desarrollo en http://localhost:5173 (reenvía `/api` al backend en :8080) |
| `npm run build` | Verifica tipos y genera `dist/` |
| `npm test` | Ejecuta las pruebas |
| `npm run lint` | Revisa el código con oxlint |
| `npm run preview` | Sirve el build de producción en http://localhost:4173 |

## Comunicación con la API

- Las peticiones van a `/api/v1` en el **mismo origen**. En desarrollo Vite las reenvía al backend (`VITE_PROXY_TARGET`, por defecto `http://localhost:8080`); en producción lo hace nginx (`BACKEND_URL`).
- La sesión vive en una cookie `HttpOnly` que JavaScript no puede leer.
- **CSRF:** `src/services/http.ts` lee la cookie `XSRF-TOKEN` y la envía en la cabecera `X-XSRF-TOKEN` en cada `POST/PUT/PATCH/DELETE`. Si el token venció, pide uno nuevo y reintenta una vez.

## Estructura

```
src
├── components/   Piezas reutilizables (Header, ProductCard, QuantityStepper, RutaProtegida...)
├── context/      Estado global: sesión (AuthContext), carrito (CartContext), notificaciones
├── pages/        Pantallas (catálogo, carrito, pago, login, pedidos, admin/)
├── services/     Cliente HTTP con CSRF y llamadas a la API
├── styles/       Variables, mixins, reset y estilos globales SCSS
├── types/        Tipos que reflejan los DTOs del backend
└── utils/        Formato de precios (COP), fechas y errores
```

## Docker

```bash
docker build -t tienda-frontend .
docker run -p 8081:80 -e BACKEND_URL=http://host.docker.internal:8080 tienda-frontend
```

Para levantar todo (base de datos, backend, frontend y HTTPS) usar el `docker-compose.yml` de la raíz del repositorio. Despliegue en la nube: ver [`../docs/DESPLIEGUE.md`](../docs/DESPLIEGUE.md).
