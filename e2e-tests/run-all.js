#!/usr/bin/env node
/**
 * Master E2E Test Suite Runner
 * Tienda en Línea Modular — Semana 12
 * 
 * Supports:
 * - 4 Systematic Tiers (Feature Coverage, Boundaries, Cross-Feature, Real-World)
 * - Backend Endpoints (F1 - F5) & Frontend Contracts (F6 - F10)
 * - Live Backend or In-Memory Specification Oracle mode (--oracle)
 * 
 * Usage:
 *   node e2e-tests/run-all.js                 # Run all tiers (backend + frontend)
 *   node e2e-tests/run-all.js --oracle        # Run all tiers with in-memory API oracle
 *   node e2e-tests/run-all.js --backend       # Run backend tests only
 *   node e2e-tests/run-all.js --frontend      # Run frontend tests only
 *   node e2e-tests/run-all.js --tier=1        # Run Tier 1 only
 */

import { CONFIG } from './config.js';
import { TestReporter } from './utils/reporter.js';
import { HttpClient } from './utils/http-client.js';
import { OracleServer } from './utils/oracle-server.js';

// Backend tests
import { runTier1Backend } from './backend/tier1-feature-coverage.test.js';
import { runTier2Backend } from './backend/tier2-boundary-corner-cases.test.js';
import { runTier3Backend } from './backend/tier3-cross-feature.test.js';
import { runTier4Backend } from './backend/tier4-real-world-scenarios.test.js';

// Frontend tests
import { runTier1Frontend } from './frontend/tier1-feature-coverage.test.js';
import { runTier2Frontend } from './frontend/tier2-boundary-corner-cases.test.js';
import { runTier3Frontend } from './frontend/tier3-cross-feature.test.js';
import { runTier4Frontend } from './frontend/tier4-real-world-scenarios.test.js';

async function main() {
  const args = process.argv.slice(2);
  const isBackendOnly = args.includes('--backend');
  const isFrontendOnly = args.includes('--frontend');
  const useOracle = args.includes('--oracle') || args.includes('--mock');
  
  const tierArg = args.find((a) => a.startsWith('--tier='));
  const selectedTier = tierArg ? parseInt(tierArg.split('=')[1], 10) : null;

  const urlArg = args.find((a) => a.startsWith('--api-url='));
  const customApiUrl = urlArg ? urlArg.split('=')[1] : null;

  const frontendDirArg = args.find((a) => a.startsWith('--frontend-dir='));
  if (frontendDirArg) {
    CONFIG.FRONTEND_DIR = frontendDirArg.split('=')[1];
  }

  const reporter = new TestReporter('Tienda en Línea Modular — E2E Suite (Semana 12)');
  let oracleServer = null;
  let apiUrl = customApiUrl || CONFIG.API_BASE_URL;

  console.log(`\nStarting E2E Test Runner...`);
  console.log(`Configuration:`);
  console.log(`  Target Backend  : ${useOracle ? 'In-Memory Oracle Server' : apiUrl}`);
  console.log(`  Frontend Dir    : ${CONFIG.FRONTEND_DIR}`);
  console.log(`  Selected Scope  : ${isBackendOnly ? 'Backend Only' : isFrontendOnly ? 'Frontend Only' : 'Full Stack (Backend + Frontend)'}`);
  if (selectedTier) {
    console.log(`  Selected Tier   : Tier ${selectedTier}`);
  }

  // Handle Backend setup
  let http = null;
  const shouldRunBackend = !isFrontendOnly;
  const shouldRunFrontend = !isBackendOnly;

  if (shouldRunBackend) {
    if (useOracle) {
      reporter.info(`Iniciando servidor oraculo en puerto ${CONFIG.ORACLE_PORT}...`);
      oracleServer = new OracleServer(CONFIG.ORACLE_PORT);
      apiUrl = await oracleServer.start();
      reporter.info(`Servidor oraculo activo en ${apiUrl}`);
      http = new HttpClient(apiUrl);
    } else {
      http = new HttpClient(apiUrl);
      const isAlive = await http.checkHealth();
      if (!isAlive) {
        console.log(`\n\x1b[33m[ADVERTENCIA] El backend en ${apiUrl} no responde o esta fuera de linea.\x1b[0m`);
        console.log(`Para ejecutar las pruebas HTTP contra el backend real:`);
        console.log(`  1. Inicie PostgreSQL en el puerto 5432`);
        console.log(`  2. Inicie Spring Boot: ./mvnw spring-boot:run`);
        console.log(`O ejecute el runner con oraculo de especificacion en memoria:`);
        console.log(`  node e2e-tests/run-all.js --oracle\n`);
      }
    }
  }

  try {
    // -------------------------------------------------------------
    // Tier 1: Feature Coverage (Happy Path)
    // -------------------------------------------------------------
    if (!selectedTier || selectedTier === 1) {
      if (shouldRunBackend && http) {
        const isAlive = useOracle || (await http.checkHealth());
        if (isAlive) {
          await runTier1Backend(http, reporter);
        } else {
          reporter.tier(1, 'Feature Coverage — Backend Endpoints (F1 - F5)');
          reporter.skip('Backend HTTP Tests (Tier 1)', `Servidor ${apiUrl} no disponible`);
        }
      }
      if (shouldRunFrontend) {
        await runTier1Frontend(reporter);
      }
    }

    // -------------------------------------------------------------
    // Tier 2: Boundary & Corner Cases
    // -------------------------------------------------------------
    if (!selectedTier || selectedTier === 2) {
      if (shouldRunBackend && http) {
        const isAlive = useOracle || (await http.checkHealth());
        if (isAlive) {
          await runTier2Backend(http, reporter);
        } else {
          reporter.tier(2, 'Boundary & Corner Cases — Backend Validation');
          reporter.skip('Backend HTTP Tests (Tier 2)', `Servidor ${apiUrl} no disponible`);
        }
      }
      if (shouldRunFrontend) {
        await runTier2Frontend(reporter);
      }
    }

    // -------------------------------------------------------------
    // Tier 3: Cross-Feature Combinations
    // -------------------------------------------------------------
    if (!selectedTier || selectedTier === 3) {
      if (shouldRunBackend && http) {
        const isAlive = useOracle || (await http.checkHealth());
        if (isAlive) {
          await runTier3Backend(http, reporter);
        } else {
          reporter.tier(3, 'Cross-Feature Combinations — Relational Lifecycle');
          reporter.skip('Backend HTTP Tests (Tier 3)', `Servidor ${apiUrl} no disponible`);
        }
      }
      if (shouldRunFrontend) {
        await runTier3Frontend(reporter);
      }
    }

    // -------------------------------------------------------------
    // Tier 4: Real-World Application Scenarios
    // -------------------------------------------------------------
    if (!selectedTier || selectedTier === 4) {
      if (shouldRunBackend && http) {
        const isAlive = useOracle || (await http.checkHealth());
        if (isAlive) {
          await runTier4Backend(http, reporter);
        } else {
          reporter.tier(4, 'Real-World Application Scenarios');
          reporter.skip('Backend HTTP Tests (Tier 4)', `Servidor ${apiUrl} no disponible`);
        }
      }
      if (shouldRunFrontend) {
        await runTier4Frontend(reporter);
      }
    }
  } finally {
    if (oracleServer) {
      await oracleServer.stop();
      reporter.info('Servidor oraculo detenido.');
    }
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
