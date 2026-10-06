# E2E Test Suite — Tienda en Línea Modular (Semana 12)

Suite de pruebas End-to-End (E2E) de caja opaca para la verificación integral de los entregables de la **Semana 12**:
- **Backend API REST**: CRUD completo de Categorías (`PUT`, `DELETE`) y Productos (`PUT`, `DELETE`), validaciones, integridad referencial y documentación OpenAPI/Swagger.
- **Frontend Desacoplado**: Arquitectura SCSS modular, paridad de contratos de servicios API, reactividad de filtros y gestión de estados visuales (Loading, Error, Empty).

---

## 1. Organización en 4 Niveles Sistemáticos (Tiers)

| Nivel | Enfoque | Backend (F1 - F5) | Frontend (F6 - F10) |
|---|---|---|---|
| **Tier 1** | **Cobertura de Funcionalidad** (Happy Path) | `PUT /categorias/{id}` (200), `DELETE /categorias/{id}` (204), `PUT /productos/{id}` (200), `DELETE /productos/{id}` (204), OpenAPI docs (200). | Verificación de estructura y compilación limpia `npm run build` con salida en `dist/`. |
| **Tier 2** | **Límites y Casos de Esquina** (Boundaries & Corners) | Validación nombre (vacío 400, 80 chars 200, 81 chars 400), unicidad 409, integridad referencial 409 con mensaje exacto, precio `<= 0` (400), stock `< 0` (400), 404 para IDs inexistentes y FK inválidas. | Arquitectura SCSS: variables de diseño (`_variables.scss`), mixins responsive (`_mixins.scss`), CSS Modules (`*.module.scss`), prevención de CSS plano. |
| **Tier 3** | **Combinaciones Cruzadas** (Cross-Feature) | Ciclo de vida relacional: bloqueo referencial dinámico al reasignar producto entre categorías (PUT) y liberación de bloqueo tras eliminación. | Paridad de tipos TypeScript (`Categoria`, `Producto`) con DTOs de backend; filtrado reactivo sin recarga de página (`window.location`). |
| **Tier 4** | **Escenarios de Aplicación Real** (Real-World) | Actualización masiva de precios en campañas de descuento, liquidación de stock a 0 (estado "Agotado"), integridad de caracteres especiales y acentos en español (UTF-8). | Estados visuales: Skeleton con animación shimmer, ErrorState con acción de reintento, EmptyState con reseteo de filtros, formateo de precios en COP. |

---

## 2. Requisitos y Ejecución

La suite está implementada en **Node.js nativo (ESM)** con **cero dependencias externas**, lo que garantiza ejecución inmediata sin `npm install`.

### Ejecutar todas las pruebas (Backend + Frontend)
```bash
node e2e-tests/run-all.js
```

### Ejecutar con Oráculo de Especificación en Memoria (Auto-verificación independiente)
Permite verificar la suite de pruebas completa de manera offline, validando la lógica de aserción sin requerir el backend Spring Boot activo:
```bash
node e2e-tests/run-all.js --oracle
```

### Ejecutar únicamente pruebas de Backend
```bash
node e2e-tests/run-all.js --backend
```

### Ejecutar únicamente pruebas de Frontend
```bash
node e2e-tests/run-all.js --frontend
```

### Ejecutar un Tier específico
```bash
node e2e-tests/run-all.js --tier=1
node e2e-tests/run-all.js --tier=2
node e2e-tests/run-all.js --tier=3
node e2e-tests/run-all.js --tier=4
```

---

## 3. Variables de Entorno y Configuración

| Variable | Valor por Defecto | Descripción |
|---|---|---|
| `API_BASE_URL` | `http://localhost:8080/api/v1` | URL base de la API REST del backend |
| `FRONTEND_DIR` | `../tienda-modular-frontend` | Directorio raíz del proyecto frontend |
| `BACKEND_DIR` | `..` | Directorio raíz del proyecto backend |
| `ORACLE_PORT` | `8089` | Puerto HTTP para el servidor oráculo en modo `--oracle` |
| `REQUEST_TIMEOUT_MS`| `8000` | Timeout por solicitud HTTP (ms) |
