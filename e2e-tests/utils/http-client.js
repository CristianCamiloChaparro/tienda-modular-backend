/**
 * Zero-dependency HTTP Client for E2E API Verification
 */

import { CONFIG } from '../config.js';

export class HttpClient {
  constructor(baseUrl = CONFIG.API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async request(method, pathOrUrl, body = null, customHeaders = {}) {
    const url = pathOrUrl.startsWith('http')
      ? pathOrUrl
      : `${this.baseUrl}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;

    const headers = {
      'Accept': 'application/json, text/plain, */*',
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
