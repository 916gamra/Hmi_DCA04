import React, { useState } from 'react';
import {
  Sliders,
  Play,
  MoveHorizontal,
  Gauge,
} from 'lucide-react';
import { TrayModel } from '../types';
import { NumberStepper } from './NumberStepper';
import { Translations, Language } from '../core/i18n';

interface ManualModePageProps {
  model: TrayModel;
  t: Translations;
  lang: Language;
  onShowToast: (msg: string) => void;
}

export const ManualModePage: React.FC<ManualModePageProps> = ({
  t,
  lang,
  onShowToast,
}) => {
  const [manualAngle, setManualAngle] = useState(93.1);
  const [manualExpLen, setManualExpLen] = useState(0);
  const [manualDeflowerSec, setManualDeflowerSec] = useState(0.72);
  const [manualRotHz, setManualRotHz] = useState(1000);
  const [manualExpHz, setManualExpHz] = useState(800);
  const [activeHeadTest, setActiveHeadTest] = useState<number | null>(null);
  const [isJogging, setIsJogging] = useState(false);

  const testHeadPlunge = (headIdx: number) => {
    setActiveHeadTest(headIdx);
    onShowToast(
      lang === 'ar'
        ? `تم تشغيل رأس الحفر T${headIdx + 1} يدوياً لمدة ${manualDeflowerSec}s`
        : `Tête T${headIdx + 1} activée manuellement pendant ${manualDeflowerSec}s`
    );
    setTimeout(() => {
      setActiveHeadTest(null);
    }, manualDeflowerSec * 1000);
  };

  const testJog = (direction: 'fwd' | 'rev') => {
    setIsJogging(true);
    const delta = direction === 'fwd' ? 5 : -5;
    const nextVal = Math.max(0, manualExpLen + delta);
    setManualExpLen(nextVal);
    onShowToast(
      lang === 'ar'
        ? `حركة سيرفو يدوية: ${direction === 'fwd' ? 'تمدد +' : 'سحب -'} (${nextVal} mm)`
        : `Mouvement servo: ${direction === 'fwd' ? 'avancer +' : 'reculer -'} (${nextVal} mm)`
    );
    setTimeout(() => {
      setIsJogging(false);
    }, 400);
  };

  return (
    <div className="flex flex-col gap-2.5 sm:gap-4 max-w-7xl mx-auto w-full h-full min-h-0 select-none overflow-hidden" dir="ltr">
      {/* Title Header Card (Fixed at Top) */}
      <div className="flex-none oneui-card p-3 sm:p-4 bg-gradient-to-r from-white to-[#f8fafc] border border-[#e2e8f0]/90 shadow-2xs">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shadow-xs shrink-0">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs sm:text-base font-bold text-[#0f172a]">
              {t.manualTitle}
            </h2>
            <p className="text-[10px] sm:text-xs text-[#64748b]">
              {t.manualSubtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable Container for Manual Controls (Page never scrolls, only controls scroll internally) */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y flex flex-col gap-3 sm:gap-4 pr-1 oneui-scrollbar">
        {/* Screen 3 & 4 LCD Mirrors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Screen 3 LCD */}
        <div className="bg-[#2e3e18] p-4 rounded-3xl border-4 border-[#1f2910] shadow-md flex flex-col gap-2">
          <div className="flex justify-between items-center text-[#b4c952] text-xs font-mono font-bold">
            <span>{t.manualScreen3}</span>
            <span>TouchWin</span>
          </div>
          <div className="bg-[#b4c952] border-2 border-[#899f2b] p-3 rounded-xl shadow-inner font-mono text-[#1a2305] text-xs leading-relaxed font-bold">
            <div> {t.manualParameters}  </div>
            <div>{t.manualAngle.split('(')[0].trim().toLowerCase()}     {manualAngle.toFixed(1)}°</div>
            <div>{t.manualExpLength.split('(')[0].trim().toLowerCase()} : {manualExpLen}    MM</div>
            <div>{t.manualDeflowerTime.split('(')[0].trim().toLowerCase()}      {manualDeflowerSec.toFixed(2)} S</div>
          </div>
        </div>

        {/* Screen 4 LCD */}
        <div className="bg-[#2e3e18] p-4 rounded-3xl border-4 border-[#1f2910] shadow-md flex flex-col gap-2">
          <div className="flex justify-between items-center text-[#b4c952] text-xs font-mono font-bold">
            <span>{t.manualScreen4}</span>
            <span>TouchWin</span>
          </div>
          <div className="bg-[#b4c952] border-2 border-[#899f2b] p-3 rounded-xl shadow-inner font-mono text-[#1a2305] text-xs leading-relaxed font-bold">
            <div> {t.manualParameters}  </div>
            <div>{t.manualRotSpeed.split('(')[0].trim().toLowerCase()}  : {manualRotHz} Hz</div>
            <div>{t.manualExpSpeed.split('(')[0].trim().toLowerCase()} :  {manualExpHz} Hz</div>
            <div>&nbsp;</div>
          </div>
        </div>
      </div>

      {/* Manual Parameters Controls */}
      <div className="oneui-card p-5 sm:p-6 flex flex-col gap-4">
        <h3 className="text-sm font-bold text-[#0f172a] flex items-center gap-2 border-b border-[#f1f5f9] pb-3">
          <Gauge className="w-4 h-4 text-[#2563eb]" />
          <span>{t.manualEditSection}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Rotation angle */}
          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-1.5">
              {t.manualAngle}
            </label>
            <NumberStepper
              value={manualAngle}
              min={0}
              max={360}
              step={0.5}
              unit="°"
              onChange={(val) => setManualAngle(val)}
            />
          </div>

          {/* Expansion Length */}
          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-1.5">
              {t.manualExpLength}
            </label>
            <NumberStepper
              value={manualExpLen}
              min={0}
              max={200}
              step={1}
              unit="MM"
              onChange={(val) => setManualExpLen(val)}
            />
          </div>

          {/* Deflower time */}
          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-1.5">
              {t.manualDeflowerTime}
            </label>
            <NumberStepper
              value={manualDeflowerSec}
              min={0.05}
              max={5.0}
              step={0.05}
              unit="S"
              onChange={(val) => setManualDeflowerSec(val)}
            />
          </div>

          {/* Rotation speed Hz */}
          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-1.5">
              {t.manualRotSpeed}
            </label>
            <NumberStepper
              value={manualRotHz}
              min={100}
              max={3000}
              step={50}
              unit="Hz"
              onChange={(val) => setManualRotHz(val)}
            />
          </div>

          {/* Expansion speed Hz */}
          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-1.5">
              {t.manualExpSpeed}
            </label>
            <NumberStepper
              value={manualExpHz}
              min={100}
              max={3000}
              step={50}
              unit="Hz"
              onChange={(val) => setManualExpHz(val)}
            />
          </div>
        </div>
      </div>

      {/* Manual Plunge & Jog Diagnostic Tests */}
      <div className="oneui-card p-5 sm:p-6 flex flex-col gap-4">
        <h3 className="text-sm font-bold text-[#0f172a] flex items-center gap-2 border-b border-[#f1f5f9] pb-3">
          <Play className="w-4 h-4 text-[#059669]" />
          <span>{t.manualPlungeTest}</span>
        </h3>

        {/* 3 Head Plunge Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[0, 1, 2].map((idx) => {
            const headNames = [t.manualHead1, t.manualHead2, t.manualHead3];
            const colors = ['#0284c7', '#d97706', '#e11d48'];
            const isFired = activeHeadTest === idx;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => testHeadPlunge(idx)}
                className={`py-3 px-4 rounded-2xl border-2 transition-all font-bold text-xs flex items-center justify-between cursor-pointer select-none active:scale-95 shadow-xs ${
                  isFired
                    ? 'bg-blue-600 text-white border-blue-600 ring-4 ring-blue-200'
                    : 'bg-white hover:bg-[#f8fafc] text-[#0f172a] border-[#e2e8f0]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors[idx] }}
                  />
                  <span>{headNames[idx]}</span>
                </div>
                <span className="text-[11px] font-mono">
                  {isFired ? t.drillingButton : t.testButton}
                </span>
              </button>
            );
          })}
        </div>

        {/* Servo Jog Forward / Backward */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 w-full">
          <button
            type="button"
            onClick={() => testJog('fwd')}
            disabled={isJogging}
            className="w-full py-3 px-4 rounded-2xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-md shadow-[#2563eb]/20 disabled:opacity-50"
          >
            <MoveHorizontal className="w-4 h-4 text-white" />
            <span>{t.manualJogFwd} (+5mm)</span>
          </button>

          <button
            type="button"
            onClick={() => testJog('rev')}
            disabled={isJogging || manualExpLen <= 0}
            className="w-full py-3 px-4 rounded-2xl bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0f172a] border border-[#cbd5e1] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-40 shadow-xs"
          >
            <MoveHorizontal className="w-4 h-4 text-[#475569]" />
            <span>{t.manualJogRev} (-5mm)</span>
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};
