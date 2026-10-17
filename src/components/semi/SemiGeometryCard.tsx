import React from 'react';
import { Disc, Sliders } from 'lucide-react';
import { Translations } from '../../core/i18n';
import { fmt } from '../../core/model';
import { NumberStepper } from '../NumberStepper';
import { SemiCardAccordion } from './SemiCardAccordion';

interface SemiGeometryCardProps {
  isOpen: boolean;
  onToggle: () => void;
  t: Translations;
  trayDMm: number;
  marginMm: number;
  layersCount: number;
  rLastDiameterMm: number;
  r1: number;
  rLastR: number;
  sMm: number;
  stepRadialMm: number;
  onSetTrayDMm: (val: number) => void;
  onSetMarginMm: (val: number) => void;
  onSetLayersCount: (val: number) => void;
  onSetRLastDiameterMm: (val: number) => void;
}

export const SemiGeometryCard: React.FC<SemiGeometryCardProps> = ({
  isOpen,
  onToggle,
  t,
  trayDMm,
  marginMm,
  layersCount,
  rLastDiameterMm,
  r1,
  rLastR,
  sMm,
  stepRadialMm,
  onSetTrayDMm,
  onSetMarginMm,
  onSetLayersCount,
  onSetRLastDiameterMm,
}) => {
  return (
    <SemiCardAccordion
      isOpen={isOpen}
      onToggle={onToggle}
      title={t.cardSemiGeoTitle}
      icon={<Disc className="w-4 h-4 text-blue-600" />}
    >
      {/* Tray Diameter */}
      <div>
        <label className="block text-[11px] font-semibold text-[#475569] mb-1">
          {t.trayDiameter} (Ø)
        </label>
        <NumberStepper
          value={trayDMm}
          min={100}
          max={1200}
          step={10}
          unit="mm"
          onChange={(val) => onSetTrayDMm(Math.max(100, val))}
        />
      </div>

      {/* Margin from Rim */}
      <div>
        <label className="block text-[11px] font-semibold text-[#475569] mb-1">
          {t.margin} (M)
        </label>
        <NumberStepper
          value={marginMm}
          min={0}
          max={150}
          step={1}
          unit="mm"
          onChange={(val) => onSetMarginMm(Math.max(0, val))}
        />
      </div>

      {/* Number of concentric layers (1..7) */}
      <div>
        <label className="block text-[11px] font-semibold text-[#475569] mb-1">
          {t.layersCount} (1–7)
        </label>
        <NumberStepper
          value={layersCount}
          min={1}
          max={7}
          step={1}
          unit=""
          onChange={(val) => onSetLayersCount(Math.max(1, Math.min(7, Math.round(val))))}
        />
      </div>

      {/* Last / Innermost Layer Diameter */}
      <div>
        <label className="block text-[11px] font-semibold text-[#475569] mb-1">
          {t.lastLayerD} (D_last)
        </label>
        <NumberStepper
          value={rLastDiameterMm}
          min={10}
          max={Math.max(20, Math.round(r1 * 2))}
          step={5}
          unit="mm"
          onChange={(val) => onSetRLastDiameterMm(Math.max(10, val))}
        />
      </div>

      {/* Derived Spacing s (Read-Only Badge) */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 border border-slate-200">
        <div>
          <span className="text-xs font-bold text-slate-800 block">
            {t.spacing} (s)
          </span>
          <span className="text-[10px] text-slate-500 block">
            {t.derivedSpacingBadge}
          </span>
        </div>
        <span className="text-xs font-mono font-extrabold text-blue-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
          {fmt(sMm, 1)} mm
        </span>
      </div>

      {/* Assistant Indicator: Presses between layers N ≈ s / stepRadial */}
      {layersCount > 1 && sMm > 0 && (
        <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs flex flex-col gap-1.5">
          <div className="flex items-center justify-between font-bold text-slate-800">
            <span className="flex items-center gap-1.5 text-blue-900 text-[11px] sm:text-xs">
              <Sliders className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>
                {t.radialPressesHelper
                  .replace('{s}', fmt(sMm, 1))
                  .replace('{n}', String(Number((sMm / Math.max(0.1, stepRadialMm)).toFixed(1))))
                  .replace('{step}', String(stepRadialMm))}
              </span>
            </span>
            <span className="font-mono text-xs font-extrabold text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-200 shrink-0 shadow-2xs">
              ≈ {(sMm / Math.max(0.1, stepRadialMm)).toFixed(1)} × r±
            </span>
          </div>
          <span className="text-[10px] text-slate-500 leading-tight">
            {t.stepVsSpacingNote}
          </span>
        </div>
      )}

      {/* Summary pill of R1 and R_last */}
      <div className="p-2 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] font-mono text-blue-900 flex justify-between">
        <span>R₁ = {fmt(r1, 1)} mm</span>
        <span>R_last = {fmt(rLastR, 1)} mm</span>
      </div>
    </SemiCardAccordion>
  );
};
