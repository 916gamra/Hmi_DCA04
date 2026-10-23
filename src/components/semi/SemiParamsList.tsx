import React from 'react';
import { Translations, Language } from '../../core/i18n';
import { ExecutionPlan } from '../../core/plan';
import { SemiGeometryCard } from './SemiGeometryCard';
import { SemiPointsCard } from './SemiPointsCard';
import { SemiTimingCard } from './SemiTimingCard';

import { SemiSafetyCard } from './SemiSafetyCard';
import { SemiPlanCard } from './SemiPlanCard';
import { SemiButtonMapCard } from './SemiButtonMapCard';
import { ButtonMapResult } from '../../core/buttonMap';

export type SemiSectionId = 'geo' | 'pts' | 'timing' | 'modes' | 'safety' | 'plan' | 'bmap';

interface SemiParamsListProps {
  openSection: SemiSectionId | null;
  onToggleSection: (id: SemiSectionId) => void;
  buttonMap?: ButtonMapResult;
  onShowToast?: (msg: string) => void;
  t: Translations;
  lang: Language;
  isAr: boolean;

  // Geometry
  trayDMm: number;
  marginMm: number;
  layersCount: number;
  rLastDiameterMm: number;
  r1: number;
  rLastR: number;
  sMm: number;
  stepRadialMm: number;
  onSetTrayDMm: (val: number) => void;
  onSetMarginMm: (val: number) => void;
  onSetLayersCount: (val: number) => void;
  onSetRLastDiameterMm: (val: number) => void;

  // Points
  nPoints: number;
  stepAngleDeg: number;
  numberingMode: 'cam' | 'layer' | 'global';
  currentLayer: number;
  ringRadii: number[];
  onSetNPoints: (val: number) => void;
  onSetNumberingMode: (mode: 'cam' | 'layer' | 'global') => void;
  onSetStepRadialMm: (val: number) => void;
  onSetCurrentLayer: (layer: number) => void;
  onJumpToLayerRadius: (layer: number) => void;

  // Timing
  dwellSec: number;
  rotHz: number;
  expHz: number;
  onSetDwellSec: (val: number) => void;
  onSetRotHz: (val: number) => void;
  onSetExpHz: (val: number) => void;

  // Modes
  tableZUp: boolean;
  spindleOn: boolean;
  onToggleTableZ: () => void;
  onToggleSpindle: () => void;

  // Safety
  rHeadMinMm: number;
  rMm: number;
  onChangeRHeadMin: (val: number) => void;

  // Plan
  executionPlan: ExecutionPlan;
  camPlaybackStep: number | null;
  isPlayingCam: boolean;
  onSetCamPlaybackStep: (step: number | null) => void;
  onStepPrev: () => void;
  onStepNext: () => void;
  onTogglePlayCam: () => void;
  onSyncMachineToStep: (stepIdx: number) => void;
  onExitPreview: () => void;
}

export const SemiParamsList: React.FC<SemiParamsListProps> = ({
  openSection,
  onToggleSection,
  buttonMap,
  onShowToast,
  t,
  isAr,

  // Geometry
  trayDMm,
  marginMm,
  layersCount,
  rLastDiameterMm,
  r1,
  rLastR,
  sMm,
  stepRadialMm,
  onSetTrayDMm,
  onSetMarginMm,
  onSetLayersCount,
  onSetRLastDiameterMm,

  // Points
  nPoints,
  stepAngleDeg,
  numberingMode,
  currentLayer,
  ringRadii,
  onSetNPoints,
  onSetNumberingMode,
  onSetStepRadialMm,
  onSetCurrentLayer,
  onJumpToLayerRadius,

  // Timing
  dwellSec,
  rotHz,
  expHz,
  onSetDwellSec,
  onSetRotHz,
  onSetExpHz,

  // Modes
  tableZUp,
  spindleOn,
  onToggleTableZ,
  onToggleSpindle,

  // Safety
  rHeadMinMm,
  rMm,
  onChangeRHeadMin,

  // Plan
  executionPlan,
  camPlaybackStep,
  isPlayingCam,
  onSetCamPlaybackStep,
  onStepPrev,
  onStepNext,
  onTogglePlayCam,
  onSyncMachineToStep,
  onExitPreview,
}) => {
  return (
    <div className="flex flex-col gap-3">
      {/* 1. Géométrie du plateau */}
      <SemiGeometryCard
        isOpen={openSection === 'geo'}
        onToggle={() => onToggleSection('geo')}
        t={t}
        trayDMm={trayDMm}
        marginMm={marginMm}
        layersCount={layersCount}
        rLastDiameterMm={rLastDiameterMm}
        r1={r1}
        rLastR={rLastR}
        sMm={sMm}
        stepRadialMm={stepRadialMm}
        onSetTrayDMm={onSetTrayDMm}
        onSetMarginMm={onSetMarginMm}
        onSetLayersCount={onSetLayersCount}
        onSetRLastDiameterMm={onSetRLastDiameterMm}
      />

      {/* 2. Répartition des points & ANGLES */}
      <SemiPointsCard
        isOpen={openSection === 'pts'}
        onToggle={() => onToggleSection('pts')}
        t={t}
        isAr={isAr}
        nPoints={nPoints}
        stepAngleDeg={stepAngleDeg}
        numberingMode={numberingMode}
        stepRadialMm={stepRadialMm}
        layersCount={layersCount}
        sMm={sMm}
        currentLayer={currentLayer}
        ringRadii={ringRadii}
        onSetNPoints={onSetNPoints}
        onSetNumberingMode={onSetNumberingMode}
        onSetStepRadialMm={onSetStepRadialMm}
        onSetCurrentLayer={onSetCurrentLayer}
        onJumpToLayerRadius={onJumpToLayerRadius}
      />

      {/* 3. Temporisation et vitesse */}
      <SemiTimingCard
        isOpen={openSection === 'timing'}
        onToggle={() => onToggleSection('timing')}
        t={t}
        dwellSec={dwellSec}
        rotHz={rotHz}
        expHz={expHz}
        onSetDwellSec={onSetDwellSec}
        onSetRotHz={onSetRotHz}
        onSetExpHz={onSetExpHz}
      />



      {/* 5. Sécurité mécanique & Rayon minimal des têtes */}
      <SemiSafetyCard
        isOpen={openSection === 'safety'}
        onToggle={() => onToggleSection('safety')}
        t={t}
        isAr={isAr}
        rHeadMinMm={rHeadMinMm}
        rMm={rMm}
        r1={r1}
        rLastR={rLastR}
        onChangeRHeadMin={onChangeRHeadMin}
      />

      {/* 6. Plan d'exécution */}
      <SemiPlanCard
        isOpen={openSection === 'plan'}
        onToggle={() => onToggleSection('plan')}
        t={t}
        isAr={isAr}
        executionPlan={executionPlan}
        camPlaybackStep={camPlaybackStep}
        isPlayingCam={isPlayingCam}
        onSetCamPlaybackStep={onSetCamPlaybackStep}
        onStepPrev={onStepPrev}
        onStepNext={onStepNext}
        onTogglePlayCam={onTogglePlayCam}
        onSyncMachineToStep={onSyncMachineToStep}
        onExitPreview={onExitPreview}
      />

      {/* 7. Carte des boutons (Button Map) */}
      {buttonMap && (
        <SemiButtonMapCard
          buttonMap={buttonMap}
          camPlaybackStep={camPlaybackStep}
          onSyncMachineToStep={onSyncMachineToStep}
          onShowToast={onShowToast}
          isAr={isAr}
          t={t}
        />
      )}
    </div>
  );
};
