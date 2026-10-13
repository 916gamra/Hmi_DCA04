import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { Language } from '../core/i18n';

interface OfflineIndicatorProps {
  lang?: Language;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ lang = 'ar' }) => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      dir="ltr"
      className="fixed bottom-20 md:bottom-6 left-4 z-50 flex items-center gap-2 rounded-2xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg animate-bounce"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>
        {lang === 'ar'
          ? 'وضع عدم الاتصال — التطبيق يعمل محلياً 100% بكفاءة'
          : 'Mode Hors-ligne — Fonctionnement local à 100%'}
      </span>
    </div>
  );
};
