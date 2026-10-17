import React from 'react';
import { Clock } from 'lucide-react';
import { Translations } from '../../core/i18n';
import { NumberStepper } from '../NumberStepper';
import { SemiCardAccordion } from './SemiCardAccordion';

interface SemiTimingCardProps {
  isOpen: boolean;
  onToggle: () => void;
  t: Translations;
  dwellSec: number;
  rotHz: number;
  expHz: number;
  onSetDwellSec: (val: number) => void;
  onSetRotHz: (val: number) => void;
  onSetExpHz: (val: number) => void;
}

export const SemiTimingCard: React.FC<SemiTimingCardProps> = ({
  isOpen,
  onToggle,
  t,
  dwellSec,
  rotHz,
  expHz,
  onSetDwellSec,
  onSetRotHz,
  onSetExpHz,
}) => {
  return (
    <SemiCardAccordion
      isOpen={isOpen}
      onToggle={onToggle}
      title={t.cardSemiTimingTitle}
      icon={<Clock className="w-4 h-4 text-amber-600" />}
    >
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
          onChange={(val) => onSetDwellSec(Math.max(0, val))}
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
          onChange={(val) => onSetRotHz(Math.max(0.1, val))}
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
          onChange={(val) => onSetExpHz(Math.max(0.1, val))}
        />
      </div>
    </SemiCardAccordion>
  );
};
