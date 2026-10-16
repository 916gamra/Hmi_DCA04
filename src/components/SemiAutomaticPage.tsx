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
  Layers
} from 'lucide-react';
import { Translations, Language } from '../core/i18n';
import { norm360 } from '../core/model';
import { safeStorage } from '../core/safeStorage';
import { HEADS, LAYER_COLORS } from '../core/constants';
import { NumberStepper } from './NumberStepper';
import { CanvasStage } from './CanvasStage';
import { ConfirmModal } from './ConfirmModal';
import { TrayModel, SimulationState, ViewOptions, Point, TrayParams } from '../types';

export interface SemiHole {
  id: string;
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

const STORAGE_KEY_SEMI = 'hmi-tray-semiauto-state-v3';
const MAX_HOLES = 1500;

interface SemiAutoSavedState {
  thetaDeg?: number;
  rMm?: number;
  spindleOn?: boolean;
  tableZUp?: boolean;
  rOuterMaxMm?: number;
  stepAngleDeg?: number;
  stepRadialMm?: number;
  dwellSec?: number;
  rotHz?: number;
  expHz?: number;
  currentLayer?: number;
  holes?: SemiHole[];
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

  const defaultROuter = params?.trayD ? params.trayD / 2 : 220;

  // 1. Live Machine States
  const [thetaDeg, setThetaDeg] = useState<number>(() => {
    const v = savedState.thetaDeg;
    return typeof v === 'number' && Number.isFinite(v) ? v : 0;
  });

  const [rMm, setRMm] = useState<number>(() => {
    const v = savedState.rMm;
    return typeof v === 'number' && Number.isFinite(v) ? v : 120;
  });

  const [spindleOn, setSpindleOn] = useState<boolean>(() => {
    return Boolean(savedState.spindleOn);
  });

  const [plungeDown, setPlungeDown] = useState<boolean>(false);

  const [tableZUp, setTableZUp] = useState<boolean>(() => {
    return savedState.tableZUp !== false;
  });

  // 2. Machine Parameters (Independent rOuterMaxMm, default synced with trayD / 2 if fresh)
  const [rOuterMaxMm, setROuterMaxMm] = useState<number>(() => {
    const v = savedState.rOuterMaxMm;
    return typeof v === 'number' && Number.isFinite(v) && v >= 20 ? v : defaultROuter;
  });

  const [stepAngleDeg, setStepAngleDeg] = useState<number>(() => {
    const v = savedState.stepAngleDeg;
    return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 15;
  });

  const [stepRadialMm, setStepRadialMm] = useState<number>(() => {
    const v = savedState.stepRadialMm;
    return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 15;
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
    return typeof v === 'number' && Number.isFinite(v) && v >= 0 && v < 7 ? v : 0;
  });

  // 3. Holes Persistent Memory with corruption protection
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

  // 4. Drawer & Confirmation Dialog
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState<boolean>(false);
  const [openSection, setOpenSection] = useState<'geo' | 'pts' | 'timing' | 'modes' | null>('geo');

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
      rOuterMaxMm,
      stepAngleDeg,
      stepRadialMm,
      dwellSec,
      rotHz,
      expHz,
      currentLayer,
      holes,
    };
    safeStorage.setJSON(STORAGE_KEY_SEMI, payload);
  }, [
    thetaDeg,
    rMm,
    spindleOn,
    tableZUp,
    rOuterMaxMm,
    stepAngleDeg,
    stepRadialMm,
    dwellSec,
    rotHz,
    expHz,
    currentLayer,
    holes,
  ]);

  // Protection: clamp rMm if rOuterMaxMm is reduced
  useEffect(() => {
    if (rMm > rOuterMaxMm) {
      setRMm(rOuterMaxMm);
    }
  }, [rOuterMaxMm, rMm]);

  // Stepping Handlers
  const handleTableStep = useCallback((dir: 1 | -1) => {
    setThetaDeg((prev) => norm360(prev + dir * stepAngleDeg));
  }, [stepAngleDeg]);

  const handleTableHome = useCallback(() => {
    setThetaDeg(0);
  }, []);

  const handleRadialStep = useCallback((dir: 1 | -1) => {
    setRMm((prev) => {
      const next = prev + dir * stepRadialMm;
      return Math.max(0, Math.min(next, rOuterMaxMm));
    });
  }, [stepRadialMm, rOuterMaxMm]);

  const handleRadialMax = useCallback(() => {
    setRMm(rOuterMaxMm);
  }, [rOuterMaxMm]);

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

    const newHoles: SemiHole[] = HEADS.map((hConfig, headIdx) => {
      const aTray = norm360(hConfig.angle - thetaDeg);
      return {
        id: safeId(),
        layer: currentLayer,
        r: rMm,
        a: aTray,
        head: headIdx as 0 | 1 | 2,
        drilledAt: Date.now(),
      };
    });
    setHoles((prev) => [...prev, ...newHoles]);
  }, [holes.length, currentLayer, rMm, thetaDeg, onShowToast, t.maxHolesReachedWarning]);

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

  // Construct TrayModel for CanvasStage:
  // - Drilled permanent holes (fired: true)
  // - Ghost division points on current radius rMm (fired: false)
  // - totalPts and totalDrilled correctly count holes without counting the 720 ghost points!
  const toolRadius = params?.tool ? params.tool / 2 : 8;

  const semiAutoModel: TrayModel = useMemo(() => {
    const pts: Point[] = [];

    // 1. Drilled permanent holes
    holes.forEach((h, idx) => {
      const rad = (h.a * Math.PI) / 180;
      pts.push({
        x: h.r * Math.cos(rad),
        y: h.r * Math.sin(rad),
        a: h.a,
        layer: h.layer,
        k: idx,
        head: h.head,
        j: 0,
        bad: false,
        fired: true,
      });
    });

    // 2. Ghost division reticles on current radius rMm
    const safeStep = Math.max(0.5, stepAngleDeg);
    const divisions = Math.min(360, Math.round(360 / safeStep));
    for (let i = 0; i < divisions; i++) {
      const a = norm360(i * safeStep);
      const alreadyDrilled = holes.some(
        (h) => Math.abs(h.r - rMm) < 1.5 && Math.abs(norm360(h.a - a)) < 0.5
      );
      if (!alreadyDrilled) {
        const rad = (a * Math.PI) / 180;
        pts.push({
          x: rMm * Math.cos(rad),
          y: rMm * Math.sin(rad),
          a,
          layer: currentLayer,
          k: pts.length,
          head: 0,
          j: 0,
          bad: false,
          fired: false, // ghost cross / dashed ring
        });
      }
    }

    return {
      R: rOuterMaxMm,
      toolR: toolRadius,
      r1: rOuterMaxMm,
      rLast: rMm,
      d1: rOuterMaxMm * 2,
      dLast: rMm * 2,
      radialStepMm: stepRadialMm,
      layers: [
        {
          i: currentLayer,
          r: rMm,
          n: holes.length, // Accurate count of drilled holes on layer
          per: 0,
          step: safeStep,
          off: 0,
          pts,
          minD: 0,
          bad: 0,
        },
      ],
      all: pts,
      minD: 0,
      badCount: 0,
      warns: [],
      totalPts: holes.length, // Accurate hole counter
      totalDrilled: holes.length,
      totalSteps: 1,
      hasErr: false,
      hasWarn: false,
    };
  }, [holes, stepAngleDeg, rMm, currentLayer, rOuterMaxMm, stepRadialMm, toolRadius]);

  const semiAutoState: SimulationState = useMemo(() => {
    return {
      theta: thetaDeg,
      headR: rMm,
      counts: [holes.length],
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
  }, [thetaDeg, rMm, spindleOn, plungeDown, holes.length, currentLayer]);

  // Card toggle renderer for parameters drawer
  const renderCard = (
    id: 'geo' | 'pts' | 'timing' | 'modes',
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
      {/* 1. Géométrie du plateau */}
      {renderCard(
        'geo',
        t.cardSemiGeoTitle,
        <Disc className="w-4 h-4 text-blue-600" />,
        <>
          <div>
            <label className="block text-[11px] font-semibold text-[#475569] mb-1">
              {t.rOuterMaxLabel}
            </label>
            <NumberStepper
              value={rOuterMaxMm}
              min={50}
              max={500}
              step={5}
              unit="mm"
              onChange={setROuterMaxMm}
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#475569] mb-1">
              {t.currentRadiusLabel}
            </label>
            <NumberStepper
              value={rMm}
              min={0}
              max={rOuterMaxMm}
              step={1}
              unit="mm"
              onChange={(val) => setRMm(Math.min(val, rOuterMaxMm))}
            />
          </div>
        </>
      )}

      {/* 2. Répartition des points & ANGLES */}
      {renderCard(
        'pts',
        t.cardSemiPtsTitle,
        <Compass className="w-4 h-4 text-emerald-600" />,
        <>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-semibold text-[#475569]">
                {t.stepAngleLabel}
              </label>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-bold">
                {Math.round(360 / Math.max(0.5, stepAngleDeg))} {t.ptsPerTurn}
              </span>
            </div>
            <NumberStepper
              value={stepAngleDeg}
              min={0.5}
              max={180}
              step={0.5}
              unit="°"
              onChange={setStepAngleDeg}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#475569] mb-1">
              {t.stepRadialLabel}
            </label>
            <NumberStepper
              value={stepRadialMm}
              min={1}
              max={100}
              step={1}
              unit="mm"
              onChange={setStepRadialMm}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#475569] mb-1 flex items-center justify-between">
              <span>{t.layerActiveLabel}</span>
              <span
                className="w-3 h-3 rounded-full border border-slate-300"
                style={{ backgroundColor: LAYER_COLORS[currentLayer % LAYER_COLORS.length] }}
              />
            </label>
            <NumberStepper
              value={currentLayer + 1}
              min={1}
              max={7}
              step={1}
              unit=""
              onChange={(val) => setCurrentLayer(Math.max(0, Math.min(6, Math.round(val) - 1)))}
            />
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
              onChange={setDwellSec}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-[#475569]">
                  {t.rotHzLabel}
                </label>
                <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1 py-0.2 rounded">
                  {t.hardwareSoonBadge}
                </span>
              </div>
              <NumberStepper
                value={rotHz}
                min={0.1}
                max={10}
                step={0.1}
                unit="Hz"
                onChange={setRotHz}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-[#475569]">
                  {t.expHzLabel}
                </label>
                <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1 py-0.2 rounded">
                  {t.hardwareSoonBadge}
                </span>
              </div>
              <NumberStepper
                value={expHz}
                min={0.1}
                max={10}
                step={0.1}
                unit="Hz"
                onChange={setExpHz}
              />
            </div>
          </div>
        </>
      )}

      {/* 4. Modes Machine */}
      {renderCard(
        'modes',
        t.cardSemiModesTitle,
        <Settings className="w-4 h-4 text-slate-600" />,
        <div className="flex flex-col gap-2.5">
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
        <div className="p-1.5 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-[9px] font-bold text-slate-500 block">r</span>
          <span className="text-xs font-mono font-extrabold text-emerald-600">
            {rMm.toFixed(1)}
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
        {/* Plunge */}
        <div
          className={`p-1.5 rounded-xl border transition-all ${
            plungeDown
              ? 'bg-red-500 border-red-600 text-white ring-2 ring-red-400 animate-pulse'
              : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}
        >
          <span className="text-[9px] font-bold block">Plunge</span>
          <span className="text-[10px] font-extrabold">
            {plungeDown ? 'DOWN' : 'UP'}
          </span>
        </div>
        {/* Holes Count */}
        <div className="p-1.5 bg-indigo-50 rounded-xl border border-indigo-200 text-indigo-700">
          <span className="text-[9px] font-bold block">
            {isAr ? 'الثقوب' : 'Trous'}
          </span>
          <span className="text-xs font-mono font-extrabold">{holes.length}</span>
        </div>
      </div>

      {/* Undo & Clear Action Buttons */}
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
                      {isAr ? 'بارامترات الوضع شبه التلقائي' : 'Paramètres Semi-Auto'}
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
              <span>{isAr ? 'بارامترات التشغيل' : 'Paramètres d’usinage'}</span>
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
