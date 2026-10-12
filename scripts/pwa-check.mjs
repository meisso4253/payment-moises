import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script, runInNewContext } from 'node:vm';

const handlers = {}, cacheWrites = [];
const files = new Map();
const cache = {
  async addAll(paths) { cacheWrites.push(...paths); paths.forEach(path => files.set(path, { offline: path })); },
};
const scope = {
  self: {
    location: { origin: 'https://studytrack.test' },
    addEventListener(type, handler) { handlers[type] = handler; },
    async skipWaiting() {}, clients: { async claim() {} },
  },
  caches: { async open() { return cache; }, async keys() { return ['studytrack-app-shell-v0', 'another-app']; }, async delete() { return true; }, async match(path) { return files.get(path); } },
  URL,
  fetch: async request => { if (request.offline) throw new Error('offline'); return { network: true }; },
};
runInNewContext(readFileSync('public/sw.js', 'utf8'), scope);
let pending;
handlers.install({ waitUntil(promise) { pending = promise; } }); await pending;
assert.ok(cacheWrites.includes('/offline.html'));
assert.ok(cacheWrites.every(path => path === '/offline.html' || path === '/favicon.svg' || path.startsWith('/icons/')));
for (const path of ['/api/me', '/api/planner', '/api/payments', '/api/proof/private', '/api/auth/sign-out']) {
  let intercepted = false;
  handlers.fetch({ request: { url: 'https://studytrack.test' + path, method: 'GET', mode: 'navigate' }, respondWith() { intercepted = true; } });
  assert.equal(intercepted, false, 'Private API requests must stay network-only: ' + path);
}
handlers.fetch({ request: { url: 'https://studytrack.test/study', method: 'GET', mode: 'navigate', offline: true }, respondWith(promise) { pending = promise; } });
assert.equal((await pending).offline, '/offline.html');
handlers.fetch({ request: { url: 'https://studytrack.test/study', method: 'GET', mode: 'navigate' }, respondWith(promise) { pending = promise; } });
assert.equal((await pending).network, true);
assert.ok(!files.has('/study'));
new Script(readFileSync('public/pwa.js', 'utf8'));
const html = JSON.parse(readFileSync('lib/planner-document.ts', 'utf8').match(/export default ([\s\S]*);\s*$/)[1]);
assert.match(html, /rel="manifest" href="\/manifest.webmanifest"/);
assert.match(html, /data-install-app/);
for (const [, script] of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) new Script(script);
for (const [name, size] of [['app-192.png', 192], ['app-512.png', 512], ['app-maskable-512.png', 512], ['apple-touch-icon.png', 180]]) {
  const png = readFileSync('public/icons/' + name);
  assert.equal(png.readUInt32BE(16), size); assert.equal(png.readUInt32BE(20), size);
}
console.log('PASS App metadata, four PNG icons, bundled scripts, offline fallback, and network-only account/payment data.');
