import React from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, RotateCcw, LocateFixed, Activity } from 'lucide-react';
import { ExecutionPlan } from '../core/plan';
import { Translations, Language } from '../core/i18n';

interface SemiSimulationControlsProps {
  executionPlan: ExecutionPlan;
  camPlaybackStep: number | null;
  isPlayingCam: boolean;
  onSetCamPlaybackStep: (step: number | null) => void;
  onStepPrev: () => void;
  onStepNext: () => void;
  onTogglePlayCam: () => void;
  onSyncMachineToStep: (stepIdx: number) => void;
  onExitPreview: () => void;
  isAr: boolean;
  t: Translations;
  lang: Language;
}

export const SemiSimulationControls: React.FC<SemiSimulationControlsProps> = ({
  executionPlan,
  camPlaybackStep,
  isPlayingCam,
  onSetCamPlaybackStep,
  onStepPrev,
  onStepNext,
  onTogglePlayCam,
  onSyncMachineToStep,
  onExitPreview,
  isAr,
  t,
}) => {
  const totalPlunges = Math.max(1, executionPlan.totalPlunges);
  const currentStep = camPlaybackStep ?? 1;
  const progressPercent = (currentStep / totalPlunges) * 100;

  const activeStep = camPlaybackStep !== null && executionPlan.steps[camPlaybackStep - 1]
    ? executionPlan.steps[camPlaybackStep - 1]
    : null;

  return (
    <div className="bg-white/95 border border-[#e2e8f0] rounded-2xl sm:rounded-3xl p-2.5 sm:p-3.5 shadow-xs flex flex-col gap-2 select-none" dir="ltr">
      {/* 1. Control Buttons Row (Strict LTR Layout matching SimulationControls) */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Play / Pause Primary Button */}
          <button
            type="button"
            onClick={onTogglePlayCam}
            disabled={executionPlan.steps.length === 0}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold text-white transition-all cursor-pointer select-none active:scale-95 shadow-xs disabled:opacity-40 ${
              isPlayingCam
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                : 'bg-[#2563eb] hover:bg-[#1d4ed8] shadow-[#2563eb]/20'
            }`}
          >
            {isPlayingCam ? (
              <>
                <Pause className="w-4 h-4 fill-white" />
                <span>{t.btnPause || t.camPauseBtn}</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>{t.btnPlay || t.camPlayBtn}</span>
              </>
            )}
          </button>

          {/* Step Back button (Chevron pointing Left in LTR - matching Auto SimulationControls) */}
          <button
            type="button"
            onClick={onStepPrev}
            disabled={currentStep <= 1 || executionPlan.steps.length === 0}
            className="flex items-center gap-1 px-2.5 py-2 rounded-2xl text-xs font-semibold text-[#475569] bg-[#f1f5f9] hover:bg-[#e2e8f0] border border-[#cbd5e1]/60 transition-all cursor-pointer select-none active:scale-95 disabled:opacity-40"
            title={t.btnPrevStep || t.camPrevStepBtn}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">− 1</span>
          </button>

          {/* Step Forward button (Chevron pointing Right in LTR - matching Auto SimulationControls) */}
          <button
            type="button"
            onClick={onStepNext}
            disabled={currentStep >= totalPlunges || executionPlan.steps.length === 0}
            className="flex items-center gap-1 px-2.5 py-2 rounded-2xl text-xs font-semibold text-[#475569] bg-[#f1f5f9] hover:bg-[#e2e8f0] border border-[#cbd5e1]/60 transition-all cursor-pointer select-none active:scale-95 disabled:opacity-40"
            title={t.btnNextStep || t.camNextStepBtn}
          >
            <span className="hidden sm:inline">+ 1</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Reset / Exit Preview button */}
          <button
            type="button"
            onClick={onExitPreview}
            className="p-2 rounded-2xl text-[#64748b] bg-[#f1f5f9] hover:bg-[#e2e8f0] border border-[#cbd5e1]/60 transition-all cursor-pointer select-none active:scale-95"
            title={t.camExitPreviewBtn || 'Reset Preview'}
            aria-label="Reset Preview"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Capsule Divider */}
          <div className="h-4.5 w-px bg-[#cbd5e1]/70 mx-0.5" />

          {/* Sync Machine to Step Button */}
          {camPlaybackStep !== null && (
            <button
              type="button"
              onClick={() => onSyncMachineToStep(camPlaybackStep)}
              className="px-3 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 transition-all"
              title={t.camJumpMachineBtn}
            >
              <LocateFixed className="w-4 h-4" />
              <span>{isAr ? 'مزامنة الآلة' : 'Aligner'}</span>
            </button>
          )}
        </div>

        {/* Step Badge Counter */}
        <div className="flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-2xl border border-blue-200">
          <span className="text-xs font-bold text-blue-700 font-mono">
            Step {currentStep} / {totalPlunges}
          </span>
        </div>
      </div>

      {/* 2. Step Scrubber Range Slider */}
      <div className="flex flex-col gap-1" dir="ltr">
        <div className="relative flex items-center">
          <input
            type="range"
            min={1}
            max={totalPlunges}
            value={currentStep}
            onChange={(e) => {
              const nextStep = Number(e.target.value);
              onSetCamPlaybackStep(nextStep);
            }}
            className="w-full h-2 bg-[#e2e8f0] rounded-lg appearance-none cursor-pointer accent-[#2563eb]"
          />
        </div>
        <div className="flex justify-between items-center text-[11px] font-mono font-semibold text-[#64748b] px-0.5">
          <span>1</span>
          <span className="text-xs font-bold text-[#2563eb]">
            {progressPercent.toFixed(0)}%
          </span>
          <span>{totalPlunges}</span>
        </div>
      </div>

      {/* 3. Live Telemetry & Phase Information (Matching SimulationControls layout) */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#f1f5f9] text-xs text-left">
        <div className="flex items-center gap-1.5 text-[#475569]">
          <Activity className="w-3.5 h-3.5 text-[#2563eb]" />
          <span className="font-semibold">{isAr ? 'حالة خطة CAM:' : 'État CAM:'}</span>
          <span className="font-bold text-[#0f172a]">
            {isPlayingCam ? (isAr ? 'تشغيل تلقائي' : 'Lecture auto') : (isAr ? 'معاينة متوقفة' : 'Pause')}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[#64748b] text-[11px] font-mono">
          <div>
            <span>R: </span>
            <strong className="text-[#0f172a]">{activeStep ? `${activeStep.rMm}mm` : '—'}</strong>
          </div>
          <div>
            <span>θ: </span>
            <strong className="text-[#0f172a]">{activeStep ? `${activeStep.thetaDeg}°` : '—'}</strong>
          </div>
          <div>
            <span>Band: </span>
            <strong className="text-[#2563eb]">B{activeStep ? activeStep.bandIndex : '—'}</strong>
          </div>
          <div>
            <span>{t.holesLabel || 'الثقوب'}: </span>
            <strong className="text-[#059669]">{executionPlan.totalHoles}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
