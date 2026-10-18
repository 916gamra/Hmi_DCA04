import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Translations, Language } from '../core/i18n';
import { norm360 } from '../core/model';
import { safeStorage } from '../core/safeStorage';
import { HEADS } from '../core/constants';
import { buildExecutionPlan, buildPreviewPlan, ExecutionPlan, PlanStep } from '../core/plan';
import { generateButtonMap, generateButtonMapFromExecutionPlan, ButtonMapResult } from '../core/buttonMap';
import { ViewOptions, TrayParams } from '../types';
import { SemiSectionId } from '../components/semi/SemiParamsList';

export interface SemiHole {
  id: string;
  globalIndex?: number;
  layer: number;
  r: number;
  a: number;
  head: 0 | 1 | 2;
  drilledAt: number;
}

export const STORAGE_KEY_SEMI = 'hmi-tray-semiauto-state-v4';
const MAX_HOLES = 1500;

export interface SemiAutoSavedState {
  thetaDeg?: number;
  rMm?: number;
  spindleOn?: boolean;
  tableZUp?: boolean;
  trayDMm?: number;
  marginMm?: number;
  layersCount?: number;
  rLastDiameterMm?: number;
  nPoints?: number;
  stepRadialMm?: number;
  rHeadMinMm?: number;
  dwellSec?: number;
  rotHz?: number;
  expHz?: number;
  currentLayer?: number;
  holes?: SemiHole[];
  numberingMode?: 'cam' | 'layer' | 'global';
  planSource?: 'preview' | 'replay';
  previewScope?: 'all' | 'currentLayer';
  savedDesign?: SemiHole[];
}

function safeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export interface UseSemiAutoSessionReturn {
  isAr: boolean;
  trayDMm: number;
  marginMm: number;
  layersCount: number;
  rLastDiameterMm: number;
  nPoints: number;
  stepAngleDeg: number;
  stepRadialMm: number;
  R: number;
  r1: number;
  rLastR: number;
  sMm: number;
  ringRadii: number[];
  rHeadMinMm: number;
  thetaDeg: number;
  rMm: number;
  spindleOn: boolean;
  plungeDown: boolean;
  tableZUp: boolean;
  dwellSec: number;
  rotHz: number;
  expHz: number;
  currentLayer: number;
  holes: SemiHole[];
  numberingMode: 'cam' | 'layer' | 'global';
  executionPlan: ExecutionPlan;
  actualPlan: ExecutionPlan;
  previewPlan: ExecutionPlan;
  buttonMap: ButtonMapResult;
  planSource: 'preview' | 'replay';
  previewScope: 'all' | 'currentLayer';
  camSpeed: number;
  camPlaybackStep: number | null;
  isPlayingCam: boolean;
  isMobileDrawerOpen: boolean;
  isClearConfirmOpen: boolean;
  openSection: SemiSectionId | null;
  viewOptions: ViewOptions;
  toolRadius: number;
  activePlaybackStep: PlanStep | null;
  displayTheta: number;
  displayR: number;
  isAnimating: boolean;
  isTableRotatingCW: boolean;
  isPlungeVisual: boolean;
  isMacroDrilling: boolean;
  setPlanSource: (src: 'preview' | 'replay') => void;
  setPreviewScope: (scope: 'all' | 'currentLayer') => void;
  setCamSpeed: (speed: number) => void;
  setTrayDMm: (v: number) => void;
  setMarginMm: (v: number) => void;
  setLayersCount: (v: number) => void;
  setRLastDiameterMm: (v: number) => void;
  setNPoints: (v: number) => void;
  setStepRadialMm: (v: number) => void;
  setNumberingMode: (m: 'cam' | 'layer' | 'global') => void;
  setCurrentLayer: (l: number) => void;
  setDwellSec: (d: number) => void;
  setRotHz: (h: number) => void;
  setExpHz: (h: number) => void;
  setTableZUp: (b: boolean) => void;
  setSpindleOn: (b: boolean) => void;
  setIsMobileDrawerOpen: (b: boolean | ((prev: boolean) => boolean)) => void;
  setIsClearConfirmOpen: (b: boolean) => void;
  handleUpdateViewOptions: (opts: ViewOptions) => void;
  handleTableStep: (dir: 1 | -1) => void;
  handleTableHome: () => void;
  handleRadialStep: (dir: 1 | -1) => void;
  handleRadialMax: () => void;
  handleJumpToLayerRadius: (layerIdx: number) => void;
  handleSyncMachineToStep: (stepIdx?: number) => void;
  handlePlungeDown: () => void;
  handlePlungeUp: () => void;
  handlePlungeCancel: () => void;
  setCamPlaybackStep: (step: number | null) => void;
  handleUndoLastPlunge: () => void;
  handleClearAllHoles: () => void;
  handleChangeRHeadMin: (val: number) => void;
  handleStepPrev: () => void;
  handleStepNext: () => void;
  handleTogglePlayCam: () => void;
  handleExitCamPreview: () => void;
  handleToggleSection: (id: SemiSectionId) => void;
  handleAutoDrillCurrentLayer: () => Promise<void>;
  handleCancelMacroDrill: () => void;
  lockedDesign: SemiHole[] | null;
  handleLockDesign: () => void;
  handleUnlockDesign: () => void;
}

export function useSemiAutoSession(
  t: Translations,
  lang: Language,
  params?: TrayParams,
  onShowToast?: (msg: string) => void,
  propViewOptions?: ViewOptions,
  propSetViewOptions?: (opts: ViewOptions) => void
): UseSemiAutoSessionReturn {
  const isAr = lang === 'ar';

  const savedState = useMemo<SemiAutoSavedState>(() => {
    return safeStorage.getJSON<SemiAutoSavedState>(STORAGE_KEY_SEMI, {});
  }, []);

  const defaultTrayD = params?.trayD && Number.isFinite(params.trayD) ? params.trayD : 440;
  const defaultMargin = params?.margin && Number.isFinite(params.margin) ? params.margin : 20;
  const defaultLayers = params?.layers && Number.isFinite(params.layers) ? Math.max(1, Math.min(7, params.layers)) : 3;
  const defaultRLastD = params?.rLast && Number.isFinite(params.rLast) ? params.rLast : 160;
  const defaultN = params?.rawBase && Number.isFinite(params.rawBase) ? params.rawBase : 12;

  const [trayDMm, setTrayDMm] = useState<number>(() => {
    const v = savedState.trayDMm;
    return typeof v === 'number' && Number.isFinite(v) && v >= 50 ? v : defaultTrayD;
  });

  const [marginMm, setMarginMm] = useState<number>(() => {
    const v = savedState.marginMm;
    return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : defaultMargin;
  });

  const [layersCount, setLayersCount] = useState<number>(() => {
    const v = savedState.layersCount;
    return typeof v === 'number' && Number.isFinite(v) && v >= 1 && v <= 7 ? Math.round(v) : defaultLayers;
  });

  const [rLastDiameterMm, setRLastDiameterMm] = useState<number>(() => {
    const v = savedState.rLastDiameterMm;
    return typeof v === 'number' && Number.isFinite(v) && v >= 10 ? v : defaultRLastD;
  });

  const [nPoints, setNPoints] = useState<number>(() => {
    const v = savedState.nPoints;
    return typeof v === 'number' && Number.isFinite(v) && v >= 3 ? Math.round(v) : defaultN;
  });

  const stepAngleDeg = useMemo(() => {
    const safeN = Math.max(1, nPoints);
    return Number((360 / safeN).toFixed(3));
  }, [nPoints]);

  const [stepRadialMm, setStepRadialMm] = useState<number>(() => {
    const v = savedState.stepRadialMm;
    return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 15;
  });

  const R = useMemo(() => trayDMm / 2, [trayDMm]);
  const r1 = useMemo(() => Math.max(0, R - marginMm), [R, marginMm]);
  const rLastR = useMemo(() => Math.max(0, rLastDiameterMm / 2), [rLastDiameterMm]);

  const sMm = useMemo(() => {
    return layersCount > 1 ? (r1 - rLastR) / (layersCount - 1) : 0;
  }, [layersCount, r1, rLastR]);

  const ringRadii = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < layersCount; i++) {
      const ri = i === layersCount - 1 ? rLastR : Math.max(0, r1 - i * sMm);
      arr.push(Number(ri.toFixed(2)));
    }
    return arr;
  }, [layersCount, r1, rLastR, sMm]);

  const [rHeadMinMm, setRHeadMinMm] = useState<number>(() => {
    const v = savedState.rHeadMinMm;
    return typeof v === 'number' && Number.isFinite(v) && v >= 5 ? v : 40;
  });

  const [thetaDeg, setThetaDeg] = useState<number>(() => {
    const v = savedState.thetaDeg;
    return typeof v === 'number' && Number.isFinite(v) ? v : 0;
  });

  const [rMm, setRMm] = useState<number>(() => {
    const v = savedState.rMm;
    const initial = typeof v === 'number' && Number.isFinite(v) ? v : (ringRadii[0] || 120);
    const minLimit = typeof savedState.rHeadMinMm === 'number' && Number.isFinite(savedState.rHeadMinMm) && savedState.rHeadMinMm >= 5 ? savedState.rHeadMinMm : 40;
    return Math.max(minLimit, initial);
  });

  const [spindleOn, setSpindleOn] = useState<boolean>(() => {
    return Boolean(savedState.spindleOn);
  });

  const [plungeDown, setPlungeDown] = useState<boolean>(false);

  const [tableZUp, setTableZUp] = useState<boolean>(() => {
    return savedState.tableZUp !== false;
  });

  const [dwellSec, setDwellSec] = useState<number>(() => {
    const v = savedState.dwellSec;
    return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0;
  });

  const [rotHz, setRotHz] = useState<number>(() => {
    const v = savedState.rotHz;
    return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 1.5;
  });

  const [expHz, setExpHz] = useState<number>(() => {
    const v = savedState.expHz;
    return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 2.0;
  });

  const [currentLayer, setCurrentLayer] = useState<number>(() => {
    const v = savedState.currentLayer;
    return typeof v === 'number' && Number.isFinite(v) && v >= 0 && v < 7 ? Math.round(v) : 0;
  });

  const [holes, setHoles] = useState<SemiHole[]>(() => {
    const arr = savedState.holes;
    if (Array.isArray(arr)) {
      return arr.filter(
        (h): h is SemiHole =>
          Boolean(h) &&
          typeof h.r === 'number' &&
          Number.isFinite(h.r) &&
          typeof h.a === 'number' &&
          Number.isFinite(h.a)
      );
    }
    return [];
  });

  const [numberingMode, setNumberingMode] = useState<'cam' | 'layer' | 'global'>(() => {
    const v = savedState.numberingMode;
    if (v === 'global') return 'global';
    if (v === 'layer') return 'layer';
    return 'cam';
  });

  const [lockedDesign, setLockedDesign] = useState<SemiHole[] | null>(() => {
    return Array.isArray(savedState.savedDesign) ? savedState.savedDesign : null;
  });

  // S1: Plan source & preview scope state
  const [planSource, setPlanSource] = useState<'preview' | 'replay'>(() => {
    if (savedState.planSource === 'replay' || savedState.planSource === 'preview') {
      return savedState.planSource;
    }
    return savedState.holes && savedState.holes.length > 0 ? 'replay' : 'preview';
  });

  const [previewScope, setPreviewScope] = useState<'all' | 'currentLayer'>(() => {
    return savedState.previewScope === 'currentLayer' ? 'currentLayer' : 'all';
  });

  // Replay plan: built from actual drilled holes or locked design
  const actualPlan = useMemo<ExecutionPlan>(() => {
    const designToUse = lockedDesign || holes;
    return buildExecutionPlan(designToUse, {
      stepRadialMm,
      stepAngleDeg,
      ringRadii,
    });
  }, [holes, lockedDesign, stepRadialMm, stepAngleDeg, ringRadii]);

  // Preview plan: built from theoretical geometric grid (even if holes = [])
  const previewPlan = useMemo<ExecutionPlan>(() => {
    return buildPreviewPlan({
      ringRadii,
      nPoints,
      stepAngleDeg,
      stepRadialMm,
      layerFilter: previewScope === 'currentLayer' ? currentLayer : undefined,
    });
  }, [ringRadii, nPoints, stepAngleDeg, stepRadialMm, previewScope, currentLayer]);

  // Active execution plan: replay if holes exist and replay selected, otherwise preview
  const executionPlan = useMemo<ExecutionPlan>(() => {
    if (planSource === 'replay' && holes.length > 0) {
      return actualPlan;
    }
    return previewPlan;
  }, [planSource, holes.length, actualPlan, previewPlan]);

  const [camPlaybackStep, setCamPlaybackStep] = useState<number | null>(null);
  const [camSpeed, setCamSpeed] = useState<number>(1);
  const [isPlayingCam, setIsPlayingCam] = useState<boolean>(false);

  // S2 & S4: Smooth animation & display state
  const [displayTheta, setDisplayTheta] = useState<number>(thetaDeg);
  const [displayR, setDisplayR] = useState<number>(rMm);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [isTableRotatingCW, setIsTableRotatingCW] = useState<boolean>(false);
  const [isPlungeVisual, setIsPlungeVisual] = useState<boolean>(false);

  // S4: Deterministic Button Map generated directly from the active execution plan (user design or preview grid)
  const buttonMap = useMemo<ButtonMapResult>(() => {
    return generateButtonMapFromExecutionPlan(executionPlan, stepRadialMm, stepAngleDeg);
  }, [executionPlan, stepRadialMm, stepAngleDeg]);

  // S3: Macro auto-drill state
  const [isMacroDrilling, setIsMacroDrilling] = useState<boolean>(false);
  const macroCancelRef = useRef<boolean>(false);

  const displayThetaRef = useRef<number>(thetaDeg);
  const displayRRef = useRef<number>(rMm);
  const isPlayingCamRef = useRef<boolean>(isPlayingCam);
  isPlayingCamRef.current = isPlayingCam;

  const executionPlanRef = useRef<ExecutionPlan>(executionPlan);
  executionPlanRef.current = executionPlan;

  const animFrameRef = useRef<number | null>(null);
  const animTimeoutRef = useRef<number | null>(null);

  // Clamp camPlaybackStep if totalPlunges changes
  useEffect(() => {
    if (camPlaybackStep !== null && executionPlan.totalPlunges > 0 && camPlaybackStep > executionPlan.totalPlunges) {
      setCamPlaybackStep(executionPlan.totalPlunges);
    }
  }, [executionPlan.totalPlunges, camPlaybackStep]);

  // Keep display synchronized with manual machine adjustments when not in preview/replay
  useEffect(() => {
    if (camPlaybackStep === null) {
      setDisplayTheta(thetaDeg);
      displayThetaRef.current = thetaDeg;
      setDisplayR(rMm);
      displayRRef.current = rMm;
      setIsTableRotatingCW(false);
    }
  }, [camPlaybackStep, thetaDeg, rMm]);

  const activePlaybackStep = useMemo<PlanStep | null>(() => {
    if (camPlaybackStep !== null && executionPlan.steps[camPlaybackStep - 1]) {
      return executionPlan.steps[camPlaybackStep - 1];
    }
    return null;
  }, [camPlaybackStep, executionPlan.steps]);

  // S4: Strict Unidirectional Clockwise (CW) mechanical interpolation animation
  useEffect(() => {
    if (activePlaybackStep) {
      const targetR = activePlaybackStep.rMm;
      const targetTheta = activePlaybackStep.thetaDeg;

      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (animTimeoutRef.current !== null) {
        clearTimeout(animTimeoutRef.current);
        animTimeoutRef.current = null;
      }

      const startR = displayRRef.current;
      const startTheta = displayThetaRef.current;
      const startTime = performance.now();

      // Clockwise (CW) angular distance in machine table coordinates
      const dCW = (norm360(startTheta) - norm360(targetTheta) + 360) % 360;
      const hasAngularMove = dCW > 0.05 && dCW < 359.95;
      const deltaR = targetR - startR;
      const hasRadialMove = Math.abs(deltaR) > 0.05;

      // 2-Phase mechanical timing:
      // When both radial and angular change (layer transition):
      // 1. Table stops at last hole while radial carriage steps inward (Phase 1)
      // 2. Table rotates strictly Clockwise (CW) to next hole (Phase 2)
      const rDuration = (hasRadialMove ? 220 : 0) / camSpeed;
      const thetaDuration = (hasAngularMove ? 260 : 0) / camSpeed;
      const totalDuration =
        hasRadialMove && hasAngularMove
          ? rDuration + thetaDuration
          : Math.max(rDuration, thetaDuration, 180 / camSpeed);

      setIsAnimating(true);
      setIsTableRotatingCW(hasAngularMove);
      setIsPlungeVisual(false);

      const stepFrame = (now: number) => {
        const elapsed = now - startTime;

        let curR = startR;
        let curTheta = startTheta;

        if (hasRadialMove && hasAngularMove) {
          if (elapsed <= rDuration) {
            // Phase 1: Radial inward movement. Table remains stationary at last hole!
            const rProgress = Math.min(1, elapsed / rDuration);
            const rEase = 1 - Math.pow(1 - rProgress, 3);
            curR = Number((startR + deltaR * rEase).toFixed(2));
            curTheta = startTheta;
          } else {
            // Phase 2: Rotary table indexes Clockwise (CW) to target angle!
            curR = targetR;
            const thetaElapsed = elapsed - rDuration;
            const thetaProgress = Math.min(1, thetaElapsed / thetaDuration);
            const thetaEase = 1 - Math.pow(1 - thetaProgress, 3);
            curTheta = Number(norm360(startTheta - dCW * thetaEase).toFixed(2));
          }
        } else if (hasRadialMove) {
          const rProgress = Math.min(1, elapsed / totalDuration);
          const rEase = 1 - Math.pow(1 - rProgress, 3);
          curR = Number((startR + deltaR * rEase).toFixed(2));
          curTheta = startTheta;
        } else if (hasAngularMove) {
          const thetaProgress = Math.min(1, elapsed / totalDuration);
          const thetaEase = 1 - Math.pow(1 - thetaProgress, 3);
          curR = startR;
          curTheta = Number(norm360(startTheta - dCW * thetaEase).toFixed(2));
        } else {
          curR = targetR;
          curTheta = targetTheta;
        }

        setDisplayR(curR);
        displayRRef.current = curR;
        setDisplayTheta(curTheta);
        displayThetaRef.current = curTheta;

        if (elapsed < totalDuration) {
          animFrameRef.current = requestAnimationFrame(stepFrame);
        } else {
          setDisplayR(targetR);
          displayRRef.current = targetR;
          setDisplayTheta(targetTheta);
          displayThetaRef.current = targetTheta;
          setIsAnimating(false);
          setIsTableRotatingCW(false);
          animFrameRef.current = null;

          // Visual plunge flash for 150ms / camSpeed
          setIsPlungeVisual(true);
          animTimeoutRef.current = window.setTimeout(() => {
            setIsPlungeVisual(false);
            animTimeoutRef.current = null;

            if (isPlayingCamRef.current) {
              animTimeoutRef.current = window.setTimeout(() => {
                animTimeoutRef.current = null;
                if (isPlayingCamRef.current) {
                  setCamPlaybackStep((prev) => {
                    const cur = prev ?? 1;
                    const total = executionPlanRef.current.steps.length;
                    if (cur >= total) {
                      setIsPlayingCam(false);
                      return cur;
                    }
                    return cur + 1;
                  });
                }
              }, 180 / camSpeed);
            }
          }, 150 / camSpeed);
        }
      };

      animFrameRef.current = requestAnimationFrame(stepFrame);
    } else {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (animTimeoutRef.current !== null) {
        clearTimeout(animTimeoutRef.current);
        animTimeoutRef.current = null;
      }
      setIsAnimating(false);
      setIsTableRotatingCW(false);
      setIsPlungeVisual(false);
    }

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (animTimeoutRef.current !== null) {
        clearTimeout(animTimeoutRef.current);
        animTimeoutRef.current = null;
      }
    };
  }, [activePlaybackStep]);

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState<boolean>(false);
  const [openSection, setOpenSection] = useState<SemiSectionId | null>('geo');

  const [internalViewOptions, setInternalViewOptions] = useState<ViewOptions>(() => {
    const stored = safeStorage.getItem('hmi-tray-canvas-theme');
    const savedTheme: 'light' | 'dark' = stored === 'light' || stored === 'dark' ? stored : 'dark';
    return {
      sectors: true,
      heads: true,
      rings: true,
      labels: false,
      dimensions: true,
      theme: savedTheme,
      frameMode: 'machine',
    };
  });

  const viewOptions = useMemo<ViewOptions>(() => {
    if (propViewOptions) {
      return {
        ...propViewOptions,
        frameMode: 'machine',
      };
    }
    return internalViewOptions;
  }, [propViewOptions, internalViewOptions]);

  const handleUpdateViewOptions = useCallback(
    (newOpts: ViewOptions) => {
      const nextWithMachine: ViewOptions = { ...newOpts, frameMode: 'machine' };
      if (propSetViewOptions) {
        propSetViewOptions(nextWithMachine);
      } else {
        setInternalViewOptions(nextWithMachine);
      }
      if (newOpts.theme) {
        safeStorage.setItem('hmi-tray-canvas-theme', newOpts.theme);
      }
    },
    [propSetViewOptions]
  );

  useEffect(() => {
    const payload: SemiAutoSavedState = {
      thetaDeg,
      rMm,
      spindleOn,
      tableZUp,
      trayDMm,
      marginMm,
      layersCount,
      rLastDiameterMm,
      nPoints,
      stepRadialMm,
      rHeadMinMm,
      dwellSec,
      rotHz,
      expHz,
      currentLayer,
      holes,
      numberingMode,
      planSource,
      previewScope,
      savedDesign: lockedDesign,
    };
    safeStorage.setJSON(STORAGE_KEY_SEMI, payload);
  }, [
    thetaDeg,
    rMm,
    spindleOn,
    tableZUp,
    trayDMm,
    marginMm,
    layersCount,
    rLastDiameterMm,
    nPoints,
    stepRadialMm,
    rHeadMinMm,
    dwellSec,
    rotHz,
    expHz,
    currentLayer,
    holes,
    numberingMode,
    planSource,
    previewScope,
    lockedDesign,
  ]);

  useEffect(() => {
    if (rMm < rHeadMinMm) {
      setRMm(rHeadMinMm);
    } else if (rMm > R) {
      setRMm(R);
    }
  }, [R, rMm, rHeadMinMm]);

  useEffect(() => {
    if (currentLayer >= layersCount) {
      setCurrentLayer(Math.max(0, layersCount - 1));
    }
  }, [layersCount, currentLayer]);

  useEffect(() => {
    if (rLastR > r1) {
      setRLastDiameterMm(Math.max(10, Math.round(r1 * 2)));
    }
  }, [r1, rLastR]);

  const handleTableStep = useCallback(
    (dir: 1 | -1) => {
      setThetaDeg((prev) => norm360(prev + dir * stepAngleDeg));
    },
    [stepAngleDeg]
  );

  const handleTableHome = useCallback(() => {
    setThetaDeg(0);
  }, []);

  const handleRadialStep = useCallback(
    (dir: 1 | -1) => {
      setRMm((prev) => {
        const next = prev + dir * stepRadialMm;
        if (dir === -1 && next < rHeadMinMm) {
          if (onShowToast) {
            onShowToast(t.rHeadMinLimitReached);
          }
          return rHeadMinMm;
        }
        if (dir === 1 && next > R) {
          return R;
        }
        return Math.max(rHeadMinMm, Math.min(next, R));
      });
    },
    [stepRadialMm, R, rHeadMinMm, onShowToast, t]
  );

  const handleRadialMax = useCallback(() => {
    setRMm(r1);
  }, [r1]);

  const handleJumpToLayerRadius = useCallback(
    (layerIdx: number) => {
      const targetR = ringRadii[layerIdx];
      if (typeof targetR === 'number' && Number.isFinite(targetR)) {
        if (targetR < rHeadMinMm) {
          setRMm(rHeadMinMm);
          if (onShowToast) {
            onShowToast(t.rHeadMinLimitReached);
          }
        } else {
          setRMm(targetR);
        }
      }
    },
    [ringRadii, rHeadMinMm, onShowToast, t]
  );

  const handleSyncMachineToStep = useCallback(
    (stepIdx?: number) => {
      const targetIdx = stepIdx ?? camPlaybackStep ?? 1;
      const st = executionPlan.steps[targetIdx - 1];
      if (st) {
        setRMm(st.rMm);
        setThetaDeg(st.thetaDeg);
        setDisplayR(st.rMm);
        displayRRef.current = st.rMm;
        setDisplayTheta(st.thetaDeg);
        displayThetaRef.current = st.thetaDeg;
        if (onShowToast) {
          onShowToast(
            isAr
              ? `تمت مزامنة الآلة مع الخطوة #${st.stepIndex} (r=${st.rMm} مم، θ=${st.thetaDeg}°)`
              : `Machine synchronisée sur l'étape #${st.stepIndex} (r=${st.rMm}mm, θ=${st.thetaDeg}°)`
          );
        }
      }
    },
    [camPlaybackStep, executionPlan.steps, onShowToast, isAr]
  );

  const plungeTimerRef = useRef<number | null>(null);
  const isPlungingRef = useRef<boolean>(false);

  useEffect(() => {
    return () => {
      if (plungeTimerRef.current !== null) {
        window.clearTimeout(plungeTimerRef.current);
      }
    };
  }, []);

  const recordHoles = useCallback(() => {
    if (holes.length >= MAX_HOLES) {
      if (onShowToast) {
        onShowToast(t.maxHolesReachedWarning);
      }
      return;
    }

    let assignedLayer = currentLayer;
    let minDiff = Infinity;
    ringRadii.forEach((ri, idx) => {
      const diff = Math.abs(ri - rMm);
      if (diff < minDiff) {
        minDiff = diff;
        assignedLayer = idx;
      }
    });

    const newHoles: SemiHole[] = HEADS.map((hConfig, headIdx) => {
      const aTray = norm360(hConfig.angle - thetaDeg);

      let closestK = 0;
      let minADiff = Infinity;
      for (let k = 0; k < nPoints; k++) {
        const targetA = norm360(k * stepAngleDeg);
        const aDiff = Math.abs(norm360(aTray) - targetA);
        const angDist = Math.min(aDiff, 360 - aDiff);
        if (angDist < minADiff) {
          minADiff = angDist;
          closestK = k;
        }
      }

      const isGridMatch = minDiff < 2.5 && minADiff < 0.75;
      const globalIndex = isGridMatch ? assignedLayer * nPoints + closestK + 1 : undefined;

      return {
        id: safeId(),
        globalIndex,
        layer: assignedLayer,
        r: rMm,
        a: aTray,
        head: headIdx as 0 | 1 | 2,
        drilledAt: Date.now(),
      };
    });

    setHoles((prev) => {
      const filteredNew = newHoles.filter(
        (nh) =>
          !prev.some((ph) => {
            const rSame = Math.abs(ph.r - nh.r) < 1.0;
            const aDiff = Math.abs(norm360(ph.a) - norm360(nh.a));
            const aSame = Math.min(aDiff, 360 - aDiff) < 0.5;
            return rSame && aSame;
          })
      );
      return [...prev, ...filteredNew];
    });
  }, [holes.length, currentLayer, ringRadii, rMm, thetaDeg, nPoints, stepAngleDeg, onShowToast, t.maxHolesReachedWarning]);

  const handlePlungeDown = useCallback(() => {
    if (isPlungingRef.current) return;

    if (!spindleOn) {
      if (onShowToast) {
        onShowToast(t.spindleOffWarning);
      }
      return;
    }

    if (dwellSec <= 0) {
      isPlungingRef.current = true;
      setPlungeDown(true);
      recordHoles();
    } else {
      isPlungingRef.current = true;
      setPlungeDown(true);
      recordHoles();

      if (plungeTimerRef.current !== null) {
        window.clearTimeout(plungeTimerRef.current);
      }
      plungeTimerRef.current = window.setTimeout(() => {
        setPlungeDown(false);
        isPlungingRef.current = false;
        plungeTimerRef.current = null;
      }, dwellSec * 1000);
    }
  }, [spindleOn, dwellSec, onShowToast, t.spindleOffWarning, recordHoles]);

  const handlePlungeUp = useCallback(() => {
    if (dwellSec <= 0) {
      setPlungeDown(false);
      isPlungingRef.current = false;
    }
  }, [dwellSec]);

  const handlePlungeCancel = useCallback(() => {
    if (dwellSec <= 0) {
      setPlungeDown(false);
      isPlungingRef.current = false;
    }
  }, [dwellSec]);

  const handleUndoLastPlunge = useCallback(() => {
    setHoles((prev) => (prev.length >= 3 ? prev.slice(0, prev.length - 3) : []));
  }, []);

  const handleClearAllHoles = useCallback(() => {
    setHoles([]);
  }, []);

  const toolRadius = params?.tool ? params.tool / 2 : 8;

  const handleChangeRHeadMin = useCallback(
    (val: number) => {
      const clampedVal = Math.max(5, Math.min(val, Math.round(r1)));
      setRHeadMinMm(clampedVal);
      if (rMm < clampedVal) {
        setRMm(clampedVal);
      }
    },
    [r1, rMm]
  );

  const handleStepPrev = useCallback(() => {
    setCamPlaybackStep((prev) => Math.max(1, (prev ?? 1) - 1));
  }, []);

  const handleStepNext = useCallback(() => {
    setCamPlaybackStep((prev) => Math.min(executionPlan.totalPlunges, (prev ?? 0) + 1));
  }, [executionPlan.totalPlunges]);

  const handleTogglePlayCam = useCallback(() => {
    if (camPlaybackStep === null) {
      setCamPlaybackStep(1);
    }
    setIsPlayingCam((prev) => !prev);
  }, [camPlaybackStep]);

  const handleExitCamPreview = useCallback(() => {
    setCamPlaybackStep(null);
    setIsPlayingCam(false);
    setIsPlungeVisual(false);
    setDisplayR(rMm);
    displayRRef.current = rMm;
    setDisplayTheta(thetaDeg);
    displayThetaRef.current = thetaDeg;
  }, [rMm, thetaDeg]);

  const handleToggleSection = useCallback((id: SemiSectionId) => {
    setOpenSection((prev) => (prev === id ? null : id));
  }, []);

  const handleLockDesign = useCallback(() => {
    setLockedDesign(holes);
    setPlanSource('replay');
  }, [holes]);

  const handleUnlockDesign = useCallback(() => {
    setLockedDesign(null);
  }, []);

  // S3: Macro auto-drill current layer
  const handleCancelMacroDrill = useCallback(() => {
    macroCancelRef.current = true;
    setIsMacroDrilling(false);
    setPlungeDown(false);
    if (onShowToast) {
      onShowToast(t.autoDrillLayerCancel);
    }
  }, [onShowToast, t.autoDrillLayerCancel]);

  const handleAutoDrillCurrentLayer = useCallback(async () => {
    if (isMacroDrilling) return;

    if (!spindleOn) {
      if (onShowToast) {
        onShowToast(t.spindleOffWarning);
      }
      return;
    }

    const layerRadius = ringRadii[currentLayer];
    if (typeof layerRadius !== 'number' || layerRadius < rHeadMinMm) {
      if (onShowToast) {
        onShowToast(t.rHeadMinLimitReached);
      }
      return;
    }

    const layerPlan = buildPreviewPlan({
      ringRadii,
      nPoints,
      stepAngleDeg,
      stepRadialMm,
      layerFilter: currentLayer,
    });

    if (layerPlan.steps.length === 0) return;

    macroCancelRef.current = false;
    setIsMacroDrilling(true);

    if (onShowToast) {
      onShowToast(t.autoDrillLayerRunning);
    }

    let totalDrilledInMacro = 0;

    for (let sIdx = 0; sIdx < layerPlan.steps.length; sIdx++) {
      if (macroCancelRef.current) break;

      const step = layerPlan.steps[sIdx];

      // 1. Position table and heads to step target
      setRMm(step.rMm);
      setThetaDeg(step.thetaDeg);
      setDisplayR(step.rMm);
      displayRRef.current = step.rMm;
      setDisplayTheta(step.thetaDeg);
      displayThetaRef.current = step.thetaDeg;

      // Mechanical indexing stabilization delay
      await new Promise((resolve) => setTimeout(resolve, 140));
      if (macroCancelRef.current) break;

      // 2. Plunge down
      setPlungeDown(true);

      // 3. Record holes for this step
      const targetLayer = currentLayer;
      const stepNewHoles: SemiHole[] = step.holes.map((sh, hIdx) => ({
        id: safeId(),
        globalIndex: targetLayer * nPoints + (sh.globalIndex ? (sh.globalIndex - 1) % nPoints : hIdx) + 1,
        layer: targetLayer,
        r: step.rMm,
        a: sh.a,
        head: sh.head,
        drilledAt: Date.now(),
      }));

      setHoles((prev) => {
        const filtered = stepNewHoles.filter(
          (nh) =>
            !prev.some((ph) => {
              const rSame = Math.abs(ph.r - nh.r) < 1.0;
              const aDiff = Math.abs(norm360(ph.a) - norm360(nh.a));
              const aSame = Math.min(aDiff, 360 - aDiff) < 0.5;
              return rSame && aSame;
            })
        );
        totalDrilledInMacro += filtered.length;
        return [...prev, ...filtered].slice(0, MAX_HOLES);
      });

      // 4. Dwell duration
      const dwellMs = dwellSec > 0 ? dwellSec * 1000 : 200;
      await new Promise((resolve) => setTimeout(resolve, dwellMs));
      if (macroCancelRef.current) break;

      // 5. Plunge up
      setPlungeDown(false);

      // Inter-step delay
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    setPlungeDown(false);
    setIsMacroDrilling(false);

    if (!macroCancelRef.current && onShowToast) {
      onShowToast(
        t.autoDrillLayerDone.replace('{count}', String(totalDrilledInMacro || layerPlan.totalHoles))
      );
    }
  }, [
    isMacroDrilling,
    spindleOn,
    ringRadii,
    currentLayer,
    rHeadMinMm,
    nPoints,
    stepAngleDeg,
    stepRadialMm,
    dwellSec,
    onShowToast,
    t.spindleOffWarning,
    t.rHeadMinLimitReached,
    t.autoDrillLayerRunning,
    t.autoDrillLayerDone,
  ]);

  return {
    isAr,
    trayDMm,
    marginMm,
    layersCount,
    rLastDiameterMm,
    nPoints,
    stepAngleDeg,
    stepRadialMm,
    R,
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
    actualPlan,
    previewPlan,
    buttonMap,
    planSource,
    previewScope,
    camPlaybackStep,
    setCamPlaybackStep,
    isPlayingCam,
    isMobileDrawerOpen,
    isClearConfirmOpen,
    openSection,
    viewOptions,
    toolRadius,
    activePlaybackStep,
    displayTheta,
    displayR,
    isAnimating,
    isTableRotatingCW,
    isPlungeVisual,
    isMacroDrilling,
    setPlanSource,
    setPreviewScope,
    setCamSpeed,
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
  };
}
