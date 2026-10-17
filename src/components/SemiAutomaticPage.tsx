import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Translations, Language } from '../core/i18n';
import { norm360 } from '../core/model';
import { safeStorage } from '../core/safeStorage';
import { HEADS } from '../core/constants';
import { buildExecutionPlan, ExecutionPlan } from '../core/plan';
import { CanvasStage } from './CanvasStage';
import { ConfirmModal } from './ConfirmModal';
import { TrayModel, SimulationState, ViewOptions, Point, TrayParams } from '../types';
import { SemiStatusBar } from './semi/SemiStatusBar';
import { SemiRemotePad } from './semi/SemiRemotePad';
import { SemiCamActiveBanner } from './semi/SemiCamActiveBanner';
import { SemiParamsList, SemiSectionId } from './semi/SemiParamsList';
import { SemiMobileDrawer } from './semi/SemiMobileDrawer';

export interface SemiHole {
  id: string;
  globalIndex?: number; // 1-based stable grid number
  layer: number;
  r: number;
  a: number; // Tray coordinate angle (0..360°)
  head: 0 | 1 | 2;
  drilledAt: number;
}

interface SemiAutomaticPageProps {
  t: Translations;
  lang: Language;
  params?: TrayParams;
  onShowToast?: (msg: string) => void;
  viewOptions?: ViewOptions;
  setViewOptions?: (opts: ViewOptions) => void;
}

const STORAGE_KEY_SEMI = 'hmi-tray-semiauto-state-v4';
const MAX_HOLES = 1500;

interface SemiAutoSavedState {
  // Live machine state
  thetaDeg?: number;
  rMm?: number;
  spindleOn?: boolean;
  tableZUp?: boolean;

  // Concentric ring geometric parameters
  trayDMm?: number;
  marginMm?: number;
  layersCount?: number;
  rLastDiameterMm?: number;
  nPoints?: number;
  stepRadialMm?: number;

  // Mechanical safety limit (r min clearance)
  rHeadMinMm?: number;

  // Machine dynamics
  dwellSec?: number;
  rotHz?: number;
  expHz?: number;
  currentLayer?: number;

  // Holes memory
  holes?: SemiHole[];

  // Hole numbering display preference
  numberingMode?: 'cam' | 'layer' | 'global';
}

function safeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const SemiAutomaticPage: React.FC<SemiAutomaticPageProps> = ({
  t,
  lang,
  params,
  onShowToast,
  viewOptions: propViewOptions,
  setViewOptions: propSetViewOptions,
}) => {
  const isAr = lang === 'ar';

  // Read saved state bundle safely
  const savedState = useMemo<SemiAutoSavedState>(() => {
    return safeStorage.getJSON<SemiAutoSavedState>(STORAGE_KEY_SEMI, {});
  }, []);

  const defaultTrayD = params?.trayD && Number.isFinite(params.trayD) ? params.trayD : 440;
  const defaultMargin = params?.margin && Number.isFinite(params.margin) ? params.margin : 20;
  const defaultLayers = params?.layers && Number.isFinite(params.layers) ? Math.max(1, Math.min(7, params.layers)) : 3;
  const defaultRLastD = params?.rLast && Number.isFinite(params.rLast) ? params.rLast : 160;
  const defaultN = params?.rawBase && Number.isFinite(params.rawBase) ? params.rawBase : 12;

  // 1. Concentric Circles Geometric Parameters (Master like Auto)
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

  // Angular grid points count per ring (sanitized multiple of 3)
  const [nPoints, setNPoints] = useState<number>(() => {
    const v = savedState.nPoints;
    return typeof v === 'number' && Number.isFinite(v) && v >= 3 ? Math.round(v) : defaultN;
  });

  // Derived angular indexing step (θ) for table jog and grid
  const stepAngleDeg = useMemo(() => {
    const safeN = Math.max(1, nPoints);
    return Number((360 / safeN).toFixed(3));
  }, [nPoints]);

  // Jog step for r± remote button ONLY (strictly separated from geometric spacing s)
  const [stepRadialMm, setStepRadialMm] = useState<number>(() => {
    const v = savedState.stepRadialMm;
    return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 15;
  });

  // 2. Strict Radius-Only Calculation (copied verbatim from specification)
  const R = useMemo(() => trayDMm / 2, [trayDMm]);
  const r1 = useMemo(() => Math.max(0, R - marginMm), [R, marginMm]);
  const rLastR = useMemo(() => Math.max(0, rLastDiameterMm / 2), [rLastDiameterMm]);

  // Derived spacing s (displayed READ-ONLY like Auto)
  const sMm = useMemo(() => {
    return layersCount > 1 ? (r1 - rLastR) / (layersCount - 1) : 0;
  }, [layersCount, r1, rLastR]);

  // Computed radii for all layers i = 0 .. layersCount - 1
  const ringRadii = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < layersCount; i++) {
      const ri = i === layersCount - 1 ? rLastR : Math.max(0, r1 - i * sMm);
      arr.push(Number(ri.toFixed(2)));
    }
    return arr;
  }, [layersCount, r1, rLastR, sMm]);

  // 2.5 Mechanical Safety Limit (Anti-collision minimum radius)
  const [rHeadMinMm, setRHeadMinMm] = useState<number>(() => {
    const v = savedState.rHeadMinMm;
    return typeof v === 'number' && Number.isFinite(v) && v >= 5 ? v : 40;
  });

  // 3. Live Machine States
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

  // 4. Holes Persistent Memory with corruption protection
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

  // 4.5 Optimal CAM Execution Plan (Outer -> Inner / Anti Yo-Yo)
  const executionPlan = useMemo<ExecutionPlan>(() => {
    return buildExecutionPlan(holes, {
      stepRadialMm,
      stepAngleDeg,
      ringRadii,
    });
  }, [holes, stepRadialMm, stepAngleDeg, ringRadii]);

  // CAM Step Playback & Interactive Simulation State
  const [camPlaybackStep, setCamPlaybackStep] = useState<number | null>(null);
  const [isPlayingCam, setIsPlayingCam] = useState<boolean>(false);

  // Sync / Advance CAM playback automatically when playing
  useEffect(() => {
    if (!isPlayingCam || executionPlan.steps.length === 0) return;
    const timer = window.setInterval(() => {
      setCamPlaybackStep((prev) => {
        const cur = prev ?? 0;
        if (cur >= executionPlan.steps.length) {
          setIsPlayingCam(false);
          return 1;
        }
        return cur + 1;
      });
    }, 1100);
    return () => clearInterval(timer);
  }, [isPlayingCam, executionPlan.steps.length]);

  // Clear playback if all holes are removed
  useEffect(() => {
    if (holes.length === 0 && camPlaybackStep !== null) {
      setCamPlaybackStep(null);
      setIsPlayingCam(false);
    }
  }, [holes.length, camPlaybackStep]);

  // Drawer & Dialog State
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState<boolean>(false);
  const [openSection, setOpenSection] = useState<SemiSectionId | null>('geo');

  // 5. Canvas Options (fixed machine mode in SemiAuto with live reactive theme)
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

  // Unified Single-Object Safe Storage Sync
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
  ]);

  // Clamping safety checks
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

  // Remote Stepping Handlers
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

  // Quick jump to active layer's radius
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

  // Sync live machine heads (rMm, thetaDeg) to selected CAM step
  const handleSyncMachineToStep = useCallback(
    (stepIdx?: number) => {
      const targetIdx = stepIdx ?? camPlaybackStep ?? 1;
      const st = executionPlan.steps[targetIdx - 1];
      if (st) {
        setRMm(st.rMm);
        setThetaDeg(st.thetaDeg);
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

  // Plunge Timer & State Handlers
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

    // Invariant: layer tag strictly reflects the physically closest concentric ring ri to actual rMm
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

      // Match closest angular grid index k
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

    // Prevent identical duplicate holes on the same radius and angle
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
      // Hold mode: down while pressed, record holes immediately
      isPlungingRef.current = true;
      setPlungeDown(true);
      recordHoles();
    } else {
      // Pulse mode: down -> wait dwellSec -> up, record holes once
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

  // Undo last 3 holes (1 plunge operation)
  const handleUndoLastPlunge = useCallback(() => {
    setHoles((prev) => (prev.length >= 3 ? prev.slice(0, prev.length - 3) : []));
  }, []);

  // Clear all holes
  const handleClearAllHoles = useCallback(() => {
    setHoles([]);
  }, []);

  // 6. Complete Geometric Grid Construction (Concentric Rings + Ghosts + Drilled Holes)
  const toolRadius = params?.tool ? params.tool / 2 : 8;

  const semiAutoModel: TrayModel = useMemo(() => {
    const allPts: Point[] = [];
    const layerPtsMap: Point[][] = Array.from({ length: layersCount }, () => []);

    // Build quick lookup map from hole ID to CAM execution step
    const holeToStepMap = new Map<string, { stepIndex: number; bandIndex: number }>();
    executionPlan.steps.forEach((st) => {
      st.holes.forEach((h) => {
        holeToStepMap.set(h.id, { stepIndex: st.stepIndex, bandIndex: st.bandIndex });
      });
    });

    // For each layer i (0 .. layersCount - 1) and each angle k * stepAngleDeg:
    ringRadii.forEach((ri, i) => {
      for (let k = 0; k < nPoints; k++) {
        const a = norm360(k * stepAngleDeg);
        const globalIndex = i * nPoints + k + 1; // 1-based stable immutable grid index
        // When numberingMode === 'layer', k starts at 0 per layer so render.ts displays 1..nPoints
        // When numberingMode === 'global', displays 1..Total cumulative across all rings
        const pointK = numberingMode === 'global' ? globalIndex - 1 : k;

        // Invariant: Matching is strictly physical (rMatch && aMatch).
        const matchingHole = holes.find((h) => {
          const rMatch = Math.abs(h.r - ri) < 2.0;
          const aDiff = Math.abs(norm360(h.a) - a);
          const aMatch = Math.min(aDiff, 360 - aDiff) < 0.75;
          return rMatch && aMatch;
        });

        const rad = (a * Math.PI) / 180;

        if (matchingHole) {
          const stepInfo = holeToStepMap.get(matchingHole.id);
          let pointLabel: string | undefined;
          if (numberingMode === 'cam') {
            pointLabel = stepInfo ? `${stepInfo.stepIndex}` : String(pointK + 1);
          } else if (numberingMode === 'global') {
            pointLabel = String(globalIndex);
          } else {
            pointLabel = String(k + 1);
          }

          let camStatus: 'active' | 'done' | 'pending' | undefined;
          let isCamActive = false;
          if (camPlaybackStep !== null && stepInfo) {
            if (stepInfo.stepIndex === camPlaybackStep) {
              camStatus = 'active';
              isCamActive = true;
            } else if (stepInfo.stepIndex < camPlaybackStep) {
              camStatus = 'done';
            } else {
              camStatus = 'pending';
            }
          }

          // Drilled permanent hole with stable geometric number or CAM execution step
          const pt: Point = {
            x: ri * Math.cos(rad),
            y: ri * Math.sin(rad),
            a: matchingHole.a,
            layer: i,
            k: pointK,
            head: matchingHole.head,
            j: 0,
            bad: false,
            fired: true,
            label: pointLabel,
            camStatus,
            isCamActive,
          };
          layerPtsMap[i].push(pt);
          allPts.push(pt);
        } else {
          // Available design position: GHOST RETICLE (fired: false)
          const ghostLabel = numberingMode === 'global' ? String(globalIndex) : String(k + 1);
          const pt: Point = {
            x: ri * Math.cos(rad),
            y: ri * Math.sin(rad),
            a,
            layer: i,
            k: pointK,
            head: 0,
            j: 0,
            bad: false,
            fired: false,
            label: ghostLabel,
          };
          layerPtsMap[i].push(pt);
          allPts.push(pt);
        }
      }
    });

    // Also include any holes in holes[] that were drilled off-grid so no user data is ever lost
    holes.forEach((h, hIdx) => {
      const isAccounted = allPts.some(
        (p) =>
          p.fired &&
          Math.abs(p.x - h.r * Math.cos((h.a * Math.PI) / 180)) < 0.5 &&
          Math.abs(p.y - h.r * Math.sin((h.a * Math.PI) / 180)) < 0.5
      );
      if (!isAccounted) {
        const rad = (h.a * Math.PI) / 180;
        let targetLayerIdx = 0;
        let minDiff = Infinity;
        ringRadii.forEach((rk, idx) => {
          const diff = Math.abs(rk - h.r);
          if (diff < minDiff) {
            minDiff = diff;
            targetLayerIdx = idx;
          }
        });

        const stepInfo = holeToStepMap.get(h.id);
        let pointLabel: string | undefined;
        if (numberingMode === 'cam') {
          pointLabel = stepInfo ? `${stepInfo.stepIndex}` : String(hIdx + 1);
        } else if (numberingMode === 'global') {
          pointLabel = String(layersCount * nPoints + hIdx + 1);
        } else {
          pointLabel = String((hIdx % nPoints) + 1);
        }

        let camStatus: 'active' | 'done' | 'pending' | undefined;
        let isCamActive = false;
        if (camPlaybackStep !== null && stepInfo) {
          if (stepInfo.stepIndex === camPlaybackStep) {
            camStatus = 'active';
            isCamActive = true;
          } else if (stepInfo.stepIndex < camPlaybackStep) {
            camStatus = 'done';
          } else {
            camStatus = 'pending';
          }
        }

        const pt: Point = {
          x: h.r * Math.cos(rad),
          y: h.r * Math.sin(rad),
          a: h.a,
          layer: targetLayerIdx,
          k: numberingMode === 'global' ? layersCount * nPoints + hIdx : (hIdx % nPoints),
          head: h.head,
          j: 0,
          bad: false,
          fired: true,
          label: pointLabel,
          camStatus,
          isCamActive,
        };
        layerPtsMap[targetLayerIdx]?.push(pt);
        allPts.push(pt);
      }
    });

    return {
      R,
      toolR: toolRadius,
      r1,
      rLast: rLastR,
      d1: r1 * 2,
      dLast: rLastR * 2,
      radialStepMm: sMm,
      layers: ringRadii.map((ri, i) => ({
        i,
        r: ri,
        n: nPoints,
        per: Math.round(nPoints / 3),
        step: stepAngleDeg,
        off: 0,
        pts: layerPtsMap[i] || [],
        minD: 0,
        bad: 0,
      })),
      all: allPts,
      minD: 0,
      badCount: 0,
      warns: [],
      totalPts: layersCount * nPoints,
      totalDrilled: holes.length, // Real hole counter only (never count ghosts!)
      totalSteps: 1,
      hasErr: false,
      hasWarn: false,
    };
  }, [
    layersCount,
    ringRadii,
    nPoints,
    stepAngleDeg,
    holes,
    R,
    toolRadius,
    r1,
    rLastR,
    sMm,
    numberingMode,
    executionPlan,
    camPlaybackStep,
  ]);

  const activePlaybackStep =
    camPlaybackStep !== null && executionPlan.steps[camPlaybackStep - 1]
      ? executionPlan.steps[camPlaybackStep - 1]
      : null;

  const semiAutoState: SimulationState = useMemo(() => {
    const effectiveTheta = activePlaybackStep ? activePlaybackStep.thetaDeg : thetaDeg;
    const effectiveR = activePlaybackStep ? activePlaybackStep.rMm : rMm;
    const isPlungingOrStepActive = plungeDown || activePlaybackStep !== null;

    return {
      theta: effectiveTheta,
      headR: effectiveR,
      // counts >= 9999 ensures points with fired: true are rendered as drilled
      counts: ringRadii.map(() => 99999),
      cur: {
        type: isPlungingOrStepActive ? 'fire' : 'index',
        t0: 0,
        d: 0,
        layer: activePlaybackStep ? Math.max(0, activePlaybackStep.bandIndex - 1) : currentLayer,
        j: isPlungingOrStepActive ? 3 : 0,
        r0: effectiveR,
        r1: effectiveR,
        th0: effectiveTheta,
        th1: effectiveTheta,
        fired: spindleOn || activePlaybackStep !== null,
      },
      done: false,
      u: isPlungingOrStepActive ? 1 : 0.8,
    };
  }, [
    activePlaybackStep,
    thetaDeg,
    rMm,
    ringRadii,
    plungeDown,
    currentLayer,
    spindleOn,
  ]);

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
  }, []);

  const handleToggleSection = useCallback((id: SemiSectionId) => {
    setOpenSection((prev) => (prev === id ? null : id));
  }, []);

  // Shared Parameters Content Component
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
      onToggleTableZ={() => setTableZUp((prev) => !prev)}
      onToggleSpindle={() => setSpindleOn((prev) => !prev)}
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
    />
  );

  return (
    <div
      className="flex flex-col gap-3 max-w-5xl mx-auto w-full h-full min-h-0 select-none overflow-hidden"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Clear Confirmation Modal */}
      <ConfirmModal
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        onConfirm={handleClearAllHoles}
        title={t.confirmClearHolesTitle}
        message={t.confirmClearHolesDesc}
        t={t}
        lang={lang}
      />

      {/* 1. Mobile Single Column View (< lg) */}
      <div className="flex flex-col lg:hidden gap-3.5 h-full min-h-0 select-none">
        {/* Active CAM Playback Banner */}
        <SemiCamActiveBanner
          activePlaybackStep={activePlaybackStep}
          totalPlunges={executionPlan.totalPlunges}
          isPlayingCam={isPlayingCam}
          isAr={isAr}
          t={t}
          onSyncMachine={handleSyncMachineToStep}
          onClose={handleExitCamPreview}
          onPrevStep={handleStepPrev}
          onNextStep={handleStepNext}
          onTogglePlay={handleTogglePlayCam}
        />

        {/* Canvas Stage */}
        <div className="flex-none w-full">
          <CanvasStage
            model={semiAutoModel}
            state={semiAutoState}
            options={viewOptions}
            onChangeOptions={handleUpdateViewOptions}
            t={t}
            lang={lang}
            onToggleDrawer={() => setIsMobileDrawerOpen((prev) => !prev)}
            isDrawerOpen={isMobileDrawerOpen}
          />
        </div>

        {/* Live Telemetry Bar */}
        <SemiStatusBar
          thetaDeg={thetaDeg}
          rMm={rMm}
          rHeadMinMm={rHeadMinMm}
          currentLayer={currentLayer}
          spindleOn={spindleOn}
          holesCount={holes.length}
          maxHolesCount={layersCount * nPoints}
          isAr={isAr}
          t={t}
          onUndoLastPlunge={handleUndoLastPlunge}
          onOpenPlan={() => {
            setOpenSection((prev) => (prev === 'plan' ? null : 'plan'));
            setIsMobileDrawerOpen(true);
          }}
          onOpenClearConfirm={() => setIsClearConfirmOpen(true)}
          executionPlanTotalPlunges={executionPlan.totalPlunges}
          hasExecutionSteps={executionPlan.steps.length > 0}
        />

        {/* Scrollable Remote Controls */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y flex flex-col gap-3 pr-0.5 pb-20 oneui-scrollbar">
          <SemiRemotePad
            t={t}
            isAr={isAr}
            dwellSec={dwellSec}
            stepAngleDeg={stepAngleDeg}
            stepRadialMm={stepRadialMm}
            tableZUp={tableZUp}
            spindleOn={spindleOn}
            plungeDown={plungeDown}
            onTableStep={handleTableStep}
            onTableHome={handleTableHome}
            onRadialStep={handleRadialStep}
            onRadialMax={handleRadialMax}
            onSetTableZUp={setTableZUp}
            onSetSpindleOn={setSpindleOn}
            onPlungeDown={handlePlungeDown}
            onPlungeUp={handlePlungeUp}
            onPlungeCancel={handlePlungeCancel}
          />
        </div>

        {/* Mobile Parameters Drawer */}
        <SemiMobileDrawer
          isOpen={isMobileDrawerOpen}
          onClose={() => setIsMobileDrawerOpen(false)}
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
          <SemiCamActiveBanner
            activePlaybackStep={activePlaybackStep}
            totalPlunges={executionPlan.totalPlunges}
            isPlayingCam={isPlayingCam}
            isAr={isAr}
            t={t}
            onSyncMachine={handleSyncMachineToStep}
            onClose={handleExitCamPreview}
            onPrevStep={handleStepPrev}
            onNextStep={handleStepNext}
            onTogglePlay={handleTogglePlayCam}
          />
          <CanvasStage
            model={semiAutoModel}
            state={semiAutoState}
            options={viewOptions}
            onChangeOptions={handleUpdateViewOptions}
            t={t}
            lang={lang}
          />
          <SemiStatusBar
            thetaDeg={thetaDeg}
            rMm={rMm}
            rHeadMinMm={rHeadMinMm}
            currentLayer={currentLayer}
            spindleOn={spindleOn}
            holesCount={holes.length}
            maxHolesCount={layersCount * nPoints}
            isAr={isAr}
            t={t}
            onUndoLastPlunge={handleUndoLastPlunge}
            onOpenPlan={() => {
              setOpenSection((prev) => (prev === 'plan' ? null : 'plan'));
              setIsMobileDrawerOpen(true);
            }}
            onOpenClearConfirm={() => setIsClearConfirmOpen(true)}
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
            onTableStep={handleTableStep}
            onTableHome={handleTableHome}
            onRadialStep={handleRadialStep}
            onRadialMax={handleRadialMax}
            onSetTableZUp={setTableZUp}
            onSetSpindleOn={setSpindleOn}
            onPlungeDown={handlePlungeDown}
            onPlungeUp={handlePlungeUp}
            onPlungeCancel={handlePlungeCancel}
          />
        </main>
      </div>
    </div>
  );
};
