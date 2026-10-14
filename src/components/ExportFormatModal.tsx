import React from 'react';
import { Download, FileJson, FileSpreadsheet, QrCode, FileText, X } from 'lucide-react';
import { RecipePreset, TrayParams } from '../types';
import { buildModel } from '../core/model';
import {
  serializeRecipeV1,
  generateCsvPoints,
  generateCompactQrPayload,
  generateRecipeGCode,
  downloadFile,
  normalizeAndHydrateParams,
} from '../core/recipe';
import { Translations, Language } from '../core/i18n';

interface ExportFormatModalProps {
  isOpen: boolean;
  onClose: () => void;
  preset: RecipePreset | null;
  t: Translations;
  lang?: Language;
}

export const ExportFormatModal: React.FC<ExportFormatModalProps> = ({
  isOpen,
  onClose,
  preset,
  lang = 'ar',
}) => {
  if (!isOpen || !preset) return null;

  const fullParams: TrayParams = normalizeAndHydrateParams(preset.params);

  const model = buildModel(fullParams);
  const totalCycleMs = (model.totalSteps * fullParams.timing.index) + (model.layers.length * fullParams.timing.layer);
  const cleanName = (lang === 'ar' ? preset.name : (preset.nameFr || preset.name))
    .replace(/[^a-zA-Z0-9_\u0600-\u06FF-]/g, '_');

  const handleExportJson = () => {
    const jsonStr = serializeRecipeV1(fullParams, {
      name: lang === 'ar' ? preset.name : (preset.nameFr || preset.name),
      description: lang === 'ar' ? preset.description : (preset.descriptionFr || preset.description),
    });
    downloadFile(`recipe_${cleanName}_D${fullParams.trayD}mm.json`, jsonStr, 'application/json');
    onClose();
  };

  const handleExportCsv = () => {
    const csvStr = generateCsvPoints(model);
    downloadFile(`coordinates_${cleanName}_D${fullParams.trayD}mm.csv`, csvStr, 'text/csv;charset=utf-8');
    onClose();
  };

  const handleExportQrPayload = () => {
    const qrPayload = generateCompactQrPayload(fullParams, model, totalCycleMs);
    downloadFile(`qr_payload_${cleanName}.json`, qrPayload, 'application/json');
    onClose();
  };

  const handleExportTxtReport = () => {
    const report = [
      `=== TOUCHWIN DCA DRILLING RECIPE REPORT ===`,
      `Recipe Name: ${preset.name} (${preset.nameFr || ''})`,
      `Tag: ${preset.tag}`,
      `Description: ${preset.description}`,
      `------------------------------------------`,
      `Tray Diameter: ${fullParams.trayD} mm`,
      `Tool Diameter: ${fullParams.tool} mm`,
      `Outer Margin: ${fullParams.margin} mm`,
      `Concentric Layers: ${fullParams.layers}`,
      `Radial Spacing (s): ${fullParams.spacing} mm (ΔD = ${fullParams.spacing * 2} mm)`,
      `------------------------------------------`,
      `Total Holes: ${model.totalPts}`,
      `Total Steps per Head: ${model.totalSteps}`,
      `Estimated Cycle Time: ${(totalCycleMs / 1000).toFixed(1)}s`,
      `Safety Status: ${model.hasErr ? 'WARNING (Collision risk)' : 'VALIDATED SAFE'}`,
      `Generated At: ${new Date().toISOString()}`,
      `==========================================`,
    ].join('\r\n');

    downloadFile(`report_${cleanName}.txt`, report, 'text/plain;charset=utf-8');
    onClose();
  };

  const handleExportGCode = () => {
    const gcodeStr = generateRecipeGCode(fullParams, model);
    downloadFile(`recipe_${cleanName}.trivium.gcode`, gcodeStr, 'text/plain;charset=utf-8');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200 select-none"
      dir="ltr"
    >
      <div className="bg-white rounded-3xl border border-[#e2e8f0] shadow-2xl max-w-md w-full overflow-hidden p-5 sm:p-6 flex flex-col gap-4.5 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-[#2563eb] flex items-center justify-center border border-blue-100 shadow-2xs">
              <Download className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0f172a]">
                {lang === 'ar' ? 'تصدير القالب (اختر الصيغة)' : 'Exporter le modèle (Format)'}
              </h3>
              <p className="text-[11px] text-[#64748b] truncate max-w-[240px]">
                {lang === 'ar' ? preset.name : (preset.nameFr || preset.name)}
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

        {/* Format Options */}
        <div className="flex flex-col gap-2.5">
          {/* JSON Option */}
          <button
            type="button"
            onClick={handleExportJson}
            className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] hover:border-[#2563eb] hover:bg-blue-50/40 transition-all cursor-pointer text-left active:scale-98 group"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-100 text-[#2563eb] flex items-center justify-center shrink-0 group-hover:bg-[#2563eb] group-hover:text-white transition-colors">
              <FileJson className="w-5.5 h-5.5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-xs font-bold text-[#0f172a]">
                {lang === 'ar' ? 'ملف JSON (معاملات الوصفة وال PLC)' : 'Fichier JSON (Complet)'}
              </span>
              <span className="text-[11px] text-[#64748b] block">
                {lang === 'ar' ? 'متوافق مع الاستيراد الفوري في شاشات TouchWin' : 'Recommandé pour la sauvegarde'}
              </span>
            </div>
          </button>

          {/* CSV Option */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] hover:border-emerald-600 hover:bg-emerald-50/40 transition-all cursor-pointer text-left active:scale-98 group"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <FileSpreadsheet className="w-5.5 h-5.5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-xs font-bold text-[#0f172a]">
                {lang === 'ar' ? 'ملف CSV (إحداثيات النقاط والثقوب)' : 'Fichier CSV (Coordonnées)'}
              </span>
              <span className="text-[11px] text-[#64748b] block">
                {lang === 'ar' ? 'جدول كامل لإحداثيات X و Y والطبقات لبرامج CNC' : 'Tableau Excel / CNC des points'}
              </span>
            </div>
          </button>

          {/* QR Payload Option */}
          <button
            type="button"
            onClick={handleExportQrPayload}
            className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] hover:border-indigo-600 hover:bg-indigo-50/40 transition-all cursor-pointer text-left active:scale-98 group"
          >
            <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <QrCode className="w-5.5 h-5.5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-xs font-bold text-[#0f172a]">
                {lang === 'ar' ? 'بيانات QR (حمولة مختصرة للماسح)' : 'Payload QR Code (Compact)'}
              </span>
              <span className="text-[11px] text-[#64748b] block">
                {lang === 'ar' ? 'نص مختصر للتحويل إلى رمز استجابة سريعة' : 'Données prêtes pour QR Code'}
              </span>
            </div>
          </button>

          {/* Text Report Option */}
          <button
            type="button"
            onClick={handleExportTxtReport}
            className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] hover:border-amber-600 hover:bg-amber-50/40 transition-all cursor-pointer text-left active:scale-98 group"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <FileText className="w-5.5 h-5.5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-xs font-bold text-[#0f172a]">
                {lang === 'ar' ? 'تقرير نصي (للمشغلين والصيانة HMI)' : 'Rapport TXT (Opérateurs)'}
              </span>
              <span className="text-[11px] text-[#64748b] block">
                {lang === 'ar' ? 'ملف نصي يلخص إعدادات الآلة وأوقات الدورة' : 'Résumé technique imprimable'}
              </span>
            </div>
          </button>

          {/* G-Code / TRIVIUM Recipe Option */}
          <button
            type="button"
            onClick={handleExportGCode}
            className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] hover:border-orange-600 hover:bg-orange-50/40 transition-all cursor-pointer text-left active:scale-98 group"
          >
            <div className="w-11 h-11 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 group-hover:bg-orange-600 group-hover:text-white transition-colors">
              <FileText className="w-5.5 h-5.5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-xs font-bold text-[#0f172a]">
                {lang === 'ar' ? 'وصفة زوايا وسرعات (TRIVIUM)' : 'Recette angles/vitesses (TRIVIUM)'}
              </span>
              <span className="text-[11px] text-[#64748b] block">
                {lang === 'ar' ? 'وصفة زوايا وسرعات لآلة TRIVIUM / TouchWin (وليس مسار CNC عام)' : 'Recette angles/vitesses TRIVIUM / TouchWin (non-CNC générique)'}
              </span>
            </div>
          </button>
        </div>

        {/* Footer Cancel */}
        <div className="pt-2 border-t border-[#f1f5f9] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#f1f5f9] hover:bg-[#e2e8f0] text-xs font-bold text-[#334155] transition-all cursor-pointer active:scale-95"
          >
            {lang === 'ar' ? 'إلغاء' : 'Annuler'}
          </button>
        </div>
      </div>
    </div>
  );
};
