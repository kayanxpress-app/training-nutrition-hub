// Service Worker لاستقبال إشعارات الموبايل فقط. مفيش كاش ولا اعتراض للطلبات، فمبيأثرش على أي لوجيك في التطبيق.
self.addEventListener("install", e => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("push", e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { body: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.title || "Training Nutrition Hub", {
    body: d.body || "",
    icon: "img/icon-192.png",
    badge: "img/icon-192.png",
    tag: d.tag || undefined,
    renotify: !!d.tag,
    dir: "rtl",
    lang: "ar",
    data: { url: d.url || "./" }
  }));
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "./", self.registration.scope).href;
  e.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of list) {
      try {
        await c.focus();
        if ("navigate" in c) await c.navigate(url);
        return;
      } catch (x) {}
    }
    await self.clients.openWindow(url);
  })());
});
