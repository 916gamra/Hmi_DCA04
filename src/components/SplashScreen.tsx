import React, { useEffect, useState, useRef } from 'react';
import { renderCanvas } from '../core/render';
import { Language } from '../core/i18n';
import { trayData } from '../core/splashTrayData';

interface SplashScreenProps {
  onEnter?: () => void;
  onFinish?: () => void;
  lang?: Language;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onEnter, onFinish, lang = 'ar' }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;
    let startTime: number | null = null;
    const duration = 20000; // Total cycle duration in ms

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = ((timestamp - startTime) / duration) % 1;
      const theta = progress * 360; // Rotating at defined speed

      // Construct simulation state for renderer
      const state = {
        theta: theta,
        headR: 195, // Radius of head rail
        counts: [6, 6, 6, 6], // Drilled count per layer
        cur: { type: 'fire', layer: 0, j: 0 },
        done: false,
        u: 0
      };

      const model = {
        R: 195,
        toolR: 10,
        layers: trayData.layers.map((l, i) => ({ ...l, i })),
      };

      renderCanvas(
        ctx,
        480,
        480,
        2,
        model as any,
        state as any,
        { sectors: true, heads: true, rings: true, labels: false, dimensions: false, theme: 'light' },
        1,
        0,
        0,
        null,
        'light'
      );
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        if (onEnter) onEnter();
        else if (onFinish) onFinish();
      }, 350);
    }, 3000); // Duration before auto-dismiss

    return () => clearTimeout(timer);
  }, [onEnter, onFinish]);

  return (
    <div
      className={`fixed inset-0 z-100 flex items-center justify-center bg-slate-900/90 backdrop-blur-md transition-opacity duration-300 select-none ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 max-w-sm w-full flex flex-col items-center gap-5 text-center animate-in zoom-in-95 duration-300">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-inner overflow-hidden relative">
          <canvas
            ref={canvasRef}
            width={480}
            height={480}
            className="w-full h-full object-contain"
          />
        </div>

        <div className="flex flex-col gap-1">
          <h1 className="text-base sm:text-lg font-bold text-slate-900">
            TRIVIUM120°
          </h1>
          <p className="text-xs text-slate-500">
            {lang === 'ar' ? 'مصمم صواني الحفر والتشغيل الآلي' : 'HMI Tray Designer & Simulator'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsFadingOut(true);
            setTimeout(() => {
              if (onEnter) onEnter();
              else if (onFinish) onFinish();
            }, 350);
          }}
          className="w-full py-2.5 px-4 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold shadow-md transition-all cursor-pointer active:scale-95"
        >
          {lang === 'ar' ? 'دخول النظام' : 'Entrer dans le système'}
        </button>
      </div>
    </div>
  );
};
