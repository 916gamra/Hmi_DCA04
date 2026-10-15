import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Clock,
  RotateCw,
  Target,
  CircleDot,
  Disc,
  ShieldCheck,
  ShieldAlert,
  Table2,
  LayoutGrid,
} from 'lucide-react';
import { TrayModel, TrayParams } from '../types';
import { fmtTime } from '../core/timeline';
import { fmt } from '../core/model';
import { LAYER_COLORS } from '../core/constants';
import { Translations, Language, translations } from '../core/i18n';

interface ValidationCardProps {
  model: TrayModel;
  params: TrayParams;
  totalCycleTimeMs: number;
  t?: Translations;
  lang?: Language;
}

export const ValidationCard: React.FC<ValidationCardProps> = ({
  model,
  params,
  totalCycleTimeMs,
  t: propT,
  lang = 'ar',
}) => {
  const t = propT || translations[lang];
  const isClearanceSafe = model.minD >= params.tool - 1e-6;

  // Default to 'table' so mobile and desktop show the compact, concentrated spreadsheet view
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  return (
    <div className="oneui-card p-2.5 sm:p-4 flex flex-col gap-2.5 sm:gap-3 select-none" dir="ltr">
      {/* 1. Header (Compact & Concentrated) */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#059669] shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-[#0f172a] leading-tight truncate">
              {t.kpisTitle}
            </h2>
            <p className="text-[9px] sm:text-[10px] text-[#64748b] leading-tight truncate">
              {t.validationSubtitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[#0f172a] text-[10px] sm:text-[11px] font-mono tabular-nums font-bold border border-slate-200">
            {model.totalPts} {t.holesUnit}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] sm:text-[11px] font-mono tabular-nums font-bold border border-blue-200">
            {model.layers.length} {t.layersUnit}
          </span>
        </div>
      </div>

      {/* 2. KPIs Compact Grid: 3 cols on mobile (2 rows total), 6 cols on desktop with tabular-nums & clamp */}
      <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 sm:gap-2">
        {/* KPI 1: D1 */}
        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-2 sm:p-2.5 flex flex-col justify-between text-left transition-colors min-w-0">
          <div className="flex items-center justify-between text-[#64748b] text-[9px] sm:text-[10px] font-semibold mb-0.5">
            <span className="truncate overflow-hidden text-ellipsis">{t.d1Label}</span>
            <CircleDot className="w-3 h-3 text-slate-400 shrink-0 ml-1" />
          </div>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-mono tabular-nums font-bold text-[#0f172a] leading-tight truncate">
              {fmt(model.d1)} <span className="text-[9px] sm:text-[10px] font-normal text-slate-500 font-sans">mm</span>
            </div>
            <div className="text-[8.5px] sm:text-[9px] text-[#64748b] font-mono tabular-nums truncate">
              R₁ = {fmt(model.r1)}
            </div>
          </div>
        </div>

        {/* KPI 2: D_Last */}
        <div
          className={`border rounded-xl p-2 sm:p-2.5 flex flex-col justify-between text-left transition-colors min-w-0 ${
            model.rLast < model.toolR
              ? 'bg-red-50/70 border-red-200'
              : 'bg-[#f8fafc] border-[#e2e8f0]'
          }`}
        >
          <div className="flex items-center justify-between text-[#64748b] text-[9px] sm:text-[10px] font-semibold mb-0.5">
            <span className="truncate overflow-hidden text-ellipsis">{t.dLastLabel}</span>
            <Disc className={`w-3 h-3 shrink-0 ml-1 ${model.rLast < model.toolR ? 'text-red-500' : 'text-slate-400'}`} />
          </div>
          <div className="min-w-0">
            <div
              className={`text-xs sm:text-sm font-mono tabular-nums font-bold leading-tight truncate ${
                model.rLast < model.toolR ? 'text-red-600' : 'text-[#0f172a]'
              }`}
            >
              {fmt(model.dLast)} <span className="text-[9px] sm:text-[10px] font-normal text-slate-500 font-sans">mm</span>
            </div>
            <div className="text-[8.5px] sm:text-[9px] text-[#64748b] font-mono tabular-nums truncate">
              R_fin = {fmt(model.rLast)}
            </div>
          </div>
        </div>

        {/* KPI 3: Total Points / Drilled Points */}
        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-2 sm:p-2.5 flex flex-col justify-between text-left transition-colors min-w-0">
          <div className="flex items-center justify-between text-[#64748b] text-[9px] sm:text-[10px] font-semibold mb-0.5">
            <span className="truncate overflow-hidden text-ellipsis">
              {params.repteurEnabled
                ? t.holesActualRepteur
                : t.totalHoles}
            </span>
            <Target className="w-3 h-3 text-blue-500 shrink-0 ml-1" />
          </div>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-mono tabular-nums font-bold text-[#2563eb] leading-tight truncate">
              {params.repteurEnabled ? (
                <>
                  {model.totalDrilled}{' '}
                  <span className="text-[9px] sm:text-[10px] font-normal text-slate-500 font-sans">
                    / {model.totalPts}
                  </span>
                </>
              ) : (
                model.totalPts
              )}
            </div>
            <div className="text-[8.5px] sm:text-[9px] text-[#64748b] font-mono tabular-nums truncate">
              {params.repteurEnabled
                ? `${(model.totalDrilled / 3).toFixed(1)} ${t.holesPerHeadUnit}`
                : `${(model.totalPts / 3).toFixed(1)} / ${t.holesPerHeadUnit}`}
            </div>
          </div>
        </div>

        {/* KPI 4: Total Steps */}
        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-2 sm:p-2.5 flex flex-col justify-between text-left transition-colors min-w-0">
          <div className="flex items-center justify-between text-[#64748b] text-[9px] sm:text-[10px] font-semibold mb-0.5">
            <span className="truncate overflow-hidden text-ellipsis">{t.totalSteps}</span>
            <RotateCw className="w-3 h-3 text-purple-500 shrink-0 ml-1" />
          </div>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-mono tabular-nums font-bold text-[#0f172a] leading-tight truncate">
              {model.totalSteps} <span className="text-[9px] sm:text-[10px] font-normal text-slate-500 font-sans">{t.stepsUnit}</span>
            </div>
            <div className="text-[8.5px] sm:text-[9px] text-[#64748b] font-mono tabular-nums truncate">
              {model.layers.length} {t.stagesUnit}
            </div>
          </div>
        </div>

        {/* KPI 5: Cycle Time */}
        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-2 sm:p-2.5 flex flex-col justify-between text-left transition-colors min-w-0">
          <div className="flex items-center justify-between text-[#64748b] text-[9px] sm:text-[10px] font-semibold mb-0.5">
            <span className="truncate overflow-hidden text-ellipsis">{t.cycleTime}</span>
            <Clock className="w-3 h-3 text-[#059669] shrink-0 ml-1" />
          </div>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-mono tabular-nums font-bold text-[#059669] leading-tight truncate">
              {fmtTime(totalCycleTimeMs)}
            </div>
            <div className="text-[8.5px] sm:text-[9px] text-[#64748b] font-mono tabular-nums truncate">
              {(totalCycleTimeMs / 1000).toFixed(1)}s
            </div>
          </div>
        </div>

        {/* KPI 6: Minimum Clearance Distance */}
        <div
          className={`border rounded-xl p-2 sm:p-2.5 flex flex-col justify-between text-left transition-colors min-w-0 ${
            isClearanceSafe
              ? 'bg-emerald-50/70 border-emerald-200'
              : 'bg-red-50/70 border-red-200'
          }`}
        >
          <div className="flex items-center justify-between text-[#64748b] text-[9px] sm:text-[10px] font-semibold mb-0.5">
            <span className="truncate overflow-hidden text-ellipsis">{t.minClearance}</span>
            {isClearanceSafe ? (
              <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0 ml-1" />
            ) : (
              <ShieldAlert className="w-3 h-3 text-red-600 shrink-0 ml-1" />
            )}
          </div>
          <div className="min-w-0">
            <div
              className={`text-xs sm:text-sm font-mono tabular-nums font-bold leading-tight truncate ${
                isClearanceSafe ? 'text-[#059669]' : 'text-red-600'
              }`}
            >
              {fmt(model.minD, 2)} <span className="text-[9px] sm:text-[10px] font-normal text-slate-500 font-sans">mm</span>
            </div>
            <div className="text-[8.5px] sm:text-[9px] text-[#64748b] font-mono tabular-nums truncate">
              {isClearanceSafe ? `≥ Ø${params.tool} safe` : `< Ø${params.tool} coll`}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Warnings Banner (Compact & Clamped) */}
      <div className="flex flex-col gap-1.5 text-left">
        {model.warns.length > 0 ? (
          model.warns.map((w, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-[10px] sm:text-[11px] font-semibold leading-snug border ${
                w.lv === 'err'
                  ? 'bg-red-50/90 border-red-200 text-red-700'
                  : 'bg-amber-50/90 border-amber-200 text-amber-800'
              }`}
            >
              {w.lv === 'err' ? (
                <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              )}
              <span className="truncate overflow-hidden text-ellipsis">{w.tx}</span>
            </div>
          ))
        ) : (
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-800 text-[10px] sm:text-[11px] font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] shrink-0" />
            <span className="truncate overflow-hidden text-ellipsis">
              {t.validationAllGood}
            </span>
          </div>
        )}
      </div>

      {/* 4. Table Header & View Switcher */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-[#2563eb]" />
          <h3 className="text-xs sm:text-sm font-bold text-[#0f172a]">
            {t.layersBreakdown}
          </h3>
          <span className="text-[10px] font-mono tabular-nums text-[#64748b] bg-slate-100 px-1.5 py-0.5 rounded">
            {model.layers.length} {t.layersUnit}
          </span>
        </div>

        {/* View switcher: Table is default */}
        <div className="inline-flex items-center p-0.5 bg-slate-100 border border-slate-200/80 rounded-lg">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold transition-all ${
              viewMode === 'table'
                ? 'bg-white text-[#0f172a] shadow-2xs border border-slate-200/60 font-bold'
                : 'text-[#64748b] hover:text-[#0f172a]'
            }`}
            title={t.viewModeTable}
          >
            <Table2 className="w-3 h-3" />
            <span>{t.viewModeTable}</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold transition-all ${
              viewMode === 'cards'
                ? 'bg-white text-[#0f172a] shadow-2xs border border-slate-200/60 font-bold'
                : 'text-[#64748b] hover:text-[#0f172a]'
            }`}
            title={t.viewModeCards}
          >
            <LayoutGrid className="w-3 h-3" />
            <span>{t.viewModeCards}</span>
          </button>
        </div>
      </div>

      {/* 5. Condensed Industrial Table with STICKY HEADER, TABULAR-NUMS & FLEXIBLE COLUMNS */}
      {viewMode === 'table' ? (
        <div className="overflow-x-auto overflow-y-auto max-h-[300px] sm:max-h-[360px] rounded-xl border border-[#e2e8f0] bg-white shadow-2xs scrollbar-thin overscroll-contain">
          <table className="w-full text-[10px] sm:text-xs text-left border-collapse whitespace-nowrap table-fixed min-w-[620px] sm:min-w-full">
            <thead className="sticky top-0 z-20 bg-[#f8fafc] shadow-[0_1px_0_0_#e2e8f0]">
              <tr className="bg-[#f8fafc] text-[#64748b] select-none">
                {/* 1. Sticky Layer column (sticky top-0 AND sticky left-0 with highest z-30) */}
                <th
                  className="py-2 px-2.5 font-bold text-left sticky top-0 left-0 bg-[#f8fafc] z-30 shadow-[1px_1px_0_0_#e2e8f0] w-[14%] min-w-[72px]"
                  title={t.tableLayer}
                >
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap">{t.tableLayer}</div>
                </th>
                {/* 2. Diameter */}
                <th
                  className="py-2 px-1.5 font-bold text-center sticky top-0 bg-[#f8fafc] z-20 shadow-[0_1px_0_0_#e2e8f0] w-[11%] min-w-[62px]"
                  title={t.tableDiam}
                >
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap">{t.tableDiam}</div>
                </th>
                {/* 3. Radius */}
                <th
                  className="py-2 px-1.5 font-bold text-center sticky top-0 bg-[#f8fafc] z-20 shadow-[0_1px_0_0_#e2e8f0] w-[10%] min-w-[60px]"
                  title={t.tableRadius}
                >
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap">{t.tableRadius}</div>
                </th>
                {/* 4. Points / Holes */}
                <th
                  className="py-2 px-1.5 font-bold text-center sticky top-0 bg-[#f8fafc] z-20 shadow-[0_1px_0_0_#e2e8f0] w-[8%] min-w-[46px]"
                  title={t.tablePoints}
                >
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap">{t.tablePoints}</div>
                </th>
                {/* 5. Speed / Cadence */}
                <th
                  className="py-2 px-1.5 font-bold text-center sticky top-0 bg-[#f8fafc] z-20 shadow-[0_1px_0_0_#e2e8f0] w-[11%] min-w-[66px]"
                  title={t.tableSpeed}
                >
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap">{t.tableSpeed}</div>
                </th>
                {/* 6. Step angle */}
                <th
                  className="py-2 px-1.5 font-bold text-center sticky top-0 bg-[#f8fafc] z-20 shadow-[0_1px_0_0_#e2e8f0] w-[10%] min-w-[56px]"
                  title={t.tableStep}
                >
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap">{t.tableStep}</div>
                </th>
                {/* 7. Points per head */}
                <th
                  className="py-2 px-1.5 font-bold text-center sticky top-0 bg-[#f8fafc] z-20 shadow-[0_1px_0_0_#e2e8f0] w-[8%] min-w-[46px]"
                  title={t.tablePerHead}
                >
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap">{t.tablePerHead}</div>
                </th>
                {/* 8. Offset */}
                <th
                  className="py-2 px-1.5 font-bold text-center sticky top-0 bg-[#f8fafc] z-20 shadow-[0_1px_0_0_#e2e8f0] w-[9%] min-w-[52px]"
                  title={t.tableOffset}
                >
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap">{t.tableOffset}</div>
                </th>
                {/* 9. Min Distance */}
                <th
                  className="py-2 px-1.5 font-bold text-center sticky top-0 bg-[#f8fafc] z-20 shadow-[0_1px_0_0_#e2e8f0] w-[10%] min-w-[60px]"
                  title={t.tableMinDist}
                >
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap">{t.tableMinDist}</div>
                </th>
                {/* 10. Status */}
                <th
                  className="py-2 px-1.5 font-bold text-center sticky top-0 bg-[#f8fafc] z-20 shadow-[0_1px_0_0_#e2e8f0] w-[9%] min-w-[60px]"
                  title={t.tableStatus}
                >
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap">{t.tableStatus}</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {model.layers.map((l) => {
                const color = LAYER_COLORS[l.i % LAYER_COLORS.length];
                const isLayerSafe = l.bad === 0 && l.r > 0;
                const diameter = l.r * 2;

                // Industrial cadence and layer execution time calculation
                const dwellMs = params.timing?.dwell || 100;
                const indexMs = params.timing?.index || 120;
                const layerRepositionMs = params.timing?.layer || 400;
                const speedFactor = params.speed > 0 ? params.speed : 1;
                const layerDurationSec =
                  (layerRepositionMs + l.per * dwellMs + Math.max(0, l.per - 1) * indexMs) /
                  1000 /
                  speedFactor;
                const cadencePtsPerMin =
                  layerDurationSec > 0 ? Math.round((l.n / layerDurationSec) * 60) : 0;

                return (
                  <tr key={l.i} className="group hover:bg-[#f8fafc]/90 transition-colors">
                    {/* Sticky left cell for Layer identifier */}
                    <td className="py-1.5 px-2.5 font-bold text-left sticky left-0 bg-white group-hover:bg-[#f8fafc] z-10 shadow-[1px_0_0_0_#e2e8f0] w-[14%]">
                      <div className="flex items-center gap-1.5 overflow-hidden text-ellipsis">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-2xs"
                          style={{ backgroundColor: color }}
                        />
                        <span className="font-mono tabular-nums text-[#0f172a]">L{l.i + 1}</span>
                      </div>
                    </td>

                    {/* Diameter */}
                    <td className="py-1.5 px-1.5 text-center font-mono tabular-nums font-bold text-[#0f172a] w-[11%]">
                      <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                        {fmt(diameter, 1)} <span className="text-[9px] font-normal text-slate-500 font-sans">mm</span>
                      </div>
                    </td>

                    {/* Radius */}
                    <td className="py-1.5 px-1.5 text-center font-mono tabular-nums text-[#64748b] w-[10%]">
                      <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                        {fmt(l.r, 1)} <span className="text-[9px] font-normal text-slate-400 font-sans">mm</span>
                      </div>
                    </td>

                    {/* Points */}
                    <td className="py-1.5 px-1.5 text-center font-mono tabular-nums font-bold text-[#2563eb] w-[8%]">
                      <div className="overflow-hidden text-ellipsis whitespace-nowrap">{l.n}</div>
                    </td>

                    {/* Speed / Cadence */}
                    <td className="py-1.5 px-1.5 text-center font-mono tabular-nums text-[#0f172a] w-[11%]">
                      <div className="overflow-hidden text-ellipsis whitespace-nowrap font-bold text-slate-700">
                        {cadencePtsPerMin}
                        <span className="text-[9px] font-normal text-slate-400 ml-0.5 font-sans">
                          {t.ptsPerMinUnit}
                        </span>
                      </div>
                    </td>

                    {/* Step Angle */}
                    <td className="py-1.5 px-1.5 text-center font-mono tabular-nums text-[#64748b] w-[10%]">
                      <div className="overflow-hidden text-ellipsis whitespace-nowrap">{fmt(l.step, 2)}°</div>
                    </td>

                    {/* Per Head */}
                    <td className="py-1.5 px-1.5 text-center font-mono tabular-nums text-[#0f172a] w-[8%]">
                      <div className="overflow-hidden text-ellipsis whitespace-nowrap">{l.per}</div>
                    </td>

                    {/* Offset */}
                    <td className="py-1.5 px-1.5 text-center font-mono tabular-nums text-[#64748b] w-[9%]">
                      <div className="overflow-hidden text-ellipsis whitespace-nowrap">{fmt(l.off, 1)}°</div>
                    </td>

                    {/* Min Distance */}
                    <td className="py-1.5 px-1.5 text-center font-mono tabular-nums text-[#0f172a] w-[10%]">
                      <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                        {isFinite(l.minD) ? fmt(l.minD, 2) : '—'}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-1.5 px-1.5 text-center w-[9%]">
                      <div className="flex items-center justify-center overflow-hidden text-ellipsis">
                        {isLayerSafe ? (
                          <span className="inline-flex items-center gap-0.5 text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[9px] sm:text-[10px]">
                            <CheckCircle2 className="w-2.5 h-2.5 text-[#059669] shrink-0" />
                            <span className="truncate">{t.statusOk}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-red-700 font-bold bg-red-50 px-1.5 py-0.5 rounded border border-red-200 text-[9px] sm:text-[10px]">
                            <AlertCircle className="w-2.5 h-2.5 text-red-600 shrink-0" />
                            <span className="truncate">{t.statusOverlap}</span>
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Alternative compact cards view with tabular-nums */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {model.layers.map((l) => {
            const color = LAYER_COLORS[l.i % LAYER_COLORS.length];
            const isLayerSafe = l.bad === 0 && l.r > 0;
            const diameter = l.r * 2;

            const dwellMs = params.timing?.dwell || 100;
            const indexMs = params.timing?.index || 120;
            const layerRepositionMs = params.timing?.layer || 400;
            const speedFactor = params.speed > 0 ? params.speed : 1;
            const layerDurationSec =
              (layerRepositionMs + l.per * dwellMs + Math.max(0, l.per - 1) * indexMs) /
              1000 /
              speedFactor;
            const cadencePtsPerMin =
              layerDurationSec > 0 ? Math.round((l.n / layerDurationSec) * 60) : 0;

            return (
              <div
                key={l.i}
                className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-2.5 flex flex-col gap-2 text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-2xs"
                      style={{ backgroundColor: color }}
                    />
                    <strong className="text-xs font-mono tabular-nums font-bold text-[#0f172a]">
                      L{l.i + 1}
                    </strong>
                    <span className="text-[10px] sm:text-[11px] font-mono tabular-nums font-bold text-[#2563eb] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 truncate">
                      Ø {fmt(diameter, 1)} mm
                    </span>
                  </div>

                  {isLayerSafe ? (
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[10px] shrink-0">
                      {t.statusOk}
                    </span>
                  ) : (
                    <span className="text-red-700 font-bold bg-red-50 px-1.5 py-0.5 rounded border border-red-200 text-[10px] shrink-0">
                      {t.statusOverlap}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-1.5 bg-white rounded-lg p-2 border border-[#e2e8f0]/80 text-[10px]">
                  <div className="min-w-0">
                    <span className="text-[#64748b] block truncate">{t.tableRadius}</span>
                    <strong className="font-mono tabular-nums text-[#0f172a] block truncate">{fmt(l.r, 1)} mm</strong>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[#64748b] block truncate">{t.tablePoints}</span>
                    <strong className="font-mono tabular-nums text-[#2563eb] block truncate">{l.n}</strong>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[#64748b] block truncate">{t.tableSpeed}</span>
                    <strong className="font-mono tabular-nums text-[#0f172a] block truncate">
                      {cadencePtsPerMin} {t.ptsPerMinUnit}
                    </strong>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[#64748b] block truncate">{t.tableStep}</span>
                    <strong className="font-mono tabular-nums text-[#0f172a] block truncate">{fmt(l.step, 2)}°</strong>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[#64748b] block truncate">{t.tablePerHead}</span>
                    <strong className="font-mono tabular-nums text-[#0f172a] block truncate">{l.per}</strong>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[#64748b] block truncate">{t.tableOffset}</span>
                    <strong className="font-mono tabular-nums text-[#64748b] block truncate">{fmt(l.off, 1)}°</strong>
                  </div>
                  <div className="col-span-3 min-w-0 pt-1 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[#64748b] truncate">{t.tableMinDist}:</span>
                    <strong className={`font-mono tabular-nums ${isLayerSafe ? 'text-[#059669]' : 'text-red-600'} truncate`}>
                      {isFinite(l.minD) ? `${fmt(l.minD, 2)} mm` : '—'}
                    </strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
