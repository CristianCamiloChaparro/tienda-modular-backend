/**
 * E2E Test Suite Configuration
 * Tienda en Línea Modular
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const CONFIG = {
  // Backend API Base URL (defaults to standard Spring Boot port 8080)
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:8080/api/v1',
  
  // Swagger / OpenAPI documentation endpoints
  OPENAPI_JSON_URL: process.env.OPENAPI_JSON_URL || 'http://localhost:8080/api/v1/api-docs',
  SWAGGER_UI_URL: process.env.SWAGGER_UI_URL || 'http://localhost:8080/api/v1/docs',

  // Project Directories
  BACKEND_DIR: process.env.BACKEND_DIR || path.resolve(__dirname, '..'),
  FRONTEND_DIR: process.env.FRONTEND_DIR || path.resolve(__dirname, '../frontend'),
  
  // Administrador con el que se prueban las operaciones de escritura (rol ADMIN)
  ADMIN_EMAIL: process.env.E2E_ADMIN_EMAIL || 'admin@tienda.com',
  // Sin valor por defecto: la contrasena del administrador no se versiona.
  ADMIN_PASSWORD: process.env.E2E_ADMIN_PASSWORD || '',

  // Timeouts (milliseconds)
  REQUEST_TIMEOUT_MS: parseInt(process.env.REQUEST_TIMEOUT_MS || '8000', 10),
  HEALTH_CHECK_TIMEOUT_MS: parseInt(process.env.HEALTH_CHECK_TIMEOUT_MS || '3000', 10),
  BUILD_TIMEOUT_MS: parseInt(process.env.BUILD_TIMEOUT_MS || '60000', 10),

};

export default CONFIG;
