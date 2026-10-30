// Questlog service worker: keeps the app available offline.
// Firestore handles offline saving itself, so its network traffic is left alone.
const CACHE = "questlog-v25";
const SHELL = [
  "./", "./index.html", "./app.js", "./art.js", "./dungeon.js", "./firebase-config.js", "./manifest.webmanifest",
  "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png",
];
const FIREBASE_SDK = "https://www.gstatic.com/firebasejs/";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // The app's own files: always try the network first, so a new upload shows up straight away.
  // Use the saved copy only when offline.
  if (url.origin === self.location.origin && !url.pathname.includes("/__/")) {
    e.respondWith(
      fetch(req, { cache: "no-cache" })
        .then((res) => {
          if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req.mode === "navigate" ? "./index.html" : req, copy)); }
          return res;
        })
        .catch(async () => (await caches.match(req)) || (req.mode === "navigate" ? caches.match("./index.html") : undefined))
    );
    return;
  }

  // Firebase SDK and fonts never change at a given address: serve the saved copy, refresh in the background.
  if (req.url.startsWith(FIREBASE_SDK) || url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        const net = fetch(req)
          .then((res) => { if (res.ok || res.type === "opaque") cache.put(req, res.clone()); return res; })
          .catch(() => hit);
        return hit || net;
      })
    );
  }
});
