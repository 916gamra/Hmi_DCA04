import React from 'react';
import { CanvasStage } from '../CanvasStage';
import { SemiStatusBar } from '../semi/SemiStatusBar';
import { SemiRemotePad } from '../semi/SemiRemotePad';
import { SemiMobileDrawer } from '../semi/SemiMobileDrawer';
import { SemiSimulationControls } from '../SemiSimulationControls';
import { SemiButtonMapCard } from '../semi/SemiButtonMapCard';
import { ButtonMapResult } from '../../core/buttonMap';
import { TrayModel, SimulationState, ViewOptions } from '../../types';
import { Translations, Language } from '../../core/i18n';
import { SlidersHorizontal } from 'lucide-react';
import { ConfirmModal } from '../ConfirmModal';

interface SemiWorkspaceProps {
  model: TrayModel;
  state: SimulationState;
  viewOptions: ViewOptions;
  onChangeOptions: (opts: ViewOptions) => void;
  t: Translations;
  lang: Language;
  isAr: boolean;
  buttonMap?: ButtonMapResult;
  onShowToast?: (msg: string) => void;
  thetaDeg: number;
  rMm: number;
  rHeadMinMm: number;
  currentLayer: number;
  spindleOn: boolean;
  holesCount: number;
  maxHolesCount: number;
  dwellSec: number;
  stepAngleDeg: number;
  stepRadialMm: number;
  tableZUp: boolean;
  plungeDown: boolean;
  executionPlan: any;
  activePlaybackStep: any | null;
  isPlayingCam: boolean;
  camPlaybackStep: number | null;
  planSource: 'preview' | 'replay';
  previewScope: 'all' | 'currentLayer';
  isMacroDrilling?: boolean;
  isMobileDrawerOpen: boolean;
  isClearConfirmOpen: boolean;
  paramsList: React.ReactNode;
  onSetPlanSource: (source: 'preview' | 'replay') => void;
  onSetPreviewScope: (scope: 'all' | 'currentLayer') => void;
  onAutoDrillCurrentLayer?: () => void;
  onCancelMacroDrill?: () => void;
  onToggleDrawer: () => void;
  onCloseDrawer: () => void;
  onUndoLastPlunge: () => void;
  onOpenPlan: () => void;
  onOpenClearConfirm: () => void;
  onCloseClearConfirm: () => void;
  onConfirmClear: () => void;
  onTableStep: (dir: 1 | -1) => void;
  onTableHome: () => void;
  onRadialStep: (dir: 1 | -1) => void;
  onRadialMax: () => void;
  onSetTableZUp: (b: boolean) => void;
  onSetSpindleOn: (b: boolean) => void;
  onPlungeDown: () => void;
  onPlungeUp: () => void;
  onPlungeCancel: () => void;
  onSyncMachineToStep: (stepIdx?: number) => void;
  onExitCamPreview: () => void;
  onStepPrev: () => void;
  onStepNext: () => void;
  onTogglePlayCam: () => void;
  onSetCamPlaybackStep: (step: number | null) => void;
}

export const SemiWorkspace: React.FC<SemiWorkspaceProps> = ({
  model,
  state,
  viewOptions,
  onChangeOptions,
  t,
  lang,
  isAr,
  buttonMap,
  onShowToast,
  thetaDeg,
  rMm,
  rHeadMinMm,
  currentLayer,
  spindleOn,
  holesCount,
  maxHolesCount,
  dwellSec,
  stepAngleDeg,
  stepRadialMm,
  tableZUp,
  plungeDown,
  executionPlan,
  isPlayingCam,
  camPlaybackStep,
  planSource,
  previewScope,
  isMacroDrilling = false,
  isMobileDrawerOpen,
  isClearConfirmOpen,
  paramsList,
  onSetPlanSource,
  onSetPreviewScope,
  onAutoDrillCurrentLayer,
  onCancelMacroDrill,
  onToggleDrawer,
  onCloseDrawer,
  onUndoLastPlunge,
  onOpenPlan,
  onOpenClearConfirm,
  onCloseClearConfirm,
  onConfirmClear,
  onTableStep,
  onTableHome,
  onRadialStep,
  onRadialMax,
  onSetTableZUp,
  onSetSpindleOn,
  onPlungeDown,
  onPlungeUp,
  onPlungeCancel,
  onSyncMachineToStep,
  onExitCamPreview,
  onStepPrev,
  onStepNext,
  onTogglePlayCam,
  onSetCamPlaybackStep,
}) => {
  return (
    <div
      className="flex flex-col gap-3 max-w-5xl mx-auto w-full h-full min-h-0 select-none overflow-hidden"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <ConfirmModal
        isOpen={isClearConfirmOpen}
        onClose={onCloseClearConfirm}
        onConfirm={onConfirmClear}
        title={t.confirmClearHolesTitle}
        message={t.confirmClearHolesDesc}
        t={t}
        lang={lang}
      />

      {/* 1. Mobile Single Column View (< lg) */}
      <div className="flex flex-col lg:hidden gap-3.5 h-full min-h-0 select-none">
        <div className="flex-none w-full">
          <CanvasStage
            model={model}
            state={state}
            options={viewOptions}
            onChangeOptions={onChangeOptions}
            t={t}
            lang={lang}
            onToggleDrawer={onToggleDrawer}
            isDrawerOpen={isMobileDrawerOpen}
          />
        </div>

        {/* Semi Simulation Controls directly under CanvasStage */}
        <SemiSimulationControls
          executionPlan={executionPlan}
          camPlaybackStep={camPlaybackStep}
          isPlayingCam={isPlayingCam}
          planSource={planSource}
          previewScope={previewScope}
          holesCount={holesCount}
          currentLayer={currentLayer}
          onSetPlanSource={onSetPlanSource}
          onSetPreviewScope={onSetPreviewScope}
          onSetCamPlaybackStep={onSetCamPlaybackStep}
          onStepPrev={onStepPrev}
          onStepNext={onStepNext}
          onTogglePlayCam={onTogglePlayCam}
          onSyncMachineToStep={(idx) => onSyncMachineToStep(idx)}
          onExitPreview={onExitCamPreview}
          isAr={isAr}
          t={t}
          lang={lang}
        />

        {buttonMap && (
          <SemiButtonMapCard
            buttonMap={buttonMap}
            camPlaybackStep={camPlaybackStep}
            onSyncMachineToStep={(r, th) => {
              if (onSyncMachineToStep) onSyncMachineToStep();
            }}
            onShowToast={onShowToast}
            isAr={isAr}
            t={t}
          />
        )}

        <SemiStatusBar
          thetaDeg={thetaDeg}
          rMm={rMm}
          rHeadMinMm={rHeadMinMm}
          currentLayer={currentLayer}
          spindleOn={spindleOn}
          holesCount={holesCount}
          maxHolesCount={maxHolesCount}
          isAr={isAr}
          t={t}
          onUndoLastPlunge={onUndoLastPlunge}
          onOpenPlan={onOpenPlan}
          onOpenClearConfirm={onOpenClearConfirm}
          executionPlanTotalPlunges={executionPlan.totalPlunges}
          hasExecutionSteps={executionPlan.steps.length > 0}
        />

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y flex flex-col gap-3 pr-0.5 pb-3 oneui-scrollbar">
          <SemiRemotePad
            t={t}
            isAr={isAr}
            dwellSec={dwellSec}
            stepAngleDeg={stepAngleDeg}
            stepRadialMm={stepRadialMm}
            tableZUp={tableZUp}
            spindleOn={spindleOn}
            plungeDown={plungeDown}
            currentLayer={currentLayer}
            isMacroDrilling={isMacroDrilling}
            onAutoDrillCurrentLayer={onAutoDrillCurrentLayer}
            onCancelMacroDrill={onCancelMacroDrill}
            onTableStep={onTableStep}
            onTableHome={onTableHome}
            onRadialStep={onRadialStep}
            onRadialMax={onRadialMax}
            onSetTableZUp={onSetTableZUp}
            onSetSpindleOn={onSetSpindleOn}
            onPlungeDown={onPlungeDown}
            onPlungeUp={onPlungeUp}
            onPlungeCancel={onPlungeCancel}
          />
        </div>

        <SemiMobileDrawer
          isOpen={isMobileDrawerOpen}
          onClose={onCloseDrawer}
          isAr={isAr}
          t={t}
        >
          {paramsList}
        </SemiMobileDrawer>
      </div>

      {/* 2. Desktop Two-Column Grid View (>= lg) */}
      <div className="hidden lg:grid grid-cols-[380px_1fr] xl:grid-cols-[410px_1fr] gap-4 md:gap-6 items-start h-full min-h-0 overflow-y-auto pr-1 oneui-scrollbar">
        <aside className="w-full flex flex-col gap-4">
          <div className="oneui-card p-4 bg-white border border-slate-200 rounded-3xl shadow-2xs flex flex-col gap-3">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <SlidersHorizontal className="w-4 h-4 text-blue-600" />
              <span>{isAr ? 'بارامترات التصميم والشبكة' : 'Paramètres d’usinage et grille'}</span>
            </h3>
            {paramsList}
          </div>
        </aside>

        <main className="w-full min-w-0 flex flex-col gap-4">
          <CanvasStage
            model={model}
            state={state}
            options={viewOptions}
            onChangeOptions={onChangeOptions}
            t={t}
            lang={lang}
          />

          <SemiSimulationControls
            executionPlan={executionPlan}
            camPlaybackStep={camPlaybackStep}
            isPlayingCam={isPlayingCam}
            planSource={planSource}
            previewScope={previewScope}
            holesCount={holesCount}
            currentLayer={currentLayer}
            onSetPlanSource={onSetPlanSource}
            onSetPreviewScope={onSetPreviewScope}
            onSetCamPlaybackStep={onSetCamPlaybackStep}
            onStepPrev={onStepPrev}
            onStepNext={onStepNext}
            onTogglePlayCam={onTogglePlayCam}
            onSyncMachineToStep={(idx) => onSyncMachineToStep(idx)}
            onExitPreview={onExitCamPreview}
            isAr={isAr}
            t={t}
            lang={lang}
          />

          {buttonMap && (
            <SemiButtonMapCard
              buttonMap={buttonMap}
              camPlaybackStep={camPlaybackStep}
              onSyncMachineToStep={(r, th) => {
                if (onSyncMachineToStep) onSyncMachineToStep();
              }}
              onShowToast={onShowToast}
              isAr={isAr}
              t={t}
            />
          )}

          <SemiStatusBar
            thetaDeg={thetaDeg}
            rMm={rMm}
            rHeadMinMm={rHeadMinMm}
            currentLayer={currentLayer}
            spindleOn={spindleOn}
            holesCount={holesCount}
            maxHolesCount={maxHolesCount}
            isAr={isAr}
            t={t}
            onUndoLastPlunge={onUndoLastPlunge}
            onOpenPlan={onOpenPlan}
            onOpenClearConfirm={onOpenClearConfirm}
            executionPlanTotalPlunges={executionPlan.totalPlunges}
            hasExecutionSteps={executionPlan.steps.length > 0}
          />
          <SemiRemotePad
            t={t}
            isAr={isAr}
            dwellSec={dwellSec}
            stepAngleDeg={stepAngleDeg}
            stepRadialMm={stepRadialMm}
            tableZUp={tableZUp}
            spindleOn={spindleOn}
            plungeDown={plungeDown}
            currentLayer={currentLayer}
            isMacroDrilling={isMacroDrilling}
            onAutoDrillCurrentLayer={onAutoDrillCurrentLayer}
            onCancelMacroDrill={onCancelMacroDrill}
            onTableStep={onTableStep}
            onTableHome={onTableHome}
            onRadialStep={onRadialStep}
            onRadialMax={onRadialMax}
            onSetTableZUp={onSetTableZUp}
            onSetSpindleOn={onSetSpindleOn}
            onPlungeDown={onPlungeDown}
            onPlungeUp={onPlungeUp}
            onPlungeCancel={onPlungeCancel}
          />
        </main>
      </div>
    </div>
  );
};
