/**
 * Tier 4: Real-World Application Scenarios — Backend Endpoints
 * 
 * Verifies realistic e-commerce operational scenarios:
 * - Scenario 4.1: Seasonal Price Adjustment Campaign (Cyberlunes / Descuentos)
 * - Scenario 4.2: Inventory Stock Depletion to 0 (Agotado)
 * - Scenario 4.3: Brand Reclassification & Unicode / Spanish Accents Round-Trip Escaping
 */

import { Assertions } from '../utils/assertions.js';
import assert from 'node:assert/strict';

export async function runTier4Backend(http, reporter) {
  reporter.tier(4, 'Real-World Application Scenarios — E-Commerce Business Workflows');

  const timestamp = Date.now();
  let promoCatId = null;
  let promoProdId = null;

  // Setup: Create a promotional category and product
  try {
    const catRes = await http.post('/categorias', {
      nombre: `Tier4 Promo ${timestamp}`,
      descripcion: 'Categoria de promociones y campanas',
    });
    Assertions.assertStatus(catRes, 201);
    promoCatId = catRes.body.id;

    const prodRes = await http.post('/productos', {
      categoriaId: promoCatId,
      nombre: `Chaqueta Impermeable ${timestamp}`,
      descripcion: 'Prenda para lluvia con tecnologia termica',
      precio: 180000.0,
      stock: 45,
      imagenUrl: 'https://picsum.photos/seed/promo/400/400',
    });
    Assertions.assertStatus(prodRes, 201);
    promoProdId = prodRes.body.id;
  } catch (err) {
    reporter.fail('Setup: Creacion de catalogo para Tier 4', err);
    return;
  }

  // Scenario 4.1: Flash Sale Discount Price Update
  try {
    // 30% discount applied: 180,000 -> 126,000
    const discountedPrice = 126000.0;
    const putRes = await http.put(`/productos/${promoProdId}`, {
      categoriaId: promoCatId,
      nombre: `Chaqueta Impermeable (Oferta Flash) ${timestamp}`,
      descripcion: 'Precio de campana Cyberlunes con 30% de descuento',
      precio: discountedPrice,
      stock: 45, // Stock remains identical
      imagenUrl: 'https://picsum.photos/seed/promo/400/400',
    });

    Assertions.assertStatus(putRes, 200, 'Actualizacion de precio en campana');
    assert.equal(Number(putRes.body.precio), discountedPrice);
    assert.equal(putRes.body.stock, 45);

    // Verify catalog reflects new price
    const getRes = await http.get(`/productos/${promoProdId}`);
    assert.equal(Number(getRes.body.precio), discountedPrice);
    reporter.pass('Scenario 4.1: Actualizacion masiva de precio por descuento flash (mantiene stock y consistencia)');
  } catch (err) {
    reporter.fail('Scenario 4.1: Actualizacion por descuento flash', err);
  }

  // Scenario 4.2: Stock Depletion to 0 (Agotado)
  try {
    const putZeroStockRes = await http.put(`/productos/${promoProdId}`, {
      categoriaId: promoCatId,
      nombre: `Chaqueta Impermeable (Oferta Flash) ${timestamp}`,
      descripcion: 'Todas las unidades vendidas en la jornada',
      precio: 126000.0,
      stock: 0, // Out of stock
    });

    Assertions.assertStatus(putZeroStockRes, 200, 'Agotar stock a 0');
    assert.equal(putZeroStockRes.body.stock, 0);

    // Product should still exist in catalog search by category
    const catProdsRes = await http.get(`/productos?categoriaId=${promoCatId}`);
    Assertions.assertStatus(catProdsRes, 200);
    const found = catProdsRes.body.find((p) => p.id === promoProdId);
    assert.ok(found, 'Producto agotado debe continuar apareciendo en catalogo de la categoria');
    assert.equal(found.stock, 0, 'Stock debe ser 0 en listado');
    reporter.pass('Scenario 4.2: Liquidacion de stock a 0 conserva visibilidad en catalogo con indicador de agotado');
  } catch (err) {
    reporter.fail('Scenario 4.2: Liquidacion de stock a 0', err);
  }

  // Scenario 4.3: Unicode, Accents, and Spanish Character Integrity (Adversarial Escaping)
  try {
    const unicodeCatName = `Colección Élite: Niños & Bebés — Edición 2026 ${timestamp}`;
    const unicodeCatDesc = 'Artículos de alta precisión: diseños estándar con ñ, á, é, í, ó, ú, y guión largo —';

    const putUnicodeRes = await http.put(`/categorias/${promoCatId}`, {
      nombre: unicodeCatName,
      descripcion: unicodeCatDesc,
    });

    Assertions.assertStatus(putUnicodeRes, 200, 'Soporte completo de UTF-8 en categoria');
    assert.equal(putUnicodeRes.body.nombre, unicodeCatName);
    assert.equal(putUnicodeRes.body.descripcion, unicodeCatDesc);

    // Verify retrieval returns exact string without character corruption (mojibake)
    const getUnicodeRes = await http.get(`/categorias/${promoCatId}`);
    assert.equal(getUnicodeRes.body.nombre, unicodeCatName, 'Encoding UTF-8 debe ser fiel sin corrupcion');
    reporter.pass('Scenario 4.3: Fidelidad de caracteres en espanol, tildes, enie y caracteres especiales (UTF-8)');
  } catch (err) {
    reporter.fail('Scenario 4.3: Fidelidad UTF-8 y caracteres especiales', err);
  }

  // Teardown
  try {
    await http.delete(`/productos/${promoProdId}`);
    await http.delete(`/categorias/${promoCatId}`);
  } catch {
    // Best effort teardown
  }
}

export default runTier4Backend;
