import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Smartphone, X, CheckCircle2, Info } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Language } from '../core/i18n';

interface PWAInstallButtonProps {
  lang?: Language;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ lang = 'ar' }) => {
  const { install, installStatus } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (installStatus === 'installed') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl shadow-2xs shrink-0 select-none">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>{lang === 'ar' ? 'التطبيق مثبت' : 'Installé'}</span>
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
      ? lang === 'ar'
        ? 'أجهزة iPhone / iPad تتطلب التثبيت اليدوي من قائمة مشاركة Safari:'
        : 'Sur iPhone / iPad, l’installation se fait manuellement via le menu Partager de Safari :'
      : installStatus === 'unsupported'
      ? lang === 'ar'
        ? 'هذا المتصفح لا يدعم التثبيت التلقائي المباشر. يمكنك تثبيت التطبيق يدوياً من قائمة المتصفح:'
        : 'Ce navigateur ne prend pas en charge l’installation directe. Installez manuellement via le menu :'
      : lang === 'ar'
      ? 'نافذة التثبيت التلقائي غير متاحة حالياً (أو داخل معاينة). اتبع الخطوات اليدوية التالية:'
      : 'L’invite automatique n’est pas disponible actuellement. Suivez ces étapes manuelles :';

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
              <h3 className="text-sm font-bold text-[#0f172a]">
                {lang === 'ar' ? 'دليل تثبيت TRIVIUM120° يدوياً' : 'Guide d’installation manuelle PWA'}
              </h3>
              <p className="text-[10px] text-[#64748b]">
                {lang === 'ar' ? 'إضافة التطبيق إلى الشاشة الرئيسية' : 'Ajouter à l’écran d’accueil'}
              </p>
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
                <p className="font-semibold">
                  {lang === 'ar' ? '1. اضغط زر المشاركة (Share ⎋)' : '1. Appuyez sur Partager (⎋)'}
                </p>
                <p className="text-[11px] text-blue-700">
                  {lang === 'ar' ? 'في شريط متصفح Safari أسفل الشاشة.' : 'Dans la barre du navigateur Safari.'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 space-y-0.5">
                <p className="font-semibold">
                  {lang === 'ar' ? '2. اختر "إضافة إلى الشاشة الرئيسية"' : '2. "Sur l\'écran d\'accueil" (⊞)'}
                </p>
                <p className="text-[11px] text-slate-600">
                  {lang === 'ar' ? 'مرر للأسفل في القائمة ثم اضغط إضافة (Add).' : 'Faites défiler vers le bas puis appuyez sur Ajouter.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-blue-900 space-y-0.5">
                <p className="font-semibold">
                  {lang === 'ar' ? '1. افتح قائمة المتصفح (النقاط الثلاث ⁝)' : '1. Ouvrez le menu du navigateur (⁝)'}
                </p>
                <p className="text-[11px] text-blue-700">
                  {lang === 'ar' ? 'في أعلى شريط عنوان المتصفح (Chrome / Edge).' : 'En haut à droite de Chrome ou Edge.'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 space-y-0.5">
                <p className="font-semibold">
                  {lang === 'ar' ? '2. اختر "تثبيت التطبيق" أو "إضافة للشاشة الرئيسية"' : '2. "Installer l\'application" ou "Ajouter à l\'écran d\'accueil"'}
                </p>
                <p className="text-[11px] text-slate-600">
                  {lang === 'ar' ? 'سيتم إنشاء أيقونة مستقلة للتطبيق على جهازك.' : 'Une icône dédiée sera créée sur votre appareil.'}
                </p>
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
            {lang === 'ar' ? 'إغلاق الدليل' : 'Fermer le guide'}
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
        title={
          installStatus === 'ready'
            ? lang === 'ar'
              ? 'تثبيت تطبيق TRIVIUM120° مباشرة (PWA)'
              : 'Installer TRIVIUM120° (PWA)'
            : lang === 'ar'
            ? 'طريقة تثبيت التطبيق على الجهاز'
            : 'Guide d’installation PWA'
        }
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">
          {installStatus === 'ready'
            ? lang === 'ar'
              ? 'تثبيت التطبيق'
              : 'Installer'
            : lang === 'ar'
            ? 'تثبيت (دليل)'
            : 'Installer (Guide)'}
        </span>
      </button>

      {showGuide && createPortal(modal, document.body)}
    </>
  );
};
