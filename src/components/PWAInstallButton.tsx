import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Smartphone, X, CheckCircle2, Info } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Language, translations } from '../core/i18n';

interface PWAInstallButtonProps {
  lang?: Language;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ lang = 'ar' }) => {
  const { install, installStatus } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const t = translations[lang];

  if (installStatus === 'installed') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl shadow-2xs shrink-0 select-none">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>{t.pwaInstalledBadge}</span>
      </div>
    );
  }

  const handleClick = async () => {
    if (installStatus === 'ready') {
      const accepted = await install();
      if (!accepted) {
        setShowGuide(true);
      }
    } else {
      setShowGuide(true);
    }
  };

  const statusNote =
    installStatus === 'ios'
      ? t.pwaStatusIos
      : installStatus === 'unsupported'
      ? t.pwaStatusUnsupported
      : t.pwaStatusManual;

  const modal = (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 select-none"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="bg-white rounded-3xl border border-[#e2e8f0] shadow-2xl max-w-sm w-full overflow-hidden p-5 flex flex-col gap-4 animate-in zoom-in-95 duration-200 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2563eb] flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0f172a]">{t.pwaGuideTitle}</h3>
              <p className="text-[10px] text-[#64748b]">{t.pwaGuideSubtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowGuide(false)}
            className="p-1.5 rounded-xl hover:bg-[#f1f5f9] text-[#94a3b8] hover:text-[#0f172a] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto space-y-3 text-xs text-slate-700 leading-relaxed">
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2 text-[11px]">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>{statusNote}</span>
          </div>

          {installStatus === 'ios' ? (
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-blue-900 space-y-0.5">
                <p className="font-semibold">{t.pwaSafariStep1}</p>
                <p className="text-[11px] text-blue-700">{t.pwaSafariStep1Desc}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 space-y-0.5">
                <p className="font-semibold">{t.pwaSafariStep2}</p>
                <p className="text-[11px] text-slate-600">{t.pwaSafariStep2Desc}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-blue-900 space-y-0.5">
                <p className="font-semibold">{t.pwaChromeStep1}</p>
                <p className="text-[11px] text-blue-700">{t.pwaChromeStep1Desc}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 space-y-0.5">
                <p className="font-semibold">{t.pwaChromeStep2}</p>
                <p className="text-[11px] text-slate-600">{t.pwaChromeStep2Desc}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-[#f1f5f9] flex items-center justify-end">
          <button
            type="button"
            onClick={() => setShowGuide(false)}
            className="w-full py-2 rounded-xl bg-[#2563eb] text-white text-xs font-bold hover:bg-[#1d4ed8] shadow-sm transition-all cursor-pointer"
          >
            {t.pwaCloseGuide}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-bold text-white bg-[#2563eb] hover:bg-[#1d4ed8] rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
        title={installStatus === 'ready' ? t.pwaInstallDirectTitle : t.pwaInstallGuideTitle}
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">
          {installStatus === 'ready' ? t.pwaInstallDirectBtn : t.pwaInstallGuideBtn}
        </span>
      </button>

      {showGuide && createPortal(modal, document.body)}
    </>
  );
};
