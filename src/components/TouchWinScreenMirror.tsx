/**
 * TouchWinScreenMirror Component
 * 
 * This component provides a visual interface mirroring the TouchWin OP320 HMI screen.
 * It is used for manual operation and parameter setting, mapping virtual screen buttons
 * and displays to the underlying machine logic.
 */
import React, { useState } from 'react';
import {
  Copy,
  Check,
  Printer,
  QrCode,
  Sliders,
  Monitor,
  Layers,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
} from 'lucide-react';
import { TrayParams, TrayModel } from '../types';
import { extractMachineRows, calculateTouchWinProcessingTime } from '../core/model';
import { Language, Translations, translations } from '../core/i18n';

interface TouchWinScreenMirrorProps {
  model: TrayModel;
  params: TrayParams;
  onChangeParams: (updated: Partial<TrayParams>) => void;
  onApplyPreset: () => void;
  onOpenQr?: () => void;
  lang?: Language;
  t?: Translations;
}

export const TouchWinScreenMirror: React.FC<TouchWinScreenMirrorProps> = ({
  model,
  params,
  onApplyPreset,
  onOpenQr,
  lang = 'ar',
  t: propT,
}) => {
  const t = propT || translations[lang];
  const [viewMode, setViewMode] = useState<'article' | 'lcdSingle' | 'lcdAll'>('article');
  const [currentScreenIdx, setCurrentScreenIdx] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  const machineRows = extractMachineRows(model, params);
  const predictedTouchWinSec = calculateTouchWinProcessingTime(model, params);

  const copyMachineRecipe = () => {
    const lines = [
      '┌──────────────────────────────────────────┐',
      '│  وصفة الآلة — جاهزة للإدخال               │',
      '├──────────────────────────────────────────┤',
      '│  ANGLE PARAMETERS                        │',
      ...machineRows.map(
        (r) =>
          `│  ${r.layer}  rotation angle  ${r.rotationAngle.toFixed(1).padStart(4, ' ')}    add${r.add.toFixed(0).padEnd(2, ' ')}   │`
      ),
      '│                                          │',
      '│  AUTO PARAMETERS                         │',
      `│  rotation speed   : ${String(params.rotationSpeedHz).padEnd(4, ' ')} Hz               │`,
      `│  expansion speed  : ${String(params.expansionSpeedHz).padEnd(4, ' ')} Hz               │`,
      `│  deflower layer   : ${params.layers} L                  │`,
      `│  deflower time    : ${(params.timing.dwell / 1000).toFixed(2)} S               │`,
      `│  expansion length : ${String(params.spacing).padEnd(2, ' ')} MM                │`,
      `│  processing time  : ${predictedTouchWinSec.toFixed(2)} S (متوقع)      │`,
      '└──────────────────────────────────────────┘',
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // The 7 Real Screen Definitions from the user's machine photos
  const realScreens = [
    {
      id: 1,
      title: 'Screen 1 — Angle Parameters (طبقات 1-3)',
      subtitle: 'زوايا دوران الخطوة لكل رأس',
      lines: [
        '  ANGLE PARAMETERS  ',
        `1 rotation angle ${machineRows[0]?.rotationAngle.toFixed(1).padStart(4, ' ')}  add${machineRows[0]?.add.toFixed(0)}`,
        `2 rotation angle ${machineRows[1]?.rotationAngle.toFixed(1).padStart(4, ' ')}  add${machineRows[1]?.add.toFixed(0)}`,
        `3 rotation angle ${machineRows[2]?.rotationAngle.toFixed(1).padStart(4, ' ')}  add${machineRows[2]?.add.toFixed(0)}`,
      ],
    },
    {
      id: 2,
      title: 'Screen 2 — Angle Parameters (طبقات 4-7)',
      subtitle: 'زوايا الدوران للطبقات المتبقية',
      lines: [
        `4 rotation angle ${machineRows[3]?.rotationAngle.toFixed(1).padStart(4, ' ')}  add${machineRows[3]?.add.toFixed(0)}`,
        `5 rotation angle ${machineRows[4]?.rotationAngle.toFixed(1).padStart(4, ' ')}  add${machineRows[4]?.add.toFixed(0)}`,
        `6 rotation angle ${machineRows[5]?.rotationAngle.toFixed(1).padStart(4, ' ')}  add${machineRows[5]?.add.toFixed(0)}`,
        `7 rotation angle ${machineRows[6]?.rotationAngle.toFixed(1).padStart(4, ' ')}  add${machineRows[6]?.add.toFixed(0)}`,
      ],
    },
    {
      id: 3,
      title: 'Screen 3 — Manual Parameters',
      subtitle: 'المعاملات اليدوية للزاوية والتمدد',
      lines: [
        ' manual parameters  ',
        `rotation angle     ${params.add.toFixed(1).padStart(4, ' ')}°`,
        `expansion length : ${String(params.spacing).padEnd(4, ' ')} MM`,
        `deflower time      ${(params.timing.dwell / 1000).toFixed(2)} S`,
      ],
    },
    {
      id: 4,
      title: 'Screen 4 — Manual Speeds',
      subtitle: 'ترددات السرعة في النمط اليدوي',
      lines: [
        ' manual parameters  ',
        `rotation speed  : ${String(params.rotationSpeedHz).padEnd(4, ' ')} Hz`,
        `expansion speed : ${String(params.expansionSpeedHz).padEnd(4, ' ')} Hz`,
        '                    ',
      ],
    },
    {
      id: 5,
      title: 'Screen 5 — Operation Base',
      subtitle: 'شاشة التشغيل وعداد الإنتاج والوضع',
      lines: [
        'operation page      reset',
        'single quantity : 0',
        `production      : ${model.totalPts * 12}`,
        '[manual] [angle/all] [auto]',
      ],
    },
    {
      id: 6,
      title: 'Screen 6 — Auto Speeds & Processing Time',
      subtitle: 'السرعات وزمن الدورة الآلية الفعلي',
      lines: [
        '   auto parameter   ',
        `rotation speed   : ${params.rotationSpeedHz} HZ`,
        `expansion speed  : ${params.expansionSpeedHz} HZ`,
        `processing time  : ${predictedTouchWinSec.toFixed(2)} S`,
      ],
    },
    {
      id: 7,
      title: 'Screen 7 — Auto Layers & Expansion Length',
      subtitle: 'الطبقات الفعالة والتمدد وزمن الحفر',
      lines: [
        '   auto parameter   ',
        `deflower layer : ${params.layers} L`,
        `deflower time  : ${(params.timing.dwell / 1000).toFixed(2)} S`,
        `expansion length : ${params.spacing}MM`,
      ],
    },
  ];

  return (
    <div className="oneui-card overflow-hidden transition-all border border-[#2563eb]/20 shadow-md select-none flex flex-col h-full min-h-0" dir="ltr">
      {/* Top Bar with TouchWin branding (Light Theme) */}
      <div className="flex-none bg-white border-b border-[#e2e8f0] p-2.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 no-print">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#059669] flex items-center justify-center font-mono font-bold text-sm shadow-2xs shrink-0">
            <Monitor className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-base font-bold tracking-tight text-[#0f172a] flex items-center gap-1.5 truncate">
                <span>
                  {t.touchWinHeaderTitle}
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#2563eb] border border-blue-200 shrink-0">
                  7 Screens
                </span>
              </h2>
            </div>
            <p className="text-[10px] sm:text-xs text-[#64748b] truncate">
              {t.touchWinSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={onApplyPreset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[11px] sm:text-xs font-bold text-[#2563eb] transition-all cursor-pointer select-none active:scale-95 shadow-2xs"
            title={t.touchWinApplyTooltip}
          >
            <Sliders className="w-3.5 h-3.5 text-[#2563eb]" />
            <span>{t.touchWinApplyBtn}</span>
          </button>
        </div>
      </div>

      {/* View Mode Bar: 3-column responsive grid on all devices */}
      <div className="flex-none grid grid-cols-3 gap-1 bg-[#f1f5f9] p-1 sm:p-1.5 border-b border-[#e2e8f0] text-xs font-bold no-print">
        <button
          type="button"
          onClick={() => setViewMode('article')}
          className={`py-2 px-1 sm:px-3 rounded-xl transition-all cursor-pointer select-none text-center flex items-center justify-center gap-1 sm:gap-1.5 truncate ${
            viewMode === 'article'
              ? 'bg-[#2563eb] text-white shadow-xs'
              : 'text-[#64748b] hover:text-[#0f172a]'
          }`}
        >
          <Layers className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate text-[11px] sm:text-xs">{t.tabRecipeCard}</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('lcdSingle')}
          className={`py-2 px-1 sm:px-3 rounded-xl transition-all cursor-pointer select-none text-center flex items-center justify-center gap-1 sm:gap-1.5 truncate ${
            viewMode === 'lcdSingle'
              ? 'bg-[#1e293b] text-[#4ade80] shadow-xs'
              : 'text-[#64748b] hover:text-[#0f172a]'
          }`}
        >
          <Monitor className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate text-[11px] sm:text-xs">{t.tabLcdSingle}</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('lcdAll')}
          className={`py-2 px-1 sm:px-3 rounded-xl transition-all cursor-pointer select-none text-center flex items-center justify-center gap-1 sm:gap-1.5 truncate ${
            viewMode === 'lcdAll'
              ? 'bg-[#1e293b] text-[#4ade80] shadow-xs'
              : 'text-[#64748b] hover:text-[#0f172a]'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate text-[11px] sm:text-xs">{t.tabLcdAll}</span>
        </button>
      </div>

      {/* Main Contents Area (Internal Scrollable Area) */}
      <div className="p-2.5 sm:p-5 flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y oneui-scrollbar">
        {/* ============================================================== */}
        {/* VIEW 1: MACHINE RECIPE CARD (ARTICLE)                           */}
        {/* ============================================================== */}
        {viewMode === 'article' && (
          <div className="flex flex-col items-center gap-5">
            {/* The Authentic Machine Recipe Card */}
            <div className="w-full max-w-2xl bg-[#0f172a] text-[#f8fafc] rounded-3xl p-5 sm:p-7 border border-[#334155] shadow-2xl font-mono text-xs sm:text-sm recipe-print-area">
              <div className="border-b border-[#334155] pb-3 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-bold text-[#38bdf8]">
                    {t.machineRecipeTitle}
                  </span>
                </div>
                <span className="text-[11px] text-[#94a3b8] px-2.5 py-1 rounded-full bg-[#1e293b] border border-[#334155]">
                  TouchWin OP320 / TG
                </span>
              </div>

              {/* ANGLE PARAMETERS SECTION */}
              <div className="mb-5">
                <div className="text-[#38bdf8] font-bold mb-2 flex items-center justify-between text-xs tracking-wider">
                  <span>ANGLE PARAMETERS</span>
                  <span className="text-[11px] text-[#94a3b8]">زوايا الخطوة (7 طبقات)</span>
                </div>
                <div className="bg-[#1e293b]/70 border border-[#334155]/60 rounded-2xl p-3 sm:p-4 space-y-1.5">
                  {machineRows.map((r) => (
                    <div
                      key={r.layer}
                      className={`flex justify-between items-center py-1 px-2.5 rounded-lg transition-colors ${
                        r.active
                          ? 'text-[#f8fafc] bg-[#334155]/40'
                          : 'text-[#64748b] opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-[#38bdf8] w-4">{r.layer}</span>
                        <span>rotation angle</span>
                        <strong className="text-[#4ade80] text-sm">
                          {r.rotationAngle.toFixed(1).padStart(4, ' ')}°
                        </strong>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[#94a3b8]">add{r.add.toFixed(0)}</span>
                        {r.active ? (
                          <span className="text-[10px] text-[#38bdf8] bg-[#38bdf8]/10 px-2 py-0.5 rounded">
                            {r.holesCount} ثقب
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#64748b]">معطل (0.0)</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AUTO PARAMETERS SECTION */}
              <div>
                <div className="text-[#38bdf8] font-bold mb-2 flex items-center justify-between text-xs tracking-wider">
                  <span>AUTO PARAMETERS</span>
                  <span className="text-[11px] text-[#94a3b8]">معاملات الدورة الآلية</span>
                </div>
                <div className="bg-[#1e293b]/70 border border-[#334155]/60 rounded-2xl p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="flex justify-between items-center py-1.5 px-2 bg-[#334155]/20 rounded-lg">
                    <span className="text-[#94a3b8]">rotation speed:</span>
                    <strong className="text-[#f8fafc]">{params.rotationSpeedHz} Hz</strong>
                  </div>

                  <div className="flex justify-between items-center py-1.5 px-2 bg-[#334155]/20 rounded-lg">
                    <span className="text-[#94a3b8]">expansion speed:</span>
                    <strong className="text-[#f8fafc]">{params.expansionSpeedHz} Hz</strong>
                  </div>

                  <div className="flex justify-between items-center py-1.5 px-2 bg-[#334155]/20 rounded-lg">
                    <span className="text-[#94a3b8]">deflower layer:</span>
                    <strong className="text-[#38bdf8]">{params.layers} L</strong>
                  </div>

                  <div className="flex justify-between items-center py-1.5 px-2 bg-[#334155]/20 rounded-lg">
                    <span className="text-[#94a3b8]">deflower time:</span>
                    <strong className="text-[#f8fafc]">
                      {(params.timing.dwell / 1000).toFixed(2)} S
                    </strong>
                  </div>

                  <div className="flex justify-between items-center py-1.5 px-2 bg-[#334155]/20 rounded-lg">
                    <span className="text-[#94a3b8]">expansion length:</span>
                    <strong className="text-[#f8fafc]">{params.spacing} MM</strong>
                  </div>

                  <div className="flex justify-between items-center py-1.5 px-2 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-lg text-[#4ade80]">
                    <span className="font-bold">processing time:</span>
                    <strong className="text-sm font-bold">
                      {predictedTouchWinSec.toFixed(2)} S
                    </strong>
                  </div>
                </div>
              </div>

              {/* Extra summary footer */}
              <div className="mt-4 pt-3 border-t border-[#334155]/70 flex flex-wrap justify-between items-center text-[11px] text-[#94a3b8]">
                <span>{t.trayDiameterLabel} {params.trayD} mm</span>
                <span>{t.totalHolesLabel} {model.totalPts} {t.holesUnit}</span>
                <span>{t.toolDiameterLabel} Ø {params.tool} mm</span>
              </div>
            </div>

            {/* Action Buttons: [📋 نسخ] [📱 QR] [🖨 طباعة] */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full max-w-2xl no-print">
              <button
                type="button"
                onClick={copyMachineRecipe}
                className={`w-full flex items-center justify-center gap-1.5 py-2.5 px-2 sm:px-4 rounded-2xl border font-bold text-[11px] sm:text-xs shadow-xs transition-all cursor-pointer active:scale-95 ${
                  copied
                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0f172a] border-[#cbd5e1]'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="text-emerald-800 truncate">{t.recipeCopied}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#475569] shrink-0" />
                    <span className="text-[#0f172a] truncate">{t.btnCopyRecipe}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onOpenQr}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-2 sm:px-4 rounded-2xl bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0f172a] border border-[#cbd5e1] font-bold text-[11px] sm:text-xs shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <QrCode className="w-3.5 h-3.5 text-[#475569] shrink-0" />
                <span className="text-[#0f172a] truncate">{t.qrCodeLabel}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-2 sm:px-4 rounded-2xl bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0f172a] border border-[#cbd5e1] font-bold text-[11px] sm:text-xs shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <Printer className="w-3.5 h-3.5 text-[#475569] shrink-0" />
                <span className="text-[#0f172a] truncate">{t.btnPrintRecipe}</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: INTERACTIVE PHYSICAL GREEN LCD (SINGLE WITH KEYS)       */}
        {/* ============================================================== */}
        {viewMode === 'lcdSingle' && (
          <div className="flex flex-col items-center gap-5">
            {/* Screen Pagination Selector */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-xl w-full">
              {realScreens.map((sc, i) => (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => setCurrentScreenIdx(i)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                    currentScreenIdx === i
                      ? 'bg-[#1e293b] text-[#4ade80] shadow-sm'
                      : 'bg-[#f1f5f9] text-[#64748b] hover:text-[#0f172a]'
                  }`}
                >
                  شاشة {sc.id}
                </button>
              ))}
            </div>

            {/* Physical TouchWin Chassis */}
            <div className="w-full max-w-xl bg-[#2e3e18] p-4 sm:p-6 rounded-3xl border-4 border-[#1f2910] shadow-2xl flex flex-col gap-4">
              {/* Screen Header Badge */}
              <div className="flex items-center justify-between text-[#b4c952] text-xs font-mono font-bold px-1">
                <span>{realScreens[currentScreenIdx].title}</span>
                <span>TouchWin OP320</span>
              </div>

              {/* 4-Line Phosphor Green LCD Matrix Display */}
              <div className="bg-[#b4c952] border-4 border-[#899f2b] p-4 sm:p-5 rounded-2xl shadow-inner font-mono text-[#1a2305] text-xs sm:text-base leading-relaxed tracking-wider select-none min-h-[140px] flex flex-col justify-between">
                {realScreens[currentScreenIdx].lines.map((line, lIdx) => (
                  <div key={lIdx} className="font-bold flex items-center justify-between">
                    <span>{line}</span>
                  </div>
                ))}
              </div>

              {/* Membrane Keypad Simulator */}
              <div className="grid grid-cols-6 gap-2 pt-2 border-t border-[#899f2b]/40 text-[#b4c952] text-xs font-bold text-center select-none font-mono">
                <button
                  type="button"
                  onClick={() => setCurrentScreenIdx(4)} // Operation page
                  className="py-2 px-1 rounded-lg border border-[#b4c952]/40 hover:bg-[#b4c952]/20 active:scale-95 transition-all cursor-pointer"
                >
                  ESC
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentScreenIdx(0)} // Angle page
                  className="py-2 px-1 rounded-lg border border-[#b4c952]/40 hover:bg-[#b4c952]/20 active:scale-95 transition-all cursor-pointer"
                >
                  ALM
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentScreenIdx((prev) => (prev > 0 ? prev - 1 : realScreens.length - 1))
                  }
                  className="py-2 px-1 rounded-lg border border-[#b4c952]/40 hover:bg-[#b4c952]/20 active:scale-95 transition-all cursor-pointer"
                >
                  ▲ UP
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentScreenIdx((prev) => (prev < realScreens.length - 1 ? prev + 1 : 0))
                  }
                  className="py-2 px-1 rounded-lg border border-[#b4c952]/40 hover:bg-[#b4c952]/20 active:scale-95 transition-all cursor-pointer"
                >
                  ▼ DN
                </button>
                <button
                  type="button"
                  className="py-2 px-1 rounded-lg border border-[#b4c952]/40 bg-[#b4c952]/10 hover:bg-[#b4c952]/20 active:scale-95 transition-all cursor-pointer"
                >
                  SET
                </button>
                <button
                  type="button"
                  className="py-2 px-1 rounded-lg border border-[#22c55e]/50 bg-[#22c55e]/30 text-[#4ade80] hover:bg-[#22c55e]/40 active:scale-95 transition-all cursor-pointer"
                >
                  ENT
                </button>
              </div>
            </div>

            {/* Quick Next/Prev Navigation */}
            <div className="flex items-center gap-3 text-xs font-semibold text-[#64748b]">
              <button
                type="button"
                onClick={() =>
                  setCurrentScreenIdx((prev) => (prev > 0 ? prev - 1 : realScreens.length - 1))
                }
                className="flex items-center gap-1 p-2 rounded-xl bg-[#f1f5f9] hover:bg-[#e2e8f0] cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{t.btnPrevScreen}</span>
              </button>

              <span className="font-mono font-bold text-[#0f172a]">
                {currentScreenIdx + 1} / {realScreens.length}
              </span>

              <button
                type="button"
                onClick={() =>
                  setCurrentScreenIdx((prev) => (prev < realScreens.length - 1 ? prev + 1 : 0))
                }
                className="flex items-center gap-1 p-2 rounded-xl bg-[#f1f5f9] hover:bg-[#e2e8f0] cursor-pointer"
              >
                <span>{t.btnNextScreen}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 3: ALL 7 SCREENS SIDE-BY-SIDE GALLERY                      */}
        {/* ============================================================== */}
        {viewMode === 'lcdAll' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {realScreens.map((sc) => (
              <div
                key={sc.id}
                className="bg-[#2e3e18] p-3.5 rounded-2xl border-2 border-[#1f2910] shadow-lg flex flex-col gap-2"
              >
                <div className="flex justify-between items-center text-[#b4c952] text-[11px] font-mono font-bold">
                  <span>{sc.title}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#b4c952]/20">
                    #{sc.id}
                  </span>
                </div>

                <div className="bg-[#b4c952] border-2 border-[#899f2b] p-3 rounded-xl shadow-inner font-mono text-[#1a2305] text-xs leading-relaxed select-none min-h-[96px] flex flex-col justify-between">
                  {sc.lines.map((line, idx) => (
                    <div key={idx} className="font-bold flex justify-between">
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
