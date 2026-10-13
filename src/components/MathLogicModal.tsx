import React from 'react';
import { X, Calculator, CheckCircle2, ShieldCheck, Cpu } from 'lucide-react';
import { TrayModel, TrayParams } from '../types';
import { fmt } from '../core/model';
import { Language } from '../core/i18n';

interface MathLogicModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: TrayModel;
  params: TrayParams;
  lang: Language;
}

export const MathLogicModal: React.FC<MathLogicModalProps> = ({
  isOpen,
  onClose,
  model,
  params,
  lang,
}) => {
  if (!isOpen) return null;

  const isAr = lang === 'ar';
  const isClearanceSafe = model.minD >= params.tool - 1e-6;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-[#e2e8f0] flex flex-col overflow-hidden animate-scale-up"
        dir={isAr ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] bg-[#f8fafc]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#2563eb] flex items-center justify-center shadow-xs border border-blue-200">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#0f172a]">
                {isAr
                  ? '📐 توثيق المنطق الرياضي للتباعد المتساوي'
                  : '📐 Documentation Mathématique de l’Espacement Régulier'}
              </h2>
              <p className="text-xs text-[#64748b]">
                {isAr
                  ? 'حسابات أقطار الحلقات، خطوات السيرفو، وتزامن الرؤوس الثلاثة'
                  : 'Calculs des diamètres, courses servo et synchronisation 3 têtes'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#64748b] hover:text-[#0f172a] hover:bg-[#e2e8f0] rounded-xl transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-[#1e293b] text-xs sm:text-sm leading-relaxed">
          {/* Status Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 text-[#1e40af] flex items-start gap-3 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-[#2563eb] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-[#1e3a8a]">
                {isAr
                  ? `توزيع هندسي متماثل لـ ${params.layers} حلقات متحدة المركز`
                  : `Distribution géométrique uniforme pour ${params.layers} anneaux concentriques`}
              </h3>
              <p className="text-xs text-[#334155] leading-relaxed">
                {isAr
                  ? 'تعتمد الخوارزمية على تقسيم نصف القطر الفعال بدقة متناهية لتفادي تراكم أخطاء التقريب الميكانيكية، مع مراعاة خلوص أمان الأداة وهامش حافة الصينية.'
                  : 'L’algorithme divise le rayon utile avec précision pour éviter l’accumulation d’erreurs mécaniques, tout en garantissant le jeu de sécurité et la marge de bordure.'}
              </p>
            </div>
          </div>

          {/* Core 3 Formulas Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Formula 1: D1 */}
            <div className="bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-2xl flex flex-col justify-between gap-2 shadow-2xs">
              <div>
                <span className="text-[#64748b] block text-[11px] font-bold">
                  {isAr ? '1. محيط أول طبقة (D₁)' : '1. Diamètre 1ère couche (D₁)'}
                </span>
                <strong className="text-[#0f172a] font-mono block mt-1.5 text-sm sm:text-base">
                  D₁ = {params.trayD} − (2 × {params.margin}) = {fmt(model.d1)} mm
                </strong>
              </div>
              <p className="text-[11px] text-[#64748b] leading-normal pt-2 border-t border-[#e2e8f0]/80">
                {isAr
                  ? `قطر الصينية (${params.trayD} مم) مطروحاً منه ضعف هامش الحافة (${params.margin} مم × 2). نصف القطر R₁ = ${fmt(model.r1)} مم.`
                  : `Diamètre plateau (${params.trayD} mm) moins deux fois la marge (${params.margin} mm × 2). Rayon R₁ = ${fmt(model.r1)} mm.`}
              </p>
            </div>

            {/* Formula 2: Spacing ΔD */}
            <div className="bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-2xl flex flex-col justify-between gap-2 shadow-2xs">
              <div>
                <span className="text-[#64748b] block text-[11px] font-bold">
                  {isAr ? '2. التباعد القطري المتساوي (ΔD)' : '2. Espacement radial (ΔD)'}
                </span>
                <strong className="text-[#2563eb] font-mono block mt-1.5 text-sm sm:text-base">
                  ΔD = {params.spacing} mm
                </strong>
              </div>
              <p className="text-[11px] text-[#64748b] leading-normal pt-2 border-t border-[#e2e8f0]/80">
                {isAr
                  ? `ΔD = (${fmt(model.d1)} − ${fmt(model.dLast)}) ÷ (${params.layers} − 1) لتوزيع الطبقات بانتظام هندسي دقيق.`
                  : `ΔD = (${fmt(model.d1)} − ${fmt(model.dLast)}) ÷ (${params.layers} − 1) pour une répartition uniforme.`}
              </p>
            </div>

            {/* Formula 3: Servo Step */}
            <div className="bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-2xl flex flex-col justify-between gap-2 shadow-2xs">
              <div>
                <span className="text-[#64748b] block text-[11px] font-bold">
                  {isAr ? '3. خطوة حركة السيرفو بالآلة' : '3. Course servomoteur machine'}
                </span>
                <strong className="text-[#059669] font-mono block mt-1.5 text-sm sm:text-base">
                  {fmt(model.radialStepMm)} mm
                </strong>
              </div>
              <p className="text-[11px] text-[#64748b] leading-normal pt-2 border-t border-[#e2e8f0]/80">
                {isAr
                  ? `طول التمدد (Expansion Length) بين كل طبقة والتي تليها على محور X: نصف التباعد القطري (ΔD ÷ 2).`
                  : `Longueur d'expansion sur l'axe X entre couches consécutives : demi-espacement radial (ΔD ÷ 2).`}
              </p>
            </div>
          </div>

          {/* Kinematics and Safety Details */}
          <div className="bg-[#f8fafc] border border-[#e2e8f0] p-4 sm:p-5 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-[#0f172a]">
              <Cpu className="w-4 h-4 text-[#2563eb]" />
              <span>
                {isAr
                  ? 'التزامن الحركي للرؤوس الثلاثة (Cinématique 3 Têtes @ 120°)'
                  : 'Cinématique de synchronisation 3 têtes @ 120°'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-[#e2e8f0]">
                <strong className="block text-[#0f172a] mb-1 font-semibold">
                  {isAr ? '• زاوية التغطية لكل رأس:' : '• Plage angulaire par tête :'}
                </strong>
                <p className="text-[#64748b]">
                  {isAr
                    ? 'كل رأس يغطي قطاعاً مقداره 120° بالضبط. إجمالي الحفر في الدورة = عدد ثقوب الطبقة × 3 رؤوس متزامنة.'
                    : 'Chaque tête couvre exactement un secteur de 120°. Perçage simultané sur les 3 secteurs.'}
                </p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-[#e2e8f0]">
                <strong className="block text-[#0f172a] mb-1 font-semibold">
                  {isAr ? '• فحص التداخل وخلوص الأمان:' : '• Contrôle d’interférence et sécurité :'}
                </strong>
                <p className="text-[#64748b]">
                  {isAr
                    ? `أدنى مسافة مسجلة بين المراكز: ${fmt(model.minD, 2)} مم (الحد الأدنى الآمن مع الخلوص: ${fmt(params.tool + 0.5, 2)} مم). الحالة: `
                    : `Distance minimale centre-à-centre : ${fmt(model.minD, 2)} mm (seuil requis : ${fmt(params.tool + 0.5, 2)} mm). Statut : `}
                  <span className={isClearanceSafe ? 'text-[#059669] font-bold' : 'text-red-600 font-bold'}>
                    {isClearanceSafe
                      ? (isAr ? 'آمن ومطابق' : 'Conforme')
                      : (isAr ? 'تحذير تداخل' : 'Risque collision')}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Current Configuration Summary */}
          <div className="overflow-x-auto rounded-2xl border border-[#e2e8f0]">
            <table className="w-full text-xs text-left border-collapse" dir="ltr">
              <thead className="bg-[#f8fafc] text-[#64748b] border-b border-[#e2e8f0]">
                <tr>
                  <th className="py-2.5 px-3 font-bold text-center">Tray D</th>
                  <th className="py-2.5 px-3 font-bold text-center">Margin</th>
                  <th className="py-2.5 px-3 font-bold text-center">Layers</th>
                  <th className="py-2.5 px-3 font-bold text-center">Spacing ΔD</th>
                  <th className="py-2.5 px-3 font-bold text-center">Tool D</th>
                  <th className="py-2.5 px-3 font-bold text-center">Safety Clearance</th>
                  <th className="py-2.5 px-3 font-bold text-center">Total Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0] bg-white font-mono text-center">
                <tr>
                  <td className="py-2.5 px-3 font-bold text-[#0f172a]">{params.trayD} mm</td>
                  <td className="py-2.5 px-3 text-[#64748b]">{params.margin} mm</td>
                  <td className="py-2.5 px-3 font-bold text-[#2563eb]">{params.layers}</td>
                  <td className="py-2.5 px-3 text-[#059669] font-bold">{params.spacing} mm</td>
                  <td className="py-2.5 px-3 text-[#64748b]">{params.tool} mm</td>
                  <td className="py-2.5 px-3 text-emerald-600 font-bold">+0.50 mm</td>
                  <td className="py-2.5 px-3 font-bold text-[#0f172a]">{model.totalPts}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc]">
          <div className="flex items-center gap-2 text-xs text-[#64748b]">
            <ShieldCheck className="w-4 h-4 text-[#059669]" />
            <span>
              {isAr
                ? 'الحسابات مطابقة تماماً للمنطق البرمجي لشاشة TouchWin'
                : 'Calculs 100% compatibles avec le firmware TouchWin'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
          >
            {isAr ? 'فهمت، إغلاق' : 'Compris, Fermer'}
          </button>
        </div>
      </div>
    </div>
  );
};
