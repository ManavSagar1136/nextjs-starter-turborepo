self.addEventListener('push', function(event) {
  if (!event.data) return;
  try {
    var payload = event.data.json();
    event.waitUntil(self.registration.showNotification(payload.title || 'Notification', {
      body: payload.body || '',
      icon: payload.icon || undefined,
      badge: payload.icon || undefined,
      data: { url: payload.url, ...(payload.data || {}) },
    }));
  } catch (e) { console.error('[PushSW]', e); }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var url = event.notification.data && event.notification.data.url;
  if (url) {
    event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list) {
      for (var i = 0; i < list.length; i++) { if (list[i].url === url && 'focus' in list[i]) return list[i].focus(); }
      if (clients.openWindow) return clients.openWindow(url);
    }));
  }
});
