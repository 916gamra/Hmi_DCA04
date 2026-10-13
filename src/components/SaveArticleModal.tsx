import React, { useState } from 'react';
import { BookmarkPlus, X, Check } from 'lucide-react';
import { Translations, Language } from '../core/i18n';

interface SaveArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, description: string) => void;
  t?: Translations;
  lang?: Language;
}

export const SaveArticleModal: React.FC<SaveArticleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  lang = 'ar',
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave(title.trim(), description.trim());
    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 select-none" dir="ltr">
      <div className="bg-white rounded-3xl border border-[#e2e8f0] shadow-2xl max-w-md w-full overflow-hidden p-6 flex flex-col gap-5 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#2563eb] border border-blue-200 flex items-center justify-center">
              <BookmarkPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0f172a]">
                {lang === 'ar' ? 'حفظ الوصفة كـ Article جديد' : 'Enregistrer comme Article'}
              </h3>
              <p className="text-[11px] text-[#64748b]">
                {lang === 'ar' ? 'إضافة البارمترات الحالية إلى صفحة الوصفات والـ Articles' : 'Ajouter les paramètres actuels à la liste des articles'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[#f1f5f9] text-[#94a3b8] hover:text-[#0f172a] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-[#475569] mb-1.5">
              {lang === 'ar' ? 'عنوان الوصفة / المقال (Title)' : 'Titre de l\'article'}
            </label>
            <input
              type="text"
              required
              placeholder={lang === 'ar' ? 'مثال: صينية إنتاج سريعة 35 سم' : 'Ex: Plateau production rapide 35 cm'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full py-2.5 px-3.5 rounded-2xl bg-[#f8fafc] border border-[#cbd5e1] text-xs font-bold text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#475569] mb-1.5">
              {lang === 'ar' ? 'وصف تفصيلي أو ملاحظات (Description)' : 'Description ou notes'}
            </label>
            <textarea
              rows={3}
              placeholder={lang === 'ar' ? 'اكتب ملاحظات حول سرعة الآلة أو نوع الإنتاج...' : 'Notes sur la production ou vitesse machine...'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full py-2.5 px-3.5 rounded-2xl bg-[#f8fafc] border border-[#cbd5e1] text-xs text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-[#f1f5f9]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#f1f5f9] hover:bg-[#e2e8f0] text-xs font-bold text-[#475569] transition-all cursor-pointer active:scale-95"
            >
              {lang === 'ar' ? 'إلغاء' : 'Annuler'}
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-xs font-bold text-white shadow-md shadow-[#2563eb]/20 transition-all cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4 text-white" />
              <span>{lang === 'ar' ? 'حفظ في الـ Article' : 'Enregistrer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
