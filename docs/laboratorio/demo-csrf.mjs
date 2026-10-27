// Parte 5.3 — Comprobar CSRF en un navegador real (Chromium) con la sesion del administrador abierta.
// Uso (con el backend corriendo en el perfil https y ADMIN_PASSWORD en el entorno):
//   ADMIN_PASSWORD=... node docs/laboratorio/demo-csrf.mjs
// Requiere Playwright con Chromium (npm i -D playwright && npx playwright install chromium).
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API = 'https://localhost:8443/api/v1';
const paginaAtacante = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'ataque-csrf.html'), 'utf8');

const navegador = await chromium.launch();
const contexto = await navegador.newContext({ ignoreHTTPSErrors: true });
const pagina = await contexto.newPage();

// 1) El administrador inicia sesion en la aplicacion legitima (mismo origen, con la cabecera X-XSRF-TOKEN)
await pagina.goto(`${API}/auth/csrf`);
const llamar = (metodo, ruta, cuerpo) => pagina.evaluate(async ({ metodo, url, cuerpo }) => {
  const token = decodeURIComponent((document.cookie.split('; ').find((c) => c.startsWith('XSRF-TOKEN=')) || '=').split('=')[1]);
  const r = await fetch(url, {
    method: metodo,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': token },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  return { status: r.status, cabecera: token ? 'X-XSRF-TOKEN enviada' : 'sin token', cuerpo: await r.text() };
}, { metodo, url: API + ruta, cuerpo });

const login = await llamar('POST', '/auth/login', { email: 'admin@tienda.com', password: process.env.ADMIN_PASSWORD });
console.log(`## Sesion del administrador abierta: POST /auth/login -> ${login.status}`);
const cookies = await contexto.cookies('https://localhost:8443');
for (const c of cookies) {
  console.log(`   cookie ${c.name}: HttpOnly=${c.httpOnly} Secure=${c.secure} SameSite=${c.sameSite}`);
}

// 2) Peticion legitima desde el frontend (mismo origen): funciona
const legitima = await llamar('POST', '/categorias', { nombre: 'categoria-legitima' });
console.log(`\n## Peticion legitima desde el mismo origen (${legitima.cabecera}): POST /categorias -> ${legitima.status}`);
await llamar('DELETE', `/categorias/${JSON.parse(legitima.cuerpo).id}`);

// 3) Pagina maliciosa en OTRO sitio que envia un formulario a la API
await contexto.route('https://atacante.local/premio.html', (ruta) =>
  ruta.fulfill({ status: 200, contentType: 'text/html', body: paginaAtacante }));
const atacante = await contexto.newPage();
let cookiesEnviadas = '(ninguna)';
atacante.on('request', (req) => {
  if (req.url().endsWith('/api/v1/categorias') && req.method() === 'POST') {
    cookiesEnviadas = req.headers()['cookie'] || '(ninguna)';
  }
});
const [respuesta] = await Promise.all([
  atacante.waitForResponse((r) => r.url().endsWith('/api/v1/categorias') && r.request().method() === 'POST'),
  atacante.goto('https://atacante.local/premio.html'),
]);
console.log('\n## Pagina maliciosa en https://atacante.local/premio.html (formulario POST a la API)');
console.log(`   Cookies que el navegador adjunto: ${cookiesEnviadas}`);
console.log(`   Respuesta del servidor: ${respuesta.status()} ${await respuesta.text()}`);

// 4) Comprobar que no se creo nada
const lista = await pagina.evaluate(async (url) => (await fetch(url)).json(), `${API}/categorias`);
const creada = lista.some((c) => c.nombre === 'categoria-del-atacante');
console.log(`\n## Se creo "categoria-del-atacante"? ${creada ? 'SI (vulnerable)' : 'NO'}`);

await navegador.close();
