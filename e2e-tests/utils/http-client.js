/**
 * Zero-dependency HTTP Client for E2E API Verification
 *
 * Se comporta como un navegador: guarda las cookies (sesion JSESSIONID y XSRF-TOKEN)
 * y envia la cabecera X-XSRF-TOKEN en POST/PUT/PATCH/DELETE, como exige el backend.
 */

import { CONFIG } from '../config.js';

export class HttpClient {
  constructor(baseUrl = CONFIG.API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.cookies = new Map();
  }

  guardarCookies(response) {
    const lista = typeof response.headers.getSetCookie === 'function' ? response.headers.getSetCookie() : [];
    for (const cookie of lista) {
      const [par] = cookie.split(';');
      const indice = par.indexOf('=');
      const nombre = par.slice(0, indice).trim();
      const valor = par.slice(indice + 1).trim();
      if (valor) {
        this.cookies.set(nombre, valor);
      } else {
        this.cookies.delete(nombre);
      }
    }
  }

  cabeceraCookie() {
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  }

  /** Inicia sesion como administrador (necesario para crear/editar/eliminar). */
  async iniciarSesionAdmin(email = CONFIG.ADMIN_EMAIL, password = CONFIG.ADMIN_PASSWORD) {
    return this.request('POST', '/auth/login', { email, password });
  }

  async request(method, pathOrUrl, body = null, customHeaders = {}) {
    const url = pathOrUrl.startsWith('http')
      ? pathOrUrl
      : `${this.baseUrl}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;

    const modifica = !['GET', 'HEAD', 'OPTIONS'].includes(method);
    if (modifica && !this.cookies.has('XSRF-TOKEN')) {
      try {
        const r = await fetch(`${this.baseUrl}/auth/csrf`, {
          headers: { Cookie: this.cabeceraCookie() },
          signal: AbortSignal.timeout(CONFIG.REQUEST_TIMEOUT_MS),
        });
        this.guardarCookies(r);
      } catch {
        // Servidor sin endpoint CSRF: se continua sin token.
      }
    }

    const headers = {
      'Accept': 'application/json, text/plain, */*',
      ...(this.cookies.size > 0 ? { Cookie: this.cabeceraCookie() } : {}),
      ...(modifica && this.cookies.has('XSRF-TOKEN') ? { 'X-XSRF-TOKEN': this.cookies.get('XSRF-TOKEN') } : {}),
      ...customHeaders,
    };

    const options = {
      method,
      headers,
      signal: AbortSignal.timeout(CONFIG.REQUEST_TIMEOUT_MS),
    };

    if (body !== null && body !== undefined) {
      if (typeof body === 'object') {
        headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
      } else {
        options.body = String(body);
      }
    }

    const t0 = Date.now();
    let response;
    try {
      response = await fetch(url, options);
    } catch (err) {
      return {
        ok: false,
        status: 0,
        headers: {},
        body: null,
        rawText: '',
        durationMs: Date.now() - t0,
        error: err.message,
      };
    }

    const durationMs = Date.now() - t0;
    this.guardarCookies(response);
    const rawText = await response.text();
    let parsedBody = null;
    try {
      parsedBody = rawText ? JSON.parse(rawText) : null;
    } catch {
      parsedBody = rawText;
    }

    const resHeaders = {};
    for (const [key, value] of response.headers.entries()) {
      resHeaders[key.toLowerCase()] = value;
    }

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: resHeaders,
      body: parsedBody,
      rawText,
      durationMs,
    };
  }

  get(path, headers = {}) {
    return this.request('GET', path, null, headers);
  }

  post(path, body, headers = {}) {
    return this.request('POST', path, body, headers);
  }

  put(path, body, headers = {}) {
    return this.request('PUT', path, body, headers);
  }

  delete(path, headers = {}) {
    return this.request('DELETE', path, null, headers);
  }

  async checkHealth() {
    try {
      const res = await fetch(`${this.baseUrl}/categorias`, {
        method: 'GET',
        signal: AbortSignal.timeout(CONFIG.HEALTH_CHECK_TIMEOUT_MS),
      });
      return res.status === 200 || res.status === 404;
    } catch {
      return false;
    }
  }
}

export default HttpClient;
