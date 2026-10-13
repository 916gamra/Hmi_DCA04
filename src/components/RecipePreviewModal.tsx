import React, { useState, useMemo } from 'react';
import {
  X,
  Bookmark,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Layers,
  Disc,
  CircleDot,
  Compass,
  Cpu,
} from 'lucide-react';
import { TrayParams, ViewOptions } from '../types';
import { buildModel } from '../core/model';
import { CanvasStage } from './CanvasStage';
import { Translations, Language } from '../core/i18n';

interface RecipePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewParams: TrayParams;
  sourceName?: string;
  onOpenSaveModal: () => void;
  onApplyToSimulator: () => void;
  t: Translations;
  lang?: Language;
}

export const RecipePreviewModal: React.FC<RecipePreviewModalProps> = ({
  isOpen,
  onClose,
  previewParams,
  sourceName,
  onOpenSaveModal,
  onApplyToSimulator,
  t,
  lang = 'ar',
}) => {
  const [viewOptions, setViewOptions] = useState<ViewOptions>(() => {
    let savedTheme: 'light' | 'dark' = 'dark';
    try {
      const stored = localStorage.getItem('hmi-tray-canvas-theme');
      if (stored === 'light' || stored === 'dark') {
        savedTheme = stored;
      }
    } catch {
      // ignore storage errors
    }
    return {
      sectors: true,
      heads: true,
      rings: true,
      labels: true,
      dimensions: true,
      theme: savedTheme,
    };
  });

  const previewModel = useMemo(() => buildModel(previewParams), [previewParams]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 select-none"
      dir="ltr"
    >
      <div className="bg-white rounded-3xl border border-[#e2e8f0] shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#f1f5f9] bg-[#f8fafc]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#2563eb] border border-blue-100 flex items-center justify-center shadow-xs">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-[#0f172a]">
                  {lang === 'ar' ? 'معاينة القالب المستورد' : 'Aperçu du modèle importé'}
                </h3>
                {sourceName && (
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {sourceName}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#64748b]">
                {lang === 'ar'
                  ? 'تحقق من الأبعاد الهندسية ونقاط الحفر قبل الحفظ أو التطبيق'
                  : 'Vérifiez la géométrie avant d\'enregistrer ou d\'appliquer'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[#f1f5f9] text-[#94a3b8] hover:text-[#0f172a] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Split into Interactive Canvas & Inspector Column */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 sm:gap-5 items-start">
          {/* Main Visual Column: Interactive Canvas Stage */}
          <div className="flex flex-col gap-3 min-w-0">
            <div className="h-[360px] sm:h-[440px] rounded-2xl overflow-hidden border border-[#e2e8f0] bg-[#f8fafc] shadow-xs relative">
              <CanvasStage
                model={previewModel}
                state={null}
                options={viewOptions}
                onChangeOptions={setViewOptions}
                t={t}
                lang={lang}
              />
            </div>

            {/* View Controls Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-2.5 text-xs">
              <span className="text-[11px] font-bold text-[#475569] px-1">
                {lang === 'ar' ? 'خيارات العرض:' : 'Options d\'affichage:'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setViewOptions((prev) => ({ ...prev, rings: !prev.rings }))
                  }
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                    viewOptions.rings
                      ? 'bg-blue-50 text-[#2563eb] border border-blue-200 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  <Disc className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'الحلقات' : 'Anneaux'}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setViewOptions((prev) => ({ ...prev, sectors: !prev.sectors }))
                  }
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                    viewOptions.sectors
                      ? 'bg-blue-50 text-[#2563eb] border border-blue-200 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'القطاعات 120°' : 'Secteurs'}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setViewOptions((prev) => ({ ...prev, heads: !prev.heads }))
                  }
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                    viewOptions.heads
                      ? 'bg-blue-50 text-[#2563eb] border border-blue-200 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'الرؤوس الثلاثة' : '3 Têtes'}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setViewOptions((prev) => ({ ...prev, labels: !prev.labels }))
                  }
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                    viewOptions.labels
                      ? 'bg-blue-50 text-[#2563eb] border border-blue-200 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  <CircleDot className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'التسميات' : 'Labels'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar Inspector Column: Geometry KPIs & Safety Badge */}
          <div className="flex flex-col gap-3.5">
            {/* Safety Validation Status */}
            <div
              className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
                previewModel.hasErr
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : previewModel.hasWarn
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              {previewModel.hasErr ? (
                <XCircle className="w-5 h-5 shrink-0 text-red-600" />
              ) : previewModel.hasWarn ? (
                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
              ) : (
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
              )}
              <div className="min-w-0">
                <span className="block text-xs font-bold">
                  {previewModel.hasErr
                    ? t.statusErr
                    : previewModel.hasWarn
                    ? t.statusWarn
                    : t.statusSafe}
                </span>
                <span className="text-[10px] text-slate-600 block">
                  {lang === 'ar'
                    ? previewModel.hasErr
                      ? 'يوجد تداخل بين الثقوب أو مع محيط الصينية'
                      : 'التصميم متوافق هندسياً مع آلة DCA'
                    : 'Statut géométrique validé'}
                </span>
              </div>
            </div>

            {/* Geometry Parameters Grid */}
            <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 flex flex-col gap-3">
              <h4 className="text-xs font-bold text-[#0f172a] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#2563eb]" />
                <span>{lang === 'ar' ? 'معاملات الصينية المستوردة' : 'Paramètres géométriques'}</span>
              </h4>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                  <span className="block text-[10px] text-slate-500">{t.trayDiameter}</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {previewParams.trayD} mm
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                  <span className="block text-[10px] text-slate-500">{t.layersCount}</span>
                  <span className="font-mono font-bold text-[#2563eb] text-sm">
                    {previewModel.layers.length} {lang === 'ar' ? 'طبقات' : 'L'}
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                  <span className="block text-[10px] text-slate-500">{t.spacing}</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {previewParams.spacing} mm
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                  <span className="block text-[10px] text-slate-500">{t.totalHoles}</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    {previewModel.totalPts}
                  </span>
                </div>
              </div>

              {/* Layer Summary breakdown */}
              <div className="pt-2 border-t border-slate-200 space-y-1">
                {previewModel.layers.map((l) => (
                  <div
                    key={l.i}
                    className="flex justify-between text-[11px] font-mono text-slate-600 bg-white/70 px-2 py-1 rounded-lg"
                  >
                    <span>L{l.i + 1} (Ø {(l.r * 2).toFixed(1)}mm)</span>
                    <span className="font-semibold text-slate-900">{l.n} pts ({l.step.toFixed(1)}°)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-1">
              {/* 1. Save to Articles & Presets */}
              <button
                type="button"
                onClick={onOpenSaveModal}
                className="w-full py-2.5 px-3 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                <Bookmark className="w-4 h-4" />
                <span>{lang === 'ar' ? 'حفظ في القوالب والمقالات' : 'Enregistrer dans les articles'}</span>
              </button>

              {/* 2. Direct Apply to Simulator */}
              <button
                type="button"
                onClick={onApplyToSimulator}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                <Zap className="w-4 h-4" />
                <span>{lang === 'ar' ? 'تطبيق وتشغيل في المحاكي' : 'Appliquer et simuler'}</span>
              </button>

              {/* 3. Close / Cancel */}
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all border border-slate-200 cursor-pointer active:scale-98"
              >
                {lang === 'ar' ? 'إلغاء' : 'Annuler'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
