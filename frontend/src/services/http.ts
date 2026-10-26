import type { ApiError } from '../types/api';

/**
 * Por defecto la API se consume en el mismo origen (/api/v1): en desarrollo Vite hace de proxy
 * hacia el backend y en produccion lo hace nginx. Asi la cookie de sesion y la cookie CSRF
 * funcionan sin exponer la API a otros dominios.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const CSRF_COOKIE = 'XSRF-TOKEN';
const CSRF_HEADER = 'X-XSRF-TOKEN';

export const MENSAJE_SIN_CONEXION =
  'No se pudo conectar con el servidor backend. Verifica que el servicio esté en ejecución.';

export class ApiException extends Error {
  status?: number;
  apiError?: ApiError;

  constructor(message: string, status?: number, apiError?: ApiError) {
    super(message);
    this.name = 'ApiException';
    this.status = status;
    this.apiError = apiError;
  }
}

type Metodo = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface Opciones {
  method?: Metodo;
  body?: unknown;
}

function leerCookie(nombre: string): string | null {
  const par = document.cookie
    .split('; ')
    .find((c) => c.startsWith(`${nombre}=`));
  return par ? decodeURIComponent(par.slice(nombre.length + 1)) : null;
}

/** Protección CSRF: el backend deja la cookie XSRF-TOKEN y la devolvemos en una cabecera. */
async function obtenerTokenCsrf(renovar = false): Promise<string | null> {
  if (renovar) {
    document.cookie = `${CSRF_COOKIE}=; Max-Age=0; path=/`;
  }
  let token = leerCookie(CSRF_COOKIE);
  if (!token) {
    await fetch(`${API_BASE_URL}/auth/csrf`, { credentials: 'include' });
    token = leerCookie(CSRF_COOKIE);
  }
  return token;
}

async function leerError(response: Response): Promise<ApiError | undefined> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

export async function request<T>(path: string, opciones: Opciones = {}, reintentar = true): Promise<T> {
  const method = opciones.method ?? 'GET';
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (opciones.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  let response: Response;
  try {
    if (method !== 'GET') {
      const token = await obtenerTokenCsrf();
      if (token) {
        headers[CSRF_HEADER] = token;
      }
    }
    const init: RequestInit = { method, headers, credentials: 'include' };
    if (opciones.body !== undefined) {
      init.body = JSON.stringify(opciones.body);
    }
    response = await fetch(`${API_BASE_URL}${path}`, init);
  } catch {
    throw new ApiException(MENSAJE_SIN_CONEXION);
  }

  if (!response.ok) {
    const apiError = await leerError(response);
    // Token CSRF vencido (p. ej. la sesión expiró): se pide uno nuevo y se reintenta una vez.
    if (response.status === 403 && reintentar && apiError?.mensaje?.includes('CSRF')) {
      await obtenerTokenCsrf(true);
      return request<T>(path, opciones, false);
    }
    const message =
      apiError?.mensaje ||
      `Error ${response.status}: ${response.statusText || 'Error en la petición'}`;
    throw new ApiException(message, response.status, apiError);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json();
}
