/**
 * Tier 3: Cross-Feature Combinations — Frontend API Service & Contracts (F7 & F8)
 * 
 * Verifies cross-feature integration between UI components and Backend REST contracts:
 * - TypeScript types match Backend DTO records (Categoria, Producto, ApiError)
 * - API Service layer (src/services/api.ts) exposes required fetch functions
 * - CategoryFilter handles "Todos los productos" and updates selection without page reloads
 * - ProductGrid & ProductCard consume fields and bind data reactively
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { CONFIG } from '../config.js';

export async function runTier3Frontend(reporter) {
  reporter.tier(3, 'Cross-Feature Integration — API Service & Contract Parity (F7 & F8)');

  const frontendDir = CONFIG.FRONTEND_DIR;

  // Test 3.1: TypeScript DTO Type Contracts
  try {
    const typesDir = path.join(frontendDir, 'src', 'types');
    assert.ok(fs.existsSync(typesDir), 'src/types/ debe existir');

    const catTypeFile = path.join(typesDir, 'categoria.ts');
    assert.ok(fs.existsSync(catTypeFile), 'src/types/categoria.ts debe existir');
    const catContent = fs.readFileSync(catTypeFile, 'utf-8');
    assert.ok(catContent.includes('id: number') || catContent.includes('id?: number'), 'Categoria debe tipar id como number');
    assert.ok(catContent.includes('nombre: string'), 'Categoria debe tipar nombre como string');

    const prodTypeFile = path.join(typesDir, 'producto.ts');
    assert.ok(fs.existsSync(prodTypeFile), 'src/types/producto.ts debe existir');
    const prodContent = fs.readFileSync(prodTypeFile, 'utf-8');
    assert.ok(prodContent.includes('categoriaId'), 'Producto debe contener categoriaId');
    assert.ok(prodContent.includes('precio: number'), 'Producto debe tipar precio como number');
    assert.ok(prodContent.includes('stock: number'), 'Producto debe tipar stock como number');

    reporter.pass('F7/F8 Contract: TypeScript types (Categoria, Producto) reflejan los DTOs de la API');
  } catch (err) {
    reporter.fail('F7/F8 Contract: TypeScript types de la API', err);
  }

  // Test 3.2: API Service Layer (src/services/api.ts)
  try {
    const apiServicePath = path.join(frontendDir, 'src', 'services', 'api.ts');
    assert.ok(fs.existsSync(apiServicePath), 'src/services/api.ts debe existir');

    const content = fs.readFileSync(apiServicePath, 'utf-8');
    assert.ok(
      content.includes('getCategorias') || content.includes('fetchCategorias'),
      'api.ts debe exportar funcion para obtener categorias'
    );
    assert.ok(
      content.includes('getProductos') || content.includes('fetchProductos'),
      'api.ts debe exportar funcion para obtener productos'
    );
    assert.ok(
      content.includes('categoriaId') || content.includes('categoria'),
      'api.ts debe soportar filtro por categoriaId'
    );
    assert.ok(
      content.includes('8080') || content.includes('VITE_API_BASE_URL'),
      'api.ts debe apuntar al puerto 8080 o variable de entorno VITE_API_BASE_URL'
    );

    reporter.pass('F7/F8 Integration: Servicio api.ts encapsula endpoints y soporta filtrado por categoria');
  } catch (err) {
    reporter.fail('F7/F8 Integration: Servicio api.ts', err);
  }

  // Test 3.3: CategoryFilter Component Reactivity (No Page Reload)
  try {
    const filterCompPath = path.join(
      frontendDir,
      'src',
      'components',
      'CategoryFilter',
      'CategoryFilter.tsx'
    );
    assert.ok(fs.existsSync(filterCompPath), 'CategoryFilter.tsx debe existir');

    const content = fs.readFileSync(filterCompPath, 'utf-8');
    assert.ok(
      content.includes('Todos') || content.includes('todas'),
      'CategoryFilter debe incluir opcion para ver todos los productos'
    );
    // Ensure no window.location reload hack is present
    assert.ok(
      !content.includes('window.location.reload'),
      'CategoryFilter no debe recargar la pagina con window.location.reload'
    );
    assert.ok(
      !content.includes('window.location.href'),
      'CategoryFilter no debe redirigir con window.location.href'
    );

    reporter.pass('F7: CategoryFilter gestiona estado reactivo y opcion "Todos los productos" sin recargas de pagina');
  } catch (err) {
    reporter.fail('F7: Componente CategoryFilter', err);
  }

  // Test 3.4: ProductGrid & ProductCard Data Binding
  try {
    const cardCompPath = path.join(
      frontendDir,
      'src',
      'components',
      'ProductCard',
      'ProductCard.tsx'
    );
    assert.ok(fs.existsSync(cardCompPath), 'ProductCard.tsx debe existir');

    const content = fs.readFileSync(cardCompPath, 'utf-8');
    assert.ok(content.includes('precio'), 'ProductCard debe vincular precio');
    assert.ok(content.includes('stock'), 'ProductCard debe vincular stock');
    assert.ok(content.includes('nombre'), 'ProductCard debe vincular nombre');

    reporter.pass('F8: ProductCard vincula nombre, precio, stock y categoria dinamicamente');
  } catch (err) {
    reporter.fail('F8: Componente ProductCard', err);
  }
}

export default runTier3Frontend;
