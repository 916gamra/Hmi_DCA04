import React, { useRef, useEffect, useCallback } from 'react';

interface NumberStepperProps {
  id?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onChange: (val: number) => void;
  size?: 'normal' | 'small';
  disabled?: boolean;
}

export const NumberStepper: React.FC<NumberStepperProps> = ({
  id,
  value,
  min = 0,
  max = 10000,
  step = 1,
  unit,
  onChange,
  size = 'normal',
  disabled = false,
}) => {
  // Keep latest refs to prevent any stale closure issues during continuous holding
  const valueRef = useRef(value);
  valueRef.current = value;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const stepRef = useRef(step);
  stepRef.current = step;

  const minRef = useRef(min);
  minRef.current = min;

  const maxRef = useRef(max);
  maxRef.current = max;

  const holdTimerRef = useRef<number | null>(null);
  const repeatTimerRef = useRef<number | null>(null);
  const isHeldRef = useRef(false);

  // Precision decimal helper to avoid floating point issues (e.g. 0.1 + 0.2 = 0.30000000000000004)
  const doStep = useCallback((direction: 1 | -1) => {
    const curVal = valueRef.current;
    const curStep = stepRef.current;
    const curMin = minRef.current;
    const curMax = maxRef.current;

    const nextVal = direction === 1 ? curVal + curStep : curVal - curStep;
    // Calculate precision from step
    const stepStr = curStep.toString();
    const decimals = stepStr.includes('.') ? stepStr.split('.')[1].length : 0;
    const rounded = Number(nextVal.toFixed(Math.max(decimals, 2)));

    const clamped = Math.max(curMin, Math.min(curMax, rounded));
    if (clamped !== curVal) {
      onChangeRef.current(clamped);
    }
  }, []);

  const clearTimers = useCallback(() => {
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (repeatTimerRef.current !== null) {
      window.clearInterval(repeatTimerRef.current);
      repeatTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  const handlePointerDown = (direction: 1 | -1, e: React.PointerEvent) => {
    if (disabled) return;
    // Only handle primary button / finger touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    
    // Prevent default context menus, text selection, and keyboard triggers
    e.preventDefault();

    // 1. Immediate trigger on initial press
    doStep(direction);
    isHeldRef.current = false;

    clearTimers();

    // 2. Start timer for rapid repeat after 320ms hold
    holdTimerRef.current = window.setTimeout(() => {
      isHeldRef.current = true;
      repeatTimerRef.current = window.setInterval(() => {
        doStep(direction);
      }, 85);
    }, 320);
  };

  const handlePointerUpOrLeave = (e: React.PointerEvent) => {
    if (disabled) return;
    e.preventDefault();
    clearTimers();
    isHeldRef.current = false;
  };

  const isSmall = size === 'small';

  // Format displayed number nicely
  const displayVal = Number.isFinite(value)
    ? Number(value.toFixed(2)).toString()
    : '—';

  return (
    <div
      dir="ltr"
      className={`flex items-center ${
        disabled ? 'bg-[#e2e8f0]/60 opacity-60 cursor-not-allowed' : 'bg-[#f1f5f9]'
      } border border-[#d8e0ec] rounded-2xl p-1 transition-all select-none touch-none ${
        isSmall ? 'h-9' : 'h-11'
      }`}
    >
      {/* Minus Button [-] */}
      <button
        type="button"
        onPointerDown={(e) => handlePointerDown(-1, e)}
        onPointerUp={handlePointerUpOrLeave}
        onPointerLeave={handlePointerUpOrLeave}
        onPointerCancel={handlePointerUpOrLeave}
        disabled={disabled || value <= min}
        aria-label="نقصان"
        className={`${
          isSmall ? 'w-8 h-7 text-base' : 'w-10 h-9 text-lg'
        } flex items-center justify-center font-bold text-[#1e293b] bg-white hover:bg-[#2563eb] hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-[#64748b] active:scale-90 rounded-xl shadow-xs transition-all cursor-pointer select-none touch-none`}
      >
        −
      </button>

      {/* Center Digital Readout (Display-only like an HMI LCD meter / Completely unclickable, NO keyboard popup) */}
      <div
        id={id}
        tabIndex={-1}
        className="flex-1 flex items-center justify-center px-1 cursor-default pointer-events-none select-none"
        aria-readonly="true"
      >
        <span className="font-mono font-bold text-[#0f172a] text-sm sm:text-base tracking-tight">
          {displayVal}
        </span>
        {unit && (
          <span className="text-[11px] font-bold text-[#64748b] ml-1 select-none pointer-events-none">
            {unit}
          </span>
        )}
      </div>

      {/* Plus Button [+] */}
      <button
        type="button"
        onPointerDown={(e) => handlePointerDown(1, e)}
        onPointerUp={handlePointerUpOrLeave}
        onPointerLeave={handlePointerUpOrLeave}
        onPointerCancel={handlePointerUpOrLeave}
        disabled={disabled || value >= max}
        aria-label="زيادة"
        className={`${
          isSmall ? 'w-8 h-7 text-base' : 'w-10 h-9 text-lg'
        } flex items-center justify-center font-bold text-[#1e293b] bg-white hover:bg-[#2563eb] hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-[#64748b] active:scale-90 rounded-xl shadow-xs transition-all cursor-pointer select-none touch-none`}
      >
        +
      </button>
    </div>
  );
};
