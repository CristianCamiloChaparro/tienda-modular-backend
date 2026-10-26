import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { request, ApiException } from './http';

const respuesta = (status: number, body?: unknown) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    statusText: '',
    json: async () => body,
  }) as Response;

describe('Cliente HTTP (src/services/http.ts)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/';
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/';
  });

  it('envía la cookie XSRF-TOKEN en la cabecera X-XSRF-TOKEN en operaciones que modifican datos', async () => {
    document.cookie = 'XSRF-TOKEN=token-123; path=/';
    globalThis.fetch = vi.fn().mockResolvedValue(respuesta(201, { id: 1 }));

    await request('/categorias', { method: 'POST', body: { nombre: 'Libros' } });

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/v1/categorias', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-XSRF-TOKEN': 'token-123',
      },
      credentials: 'include',
      body: JSON.stringify({ nombre: 'Libros' }),
    });
  });

  it('pide el token CSRF al backend si todavía no existe la cookie', async () => {
    globalThis.fetch = vi
      .fn()
      .mockImplementationOnce(async () => {
        document.cookie = 'XSRF-TOKEN=nuevo; path=/';
        return respuesta(200, {});
      })
      .mockResolvedValueOnce(respuesta(204));

    await request('/auth/logout', { method: 'POST' });

    expect(globalThis.fetch).toHaveBeenNthCalledWith(1, '/api/v1/auth/csrf', { credentials: 'include' });
    expect(vi.mocked(globalThis.fetch).mock.calls[1][1]).toMatchObject({
      headers: { 'X-XSRF-TOKEN': 'nuevo' },
    });
  });

  it('si el token CSRF fue rechazado, pide uno nuevo y reintenta una sola vez', async () => {
    document.cookie = 'XSRF-TOKEN=viejo; path=/';
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(respuesta(403, { status: 403, mensaje: 'Token CSRF ausente o invalido' }))
      .mockImplementationOnce(async () => {
        document.cookie = 'XSRF-TOKEN=renovado; path=/';
        return respuesta(200, {});
      })
      .mockResolvedValueOnce(respuesta(200, { ok: true }));

    const resultado = await request('/carritos', { method: 'POST' });

    expect(resultado).toEqual({ ok: true });
    expect(vi.mocked(globalThis.fetch).mock.calls[2][1]).toMatchObject({
      headers: { 'X-XSRF-TOKEN': 'renovado' },
    });
  });

  it('un 403 por falta de permisos no se reintenta y expone el mensaje del backend', async () => {
    document.cookie = 'XSRF-TOKEN=t; path=/';
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(respuesta(403, { status: 403, mensaje: 'No tienes permisos para realizar esta operacion' }));

    await expect(request('/productos/1', { method: 'DELETE' })).rejects.toThrow(ApiException);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('devuelve undefined en respuestas 204 sin cuerpo', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(respuesta(204));
    await expect(request('/auth/me')).resolves.toBeUndefined();
  });
});
