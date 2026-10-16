import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  RotateCw,
  MoveHorizontal,
  Zap,
  ArrowUpCircle,
  ArrowDownCircle,
  Sliders,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { Translations, Language } from '../core/i18n';
import { norm360, buildModel } from '../core/model';
import { safeStorage } from '../core/safeStorage';
import { NumberStepper } from './NumberStepper';
import { CanvasStage } from './CanvasStage';
import { TrayModel, SimulationState, ViewOptions } from '../types';

interface SemiAutomaticPageProps {
  t: Translations;
  lang: Language;
}

const STORAGE_KEY_SEMI = 'hmi-tray-semiauto-state-v1';

export const SemiAutomaticPage: React.FC<SemiAutomaticPageProps> = ({ t, lang }) => {
  const isAr = lang === 'ar';

  // State initialization with safeStorage persistence
  const [thetaDeg, setThetaDeg] = useState<number>(() => {
    const saved = safeStorage.getItem(`${STORAGE_KEY_SEMI}-theta`);
    return saved !== null ? parseFloat(saved) : 0;
  });

  const [rMm, setRMm] = useState<number>(() => {
    const saved = safeStorage.getItem(`${STORAGE_KEY_SEMI}-r`);
    return saved !== null ? parseFloat(saved) : 120;
  });

  const [spindleOn, setSpindleOn] = useState<boolean>(() => {
    const saved = safeStorage.getItem(`${STORAGE_KEY_SEMI}-spindle`);
    return saved === 'true';
  });

  const [plungeDown, setPlungeDown] = useState<boolean>(false);

  const [tableZUp, setTableZUp] = useState<boolean>(() => {
    const saved = safeStorage.getItem(`${STORAGE_KEY_SEMI}-tablez`);
    return saved !== null ? saved === 'true' : true;
  });

  const [rOuterMaxMm, setROuterMaxMm] = useState<number>(() => {
    const saved = safeStorage.getItem(`${STORAGE_KEY_SEMI}-routermax`);
    return saved !== null ? parseFloat(saved) : 220;
  });

  const [stepAngleDeg, setStepAngleDeg] = useState<number>(() => {
    const saved = safeStorage.getItem(`${STORAGE_KEY_SEMI}-stepangle`);
    return saved !== null ? parseFloat(saved) : 15;
  });

  const [stepRadialMm, setStepRadialMm] = useState<number>(() => {
    const saved = safeStorage.getItem(`${STORAGE_KEY_SEMI}-stepradial`);
    return saved !== null ? parseFloat(saved) : 15;
  });

  const [dwellSec, setDwellSec] = useState<number>(() => {
    const saved = safeStorage.getItem(`${STORAGE_KEY_SEMI}-dwell`);
    return saved !== null ? parseFloat(saved) : 0;
  });

  const [rotHz, setRotHz] = useState<number>(1.5);
  const [expHz, setExpHz] = useState<number>(2.0);

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  // ViewOptions for CanvasStage (exact replica of Auto canvas theme & toggles)
  const [viewOptions, setViewOptions] = useState<ViewOptions>(() => {
    const stored = safeStorage.getItem('hmi-tray-canvas-theme');
    const savedTheme: 'light' | 'dark' = stored === 'light' || stored === 'dark' ? stored : 'dark';
    return {
      sectors: true,
      heads: true,
      rings: true,
      labels: false,
      dimensions: true,
      theme: savedTheme,
    };
  });

  useEffect(() => {
    if (viewOptions.theme) {
      safeStorage.setItem('hmi-tray-canvas-theme', viewOptions.theme);
    }
  }, [viewOptions.theme]);

  // Persistence effects
  useEffect(() => { safeStorage.setItem(`${STORAGE_KEY_SEMI}-theta`, thetaDeg.toString()); }, [thetaDeg]);
  useEffect(() => { safeStorage.setItem(`${STORAGE_KEY_SEMI}-r`, rMm.toString()); }, [rMm]);
  useEffect(() => { safeStorage.setItem(`${STORAGE_KEY_SEMI}-spindle`, spindleOn.toString()); }, [spindleOn]);
  useEffect(() => { safeStorage.setItem(`${STORAGE_KEY_SEMI}-tablez`, tableZUp.toString()); }, [tableZUp]);
  useEffect(() => { safeStorage.setItem(`${STORAGE_KEY_SEMI}-routermax`, rOuterMaxMm.toString()); }, [rOuterMaxMm]);
  useEffect(() => { safeStorage.setItem(`${STORAGE_KEY_SEMI}-stepangle`, stepAngleDeg.toString()); }, [stepAngleDeg]);
  useEffect(() => { safeStorage.setItem(`${STORAGE_KEY_SEMI}-stepradial`, stepRadialMm.toString()); }, [stepRadialMm]);
  useEffect(() => { safeStorage.setItem(`${STORAGE_KEY_SEMI}-dwell`, dwellSec.toString()); }, [dwellSec]);

  // Plunge timer ref for dwell > 0
  const plungeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (plungeTimerRef.current !== null) {
        window.clearTimeout(plungeTimerRef.current);
      }
    };
  }, []);

  // Handlers
  const handleTableStep = (dir: 1 | -1) => {
    setThetaDeg((prev) => norm360(prev + dir * stepAngleDeg));
  };

  const handleTableHome = () => {
    setThetaDeg(0);
  };

  const handleRadialStep = (dir: 1 | -1) => {
    setRMm((prev) => {
      const next = prev + dir * stepRadialMm;
      return Math.max(0, Math.min(next, rOuterMaxMm));
    });
  };

  const handleRadialMax = () => {
    setRMm(rOuterMaxMm);
  };

  const handlePlungeDown = () => {
    if (dwellSec <= 0) {
      setPlungeDown(true);
    } else {
      if (plungeTimerRef.current !== null) {
        window.clearTimeout(plungeTimerRef.current);
      }
      setPlungeDown(true);
      plungeTimerRef.current = window.setTimeout(() => {
        setPlungeDown(false);
        plungeTimerRef.current = null;
      }, dwellSec * 1000);
    }
  };

  const handlePlungeUp = () => {
    if (dwellSec <= 0) {
      setPlungeDown(false);
    }
  };

  // Construct TrayModel and SimulationState using buildModel (exact replica of Auto rendering)
  const semiAutoModel: TrayModel = useMemo(() => {
    return buildModel({
      trayD: rOuterMaxMm * 2,
      trayDDisplay: rOuterMaxMm * 2,
      trayU: 'mm',
      tool: 8,
      margin: 10,
      marginDisplay: 10,
      marginU: 'mm',
      layers: 1,
      spacing: 0,
      spacingDisplay: 0,
      spacingU: 'mm',
      rLast: rMm * 2,
      rLastDisplay: rMm * 2,
      rLastU: 'mm',
      mode: 'all',
      rawBase: 3,
      addAngle: 0,
      custom: [],
      timing: { dwell: 100, index: 100, layer: 100 },
      rotationSpeedHz: rotHz,
      expansionSpeedHz: expHz,
      pulsesPerRev: 1000,
      pulsesPerMm: 100,
      timingMode: 'hz',
      speed: 1,
    });
  }, [rOuterMaxMm, rMm, rotHz, expHz]);

  const semiAutoState: SimulationState = useMemo(() => {
    const rad0 = (thetaDeg * Math.PI) / 180;
    const rad1 = ((thetaDeg + 120) * Math.PI) / 180;
    const rad2 = ((thetaDeg + 240) * Math.PI) / 180;
    if (semiAutoModel.layers[0]) {
      semiAutoModel.layers[0].r = rMm;
      semiAutoModel.layers[0].pts = [
        { x: rMm * Math.cos(rad0), y: rMm * Math.sin(rad0), a: thetaDeg, layer: 0, k: 0, head: 0, j: plungeDown ? 3 : 0, bad: false, fired: true },
        { x: rMm * Math.cos(rad1), y: rMm * Math.sin(rad1), a: norm360(thetaDeg + 120), layer: 0, k: 1, head: 1, j: plungeDown ? 3 : 0, bad: false, fired: true },
        { x: rMm * Math.cos(rad2), y: rMm * Math.sin(rad2), a: norm360(thetaDeg + 240), layer: 0, k: 2, head: 2, j: plungeDown ? 3 : 0, bad: false, fired: true },
      ];
    }
    return {
      theta: thetaDeg,
      headR: rMm,
      counts: [3],
      cur: {
        type: spindleOn ? 'fire' : 'index',
        t0: 0,
        d: 0,
        layer: 0,
        j: plungeDown ? 3 : 0,
        r0: rMm,
        r1: rMm,
        th0: thetaDeg,
        th1: thetaDeg,
      },
      done: false,
      u: 0
    };
  }, [thetaDeg, rMm, spindleOn, plungeDown, semiAutoModel]);

  // Parameters form content for panel / drawer
  const parametersContent = (
    <div className="oneui-card p-4 sm:p-5 flex flex-col gap-4 bg-white border border-[#e2e8f0] shadow-2xs">
      <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
        <h3 className="text-xs sm:text-sm font-bold text-[#0f172a] flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-blue-50 text-[#2563eb] flex items-center justify-center font-bold shadow-2xs">
            <Sliders className="w-4 h-4" />
          </div>
          <span>{t.manualParameters}</span>
        </h3>
        {isMobileDrawerOpen && (
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3.5">
        <div>
          <label className="block text-[11px] font-semibold text-[#475569] mb-1">
            {t.stepAngleLabel}
          </label>
          <NumberStepper
            value={stepAngleDeg}
            min={0.5}
            max={180}
            step={0.5}
            unit="°"
            onChange={(val) => setStepAngleDeg(val)}
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
            onChange={(val) => setStepRadialMm(val)}
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-[#475569] mb-1">
            {t.dwellLabel}
          </label>
          <NumberStepper
            value={dwellSec}
            min={0}
            max={10}
            step={0.1}
            unit="s"
            onChange={(val) => setDwellSec(val)}
          />
        </div>

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
            onChange={(val) => setROuterMaxMm(val)}
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
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
              onChange={(val) => setRotHz(val)}
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
              onChange={(val) => setExpHz(val)}
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Industrial Remote Control Pad (HMI pad)
  const remotePadContent = (
    <div className="oneui-card p-3.5 sm:p-4 flex flex-col gap-3.5 bg-white border border-[#e2e8f0] shadow-2xs">
      <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-2.5">
        <h3 className="text-xs sm:text-sm font-bold text-[#0f172a] flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
            ⚡
          </div>
          <span>{isAr ? 'لوحة التحكم الصناعية (HMI Terminal)' : 'Terminal de Commande HMI'}</span>
        </h3>
        <span className="text-[10px] text-slate-500 font-mono">
          {isAr ? 'لمس مباشر (Touch)' : 'Tactile direct'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* 1. Table Rotation Controls */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <RotateCw className="w-4 h-4 text-blue-600" />
            {t.thetaLabel}
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

        {/* 2. Radial Movement Controls */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <MoveHorizontal className="w-4 h-4 text-emerald-600" />
            {t.radialLabel}
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

        {/* 3. Spindle Controls */}
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

        {/* 4. Table Z Commutateur Controls */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <ArrowUpCircle className="w-4 h-4 text-blue-600" />
            {t.tableZLabel}
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTableZUp(false)}
              className={`py-3 px-2 rounded-xl border text-[11px] font-bold shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center justify-center min-h-[46px] ${
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
              className={`py-3 px-2 rounded-xl border text-[11px] font-bold shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center justify-center min-h-[46px] ${
                tableZUp
                  ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                  : 'bg-white hover:bg-blue-50 text-blue-700 border-slate-200'
              }`}
            >
              <span>{t.btnTableZUp}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Central Plunge Button */}
      <div className="pt-1">
        <button
          type="button"
          onPointerDown={handlePlungeDown}
          onPointerUp={handlePlungeUp}
          onPointerLeave={handlePlungeUp}
          onMouseDown={handlePlungeDown}
          onMouseUp={handlePlungeUp}
          onTouchStart={handlePlungeDown}
          onTouchEnd={handlePlungeUp}
          className={`w-full py-4 px-4 rounded-2xl font-extrabold text-sm sm:text-base border shadow-md active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2.5 select-none min-h-[52px] ${
            plungeDown
              ? 'bg-red-600 text-white border-red-700 ring-4 ring-red-500/25 animate-pulse'
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
    <div className="flex flex-col gap-2.5 max-w-5xl mx-auto w-full h-full min-h-0 select-none overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. Mobile Single Column View (< lg) - Exact Auto Structure */}
      <div className="flex flex-col lg:hidden gap-3.5 h-full min-h-0 select-none">
        <div className="flex-none w-full">
          <CanvasStage
            model={semiAutoModel}
            state={semiAutoState}
            options={viewOptions}
            onChangeOptions={setViewOptions}
            t={t}
            lang={lang}
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
            className="fixed inset-x-0 bottom-0 z-40 max-h-[85dvh] flex flex-col bg-white rounded-t-3xl shadow-[0_-12px_44px_rgba(15,23,42,0.22)] border-t border-[#cbd5e1] animate-in slide-in-from-bottom duration-300 p-5 overflow-y-auto oneui-scrollbar"
            dir={isAr ? 'rtl' : 'ltr'}
          >
            {parametersContent}
          </div>
        )}

        {/* Scrollable Industrial Pad Container */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y flex flex-col gap-3 pr-1 pb-4 oneui-scrollbar">
          {remotePadContent}
        </div>
      </div>

      {/* 2. Desktop Two-Column Grid View (>= lg) - Exact Auto Structure */}
      <div className="hidden lg:grid grid-cols-[380px_1fr] xl:grid-cols-[410px_1fr] gap-4 md:gap-6 items-start h-full min-h-0 overflow-y-auto pr-1 oneui-scrollbar">
        <aside className="w-full">
          {parametersContent}
        </aside>

        <main className="w-full min-w-0 flex flex-col gap-4">
          <CanvasStage
            model={semiAutoModel}
            state={semiAutoState}
            options={viewOptions}
            onChangeOptions={setViewOptions}
            t={t}
            lang={lang}
          />
          {remotePadContent}
        </main>
      </div>
    </div>
  );
};
