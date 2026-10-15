import React from 'react';
import { Play, Pause, RotateCcw, ChevronRight, ChevronLeft, Gauge, Activity, BookmarkPlus, QrCode } from 'lucide-react';
import { SimulationState, TrayModel } from '../types';
import { fmtTime } from '../core/timeline';
import { Translations, Language, translations } from '../core/i18n';

interface SimulationControlsProps {
  model: TrayModel;
  state: SimulationState | null;
  currentTimeMs: number;
  totalTimeMs: number;
  isPlaying: boolean;
  speed: number;
  onTogglePlay: () => void;
  onReset: () => void;
  onStepNext: () => void;
  onStepPrev: () => void;
  onScrubTime: (targetMs: number) => void;
  onChangeSpeed: (spd: number) => void;
  onOpenSaveModal: () => void;
  onOpenQr: () => void;
  t?: Translations;
  lang?: Language;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  model,
  state,
  currentTimeMs,
  totalTimeMs,
  isPlaying,
  speed,
  onTogglePlay,
  onReset,
  onStepNext,
  onStepPrev,
  onScrubTime,
  onChangeSpeed,
  onOpenSaveModal,
  onOpenQr,
  t: propT,
  lang = 'ar',
}) => {
  const t = propT || translations[lang];
  const progressPercent = totalTimeMs > 0 ? (currentTimeMs / totalTimeMs) * 100 : 0;

  // Derive active status text
  let phaseText = t.simStatusReady;
  let activeLayerIndex = 0;
  let activeStepIndex = 0;
  let maxStepForLayer = 1;

  if (state && state.cur) {
    activeLayerIndex = state.cur.layer;
    activeStepIndex = state.cur.j !== undefined ? state.cur.j + 1 : 1;
    const currentLayer = model.layers[activeLayerIndex];
    if (currentLayer) {
      maxStepForLayer = currentLayer.per;
    }

    if (state.done) {
      phaseText = t.simStatusDone;
    } else {
      switch (state.cur.type) {
        case 'repos':
          phaseText = t.phaseRadialMove;
          break;
        case 'index':
          phaseText = t.phaseAngularStep;
          break;
        case 'fire':
          phaseText = t.phaseDrillingTrio;
          break;
      }
    }
  }

  const completedHoles = state
    ? model.layers.reduce((sum, L) => {
        const count = state.counts[L.i] || 0;
        return sum + L.pts.filter((pt) => pt.j < count && pt.fired !== false).length;
      }, 0)
    : 0;

  return (
    <div className="bg-white/95 border border-[#e2e8f0] rounded-2xl sm:rounded-3xl p-2.5 sm:p-3.5 shadow-xs flex flex-col gap-2 select-none" dir="ltr">
      {/* 1. Control Buttons Row (Strict LTR French Layout) */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Play / Pause Primary Button */}
          <button
            type="button"
            onClick={onTogglePlay}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold text-white transition-all cursor-pointer select-none active:scale-95 shadow-xs ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                : 'bg-[#2563eb] hover:bg-[#1d4ed8] shadow-[#2563eb]/20'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-white" />
                <span>{t.btnPause}</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>{t.btnPlay}</span>
              </>
            )}
          </button>

          {/* Step Back button (Chevron pointing Left in LTR) */}
          <button
            type="button"
            onClick={onStepPrev}
            className="flex items-center gap-1 px-2.5 py-2 rounded-2xl text-xs font-semibold text-[#475569] bg-[#f1f5f9] hover:bg-[#e2e8f0] border border-[#cbd5e1]/60 transition-all cursor-pointer select-none active:scale-95"
            title={t.btnPrevStep}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">− 1</span>
          </button>

          {/* Step Forward button (Chevron pointing Right in LTR) */}
          <button
            type="button"
            onClick={onStepNext}
            className="flex items-center gap-1 px-2.5 py-2 rounded-2xl text-xs font-semibold text-[#475569] bg-[#f1f5f9] hover:bg-[#e2e8f0] border border-[#cbd5e1]/60 transition-all cursor-pointer select-none active:scale-95"
            title={t.btnNextStep}
          >
            <span className="hidden sm:inline">+ 1</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Reset button */}
          <button
            type="button"
            onClick={onReset}
            className="p-2 rounded-2xl text-[#64748b] bg-[#f1f5f9] hover:bg-[#e2e8f0] border border-[#cbd5e1]/60 transition-all cursor-pointer select-none active:scale-95"
            title={t.btnResetSim}
            aria-label={t.btnResetSim}
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Capsule Divider */}
          <div className="h-4.5 w-px bg-[#cbd5e1]/70 mx-0.5" />

          {/* Save Article / Recipe capsule icon button */}
          <button
            type="button"
            onClick={onOpenSaveModal}
            className="p-2 rounded-2xl text-[#2563eb] bg-blue-50 hover:bg-blue-100 border border-blue-200/80 transition-all cursor-pointer select-none active:scale-95 shadow-2xs"
            title={t.btnSaveArticle}
            aria-label={t.btnSaveArticle}
          >
            <BookmarkPlus className="w-4 h-4" />
          </button>

          {/* QR Code capsule icon button */}
          <button
            type="button"
            onClick={onOpenQr}
            className="p-2 rounded-2xl text-[#0f172a] bg-[#f1f5f9] hover:bg-[#e2e8f0] border border-[#cbd5e1]/60 transition-all cursor-pointer select-none active:scale-95 shadow-2xs"
            title={t.btnGenerateQr}
            aria-label="QR Code"
          >
            <QrCode className="w-4 h-4" />
          </button>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1.5 bg-[#f1f5f9] px-2.5 py-1.5 rounded-2xl border border-[#cbd5e1]/60">
          <Gauge className="w-3.5 h-3.5 text-[#2563eb]" />
          <span className="text-xs font-bold text-[#475569]">{t.speed}:</span>
          <select
            value={speed}
            onChange={(e) => onChangeSpeed(parseFloat(e.target.value))}
            className="bg-transparent font-mono text-xs font-bold text-[#0f172a] focus:outline-none cursor-pointer"
          >
            <option value={0.5}>0.5×</option>
            <option value={1}>1.0×</option>
            <option value={2}>2.0×</option>
            <option value={5}>5.0×</option>
            <option value={10}>10.0×</option>
            <option value={25}>25.0×</option>
          </select>
        </div>
      </div>

      {/* 2. Timeline Scrubber Range Slider */}
      <div className="flex flex-col gap-1" dir="ltr">
        <div className="relative flex items-center">
          <input
            type="range"
            min={0}
            max={totalTimeMs || 1000}
            value={currentTimeMs}
            onChange={(e) => onScrubTime(parseFloat(e.target.value))}
            className="w-full h-2 bg-[#e2e8f0] rounded-lg appearance-none cursor-pointer accent-[#2563eb]"
          />
        </div>
        <div className="flex justify-between items-center text-[11px] font-mono font-semibold text-[#64748b] px-0.5">
          <span>{fmtTime(currentTimeMs)}</span>
          <span className="text-xs font-bold text-[#2563eb]">
            {progressPercent.toFixed(0)}%
          </span>
          <span>{fmtTime(totalTimeMs)}</span>
        </div>
      </div>

      {/* 3. Live Telemetry & Phase Information */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#f1f5f9] text-xs text-left">
        <div className="flex items-center gap-1.5 text-[#475569]">
          <Activity className="w-3.5 h-3.5 text-[#2563eb]" />
          <span className="font-semibold">{t.phaseLabel}</span>
          <span className="font-bold text-[#0f172a]">{phaseText}</span>
        </div>

        <div className="flex items-center gap-3 text-[#64748b] text-[11px] font-mono">
          <div>
            <span>{t.layerLabel}</span>
            <strong className="text-[#0f172a]">
              L{activeLayerIndex + 1}/{model.layers.length}
            </strong>
          </div>
          <div>
            <span>{t.stepLabel}</span>
            <strong className="text-[#0f172a]">
              {activeStepIndex}/{maxStepForLayer}
            </strong>
          </div>
          <div>
            <span>{t.holesLabel}</span>
            <strong className="text-[#059669]">
              {completedHoles}/{model.totalDrilled !== undefined ? model.totalDrilled : model.totalPts}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
};
