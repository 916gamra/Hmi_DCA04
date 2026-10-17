import React from 'react';
import { SlidersHorizontal, BarChart3, X } from 'lucide-react';
import { Translations } from '../../core/i18n';

interface SemiMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isAr: boolean;
  t: Translations;
  children: React.ReactNode;
}

export const SemiMobileDrawer: React.FC<SemiMobileDrawerProps> = ({
  isOpen,
  onClose,
  isAr,
  t,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-35 bg-black/25 backdrop-blur-[1px] animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div
        className="fixed inset-x-0 bottom-[64px] z-40 max-h-[74dvh] h-[68dvh] sm:h-auto sm:max-h-[76dvh] flex flex-col bg-white rounded-t-3xl shadow-[0_-12px_44px_rgba(15,23,42,0.22)] border-t border-[#cbd5e1] animate-in slide-in-from-bottom duration-300"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Drawer Header matching Auto layout */}
        <div className="flex-none pt-2.5 pb-2.5 px-4 sm:px-5 border-b border-[#f1f5f9] flex flex-col gap-2 bg-gradient-to-b from-slate-50 to-white rounded-t-3xl">
          <div
            className="w-12 h-1.5 bg-slate-300 hover:bg-slate-400 rounded-full mx-auto cursor-pointer transition-colors"
            onClick={onClose}
            title={t.closeDrawer}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2563eb] flex items-center justify-center font-bold shadow-2xs">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#0f172a] block">
                  {isAr ? 'بارامترات شبكة وتصميم Semi-Auto' : 'Paramètres Grille Semi-Auto'}
                </span>
                <span className="text-[10px] text-[#64748b] block">
                  {t.swipeToAdjust}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all cursor-pointer active:scale-95 shadow-2xs"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>{isAr ? 'إغلاق وعرض' : 'Fermer'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label={t.closeDrawer}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Drawer Body with Cards */}
        <div className="flex-1 overflow-y-auto px-3.5 py-3.5 sm:px-5 sm:py-4 pb-28 overscroll-contain">
          {children}
        </div>
      </div>
    </>
  );
};
