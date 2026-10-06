/**
 * Reference Oracle Server (Ephemeral in-memory specification oracle)
 * 
 * Implements 100% of the contracts documented in PROJECT.md and ORIGINAL_REQUEST.md.
 * Used for standalone test suite verification, edge-case simulation, and CI environments.
 */

import http from 'node:http';

export class OracleServer {
  constructor(port = 8089) {
    this.port = port;
    this.server = null;
    this.resetState();
  }

  resetState() {
    this.categories = new Map([
      [1, { id: 1, nombre: 'Ropa', descripcion: 'Prendas de vestir', creadoEn: '2026-10-06T00:00:00' }],
      [2, { id: 2, nombre: 'Accesorios', descripcion: 'Complementos y estilo', creadoEn: '2026-10-06T00:00:00' }],
      [3, { id: 3, nombre: 'Hogar', descripcion: 'Articulos para el hogar', creadoEn: '2026-10-06T00:00:00' }],
    ]);
    this.nextCatId = 4;

    this.products = new Map([
      [1, { id: 1, categoriaId: 1, categoriaNombre: 'Ropa', nombre: 'Camiseta basica blanca', descripcion: 'Camiseta de algodon 100%', precio: 35000.00, stock: 40, imagenUrl: 'https://picsum.photos/seed/camiseta/400/400', activo: true, creadoEn: '2026-10-06T00:00:00' }],
      [2, { id: 2, categoriaId: 1, categoriaNombre: 'Ropa', nombre: 'Buzo con capota gris', descripcion: 'Buzo en algodon perchado', precio: 89900.00, stock: 15, imagenUrl: 'https://picsum.photos/seed/buzo/400/400', activo: true, creadoEn: '2026-10-06T00:00:00' }],
      [3, { id: 3, categoriaId: 2, categoriaNombre: 'Accesorios', nombre: 'Gorra negra bordada', descripcion: 'Gorra ajustable', precio: 45000.00, stock: 20, imagenUrl: 'https://picsum.photos/seed/gorra/400/400', activo: true, creadoEn: '2026-10-06T00:00:00' }],
      [4, { id: 4, categoriaId: 2, categoriaNombre: 'Accesorios', nombre: 'Bolso tote de lona', descripcion: 'Bolso ecologico', precio: 52000.00, stock: 12, imagenUrl: 'https://picsum.photos/seed/bolso/400/400', activo: true, creadoEn: '2026-10-06T00:00:00' }],
      [5, { id: 5, categoriaId: 3, categoriaNombre: 'Hogar', nombre: 'Taza de ceramica 350 ml', descripcion: 'Taza artesanal', precio: 18000.00, stock: 30, imagenUrl: 'https://picsum.photos/seed/taza/400/400', activo: true, creadoEn: '2026-10-06T00:00:00' }],
      [6, { id: 6, categoriaId: 3, categoriaNombre: 'Hogar', nombre: 'Vela aromatica de vainilla', descripcion: 'Cera de soya', precio: 27500.00, stock: 0, imagenUrl: 'https://picsum.photos/seed/vela/400/400', activo: true, creadoEn: '2026-10-06T00:00:00' }],
    ]);
    this.nextProdId = 7;
  }

  sendJson(res, status, data) {
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': 'http://localhost:5173',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    });
    res.end(JSON.stringify(data));
  }

  sendApiError(res, status, error, mensaje, ruta, campos = null) {
    this.sendJson(res, status, {
      timestamp: new Date().toISOString(),
      status,
      error,
      mensaje,
      ruta,
      campos,
    });
  }

  start() {
    return new Promise((resolve, reject) => {
      this.server = http.createServer(async (req, res) => {
        // Handle CORS preflight
        if (req.method === 'OPTIONS') {
          res.writeHead(204, {
            'Access-Control-Allow-Origin': 'http://localhost:5173',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': '*',
          });
          return res.end();
        }

        const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const pathname = url.pathname;
        const method = req.method;

        // Collect body if present
        let body = null;
        if (['POST', 'PUT', 'PATCH'].includes(method)) {
          const buffers = [];
          for await (const chunk of req) {
            buffers.push(chunk);
          }
          const raw = Buffer.concat(buffers).toString('utf-8');
          try {
            body = raw ? JSON.parse(raw) : null;
          } catch {
            return this.sendApiError(res, 400, 'Bad Request', 'Cuerpo JSON invalido', pathname);
          }
        }

        // OpenAPI Docs endpoints (Feature F5)
        if (method === 'GET' && (pathname === '/api/v1/api-docs' || pathname === '/api/v1/docs/swagger-config')) {
          return this.sendJson(res, 200, {
            openapi: '3.0.1',
            info: { title: 'Tienda en Linea Modular API', version: 'v1' },
            paths: {
              '/api/v1/categorias': { get: {}, post: {} },
              '/api/v1/categorias/{id}': { get: {}, put: {}, delete: {} },
              '/api/v1/productos': { get: {}, post: {} },
              '/api/v1/productos/{id}': { get: {}, put: {}, delete: {} },
            },
            components: {
              schemas: {
                ApiError: { type: 'object' },
                CategoriaRequest: { type: 'object' },
                CategoriaResponse: { type: 'object' },
                ProductoRequest: { type: 'object' },
                ProductoResponse: { type: 'object' },
              },
            },
          });
        }

        if (method === 'GET' && pathname === '/api/v1/docs') {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          return res.end('<!DOCTYPE html><html><head><title>Swagger UI</title></head><body>Swagger UI</body></html>');
        }

        // Categorias GET /api/v1/categorias
        if (method === 'GET' && pathname === '/api/v1/categorias') {
          const list = Array.from(this.categories.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
          return this.sendJson(res, 200, list);
        }

        // Categorias GET /api/v1/categorias/{id}
        const catMatch = pathname.match(/^\/api\/v1\/categorias\/(\d+)$/);
        if (method === 'GET' && catMatch) {
          const id = parseInt(catMatch[1], 10);
          const cat = this.categories.get(id);
          if (!cat) {
            return this.sendApiError(res, 404, 'Not Found', `Categoria con id ${id} no encontrada`, pathname);
          }
          return this.sendJson(res, 200, cat);
        }

        // Categorias POST /api/v1/categorias
        if (method === 'POST' && pathname === '/api/v1/categorias') {
          if (!body || !body.nombre || !body.nombre.trim()) {
            return this.sendApiError(res, 400, 'Bad Request', 'Hay datos invalidos en la solicitud', pathname, {
              nombre: 'El nombre es obligatorio',
            });
          }
          const nombre = body.nombre.trim();
          if (nombre.length > 80) {
            return this.sendApiError(res, 400, 'Bad Request', 'Hay datos invalidos en la solicitud', pathname, {
              nombre: 'El nombre no puede superar 80 caracteres',
            });
          }
          for (const c of this.categories.values()) {
            if (c.nombre.toLowerCase() === nombre.toLowerCase()) {
              return this.sendApiError(res, 409, 'Conflict', `Ya existe una categoria con el nombre '${nombre}'`, pathname);
            }
          }
          const id = this.nextCatId++;
          const newCat = {
            id,
            nombre,
            descripcion: body.descripcion ? body.descripcion.trim() : null,
            creadoEn: new Date().toISOString(),
          };
          this.categories.set(id, newCat);
          return this.sendJson(res, 201, newCat);
        }

        // Feature F1: PUT /api/v1/categorias/{id}
        if (method === 'PUT' && catMatch) {
          const id = parseInt(catMatch[1], 10);
          const cat = this.categories.get(id);
          if (!cat) {
            return this.sendApiError(res, 404, 'Not Found', `Categoria con id ${id} no encontrada`, pathname);
          }
          if (!body || !body.nombre || !body.nombre.trim()) {
            return this.sendApiError(res, 400, 'Bad Request', 'Hay datos invalidos en la solicitud', pathname, {
              nombre: 'El nombre es obligatorio',
            });
          }
          const nombre = body.nombre.trim();
          if (nombre.length > 80) {
            return this.sendApiError(res, 400, 'Bad Request', 'Hay datos invalidos en la solicitud', pathname, {
              nombre: 'El nombre no puede superar 80 caracteres',
            });
          }
          for (const c of this.categories.values()) {
            if (c.id !== id && c.nombre.toLowerCase() === nombre.toLowerCase()) {
              return this.sendApiError(res, 409, 'Conflict', `Ya existe una categoria con el nombre '${nombre}'`, pathname);
            }
          }
          cat.nombre = nombre;
          cat.descripcion = body.descripcion ? body.descripcion.trim() : null;
          this.categories.set(id, cat);
          return this.sendJson(res, 200, cat);
        }

        // Feature F2: DELETE /api/v1/categorias/{id}
        if (method === 'DELETE' && catMatch) {
          const id = parseInt(catMatch[1], 10);
          const cat = this.categories.get(id);
          if (!cat) {
            return this.sendApiError(res, 404, 'Not Found', `Categoria con id ${id} no encontrada`, pathname);
          }
          // Check referential integrity: exists product with this categoryId?
          let hasProducts = false;
          for (const p of this.products.values()) {
            if (p.categoriaId === id) {
              hasProducts = true;
              break;
            }
          }
          if (hasProducts) {
            return this.sendApiError(
              res,
              409,
              'Conflict',
              'No se puede eliminar la categoría porque tiene productos asociados',
              pathname
            );
          }
          this.categories.delete(id);
          res.writeHead(204, {
            'Access-Control-Allow-Origin': 'http://localhost:5173',
          });
          return res.end();
        }

        // Productos GET /api/v1/productos
        if (method === 'GET' && pathname === '/api/v1/productos') {
          const categoriaIdParam = url.searchParams.get('categoriaId');
          let list = Array.from(this.products.values());
          if (categoriaIdParam !== null) {
            const catId = parseInt(categoriaIdParam, 10);
            if (!this.categories.has(catId)) {
              return this.sendApiError(res, 404, 'Not Found', `Categoria con id ${catId} no encontrada`, pathname);
            }
            list = list.filter((p) => p.categoriaId === catId);
          }
          list.sort((a, b) => a.nombre.localeCompare(b.nombre));
          return this.sendJson(res, 200, list);
        }

        // Productos GET /api/v1/productos/{id}
        const prodMatch = pathname.match(/^\/api\/v1\/productos\/(\d+)$/);
        if (method === 'GET' && prodMatch) {
          const id = parseInt(prodMatch[1], 10);
          const prod = this.products.get(id);
          if (!prod) {
            return this.sendApiError(res, 404, 'Not Found', `Producto con id ${id} no encontrado`, pathname);
          }
          return this.sendJson(res, 200, prod);
        }

        // Productos POST /api/v1/productos
        if (method === 'POST' && pathname === '/api/v1/productos') {
          const campos = {};
          if (!body?.nombre || !body.nombre.trim()) campos.nombre = 'El nombre es obligatorio';
          if (body?.categoriaId === undefined || body?.categoriaId === null) campos.categoriaId = 'La categoria es obligatoria';
          if (body?.precio === undefined || body?.precio === null || Number(body?.precio) <= 0) campos.precio = 'El precio debe ser mayor que 0';
          if (body?.stock === undefined || body?.stock === null || Number(body?.stock) < 0) campos.stock = 'El stock no puede ser negativo';
          if (body?.imagenUrl && !body.imagenUrl.match(/^$|^https?:\/\/.+/)) campos.imagenUrl = 'La imagen debe ser una URL http(s)';

          if (Object.keys(campos).length > 0) {
            return this.sendApiError(res, 400, 'Bad Request', 'Hay datos invalidos en la solicitud', pathname, campos);
          }

          const cat = this.categories.get(Number(body.categoriaId));
          if (!cat) {
            return this.sendApiError(res, 404, 'Not Found', `Categoria con id ${body.categoriaId} no encontrada`, pathname);
          }

          const id = this.nextProdId++;
          const newProd = {
            id,
            categoriaId: cat.id,
            categoriaNombre: cat.nombre,
            nombre: body.nombre.trim(),
            descripcion: body.descripcion ? body.descripcion.trim() : null,
            precio: Number(body.precio),
            stock: Number(body.stock),
            imagenUrl: body.imagenUrl ? body.imagenUrl.trim() : null,
            activo: true,
            creadoEn: new Date().toISOString(),
          };
          this.products.set(id, newProd);
          return this.sendJson(res, 201, newProd);
        }

        // Feature F3: PUT /api/v1/productos/{id}
        if (method === 'PUT' && prodMatch) {
          const id = parseInt(prodMatch[1], 10);
          const prod = this.products.get(id);
          if (!prod) {
            return this.sendApiError(res, 404, 'Not Found', `Producto con id ${id} no encontrado`, pathname);
          }

          const campos = {};
          if (!body?.nombre || !body.nombre.trim()) campos.nombre = 'El nombre es obligatorio';
          if (body?.categoriaId === undefined || body?.categoriaId === null) campos.categoriaId = 'La categoria es obligatoria';
          if (body?.precio === undefined || body?.precio === null || Number(body?.precio) <= 0) campos.precio = 'El precio debe ser mayor que 0';
          if (body?.stock === undefined || body?.stock === null || Number(body?.stock) < 0) campos.stock = 'El stock no puede ser negativo';
          if (body?.imagenUrl && !body.imagenUrl.match(/^$|^https?:\/\/.+/)) campos.imagenUrl = 'La imagen debe ser una URL http(s)';

          if (Object.keys(campos).length > 0) {
            return this.sendApiError(res, 400, 'Bad Request', 'Hay datos invalidos en la solicitud', pathname, campos);
          }

          const cat = this.categories.get(Number(body.categoriaId));
          if (!cat) {
            return this.sendApiError(res, 404, 'Not Found', `Categoria con id ${body.categoriaId} no encontrada`, pathname);
          }

          prod.categoriaId = cat.id;
          prod.categoriaNombre = cat.nombre;
          prod.nombre = body.nombre.trim();
          prod.descripcion = body.descripcion ? body.descripcion.trim() : null;
          prod.precio = Number(body.precio);
          prod.stock = Number(body.stock);
          prod.imagenUrl = body.imagenUrl ? body.imagenUrl.trim() : null;
          this.products.set(id, prod);
          return this.sendJson(res, 200, prod);
        }

        // Feature F4: DELETE /api/v1/productos/{id}
        if (method === 'DELETE' && prodMatch) {
          const id = parseInt(prodMatch[1], 10);
          const prod = this.products.get(id);
          if (!prod) {
            return this.sendApiError(res, 404, 'Not Found', `Producto con id ${id} no encontrado`, pathname);
          }
          this.products.delete(id);
          res.writeHead(204, {
            'Access-Control-Allow-Origin': 'http://localhost:5173',
          });
          return res.end();
        }

        // Unmatched route
        return this.sendApiError(res, 404, 'Not Found', `Ruta ${pathname} no encontrada`, pathname);
      });

      this.server.listen(this.port, () => {
        resolve(`http://localhost:${this.port}/api/v1`);
      });

      this.server.on('error', (err) => {
        reject(err);
      });
    });
  }

  stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }
}

export default OracleServer;
