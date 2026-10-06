/**
 * Strict Assertion Helpers for E2E Tests
 */

import assert from 'node:assert/strict';

export class Assertions {
  static assertStatus(res, expectedStatus, context = '') {
    if (res.status !== expectedStatus) {
      const errDetails = res.body ? ` Body: ${JSON.stringify(res.body)}` : ` Raw: ${res.rawText}`;
      throw new Error(
        `Expected HTTP status ${expectedStatus} but received ${res.status} (${res.statusText || 'Unknown'}).${context ? ` Context: ${context}.` : ''}${errDetails}`
      );
    }
  }

  static assertApiError(res, expectedStatus, mensajeSubstring = null, fieldName = null) {
    this.assertStatus(res, expectedStatus, 'Checking ApiError response');
    const body = res.body;
    assert.ok(body && typeof body === 'object', `Expected body to be an ApiError JSON object, got: ${res.rawText}`);
    
    assert.equal(body.status, expectedStatus, `ApiError.status must match HTTP status ${expectedStatus}`);
    assert.ok(body.timestamp, 'ApiError must contain timestamp field');
    assert.ok(body.error, 'ApiError must contain error field');
    assert.ok(body.mensaje, 'ApiError must contain mensaje field');
    assert.ok(body.ruta, 'ApiError must contain ruta field');

    if (mensajeSubstring) {
      assert.ok(
        body.mensaje.toLowerCase().includes(mensajeSubstring.toLowerCase()),
        `ApiError.mensaje "${body.mensaje}" was expected to contain "${mensajeSubstring}"`
      );
    }

    if (fieldName) {
      assert.ok(body.campos, 'Expected ApiError.campos map to be populated for validation error');
      assert.ok(
        body.campos[fieldName],
        `Expected validation error on field "${fieldName}". Available fields: ${Object.keys(body.campos).join(', ')}`
      );
    }
  }

  static assertCategory(category, expected = {}) {
    assert.ok(category, 'Expected category object to exist');
    assert.ok(typeof category.id === 'number', `Category id must be a number, got: ${category.id}`);
    assert.ok(typeof category.nombre === 'string', 'Category nombre must be a string');
    
    if (expected.id !== undefined) {
      assert.equal(category.id, expected.id, `Category id mismatch`);
    }
    if (expected.nombre !== undefined) {
      assert.equal(category.nombre, expected.nombre, `Category nombre mismatch`);
    }
    if (expected.descripcion !== undefined) {
      assert.equal(category.descripcion, expected.descripcion, `Category descripcion mismatch`);
    }
  }

  static assertProduct(product, expected = {}) {
    assert.ok(product, 'Expected product object to exist');
    assert.ok(typeof product.id === 'number', `Product id must be a number, got: ${product.id}`);
    assert.ok(typeof product.categoriaId === 'number', 'Product categoriaId must be a number');
    assert.ok(typeof product.nombre === 'string', 'Product nombre must be a string');
    assert.ok(typeof product.precio === 'number' || typeof product.precio === 'string', 'Product precio must be numeric');
    assert.ok(typeof product.stock === 'number', 'Product stock must be an integer');

    if (expected.id !== undefined) {
      assert.equal(product.id, expected.id, `Product id mismatch`);
    }
    if (expected.categoriaId !== undefined) {
      assert.equal(product.categoriaId, expected.categoriaId, `Product categoriaId mismatch`);
    }
    if (expected.nombre !== undefined) {
      assert.equal(product.nombre, expected.nombre, `Product nombre mismatch`);
    }
    if (expected.precio !== undefined) {
      assert.equal(Number(product.precio), Number(expected.precio), `Product precio mismatch`);
    }
    if (expected.stock !== undefined) {
      assert.equal(product.stock, expected.stock, `Product stock mismatch`);
    }
  }
}

export default Assertions;
