import React from 'react';
import { Sliders } from 'lucide-react';
import { Translations } from '../../core/i18n';
import { SemiCardAccordion } from './SemiCardAccordion';

interface SemiModesCardProps {
  isOpen: boolean;
  onToggle: () => void;
  t: Translations;
  tableZUp: boolean;
  spindleOn: boolean;
  onToggleTableZ: () => void;
  onToggleSpindle: () => void;
}

export const SemiModesCard: React.FC<SemiModesCardProps> = ({
  isOpen,
  onToggle,
  t,
  tableZUp,
  spindleOn,
  onToggleTableZ,
  onToggleSpindle,
}) => {
  return (
    <SemiCardAccordion
      isOpen={isOpen}
      onToggle={onToggle}
      title={t.cardSemiModesTitle}
      icon={<Sliders className="w-4 h-4 text-purple-600" />}
    >
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
            onClick={onToggleTableZ}
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
            onClick={onToggleSpindle}
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
    </SemiCardAccordion>
  );
};
