/**
 * Tier 3: Cross-Feature Combinations — Backend Endpoints
 * 
 * Verifies complex multi-feature workflows across Categories and Products:
 * - Dynamic referential integrity lifecycle:
 *   1. Create Category C1 and C2
 *   2. Create Product P1 linked to C1
 *   3. Deletion of C1 blocked by referential integrity (409 Conflict)
 *   4. Re-assign P1 from C1 to C2 via PUT producto
 *   5. Deletion of C1 now succeeds (204 No Content)
 *   6. Deletion of C2 now blocked due to P1 transfer (409 Conflict)
 *   7. Delete P1 (204 No Content)
 *   8. Deletion of C2 now succeeds (204 No Content)
 * - Multiple products constraint verification:
 *   - Category with multiple products remains protected until ALL products are removed.
 */

import { Assertions } from '../utils/assertions.js';
import assert from 'node:assert/strict';

export async function runTier3Backend(http, reporter) {
  reporter.tier(3, 'Cross-Feature Combinations — Relational Lifecycle & Cascade Rules');

  const timestamp = Date.now();

  // Test 3.1: Product category transfer and dynamic referential lock transfer
  try {
    // 1. Create C1 and C2
    const resC1 = await http.post('/categorias', {
      nombre: `Tier3 Origen ${timestamp}`,
      descripcion: 'Categoria de origen para transferencia',
    });
    Assertions.assertStatus(resC1, 201);
    const catId1 = resC1.body.id;

    const resC2 = await http.post('/categorias', {
      nombre: `Tier3 Destino ${timestamp}`,
      descripcion: 'Categoria de destino para transferencia',
    });
    Assertions.assertStatus(resC2, 201);
    const catId2 = resC2.body.id;

    // 2. Create P1 in C1
    const resP1 = await http.post('/productos', {
      categoriaId: catId1,
      nombre: `Tier3 Item Transferible ${timestamp}`,
      descripcion: 'Producto que cambiara de categoria',
      precio: 85000.0,
      stock: 15,
    });
    Assertions.assertStatus(resP1, 201);
    const prodId = resP1.body.id;

    // 3. Verify C1 cannot be deleted
    const delC1Attempt1 = await http.delete(`/categorias/${catId1}`);
    Assertions.assertApiError(
      delC1Attempt1,
      409,
      'No se puede eliminar la categoría porque tiene productos asociados'
    );

    // 4. Update P1 to belong to C2
    const transferRes = await http.put(`/productos/${prodId}`, {
      categoriaId: catId2,
      nombre: `Tier3 Item Transferible ${timestamp}`,
      descripcion: 'Producto reasignado a C2',
      precio: 85000.0,
      stock: 15,
    });
    Assertions.assertStatus(transferRes, 200);
    assert.equal(transferRes.body.categoriaId, catId2);

    // 5. C1 is now empty and can be deleted
    const delC1Attempt2 = await http.delete(`/categorias/${catId1}`);
    Assertions.assertStatus(delC1Attempt2, 204);

    // 6. C2 is now locked because it contains P1
    const delC2Attempt1 = await http.delete(`/categorias/${catId2}`);
    Assertions.assertApiError(
      delC2Attempt1,
      409,
      'No se puede eliminar la categoría porque tiene productos asociados'
    );

    // 7. Delete P1
    const delP1 = await http.delete(`/productos/${prodId}`);
    Assertions.assertStatus(delP1, 204);

    // 8. C2 is now empty and can be deleted
    const delC2Attempt2 = await http.delete(`/categorias/${catId2}`);
    Assertions.assertStatus(delC2Attempt2, 204);

    reporter.pass('Cross-Feature: Reasignacion de producto (PUT) transfiere bloqueo de integridad referencial entre categorias');
  } catch (err) {
    reporter.fail('Cross-Feature: Reasignacion de producto transfiere bloqueo referencial', err);
  }

  // Test 3.2: Multi-product referential barrier (Category protected until last product is removed)
  try {
    const resC = await http.post('/categorias', {
      nombre: `Tier3 MultiProd ${timestamp}`,
      descripcion: 'Categoria con multiples productos',
    });
    Assertions.assertStatus(resC, 201);
    const multiCatId = resC.body.id;

    // Create 2 products in this category
    const resP1 = await http.post('/productos', {
      categoriaId: multiCatId,
      nombre: `Prod Alpha ${timestamp}`,
      precio: 10000.0,
      stock: 5,
    });
    Assertions.assertStatus(resP1, 201);
    const p1Id = resP1.body.id;

    const resP2 = await http.post('/productos', {
      categoriaId: multiCatId,
      nombre: `Prod Beta ${timestamp}`,
      precio: 20000.0,
      stock: 10,
    });
    Assertions.assertStatus(resP2, 201);
    const p2Id = resP2.body.id;

    // Delete first product only
    const delP1 = await http.delete(`/productos/${p1Id}`);
    Assertions.assertStatus(delP1, 204);

    // Category must STILL be protected because p2 exists
    const delCatAttempt = await http.delete(`/categorias/${multiCatId}`);
    Assertions.assertApiError(
      delCatAttempt,
      409,
      'No se puede eliminar la categoría porque tiene productos asociados'
    );

    // Delete second product
    const delP2 = await http.delete(`/productos/${p2Id}`);
    Assertions.assertStatus(delP2, 204);

    // Category can now be safely deleted
    const delCatSuccess = await http.delete(`/categorias/${multiCatId}`);
    Assertions.assertStatus(delCatSuccess, 204);

    reporter.pass('Cross-Feature: Categoria permanece protegida hasta que el ultimo producto asociado es eliminado');
  } catch (err) {
    reporter.fail('Cross-Feature: Proteccion multi-producto sobre categoria', err);
  }
}

export default runTier3Backend;
