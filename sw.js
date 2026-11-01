/* ============================================================
   GenSoal — Service Worker
   Strategi offline-first agar guru di daerah 3T tetap bisa
   memakai aplikasi tanpa koneksi setelah sekali dibuka.
   ============================================================ */

const CACHE_NAME = "gensoal-v3";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./utils.js",
  "./store.js",
  "./app.js",
  "./print.js",
  "./templates.json",
  "./manifest.json",
  "./assets/logo.svg"
];

/* Instal: simpan berkas inti ke cache */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

/* Aktif: bersihkan cache versi lama */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

/* Fetch: cache dulu, lalu jaringan. Bila gagal, pakai cache. */
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req)
        .then((res) => {
          /* Simpan respons yang valid ke cache */
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => {
          /* Fallback ke halaman utama saat offline */
          if (req.mode === "navigate") return caches.match("./index.html");
          return new Response("", { status: 504, statusText: "Offline" });
        });
    })
  );
});
