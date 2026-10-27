// Parte 4.3 — Prueba de defensa en profundidad: con la CSP del servidor un innerHTML vulnerable no ejecuta el ataque.
// Uso (con el backend corriendo en el perfil https):
//   node docs/laboratorio/demo-csp.mjs [https://localhost:8443/api/v1/productos]
// Requiere Playwright con Chromium (npm i -D playwright && npx playwright install chromium).
import { chromium } from 'playwright';

const urlServidor = process.argv[2] || 'https://localhost:8443/api/v1/productos';
const ataque = `<img src=x onerror="alert('XSS')">`;

const navegador = await chromium.launch();
const contexto = await navegador.newContext({ ignoreHTTPSErrors: true });

async function probar(titulo, url) {
  const pagina = await contexto.newPage();
  const alertas = [];
  const consola = [];
  pagina.on('dialog', async (d) => { alertas.push(d.message()); await d.dismiss(); });
  // Se omite el error de carga de la imagen "x" (no existe); interesa el bloqueo de la CSP.
  pagina.on('console', (m) => {
    if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) consola.push(m.text());
  });
  const respuesta = await pagina.goto(url);
  const csp = respuesta.headers()['content-security-policy'] || '(sin CSP)';
  // El codigo vulnerable de la guia: tarjeta.innerHTML = '<p>' + texto + '</p>'
  await pagina.evaluate((texto) => {
    const tarjeta = document.createElement('div');
    tarjeta.innerHTML = '<p>' + texto + '</p>';
    document.body.append(tarjeta);
  }, ataque);
  await pagina.waitForTimeout(500);
  console.log(`\n## ${titulo}`);
  console.log(`URL: ${url}`);
  console.log(`Content-Security-Policy: ${csp}`);
  console.log(`Alertas ejecutadas: ${alertas.length ? alertas.join(', ') : 'ninguna'}`);
  console.log(`Consola: ${consola.length ? consola.join('\n         ') : '(vacia)'}`);
  await pagina.close();
}

// 1) Pagina sin CSP: el innerHTML vulnerable ejecuta el onerror
await contexto.route('https://sin-csp.local/', (ruta) =>
  ruta.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Sin CSP</title><body></body>' }));
await probar('innerHTML vulnerable SIN Content-Security-Policy', 'https://sin-csp.local/');

// 2) Misma inyeccion en un documento servido por el backend (con sus cabeceras reales)
await probar('innerHTML vulnerable CON la Content-Security-Policy del servidor', urlServidor);

// 3) La correccion: textContent nunca interpreta HTML
const pagina = await contexto.newPage();
await contexto.route('https://correccion.local/', (ruta) =>
  ruta.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><body></body>' }));
await pagina.goto('https://correccion.local/');
const html = await pagina.evaluate((texto) => {
  const p = document.createElement('p');
  p.textContent = texto;
  document.body.append(p);
  return document.body.innerHTML;
}, ataque);
console.log('\n## Correccion con textContent (sin CSP)');
console.log(`HTML resultante: ${html}`);
console.log(`Imagenes creadas: ${await pagina.locator('img').count()}`);

await navegador.close();
