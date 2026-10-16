import React, { useState, useEffect, useRef } from 'react';
import {
  RotateCw,
  MoveHorizontal,
  Zap,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCcw,
  Sliders,
  Gauge
} from 'lucide-react';
import { Translations, Language } from '../core/i18n';
import { norm360 } from '../core/model';
import { safeStorage } from '../core/safeStorage';
import { NumberStepper } from './NumberStepper';

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

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (plungeTimerRef.current !== null) {
        window.clearTimeout(plungeTimerRef.current);
      }
    };
  }, []);

  // Handlers for Table Rotation
  const handleTableStep = (dir: 1 | -1) => {
    setThetaDeg((prev) => norm360(prev + dir * stepAngleDeg));
  };

  const handleTableHome = () => {
    setThetaDeg(0);
  };

  // Handlers for Radial Movement
  const handleRadialStep = (dir: 1 | -1) => {
    setRMm((prev) => {
      const next = prev + dir * stepRadialMm;
      return Math.max(0, Math.min(next, rOuterMaxMm));
    });
  };

  const handleRadialMax = () => {
    setRMm(rOuterMaxMm);
  };

  // Plunge Action Handling
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

  // Canvas Live Rendering
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const maxCanvasRadius = Math.min(cx, cy) - 24;

    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Tray Outer Ring
    ctx.beginPath();
    ctx.arc(cx, cy, maxCanvasRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Concentric guide rings
    for (let i = 1; i <= 3; i++) {
      const rRatio = i / 4;
      ctx.beginPath();
      ctx.arc(cx, cy, maxCanvasRadius * rRatio, 0, Math.PI * 2);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Scale factor mm to canvas pixels
    const mmToPx = maxCanvasRadius / Math.max(100, rOuterMaxMm);
    const rPx = rMm * mmToPx;

    // Draw 3 Head positions at thetaDeg, thetaDeg+120, thetaDeg+240
    const headAngles = [thetaDeg, thetaDeg + 120, thetaDeg + 240];

    headAngles.forEach((deg, idx) => {
      const rad = (deg * Math.PI) / 180;
      const hx = cx + rPx * Math.cos(rad);
      const hy = cy + rPx * Math.sin(rad);

      // Head rail line from center
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(hx, hy);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Head body
      ctx.beginPath();
      ctx.arc(hx, hy, 16, 0, Math.PI * 2);
      ctx.fillStyle = plungeDown ? '#dc2626' : spindleOn ? '#2563eb' : '#64748b';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inner tool dot
      ctx.beginPath();
      ctx.arc(hx, hy, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Head label
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`H${idx + 1}`, hx, hy - 20);
    });

    // Center pivot
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();

  }, [thetaDeg, rMm, rOuterMaxMm, spindleOn, plungeDown]);

  return (
    <div className="flex flex-col gap-2.5 sm:gap-4 max-w-5xl mx-auto w-full h-full min-h-0 select-none overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Title Header Card (Fixed at Top) */}
      <div className="flex-none oneui-card p-3 sm:p-4 bg-gradient-to-r from-white to-[#f8fafc] border border-[#e2e8f0]/90 shadow-2xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shadow-xs shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-base font-bold text-[#0f172a] truncate">
                {t.semiAutoTitle}
              </h2>
              <p className="text-[10px] sm:text-xs text-[#64748b] truncate">
                {t.semiAutoSubtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold border border-amber-300 shadow-2xs">
              Semi-Auto HMI
            </span>
          </div>
        </div>
      </div>

      {/* Scrollable Container (Page never scrolls globally, only internal drawer/scroll) */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y flex flex-col gap-3 sm:gap-4 pr-1 oneui-scrollbar">
        {/* Live Status Telemetry Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 shrink-0">
          <div className="oneui-card p-2.5 bg-white border border-[#e2e8f0] flex flex-col justify-center items-center text-center shadow-2xs">
            <span className="text-[10px] text-[#64748b]">{t.thetaLabel}</span>
            <span className="text-sm sm:text-base font-mono font-bold text-[#2563eb]">
              {thetaDeg.toFixed(1)}°
            </span>
          </div>
          <div className="oneui-card p-2.5 bg-white border border-[#e2e8f0] flex flex-col justify-center items-center text-center shadow-2xs">
            <span className="text-[10px] text-[#64748b]">{t.radialLabel}</span>
            <span className="text-sm sm:text-base font-mono font-bold text-emerald-600">
              {rMm.toFixed(1)} mm
            </span>
          </div>
          <div className="oneui-card p-2.5 bg-white border border-[#e2e8f0] flex flex-col justify-center items-center text-center shadow-2xs">
            <span className="text-[10px] text-[#64748b]">{t.spindleLabel}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-0.5 ${spindleOn ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
              {spindleOn ? t.statusActive : t.statusInactive}
            </span>
          </div>
          <div className="oneui-card p-2.5 bg-white border border-[#e2e8f0] flex flex-col justify-center items-center text-center shadow-2xs">
            <span className="text-[10px] text-[#64748b]">{t.plungeLabel}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-0.5 ${plungeDown ? 'bg-red-100 text-red-800 animate-pulse' : 'bg-slate-100 text-slate-600'}`}>
              {plungeDown ? t.statusDown : t.statusUp}
            </span>
          </div>
          <div className="oneui-card p-2.5 bg-white border border-[#e2e8f0] flex flex-col justify-center items-center text-center shadow-2xs col-span-2 sm:col-span-1">
            <span className="text-[10px] text-[#64748b]">{t.tableZLabel}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-0.5 ${tableZUp ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'}`}>
              {tableZUp ? t.statusUp : t.statusDown}
            </span>
          </div>
        </div>

        {/* Main Grid: Parameters & Canvas + Buttons */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-start">
          {/* Left Column: Parameters Card & Live Canvas */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            {/* Parameters Card using NumberStepper */}
            <div className="oneui-card p-4 sm:p-5 flex flex-col gap-3.5">
              <h3 className="text-xs sm:text-sm font-bold text-[#0f172a] flex items-center gap-2 border-b border-[#f1f5f9] pb-2.5">
                <Gauge className="w-4 h-4 text-[#2563eb]" />
                <span>{t.manualParameters}</span>
              </h3>

              <div className="flex flex-col gap-3">
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

                <div className="grid grid-cols-2 gap-2">
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

            {/* Live Canvas View */}
            <div className="oneui-card p-3 sm:p-4 bg-white border border-[#e2e8f0] flex flex-col items-center shadow-2xs">
              <span className="text-[11px] font-bold text-[#475569] mb-2 self-start">
                {isAr ? 'محاكاة موضع الرؤوس والطاولة حياً' : 'Visualisation en direct'}
              </span>
              <div className="w-full aspect-square max-w-[280px] rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-50 flex items-center justify-center relative">
                <canvas
                  ref={canvasRef}
                  width={300}
                  height={300}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Live Control Buttons Grid */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            <div className="oneui-card p-4 sm:p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
                <h3 className="text-xs sm:text-sm font-bold text-[#0f172a]">
                  {isAr ? 'أزرار تحكم المشغل (HMI Controls)' : 'Commandes Opérateur'}
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">
                  {isAr ? 'استجابة فورية (بدون طابور أوامر)' : 'Sans file d’attente'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Table Rotation Controls */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <RotateCw className="w-4 h-4 text-blue-600" />
                    {t.thetaLabel}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleTableStep(-1)}
                      className="py-3 px-3 rounded-xl bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span>{t.btnTableMinus}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTableStep(1)}
                      className="py-3 px-3 rounded-xl bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span>{t.btnTablePlus}</span>
                    </button>
                  </div>
                </div>

                {/* 2. Radial Movement Controls */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <MoveHorizontal className="w-4 h-4 text-emerald-600" />
                    {t.radialLabel}
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleRadialStep(-1)}
                      className="py-3 px-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                    >
                      <span>{t.btnRadialMinus}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRadialStep(1)}
                      className="py-3 px-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                    >
                      <span>{t.btnRadialPlus}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRadialMax}
                      className="py-3 px-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 text-[11px] font-bold shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                      title="أقصى الشوط الخارجي"
                    >
                      <span>{t.btnRadialMax}</span>
                    </button>
                  </div>
                </div>

                {/* 3. Spindle Rotation Controls */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-600" />
                    {t.spindleLabel}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSpindleOn(false)}
                      className={`py-3 px-3 rounded-xl border text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center justify-center ${
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
                      className={`py-3 px-3 rounded-xl border text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center justify-center ${
                        spindleOn
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                          : 'bg-white hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      <span>{t.btnSpindleOn}</span>
                    </button>
                  </div>
                </div>

                {/* 4. Table Z Commutateur Controls */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ArrowUpCircle className="w-4 h-4 text-blue-600" />
                    {t.tableZLabel}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTableZUp(false)}
                      className={`py-3 px-2 rounded-xl border text-[11px] font-bold shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center justify-center ${
                        !tableZUp
                          ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                          : 'bg-white hover:bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      <span>{t.btnTableZDown}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTableZUp(true)}
                      className={`py-3 px-2 rounded-xl border text-[11px] font-bold shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center justify-center ${
                        tableZUp
                          ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                          : 'bg-white hover:bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      <span>{t.btnTableZUp}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 5. Plunge Button (Distributor Push) & Future Home */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-[#f1f5f9]">
                <button
                  type="button"
                  onPointerDown={handlePlungeDown}
                  onPointerUp={handlePlungeUp}
                  onPointerLeave={handlePlungeUp}
                  onMouseDown={handlePlungeDown}
                  onMouseUp={handlePlungeUp}
                  onTouchStart={handlePlungeDown}
                  onTouchEnd={handlePlungeUp}
                  className={`sm:col-span-2 py-4 px-4 rounded-2xl font-extrabold text-xs sm:text-sm border shadow-md active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 select-none ${
                    plungeDown
                      ? 'bg-red-600 text-white border-red-700 ring-4 ring-red-500/20'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-blue-500/40'
                  }`}
                >
                  <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                    <ArrowDownCircle className="w-4 h-4" />
                  </div>
                  <span>{t.btnPlunge}</span>
                </button>

                <button
                  type="button"
                  onClick={handleTableHome}
                  className="py-3 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5"
                >
                  <div className="flex items-center gap-1">
                    <RefreshCcw className="w-3.5 h-3.5 text-slate-600" />
                    <span>{t.btnTableHome}</span>
                  </div>
                  <span className="text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded-full border border-amber-200 font-semibold">
                    {t.hardwareSoonBadge}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
