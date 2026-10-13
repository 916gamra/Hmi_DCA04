import React from 'react';
import { CanvasStage } from './CanvasStage';
import { SimulationControls } from './SimulationControls';
import { ValidationCard } from './ValidationCard';
import { TrayModel, SimulationState, ViewOptions, TrayParams } from '../types';
import { Translations, Language } from '../core/i18n';

interface AutomaticSimulatorSectionProps {
  model: TrayModel;
  state: SimulationState | null;
  options: ViewOptions;
  onChangeOptions: (opts: ViewOptions) => void;
  currentTimeMs: number;
  totalTimeMs: number;
  isPlaying: boolean;
  speed: number;
  onTogglePlay: () => void;
  onReset: () => void;
  onStepNext: () => void;
  onStepPrev: () => void;
  onScrubTime: (ms: number) => void;
  onChangeSpeed: (spd: number) => void;
  onOpenSaveModal: () => void;
  onOpenQr: () => void;
  params: TrayParams;
  totalCycleTimeMs: number;
  t: Translations;
  lang: Language;
  onToggleDrawer?: () => void;
  isDrawerOpen?: boolean;
  onOpenMathModal?: () => void;
}

export const CanvasControls: React.FC<AutomaticSimulatorSectionProps> = (props) => (
  <div className="flex flex-col gap-3 w-full min-w-0">
    <CanvasStage
      model={props.model}
      state={props.state}
      options={props.options}
      onChangeOptions={props.onChangeOptions}
      t={props.t}
      lang={props.lang}
      onToggleDrawer={props.onToggleDrawer}
      isDrawerOpen={props.isDrawerOpen}
      onOpenMathModal={props.onOpenMathModal}
    />
    <SimulationControls
      model={props.model}
      state={props.state}
      currentTimeMs={props.currentTimeMs}
      totalTimeMs={props.totalTimeMs}
      isPlaying={props.isPlaying}
      speed={props.speed}
      onTogglePlay={props.onTogglePlay}
      onReset={props.onReset}
      onStepNext={props.onStepNext}
      onStepPrev={props.onStepPrev}
      onScrubTime={props.onScrubTime}
      onChangeSpeed={props.onChangeSpeed}
      onOpenSaveModal={props.onOpenSaveModal}
      onOpenQr={props.onOpenQr}
      t={props.t}
      lang={props.lang}
    />
  </div>
);

export const Results: React.FC<AutomaticSimulatorSectionProps> = (props) => (
  <ValidationCard
    model={props.model}
    params={props.params}
    totalCycleTimeMs={props.totalCycleTimeMs}
    t={props.t}
    lang={props.lang}
  />
);

export const AutomaticSimulatorSection: React.FC<AutomaticSimulatorSectionProps> = (props) => {
  return (
    <section className="flex flex-col gap-4 md:gap-5 w-full min-w-0 select-none">
      <CanvasControls {...props} />
      <Results {...props} />
    </section>
  );
};
