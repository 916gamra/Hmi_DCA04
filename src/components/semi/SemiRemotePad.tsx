import React from 'react';
import {
  RotateCw,
  MoveHorizontal,
  Zap,
  ArrowUpCircle,
  ArrowDownCircle,
  Settings,
} from 'lucide-react';
import { Translations } from '../../core/i18n';

interface SemiRemotePadProps {
  t: Translations;
  isAr: boolean;
  dwellSec: number;
  stepAngleDeg: number;
  stepRadialMm: number;
  tableZUp: boolean;
  spindleOn: boolean;
  plungeDown: boolean;
  onTableStep: (dir: 1 | -1) => void;
  onTableHome: () => void;
  onRadialStep: (dir: 1 | -1) => void;
  onRadialMax: () => void;
  onSetTableZUp: (up: boolean) => void;
  onSetSpindleOn: (on: boolean) => void;
  onPlungeDown: () => void;
  onPlungeUp: () => void;
  onPlungeCancel: () => void;
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
  onTableStep,
  onTableHome,
  onRadialStep,
  onRadialMax,
  onSetTableZUp,
  onSetSpindleOn,
  onPlungeDown,
  onPlungeUp,
  onPlungeCancel,
}) => {
  return (
    <div className="oneui-card p-4 sm:p-5 flex flex-col gap-3.5 bg-white border border-[#e2e8f0] shadow-md rounded-3xl">
      <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-2.5">
        <h3 className="text-sm font-extrabold text-[#0f172a] flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-slate-900 text-white">
            <Settings className="w-4 h-4" />
          </div>
          <span>{t.semiAutoTitle}</span>
        </h3>
        <span className="text-[10px] font-mono text-slate-400">
          {dwellSec <= 0 ? 'Dwell: 0s (Hold)' : `Dwell: ${dwellSec}s (Pulse)`}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Table Rotation */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <RotateCw className="w-4 h-4 text-blue-600" />
            {isAr ? `دوران الطاولة (±${stepAngleDeg}°)` : `Rotation table (±${stepAngleDeg}°)`}
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => onTableStep(-1)}
              className="py-3 px-2 rounded-xl bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center justify-center min-h-[46px]"
            >
              <span>{t.btnTableMinus}</span>
            </button>
            <button
              type="button"
              onClick={onTableHome}
              className="py-3 px-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-[10px] font-bold shadow-2xs active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center leading-tight min-h-[46px]"
            >
              <span>{t.btnTableHome}</span>
            </button>
            <button
              type="button"
              onClick={() => onTableStep(1)}
              className="py-3 px-2 rounded-xl bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center justify-center min-h-[46px]"
            >
              <span>{t.btnTablePlus}</span>
            </button>
          </div>
        </div>

        {/* Radial Movement */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <MoveHorizontal className="w-4 h-4 text-emerald-600" />
            {isAr ? `حركة الرؤوس شعاعياً (±${stepRadialMm}mm)` : `Avance radiale (±${stepRadialMm}mm)`}
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => onRadialStep(-1)}
              className="py-3 px-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center justify-center min-h-[46px]"
            >
              <span>{t.btnRadialMinus}</span>
            </button>
            <button
              type="button"
              onClick={onRadialMax}
              className="py-3 px-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 text-[10px] font-bold shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center justify-center leading-tight min-h-[46px]"
            >
              <span>{t.btnRadialMax}</span>
            </button>
            <button
              type="button"
              onClick={() => onRadialStep(1)}
              className="py-3 px-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center justify-center min-h-[46px]"
            >
              <span>{t.btnRadialPlus}</span>
            </button>
          </div>
        </div>

        {/* Table Z Commutateur */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <ArrowUpCircle className="w-4 h-4 text-blue-600" />
            {t.tableZLabel}
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onSetTableZUp(false)}
              className={`py-3 px-2 rounded-xl border text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center justify-center min-h-[46px] ${
                !tableZUp
                  ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                  : 'bg-white hover:bg-blue-50 text-blue-700 border-slate-200'
              }`}
            >
              <span>{t.btnTableZDown}</span>
            </button>
            <button
              type="button"
              onClick={() => onSetTableZUp(true)}
              className={`py-3 px-2 rounded-xl border text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center justify-center min-h-[46px] ${
                tableZUp
                  ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                  : 'bg-white hover:bg-blue-50 text-blue-700 border-slate-200'
              }`}
            >
              <span>{t.btnTableZUp}</span>
            </button>
          </div>
        </div>

        {/* Spindle Rotation */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-600" />
            {t.spindleLabel}
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onSetSpindleOn(false)}
              className={`py-3 px-2 rounded-xl border text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center justify-center min-h-[46px] ${
                !spindleOn
                  ? 'bg-slate-800 text-white border-slate-900 shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <span>{t.btnSpindleOff}</span>
            </button>
            <button
              type="button"
              onClick={() => onSetSpindleOn(true)}
              className={`py-3 px-2 rounded-xl border text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center justify-center min-h-[46px] ${
                spindleOn
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                  : 'bg-white hover:bg-emerald-100 text-emerald-700 border-slate-200'
              }`}
            >
              <span>{t.btnSpindleOn}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Central Plunge Button */}
      <div className="pt-1">
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
          className={`w-full py-4 px-4 rounded-2xl font-extrabold text-sm sm:text-base border shadow-md active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2.5 touch-none select-none min-h-[52px] ${
            plungeDown
              ? 'bg-red-600 text-white border-red-700 ring-4 ring-red-500/30 animate-pulse'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-blue-500/40'
          }`}
        >
          <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center">
            <ArrowDownCircle className="w-5 h-5" />
          </div>
          <span>{t.btnPlunge}</span>
        </button>
      </div>
    </div>
  );
};
