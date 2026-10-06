/**
 * Tier 2: Boundary and Corner Cases — Frontend SCSS Architecture (F10)
 * 
 * Verifies strict compliance with modular SCSS requirements:
 * - Presence of design system tokens (_variables.scss)
 * - Presence of reusable mixins (_mixins.scss)
 * - Component styling using CSS Modules (*.module.scss)
 * - Absence of unmodularized flat CSS for components
 * - Responsive breakpoints and media query declarations
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { CONFIG } from '../config.js';

export async function runTier2Frontend(reporter) {
  reporter.tier(2, 'Boundary & Architecture — SCSS Modular System (F10)');

  const frontendDir = CONFIG.FRONTEND_DIR;
  const stylesDir = path.join(frontendDir, 'src', 'styles');

  // Test 2.1: Design Tokens in _variables.scss
  try {
    const varsPath = path.join(stylesDir, '_variables.scss');
    assert.ok(fs.existsSync(varsPath), 'src/styles/_variables.scss debe existir');

    const content = fs.readFileSync(varsPath, 'utf-8');
    assert.ok(content.includes('$color-primary'), 'Debe definir token $color-primary');
    assert.ok(content.includes('$radius-') || content.includes('$border-radius'), 'Debe definir tokens de radio de borde');
    assert.ok(content.includes('$spacing-') || content.includes('$space-'), 'Debe definir escala de espaciado');
    assert.ok(content.includes('$bp-') || content.includes('$breakpoint-'), 'Debe definir breakpoints para responsive');

    reporter.pass('F10: _variables.scss define sistema de tokens (colores, tipografia, espaciado, breakpoints)');
  } catch (err) {
    reporter.fail('F10: Tokens SCSS en _variables.scss', err);
  }

  // Test 2.2: Mixins in _mixins.scss
  try {
    const mixinsPath = path.join(stylesDir, '_mixins.scss');
    assert.ok(fs.existsSync(mixinsPath), 'src/styles/_mixins.scss debe existir');

    const content = fs.readFileSync(mixinsPath, 'utf-8');
    assert.ok(content.includes('@mixin'), 'Debe definir al menos un @mixin');
    assert.ok(
      content.includes('respond-to') || content.includes('media') || content.includes('breakpoint'),
      'Debe incluir mixin para media queries responsive (@mixin respond-to)'
    );

    reporter.pass('F10: _mixins.scss define mixins reutilizables y media queries para diseño responsivo');
  } catch (err) {
    reporter.fail('F10: Mixins en _mixins.scss', err);
  }

  // Test 2.3: CSS Modules for Components (*.module.scss)
  try {
    const componentsDir = path.join(frontendDir, 'src', 'components');
    assert.ok(fs.existsSync(componentsDir), 'src/components/ debe existir');

    const requiredModules = [
      'CategoryFilter/CategoryFilter.module.scss',
      'ProductCard/ProductCard.module.scss',
      'ProductGrid/ProductGrid.module.scss',
      'Header/Header.module.scss',
      'LoadingState/LoadingState.module.scss',
      'ErrorState/ErrorState.module.scss',
      'EmptyState/EmptyState.module.scss',
    ];

    const missing = [];
    for (const mod of requiredModules) {
      const fullPath = path.join(componentsDir, mod);
      if (!fs.existsSync(fullPath)) {
        missing.push(mod);
      }
    }

    assert.equal(
      missing.length,
      0,
      `Modulos SCSS faltantes en componentes: ${missing.join(', ')}`
    );

    reporter.pass('F10: Componentes implementan estilos encapsulados via CSS Modules (*.module.scss)');
  } catch (err) {
    reporter.fail('F10: Modulos SCSS de componentes', err);
  }

  // Test 2.4: Prevention of flat CSS pollution in components
  try {
    const componentsDir = path.join(frontendDir, 'src', 'components');
    // Ensure no flat *.css files exist in src/components/
    const flatCssFiles = [];
    function scanForFlatCss(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanForFlatCss(full);
        } else if (entry.name.endsWith('.css') && !entry.name.endsWith('.module.css')) {
          flatCssFiles.push(entry.name);
        }
      }
    }
    scanForFlatCss(componentsDir);

    assert.equal(
      flatCssFiles.length,
      0,
      `Se detecto CSS plano en componentes: ${flatCssFiles.join(', ')}. Debe usarse SCSS modular.`
    );

    reporter.pass('F10: Ausencia de CSS plano no encapsulado en componentes (arquitectura SCSS limpia)');
  } catch (err) {
    reporter.fail('F10: Control de CSS plano en componentes', err);
  }
}

export default runTier2Frontend;
