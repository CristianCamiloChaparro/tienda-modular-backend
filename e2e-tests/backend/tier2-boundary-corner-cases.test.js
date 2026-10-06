/**
 * Tier 2: Boundary and Corner Cases — Backend API
 * 
 * Tests boundary conditions, business rules, validation errors, and integrity constraints:
 * - F1: PUT categorias validation (blank, length=80, length=81, 404 not found, 409 duplicate, same name 200)
 * - F2: DELETE categorias integrity (409 with exact referential integrity message, 404 not found)
 * - F3: PUT productos validation (price<=0, price=0.01, stock<0, stock=0, 404 prod, 404 cat FK)
 * - F4: DELETE productos (404 not found)
 */

import { Assertions } from '../utils/assertions.js';
import assert from 'node:assert/strict';

export async function runTier2Backend(http, reporter) {
  reporter.tier(2, 'Boundary & Corner Cases — Backend Validation & Error Handling');

  const timestamp = Date.now();
  let baseCatIdA = null;
  let baseCatIdB = null;
  let testProdId = null;

  // Setup: Create two categories and one product for collision and FK tests
  try {
    const resA = await http.post('/categorias', {
      nombre: `Tier2 Alpha ${timestamp}`,
      descripcion: 'Categoria Alpha para pruebas de colision',
    });
    Assertions.assertStatus(resA, 201);
    baseCatIdA = resA.body.id;

    const resB = await http.post('/categorias', {
      nombre: `Tier2 Beta ${timestamp}`,
      descripcion: 'Categoria Beta para pruebas de colision',
    });
    Assertions.assertStatus(resB, 201);
    baseCatIdB = resB.body.id;

    const resP = await http.post('/productos', {
      categoriaId: baseCatIdA,
      nombre: `Tier2 Prod Base ${timestamp}`,
      descripcion: 'Producto para prueba de integridad referencial',
      precio: 15000.0,
      stock: 10,
    });
    Assertions.assertStatus(resP, 201);
    testProdId = resP.body.id;
  } catch (err) {
    reporter.fail('Setup: Creacion de entidades para Tier 2', err);
    return;
  }

  // =========================================================================
  // F1: PUT /api/v1/categorias/{id} Boundary & Edge Cases
  // =========================================================================

  // Test 2.1: Blank category name -> 400 Bad Request
  try {
    const res = await http.put(`/categorias/${baseCatIdA}`, {
      nombre: '   ',
      descripcion: 'Intento con nombre en blanco',
    });
    Assertions.assertApiError(res, 400, null, 'nombre');
    reporter.pass('F1 Corner: PUT categoria con nombre en blanco rechaza con 400 Bad Request');
  } catch (err) {
    reporter.fail('F1 Corner: PUT categoria con nombre en blanco', err);
  }

  // Test 2.2: Name length boundary = 80 chars -> 200 OK
  try {
    const name80 = 'C'.repeat(80);
    const res = await http.put(`/categorias/${baseCatIdB}`, {
      nombre: name80,
      descripcion: 'Nombre con exactamente 80 caracteres (limite superior)',
    });
    Assertions.assertStatus(res, 200, 'Nombre de 80 caracteres debe ser permitido');
    assert.equal(res.body.nombre, name80);
    reporter.pass('F1 Boundary: PUT categoria con nombre de 80 caracteres responde 200 OK');
  } catch (err) {
    reporter.fail('F1 Boundary: PUT categoria con nombre de 80 caracteres', err);
  }

  // Test 2.3: Name length boundary = 81 chars -> 400 Bad Request
  try {
    const name81 = 'C'.repeat(81);
    const res = await http.put(`/categorias/${baseCatIdB}`, {
      nombre: name81,
      descripcion: 'Nombre con 81 caracteres (excede limite)',
    });
    Assertions.assertApiError(res, 400, null, 'nombre');
    reporter.pass('F1 Boundary: PUT categoria con nombre de 81 caracteres rechaza con 400 Bad Request');
  } catch (err) {
    reporter.fail('F1 Boundary: PUT categoria con nombre de 81 caracteres', err);
  }

  // Test 2.4: Non-existent category ID -> 404 Not Found
  try {
    const res = await http.put('/categorias/999999', {
      nombre: 'Categoria Inexistente',
      descripcion: 'Debe fallar con 404',
    });
    Assertions.assertApiError(res, 404, 'no encontrada');
    reporter.pass('F1 Corner: PUT categoria con ID inexistente retorna 404 Not Found');
  } catch (err) {
    reporter.fail('F1 Corner: PUT categoria con ID inexistente', err);
  }

  // Test 2.5: Duplicate category name across different IDs -> 409 Conflict
  try {
    const res = await http.put(`/categorias/${baseCatIdB}`, {
      nombre: `Tier2 Alpha ${timestamp}`, // Name of Cat A
      descripcion: 'Intento de duplicar nombre de otra categoria',
    });
    Assertions.assertApiError(res, 409, 'Ya existe una categoria');
    reporter.pass('F1 Corner: PUT categoria con nombre duplicado de otra categoria retorna 409 Conflict');
  } catch (err) {
    reporter.fail('F1 Corner: PUT categoria con nombre duplicado', err);
  }

  // Test 2.6: Updating category with its own current name -> 200 OK (no conflict)
  try {
    const res = await http.put(`/categorias/${baseCatIdA}`, {
      nombre: `Tier2 Alpha ${timestamp}`, // Same name
      descripcion: 'Descripcion modificada pero manteniendo el mismo nombre',
    });
    Assertions.assertStatus(res, 200, 'Actualizar sin cambiar nombre no debe causar conflicto');
    assert.equal(res.body.nombre, `Tier2 Alpha ${timestamp}`);
    reporter.pass('F1 Corner: PUT categoria conservando su propio nombre responde 200 OK');
  } catch (err) {
    reporter.fail('F1 Corner: PUT categoria conservando su propio nombre', err);
  }

  // =========================================================================
  // F2: DELETE /api/v1/categorias/{id} Referential Integrity & Corner Cases
  // =========================================================================

  // Test 2.7: Referential integrity violation (has products) -> 409 Conflict with verbatim message
  try {
    const res = await http.delete(`/categorias/${baseCatIdA}`);
    Assertions.assertApiError(
      res,
      409,
      'No se puede eliminar la categoría porque tiene productos asociados'
    );
    reporter.pass('F2 Integrity: DELETE categoria con productos asociados retorna 409 Conflict con mensaje exacto');
  } catch (err) {
    reporter.fail('F2 Integrity: DELETE categoria con productos asociados', err);
  }

  // Test 2.8: Non-existent category ID -> 404 Not Found
  try {
    const res = await http.delete('/categorias/999999');
    Assertions.assertApiError(res, 404, 'no encontrada');
    reporter.pass('F2 Corner: DELETE categoria con ID inexistente retorna 404 Not Found');
  } catch (err) {
    reporter.fail('F2 Corner: DELETE categoria con ID inexistente', err);
  }

  // =========================================================================
  // F3: PUT /api/v1/productos/{id} Boundary & Validation Cases
  // =========================================================================

  // Test 2.9: Price = 0.00 -> 400 Bad Request
  try {
    const res = await http.put(`/productos/${testProdId}`, {
      categoriaId: baseCatIdA,
      nombre: 'Producto Precio Cero',
      precio: 0.0,
      stock: 10,
    });
    Assertions.assertApiError(res, 400, null, 'precio');
    reporter.pass('F3 Boundary: PUT producto con precio 0.00 rechaza con 400 Bad Request');
  } catch (err) {
    reporter.fail('F3 Boundary: PUT producto con precio 0.00', err);
  }

  // Test 2.10: Price negative (-10.50) -> 400 Bad Request
  try {
    const res = await http.put(`/productos/${testProdId}`, {
      categoriaId: baseCatIdA,
      nombre: 'Producto Precio Negativo',
      precio: -10.5,
      stock: 10,
    });
    Assertions.assertApiError(res, 400, null, 'precio');
    reporter.pass('F3 Boundary: PUT producto con precio negativo rechaza con 400 Bad Request');
  } catch (err) {
    reporter.fail('F3 Boundary: PUT producto con precio negativo', err);
  }

  // Test 2.11: Price boundary = 0.01 -> 200 OK
  try {
    const res = await http.put(`/productos/${testProdId}`, {
      categoriaId: baseCatIdA,
      nombre: 'Producto Precio Minimo',
      precio: 0.01,
      stock: 10,
    });
    Assertions.assertStatus(res, 200, 'Precio minimo 0.01 debe ser aceptado');
    assert.equal(Number(res.body.precio), 0.01);
    reporter.pass('F3 Boundary: PUT producto con precio minimo 0.01 responde 200 OK');
  } catch (err) {
    reporter.fail('F3 Boundary: PUT producto con precio minimo 0.01', err);
  }

  // Test 2.12: Stock < 0 (-1) -> 400 Bad Request
  try {
    const res = await http.put(`/productos/${testProdId}`, {
      categoriaId: baseCatIdA,
      nombre: 'Producto Stock Negativo',
      precio: 20000.0,
      stock: -1,
    });
    Assertions.assertApiError(res, 400, null, 'stock');
    reporter.pass('F3 Boundary: PUT producto con stock negativo (-1) rechaza con 400 Bad Request');
  } catch (err) {
    reporter.fail('F3 Boundary: PUT producto con stock negativo', err);
  }

  // Test 2.13: Stock boundary = 0 -> 200 OK
  try {
    const res = await http.put(`/productos/${testProdId}`, {
      categoriaId: baseCatIdA,
      nombre: 'Producto Sin Stock',
      precio: 20000.0,
      stock: 0,
    });
    Assertions.assertStatus(res, 200, 'Stock 0 debe ser aceptado');
    assert.equal(res.body.stock, 0);
    reporter.pass('F3 Boundary: PUT producto con stock 0 responde 200 OK');
  } catch (err) {
    reporter.fail('F3 Boundary: PUT producto con stock 0', err);
  }

  // Test 2.14: Product ID not found -> 404 Not Found
  try {
    const res = await http.put('/productos/999999', {
      categoriaId: baseCatIdA,
      nombre: 'Producto ID Fantasma',
      precio: 20000.0,
      stock: 5,
    });
    Assertions.assertApiError(res, 404, 'no encontrado');
    reporter.pass('F3 Corner: PUT producto con ID inexistente retorna 404 Not Found');
  } catch (err) {
    reporter.fail('F3 Corner: PUT producto con ID inexistente', err);
  }

  // Test 2.15: Category FK not found -> 404 Not Found
  try {
    const res = await http.put(`/productos/${testProdId}`, {
      categoriaId: 999999, // Non-existent category
      nombre: 'Producto Categoria Inexistente',
      precio: 20000.0,
      stock: 5,
    });
    Assertions.assertApiError(res, 404, 'Categoria');
    reporter.pass('F3 Integrity: PUT producto con categoriaId inexistente retorna 404 Not Found');
  } catch (err) {
    reporter.fail('F3 Integrity: PUT producto con categoriaId inexistente', err);
  }

  // =========================================================================
  // F4: DELETE /api/v1/productos/{id} Corner Cases
  // =========================================================================

  // Test 2.16: Non-existent product ID -> 404 Not Found
  try {
    const res = await http.delete('/productos/999999');
    Assertions.assertApiError(res, 404, 'no encontrado');
    reporter.pass('F4 Corner: DELETE producto con ID inexistente retorna 404 Not Found');
  } catch (err) {
    reporter.fail('F4 Corner: DELETE producto con ID inexistente', err);
  }

  // Teardown: Clean up entities
  try {
    await http.delete(`/productos/${testProdId}`);
    await http.delete(`/categorias/${baseCatIdA}`);
    await http.delete(`/categorias/${baseCatIdB}`);
  } catch {
    // Best-effort teardown
  }
}

export default runTier2Backend;
