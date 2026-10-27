#!/usr/bin/env node
/**
 * Master E2E Test Suite Runner
 * Tienda en Línea Modular
 * 
 * Supports:
 * - 4 Systematic Nivels (Feature Coverage, Boundaries, Cross-Feature, Real-World)
 * - Backend Endpoints (F1 - F5) & Frontend Contracts (F6 - F10)
 * 
 * Usage:
 *   node e2e-tests/run-all.js                 # Run all levels (backend + frontend)
 *   node e2e-tests/run-all.js --backend       # Run backend tests only
 *   node e2e-tests/run-all.js --frontend      # Run frontend tests only
 *   node e2e-tests/run-all.js --nivel=1        # Run Nivel 1 only
 */

import { CONFIG } from './config.js';
import { TestReporter } from './utils/reporter.js';
import { HttpClient } from './utils/http-client.js';

// Backend tests
import { runNivel1Backend } from './backend/nivel1-funcionalidad.test.js';
import { runNivel2Backend } from './backend/nivel2-limites.test.js';
import { runNivel3Backend } from './backend/nivel3-integracion.test.js';
import { runNivel4Backend } from './backend/nivel4-escenarios.test.js';

// Frontend tests
import { runNivel1Frontend } from './frontend/nivel1-funcionalidad.test.js';
import { runNivel2Frontend } from './frontend/nivel2-limites.test.js';
import { runNivel3Frontend } from './frontend/nivel3-integracion.test.js';
import { runNivel4Frontend } from './frontend/nivel4-escenarios.test.js';

async function main() {
  const args = process.argv.slice(2);
  const isBackendOnly = args.includes('--backend');
  const isFrontendOnly = args.includes('--frontend');
  
  const nivelArg = args.find((a) => a.startsWith('--nivel='));
  const selectedNivel = nivelArg ? parseInt(nivelArg.split('=')[1], 10) : null;

  const urlArg = args.find((a) => a.startsWith('--api-url='));
  const customApiUrl = urlArg ? urlArg.split('=')[1] : null;

  const frontendDirArg = args.find((a) => a.startsWith('--frontend-dir='));
  if (frontendDirArg) {
    CONFIG.FRONTEND_DIR = frontendDirArg.split('=')[1];
  }

  const reporter = new TestReporter('Tienda en Línea Modular — E2E Suite');
  let apiUrl = customApiUrl || CONFIG.API_BASE_URL;

  console.log(`\nStarting E2E Test Runner...`);
  console.log(`Configuration:`);
  console.log(`  Target Backend  : ${apiUrl}`);
  console.log(`  Frontend Dir    : ${CONFIG.FRONTEND_DIR}`);
  console.log(`  Selected Scope  : ${isBackendOnly ? 'Backend Only' : isFrontendOnly ? 'Frontend Only' : 'Full Stack (Backend + Frontend)'}`);
  if (selectedNivel) {
    console.log(`  Selected Nivel  : Nivel ${selectedNivel}`);
  }

  // Handle Backend setup
  let http = null;
  const shouldRunBackend = !isFrontendOnly;
  const shouldRunFrontend = !isBackendOnly;

  if (shouldRunBackend) {
    http = new HttpClient(apiUrl);
    const isAlive = await http.checkHealth();
    if (isAlive) {
      const sesion = await http.iniciarSesionAdmin();
      if (sesion.ok) {
        reporter.info(`Sesion de administrador iniciada (${CONFIG.ADMIN_EMAIL})`);
      } else {
        console.log(`\n\x1b[33m[ADVERTENCIA] No se pudo iniciar sesion como administrador (HTTP ${sesion.status}).`);
        console.log(`Defina E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD; sin sesion las operaciones de escritura responden 401.\x1b[0m\n`);
      }
    } else {
      console.log(`\n\x1b[33m[ADVERTENCIA] El backend en ${apiUrl} no responde o esta fuera de linea.\x1b[0m`);
      console.log(`Para ejecutar las pruebas HTTP contra el backend real:`);
      console.log(`  1. Inicie PostgreSQL en el puerto 5432`);
      console.log(`  2. Inicie Spring Boot: ./mvnw spring-boot:run`);
    }
  }

  try {
    // -------------------------------------------------------------
    // Nivel 1: Feature Coverage (Happy Path)
    // -------------------------------------------------------------
    if (!selectedNivel || selectedNivel === 1) {
      if (shouldRunBackend && http) {
        const isAlive = await http.checkHealth();
        if (isAlive) {
          await runNivel1Backend(http, reporter);
        } else {
          reporter.nivel(1, 'Feature Coverage — Backend Endpoints (F1 - F5)');
          reporter.skip('Backend HTTP Tests (Nivel 1)', `Servidor ${apiUrl} no disponible`);
        }
      }
      if (shouldRunFrontend) {
        await runNivel1Frontend(reporter);
      }
    }

    // -------------------------------------------------------------
    // Nivel 2: Boundary & Corner Cases
    // -------------------------------------------------------------
    if (!selectedNivel || selectedNivel === 2) {
      if (shouldRunBackend && http) {
        const isAlive = await http.checkHealth();
        if (isAlive) {
          await runNivel2Backend(http, reporter);
        } else {
          reporter.nivel(2, 'Boundary & Corner Cases — Backend Validation');
          reporter.skip('Backend HTTP Tests (Nivel 2)', `Servidor ${apiUrl} no disponible`);
        }
      }
      if (shouldRunFrontend) {
        await runNivel2Frontend(reporter);
      }
    }

    // -------------------------------------------------------------
    // Nivel 3: Cross-Feature Combinations
    // -------------------------------------------------------------
    if (!selectedNivel || selectedNivel === 3) {
      if (shouldRunBackend && http) {
        const isAlive = await http.checkHealth();
        if (isAlive) {
          await runNivel3Backend(http, reporter);
        } else {
          reporter.nivel(3, 'Cross-Feature Combinations — Relational Lifecycle');
          reporter.skip('Backend HTTP Tests (Nivel 3)', `Servidor ${apiUrl} no disponible`);
        }
      }
      if (shouldRunFrontend) {
        await runNivel3Frontend(reporter);
      }
    }

    // -------------------------------------------------------------
    // Nivel 4: Real-World Application Scenarios
    // -------------------------------------------------------------
    if (!selectedNivel || selectedNivel === 4) {
      if (shouldRunBackend && http) {
        const isAlive = await http.checkHealth();
        if (isAlive) {
          await runNivel4Backend(http, reporter);
        } else {
          reporter.nivel(4, 'Real-World Application Scenarios');
          reporter.skip('Backend HTTP Tests (Nivel 4)', `Servidor ${apiUrl} no disponible`);
        }
      }
      if (shouldRunFrontend) {
        await runNivel4Frontend(reporter);
      }
    }
  } finally {
    // Nada que liberar: las pruebas usan el backend real.
  }

  const summary = reporter.summary();
  if (!summary.isSuccess) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('\nFatal error running E2E tests:', err);
  process.exit(1);
});
