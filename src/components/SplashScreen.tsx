import React, { useEffect, useState, useRef } from 'react';
import { renderCanvas } from '../core/render';
import { Language } from '../core/i18n';
import { trayData } from '../core/splashTrayData';

interface SplashScreenProps {
  onEnter: () => void;
  lang: Language;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onEnter, lang }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isAr = lang === 'ar';

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
        onEnter();
      }, 350);
    }, 3000); // Increased duration slightly

    return () => clearTimeout(timer);
  }, [onEnter]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-white text-[#0f172a] select-none transition-opacity duration-350 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="flex flex-col items-center space-y-4 animate-scale-up">
        {/* Simulator Preview Canvas */}
        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl overflow-hidden shadow-xl shadow-blue-500/20 border border-blue-400/20 bg-white">
          <canvas ref={canvasRef} width={480} height={480} className="w-full h-full" />
        </div>

        {/* App Name */}
        <div className="text-center space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0f172a]">
            TRIVIUM120°
          </h1>
          <p className="text-xs text-[#64748b] font-medium">
            HMI Tray Designer
          </p>
        </div>
      </div>
    </div>
  );
};
