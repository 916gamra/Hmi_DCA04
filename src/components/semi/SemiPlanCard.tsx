import React from 'react';
import {
  Route,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  LocateFixed,
} from 'lucide-react';
import { ExecutionPlan } from '../../core/plan';
import { Translations } from '../../core/i18n';
import { SemiCardAccordion } from './SemiCardAccordion';

interface SemiPlanCardProps {
  isOpen: boolean;
  onToggle: () => void;
  t: Translations;
  isAr: boolean;
  executionPlan: ExecutionPlan;
  camPlaybackStep: number | null;
  isPlayingCam: boolean;
  onSetCamPlaybackStep: (step: number | null) => void;
  onStepPrev: () => void;
  onStepNext: () => void;
  onTogglePlayCam: () => void;
  onSyncMachineToStep: (stepIdx: number) => void;
  onExitPreview: () => void;
}

export const SemiPlanCard: React.FC<SemiPlanCardProps> = ({
  isOpen,
  onToggle,
  t,
  isAr,
  executionPlan,
  camPlaybackStep,
  isPlayingCam,
  onSetCamPlaybackStep,
  onStepPrev,
  onStepNext,
  onTogglePlayCam,
  onSyncMachineToStep,
  onExitPreview,
}) => {
  return (
    <SemiCardAccordion
      isOpen={isOpen}
      onToggle={onToggle}
      title={t.executionPlanTitle}
      icon={<Route className="w-4 h-4 text-indigo-600" />}
    >
      <div className="flex flex-col gap-2.5">
        <span className="text-[11px] text-slate-500 leading-tight">
          {t.executionPlanSubtitle}
        </span>

        {/* KPIs Grid */}
        <div className="grid grid-cols-2 gap-1.5 text-center">
          <div className="p-2 bg-indigo-50/80 rounded-xl border border-indigo-100">
            <span className="text-[9px] font-bold text-indigo-600 block">{t.planTotalPlunges}</span>
            <span className="text-xs font-mono font-extrabold text-indigo-900">
              {executionPlan.totalPlunges}
              <span className="text-[10px] text-indigo-500 font-normal"> ({executionPlan.totalHoles})</span>
            </span>
          </div>
          <div className="p-2 bg-emerald-50/80 rounded-xl border border-emerald-100">
            <span className="text-[9px] font-bold text-emerald-600 block">{t.planYoYoEliminated}</span>
            <span className="text-xs font-mono font-extrabold text-emerald-800">
              {executionPlan.yoYoReversalsEliminated} {isAr ? 'ارتداد' : 'évités'}
            </span>
          </div>
          <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[9px] font-bold text-slate-500 block">{t.planTotalBands}</span>
            <span className="text-xs font-mono font-extrabold text-slate-800">
              {executionPlan.totalBands} {isAr ? 'أشرطة' : 'bandes'}
            </span>
          </div>
          <div className="p-2 bg-blue-50/80 rounded-xl border border-blue-100">
            <span className="text-[9px] font-bold text-blue-600 block">{t.planRadialTravel}</span>
            <span className="text-xs font-mono font-extrabold text-blue-900">
              {executionPlan.totalRadialTravelMm} mm
            </span>
          </div>
        </div>



        {/* Bands Chips */}
        {executionPlan.bands.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {executionPlan.bands.map((band) => (
              <span
                key={band.bandIndex}
                className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center gap-1"
              >
                <span className="font-bold text-indigo-700">B{band.bandIndex}:</span>
                <span>{band.nominalR}mm</span>
                <span className="text-[9px] text-slate-500 font-sans">({band.matchingLayerName})</span>
              </span>
            ))}
          </div>
        )}

        {/* Empty state or Steps List */}
        {executionPlan.steps.length === 0 ? (
          <div className="p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400">
            {t.planNoHolesMessage}
          </div>
        ) : (
          <div className="flex flex-col gap-1 max-h-56 overflow-y-auto pr-1 text-[11px] font-mono scrollbar-thin">
            <div className="grid grid-cols-12 gap-1 px-1.5 py-1 bg-slate-100 rounded-lg font-bold text-[9px] text-slate-600 sticky top-0 uppercase">
              <span className="col-span-1 text-center">{t.planStepColExec}</span>
              <span className="col-span-2">{t.planStepColBand}</span>
              <span className="col-span-3">{t.planStepColRadius}</span>
              <span className="col-span-3">{t.planStepColTheta}</span>
              <span className="col-span-3 text-right">{t.planStepColCommand}</span>
            </div>
            {executionPlan.steps.map((st) => {
              const isActive = camPlaybackStep === st.stepIndex;
              return (
                <div
                  key={st.stepIndex}
                  onClick={() => onSetCamPlaybackStep(st.stepIndex)}
                  className={`grid grid-cols-12 gap-1 px-1.5 py-1 rounded-lg border transition-all cursor-pointer items-center ${
                    isActive
                      ? 'bg-indigo-100/90 border-indigo-400 shadow-2xs ring-2 ring-indigo-300'
                      : 'bg-white border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30'
                  }`}
                >
                  <span className="col-span-1 text-center font-bold text-indigo-700 flex items-center justify-center gap-0.5">
                    {st.stepIndex}
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />}
                  </span>
                  <span className="col-span-2 text-[10px] text-slate-600 font-semibold truncate">
                    B{st.bandIndex} <span className="text-[9px] text-slate-400">({st.matchingLayerName})</span>
                  </span>
                  <span className="col-span-3 font-semibold text-emerald-700">
                    {st.rMm}mm
                  </span>
                  <span className="col-span-3 text-blue-700">
                    {st.thetaDeg}°
                  </span>
                  <span className="col-span-3 text-right text-[10px] text-slate-500 truncate">
                    {st.stepIndex === 1
                      ? (isAr ? 'بدء (Start)' : 'Départ')
                      : `${st.rPulses > 0 ? `R-(${st.rPulses}) ` : ''}${st.thetaPulses > 0 ? `T+(${st.thetaPulses})` : ''}` || '—'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SemiCardAccordion>
  );
};
