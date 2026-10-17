import React from 'react';
import {
  LocateFixed,
  X,
  SkipBack,
  SkipForward,
  Play,
  Pause,
} from 'lucide-react';
import { PlanStep } from '../../core/plan';
import { Translations } from '../../core/i18n';

interface SemiCamActiveBannerProps {
  activePlaybackStep: PlanStep | null;
  totalPlunges: number;
  isPlayingCam: boolean;
  isAr: boolean;
  t: Translations;
  onSyncMachine: (stepIdx: number) => void;
  onClose: () => void;
  onPrevStep: () => void;
  onNextStep: () => void;
  onTogglePlay: () => void;
}

export const SemiCamActiveBanner: React.FC<SemiCamActiveBannerProps> = ({
  activePlaybackStep,
  totalPlunges,
  isPlayingCam,
  isAr,
  t,
  onSyncMachine,
  onClose,
  onPrevStep,
  onNextStep,
  onTogglePlay,
}) => {
  if (!activePlaybackStep) return null;

  return (
    <div className="flex-none p-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-lg border border-indigo-500/40 flex flex-col gap-2.5 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs font-bold font-mono tracking-wide text-cyan-300">
            {isAr
              ? `مسار CAM: خطوة ${activePlaybackStep.stepIndex} من ${totalPlunges}`
              : `Pas CAM: ${activePlaybackStep.stepIndex} / ${totalPlunges}`}
          </span>
          <span className="text-[10px] font-mono bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full border border-indigo-400/30">
            B{activePlaybackStep.bandIndex} ({activePlaybackStep.matchingLayerName})
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onSyncMachine(activePlaybackStep.stepIndex)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-2xs cursor-pointer active:scale-95 transition-all"
            title={t.camJumpMachineBtn}
          >
            <LocateFixed className="w-3.5 h-3.5" />
            <span>{isAr ? 'مزامنة الآلة' : 'Aligner'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title={t.camExitPreviewBtn}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center pt-1.5 border-t border-white/10 text-xs">
        {/* Step movement instructions */}
        <div className="sm:col-span-2 flex items-center flex-wrap gap-2 font-mono text-[11px] text-slate-200">
          <span className="text-cyan-400 font-extrabold">r = {activePlaybackStep.rMm}mm</span>
          <span className="text-slate-500">|</span>
          <span className="text-blue-300 font-extrabold">θ = {activePlaybackStep.thetaDeg}°</span>
          <span className="text-slate-500">|</span>
          <span className="text-amber-300 font-semibold truncate">
            {activePlaybackStep.stepIndex === 1
              ? (isAr ? 'بدء الحفر (الحلقة الخارجية)' : 'Départ anneau externe')
              : `${activePlaybackStep.rPulses > 0 ? `R-(${activePlaybackStep.rPulses} نقرة) ` : 'نفس القطر '}${activePlaybackStep.thetaPulses > 0 ? `T+(${activePlaybackStep.thetaPulses} نقرة) ` : ''}→ حفر P`}
          </span>
        </div>

        {/* Quick step controls */}
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={onPrevStep}
            disabled={activePlaybackStep.stepIndex === 1}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 cursor-pointer text-white"
            title={t.camPrevStepBtn}
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onTogglePlay}
            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 cursor-pointer text-white font-bold flex items-center gap-1 shadow-2xs"
          >
            {isPlayingCam ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
          </button>
          <button
            type="button"
            onClick={onNextStep}
            disabled={activePlaybackStep.stepIndex === totalPlunges}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 cursor-pointer text-white"
            title={t.camNextStepBtn}
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
