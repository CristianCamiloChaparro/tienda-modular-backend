import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getCategorias, getProductos, API_BASE_URL } from './api';

describe('API Service (src/services/api.ts)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('uses same-origin API_BASE_URL /api/v1 by default (proxied to the backend)', () => {
    expect(API_BASE_URL).toBe('/api/v1');
  });

  it('getCategorias calls GET /categorias and returns category list', async () => {
    const mockCategorias = [
      { id: 1, nombre: 'Ropa', descripcion: 'Ropa variada' },
      { id: 2, nombre: 'Hogar', descripcion: 'Artículos de hogar' },
    ];

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockCategorias,
    } as Response);

    const result = await getCategorias();
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/v1/categorias', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'include',
    });
    expect(result).toEqual(mockCategorias);
  });

  it('getProductos without categoryId calls GET /productos', async () => {
    const mockProductos = [
      {
        id: 1,
        categoriaId: 1,
        categoriaNombre: 'Ropa',
        nombre: 'Camiseta',
        descripcion: 'Camiseta de algodón',
        precio: 35000,
        stock: 20,
        imagenUrl: null,
        activo: true,
      },
    ];

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockProductos,
    } as Response);

    const result = await getProductos();
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/v1/productos', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'include',
    });
    expect(result).toEqual(mockProductos);
  });

  it('getProductos with categoryId calls GET /productos?categoriaId={id}', async () => {
    const mockProductos = [
      {
        id: 2,
        categoriaId: 5,
        categoriaNombre: 'Calzado',
        nombre: 'Tenis deportivos',
        descripcion: 'Tenis para correr',
        precio: 120000,
        stock: 8,
        imagenUrl: 'https://example.com/shoes.jpg',
        activo: true,
      },
    ];

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockProductos,
    } as Response);

    const result = await getProductos(5);
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/v1/productos?categoriaId=5', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'include',
    });
    expect(result).toEqual(mockProductos);
  });

  it('handles server error response by extracting ApiError message', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({
        timestamp: '2026-10-06T00:00:00',
        status: 404,
        error: 'Not Found',
        mensaje: 'Categoria con id 99 no encontrada',
        ruta: '/api/v1/productos',
      }),
    } as Response);

    await expect(getProductos(99)).rejects.toThrow('Categoria con id 99 no encontrada');
  });

  it('handles network failure with descriptive backend offline message', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(getCategorias()).rejects.toThrow(
      /No se pudo conectar con el servidor backend/
    );
  });
});
