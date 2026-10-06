/**
 * Tier 1: Feature Coverage (Happy Path) — Backend Endpoints (F1 - F5)
 * 
 * Verifies core functionality for:
 * - F1: PUT /api/v1/categorias/{id} (200 OK)
 * - F2: DELETE /api/v1/categorias/{id} (204 No Content)
 * - F3: PUT /api/v1/productos/{id} (200 OK)
 * - F4: DELETE /api/v1/productos/{id} (204 No Content)
 * - F5: OpenAPI / Swagger docs (/api/v1/api-docs & /api/v1/docs)
 */

import { Assertions } from '../utils/assertions.js';
import assert from 'node:assert/strict';

export async function runTier1Backend(http, reporter) {
  reporter.tier(1, 'Feature Coverage (Happy Path) — Backend Endpoints F1 - F5');

  // Setup: Create a dedicated isolated category for Tier 1 tests
  const uniqueSuffix = Date.now();
  const catName = `Tier1 Cat ${uniqueSuffix}`;
  let catId = null;

  try {
    const createCatRes = await http.post('/categorias', {
      nombre: catName,
      descripcion: 'Categoria para prueba Tier 1',
    });
    Assertions.assertStatus(createCatRes, 201, 'Setup: Creacion de categoria aislada');
    catId = createCatRes.body.id;
    reporter.info(`Created test category id=${catId} ("${catName}")`);
  } catch (err) {
    reporter.fail('Setup: Creacion de categoria para Tier 1', err);
    return;
  }

  // Setup: Create a dedicated isolated product under this category
  let prodId = null;
  const prodName = `Tier1 Prod ${uniqueSuffix}`;
  try {
    const createProdRes = await http.post('/productos', {
      categoriaId: catId,
      nombre: prodName,
      descripcion: 'Producto para prueba Tier 1',
      precio: 49900.0,
      stock: 25,
      imagenUrl: 'https://picsum.photos/seed/tier1/400/400',
    });
    Assertions.assertStatus(createProdRes, 201, 'Setup: Creacion de producto aislado');
    prodId = createProdRes.body.id;
    reporter.info(`Created test product id=${prodId} ("${prodName}")`);
  } catch (err) {
    reporter.fail('Setup: Creacion de producto para Tier 1', err);
    return;
  }

  // --- Feature F1: PUT /api/v1/categorias/{id} ---
  try {
    const updatedName = `${catName} Actualizada`;
    const updatedDesc = 'Descripcion actualizada en prueba F1';
    const putRes = await http.put(`/categorias/${catId}`, {
      nombre: updatedName,
      descripcion: updatedDesc,
    });

    Assertions.assertStatus(putRes, 200, 'F1: PUT categoria debe responder 200 OK');
    Assertions.assertCategory(putRes.body, {
      id: catId,
      nombre: updatedName,
      descripcion: updatedDesc,
    });

    // Verification: GET retrieves the updated values
    const getRes = await http.get(`/categorias/${catId}`);
    Assertions.assertStatus(getRes, 200, 'F1: GET debe reflejar datos actualizados');
    assert.equal(getRes.body.nombre, updatedName);
    reporter.pass('F1: PUT /api/v1/categorias/{id} actualiza nombre y descripcion (200 OK)');
  } catch (err) {
    reporter.fail('F1: PUT /api/v1/categorias/{id} actualiza nombre y descripcion', err);
  }

  // --- Feature F3: PUT /api/v1/productos/{id} ---
  try {
    const updatedProdName = `${prodName} Modificado`;
    const putProdRes = await http.put(`/productos/${prodId}`, {
      categoriaId: catId,
      nombre: updatedProdName,
      descripcion: 'Descripcion de producto modificada',
      precio: 59900.0,
      stock: 50,
      imagenUrl: 'https://picsum.photos/seed/tier1-mod/400/400',
    });

    Assertions.assertStatus(putProdRes, 200, 'F3: PUT producto debe responder 200 OK');
    Assertions.assertProduct(putProdRes.body, {
      id: prodId,
      categoriaId: catId,
      nombre: updatedProdName,
      precio: 59900.0,
      stock: 50,
    });

    // Verification: GET retrieves updated product
    const getProdRes = await http.get(`/productos/${prodId}`);
    Assertions.assertStatus(getProdRes, 200, 'F3: GET debe reflejar producto actualizado');
    assert.equal(getProdRes.body.nombre, updatedProdName);
    assert.equal(Number(getProdRes.body.precio), 59900.0);
    assert.equal(getProdRes.body.stock, 50);
    reporter.pass('F3: PUT /api/v1/productos/{id} actualiza producto y valida integridad (200 OK)');
  } catch (err) {
    reporter.fail('F3: PUT /api/v1/productos/{id} actualiza producto', err);
  }

  // --- Feature F4: DELETE /api/v1/productos/{id} ---
  try {
    const delProdRes = await http.delete(`/productos/${prodId}`);
    Assertions.assertStatus(delProdRes, 204, 'F4: DELETE producto debe responder 204 No Content');
    assert.equal(delProdRes.rawText, '', 'F4: 204 response body must be empty');

    // Verification: subsequent GET returns 404
    const getDeletedRes = await http.get(`/productos/${prodId}`);
    Assertions.assertStatus(getDeletedRes, 404, 'F4: Producto eliminado ya no debe existir (404)');
    reporter.pass('F4: DELETE /api/v1/productos/{id} elimina producto y retorna 204 No Content');
  } catch (err) {
    reporter.fail('F4: DELETE /api/v1/productos/{id} elimina producto', err);
  }

  // --- Feature F2: DELETE /api/v1/categorias/{id} ---
  try {
    // Now that product is deleted, category has 0 products and can be deleted cleanly
    const delCatRes = await http.delete(`/categorias/${catId}`);
    Assertions.assertStatus(delCatRes, 204, 'F2: DELETE categoria sin productos debe responder 204 No Content');
    assert.equal(delCatRes.rawText, '', 'F2: 204 response body must be empty');

    // Verification: subsequent GET returns 404
    const getDeletedCat = await http.get(`/categorias/${catId}`);
    Assertions.assertStatus(getDeletedCat, 404, 'F2: Categoria eliminada ya no debe existir (404)');
    reporter.pass('F2: DELETE /api/v1/categorias/{id} elimina categoria sin productos (204 No Content)');
  } catch (err) {
    reporter.fail('F2: DELETE /api/v1/categorias/{id} elimina categoria sin productos', err);
  }

  // --- Feature F5: Swagger UI / OpenAPI Documentation ---
  try {
    const apiDocsRes = await http.get('/api-docs');
    Assertions.assertStatus(apiDocsRes, 200, 'F5: OpenAPI JSON debe responder 200 OK');
    assert.ok(apiDocsRes.body?.openapi || apiDocsRes.body?.swagger, 'F5: Response must be valid OpenAPI specification');

    const paths = apiDocsRes.body?.paths || {};
    const hasCatPut = paths['/api/v1/categorias/{id}']?.put !== undefined;
    const hasCatDel = paths['/api/v1/categorias/{id}']?.delete !== undefined;
    const hasProdPut = paths['/api/v1/productos/{id}']?.put !== undefined;
    const hasProdDel = paths['/api/v1/productos/{id}']?.delete !== undefined;

    assert.ok(hasCatPut, 'OpenAPI spec must document PUT /api/v1/categorias/{id}');
    assert.ok(hasCatDel, 'OpenAPI spec must document DELETE /api/v1/categorias/{id}');
    assert.ok(hasProdPut, 'OpenAPI spec must document PUT /api/v1/productos/{id}');
    assert.ok(hasProdDel, 'OpenAPI spec must document DELETE /api/v1/productos/{id}');

    reporter.pass('F5: OpenAPI /api/v1/api-docs documenta endpoints CRUD (PUT y DELETE)');
  } catch (err) {
    reporter.fail('F5: OpenAPI documentation check', err);
  }

  try {
    const docsRes = await http.get('/docs');
    Assertions.assertStatus(docsRes, 200, 'F5: Swagger UI (/docs) debe responder 200 OK');
    reporter.pass('F5: Swagger UI disponible en /api/v1/docs (200 OK)');
  } catch (err) {
    reporter.fail('F5: Swagger UI check', err);
  }
}

export default runTier1Backend;
