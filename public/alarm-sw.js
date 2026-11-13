/* VitaPulse Service Worker Alarm Extension
 * Runs inside the PWA Service Worker via workbox.importScripts(['/alarm-sw.js']).
 * Dispatches real mobile OS notifications with action buttons and background alarm timers.
 */

const VITAPULSE_ALARM_CHANNEL = 'vitapulse-alarm-channel';
const alarmTimers = new Map();
const firedAlarmKeys = new Set();
let scheduledAlarms = [];

function postAlarmActionToClients(action, payload) {
  const message = {
    type: 'ALARM_ACTION',
    action: action,
    payload: payload || {},
    timestamp: Date.now(),
  };

  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel(VITAPULSE_ALARM_CHANNEL);
      bc.postMessage(message);
      bc.close();
    }
  } catch {
    // Ignore BroadcastChannel errors on restricted browsers
  }

  return self.clients
    .matchAll({ type: 'window', includeUncontrolled: true })
    .then((clientList) => {
      for (const client of clientList) {
        try {
          client.postMessage(message);
        } catch {
          // Ignore individual client errors
        }
      }
      return clientList;
    });
}

function buildNotificationOptions(payload) {
  const isWorkout = payload && payload.kind === 'workout';
  const snoozeMinutes = (payload && payload.snoozeMinutes) || 10;
  const confirmTitle = isWorkout ? '✓ Đã tập xong' : '✓ Đã uống thuốc';

  return {
    body: (payload && payload.body) || 'Đến giờ thực hiện lịch chăm sóc sức khỏe VitaPulse.',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: (payload && (payload.tag || payload.id)) || 'vitapulse-alarm',
    renotify: true,
    requireInteraction: true,
    silent: payload && payload.soundEnabled === false,
    vibrate: [500, 200, 500, 200, 800, 300, 500, 200, 500],
    timestamp: Date.now(),
    data: payload || {},
    actions: [
      { action: 'confirm', title: confirmTitle },
      { action: 'snooze', title: 'Nhắc lại ' + snoozeMinutes + ' phút' },
    ],
  };
}

function showPhoneAlarmNotification(payload) {
  if (!self.registration || typeof self.registration.showNotification !== 'function') {
    return Promise.resolve();
  }
  const title =
    (payload && payload.title) || 'VitaPulse — Chuông nhắc sức khỏe';
  const options = buildNotificationOptions(payload);
  return self.registration.showNotification(title, options).catch(() => {});
}

function clearExistingAlarmTimers() {
  for (const timerId of alarmTimers.values()) {
    clearTimeout(timerId);
  }
  alarmTimers.clear();
}

function scheduleAlarmsInWorker(alarms) {
  clearExistingAlarmTimers();
  scheduledAlarms = Array.isArray(alarms) ? alarms : [];
  const now = Date.now();
  const maxDelayMs = 12 * 60 * 60 * 1000;

  for (const alarm of scheduledAlarms) {
    if (!alarm || !alarm.id || typeof alarm.triggerTimestampMs !== 'number') continue;
    if (firedAlarmKeys.has(alarm.signature || alarm.id)) continue;

    const delayMs = alarm.triggerTimestampMs - now;
    if (delayMs < -60 * 1000 || delayMs > maxDelayMs) continue;

    const safeDelay = Math.max(0, delayMs);
    const timerId = setTimeout(() => {
      const key = alarm.signature || alarm.id;
      firedAlarmKeys.add(key);
      showPhoneAlarmNotification(alarm);
    }, safeDelay);

    alarmTimers.set(alarm.id, timerId);

    // Use experimental Notification Triggers API on Android Chromium when supported
    if (
      delayMs > 2000 &&
      typeof self.TimestampTrigger === 'function' &&
      self.registration &&
      typeof self.registration.showNotification === 'function'
    ) {
      try {
        const opts = buildNotificationOptions(alarm);
        opts.showTrigger = new self.TimestampTrigger(alarm.triggerTimestampMs);
        self.registration.showNotification(alarm.title, opts).catch(() => {});
      } catch {
        // Fallback to standard setTimeout above
      }
    }
  }
}

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || typeof data !== 'object') return;

  if (data.type === 'SHOW_ALARM_NOW' && data.payload) {
    event.waitUntil(showPhoneAlarmNotification(data.payload));
    return;
  }

  if (data.type === 'SYNC_ALARMS') {
    scheduleAlarmsInWorker(data.alarms || []);
    return;
  }

  if (data.type === 'CANCEL_ALARM') {
    const tag = data.tag;
    if (tag && alarmTimers.has(tag)) {
      clearTimeout(alarmTimers.get(tag));
      alarmTimers.delete(tag);
    }
    if (self.registration && typeof self.registration.getNotifications === 'function') {
      event.waitUntil(
        self.registration
          .getNotifications(tag ? { tag: tag } : undefined)
          .then((list) => {
            for (const notif of list) {
              notif.close();
            }
          })
          .catch(() => {})
      );
    }
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const payload = event.notification.data || {};
  const action = event.action === 'confirm' || event.action === 'snooze' ? event.action : 'focus';

  event.waitUntil(
    postAlarmActionToClients(action, payload).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (self.clients && typeof self.clients.openWindow === 'function') {
        return self.clients.openWindow('/');
      }
      return undefined;
    })
  );
});

self.addEventListener('notificationclose', (event) => {
  const payload = event.notification.data || {};
  event.waitUntil(postAlarmActionToClients('dismiss', payload));
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag !== 'vitapulse-alarm-check') return;
  const now = Date.now();
  const due = scheduledAlarms.filter((alarm) => {
    const key = alarm.signature || alarm.id;
    return (
      !firedAlarmKeys.has(key) &&
      typeof alarm.triggerTimestampMs === 'number' &&
      alarm.triggerTimestampMs <= now &&
      now - alarm.triggerTimestampMs <= 15 * 60 * 1000
    );
  });

  if (due.length > 0) {
    event.waitUntil(
      Promise.all(
        due.map((alarm) => {
          firedAlarmKeys.add(alarm.signature || alarm.id);
          return showPhoneAlarmNotification(alarm);
        })
      )
    );
  }
});
