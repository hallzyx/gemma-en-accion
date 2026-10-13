/* Service worker de "Gemma en acción".
   Guarda la página y las librerías para que la app abra y funcione en modo avión.
   El modelo NO se guarda aquí: Transformers.js lo deja en Cache Storage
   ("transformers-cache") y lo lee de ahí antes de pedir nada a la red.

   Si cambias index.html, sube el número de CACHE para que los visitantes reciban la versión nueva. */
const CACHE = "gemma-en-accion-v1";

// Archivos propios que la app necesita para abrir sin red.
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg", "./icon-192.png", "./icon-512.png"];

// Las mismas URLs (con versión fija) que usa index.html.
const LIBS = [
  "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.0/dist/transformers.min.js",
  "https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js",
  "https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js",
];

// Hosts cuyo contenido es inmutable (versiones fijas) y se sirve primero desde la caché.
const CACHED_HOSTS = ["cdn.jsdelivr.net", "fonts.googleapis.com", "fonts.gstatic.com"];

// Hugging Face: los archivos grandes del modelo pasan directo (no se interceptan para no
// ponerle un intermediario a una descarga de varios GB). Los archivos chicos y opcionales
// que no existen en el repo (404) nunca se cachean, y sin red `fetch` lanzaría un error en
// vez de un 404; aquí lo convertimos en 404 para que la carga desde caché no se rompa.
const MODEL_HOSTS = ["huggingface.co", "hf.co"];
const HEAVY = /\.(onnx|onnx_data|data|bin|safetensors)$/i;

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(SHELL);
    // Si una librería no baja ahora, se guardará la primera vez que la página la pida.
    await Promise.allSettled(LIBS.map((url) => cache.add(url)));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n.startsWith("gemma-en-accion-") && n !== CACHE).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

// La página avisa qué recursos externos ya cargó (fuentes, wasm de ONNX Runtime…) para guardarlos
// aunque se hayan pedido antes de que el service worker tomara el control.
self.addEventListener("message", (event) => {
  if (event.data?.type !== "warm") return;
  const urls = (event.data.urls ?? []).filter((u) => {
    try { return CACHED_HOSTS.includes(new URL(u).host); } catch { return false; }
  });
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.allSettled(urls.map(async (u) => {
      if (await cache.match(u)) return;
      const res = await fetch(u, { mode: "cors", credentials: "omit" });
      if (res.status === 200) await cache.put(u, res);
    }));
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    if (req.method === "GET") event.respondWith(networkFirst(event, req));
    return;
  }
  if (CACHED_HOSTS.includes(url.host)) {
    if (req.method === "GET") event.respondWith(cacheFirst(req));
    return;
  }
  if (MODEL_HOSTS.includes(url.host) && !HEAVY.test(url.pathname)) {
    event.respondWith(fetch(req).catch(() => new Response(null, { status: 404, statusText: "Sin conexión" })));
  }
});

// Archivos propios: con red se actualizan, sin red se sirve la copia guardada.
async function networkFirst(event, req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await Promise.race([
      fetch(req),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 4000)),
    ]);
    if (res.status === 200) event.waitUntil(cache.put(req, res.clone()).catch(() => {}));
    return res;
  } catch {
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    if (req.mode === "navigate") {
      const page = await cache.match("./index.html");
      if (page) return page;
    }
    return Response.error();
  }
}

// Librerías y fuentes con versión fija: primero la caché.
async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req.url);
  if (hit) return hit;
  // Se pide siempre en modo CORS para poder guardar la respuesta (una "opaque" no sirve para módulos).
  const res = await fetch(req.url, { mode: "cors", credentials: "omit" });
  if (res.status === 200) await cache.put(req.url, res.clone()).catch(() => {});
  return res;
}
