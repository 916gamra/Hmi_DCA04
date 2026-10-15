import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Translations, Language, translations } from '../core/i18n';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  t?: Translations;
  lang?: Language;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  t,
  lang = 'ar',
}) => {
  if (!isOpen) return null;
  const trans = t || translations[lang];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 select-none"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="bg-white rounded-3xl border border-[#e2e8f0] shadow-2xl max-w-sm w-full overflow-hidden p-6 flex flex-col gap-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 text-amber-600">
          <AlertTriangle className="w-8 h-8 shrink-0" />
          <h3 className="text-sm font-bold text-[#0f172a]">{title}</h3>
        </div>
        
        <p className="text-xs text-[#64748b] leading-relaxed">{message}</p>

        <div className="flex items-center gap-2 pt-2 border-t border-[#f1f5f9]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#f1f5f9] hover:bg-[#e2e8f0] text-xs font-bold text-[#475569] transition-all cursor-pointer active:scale-95"
          >
            {trans.btnCancel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-md shadow-red-600/20 transition-all cursor-pointer active:scale-95"
          >
            {trans.confirmDeleteBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
