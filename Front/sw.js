const CACHE = "seminarios-front-v1";
const URLS  = [
  "./",
  "./index.html",
  "./domingos-martins.html",
  "./terra-vermelha.html",
  "./styles.css",
  "./app.js",
  "./assets/logo.png",
  "./assets/convite-tv.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(URLS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.includes("programacao-seminarios/front") && "focus" in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow("/programacao-seminarios/front/");
    })
  );
});
