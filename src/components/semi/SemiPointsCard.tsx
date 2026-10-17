import React from 'react';
import { Compass, Hash, Target } from 'lucide-react';
import { Translations } from '../../core/i18n';
import { fmt } from '../../core/model';
import { LAYER_COLORS } from '../../core/constants';
import { NumberStepper } from '../NumberStepper';
import { SemiCardAccordion } from './SemiCardAccordion';

interface SemiPointsCardProps {
  isOpen: boolean;
  onToggle: () => void;
  t: Translations;
  isAr: boolean;
  nPoints: number;
  stepAngleDeg: number;
  numberingMode: 'cam' | 'layer' | 'global';
  stepRadialMm: number;
  layersCount: number;
  sMm: number;
  currentLayer: number;
  ringRadii: number[];
  onSetNPoints: (val: number) => void;
  onSetNumberingMode: (mode: 'cam' | 'layer' | 'global') => void;
  onSetStepRadialMm: (val: number) => void;
  onSetCurrentLayer: (layer: number) => void;
  onJumpToLayerRadius: (layer: number) => void;
}

export const SemiPointsCard: React.FC<SemiPointsCardProps> = ({
  isOpen,
  onToggle,
  t,
  isAr,
  nPoints,
  stepAngleDeg,
  numberingMode,
  stepRadialMm,
  layersCount,
  sMm,
  currentLayer,
  ringRadii,
  onSetNPoints,
  onSetNumberingMode,
  onSetStepRadialMm,
  onSetCurrentLayer,
  onJumpToLayerRadius,
}) => {
  return (
    <SemiCardAccordion
      isOpen={isOpen}
      onToggle={onToggle}
      title={t.cardSemiPtsTitle}
      icon={<Compass className="w-4 h-4 text-emerald-600" />}
    >
      {/* Points count per circle n (multiple of 3) */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-[11px] font-semibold text-[#475569]">
            {t.nPointsCircleLabel}
          </label>
          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-bold">
            n = {nPoints} {t.ptsPerTurn}
          </span>
        </div>
        <NumberStepper
          value={nPoints}
          min={3}
          max={120}
          step={3}
          unit=""
          onChange={(val) => onSetNPoints(Math.max(3, Math.round(val)))}
        />
      </div>

      {/* Derived Indexing Angle step θ */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
        <div>
          <span className="text-xs font-bold text-emerald-900 block">
            {t.stepAngleIndexingLabel}
          </span>
          <span className="text-[10px] text-emerald-700 block">
            360° / {nPoints}
          </span>
        </div>
        <span className="text-xs font-mono font-extrabold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
          {stepAngleDeg}°
        </span>
      </div>

      {/* Numbering Scheme Selector: CAM (Outer->Inner) vs Per-Layer (1..n) vs Global Continuous (1..N) */}
      <div className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
        <div className="flex justify-between items-center">
          <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-indigo-600" />
            <span>{t.numberingModeLabel}</span>
          </label>
          <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 font-bold">
            {numberingMode === 'cam' ? 'CAM (خارج←داخل)' : numberingMode === 'layer' ? '1 .. n' : '1 .. N'}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-200/70 rounded-lg">
          <button
            type="button"
            onClick={() => onSetNumberingMode('cam')}
            className={`py-1.5 px-1 text-[10px] font-bold rounded-md transition-all cursor-pointer text-center truncate ${
              numberingMode === 'cam'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title={t.numberingModeCam}
          >
            {isAr ? 'مسار CAM' : 'Mode CAM'}
          </button>
          <button
            type="button"
            onClick={() => onSetNumberingMode('layer')}
            className={`py-1.5 px-1 text-[10px] font-bold rounded-md transition-all cursor-pointer text-center truncate ${
              numberingMode === 'layer'
                ? 'bg-white text-blue-700 shadow-2xs ring-1 ring-blue-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.numberingModeLayer}
          </button>
          <button
            type="button"
            onClick={() => onSetNumberingMode('global')}
            className={`py-1.5 px-1 text-[10px] font-bold rounded-md transition-all cursor-pointer text-center truncate ${
              numberingMode === 'global'
                ? 'bg-white text-blue-700 shadow-2xs ring-1 ring-blue-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.numberingModeGlobal}
          </button>
        </div>
        <span className="text-[10px] text-slate-500 leading-tight">
          {t.numberingModeHint}
        </span>
      </div>

      {/* Jog step for r± remote button ONLY */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-[11px] font-semibold text-[#475569]">
            {t.stepRadialLabel} (r±)
          </label>
          {layersCount > 1 && sMm > 0 && (
            <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
              {fmt(sMm, 1)}mm ÷ {stepRadialMm}mm = {(sMm / Math.max(0.1, stepRadialMm)).toFixed(1)} clicks
            </span>
          )}
        </div>
        <NumberStepper
          value={stepRadialMm}
          min={1}
          max={100}
          step={1}
          unit="mm"
          onChange={(val) => onSetStepRadialMm(Math.max(1, val))}
        />
        <span className="text-[10px] text-slate-400 block mt-1">
          {t.stepVsSpacingNote}
        </span>
      </div>

      {/* Active Layer Selection Pills + Go To Radius button */}
      <div className="flex flex-col gap-2 pt-1 border-t border-slate-200">
        <label className="block text-[11px] font-semibold text-[#475569]">
          {t.layerActiveLabel} (1 .. {layersCount})
        </label>
        <div className="flex flex-wrap gap-1.5">
          {ringRadii.map((ri, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSetCurrentLayer(idx)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                currentLayer === idx
                  ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-400'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: LAYER_COLORS[idx % LAYER_COLORS.length] }}
              />
              <span>L{idx + 1}</span>
              <span className="text-[10px] opacity-75 font-mono">({fmt(ri, 0)}mm)</span>
            </button>
          ))}
        </div>

        {/* Go to active layer radius button */}
        <button
          type="button"
          onClick={() => onJumpToLayerRadius(currentLayer)}
          className="mt-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all cursor-pointer active:scale-98 shadow-2xs"
        >
          <Target className="w-3.5 h-3.5" />
          <span>
            {t.goToLayerRadiusBtn} (r → {fmt(ringRadii[currentLayer] || 0, 1)} mm)
          </span>
        </button>
      </div>
    </SemiCardAccordion>
  );
};
