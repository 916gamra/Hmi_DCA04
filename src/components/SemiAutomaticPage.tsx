import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  RotateCw,
  MoveHorizontal,
  Zap,
  ArrowUpCircle,
  ArrowDownCircle,
  SlidersHorizontal,
  X,
  RotateCcw,
  Trash2,
  Settings,
  ChevronDown,
  Disc,
  Clock,
  Compass,
  BarChart3,
  Sliders,
  Target,
  Hash,
  ShieldAlert,
  Route,
} from 'lucide-react';
import { Translations, Language } from '../core/i18n';
import { norm360, fmt } from '../core/model';
import { safeStorage } from '../core/safeStorage';
import { HEADS, LAYER_COLORS } from '../core/constants';
import { buildExecutionPlan, ExecutionPlan } from '../core/plan';
import { NumberStepper } from './NumberStepper';
import { CanvasStage } from './CanvasStage';
import { ConfirmModal } from './ConfirmModal';
import { TrayModel, SimulationState, ViewOptions, Point, TrayParams } from '../types';

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
  numberingMode?: 'layer' | 'global';
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

  const [numberingMode, setNumberingMode] = useState<'layer' | 'global'>(() => {
    const v = savedState.numberingMode;
    return v === 'global' ? 'global' : 'layer';
  });

  // 4.5 Optimal CAM Execution Plan (Outer -> Inner / Anti Yo-Yo)
  const executionPlan = useMemo<ExecutionPlan>(() => {
    return buildExecutionPlan(holes, {
      stepRadialMm,
      stepAngleDeg,
      ringRadii,
    });
  }, [holes, stepRadialMm, stepAngleDeg, ringRadii]);

  // Drawer & Dialog State
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState<boolean>(false);
  const [openSection, setOpenSection] = useState<'geo' | 'pts' | 'timing' | 'modes' | 'safety' | 'plan' | null>('geo');

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

    // For each layer i (0 .. layersCount - 1) and each angle k * stepAngleDeg:
    ringRadii.forEach((ri, i) => {
      for (let k = 0; k < nPoints; k++) {
        const a = norm360(k * stepAngleDeg);
        const globalIndex = i * nPoints + k + 1; // 1-based stable immutable grid index
        // When numberingMode === 'layer', k starts at 0 per layer so render.ts displays 1..nPoints (standard machine layout)
        // When numberingMode === 'global', displays 1..Total cumulative across all rings
        const pointK = numberingMode === 'global' ? globalIndex - 1 : k;

        // Invariant: Matching is strictly physical (rMatch && aMatch).
        // Never allow layer index alone to match without radius, otherwise holes drilled on an outer ring
        // would falsely appear as drilled on inner rings (such as rLast).
        const matchingHole = holes.find((h) => {
          const rMatch = Math.abs(h.r - ri) < 2.0;
          const aDiff = Math.abs(norm360(h.a) - a);
          const aMatch = Math.min(aDiff, 360 - aDiff) < 0.75;
          return rMatch && aMatch;
        });

        const rad = (a * Math.PI) / 180;

        if (matchingHole) {
          // Drilled permanent hole with stable geometric number
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
          };
          layerPtsMap[i].push(pt);
          allPts.push(pt);
        } else {
          // Available design position: GHOST RETICLE (fired: false) with same stable number
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
  ]);

  const semiAutoState: SimulationState = useMemo(() => {
    return {
      theta: thetaDeg,
      headR: rMm,
      // counts >= 9999 ensures points with fired: true are rendered as drilled
      counts: ringRadii.map(() => 99999),
      cur: {
        type: plungeDown ? 'fire' : 'index',
        t0: 0,
        d: 0,
        layer: currentLayer,
        j: plungeDown ? 3 : 0,
        r0: rMm,
        r1: rMm,
        th0: thetaDeg,
        th1: thetaDeg,
        fired: spindleOn && plungeDown,
      },
      done: false,
      u: 0,
    };
  }, [thetaDeg, rMm, ringRadii, plungeDown, currentLayer, spindleOn]);

  // Card toggle renderer for parameters drawer
  const renderCard = (
    id: 'geo' | 'pts' | 'timing' | 'modes' | 'safety' | 'plan',
    title: string,
    icon: React.ReactNode,
    children: React.ReactNode
  ) => (
    <div className="oneui-card overflow-hidden border border-slate-200/90 shadow-2xs rounded-2xl bg-white">
      <button
        type="button"
        onClick={() => setOpenSection((prev) => (prev === id ? null : id))}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-2.5 font-bold text-slate-800 text-xs sm:text-sm">
          {icon}
          <span>{title}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
            openSection === id ? 'rotate-0' : '-rotate-90'
          }`}
        />
      </button>
      {openSection === id && (
        <div className="p-4 border-t border-slate-100 flex flex-col gap-3.5 bg-slate-50/40">
          {children}
        </div>
      )}
    </div>
  );

  // Parameter drawer content: 4 standard cards matching Auto design
  const parametersContent = (
    <div className="flex flex-col gap-3">
      {/* 1. Géométrie du plateau & Cercles concentriques */}
      {renderCard(
        'geo',
        t.cardSemiGeoTitle,
        <Disc className="w-4 h-4 text-blue-600" />,
        <>
          {/* Tray Diameter */}
          <div>
            <label className="block text-[11px] font-semibold text-[#475569] mb-1">
              {t.trayDiameter} (Ø)
            </label>
            <NumberStepper
              value={trayDMm}
              min={100}
              max={1200}
              step={10}
              unit="mm"
              onChange={(val) => setTrayDMm(Math.max(100, val))}
            />
          </div>

          {/* Margin from Rim */}
          <div>
            <label className="block text-[11px] font-semibold text-[#475569] mb-1">
              {t.margin} (M)
            </label>
            <NumberStepper
              value={marginMm}
              min={0}
              max={150}
              step={1}
              unit="mm"
              onChange={(val) => setMarginMm(Math.max(0, val))}
            />
          </div>

          {/* Number of concentric layers (1..7) */}
          <div>
            <label className="block text-[11px] font-semibold text-[#475569] mb-1">
              {t.layersCount} (1–7)
            </label>
            <NumberStepper
              value={layersCount}
              min={1}
              max={7}
              step={1}
              unit=""
              onChange={(val) => setLayersCount(Math.max(1, Math.min(7, Math.round(val))))}
            />
          </div>

          {/* Last / Innermost Layer Diameter */}
          <div>
            <label className="block text-[11px] font-semibold text-[#475569] mb-1">
              {t.lastLayerD} (D_last)
            </label>
            <NumberStepper
              value={rLastDiameterMm}
              min={10}
              max={Math.max(20, Math.round(r1 * 2))}
              step={5}
              unit="mm"
              onChange={(val) => setRLastDiameterMm(Math.max(10, val))}
            />
          </div>

          {/* Derived Spacing s (Read-Only Badge) */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 border border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                {t.spacing} (s)
              </span>
              <span className="text-[10px] text-slate-500 block">
                {t.derivedSpacingBadge}
              </span>
            </div>
            <span className="text-xs font-mono font-extrabold text-blue-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
              {fmt(sMm, 1)} mm
            </span>
          </div>

          {/* Assistant Indicator: Presses between layers N ≈ s / stepRadial */}
          {layersCount > 1 && sMm > 0 && (
            <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs flex flex-col gap-1.5">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span className="flex items-center gap-1.5 text-blue-900 text-[11px] sm:text-xs">
                  <Sliders className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>
                    {t.radialPressesHelper
                      .replace('{s}', fmt(sMm, 1))
                      .replace('{n}', String(Number((sMm / Math.max(0.1, stepRadialMm)).toFixed(1))))
                      .replace('{step}', String(stepRadialMm))}
                  </span>
                </span>
                <span className="font-mono text-xs font-extrabold text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-200 shrink-0 shadow-2xs">
                  ≈ {(sMm / Math.max(0.1, stepRadialMm)).toFixed(1)} × r±
                </span>
              </div>
              <span className="text-[10px] text-slate-500 leading-tight">
                {t.stepVsSpacingNote}
              </span>
            </div>
          )}

          {/* Summary pill of R1 and R_last */}
          <div className="p-2 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] font-mono text-blue-900 flex justify-between">
            <span>R₁ = {fmt(r1, 1)} mm</span>
            <span>R_last = {fmt(rLastR, 1)} mm</span>
          </div>
        </>
      )}

      {/* 2. Répartition des points & ANGLES */}
      {renderCard(
        'pts',
        t.cardSemiPtsTitle,
        <Compass className="w-4 h-4 text-emerald-600" />,
        <>
          {/* Points count per circle n (multiple of 3) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-semibold text-[#475569]">
                {t.nPointsCircleLabel}
              </label>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-bold">
                n = {nPoints} {t.ptsPerTurn}
              </span>
            </div>
            <NumberStepper
              value={nPoints}
              min={3}
              max={120}
              step={3}
              unit=""
              onChange={(val) => setNPoints(Math.max(3, Math.round(val)))}
            />
          </div>

          {/* Derived Indexing Angle step θ */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
            <div>
              <span className="text-xs font-bold text-emerald-900 block">
                {t.stepAngleIndexingLabel}
              </span>
              <span className="text-[10px] text-emerald-700 block">
                360° / {nPoints}
              </span>
            </div>
            <span className="text-xs font-mono font-extrabold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
              {stepAngleDeg}°
            </span>
          </div>

          {/* Numbering Scheme Selector: Per-Layer (1..n) vs Global Continuous (1..N) */}
          <div className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-blue-600" />
                <span>{t.numberingModeLabel}</span>
              </label>
              <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-bold">
                {numberingMode === 'layer' ? '1 .. n' : '1 .. N'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/70 rounded-lg">
              <button
                type="button"
                onClick={() => setNumberingMode('layer')}
                className={`py-1.5 px-2 text-[11px] font-bold rounded-md transition-all cursor-pointer text-center ${
                  numberingMode === 'layer'
                    ? 'bg-white text-blue-700 shadow-2xs ring-1 ring-blue-300'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.numberingModeLayer}
              </button>
              <button
                type="button"
                onClick={() => setNumberingMode('global')}
                className={`py-1.5 px-2 text-[11px] font-bold rounded-md transition-all cursor-pointer text-center ${
                  numberingMode === 'global'
                    ? 'bg-white text-blue-700 shadow-2xs ring-1 ring-blue-300'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.numberingModeGlobal}
              </button>
            </div>
            <span className="text-[10px] text-slate-500 leading-tight">
              {t.numberingModeHint}
            </span>
          </div>

          {/* Jog step for r± remote button ONLY */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-semibold text-[#475569]">
                {t.stepRadialLabel} (r±)
              </label>
              {layersCount > 1 && sMm > 0 && (
                <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                  {fmt(sMm, 1)}mm ÷ {stepRadialMm}mm = {(sMm / Math.max(0.1, stepRadialMm)).toFixed(1)} clicks
                </span>
              )}
            </div>
            <NumberStepper
              value={stepRadialMm}
              min={1}
              max={100}
              step={1}
              unit="mm"
              onChange={(val) => setStepRadialMm(Math.max(1, val))}
            />
            <span className="text-[10px] text-slate-400 block mt-1">
              {t.stepVsSpacingNote}
            </span>
          </div>

          {/* Active Layer Selection Pills + Go To Radius button */}
          <div className="flex flex-col gap-2 pt-1 border-t border-slate-200">
            <label className="block text-[11px] font-semibold text-[#475569]">
              {t.layerActiveLabel} (1 .. {layersCount})
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ringRadii.map((ri, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentLayer(idx)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    currentLayer === idx
                      ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-400'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ backgroundColor: LAYER_COLORS[idx % LAYER_COLORS.length] }}
                  />
                  <span>L{idx + 1}</span>
                  <span className="text-[10px] opacity-75 font-mono">({fmt(ri, 0)}mm)</span>
                </button>
              ))}
            </div>

            {/* Go to active layer radius button */}
            <button
              type="button"
              onClick={() => handleJumpToLayerRadius(currentLayer)}
              className="mt-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all cursor-pointer active:scale-98 shadow-2xs"
            >
              <Target className="w-3.5 h-3.5" />
              <span>
                {t.goToLayerRadiusBtn} (r → {fmt(ringRadii[currentLayer] || 0, 1)} mm)
              </span>
            </button>
          </div>
        </>
      )}

      {/* 3. Temporisation et vitesse */}
      {renderCard(
        'timing',
        t.cardSemiTimingTitle,
        <Clock className="w-4 h-4 text-amber-600" />,
        <>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-semibold text-[#475569]">
                {t.dwellLabel}
              </label>
              <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                {dwellSec <= 0 ? t.dwellHoldHint : t.dwellPulseHint}
              </span>
            </div>
            <NumberStepper
              value={dwellSec}
              min={0}
              max={10}
              step={0.1}
              unit="s"
              onChange={(val) => setDwellSec(Math.max(0, val))}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#475569] mb-1">
              {t.rotHzLabel}
            </label>
            <NumberStepper
              value={rotHz}
              min={0.1}
              max={10}
              step={0.1}
              unit="Hz"
              onChange={(val) => setRotHz(Math.max(0.1, val))}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#475569] mb-1">
              {t.expHzLabel}
            </label>
            <NumberStepper
              value={expHz}
              min={0.1}
              max={10}
              step={0.1}
              unit="Hz"
              onChange={(val) => setExpHz(Math.max(0.1, val))}
            />
          </div>
        </>
      )}

      {/* 4. Modes machine */}
      {renderCard(
        'modes',
        t.cardSemiModesTitle,
        <Sliders className="w-4 h-4 text-purple-600" />,
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                {t.tableZLabel}
              </span>
              <span className="text-[10px] text-slate-500">
                {tableZUp ? t.tablePosHigh : t.tablePosLow}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setTableZUp((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                tableZUp
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {tableZUp ? 'UP' : 'DOWN'}
            </button>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                {t.spindleLabel}
              </span>
              <span className="text-[10px] text-slate-500">
                {spindleOn ? t.spindleRunning : t.spindleStopped}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSpindleOn((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                spindleOn
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {spindleOn ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      )}

      {/* 5. Sécurité mécanique & Rayon minimal des têtes (rHeadMin) */}
      {renderCard(
        'safety',
        t.cardSemiSafetyTitle,
        <ShieldAlert className="w-4 h-4 text-amber-600" />,
        <div className="flex flex-col gap-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-semibold text-[#475569]">
                {t.rHeadMinLabel}
              </label>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  rMm <= rHeadMinMm + 0.1
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {rMm <= rHeadMinMm + 0.1 ? t.rHeadMinStatusAtLimit : t.rHeadMinStatusSafe}
              </span>
            </div>
            <NumberStepper
              value={rHeadMinMm}
              min={5}
              max={Math.max(10, Math.round(r1))}
              step={1}
              unit="mm"
              onChange={(val) => {
                const clampedVal = Math.max(5, Math.min(val, Math.round(r1)));
                setRHeadMinMm(clampedVal);
                if (rMm < clampedVal) {
                  setRMm(clampedVal);
                }
              }}
            />
            <span className="text-[10px] text-slate-500 block mt-1 leading-tight">
              {t.rHeadMinHint}
            </span>
          </div>

          {/* Comparison with design rLast */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-700 flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-500">r min (أمان عتاد):</span>
              <span className="font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {rHeadMinMm} mm
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-500">R_last (تصميم شبكة):</span>
              <span className="font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {fmt(rLastR, 1)} mm
              </span>
            </div>
            <div className="pt-1.5 border-t border-slate-200 text-[10px] text-slate-500 leading-tight">
              {rHeadMinMm < rLastR
                ? (isAr
                    ? '✓ يسمح للرؤوس بالنزول نحو المركز أبعد من آخر حلقة ما دام r ≥ rHeadMin.'
                    : '✓ Les têtes peuvent descendre sous l’anneau rLast tant que r ≥ rHeadMin.')
                : (isAr
                    ? '⚠ حد الأمان يسبق آخر حلقة لحماية الرؤوس من التصادم الميكانيكي.'
                    : '⚠ La butée mécanique précède le dernier anneau pour sécuriser les broches.')}
            </div>
          </div>
        </div>
      )}

      {/* 6. Plan d'exécution (Outer -> Inner / Anti Yo-Yo) */}
      {renderCard(
        'plan',
        t.executionPlanTitle,
        <Route className="w-4 h-4 text-indigo-600" />,
        <div className="flex flex-col gap-2.5">
          <span className="text-[11px] text-slate-500 leading-tight">
            {t.executionPlanSubtitle}
          </span>

          {/* KPIs Grid */}
          <div className="grid grid-cols-2 gap-1.5 text-center">
            <div className="p-2 bg-indigo-50/80 rounded-xl border border-indigo-100">
              <span className="text-[9px] font-bold text-indigo-600 block">{t.planTotalPlunges}</span>
              <span className="text-xs font-mono font-extrabold text-indigo-900">
                {executionPlan.totalPlunges}
                <span className="text-[10px] text-indigo-500 font-normal"> ({executionPlan.totalHoles})</span>
              </span>
            </div>
            <div className="p-2 bg-emerald-50/80 rounded-xl border border-emerald-100">
              <span className="text-[9px] font-bold text-emerald-600 block">{t.planYoYoEliminated}</span>
              <span className="text-xs font-mono font-extrabold text-emerald-800">
                {executionPlan.yoYoReversalsEliminated} {isAr ? 'ارتداد' : 'évités'}
              </span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[9px] font-bold text-slate-500 block">{t.planTotalBands}</span>
              <span className="text-xs font-mono font-extrabold text-slate-800">
                {executionPlan.totalBands} {isAr ? 'أشرطة' : 'bandes'}
              </span>
            </div>
            <div className="p-2 bg-blue-50/80 rounded-xl border border-blue-100">
              <span className="text-[9px] font-bold text-blue-600 block">{t.planRadialTravel}</span>
              <span className="text-xs font-mono font-extrabold text-blue-900">
                {executionPlan.totalRadialTravelMm} mm
              </span>
            </div>
          </div>

          {/* Bands Chips */}
          {executionPlan.bands.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {executionPlan.bands.map((band) => (
                <span
                  key={band.bandIndex}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center gap-1"
                >
                  <span className="font-bold text-indigo-700">B{band.bandIndex}:</span>
                  <span>{band.nominalR}mm</span>
                  <span className="text-[9px] text-slate-500 font-sans">({band.matchingLayerName})</span>
                </span>
              ))}
            </div>
          )}

          {/* Empty state or Steps List */}
          {executionPlan.steps.length === 0 ? (
            <div className="p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400">
              {t.planNoHolesMessage}
            </div>
          ) : (
            <div className="flex flex-col gap-1 max-h-56 overflow-y-auto pr-1 text-[11px] font-mono scrollbar-thin">
              <div className="grid grid-cols-12 gap-1 px-1.5 py-1 bg-slate-100 rounded-lg font-bold text-[9px] text-slate-600 sticky top-0 uppercase">
                <span className="col-span-1 text-center">{t.planStepColExec}</span>
                <span className="col-span-2">{t.planStepColBand}</span>
                <span className="col-span-3">{t.planStepColRadius}</span>
                <span className="col-span-3">{t.planStepColTheta}</span>
                <span className="col-span-3 text-right">{t.planStepColCommand}</span>
              </div>
              {executionPlan.steps.map((st) => (
                <div
                  key={st.stepIndex}
                  className="grid grid-cols-12 gap-1 px-1.5 py-1 rounded-lg bg-white border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors items-center"
                >
                  <span className="col-span-1 text-center font-bold text-indigo-700">
                    {st.stepIndex}
                  </span>
                  <span className="col-span-2 text-[10px] text-slate-600 font-semibold truncate">
                    B{st.bandIndex} <span className="text-[9px] text-slate-400">({st.matchingLayerName})</span>
                  </span>
                  <span className="col-span-3 font-semibold text-emerald-700">
                    {st.rMm}mm
                  </span>
                  <span className="col-span-3 text-blue-700">
                    {st.thetaDeg}°
                  </span>
                  <span className="col-span-3 text-right text-[10px] text-slate-500 truncate">
                    {st.stepIndex === 1
                      ? (isAr ? 'بدء (Start)' : 'Départ')
                      : `${st.rPulses > 0 ? `R-(${st.rPulses}) ` : ''}${st.thetaPulses > 0 ? `T+(${st.thetaPulses})` : ''}` || '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Live Telemetry Bar
  const telemetryBar = (
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
            {holes.length}
            <span className="text-[10px] text-indigo-400 font-normal">
              /{layersCount * nPoints}
            </span>
          </span>
        </div>
      </div>

      {/* Execution Plan Quick Bar & Action Buttons */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
        <button
          type="button"
          onClick={handleUndoLastPlunge}
          disabled={holes.length === 0}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>{t.undoLastPlungeBtn}</span>
        </button>

        {/* Plan Access Button */}
        <button
          type="button"
          onClick={() => {
            setOpenSection((prev) => (prev === 'plan' ? null : 'plan'));
            setIsMobileDrawerOpen(true);
          }}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all cursor-pointer shadow-2xs"
        >
          <Route className="w-3 h-3 text-indigo-600" />
          <span>{t.executionPlanTitle}</span>
          {executionPlan.steps.length > 0 && (
            <span className="text-[9px] font-mono bg-indigo-600 text-white px-1.5 py-0.2 rounded-full font-extrabold">
              {executionPlan.totalPlunges}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setIsClearConfirmOpen(true)}
          disabled={holes.length === 0}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
        >
          <Trash2 className="w-3 h-3" />
          <span>{t.clearAllHolesBtn}</span>
        </button>
      </div>
    </div>
  );

  // Industrial Remote Control Pad
  const remotePadContent = (
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
              onClick={() => handleTableStep(-1)}
              className="py-3 px-2 rounded-xl bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center justify-center min-h-[46px]"
            >
              <span>{t.btnTableMinus}</span>
            </button>
            <button
              type="button"
              onClick={handleTableHome}
              className="py-3 px-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-[10px] font-bold shadow-2xs active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center leading-tight min-h-[46px]"
            >
              <span>{t.btnTableHome}</span>
            </button>
            <button
              type="button"
              onClick={() => handleTableStep(1)}
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
              onClick={() => handleRadialStep(-1)}
              className="py-3 px-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center justify-center min-h-[46px]"
            >
              <span>{t.btnRadialMinus}</span>
            </button>
            <button
              type="button"
              onClick={handleRadialMax}
              className="py-3 px-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 text-[10px] font-bold shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center justify-center leading-tight min-h-[46px]"
            >
              <span>{t.btnRadialMax}</span>
            </button>
            <button
              type="button"
              onClick={() => handleRadialStep(1)}
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
              onClick={() => setTableZUp(false)}
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
              onClick={() => setTableZUp(true)}
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
              onClick={() => setSpindleOn(false)}
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
              onClick={() => setSpindleOn(true)}
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
          onPointerDown={handlePlungeDown}
          onPointerUp={handlePlungeUp}
          onPointerLeave={handlePlungeCancel}
          onPointerCancel={handlePlungeCancel}
          onContextMenu={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
              handlePlungeDown();
            }
          }}
          onKeyUp={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              handlePlungeUp();
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
        {telemetryBar}

        {/* Scrollable Remote Controls */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y flex flex-col gap-3 pr-0.5 pb-20 oneui-scrollbar">
          {remotePadContent}
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
            dir={isAr ? 'rtl' : 'ltr'}
          >
            {/* Drawer Header matching Auto layout */}
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
                      {isAr ? 'بارامترات شبكة وتصميم Semi-Auto' : 'Paramètres Grille Semi-Auto'}
                    </span>
                    <span className="text-[10px] text-[#64748b] block">
                      {t.swipeToAdjust}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all cursor-pointer active:scale-95 shadow-2xs"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إغلاق وعرض' : 'Fermer'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    aria-label={t.closeDrawer}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Drawer Body with 4 Cards */}
            <div className="flex-1 overflow-y-auto px-3.5 py-3.5 sm:px-5 sm:py-4 pb-28 overscroll-contain">
              {parametersContent}
            </div>
          </div>
        )}
      </div>

      {/* 2. Desktop Two-Column Grid View (>= lg) */}
      <div className="hidden lg:grid grid-cols-[380px_1fr] xl:grid-cols-[410px_1fr] gap-4 md:gap-6 items-start h-full min-h-0 overflow-y-auto pr-1 oneui-scrollbar">
        <aside className="w-full flex flex-col gap-4">
          <div className="oneui-card p-4 bg-white border border-slate-200 rounded-3xl shadow-2xs flex flex-col gap-3">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <SlidersHorizontal className="w-4 h-4 text-blue-600" />
              <span>{isAr ? 'بارامترات التصميم والشبكة' : 'Paramètres d’usinage et grille'}</span>
            </h3>
            {parametersContent}
          </div>
        </aside>

        <main className="w-full min-w-0 flex flex-col gap-4">
          <CanvasStage
            model={semiAutoModel}
            state={semiAutoState}
            options={viewOptions}
            onChangeOptions={handleUpdateViewOptions}
            t={t}
            lang={lang}
          />
          {telemetryBar}
          {remotePadContent}
        </main>
      </div>
    </div>
  );
};
