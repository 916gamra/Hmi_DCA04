import React, { useState } from 'react';
import {
  ListOrdered,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Compass,
  Maximize2,
  RotateCw,
  ArrowDown,
  ArrowDownCircle,
  Sparkles,
} from 'lucide-react';
import { ButtonMapResult, ButtonMapStep } from '../../core/buttonMap';
import { Translations } from '../../core/i18n';

interface SemiButtonMapCardProps {
  buttonMap: ButtonMapResult;
  camPlaybackStep: number | null;
  onSyncMachineToStep?: (rMm: number, thetaDeg: number) => void;
  onShowToast?: (msg: string) => void;
  isAr: boolean;
  t: Translations;
}

export const SemiButtonMapCard: React.FC<SemiButtonMapCardProps> = ({
  buttonMap,
  camPlaybackStep,
  onSyncMachineToStep,
  onShowToast,
  isAr,
  t,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const handleCopyCondensed = async () => {
    if (!buttonMap.condensedString) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(buttonMap.condensedString);
      }
      setCopied(true);
      if (onShowToast) {
        onShowToast(t.buttonMapCopiedToast);
      }
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  const getActionBadge = (step: ButtonMapStep) => {
    switch (step.action) {
      case 'HOME':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-mono font-bold">
            <Compass className="w-3 h-3 text-purple-600" />
            <span>{step.buttonLabel}</span>
          </span>
        );
      case 'R_MAX':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 text-[11px] font-mono font-bold">
            <Maximize2 className="w-3 h-3 text-teal-600" />
            <span>{step.buttonLabel}</span>
          </span>
        );
      case 'THETA_PLUS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-mono font-bold">
            <RotateCw className="w-3 h-3 text-blue-600" />
            <span>{step.buttonLabel}</span>
          </span>
        );
      case 'R_MINUS':
      case 'R_PLUS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-mono font-bold">
            <ArrowDown className="w-3 h-3 text-amber-600" />
            <span>{step.buttonLabel}</span>
          </span>
        );
      case 'PUSH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-mono font-extrabold shadow-2xs">
            <ArrowDownCircle className="w-3 h-3 text-rose-600" />
            <span>{step.buttonLabel}</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-mono font-bold">
            {step.buttonLabel}
          </span>
        );
    }
  };

  const renderFormulaToken = (st: ButtonMapStep) => {
    let actionColor = 'text-slate-700 bg-slate-50 border-slate-200';
    let actionText = '';

    if (st.action === 'HOME') {
      actionText = '0 HOME';
      actionColor = 'text-indigo-700 bg-indigo-50/90 border-indigo-200';
    } else if (st.action === 'R_MAX') {
      actionText = 'r MAX';
      actionColor = 'text-teal-700 bg-teal-50/90 border-teal-200';
    } else if (st.action === 'R_MINUS') {
      actionText = 'r−';
      actionColor = 'text-amber-800 bg-amber-50/90 border-amber-200';
    } else if (st.action === 'R_PLUS') {
      actionText = 'r+';
      actionColor = 'text-emerald-700 bg-emerald-50/90 border-emerald-200';
    } else if (st.action === 'PUSH') {
      actionText = 'PUSH';
      actionColor = 'text-rose-700 bg-rose-50 border-rose-300 font-black shadow-2xs';
    } else if (st.action === 'THETA_PLUS') {
      actionText = 'θ+';
      actionColor = 'text-blue-700 bg-blue-50/90 border-blue-200';
    } else if (st.action === 'THETA_MINUS') {
      actionText = 'θ−';
      actionColor = 'text-blue-700 bg-blue-50/90 border-blue-200';
    } else {
      actionText = st.action;
    }

    return (
      <span className="inline-flex items-center text-xs font-mono select-text">
        <span className="text-slate-400 font-bold select-none mx-0.5">(</span>
        <span className={`inline-block px-1.5 py-0.5 rounded-md border text-[11px] font-bold ${actionColor}`}>
          {actionText}
        </span>
        <span className="text-slate-400 font-bold select-none mx-0.5">)</span>
        {st.pulses > 1 && (
          <span className="inline-flex items-center ml-0.5 px-1.5 py-0.5 rounded-md bg-purple-50 border border-purple-200/90 text-purple-700 font-mono text-[11px] font-extrabold shadow-2xs">
            <span className="text-purple-500 font-black mr-0.5 select-none">×</span>
            <span>{st.pulses}</span>
          </span>
        )}
      </span>
    );
  };

  if (!buttonMap || buttonMap.steps.length === 0) {
    return null;
  }

  return (
    <div
      className="oneui-card p-3 sm:p-4 bg-white border border-[#e2e8f0] rounded-2xl sm:rounded-3xl shadow-xs flex flex-col gap-3 select-none"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* 1. Header with Title and Total Presses Counter */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 shrink-0">
            <ListOrdered className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-[#0f172a] leading-tight">
              {t.buttonMapTitle}
            </h3>
            <p className="text-[10px] text-[#64748b] leading-tight">
              {t.buttonMapSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-mono font-bold">
            <span>{t.buttonMapTotalPresses}:</span>
            <span className="text-sm font-extrabold text-indigo-900">{buttonMap.totalPresses}</span>
          </div>

          <button
            type="button"
            onClick={handleCopyCondensed}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 border ${
              copied
                ? 'bg-emerald-600 text-white border-emerald-700'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
            title={t.buttonMapCopyBtn}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>{isAr ? 'تم النسخ!' : 'Copié!'}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>{t.buttonMapCopyBtn}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Button Presses Breakdown Chips */}
      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono font-semibold" dir="ltr">
        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
          (0 HOME): <strong>{buttonMap.breakdown.home}</strong>
        </span>
        <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
          (r MAX): <strong>{buttonMap.breakdown.rMax}</strong>
        </span>
        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
          (θ+): <strong>{buttonMap.breakdown.thetaPlus}</strong>
        </span>
        {buttonMap.breakdown.rMinus > 0 && (
          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
            (r−): <strong>{buttonMap.breakdown.rMinus}</strong>
          </span>
        )}
        {buttonMap.breakdown.rPlus > 0 && (
          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
            (r+): <strong>{buttonMap.breakdown.rPlus}</strong>
          </span>
        )}
        <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-black">
          (PUSH): <strong>{buttonMap.breakdown.push}</strong>
        </span>
        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 ml-auto">
          {t.holesLabel || 'الثقوب'}: <strong className="text-emerald-700">{buttonMap.totalHoles}</strong>
        </span>
      </div>

      {/* 3. Condensed Button Sequence Banner (Excel Formula Light UI Style) */}
      <div className="flex flex-col gap-1.5">
        <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-emerald-600 text-white font-serif italic text-xs font-black shadow-2xs">
              fx
            </span>
            <span className="text-slate-800 font-sans">{t.buttonMapCondensedLabel}</span>
          </div>
          <span className="text-[10px] text-emerald-800 font-mono font-bold bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
            Excel Formula Bar
          </span>
        </div>
        <div
          className="bg-white border-2 border-slate-200 hover:border-emerald-500/70 rounded-2xl p-3 sm:p-3.5 flex flex-wrap items-center gap-y-2 gap-x-1 shadow-xs font-mono text-xs max-h-36 overflow-y-auto oneui-scrollbar select-text transition-colors"
          dir="ltr"
        >
          <span className="text-emerald-700 font-black text-sm select-none mr-1.5 font-mono">=</span>
          {buttonMap.steps.map((st, idx) => (
            <React.Fragment key={st.stepIndex}>
              {idx > 0 && (
                <span className="text-slate-400 font-extrabold select-none text-[11px] mx-1">&gt;</span>
              )}
              {renderFormulaToken(st)}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 4. Expandable Detailed Step List */}
      <div className="flex flex-col gap-2 pt-1 border-t border-slate-100">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-center justify-between py-1.5 px-2 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>
              {isAr
                ? `${isExpanded ? 'إخفاء' : 'عرض'} خطوات الخريطة التفصيلية (${buttonMap.steps.length} خطوة ميكانيكية)`
                : `${isExpanded ? 'Masquer' : 'Afficher'} les détails mécaniques (${buttonMap.steps.length} étapes)`}
            </span>
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {isExpanded && (
          <div className="overflow-x-auto max-h-72 overflow-y-auto oneui-scrollbar rounded-xl border border-slate-200">
            <table className="w-full text-[11px] text-left border-collapse" dir="ltr">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold sticky top-0 z-10">
                <tr>
                  <th className="py-2 px-2.5 text-center w-12">#</th>
                  <th className="py-2 px-2.5">{t.buttonMapStepColAction}</th>
                  <th className="py-2 px-2.5">{t.buttonMapStepColTarget}</th>
                  <th className="py-2 px-2.5">Layer</th>
                  <th className="py-2 px-2.5">{t.buttonMapStepColDesc}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {buttonMap.steps.map((st) => {
                  const isActivePlunge =
                    st.action === 'PUSH' &&
                    camPlaybackStep !== null &&
                    st.plungeIndex === camPlaybackStep;

                  return (
                    <tr
                      key={st.stepIndex}
                      onClick={() => onSyncMachineToStep && onSyncMachineToStep(st.rMm, st.thetaDeg)}
                      className={`transition-colors cursor-pointer ${
                        isActivePlunge
                          ? 'bg-blue-50/90 font-bold text-blue-900 ring-1 ring-blue-300'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <td className="py-1.5 px-2.5 text-center font-bold text-slate-400">
                        {st.stepIndex}
                      </td>
                      <td className="py-1.5 px-2.5">{getActionBadge(st)}</td>
                      <td className="py-1.5 px-2.5 whitespace-nowrap text-slate-800">
                        <span>r={st.rMm}mm</span>, <span>θ={st.thetaDeg}°</span>
                      </td>
                      <td className="py-1.5 px-2.5 text-blue-600 font-bold">{st.layerName}</td>
                      <td className="py-1.5 px-2.5 font-sans text-[11px] text-slate-600 max-w-xs truncate">
                        {isAr ? st.explanationAr : st.explanationEn}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
