import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  RotateCw, MoveHorizontal, Zap, ArrowUpCircle, ArrowDownCircle, Sliders, SlidersHorizontal, X, RefreshCcw, Settings, ChevronDown, Disc, Clock, Layers3, BarChart3, Grip
} from 'lucide-react';
import { Translations, Language } from '../core/i18n';
import { norm360, buildModel } from '../core/model';
import { safeStorage } from '../core/safeStorage';
import { NumberStepper } from './NumberStepper';
import { CanvasControls } from './AutomaticSimulatorSection';
import { TrayModel, SimulationState, ViewOptions } from '../types';

interface SemiAutomaticPageProps { t: Translations; lang: Language; }

const STORAGE_KEY_SEMI = 'hmi-tray-semiauto-state-v1';

export const SemiAutomaticPage: React.FC<SemiAutomaticPageProps> = ({ t, lang }) => {
  const isAr = lang === 'ar';
  
  const [thetaDeg, setThetaDeg] = useState(() => parseFloat(safeStorage.getItem(`${STORAGE_KEY_SEMI}-theta`) || '0'));
  const [rMm, setRMm] = useState(() => parseFloat(safeStorage.getItem(`${STORAGE_KEY_SEMI}-r`) || '120'));
  const [spindleOn, setSpindleOn] = useState(() => safeStorage.getItem(`${STORAGE_KEY_SEMI}-spindle`) === 'true');
  const [plungeDown, setPlungeDown] = useState(false);
  const [tableZUp, setTableZUp] = useState(() => safeStorage.getItem(`${STORAGE_KEY_SEMI}-tablez`) !== 'false');
  const [rOuterMaxMm, setROuterMaxMm] = useState(() => parseFloat(safeStorage.getItem(`${STORAGE_KEY_SEMI}-routermax`) || '220'));
  const [stepAngleDeg, setStepAngleDeg] = useState(() => parseFloat(safeStorage.getItem(`${STORAGE_KEY_SEMI}-stepangle`) || '15'));
  const [stepRadialMm, setStepRadialMm] = useState(() => parseFloat(safeStorage.getItem(`${STORAGE_KEY_SEMI}-stepradial`) || '15'));
  const [dwellSec, setDwellSec] = useState(() => parseFloat(safeStorage.getItem(`${STORAGE_KEY_SEMI}-dwell`) || '0'));
  const [rotHz, setRotHz] = useState(1.5);
  const [expHz, setExpHz] = useState(2.0);
  const [currentLayer, setCurrentLayer] = useState(0);
  const [holes, setHoles] = useState<{ id: string; layer: number; r: number; a: number; head: 0 | 1 | 2; }[]>(() => JSON.parse(safeStorage.getItem(`${STORAGE_KEY_SEMI}-holes`) || '[]'));
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [openSection, setOpenSection] = useState<'geo' | 'pts' | 'timing' | 'modes' | null>('geo');

  const [viewOptions, setViewOptions] = useState<ViewOptions>(() => {
    const stored = safeStorage.getItem('hmi-tray-canvas-theme');
    const savedTheme: 'light' | 'dark' = stored === 'light' || stored === 'dark' ? stored : 'dark';
    return { sectors: true, heads: true, rings: true, labels: false, dimensions: true, theme: savedTheme, frameMode: 'machine' };
  });

  useEffect(() => { if (viewOptions.theme) safeStorage.setItem('hmi-tray-canvas-theme', viewOptions.theme); }, [viewOptions.theme]);

  useEffect(() => {
    safeStorage.setItem(`${STORAGE_KEY_SEMI}-theta`, thetaDeg.toString());
    safeStorage.setItem(`${STORAGE_KEY_SEMI}-r`, rMm.toString());
    safeStorage.setItem(`${STORAGE_KEY_SEMI}-spindle`, spindleOn.toString());
    safeStorage.setItem(`${STORAGE_KEY_SEMI}-tablez`, tableZUp.toString());
    safeStorage.setItem(`${STORAGE_KEY_SEMI}-routermax`, rOuterMaxMm.toString());
    safeStorage.setItem(`${STORAGE_KEY_SEMI}-stepangle`, stepAngleDeg.toString());
    safeStorage.setItem(`${STORAGE_KEY_SEMI}-stepradial`, stepRadialMm.toString());
    safeStorage.setItem(`${STORAGE_KEY_SEMI}-dwell`, dwellSec.toString());
    safeStorage.setItem(`${STORAGE_KEY_SEMI}-holes`, JSON.stringify(holes));
  }, [thetaDeg, rMm, spindleOn, tableZUp, rOuterMaxMm, stepAngleDeg, stepRadialMm, dwellSec, holes]);

  const handleTableStep = (dir: 1 | -1) => setThetaDeg((prev) => norm360(prev + dir * stepAngleDeg));
  const handleTableHome = () => setThetaDeg(0);
  const handleRadialStep = (dir: 1 | -1) => setRMm((prev) => Math.max(0, Math.min(prev + dir * stepRadialMm, rOuterMaxMm)));
  const handleRadialMax = () => setRMm(rOuterMaxMm);
  const handlePlungeDown = () => {
    setPlungeDown(true);
    if (spindleOn) {
      const newHoles = [0, 1, 2].map((head) => ({ id: Math.random().toString(36), layer: currentLayer, r: rMm, a: norm360(head * 120 - thetaDeg), head: head as 0 | 1 | 2 }));
      setHoles((prev) => [...prev, ...newHoles]);
    }
  };
  const handlePlungeUp = () => setPlungeDown(false);

  const semiAutoModel: TrayModel = useMemo(() => {
    const pts = holes.map((h) => { const rad = (h.a * Math.PI) / 180; return { x: h.r * Math.cos(rad), y: h.r * Math.sin(rad), a: h.a, layer: h.layer, k: 0, head: h.head, j: 0, bad: false, fired: true }; });
    for(let i = 0; i < 360/Math.max(stepAngleDeg, 1); i++) {
        const a = i * stepAngleDeg; const rad = (a * Math.PI) / 180;
        pts.push({ x: rMm * Math.cos(rad), y: rMm * Math.sin(rad), a, layer: currentLayer, k: 0, head: 0, j: 0, bad: false, fired: false });
    }
    return { R: rOuterMaxMm, toolR: 8, r1: rOuterMaxMm, rLast: rMm, d1: rOuterMaxMm * 2, dLast: rMm * 2, radialStepMm: stepRadialMm, layers: [{ i: currentLayer, r: rMm, n: pts.length, per: 0, step: 0, off: 0, pts: pts as any, minD: 0, bad: 0 }], all: pts as any, minD: 0, badCount: 0, warns: [], totalPts: pts.length, totalDrilled: holes.length, totalSteps: 1, hasErr: false, hasWarn: false };
  }, [holes, stepAngleDeg, rMm, currentLayer, rOuterMaxMm, stepRadialMm]);

  const semiAutoState: SimulationState = useMemo(() => ({
    theta: thetaDeg, headR: rMm, counts: [holes.length], cur: { type: spindleOn ? 'fire' : 'index', t0: 0, d: 0, layer: currentLayer, j: plungeDown ? 3 : 0, r0: rMm, r1: rMm, th0: thetaDeg, th1: thetaDeg }, done: false, u: 0
  }), [thetaDeg, rMm, spindleOn, plungeDown, holes, currentLayer]);

  const canvasProps = {
    model: semiAutoModel, state: semiAutoState, options: viewOptions, onChangeOptions: setViewOptions, currentTimeMs: 0, totalTimeMs: 1000, isPlaying: false, speed: 1,
    onTogglePlay: () => {}, onReset: () => setHoles([]), onStepNext: () => {}, onStepPrev: () => {}, onScrubTime: () => {}, onChangeSpeed: () => {}, onOpenSaveModal: () => {}, onOpenQr: () => {},
    params: { trayD: rOuterMaxMm * 2 } as any, totalCycleTimeMs: 1000, t, lang, onToggleDrawer: () => setIsMobileDrawerOpen((prev) => !prev), isDrawerOpen: isMobileDrawerOpen,
  };

  const renderCard = (id: 'geo' | 'pts' | 'timing' | 'modes', title: string, icon: React.ReactNode, children: React.ReactNode) => (
    <div className="oneui-card overflow-hidden border border-slate-200 shadow-2xs rounded-xl">
        <button onClick={() => setOpenSection(prev => prev === id ? null : id)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50">
            <div className="flex items-center gap-3 font-bold text-slate-800 text-xs">{icon}{title}</div>
            <ChevronDown className={`w-4 h-4 transition-transform ${openSection === id ? '' : '-rotate-90'}`} />
        </button>
        {openSection === id && <div className="p-4 border-t border-slate-100 flex flex-col gap-3">{children}</div>}
    </div>
  );

  const parametersContent = (
    <div className="flex flex-col gap-3 p-1">
        {renderCard('geo', 'Geometrie du plateau', <Disc className="w-4 h-4 text-blue-500"/>, <>
            <NumberStepper value={rOuterMaxMm} min={50} max={500} step={5} unit="mm" onChange={setROuterMaxMm} />
            <NumberStepper value={rMm} min={0} max={rOuterMaxMm} step={1} unit="mm" onChange={setRMm} />
        </>)}
        {renderCard('pts', 'Repartition des points & ANGLES', <Grip className="w-4 h-4 text-emerald-500"/>, <>
            <NumberStepper value={stepAngleDeg} min={0.5} max={180} step={0.5} unit="°" onChange={setStepAngleDeg} />
            <NumberStepper value={stepRadialMm} min={1} max={100} step={1} unit="mm" onChange={setStepRadialMm} />
        </>)}
        {renderCard('timing', 'Temporisation et vitesse', <Clock className="w-4 h-4 text-amber-500"/>, <>
            <NumberStepper value={dwellSec} min={0} max={10} step={0.1} unit="s" onChange={setDwellSec} />
            <div className="grid grid-cols-2 gap-2">
                <NumberStepper value={rotHz} min={0.1} max={10} step={0.1} unit="Hz" onChange={setRotHz} />
                <NumberStepper value={expHz} min={0.1} max={10} step={0.1} unit="Hz" onChange={setExpHz} />
            </div>
        </>)}
        {renderCard('modes', 'Modes Machine', <Settings className="w-4 h-4 text-slate-500"/>, <>
            <button onClick={() => setTableZUp(!tableZUp)} className={`py-2 px-3 rounded-lg text-xs font-bold ${tableZUp ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>Table Z: {tableZUp ? 'UP' : 'DOWN'}</button>
        </>)}
    </div>
  );

  const remotePadContent = (
    <div className="oneui-card p-4 sm:p-5 flex flex-col gap-4 bg-white border border-[#e2e8f0] shadow-md rounded-3xl">
      <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
        <h3 className="text-sm font-extrabold text-[#0f172a] flex items-center gap-2">
           <div className="p-2 rounded-xl bg-slate-900 text-white"><Settings className="w-4 h-4" /></div>
           {isAr ? 'لوحة التحكم عن بعد (UI8)' : 'Remote Control (UI8)'}
        </h3>
        <button onClick={() => setHoles([])} className="text-xs text-red-500 font-bold flex items-center gap-1 hover:text-red-700">
          <RefreshCcw className="w-3 h-3" /> {isAr ? 'مسح الكل' : 'Clear All'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
         <div className="col-span-2 grid grid-cols-3 gap-2">
             <button onClick={() => handleTableStep(-1)} className="py-3 rounded-xl bg-slate-100 font-bold text-slate-800 hover:bg-blue-100 hover:text-blue-700">{t.btnTableMinus || 'θ-'}</button>
             <button onClick={handleTableHome} className="py-3 rounded-xl bg-slate-100 font-bold text-slate-800 hover:bg-slate-200">HOME</button>
             <button onClick={() => handleTableStep(1)} className="py-3 rounded-xl bg-slate-100 font-bold text-slate-800 hover:bg-blue-100 hover:text-blue-700">{t.btnTablePlus || 'θ+'}</button>
         </div>
         <div className="col-span-2 grid grid-cols-3 gap-2">
             <button onClick={() => handleRadialStep(-1)} className="py-3 rounded-xl bg-slate-100 font-bold text-slate-800 hover:bg-emerald-100 hover:text-emerald-700">{t.btnRadialMinus || 'r-'}</button>
             <button onClick={handleRadialMax} className="py-3 rounded-xl bg-emerald-600 font-bold text-white hover:bg-emerald-700">{t.btnRadialMax || 'rMax'}</button>
             <button onClick={() => handleRadialStep(1)} className="py-3 rounded-xl bg-slate-100 font-bold text-slate-800 hover:bg-emerald-100 hover:text-emerald-700">{t.btnRadialPlus || 'r+'}</button>
         </div>
         <div className="col-span-2 grid grid-cols-2 gap-2">
             <button onClick={() => setTableZUp(false)} className={`py-3 rounded-xl font-bold ${!tableZUp ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Table Down</button>
             <button onClick={() => setTableZUp(true)} className={`py-3 rounded-xl font-bold ${tableZUp ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Table Up</button>
         </div>
         <div className="col-span-2 grid grid-cols-2 gap-2">
             <button onClick={() => setSpindleOn(false)} className={`py-3 rounded-xl font-bold ${!spindleOn ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>{t.btnSpindleOff || 'Off'}</button>
             <button onClick={() => setSpindleOn(true)} className={`py-3 rounded-xl font-bold ${spindleOn ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{t.btnSpindleOn || 'On'}</button>
         </div>
         <button onClick={handlePlungeDown} onPointerUp={handlePlungeUp} className="col-span-2 py-5 rounded-2xl font-extrabold text-white text-lg bg-indigo-600 hover:bg-indigo-700 active:scale-98 transition-all shadow-lg shadow-indigo-500/30">
            {t.btnPlunge || 'Plunge'}
         </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 max-w-5xl mx-auto w-full h-full min-h-0 select-none overflow-hidden p-3" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex flex-col lg:hidden gap-3.5 h-full min-h-0 select-none">
        <CanvasControls {...canvasProps} />
        {remotePadContent}
        {isMobileDrawerOpen && <div className="fixed inset-0 z-35 bg-black/25 backdrop-blur-[1px]" onClick={() => setIsMobileDrawerOpen(false)} />}
        {isMobileDrawerOpen && <div className="fixed inset-x-0 bottom-0 z-40 max-h-[85dvh] bg-white rounded-t-3xl p-5 overflow-y-auto">{parametersContent}</div>}
      </div>
      <div className="hidden lg:grid grid-cols-[380px_1fr] gap-6 items-start h-full min-h-0 overflow-y-auto pr-1 oneui-scrollbar">
        <aside className="w-full flex flex-col gap-4">{parametersContent}</aside>
        <main className="w-full min-w-0 flex flex-col gap-4"><CanvasControls {...canvasProps} />{remotePadContent}</main>
      </div>
    </div>
  );
};
