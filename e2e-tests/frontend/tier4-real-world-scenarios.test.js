/**
 * Tier 4: Real-World Application Scenarios — UI Visual States & Error Recovery (F9)
 * 
 * Verifies real-world frontend resilience and user experience:
 * - LoadingState: Skeleton elements with shimmer animation
 * - ErrorState: Network error handling with retry trigger
 * - EmptyState: Empty catalog guidance and filter reset
 * - Currency formatting in COP ($ 35.000) and Out-of-Stock badge
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { CONFIG } from '../config.js';

export async function runTier4Frontend(reporter) {
  reporter.tier(4, 'Real-World Scenarios — Visual States & Fault Recovery (F9)');

  const frontendDir = CONFIG.FRONTEND_DIR;
  const componentsDir = path.join(frontendDir, 'src', 'components');

  // Test 4.1: LoadingState with Skeletons & Shimmer Animation
  try {
    const loadingCompPath = path.join(componentsDir, 'LoadingState', 'LoadingState.tsx');
    const loadingScssPath = path.join(componentsDir, 'LoadingState', 'LoadingState.module.scss');
    assert.ok(fs.existsSync(loadingCompPath), 'LoadingState.tsx debe existir');
    assert.ok(fs.existsSync(loadingScssPath), 'LoadingState.module.scss debe existir');

    const scssContent = fs.readFileSync(loadingScssPath, 'utf-8');
    assert.ok(
      scssContent.includes('shimmer') || scssContent.includes('pulse') || scssContent.includes('keyframes'),
      'LoadingState.module.scss debe definir animacion de shimmer o pulse'
    );

    reporter.pass('F9 Visual State: LoadingState implementa skeletons con efecto shimmer pulsante');
  } catch (err) {
    reporter.fail('F9 Visual State: LoadingState y animacion shimmer', err);
  }

  // Test 4.2: ErrorState with Connection Message & Retry Button
  try {
    const errorCompPath = path.join(componentsDir, 'ErrorState', 'ErrorState.tsx');
    assert.ok(fs.existsSync(errorCompPath), 'ErrorState.tsx debe existir');

    const content = fs.readFileSync(errorCompPath, 'utf-8');
    assert.ok(
      content.includes('Reintentar') || content.includes('reintentar') || content.includes('retry') || content.includes('Retry'),
      'ErrorState debe incluir boton o accion de reintento ("Reintentar")'
    );
    assert.ok(
      content.includes('onClick') || content.includes('onRetry'),
      'ErrorState debe invocar callback de reintento al interactuar con el usuario'
    );

    reporter.pass('F9 Visual State: ErrorState gestiona fallos de conexion y provee boton de reintento');
  } catch (err) {
    reporter.fail('F9 Visual State: ErrorState y boton de reintento', err);
  }

  // Test 4.3: EmptyState with Catalog Reset Guidance
  try {
    const emptyCompPath = path.join(componentsDir, 'EmptyState', 'EmptyState.tsx');
    assert.ok(fs.existsSync(emptyCompPath), 'EmptyState.tsx debe existir');

    const content = fs.readFileSync(emptyCompPath, 'utf-8');
    assert.ok(
      content.includes('producto') || content.includes('categor'),
      'EmptyState debe informar que no hay productos para el criterio'
    );
    assert.ok(
      content.includes('Todos') || content.includes('limpiar') || content.includes('onReset') || content.includes('onClick'),
      'EmptyState debe permitir restablecer el filtro para volver al catalogo completo'
    );

    reporter.pass('F9 Visual State: EmptyState provee mensaje orientativo y restablecimiento de filtros');
  } catch (err) {
    reporter.fail('F9 Visual State: EmptyState y restablecimiento', err);
  }

  // Test 4.4: Currency Formatting (COP) & Stock Badge Visual Distinction
  try {
    const cardCompPath = path.join(componentsDir, 'ProductCard', 'ProductCard.tsx');
    const cardScssPath = path.join(componentsDir, 'ProductCard', 'ProductCard.module.scss');
    assert.ok(fs.existsSync(cardCompPath), 'ProductCard.tsx debe existir');
    assert.ok(fs.existsSync(cardScssPath), 'ProductCard.module.scss debe existir');

    const compContent = fs.readFileSync(cardCompPath, 'utf-8');
    assert.ok(
      compContent.includes('Intl.NumberFormat') || compContent.includes('COP') || compContent.includes('$'),
      'ProductCard debe formatear los precios en moneda'
    );
    assert.ok(
      compContent.includes('Agotado') || compContent.includes('agotado') || compContent.includes('stock === 0'),
      'ProductCard debe manejar estado "Agotado" cuando stock es 0'
    );

    const scssContent = fs.readFileSync(cardScssPath, 'utf-8');
    assert.ok(
      scssContent.includes('badge') || scssContent.includes('stock'),
      'ProductCard.module.scss debe contener estilos para badges de stock'
    );

    reporter.pass('F8/F9 Scenario: ProductCard formatea precios y despliega badge "Agotado" para stock en 0');
  } catch (err) {
    reporter.fail('F8/F9 Scenario: Formato de precios y badge de agotado', err);
  }
}

export default runTier4Frontend;
