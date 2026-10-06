/**
 * Tier 1: Feature Coverage — Frontend Project Scaffolding & Build (F6)
 * 
 * Verifies:
 * - Frontend directory exists at configured path
 * - Valid package.json with React, Vite, Sass, TypeScript
 * - npm run build executes cleanly with exit code 0
 * - Production assets generated in dist/ directory (index.html, bundles)
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { CONFIG } from '../config.js';

export async function runTier1Frontend(reporter) {
  reporter.tier(1, 'Feature Coverage — Frontend Scaffolding & Build (F6)');

  const frontendDir = CONFIG.FRONTEND_DIR;

  // Test 1.1: Project Directory Existence
  try {
    assert.ok(
      fs.existsSync(frontendDir),
      `Frontend project directory not found at ${frontendDir}`
    );
    reporter.pass('F6: Directorio del proyecto frontend existe en ruta desacoplada');
  } catch (err) {
    reporter.fail('F6: Verificacion de directorio frontend', err);
    return;
  }

  // Test 1.2: package.json structure & dependencies
  try {
    const pkgPath = path.join(frontendDir, 'package.json');
    assert.ok(fs.existsSync(pkgPath), 'package.json debe existir en frontend');

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    assert.ok(pkg.scripts?.dev, 'package.json debe incluir script "dev"');
    assert.ok(pkg.scripts?.build, 'package.json debe incluir script "build"');

    const allDeps = {
      ...(pkg.dependencies || {}),
      ...(pkg.devDependencies || {}),
    };

    assert.ok(allDeps.react, 'Dependencia "react" debe estar declarada');
    assert.ok(allDeps['react-dom'], 'Dependencia "react-dom" debe estar declarada');
    assert.ok(allDeps.vite, 'Dependencia "vite" debe estar declarada');
    assert.ok(allDeps.sass, 'Dependencia "sass" (Dart Sass) debe estar declarada');

    reporter.pass('F6: package.json declara scripts (dev, build) y dependencias requeridas (react, vite, sass)');
  } catch (err) {
    reporter.fail('F6: Inspeccion de package.json y dependencias', err);
  }

  // Test 1.3: Clean build execution (npm run build)
  try {
    reporter.info(`Ejecutando "npm run build" en ${frontendDir}...`);
    const output = execSync('npm run build', {
      cwd: frontendDir,
      encoding: 'utf-8',
      timeout: CONFIG.BUILD_TIMEOUT_MS,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const distPath = path.join(frontendDir, 'dist');
    const indexHtml = path.join(distPath, 'index.html');
    assert.ok(fs.existsSync(indexHtml), 'dist/index.html debe ser generado tras la compilacion');

    const assetsDir = path.join(distPath, 'assets');
    assert.ok(fs.existsSync(assetsDir), 'dist/assets/ debe contener los bundles compilados');

    reporter.pass('F6: npm run build compila limpiamente sin errores y genera distribucion en dist/');
  } catch (err) {
    const stderr = err.stderr ? err.stderr.toString() : '';
    const stdout = err.stdout ? err.stdout.toString() : '';
    const details = (stderr || stdout || err.message).slice(0, 400);
    reporter.fail('F6: npm run build compilacion limpia', new Error(`Build failed: ${details}`));
  }
}

export default runTier1Frontend;
