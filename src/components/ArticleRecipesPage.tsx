import React, { useState } from 'react';
import { BookOpen, Layers, Check, CheckCircle2, Bookmark, Trash2, Download, Upload } from 'lucide-react';
import { PRESETS } from '../core/constants';
import { TrayParams, TrayModel, RecipePreset } from '../types';
import { TouchWinScreenMirror } from './TouchWinScreenMirror';
import { ConfirmModal } from './ConfirmModal';
import { ExportFormatModal } from './ExportFormatModal';
import { Translations, Language } from '../core/i18n';

interface ArticleRecipesPageProps {
  params: TrayParams;
  model: TrayModel;
  t: Translations;
  lang?: Language;
  onApplyPreset: (preset: RecipePreset) => void;
  onDeletePreset: (presetId: string) => void;
  onOpenImportModal: () => void;
  onOpenQr: () => void;
  customPresets?: RecipePreset[];
}

export const ArticleRecipesPage: React.FC<ArticleRecipesPageProps> = ({
  params,
  model,
  t,
  lang = 'ar',
  onApplyPreset,
  onDeletePreset,
  onOpenImportModal,
  onOpenQr,
  customPresets = [],
}) => {
  const allPresets = [...customPresets, ...PRESETS];

  // Find which preset matches current machine params (if any)
  const initialMatchingPreset = allPresets.find(
    (p) =>
      p.params.trayD === params.trayD &&
      p.params.layers === params.layers &&
      p.params.spacing === params.spacing
  );

  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    initialMatchingPreset ? initialMatchingPreset.id : PRESETS[0].id
  );

  const [presetToDelete, setPresetToDelete] = useState<string | null>(null);
  const [presetToExport, setPresetToExport] = useState<RecipePreset | null>(null);

  const handleSelectAndApply = (preset: RecipePreset) => {
    setSelectedPresetId(preset.id);
    onApplyPreset(preset);
  };

  const handleExportSinglePreset = (preset: RecipePreset, e: React.MouseEvent) => {
    e.stopPropagation();
    setPresetToExport(preset);
  };

  return (
    <div className="flex flex-col gap-2 sm:gap-3 max-w-5xl mx-auto w-full h-full min-h-0 select-none overflow-hidden" dir="ltr">
      <ConfirmModal
        isOpen={!!presetToDelete}
        onClose={() => setPresetToDelete(null)}
        onConfirm={() => {
          if (presetToDelete) onDeletePreset(presetToDelete);
          setPresetToDelete(null);
        }}
        title={lang === 'ar' ? 'تأكيد الحذف' : 'Confirmer la suppression'}
        message={
          lang === 'ar'
            ? 'هل أنت متأكد من حذف هذا القالب؟ لا يمكن التراجع عن هذا الإجراء.'
            : 'Êtes-vous sûr de vouloir supprimer cet article ? Cette action est irréversible.'
        }
        t={t}
        lang={lang}
      />

      <ExportFormatModal
        isOpen={!!presetToExport}
        onClose={() => setPresetToExport(null)}
        preset={presetToExport}
        t={t}
        lang={lang}
      />

      {/* 1. Executive Title Header Card (Compact & Anchored at Top with Icon Import Button) */}
      <div className="flex-none oneui-card p-2 sm:p-3 bg-white/95 backdrop-blur-md border border-[#e2e8f0]/90 shadow-2xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shadow-2xs shrink-0">
              <BookOpen className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm md:text-base font-bold text-[#0f172a] truncate">
                {t.articleTitle}
              </h2>
              <p className="text-[10px] sm:text-xs text-[#64748b] truncate">
                {t.articleSubtitle}
              </p>
            </div>
          </div>

          {/* Header Action: Icon-Only Import Button inside sleek capsule */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenImportModal}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 border border-blue-500/30"
              title={
                lang === 'ar'
                  ? 'استيراد قالب من ذاكرة الهاتف (JSON / CSV / QR)'
                  : 'Importer un modèle depuis le téléphone'
              }
              aria-label={lang === 'ar' ? 'استيراد قالب' : 'Importer un modèle'}
            >
              <Upload className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Preset Catalogue Selector Card (Anchored Container with Internal Scroll) */}
      <div className="flex-none oneui-card p-2.5 sm:p-3 flex flex-col gap-2 border border-[#e2e8f0]/90 shadow-2xs">
        <div className="flex-none flex items-center justify-between gap-2 border-b border-[#f1f5f9] pb-1.5 sm:pb-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Layers className="w-3.5 h-3.5 text-[#2563eb]" />
            <h3 className="text-xs sm:text-sm font-bold text-[#0f172a]">{t.presetsTitle}</h3>
          </div>
          <span className="text-[10px] sm:text-[11px] font-mono font-medium text-[#64748b] bg-[#f1f5f9] px-2 py-0.5 rounded-full border border-[#e2e8f0]">
            {allPresets.length} {lang === 'ar' ? 'قوالب متاحة' : 'modèles'}
          </span>
        </div>

        {/* 
          Responsive Internal Scroll Container:
          - Tall Screen (mobile portrait < sm): exactly 3 cards fit vertically (clamp around max-h-[310px] on tall devices, scaling down on shorter screens), then scroll starts.
          - Wide Screen (landscape / tablet / desktop sm:): exactly 4 cards fit (2 rows of 2 cards: sm:max-h-[220px]), then scroll starts.
          - Internal scroll (overscroll-contain, touch-pan-y) prevents full-page dragging on mobile.
        */}
        <div className="max-h-[clamp(170px,32dvh,315px)] sm:max-h-[220px] overflow-y-auto overscroll-contain touch-pan-y pr-1.5 oneui-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {allPresets.map((preset) => {
              const isMatch =
                preset.params.trayD === params.trayD &&
                preset.params.layers === params.layers &&
                preset.params.spacing === params.spacing;
              const isSelected = selectedPresetId === preset.id || isMatch;

              const name = lang === 'ar' ? preset.name : preset.nameFr || preset.name;
              const description =
                lang === 'ar' ? preset.description : preset.descriptionFr || preset.description;
              const tag = lang === 'ar' ? preset.tag : preset.tagFr || preset.tag;

              return (
                <div
                  key={preset.id}
                  onClick={() => handleSelectAndApply(preset)}
                  className={`h-[96px] p-2 sm:p-2.5 rounded-2xl transition-all flex flex-col justify-between cursor-pointer relative shrink-0 ${
                    isSelected
                      ? 'border-2 border-[#2563eb] bg-gradient-to-br from-blue-50/80 via-white to-blue-50/40 shadow-sm ring-2 ring-[#2563eb]/20'
                      : 'border border-[#e2e8f0] bg-white hover:border-[#2563eb]/60 hover:bg-[#f8fafc] hover:shadow-2xs'
                  }`}
                >
                  {/* Top Bar: Tag & Active Indicator */}
                  <div className="flex items-center justify-between gap-1.5 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${
                          isSelected
                            ? 'bg-[#2563eb] text-white border-[#2563eb]'
                            : 'bg-blue-50 text-[#2563eb] border-blue-200'
                        }`}
                      >
                        {tag}
                      </span>
                      <h4
                        className={`text-xs font-bold truncate transition-colors ${
                          isSelected ? 'text-[#1d4ed8]' : 'text-[#0f172a]'
                        }`}
                      >
                        {name}
                      </h4>
                    </div>

                    {isSelected && (
                      <span className="flex items-center gap-1 text-[9px] font-extrabold text-emerald-700 bg-emerald-100/90 border border-emerald-300 px-1.5 py-0.5 rounded-full shadow-2xs shrink-0">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                        <span>{lang === 'ar' ? 'النشطة' : 'Active'}</span>
                      </span>
                    )}
                  </div>

                  {/* Description: clean 1 line preview */}
                  <p className="text-[10px] text-[#64748b] leading-tight line-clamp-1">
                    {description}
                  </p>

                  {/* Card Bottom: Parameters Overview & Compact Action Buttons */}
                  <div className="pt-1 border-t border-[#f1f5f9] flex items-center justify-between gap-1.5">
                    <div className="text-[9px] font-mono font-semibold text-[#475569] flex items-center gap-1 bg-[#f8fafc] px-1.5 py-0.5 rounded-lg border border-[#e2e8f0] shrink-0">
                      <span>Ø{preset.params.trayD}</span>
                      <span className="text-[#94a3b8]">•</span>
                      <span>{preset.params.layers}L</span>
                      <span className="text-[#94a3b8]">•</span>
                      <span>ΔD{preset.params.spacing}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Export Single Preset Button */}
                      <button
                        type="button"
                        onClick={(e) => handleExportSinglePreset(preset, e)}
                        className="p-1 rounded-lg text-xs font-bold transition-all cursor-pointer bg-blue-50 hover:bg-blue-100 text-[#2563eb] border border-blue-200 active:scale-95 shadow-2xs"
                        title={lang === 'ar' ? 'تصدير هذا القالب (JSON)' : 'Exporter (JSON)'}
                      >
                        <Download className="w-3 h-3" />
                      </button>

                      {/* Delete Custom Preset Button */}
                      {preset.id.startsWith('custom-') && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPresetToDelete(preset.id);
                          }}
                          className="p-1 rounded-lg text-xs font-bold transition-all cursor-pointer bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 active:scale-95 shadow-2xs"
                          title={lang === 'ar' ? 'حذف القالب' : 'Supprimer'}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}

                      {/* Select and Apply Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAndApply(preset);
                        }}
                        className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
                          isSelected
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                            : 'bg-[#f1f5f9] hover:bg-[#2563eb] hover:text-white text-[#1e293b] border border-[#cbd5e1]/70'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                            <span>{lang === 'ar' ? 'مطبقة' : 'Active'}</span>
                          </>
                        ) : (
                          <>
                            <Bookmark className="w-2.5 h-2.5" />
                            <span>{lang === 'ar' ? 'تطبيق' : 'Choisir'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Machine Screens & Recipe Mirror Card (Responsive Anchored Container filling remaining height) */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <TouchWinScreenMirror
          model={model}
          params={params}
          lang={lang}
          t={t}
          onChangeParams={() => {}}
          onOpenQr={onOpenQr}
          onApplyPreset={() => {
            const defaultPreset = PRESETS[0];
            if (defaultPreset) handleSelectAndApply(defaultPreset);
          }}
        />
      </div>
    </div>
  );
};
