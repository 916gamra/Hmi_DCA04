import React from 'react';
import { ChevronDown, Sliders, Disc, Calculator, Clock } from 'lucide-react';
import { TrayParams, TrayModel } from '../types';
import { NumberStepper } from './NumberStepper';
import { LAYER_COLORS } from '../core/constants';
import { sanitizeN } from '../core/model';
import { Translations, Language, translations } from '../core/i18n';

interface ParametersPanelProps {
  params: TrayParams;
  model: TrayModel;
  t?: Translations;
  lang?: Language;
  onChange: (updated: Partial<TrayParams>) => void;
  onAutoCalculateSpacing: () => void;
}

export const ParametersPanel: React.FC<ParametersPanelProps> = ({
  params,
  t: propT,
  lang = 'ar',
  onChange,
  onAutoCalculateSpacing,
}) => {
  const t = propT || translations[lang];
  const [openSection, setOpenSection] = React.useState<
    'geo' | 'rings' | 'pts' | 'timing' | null
  >('geo');

  // D1 (قطر أول حلقة) = قطر الصينية ناقص ضعف الهامش (حيث الهامش يتكرر على طرفي القطر اليمين واليسار)
  const d1 = Math.max(0, params.trayD - 2 * params.margin);
  const radialMovement = params.spacing;
  const isSpacingSafe = radialMovement >= params.tool;

  const toggleSection = (key: 'geo' | 'rings' | 'pts' | 'timing') => {
    setOpenSection((prev) => (prev === key ? null : key));
  };

  const setTrayUnit = (newUnit: 'cm' | 'mm') => {
    if (newUnit === params.trayU) return;
    const newDisplay =
      newUnit === 'cm'
        ? Number((params.trayD / 10).toFixed(2))
        : Number(params.trayD.toFixed(1));
    onChange({
      trayU: newUnit,
      trayDDisplay: newDisplay,
    });
  };

  const handleTrayDiameter = (val: number) => {
    const mm = params.trayU === 'cm' ? val * 10 : val;
    onChange({
      trayD: Math.max(10, mm),
      trayDDisplay: val,
    });
  };

  const setMarginUnit = (newUnit: 'cm' | 'mm') => {
    if (newUnit === params.marginU) return;
    const newDisplay =
      newUnit === 'cm'
        ? Number((params.margin / 10).toFixed(2))
        : Number(params.margin.toFixed(1));
    onChange({
      marginU: newUnit,
      marginDisplay: newDisplay,
    });
  };

  const handleMargin = (val: number) => {
    const mm = params.marginU === 'cm' ? val * 10 : val;
    onChange({
      margin: Math.max(0, mm),
      marginDisplay: val,
    });
  };

  const setSpacingUnit = (newUnit: 'cm' | 'mm') => {
    if (newUnit === params.spacingU) return;
    const newDisplay =
      newUnit === 'cm'
        ? Number((params.spacing / 10).toFixed(2))
        : Number(params.spacing.toFixed(1));
    onChange({
      spacingU: newUnit,
      spacingDisplay: newDisplay,
    });
  };

  const handleSpacing = (val: number) => {
    const mm = params.spacingU === 'cm' ? val * 10 : val;
    const newSpacing = Math.max(0.5, mm);
    const R = params.trayD / 2;
    const r1 = Math.max(0, R - params.margin);
    const rLast_radius = Math.max(0, r1 - newSpacing * (params.layers - 1));
    const nextDLast = 2 * rLast_radius;
    const nextDLastDisplay =
      params.rLastU === 'cm'
        ? Number((nextDLast / 10).toFixed(1))
        : Number(nextDLast.toFixed(1));
    onChange({
      spacing: newSpacing,
      spacingDisplay: val,
      rLast: Number(nextDLast.toFixed(1)),
      rLastDisplay: nextDLastDisplay,
    });
  };

  const setRLastUnit = (newUnit: 'cm' | 'mm') => {
    if (newUnit === params.rLastU) return;
    const newDisplay =
      newUnit === 'cm'
        ? Number((params.rLast / 10).toFixed(2))
        : Number(params.rLast.toFixed(1));
    onChange({
      rLastU: newUnit,
      rLastDisplay: newDisplay,
    });
  };

  const handleRLast = (val: number) => {
    const mm = params.rLastU === 'cm' ? val * 10 : val;
    const targetDLast = Math.max(0, mm);
    const rLast_radius = targetDLast / 2;
    const R = params.trayD / 2;
    const r1 = Math.max(0, R - params.margin);
    let newSpacing = params.spacing;

    if (params.layers > 1) {
      newSpacing = (r1 - rLast_radius) / (params.layers - 1);
      if (newSpacing < 0.5) newSpacing = 0.5;
    }

    const roundedSpacing = Number(newSpacing.toFixed(1));
    const spacingDisplayVal =
      params.spacingU === 'cm'
        ? Number((roundedSpacing / 10).toFixed(1))
        : roundedSpacing;

    onChange({
      rLast: targetDLast,
      rLastDisplay: val,
      spacing: roundedSpacing,
      spacingDisplay: spacingDisplayVal,
    });
  };

  const handleCustomLayerPoints = (index: number, val: number) => {
    const nextCustom = [...params.custom];
    while (nextCustom.length < params.layers) {
      nextCustom.push({ n: params.rawBase, off: nextCustom.length * params.addAngle });
    }
    const n = sanitizeN(val);
    nextCustom[index] = {
      ...nextCustom[index],
      n,
      stepAngle: 360 / n,
    };
    onChange({ custom: nextCustom });
  };

  const handleCustomLayerStepAngle = (index: number, val: number) => {
    const nextCustom = [...params.custom];
    while (nextCustom.length < params.layers) {
      nextCustom.push({ n: params.rawBase, off: nextCustom.length * params.addAngle });
    }
    const n = sanitizeN(Math.round(360 / val));
    nextCustom[index] = {
      ...nextCustom[index],
      n,
      stepAngle: 360 / n,
    };
    onChange({ custom: nextCustom });
  };

  const handleCustomLayerOffset = (index: number, val: number) => {
    const nextCustom = [...params.custom];
    while (nextCustom.length < params.layers) {
      nextCustom.push({ n: params.rawBase, off: nextCustom.length * params.addAngle });
    }
    nextCustom[index] = {
      ...nextCustom[index],
      off: val,
    };
    onChange({ custom: nextCustom });
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-4.5 select-none" dir="ltr">
      {/* 1. Card: Tray & Tool Geometry */}
      <div className="oneui-card overflow-hidden transition-all border border-slate-200/90 shadow-2xs hover:shadow-xs">
        <button
          type="button"
          onClick={() => toggleSection('geo')}
          className="w-full flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4.5 cursor-pointer hover:bg-slate-50/80 transition-colors text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563eb] shrink-0 shadow-2xs">
              <Disc className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex flex-col text-left">
              <h2 className="text-sm font-bold text-[#0f172a] truncate">{t.cardGeoTitle}</h2>
              <span className="text-[11px] font-mono text-[#64748b] truncate mt-0.5">
                Ø{params.trayD} mm • {lang === 'ar' ? 'أداة' : 'Outil'} Ø{params.tool} mm • {lang === 'ar' ? 'هامش' : 'Marge'} {params.margin} mm
              </span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-xl bg-slate-100/80 flex items-center justify-center text-slate-500 shrink-0 ml-2">
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                openSection === 'geo' ? 'rotate-0' : '-rotate-90'
              }`}
            />
          </div>
        </button>

        {openSection === 'geo' && (
          <div className="px-4 sm:px-5 pb-5 pt-3 flex flex-col gap-4 sm:gap-4.5 border-t border-[#f1f5f9]">
            {/* Tray Diameter */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-[#475569] mb-1.5">
                <label htmlFor="trayD">{t.trayDiameter}</label>
                <div className="flex bg-[#f1f5f9] p-0.5 rounded-lg border border-[#e2e8f0]">
                  <button
                    type="button"
                    onClick={() => setTrayUnit('cm')}
                    className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-all ${
                      params.trayU === 'cm'
                        ? 'bg-white text-[#2563eb] shadow-xs'
                        : 'text-[#64748b]'
                    }`}
                  >
                    {lang === 'ar' ? 'سم' : 'cm'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrayUnit('mm')}
                    className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-all ${
                      params.trayU === 'mm'
                        ? 'bg-white text-[#2563eb] shadow-xs'
                        : 'text-[#64748b]'
                    }`}
                  >
                    {lang === 'ar' ? 'مم' : 'mm'}
                  </button>
                </div>
              </div>
              <NumberStepper
                id="trayD"
                value={params.trayDDisplay}
                min={params.trayU === 'cm' ? 5 : 50}
                max={params.trayU === 'cm' ? 200 : 2000}
                step={params.trayU === 'cm' ? 0.5 : 5}
                unit={params.trayU}
                onChange={handleTrayDiameter}
              />
              <span className="text-[11px] text-[#64748b] block mt-1 font-mono">
                {lang === 'ar' ? `قطر الصينية الكلي = ${params.trayD} مم` : `Diamètre total = ${params.trayD} mm`}
              </span>
            </div>

            {/* Tool Diameter */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-[#475569] mb-1.5">
                <label htmlFor="toolD">{t.toolDiameter}</label>
                <span className="text-[11px] text-[#2563eb] font-bold font-mono">
                  Ø {params.tool} {lang === 'ar' ? 'مم' : 'mm'}
                </span>
              </div>
              <NumberStepper
                id="toolD"
                value={params.tool}
                min={0.5}
                max={30}
                step={0.5}
                unit={lang === 'ar' ? 'مم' : 'mm'}
                onChange={(val) => onChange({ tool: Math.max(0.5, val) })}
              />
            </div>

            {/* Margin from Rim */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-[#475569] mb-1.5">
                <label htmlFor="margin">{t.margin}</label>
                <div className="flex bg-[#f1f5f9] p-0.5 rounded-lg border border-[#e2e8f0]">
                  <button
                    type="button"
                    onClick={() => setMarginUnit('cm')}
                    className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-all ${
                      params.marginU === 'cm'
                        ? 'bg-white text-[#2563eb] shadow-xs'
                        : 'text-[#64748b]'
                    }`}
                  >
                    {lang === 'ar' ? 'سم' : 'cm'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMarginUnit('mm')}
                    className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-all ${
                      params.marginU === 'mm'
                        ? 'bg-white text-[#2563eb] shadow-xs'
                        : 'text-[#64748b]'
                    }`}
                  >
                    {lang === 'ar' ? 'مم' : 'mm'}
                  </button>
                </div>
              </div>
              <NumberStepper
                id="margin"
                value={params.marginDisplay}
                min={0}
                max={params.marginU === 'cm' ? 20 : 200}
                step={params.marginU === 'cm' ? 0.2 : 2}
                unit={params.marginU}
                onChange={handleMargin}
              />
              <p className="text-[11px] text-[#64748b] mt-1 font-mono">
                {lang === 'ar'
                  ? `قطر الطبقة الأولى D₁ = ${d1.toFixed(1)} مم (نصف القطر R₁ = ${(d1 / 2).toFixed(1)} مم)`
                  : `Diamètre 1ère couche D₁ = ${d1.toFixed(1)} mm (Rayon R₁ = ${(d1 / 2).toFixed(1)} mm)`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 2. Card: Concentric Layers */}
      <div className="oneui-card overflow-hidden transition-all border border-slate-200/90 shadow-2xs hover:shadow-xs">
        <button
          type="button"
          onClick={() => toggleSection('rings')}
          className="w-full flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4.5 cursor-pointer hover:bg-slate-50/80 transition-colors text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#059669] shrink-0 shadow-2xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex flex-col text-left">
              <h2 className="text-sm font-bold text-[#0f172a] truncate">{t.cardRingsTitle}</h2>
              <span className="text-[11px] font-mono text-[#64748b] truncate mt-0.5">
                {params.layers} {lang === 'ar' ? 'طبقات' : 'couches'} • ΔD = {params.spacing} mm • D₁ = {d1.toFixed(1)} mm
              </span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-xl bg-slate-100/80 flex items-center justify-center text-slate-500 shrink-0 ml-2">
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                openSection === 'rings' ? 'rotate-0' : '-rotate-90'
              }`}
            />
          </div>
        </button>

        {openSection === 'rings' && (
          <div className="px-4 sm:px-5 pb-5 pt-3 flex flex-col gap-4 sm:gap-4.5 border-t border-[#f1f5f9]">
            {/* Number of concentric layers (1-7) */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-[#475569] mb-1.5">
                <label htmlFor="layers">{t.layersCount}</label>
                <span className="text-[11px] text-[#2563eb] font-bold">
                  {params.layers} {lang === 'ar' ? 'من 7' : '/ 7'}
                </span>
              </div>
              <NumberStepper
                id="layers"
                value={params.layers}
                min={1}
                max={7}
                step={1}
                onChange={(val) => onChange({ layers: Math.min(7, Math.max(1, Math.round(val))) })}
              />
            </div>

            {/* Layer diameter spacing */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-[#475569] mb-1.5">
                <label htmlFor="spacing">{t.spacing}</label>
                <div className="flex bg-[#f1f5f9] p-0.5 rounded-lg border border-[#e2e8f0]">
                  <button
                    type="button"
                    onClick={() => setSpacingUnit('cm')}
                    className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-all ${
                      params.spacingU === 'cm'
                        ? 'bg-white text-[#2563eb] shadow-xs'
                        : 'text-[#64748b]'
                    }`}
                  >
                    {lang === 'ar' ? 'سم' : 'cm'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpacingUnit('mm')}
                    className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-all ${
                      params.spacingU === 'mm'
                        ? 'bg-white text-[#2563eb] shadow-xs'
                        : 'text-[#64748b]'
                    }`}
                  >
                    {lang === 'ar' ? 'مم' : 'mm'}
                  </button>
                </div>
              </div>
              <NumberStepper
                id="spacing"
                value={params.spacingDisplay}
                min={params.spacingU === 'cm' ? 0.1 : 1}
                max={params.spacingU === 'cm' ? 30 : 300}
                step={params.spacingU === 'cm' ? 0.1 : 1}
                unit={params.spacingU}
                onChange={handleSpacing}
              />
              <span className="text-[11px] text-[#2563eb] font-semibold font-mono block mt-1">
                {lang === 'ar' ? `تباعد شعاعي s = ${params.spacing} مم (فرق القطر بين حلقتين = ${2 * params.spacing} مم)` : `Espacement radial s = ${params.spacing} mm (ΔD diamétral = ${2 * params.spacing} mm)`}
              </span>
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-2.5 mt-2 space-y-1 text-[11px]">
                <div className="flex justify-between text-[#0f172a]">
                  <span>{t.spacingLaw}</span>
                  <span className="font-mono font-bold">
                    {lang === 'ar'
                      ? `R_التالية = R_السابقة − ${params.spacing} مم`
                      : `R_suiv = R_préc − ${params.spacing} mm`}
                  </span>
                </div>
                <div className="flex justify-between text-[#475569]">
                  <span>{t.servoRadialCourse}</span>
                  <span className="font-mono font-bold text-[#059669]">
                    {radialMovement.toFixed(1)} {lang === 'ar' ? 'مم' : 'mm'}
                  </span>
                </div>
                {!isSpacingSafe && (
                  <p className="text-red-600 font-semibold text-[10px] pt-1 border-t border-red-100">
                    {lang === 'ar'
                      ? `⚠ تحذير: التباعد الشعاعي (${radialMovement.toFixed(1)} مم) أقل من قطر الأداة (${params.tool} مم) — يحدث تداخل بين الحلقات!`
                      : `⚠ Attention : Espacement radial (${radialMovement.toFixed(1)} mm) < diamètre outil (${params.tool} mm) — collision !`}
                  </p>
                )}
              </div>
            </div>

            {/* Target last layer diameter with Auto-Calculate Button */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[#475569] mb-1.5">
                <label htmlFor="rLast">{t.lastLayerD}</label>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex bg-[#f1f5f9] p-0.5 rounded-lg border border-[#e2e8f0]">
                    <button
                      type="button"
                      onClick={() => setRLastUnit('cm')}
                      className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-all ${
                        params.rLastU === 'cm'
                          ? 'bg-white text-[#2563eb] shadow-xs'
                          : 'text-[#64748b]'
                      }`}
                    >
                      {lang === 'ar' ? 'سم' : 'cm'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRLastUnit('mm')}
                      className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-all ${
                        params.rLastU === 'mm'
                          ? 'bg-white text-[#2563eb] shadow-xs'
                          : 'text-[#64748b]'
                      }`}
                    >
                      {lang === 'ar' ? 'مم' : 'mm'}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={onAutoCalculateSpacing}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-white bg-[#2563eb] hover:bg-[#1d4ed8] px-3 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer select-none active:scale-95"
                    title={
                      lang === 'ar'
                        ? 'حساب تباعد متساوٍ تماماً بين محيط أول طبقة ومحيط آخر طبقة'
                        : "Calculer un espacement uniforme entre la 1ère et la dernière couche"
                    }
                  >
                    <Calculator className="w-3.5 h-3.5 text-white" />
                    <span>{lang === 'ar' ? '⚙ احسب التباعد تلقائياً' : '⚙ Auto'}</span>
                  </button>
                </div>
              </div>
              <NumberStepper
                id="rLast"
                value={params.rLastDisplay}
                min={0}
                max={params.rLastU === 'cm' ? Math.max(1, d1 / 10 - 0.1) : Math.max(10, d1 - 1)}
                step={params.rLastU === 'cm' ? 0.5 : 1}
                unit={params.rLastU}
                onChange={handleRLast}
              />

              {/* Comprehensive Engineering Documentation Box */}
              <div className="mt-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3 text-xs flex flex-col gap-2">
                <div className="flex items-center justify-between font-bold text-[#1e40af] text-[11px] border-b border-blue-200/60 pb-1.5">
                  <span>{t.mathDocTitle}</span>
                  <span className="font-mono">{params.layers} {lang === 'ar' ? 'طبقات' : 'couches'}</span>
                </div>

                <div className="space-y-1.5 text-[11px] text-[#1e3a8a] leading-relaxed">
                  <p>
                    <strong>{t.mathDocMarginTitle}</strong> {t.mathDocMarginDesc}
                    <br />
                    <span className="font-mono font-bold bg-white/70 px-1.5 py-0.5 rounded border border-blue-200 inline-block mt-0.5">
                      R₁ = ({params.trayD} ÷ 2) − {params.margin} = {((params.trayD / 2) - params.margin).toFixed(1)} {lang === 'ar' ? 'مم' : 'mm'} (D₁ = {d1.toFixed(1)} مم)
                    </span>
                    <span className="text-[10px] text-[#475569] block mt-0.5">
                      {t.mathDocMarginNote}
                    </span>
                  </p>

                  <p>
                    <strong>{t.mathDocUniformSpacing}</strong>{' '}
                    {lang === 'ar'
                      ? 'التباعد الشعاعي المتساوي بين الحلقات:'
                      : 'Espacement radial uniforme :'}
                    <br />
                    <span className="font-mono font-bold bg-white/70 px-1.5 py-0.5 rounded border border-blue-200 inline-block mt-0.5">
                      s = (R₁ − R_fin) ÷ ({params.layers} − 1)
                    </span>
                  </p>

                  <p>
                    <strong>{t.mathDocServoMove}</strong>
                    <br />
                    {t.mathDocServoMoveDesc}
                    <strong className="font-mono text-[#059669] mr-1">
                      {params.spacing.toFixed(1)} {lang === 'ar' ? 'مم' : 'mm'}
                    </strong>
                    {params.spacing < params.tool && (
                      <span className="text-red-600 font-bold block mt-0.5">
                        {lang === 'ar'
                          ? `⚠ خطر: التباعد أقل من قطر الأداة (${params.tool} مم) — يحدث تداخل!`
                          : `⚠ Danger : Espacement inférieur au diamètre outil (${params.tool} mm) — collision !`}
                      </span>
                    )}
                  </p>
                </div>

                {/* Live Ladder of Calculated Layer Diameters */}
                <div className="pt-2 border-t border-blue-200/60">
                  <span className="text-[10px] font-bold text-[#1e40af] block mb-1.5">
                    {t.layerDistributionTitle}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from({ length: params.layers }).map((_, idx) => {
                      const layerD = d1 - 2 * idx * params.spacing;
                      const isLast = idx === params.layers - 1;
                      return (
                        <div
                          key={idx}
                          className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold border ${
                            isLast
                              ? 'bg-amber-100/80 border-amber-300 text-amber-900'
                              : idx === 0
                              ? 'bg-blue-100/80 border-blue-300 text-blue-900'
                              : 'bg-white border-blue-200 text-[#0f172a]'
                          }`}
                        >
                          L{idx + 1}: {layerD.toFixed(1)} {lang === 'ar' ? 'مم' : 'mm'}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Card: Points & Angular Steps */}
      <div className="oneui-card overflow-hidden transition-all border border-slate-200/90 shadow-2xs hover:shadow-xs">
        <button
          type="button"
          onClick={() => toggleSection('pts')}
          className="w-full flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4.5 cursor-pointer hover:bg-slate-50/80 transition-colors text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-[#d97706] shrink-0 shadow-2xs font-mono font-bold text-sm">
              3×
            </div>
            <div className="min-w-0 flex flex-col text-left">
              <h2 className="text-sm font-bold text-[#0f172a] truncate">{t.cardPointsTitle}</h2>
              <span className="text-[11px] font-mono text-[#64748b] truncate mt-0.5">
                {params.mode === 'all'
                  ? `${params.rawBase} ${lang === 'ar' ? 'نقطة/طبقة' : 'pts/couche'} (${params.rawBase / 3} × 3) • +${params.addAngle}°`
                  : (lang === 'ar' ? 'توزيع مخصص لكل طبقة' : 'Distribution personnalisée')}
              </span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-xl bg-slate-100/80 flex items-center justify-center text-slate-500 shrink-0 ml-2">
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                openSection === 'pts' ? 'rotate-0' : '-rotate-90'
              }`}
            />
          </div>
        </button>

        {openSection === 'pts' && (
          <div className="px-4 sm:px-5 pb-5 pt-3 flex flex-col gap-4 sm:gap-4.5 border-t border-[#f1f5f9]">
            {/* Mode switch (all vs custom) */}
            <div className="flex bg-[#f1f5f9] p-1 rounded-xl border border-[#e2e8f0]">
              <button
                type="button"
                onClick={() => onChange({ mode: 'all' })}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all text-center cursor-pointer select-none ${
                  params.mode === 'all'
                    ? 'bg-white text-[#2563eb] shadow-xs'
                    : 'text-[#64748b] hover:text-[#0f172a]'
                }`}
              >
                {t.modeAll}
              </button>
              <button
                type="button"
                onClick={() => onChange({ mode: 'custom' })}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all text-center cursor-pointer select-none ${
                  params.mode === 'custom'
                    ? 'bg-white text-[#2563eb] shadow-xs'
                    : 'text-[#64748b] hover:text-[#0f172a]'
                }`}
              >
                {t.modeCustom}
              </button>
            </div>

            {params.mode === 'all' ? (
              <>
                {/* Base points per layer (multiple of 3) */}
                <div>
                  <div className="flex justify-between items-center text-xs font-semibold text-[#475569] mb-1.5">
                    <label htmlFor="basePts">{t.basePoints}</label>
                    <span className="text-[11px] text-[#2563eb] font-semibold">
                      {params.rawBase / 3} {t.pointsPerHead}
                    </span>
                  </div>
                  <NumberStepper
                    id="basePts"
                    value={params.rawBase}
                    min={3}
                    max={120}
                    step={3}
                    onChange={(val) => onChange({ rawBase: sanitizeN(val) })}
                  />
                  <p className="text-[11px] text-[#64748b] mt-1 font-mono">
                    {lang === 'ar'
                      ? `خطوة دوران السيرفو للرأس الواحد = ${(360 / params.rawBase).toFixed(2)}°`
                      : `Pas de rotation du servo par tête = ${(360 / params.rawBase).toFixed(2)}°`}
                  </p>
                </div>

                {/* Progressive offset angle */}
                <div>
                  <div className="flex justify-between items-center text-xs font-semibold text-[#475569] mb-1.5">
                    <label htmlFor="addAngle">{t.offsetAngle}</label>
                    <span className="text-[11px] text-[#64748b]">{params.addAngle}°</span>
                  </div>
                  <NumberStepper
                    id="addAngle"
                    value={params.addAngle}
                    min={-90}
                    max={90}
                    step={0.5}
                    unit="°"
                    onChange={(val) => onChange({ addAngle: val })}
                  />
                  <p className="text-[11px] text-[#64748b] mt-1">
                    {lang === 'ar'
                      ? `الطبقة i تُزاح بمقدار i × ${params.addAngle}° لمنع اصطفاف الثقوب خطياً وتحقيق مظهر دوامي.`
                      : `La couche i est décalée de i × ${params.addAngle}° pour éviter l'alignement radial et créer un motif régulier.`}
                  </p>
                </div>
              </>
            ) : (
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-3 sm:p-4 flex flex-col gap-3">
                <span className="text-xs font-semibold text-[#475569]">
                  {t.customModeHeader}
                </span>
                <div className="flex flex-col gap-3 divide-y divide-[#e2e8f0]">
                  {Array.from({ length: params.layers }).map((_, idx) => {
                    const c = params.custom[idx] || {
                      n: params.rawBase,
                      off: idx * params.addAngle,
                    };
                    const color = LAYER_COLORS[idx % LAYER_COLORS.length];

                    return (
                      <div key={idx} className="pt-3 first:pt-0 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span
                            className="font-bold text-xs flex items-center gap-1.5"
                            style={{ color }}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full inline-block"
                              style={{ backgroundColor: color }}
                            />
                            {lang === 'ar' ? `الطبقة L${idx + 1}` : `Couche L${idx + 1}`}
                          </span>
                          <span className="text-[11px] font-mono text-[#64748b]">
                            {t.customModeStepAngle} {(360 / c.n).toFixed(1)}°
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
                          <div>
                            <span className="text-[10px] text-[#64748b] block mb-1">
                              {t.customModePoints} (n)
                            </span>
                            <NumberStepper
                              value={c.n}
                              min={3}
                              max={120}
                              step={3}
                              size="small"
                              onChange={(val) => handleCustomLayerPoints(idx, val)}
                            />
                          </div>

                          <div>
                            <span className="text-[10px] text-[#64748b] block mb-1">
                              {t.customModeStepAngle} (°)
                            </span>
                            <NumberStepper
                              value={Math.round((c.stepAngle || 360 / c.n) * 10) / 10}
                              min={3}
                              max={120}
                              step={0.5}
                              size="small"
                              onChange={(val) => handleCustomLayerStepAngle(idx, val)}
                            />
                          </div>

                          <div>
                            <span className="text-[10px] text-[#64748b] block mb-1">
                              {t.customModeOffset} (°)
                            </span>
                            <NumberStepper
                              value={c.off}
                              min={-90}
                              max={90}
                              step={0.5}
                              size="small"
                              onChange={(val) => handleCustomLayerOffset(idx, val)}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Card: Cycle Timing (TouchWin PLC) */}
      <div className="oneui-card overflow-hidden transition-all border border-slate-200/90 shadow-2xs hover:shadow-xs">
        <button
          type="button"
          onClick={() => toggleSection('timing')}
          className="w-full flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4.5 cursor-pointer hover:bg-slate-50/80 transition-colors text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#4f46e5] shrink-0 shadow-2xs">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex flex-col text-left">
              <h2 className="text-sm font-bold text-[#0f172a] truncate">{t.cardTimingTitle}</h2>
              <span className="text-[11px] font-mono text-[#64748b] truncate mt-0.5">
                Dwell {(params.timing.dwell / 1000).toFixed(2)}s • Rot {params.rotationSpeedHz || 800} Hz • Exp {params.expansionSpeedHz || 800} Hz
              </span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-xl bg-slate-100/80 flex items-center justify-center text-slate-500 shrink-0 ml-2">
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                openSection === 'timing' ? 'rotate-0' : '-rotate-90'
              }`}
            />
          </div>
        </button>

        {openSection === 'timing' && (
          <div className="px-4 sm:px-5 pb-5 pt-3 flex flex-col gap-4 sm:gap-4.5 border-t border-[#f1f5f9]">
            {/* Deflower time (s / ms) */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-[#475569] mb-1.5">
                <label>{t.deflowerTime}</label>
                <span className="font-mono text-[#2563eb] text-[11px] font-bold">
                  {(params.timing.dwell / 1000).toFixed(2)} S ({params.timing.dwell} ms)
                </span>
              </div>
              <NumberStepper
                value={params.timing.dwell}
                min={10}
                max={5000}
                step={10}
                unit="ms"
                size="small"
                onChange={(val) =>
                  onChange({
                    timing: { ...params.timing, dwell: Math.max(10, val) },
                  })
                }
              />
            </div>

            {/* Speeds in Hz */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#475569] mb-1.5">
                  {t.rotSpeed}
                </label>
                <NumberStepper
                  value={params.rotationSpeedHz || 800}
                  min={100}
                  max={5000}
                  step={50}
                  unit="Hz"
                  size="small"
                  onChange={(val) =>
                    onChange({
                      rotationSpeedHz: Math.max(100, val),
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#475569] mb-1.5">
                  {t.expSpeed}
                </label>
                <NumberStepper
                  value={params.expansionSpeedHz || 800}
                  min={100}
                  max={5000}
                  step={50}
                  unit="Hz"
                  size="small"
                  onChange={(val) =>
                    onChange({
                      expansionSpeedHz: Math.max(100, val),
                    })
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#475569] mb-1.5">
                {t.layerTransferTime}
              </label>
              <NumberStepper
                value={params.timing.layer}
                min={50}
                max={15000}
                step={50}
                unit="ms"
                size="small"
                onChange={(val) =>
                  onChange({
                    timing: { ...params.timing, layer: Math.max(50, val) },
                  })
                }
              />
            </div>

            {/* Calibrated Mechanical Servo Settling / Acceleration Ramps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5 border-t border-[#f1f5f9]">
              <div>
                <label className="block text-[11px] font-semibold text-[#475569] mb-1.5">
                  {lang === 'ar' ? 'استقرار التمدد الشعاعي' : 'Ramp expansion (settling)'}
                </label>
                <NumberStepper
                  value={Math.round((params.timing.rampExpansionSec ?? 0.08) * 1000)}
                  min={0}
                  max={500}
                  step={5}
                  unit="ms"
                  size="small"
                  onChange={(val) =>
                    onChange({
                      timing: {
                        ...params.timing,
                        rampExpansionSec: Number((val / 1000).toFixed(3)),
                      },
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#475569] mb-1.5">
                  {lang === 'ar' ? 'استقرار تدوير الرأس' : 'Ramp rotation (settling)'}
                </label>
                <NumberStepper
                  value={Math.round((params.timing.rampRotationSec ?? 0.035) * 1000)}
                  min={0}
                  max={300}
                  step={5}
                  unit="ms"
                  size="small"
                  onChange={(val) =>
                    onChange({
                      timing: {
                        ...params.timing,
                        rampRotationSec: Number((val / 1000).toFixed(3)),
                      },
                    })
                  }
                />
              </div>
            </div>

            <p className="text-[11px] text-[#64748b] leading-relaxed">
              {t.timingNote}
            </p>
          </div>
        )}
      </div>

      {/* Generous bottom margin for comfortable mobile drawer scrolling */}
      <div className="h-12 sm:h-10 w-full shrink-0" aria-hidden="true" />
    </div>
  );
};
