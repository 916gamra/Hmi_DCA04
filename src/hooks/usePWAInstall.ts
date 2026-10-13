import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export type PWAInstallStatus = 'ready' | 'ios' | 'unsupported' | 'unavailable' | 'installed';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isSupportedBrowser, setIsSupportedBrowser] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      setIsSupportedBrowser(false);
      return;
    }

    // Detect standalone mode (already installed)
    const isStandalone =
      (typeof window.matchMedia === 'function' &&
        window.matchMedia('(display-mode: standalone)').matches) ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Service Worker support & non-Firefox/Desktop Safari check for native prompt capability
    const hasSwSupport = 'serviceWorker' in navigator;
    const isFirefox = /firefox/.test(userAgent) && !/android/.test(userAgent);
    const isDesktopSafari =
      /safari/.test(userAgent) && !/chrome|chromium|crios|edg|opr/.test(userAgent) && !isIOSDevice;
    setIsSupportedBrowser(hasSwSupport && !isFirefox && !isDesktopSafari);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  const installStatus: PWAInstallStatus = isInstalled
    ? 'installed'
    : isIOS
    ? 'ios'
    : deferredPrompt
    ? 'ready'
    : !isSupportedBrowser
    ? 'unsupported'
    : 'unavailable';

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    install,
    installStatus,
  };
}
