import React from 'react';
import { Translations, Language } from '../core/i18n';
import { ViewOptions, TrayParams } from '../types';
import { SemiParamsList } from './semi/SemiParamsList';
import { useSemiAutoSession } from '../hooks/useSemiAutoSession';
import { useSemiAutoModel } from '../hooks/useSemiAutoModel';
import { SemiWorkspace } from './layout/SemiWorkspace';

interface SemiAutomaticPageProps {
  t: Translations;
  lang: Language;
  params?: TrayParams;
  onShowToast?: (msg: string) => void;
  viewOptions?: ViewOptions;
  setViewOptions?: (opts: ViewOptions) => void;
}

export const SemiAutomaticPage: React.FC<SemiAutomaticPageProps> = ({
  t,
  lang,
  params,
  onShowToast,
  viewOptions: propViewOptions,
  setViewOptions: propSetViewOptions,
}) => {
  const session = useSemiAutoSession(
    t,
    lang,
    params,
    onShowToast,
    propViewOptions,
    propSetViewOptions
  );

  const { semiAutoModel, semiAutoState } = useSemiAutoModel(session);

  const {
    isAr,
    trayDMm,
    marginMm,
    layersCount,
    rLastDiameterMm,
    nPoints,
    stepAngleDeg,
    stepRadialMm,
    r1,
    rLastR,
    sMm,
    ringRadii,
    rHeadMinMm,
    thetaDeg,
    rMm,
    spindleOn,
    plungeDown,
    tableZUp,
    dwellSec,
    rotHz,
    expHz,
    currentLayer,
    holes,
    numberingMode,
    executionPlan,
    planSource,
    previewScope,
    isMacroDrilling,
    camPlaybackStep,
    camSpeed,
    buttonMap,
    setCamPlaybackStep,
    setCamSpeed,
    setPlanSource,
    setPreviewScope,
    isPlayingCam,
    isMobileDrawerOpen,
    isClearConfirmOpen,
    openSection,
    viewOptions,
    activePlaybackStep,
    setTrayDMm,
    setMarginMm,
    setLayersCount,
    setRLastDiameterMm,
    setNPoints,
    setStepRadialMm,
    setNumberingMode,
    setCurrentLayer,
    setDwellSec,
    setRotHz,
    setExpHz,
    setTableZUp,
    setSpindleOn,
    setIsMobileDrawerOpen,
    setIsClearConfirmOpen,
    handleUpdateViewOptions,
    handleTableStep,
    handleTableHome,
    handleRadialStep,
    handleRadialMax,
    handleJumpToLayerRadius,
    handleSyncMachineToStep,
    handlePlungeDown,
    handlePlungeUp,
    handlePlungeCancel,
    handleUndoLastPlunge,
    handleClearAllHoles,
    handleChangeRHeadMin,
    handleStepPrev,
    handleStepNext,
    handleTogglePlayCam,
    handleExitCamPreview,
    handleToggleSection,
    handleAutoDrillCurrentLayer,
    handleCancelMacroDrill,
    lockedDesign,
    handleLockDesign,
    handleUnlockDesign,
  } = session;

  const paramsList = (
    <SemiParamsList
      openSection={openSection}
      onToggleSection={handleToggleSection}
      t={t}
      lang={lang}
      isAr={isAr}
      trayDMm={trayDMm}
      marginMm={marginMm}
      layersCount={layersCount}
      rLastDiameterMm={rLastDiameterMm}
      r1={r1}
      rLastR={rLastR}
      sMm={sMm}
      stepRadialMm={stepRadialMm}
      onSetTrayDMm={(val) => setTrayDMm(Math.max(100, val))}
      onSetMarginMm={(val) => setMarginMm(Math.max(0, val))}
      onSetLayersCount={(val) => setLayersCount(Math.max(1, Math.min(7, Math.round(val))))}
      onSetRLastDiameterMm={(val) => setRLastDiameterMm(Math.max(10, val))}
      nPoints={nPoints}
      stepAngleDeg={stepAngleDeg}
      numberingMode={numberingMode}
      currentLayer={currentLayer}
      ringRadii={ringRadii}
      onSetNPoints={(val) => setNPoints(Math.max(3, Math.round(val)))}
      onSetNumberingMode={setNumberingMode}
      onSetStepRadialMm={(val) => setStepRadialMm(Math.max(1, val))}
      onSetCurrentLayer={setCurrentLayer}
      onJumpToLayerRadius={handleJumpToLayerRadius}
      dwellSec={dwellSec}
      rotHz={rotHz}
      expHz={expHz}
      onSetDwellSec={(val) => setDwellSec(Math.max(0, val))}
      onSetRotHz={(val) => setRotHz(Math.max(0.1, val))}
      onSetExpHz={(val) => setExpHz(Math.max(0.1, val))}
      tableZUp={tableZUp}
      spindleOn={spindleOn}
      onToggleTableZ={() => setTableZUp(!tableZUp)}
      onToggleSpindle={() => setSpindleOn(!spindleOn)}
      rHeadMinMm={rHeadMinMm}
      rMm={rMm}
      onChangeRHeadMin={handleChangeRHeadMin}
      executionPlan={executionPlan}
      camPlaybackStep={camPlaybackStep}
      isPlayingCam={isPlayingCam}
      onSetCamPlaybackStep={setCamPlaybackStep}
      onStepPrev={handleStepPrev}
      onStepNext={handleStepNext}
      onTogglePlayCam={handleTogglePlayCam}
      onSyncMachineToStep={handleSyncMachineToStep}
      onExitPreview={handleExitCamPreview}
      buttonMap={buttonMap}
      onShowToast={onShowToast}
      onSetCamSpeed={setCamSpeed}
    />
  );

  return (
    <SemiWorkspace
      model={semiAutoModel}
      state={semiAutoState}
      viewOptions={viewOptions}
      onChangeOptions={handleUpdateViewOptions}
      t={t}
      lang={lang}
      isAr={isAr}
      thetaDeg={thetaDeg}
      rMm={rMm}
      rHeadMinMm={rHeadMinMm}
      currentLayer={currentLayer}
      spindleOn={spindleOn}
      holesCount={holes.length}
      maxHolesCount={layersCount * nPoints}
      dwellSec={dwellSec}
      stepAngleDeg={stepAngleDeg}
      stepRadialMm={stepRadialMm}
      tableZUp={tableZUp}
      plungeDown={plungeDown}
      executionPlan={executionPlan}
      activePlaybackStep={activePlaybackStep}
      isPlayingCam={isPlayingCam}
      planSource={planSource}
      previewScope={previewScope}
      onSetPlanSource={setPlanSource}
      onSetPreviewScope={setPreviewScope}
      isMobileDrawerOpen={isMobileDrawerOpen}
      isClearConfirmOpen={isClearConfirmOpen}
      paramsList={paramsList}
      onToggleDrawer={() => setIsMobileDrawerOpen((prev) => !prev)}
      onCloseDrawer={() => setIsMobileDrawerOpen(false)}
      onUndoLastPlunge={handleUndoLastPlunge}
      onOpenPlan={() => {
        handleToggleSection('plan');
        setIsMobileDrawerOpen(true);
      }}
      onOpenClearConfirm={() => setIsClearConfirmOpen(true)}
      onCloseClearConfirm={() => setIsClearConfirmOpen(false)}
      onConfirmClear={handleClearAllHoles}
      onTableStep={handleTableStep}
      onTableHome={handleTableHome}
      onRadialStep={handleRadialStep}
      onRadialMax={handleRadialMax}
      onSetTableZUp={setTableZUp}
      onSetSpindleOn={setSpindleOn}
      onPlungeDown={handlePlungeDown}
      onPlungeUp={handlePlungeUp}
      onPlungeCancel={handlePlungeCancel}
      onSyncMachineToStep={handleSyncMachineToStep}
      onExitCamPreview={handleExitCamPreview}
      onStepPrev={handleStepPrev}
      onStepNext={handleStepNext}
      onTogglePlayCam={handleTogglePlayCam}
      camPlaybackStep={camPlaybackStep}
      onSetCamPlaybackStep={setCamPlaybackStep}
      camSpeed={camSpeed}
      onSetCamSpeed={setCamSpeed}
      buttonMap={buttonMap}
      onShowToast={onShowToast}
      lockedDesign={lockedDesign}
      onLockDesign={handleLockDesign}
      onUnlockDesign={handleUnlockDesign}
    />
  );
};
