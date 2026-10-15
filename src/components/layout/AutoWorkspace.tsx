import React from 'react';
import { SlidersHorizontal, BarChart3 } from 'lucide-react';
import { TrayModel, TrayParams, SimulationState, ViewOptions } from '../../types';
import { Translations, Language } from '../../core/i18n';
import { ParametersPanel } from '../ParametersPanel';
import { CanvasControls, Results } from '../AutomaticSimulatorSection';

export interface AutoWorkspaceProps {
  model: TrayModel;
  params: TrayParams;
  simState: SimulationState | null;
  simTimeMs: number;
  totalTimeMs: number;
  isPlaying: boolean;
  speed: number;
  viewOptions: ViewOptions;
  setViewOptions: (opts: ViewOptions) => void;
  onTogglePlay: () => void;
  onResetSim: () => void;
  onStepNext: () => void;
  onStepPrev: () => void;
  onScrubTime: (ms: number) => void;
  onChangeSpeed: (spd: number) => void;
  onUpdateParams: (newParams: Partial<TrayParams>) => void;
  onAutoCalculateSpacing: () => void;
  onOpenSaveModal: () => void;
  onOpenQr: () => void;
  onOpenMathModal: () => void;
  isMobileDrawerOpen: boolean;
  setIsMobileDrawerOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  t: Translations;
  lang: Language;
}

export const AutoWorkspace: React.FC<AutoWorkspaceProps> = ({
  model,
  params,
  simState,
  simTimeMs,
  totalTimeMs,
  isPlaying,
  speed,
  viewOptions,
  setViewOptions,
  onTogglePlay,
  onResetSim,
  onStepNext,
  onStepPrev,
  onScrubTime,
  onChangeSpeed,
  onUpdateParams,
  onAutoCalculateSpacing,
  onOpenSaveModal,
  onOpenQr,
  onOpenMathModal,
  isMobileDrawerOpen,
  setIsMobileDrawerOpen,
  t,
  lang,
}) => {
  const commonSimProps = {
    model,
    state: simState,
    options: viewOptions,
    onChangeOptions: setViewOptions,
    currentTimeMs: simTimeMs,
    totalTimeMs,
    isPlaying,
    speed,
    onTogglePlay,
    onReset: onResetSim,
    onStepNext,
    onStepPrev,
    onScrubTime,
    onChangeSpeed,
    onOpenSaveModal,
    onOpenQr,
    params,
    totalCycleTimeMs: totalTimeMs,
    t,
    lang,
    onOpenMathModal,
  };

  return (
    <>
      {/* Mobile Single Column View (< lg) */}
      <div className="flex flex-col lg:hidden gap-3.5 h-full min-h-0 select-none">
        <div className="flex-none w-full">
          <CanvasControls
            {...commonSimProps}
            onToggleDrawer={() => setIsMobileDrawerOpen((prev) => !prev)}
            isDrawerOpen={isMobileDrawerOpen}
          />
        </div>

        {/* Mobile Parameters Drawer */}
        {isMobileDrawerOpen && (
          <div
            className="fixed inset-0 z-35 bg-black/25 backdrop-blur-[1px] animate-in fade-in duration-200"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
        )}

        {isMobileDrawerOpen && (
          <div
            className="fixed inset-x-0 bottom-[64px] z-40 max-h-[74dvh] h-[68dvh] sm:h-auto sm:max-h-[76dvh] flex flex-col bg-white rounded-t-3xl shadow-[0_-12px_44px_rgba(15,23,42,0.22)] border-t border-[#cbd5e1] animate-in slide-in-from-bottom duration-300"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
          >
            <div className="flex-none pt-2.5 pb-2.5 px-4 sm:px-5 border-b border-[#f1f5f9] flex flex-col gap-2 bg-gradient-to-b from-slate-50 to-white rounded-t-3xl">
              <div
                className="w-12 h-1.5 bg-slate-300 hover:bg-slate-400 rounded-full mx-auto cursor-pointer transition-colors"
                onClick={() => setIsMobileDrawerOpen(false)}
                title={t.closeDrawer}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2563eb] flex items-center justify-center font-bold shadow-2xs">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#0f172a] block">
                      {t.trayParamsTitle}
                    </span>
                    <span className="text-[10px] text-[#64748b] block">
                      {t.swipeToAdjust}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all cursor-pointer active:scale-95 shadow-2xs"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>{t.showResults}</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3.5 py-3.5 sm:px-5 sm:py-4 pb-32 sm:pb-28 overscroll-contain">
              <ParametersPanel
                params={params}
                model={model}
                t={t}
                lang={lang}
                onChange={onUpdateParams}
                onAutoCalculateSpacing={onAutoCalculateSpacing}
              />
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-0.5 pb-2">
          <Results {...commonSimProps} />
        </div>
      </div>

      {/* Desktop Two-Column Grid View (>= lg) */}
      <div className="hidden lg:grid grid-cols-[380px_1fr] xl:grid-cols-[410px_1fr] gap-4 md:gap-6 items-start">
        <aside className="w-full">
          <ParametersPanel
            params={params}
            model={model}
            t={t}
            lang={lang}
            onChange={onUpdateParams}
            onAutoCalculateSpacing={onAutoCalculateSpacing}
          />
        </aside>

        <main className="w-full min-w-0">
          <section className="flex flex-col gap-4 md:gap-5 w-full min-w-0 select-none">
            <CanvasControls {...commonSimProps} />
            <Results {...commonSimProps} />
          </section>
        </main>
      </div>
    </>
  );
};
