const CACHE = "seminarios-front-v4";

self.addEventListener("install", (e) => {
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

// Estratégia: network first, cache como fallback
self.addEventListener("fetch", (e) => {
  // Ignora requisições de outros domínios (Firebase, googleapis, etc)
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Salva no cache apenas respostas válidas
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(e.request)) // offline: usa cache
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.includes("programacao-seminarios") && "focus" in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow("/programacao-seminarios/Front/");
    })
  );
});
