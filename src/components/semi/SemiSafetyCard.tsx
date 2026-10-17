import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Translations } from '../../core/i18n';
import { fmt } from '../../core/model';
import { NumberStepper } from '../NumberStepper';
import { SemiCardAccordion } from './SemiCardAccordion';

interface SemiSafetyCardProps {
  isOpen: boolean;
  onToggle: () => void;
  t: Translations;
  isAr: boolean;
  rHeadMinMm: number;
  rMm: number;
  r1: number;
  rLastR: number;
  onChangeRHeadMin: (val: number) => void;
}

export const SemiSafetyCard: React.FC<SemiSafetyCardProps> = ({
  isOpen,
  onToggle,
  t,
  isAr,
  rHeadMinMm,
  rMm,
  r1,
  rLastR,
  onChangeRHeadMin,
}) => {
  return (
    <SemiCardAccordion
      isOpen={isOpen}
      onToggle={onToggle}
      title={t.cardSemiSafetyTitle}
      icon={<ShieldAlert className="w-4 h-4 text-amber-600" />}
    >
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
            onChange={onChangeRHeadMin}
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
    </SemiCardAccordion>
  );
};
