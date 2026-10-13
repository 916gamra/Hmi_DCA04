import { useState, useEffect, useCallback } from 'react';

const NOTIF_PREF_KEY = 'hmi-tray-local-notifications-enabled';

/**
 * Local-only System Notification API hook (100% client-side, offline-first, no external server).
 * Uses `Notification.requestPermission()` and `new Notification(title, options)`.
 */
export function useNotifications() {
  const isSupported = typeof window !== 'undefined' && 'Notification' in window;

  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (!isSupported) return 'denied';
    return Notification.permission;
  });

  const [enabled, setEnabled] = useState<boolean>(() => {
    if (!isSupported) return false;
    try {
      return (
        Notification.permission === 'granted' &&
        localStorage.getItem(NOTIF_PREF_KEY) !== 'false'
      );
    } catch {
      return Notification.permission === 'granted';
    }
  });

  useEffect(() => {
    if (!isSupported) return;
    setPermission(Notification.permission);
  }, [isSupported]);

  const showLocalNotification = useCallback(
    (title: string, body: string, tag = 'trivium-local-alert') => {
      if (!isSupported || Notification.permission !== 'granted') return false;

      const options: NotificationOptions & { vibrate?: number[] } = {
        body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        vibrate: [200, 100, 200],
        tag,
      };

      try {
        // Direct client-side Local Notification via Notification API
        const notif = new Notification(title, options);
        notif.onclick = () => {
          window.focus();
          notif.close();
        };
        return true;
      } catch {
        // Fallback for mobile browsers that require active ServiceWorkerRegistration for local notifications
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready
            .then((reg) => reg.showNotification(title, options))
            .catch(() => {});
          return true;
        }
        return false;
      }
    },
    [isSupported]
  );

  const requestNotificationPermission = useCallback(
    async (lang: 'ar' | 'fr'): Promise<'enabled' | 'disabled' | 'denied' | 'unsupported'> => {
      if (!isSupported) return 'unsupported';

      if (Notification.permission === 'granted') {
        const nextState = !enabled;
        setEnabled(nextState);
        try {
          localStorage.setItem(NOTIF_PREF_KEY, String(nextState));
        } catch {
          // ignore storage errors
        }
        if (nextState) {
          showLocalNotification(
            'TRIVIUM120° — تريفيوم',
            lang === 'ar'
              ? 'تم تفعيل الإشعارات المحلية بنجاح بدون سيرفر!'
              : 'Notifications locales activées avec succès (sans serveur) !',
            'trivium-permission'
          );
          return 'enabled';
        }
        return 'disabled';
      }

      try {
        const result = await Notification.requestPermission();
        setPermission(result);
        if (result === 'granted') {
          setEnabled(true);
          try {
            localStorage.setItem(NOTIF_PREF_KEY, 'true');
          } catch {
            // ignore storage errors
          }
          showLocalNotification(
            'TRIVIUM120° — تريفيوم',
            lang === 'ar'
              ? 'تم تفعيل الإشعارات المحلية بنجاح بدون سيرفر!'
              : 'Notifications locales activées avec succès (sans serveur) !',
            'trivium-permission'
          );
          return 'enabled';
        }
        setEnabled(false);
        return 'denied';
      } catch {
        return 'denied';
      }
    },
    [isSupported, enabled, showLocalNotification]
  );

  return {
    isSupported,
    permission,
    enabled,
    toggleNotifications: requestNotificationPermission,
    sendNotification: showLocalNotification,
  };
}
