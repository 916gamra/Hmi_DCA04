import React from 'react';
import {
  QrCode,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Languages,
  Info,
  Bell,
  BellOff,
} from 'lucide-react';
import { TrayModel } from '../types';
import { Language, Translations } from '../core/i18n';
import { TrayIndustrialIcon } from './TrayIndustrialIcon';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  model: TrayModel;
  lang: Language;
  t: Translations;
  onToggleLang: () => void;
  onOpenQrScanner: () => void;
  onResetDefault: () => void;
  onOpenTechModal: () => void;
  notificationsEnabled?: boolean;
  onToggleNotifications?: () => void;
  activeTab?: 'auto' | 'manual' | 'semiauto' | 'article';
}

export const Header: React.FC<HeaderProps> = ({
  model,
  lang,
  t,
  onToggleLang,
  onOpenQrScanner,
  onResetDefault,
  onOpenTechModal,
  notificationsEnabled = false,
  onToggleNotifications,
  activeTab = 'auto',
}) => {
  return (
    <header
      dir="ltr"
      className="flex-none sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#e2e8f0]/90 px-3 sm:px-4 md:px-6 pt-[max(8px,env(safe-area-inset-top))] pb-2.5 sm:pb-3 transition-all shadow-xs select-none"
    >
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-2 sm:gap-3">
        {/* Zone 1: Brand & Identity (Always Left in French/LTR layout) */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white flex items-center justify-center p-0.5 shadow-sm shadow-[#2563eb]/10 shrink-0 border border-[#e2e8f0] overflow-hidden">
            <TrayIndustrialIcon className="w-full h-full" size={40} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-[#0f172a] truncate">
                {t.appTitle}
              </h1>
              <span className="hidden xs:inline-block text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#f1f5f9] text-[#475569] border border-[#e2e8f0] shrink-0">
                {t.badgeOneUi}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-[#64748b] block truncate">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Zone 2: Status Indicator (Center) - Only for Auto mode */}
        {activeTab === 'auto' && (
          <div className="hidden lg:flex items-center">
            {model.hasErr ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
                <XCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{t.statusErr}</span>
              </div>
            ) : model.hasWarn ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{t.statusWarn}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{t.statusSafe}</span>
              </div>
            )}
          </div>
        )}

        {/* Zone 3: Actions & Language Selector (Always Right in French/LTR layout) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* PWA Install Button (automatically shows when installable or on iOS) */}
          <PWAInstallButton lang={lang} />

          {/* PWA System Notifications Button */}
          {onToggleNotifications && (
            <button
              type="button"
              onClick={onToggleNotifications}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                notificationsEnabled
                  ? 'text-[#2563eb] bg-blue-50 border border-blue-200'
                  : 'text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9]'
              }`}
              title={
                lang === 'ar'
                  ? notificationsEnabled
                    ? 'إشعارات النظام مفعلة (اضغط للإيقاف)'
                    : 'تفعيل إشعارات النظام (PWA Notifications)'
                  : notificationsEnabled
                  ? 'Notifications activées (cliquer pour désactiver)'
                  : 'Activer les notifications PWA'
              }
              aria-label="Toggle PWA Notifications"
            >
              {notificationsEnabled ? (
                <Bell className="w-4 h-4" />
              ) : (
                <BellOff className="w-4 h-4" />
              )}
            </button>
          )}

          {/* Quick QR Scanner Button (Pure Gray Icon) */}
          <button
            type="button"
            onClick={onOpenQrScanner}
            className="p-2 text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] rounded-xl transition-all cursor-pointer"
            title={t.headerScanQrTitle}
            aria-label="QR Code Scanner"
          >
            <QrCode className="w-4 h-4" />
          </button>

          {/* Language Switcher Button (AR <-> FR) */}
          <button
            type="button"
            onClick={onToggleLang}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-bold text-[#1e293b] bg-[#eef2f8] hover:bg-[#dbeafe] border border-[#cbd5e1] rounded-xl transition-all cursor-pointer active:scale-95 shadow-2xs"
            title={t.headerSwitchLangTitle}
          >
            <Languages className="w-3.5 h-3.5 text-[#2563eb]" />
            <span className="font-mono">{t.switchLangBadge}</span>
          </button>

          {/* Technical Description Info Button (Gray, next to Reset) */}
          <button
            type="button"
            onClick={onOpenTechModal}
            className="p-2 text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] rounded-xl transition-all cursor-pointer shrink-0"
            title={t.headerTechModalTitle}
            aria-label="TRIVIUM Machine Technical Description"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Reset Defaults */}
          <button
            type="button"
            onClick={onResetDefault}
            className="p-2 text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] rounded-xl transition-all cursor-pointer"
            title={t.btnReset}
            aria-label={t.btnReset}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
