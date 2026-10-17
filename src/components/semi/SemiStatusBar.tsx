import React from 'react';
import { RotateCcw, Route, Trash2 } from 'lucide-react';
import { Translations } from '../../core/i18n';
import { LAYER_COLORS } from '../../core/constants';

interface SemiStatusBarProps {
  thetaDeg: number;
  rMm: number;
  rHeadMinMm: number;
  currentLayer: number;
  spindleOn: boolean;
  holesCount: number;
  maxHolesCount: number;
  isAr: boolean;
  t: Translations;
  onUndoLastPlunge: () => void;
  onOpenPlan: () => void;
  onOpenClearConfirm: () => void;
  executionPlanTotalPlunges: number;
  hasExecutionSteps: boolean;
}

export const SemiStatusBar: React.FC<SemiStatusBarProps> = ({
  thetaDeg,
  rMm,
  rHeadMinMm,
  currentLayer,
  spindleOn,
  holesCount,
  maxHolesCount,
  isAr,
  t,
  onUndoLastPlunge,
  onOpenPlan,
  onOpenClearConfirm,
  executionPlanTotalPlunges,
  hasExecutionSteps,
}) => {
  return (
    <div className="flex-none p-2.5 sm:p-3 bg-white border border-[#e2e8f0] rounded-2xl shadow-2xs flex flex-col gap-2">
      <div className="grid grid-cols-5 gap-1.5 text-center">
        {/* θ */}
        <div className="p-1.5 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-[9px] font-bold text-slate-500 block">θ</span>
          <span className="text-xs font-mono font-extrabold text-blue-600">
            {thetaDeg.toFixed(1)}°
          </span>
        </div>
        {/* r */}
        <div
          className={`p-1.5 rounded-xl border transition-colors ${
            rMm <= rHeadMinMm + 0.1
              ? 'bg-amber-50 border-amber-300'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-center gap-0.5">
            <span className="text-[9px] font-bold text-slate-500 block">r</span>
            {rMm <= rHeadMinMm + 0.1 && (
              <span className="text-[8px] font-bold text-amber-700 bg-amber-100 px-1 rounded">
                MIN
              </span>
            )}
          </div>
          <span
            className={`text-xs font-mono font-extrabold ${
              rMm <= rHeadMinMm + 0.1 ? 'text-amber-700' : 'text-emerald-600'
            }`}
          >
            {rMm.toFixed(1)}
          </span>
        </div>
        {/* Active Layer L */}
        <div className="p-1.5 bg-purple-50 rounded-xl border border-purple-200 text-purple-700">
          <span className="text-[9px] font-bold block">
            {isAr ? 'الطبقة' : 'Couche'}
          </span>
          <span className="text-xs font-mono font-extrabold flex items-center justify-center gap-1">
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ backgroundColor: LAYER_COLORS[currentLayer % LAYER_COLORS.length] }}
            />
            L{currentLayer + 1}
          </span>
        </div>
        {/* Spindle */}
        <div
          className={`p-1.5 rounded-xl border transition-colors ${
            spindleOn
              ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
              : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}
        >
          <span className="text-[9px] font-bold block">Spindle</span>
          <span className="text-[10px] font-extrabold">
            {spindleOn ? 'ON' : 'OFF'}
          </span>
        </div>
        {/* Drilled Holes / Available Count */}
        <div className="p-1.5 bg-indigo-50 rounded-xl border border-indigo-200 text-indigo-700">
          <span className="text-[9px] font-bold block">
            {isAr ? 'المحفور' : 'Percés'}
          </span>
          <span className="text-xs font-mono font-extrabold">
            {holesCount}
            <span className="text-[10px] text-indigo-400 font-normal">
              /{maxHolesCount}
            </span>
          </span>
        </div>
      </div>

      {/* Execution Plan Quick Bar & Action Buttons */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
        <button
          type="button"
          onClick={onUndoLastPlunge}
          disabled={holesCount === 0}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>{t.undoLastPlungeBtn}</span>
        </button>

        {/* Plan Access Button */}
        <button
          type="button"
          onClick={onOpenPlan}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all cursor-pointer shadow-2xs"
        >
          <Route className="w-3 h-3 text-indigo-600" />
          <span>{t.executionPlanTitle}</span>
          {hasExecutionSteps && (
            <span className="text-[9px] font-mono bg-indigo-600 text-white px-1.5 py-0.2 rounded-full font-extrabold">
              {executionPlanTotalPlunges}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onOpenClearConfirm}
          disabled={holesCount === 0}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
        >
          <Trash2 className="w-3 h-3" />
          <span>{t.clearAllHolesBtn}</span>
        </button>
      </div>
    </div>
  );
};
