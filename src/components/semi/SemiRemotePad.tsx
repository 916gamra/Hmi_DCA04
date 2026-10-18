import React from 'react';
import {
  RotateCw,
  RotateCcw,
  Compass,
  Zap,
  ArrowDownCircle,
  ArrowUp,
  ArrowDown,
  Gamepad2,
  Maximize2,
  ChevronUp,
  ChevronDown,
  Layers,
  Power,
  Sparkles,
} from 'lucide-react';
import { Translations } from '../../core/i18n';
import { SemiHole } from '../../types';

interface SemiRemotePadProps {
  t: Translations;
  isAr: boolean;
  dwellSec: number;
  stepAngleDeg: number;
  stepRadialMm: number;
  tableZUp: boolean;
  spindleOn: boolean;
  plungeDown: boolean;
  currentLayer: number;
  isMacroDrilling?: boolean;
  onTableStep: (dir: 1 | -1) => void;
  onTableHome: () => void;
  onRadialStep: (dir: 1 | -1) => void;
  onRadialMax: () => void;
  onSetTableZUp: (up: boolean) => void;
  onSetSpindleOn: (on: boolean) => void;
  onPlungeDown: () => void;
  onPlungeUp: () => void;
  onPlungeCancel: () => void;
  lockedDesign: SemiHole[] | null;
  onLockDesign: () => void;
  onUnlockDesign: () => void;
}

export const SemiRemotePad: React.FC<SemiRemotePadProps> = ({
  t,
  isAr,
  dwellSec,
  stepAngleDeg,
  stepRadialMm,
  tableZUp,
  spindleOn,
  plungeDown,
  currentLayer,
  isMacroDrilling = false,
  onTableStep,
  onTableHome,
  onRadialStep,
  onRadialMax,
  onSetTableZUp,
  onSetSpindleOn,
  onPlungeDown,
  onPlungeUp,
  onPlungeCancel,
  lockedDesign,
  onLockDesign,
  onUnlockDesign,
}) => {
  return (
    <div className="oneui-card p-2.5 sm:p-4 flex flex-col gap-2.5 sm:gap-3 select-none" dir="ltr">
      {/* 1. Header (Exact styling match with ValidationCard / KPI Card) */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[#2563eb] shrink-0">
            <Gamepad2 className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-[#0f172a] leading-tight truncate">
              {t.semiAutoTitle}
            </h2>
            <p className="text-[9px] sm:text-[10px] text-[#64748b] leading-tight truncate">
              {t.semiAutoSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[#0f172a] text-[10px] sm:text-[11px] font-mono tabular-nums font-bold border border-slate-200">
            {dwellSec <= 0 ? (isAr ? 'حفر: مستمر (Hold)' : 'Dwell: Hold') : `Dwell: ${dwellSec}s`}
          </span>
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-mono tabular-nums font-bold border transition-colors ${
              spindleOn
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}
          >
            {spindleOn ? 'SPINDLE ON' : 'SPINDLE OFF'}
          </span>
        </div>
      </div>

      {/* 2. Samsung Smart TV Remote Chassis (One UI 8.1 Tactile Control Cluster) */}
      <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-2.5 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
        {/* Left / Center: Samsung Iconic Circular D-Pad Navigation Wheel */}
        <div className="flex flex-col items-center justify-center gap-2 w-full md:w-auto">
          <div className="flex items-center justify-between w-full max-w-[210px] px-1 text-[10px] font-mono font-bold text-[#64748b]">
            <span className="flex items-center gap-1">
              <RotateCw className="w-3 h-3 text-blue-600" />
              <span>±{stepAngleDeg}°</span>
            </span>
            <span className="flex items-center gap-1">
              <ArrowUp className="w-3 h-3 text-emerald-600" />
              <span>±{stepRadialMm}mm</span>
            </span>
          </div>

          {/* Circular Wheel Chassis */}
          <div className="relative w-44 h-44 sm:w-48 sm:h-48 rounded-full bg-white border border-[#cbd5e1] shadow-xs flex items-center justify-center p-1.5 touch-none select-none">
            {/* Top Button: Radial Outward (r +) */}
            <button
              type="button"
              onClick={() => onRadialStep(1)}
              className="absolute top-1 inset-x-12 h-11 rounded-t-full bg-slate-50 hover:bg-emerald-50 active:bg-emerald-100 text-emerald-800 hover:text-emerald-900 border border-transparent hover:border-emerald-200 flex flex-col items-center justify-start pt-1.5 transition-all cursor-pointer active:scale-95 group shadow-2xs"
              title={t.btnRadialPlus}
              aria-label={t.btnRadialPlus}
            >
              <ChevronUp className="w-4 h-4 text-emerald-600 group-hover:-translate-y-0.5 transition-transform" />
              <span className="text-[9px] font-mono font-bold tracking-tight -mt-0.5">r +</span>
            </button>

            {/* Bottom Button: Radial Inward (r -) */}
            <button
              type="button"
              onClick={() => onRadialStep(-1)}
              className="absolute bottom-1 inset-x-12 h-11 rounded-b-full bg-slate-50 hover:bg-emerald-50 active:bg-emerald-100 text-emerald-800 hover:text-emerald-900 border border-transparent hover:border-emerald-200 flex flex-col items-center justify-end pb-1.5 transition-all cursor-pointer active:scale-95 group shadow-2xs"
              title={t.btnRadialMinus}
              aria-label={t.btnRadialMinus}
            >
              <span className="text-[9px] font-mono font-bold tracking-tight -mb-0.5">r −</span>
              <ChevronDown className="w-4 h-4 text-emerald-600 group-hover:translate-y-0.5 transition-transform" />
            </button>

            {/* Left Button: Table Rotation Counter-Clockwise (θ -) */}
            <button
              type="button"
              onClick={() => onTableStep(-1)}
              className="absolute left-1 inset-y-12 w-11 rounded-l-full bg-slate-50 hover:bg-blue-50 active:bg-blue-100 text-blue-800 hover:text-blue-900 border border-transparent hover:border-blue-200 flex items-center justify-start pl-1.5 transition-all cursor-pointer active:scale-95 group shadow-2xs"
              title={t.btnTableMinus}
              aria-label={t.btnTableMinus}
            >
              <RotateCcw className="w-4 h-4 text-blue-600 group-hover:-rotate-12 transition-transform" />
              <span className="text-[9px] font-mono font-bold tracking-tight ml-0.5">θ−</span>
            </button>

            {/* Right Button: Table Rotation Clockwise (θ +) */}
            <button
              type="button"
              onClick={() => onTableStep(1)}
              className="absolute right-1 inset-y-12 w-11 rounded-r-full bg-slate-50 hover:bg-blue-50 active:bg-blue-100 text-blue-800 hover:text-blue-900 border border-transparent hover:border-blue-200 flex items-center justify-end pr-1.5 transition-all cursor-pointer active:scale-95 group shadow-2xs"
              title={t.btnTablePlus}
              aria-label={t.btnTablePlus}
            >
              <span className="text-[9px] font-mono font-bold tracking-tight mr-0.5">θ+</span>
              <RotateCw className="w-4 h-4 text-blue-600 group-hover:rotate-12 transition-transform" />
            </button>

            {/* Center Disc: Table 0° Home */}
            <button
              type="button"
              onClick={onTableHome}
              className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-b from-slate-100 to-slate-200 hover:from-blue-50 hover:to-blue-100 active:from-blue-200 active:to-blue-300 text-[#0f172a] border border-[#cbd5e1] hover:border-blue-300 shadow-sm active:scale-90 transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 z-10"
              title={t.btnTableHome}
              aria-label={t.btnTableHome}
            >
              <Compass className="w-4 h-4 text-blue-600" />
              <span className="text-[9px] sm:text-[10px] font-mono font-extrabold leading-none text-[#0f172a]">
                0° HOME
              </span>
            </button>
          </div>

          {/* Quick Shortcut: Jump to Max Radius (r -> MAX) */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onRadialMax}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs active:scale-95 transition-all cursor-pointer text-[10px] sm:text-[11px] font-bold"
              title={t.btnRadialMax}
            >
              <Maximize2 className="w-3 h-3 text-emerald-600" />
              <span>{t.btnRadialMax}</span>
            </button>
            
            <button
              type="button"
              onClick={lockedDesign ? onUnlockDesign : onLockDesign}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold border transition-all cursor-pointer shadow-2xs active:scale-95 ${
                lockedDesign 
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                  : 'bg-white hover:bg-blue-50 text-blue-800 border-blue-200'
              }`}
              title={lockedDesign ? 'Unlock Design' : 'Lock/Save Design'}
            >
              {lockedDesign ? <Zap className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
              <span>{lockedDesign ? 'Unlock' : 'Save/Lock Design'}</span>
            </button>
          </div>
        </div>

        {/* Right / Side: Samsung Style Rocker Switch Capsules (Table Z & Spindle Motor) */}
        <div className="flex flex-row md:flex-col items-stretch justify-center gap-2.5 sm:gap-3 w-full md:w-48 lg:w-52">
          {/* Capsule 1: Table Z Lift Switch (Samsung Volume/Channel Rocker Style) */}
          <div className="flex-1 bg-white border border-[#cbd5e1]/80 rounded-2xl p-2 sm:p-2.5 flex flex-col gap-1.5 shadow-2xs">
            <div className="flex items-center justify-between text-[#64748b] text-[9px] sm:text-[10px] font-semibold border-b border-[#f1f5f9] pb-1">
              <span className="truncate">{t.tableZLabel}</span>
              <Layers className="w-3 h-3 text-blue-500 shrink-0" />
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => onSetTableZUp(true)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer active:scale-95 border min-h-[44px] ${
                  tableZUp
                    ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
                title={t.btnTableZUp}
              >
                <ArrowUp className={`w-3.5 h-3.5 mb-0.5 ${tableZUp ? 'text-white' : 'text-blue-600'}`} />
                <span>UP</span>
              </button>

              <button
                type="button"
                onClick={() => onSetTableZUp(false)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer active:scale-95 border min-h-[44px] ${
                  !tableZUp
                    ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
                title={t.btnTableZDown}
              >
                <ArrowDown className={`w-3.5 h-3.5 mb-0.5 ${!tableZUp ? 'text-white' : 'text-blue-600'}`} />
                <span>DOWN</span>
              </button>
            </div>
          </div>

          {/* Capsule 2: Spindle Motor Switch (Power Toggle Rocker Style) */}
          <div className="flex-1 bg-white border border-[#cbd5e1]/80 rounded-2xl p-2 sm:p-2.5 flex flex-col gap-1.5 shadow-2xs">
            <div className="flex items-center justify-between text-[#64748b] text-[9px] sm:text-[10px] font-semibold border-b border-[#f1f5f9] pb-1">
              <span className="truncate">{t.spindleLabel}</span>
              <Zap className={`w-3 h-3 shrink-0 ${spindleOn ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => onSetSpindleOn(true)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer active:scale-95 border min-h-[44px] ${
                  spindleOn
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
                title={t.btnSpindleOn}
              >
                <Zap className={`w-3.5 h-3.5 mb-0.5 ${spindleOn ? 'text-white fill-white' : 'text-emerald-600'}`} />
                <span>ON</span>
              </button>

              <button
                type="button"
                onClick={() => onSetSpindleOn(false)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer active:scale-95 border min-h-[44px] ${
                  !spindleOn
                    ? 'bg-slate-800 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
                title={t.btnSpindleOff}
              >
                <Power className={`w-3.5 h-3.5 mb-0.5 ${!spindleOn ? 'text-white' : 'text-slate-500'}`} />
                <span>OFF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Manual Plunge Trigger */}
      <div className="flex flex-col gap-2 pt-0.5">
        {/* Primary Hero Action Trigger (Manual Plunge) */}
        <button
          type="button"
          onPointerDown={onPlungeDown}
          onPointerUp={onPlungeUp}
          onPointerLeave={onPlungeCancel}
          onPointerCancel={onPlungeCancel}
          onContextMenu={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
              onPlungeDown();
            }
          }}
          onKeyUp={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              onPlungeUp();
            }
          }}
          className={`w-full py-3.5 sm:py-4 px-4 rounded-2xl font-extrabold text-sm sm:text-base border shadow-sm active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2.5 touch-none select-none min-h-[50px] ${
            plungeDown
              ? 'bg-red-600 text-white border-red-700 ring-4 ring-red-500/30 animate-pulse shadow-md'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-blue-500/40 shadow-blue-600/20'
          }`}
        >
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <ArrowDownCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="flex flex-col items-center justify-center leading-tight">
            <span>{t.btnPlunge}</span>
            <span className="text-[9px] sm:text-[10px] font-normal text-blue-100/90 font-sans">
              {dwellSec <= 0
                ? isAr
                  ? 'حفر بالضغط المستمر (Hold)'
                  : 'Pression continue (Hold)'
                : isAr
                  ? `دورة حفر مؤقتة (${dwellSec} ثانية)`
                  : `Cycle temporisé (${dwellSec}s)`}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};
