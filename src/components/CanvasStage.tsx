import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Sun, Moon, Ruler, SlidersHorizontal, BarChart3, Crosshair, CircleDot, Hash, PieChart, Calculator } from 'lucide-react';
import { TrayModel, SimulationState, ViewOptions, Point, CanvasTheme } from '../types';
import { renderCanvas, computeViewport } from '../core/render';
import { HEADS, LAYER_COLORS, DEG } from '../core/constants';
import { fmt, clamp } from '../core/model';
import { Translations, Language, translations } from '../core/i18n';

interface CanvasStageProps {
  model: TrayModel;
  state: SimulationState | null;
  options: ViewOptions;
  onChangeOptions: (opts: ViewOptions) => void;
  t?: Translations;
  lang?: Language;
  onToggleDrawer?: () => void;
  isDrawerOpen?: boolean;
  onOpenMathModal?: () => void;
}

export const CanvasStage: React.FC<CanvasStageProps> = ({
  model,
  state,
  options,
  onChangeOptions,
  t: propT,
  lang = 'ar',
  onToggleDrawer,
  isDrawerOpen = false,
  onOpenMathModal,
}) => {
  const t = propT || translations[lang];
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hoverPoint, setHoverPoint] = useState<Point | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // References for drag & pinch state
  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    startPanX: number;
    startPanY: number;
    moved: boolean;
  }>({
    active: false,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
    moved: false,
  });

  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchRef = useRef<{ dist: number; startZoom: number } | null>(null);

  // Redraw Canvas
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !model) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);

    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }

    const activeTheme: CanvasTheme = options.theme || 'dark';

    renderCanvas(
      ctx,
      w,
      h,
      dpr,
      model,
      state,
      options,
      zoom,
      pan.x,
      pan.y,
      hoverPoint,
      activeTheme
    );
  }, [model, state, options, zoom, pan, hoverPoint]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  // Window resize observer AND visualViewport listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => {
      redraw();
    });
    ro.observe(container);

    // Add visualViewport listener
    const handleViewportResize = () => redraw();
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportResize);
    }

    return () => {
      ro.disconnect();
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportResize);
      }
    };
  }, [redraw]);

  // Zoom controls
  const handleZoom = (factor: number) => {
    setZoom((prev) => clamp(prev * factor, 0.4, 60));
  };

  const handleResetFit = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setHoverPoint(null);
    setTooltipPos(null);
  };

  // Hit testing for hover / tap tooltip
  const hitTest = (clientX: number, clientY: number): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas || !model) return null;

    const rect = canvas.getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top;
    const w = rect.width;
    const h = rect.height;

    const { sc, cx, cy } = computeViewport(w, h, model.R, zoom, pan.x, pan.y);
    const theta = (state ? state.theta : 0) * DEG;
    const dx = (mx - cx) / sc;
    const dy = (my - cy) / sc;

    // Counter rotate by -theta
    const c = Math.cos(-theta);
    const s = Math.sin(-theta);
    const tx = dx * c - dy * s;
    const ty = dx * s + dy * c;

    let bestPoint: Point | null = null;
    let minDistance = Math.max(model.toolR, 10 / sc);

    for (const p of model.all) {
      const dist = Math.hypot(p.x - tx, p.y - ty);
      if (dist < minDistance) {
        minDistance = dist;
        bestPoint = p;
      }
    }

    return bestPoint;
  };

  // Pointer event handlers for touch & mouse
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 1) {
      dragRef.current = {
        active: true,
        startX: e.clientX,
        startY: e.clientY,
        startPanX: pan.x,
        startPanY: pan.y,
        moved: false,
      };
    } else if (pointersRef.current.size === 2) {
      const pts = Array.from(pointersRef.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchRef.current = { dist, startZoom: zoom };
      dragRef.current.active = false;
      setTooltipPos(null);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Handle 2-finger pinch zoom
    if (pointersRef.current.size === 2 && pinchRef.current) {
      const pts = Array.from(pointersRef.current.values());
      const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (pinchRef.current.dist > 0) {
        const factor = currentDist / pinchRef.current.dist;
        setZoom(clamp(pinchRef.current.startZoom * factor, 0.4, 60));
      }
      return;
    }

    // Handle 1-finger drag / pan
    if (dragRef.current.active && pointersRef.current.size === 1) {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;

      if (!dragRef.current.moved && Math.hypot(dx, dy) > 4) {
        dragRef.current.moved = true;
        setIsDragging(true);
        setTooltipPos(null);
      }

      if (dragRef.current.moved) {
        setPan({
          x: dragRef.current.startPanX + dx,
          y: dragRef.current.startPanY + dy,
        });
        return;
      }
    }

    // Handle mouse hover (when no button is pressed)
    if (e.pointerType === 'mouse' && !dragRef.current.active) {
      const target = hitTest(e.clientX, e.clientY);
      setHoverPoint(target);

      if (target && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setTooltipPos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      } else {
        setTooltipPos(null);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    pointersRef.current.delete(e.pointerId);

    if (pointersRef.current.size < 2) {
      pinchRef.current = null;
    }

    if (dragRef.current.active) {
      // If it was a quick tap without drag on touch screen
      if (!dragRef.current.moved) {
        const target = hitTest(e.clientX, e.clientY);
        setHoverPoint(target);
        if (target && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          setTooltipPos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          });
        } else {
          setTooltipPos(null);
        }
      }
      dragRef.current.active = false;
      setIsDragging(false);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = Math.exp(-e.deltaY * 0.0015);
    setZoom((prev) => clamp(prev * factor, 0.4, 60));
  };

  return (
    <div className="oneui-card p-2.5 sm:p-3.5 md:p-5 flex flex-col gap-2 sm:gap-3">
      {/* 1. Stage Top Header: Zoom & Theme on the left, Adjust & Title on the right */}
      <div className="flex items-center justify-between gap-2">
        {/* Left side: Zoom & Theme Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-0.5 bg-[#f1f5f9] p-0.5 rounded-xl border border-[#cbd5e1]/60">
            <button
              type="button"
              onClick={() => handleZoom(0.8)}
              className="w-7.5 h-7.5 rounded-lg bg-white hover:bg-[#e2e8f0] flex items-center justify-center text-[#475569] shadow-xs transition-all cursor-pointer"
              title={lang === 'ar' ? 'تصغير' : 'Zoom arrière'}
              aria-label="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleResetFit}
              className="w-7.5 h-7.5 rounded-lg bg-white hover:bg-[#e2e8f0] flex items-center justify-center text-[#475569] shadow-xs transition-all cursor-pointer"
              title={lang === 'ar' ? 'ملاءمة للشاشة (100%)' : "Ajuster à l'écran (100%)"}
              aria-label="Fit to Screen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => handleZoom(1.25)}
              className="w-7.5 h-7.5 rounded-lg bg-white hover:bg-[#e2e8f0] flex items-center justify-center text-[#475569] shadow-xs transition-all cursor-pointer"
              title={lang === 'ar' ? 'تكبير' : 'Zoom avant'}
              aria-label="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Canvas Theme Toggle (Unified Capsule) */}
          <button
            type="button"
            onClick={() => {
              const nextTheme: CanvasTheme = (options.theme || 'dark') === 'dark' ? 'light' : 'dark';
              try {
                localStorage.setItem('hmi-tray-canvas-theme', nextTheme);
              } catch {
                // ignore storage errors
              }
              onChangeOptions({ ...options, theme: nextTheme });
            }}
            className="p-2 rounded-2xl bg-[#f1f5f9] hover:bg-[#e2e8f0] border border-[#cbd5e1]/60 text-[#475569] transition-all cursor-pointer select-none active:scale-95 shadow-2xs flex items-center justify-center"
            title={
              (options.theme || 'dark') === 'dark'
                ? `${t.themeDark} → ${t.themeLight}`
                : `${t.themeLight} → ${t.themeDark}`
            }
            aria-label="Toggle Dark/Light Theme"
          >
            {(options.theme || 'dark') === 'dark' ? (
              <Moon className="w-4 h-4 text-sky-500 hover:text-sky-400 transition-colors" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500 hover:text-amber-600 transition-colors" />
            )}
          </button>

          {/* Math Logic Modal Trigger Button (Unified Capsule matching QR button style) */}
          {onOpenMathModal && (
            <button
              type="button"
              onClick={onOpenMathModal}
              className="p-2 rounded-2xl bg-[#f1f5f9] hover:bg-[#e2e8f0] border border-[#cbd5e1]/60 text-[#2563eb] transition-all cursor-pointer select-none active:scale-95 shadow-2xs flex items-center justify-center"
              title={lang === 'ar' ? 'توثيق المنطق الرياضي وحسابات التباعد' : 'Documentation logique mathématique'}
              aria-label={lang === 'ar' ? 'توثيق المنطق الرياضي' : 'Documentation mathématique'}
            >
              <Calculator className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Right side: Title & Adjust Button */}
        <div className="flex items-center gap-2 min-w-0 justify-end">
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-[#334155] select-none truncate">
            <span className="w-2 h-2 rounded-full bg-[#2563eb] inline-block animate-pulse shrink-0" />
            <span className="truncate">{lang === 'ar' ? 'المعاينة الهندسية 2D' : 'Aperçu Géométrique 2D'}</span>
          </div>

          {/* Mobile Parameters Drawer Switcher Button (visible on mobile only) */}
          {onToggleDrawer && (
            <button
              type="button"
              onClick={onToggleDrawer}
              className={`lg:hidden h-8.5 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer select-none shadow-xs active:scale-95 shrink-0 ${
                isDrawerOpen
                  ? 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-700 shadow-emerald-600/25'
                  : 'bg-[#2563eb] border-[#1d4ed8] text-white hover:bg-[#1d4ed8] shadow-[#2563eb]/25'
              }`}
              title={
                isDrawerOpen
                  ? (lang === 'ar' ? 'عرض النتائج والمحاكاة' : 'Voir Résultats & Simulation')
                  : (lang === 'ar' ? 'ضبط معاملات الصينية' : 'Régler les paramètres')
              }
            >
              {isDrawerOpen ? (
                <>
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'نتائج' : 'Résultats'}</span>
                </>
              ) : (
                <>
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'ضبط' : 'Régler'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 2. Interactive Canvas Container */}
      <div
        ref={containerRef}
        className={`relative w-full aspect-square max-h-[min(88vw,35dvh)] sm:max-h-[44dvh] md:max-h-[68vh] mx-auto rounded-2xl sm:rounded-3xl overflow-hidden border shadow-inner touch-none select-none transition-colors ${
          (options.theme || 'dark') === 'dark'
            ? 'border-[#1e293b] bg-[#0b1220]'
            : 'border-[#d8e0ec] bg-[#f8fafc]'
        }`}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
          className={`w-full h-full block ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          role="img"
          aria-label="محاكاة صينية الشاي الصناعية"
        />

        {/* Hover / Tap Tooltip */}
        {hoverPoint && tooltipPos && (
          <div
            style={{
              left: Math.min(Math.max(tooltipPos.x + 14, 8), (containerRef.current?.offsetWidth || 300) - 180),
              top: Math.min(Math.max(tooltipPos.y + 14, 8), (containerRef.current?.offsetHeight || 300) - 120),
            }}
            className="absolute pointer-events-none z-20 bg-white/95 backdrop-blur-md border border-[#2563eb]/40 rounded-2xl px-3.5 py-2.5 shadow-lg text-xs leading-relaxed text-[#1e293b] text-left"
            dir="ltr"
          >
            <div className="font-bold flex items-center justify-between gap-3 text-[#2563eb] border-b border-[#f1f5f9] pb-1 mb-1">
              <span>{lang === 'ar' ? `الطبقة L${hoverPoint.layer + 1}` : `Couche L${hoverPoint.layer + 1}`}</span>
              <span className="font-mono text-[11px] text-[#475569]">
                #{hoverPoint.k + 1}
              </span>
            </div>
            <div className="text-[11px] text-[#64748b]">
              <div>
                {lang === 'ar' ? 'الرأس:' : 'Tête :'} {' '}
                <strong className="text-[#0f172a] font-mono">
                  {HEADS[hoverPoint.head].id} ({HEADS[hoverPoint.head].angle}°)
                </strong>
              </div>
              <div>
                {lang === 'ar' ? 'الزاوية:' : 'Angle :'} {' '}
                <strong className="text-[#0f172a] font-mono">
                  {fmt(hoverPoint.a, 2)}°
                </strong>
              </div>
              <div>
                {lang === 'ar' ? 'الإحداثيات:' : 'Coord :'} X={fmt(hoverPoint.x, 2)} , Y={fmt(hoverPoint.y, 2)} mm
              </div>
              <div className="mt-1 pt-1 border-t border-[#f1f5f9]">
                {state && hoverPoint.j < state.counts[hoverPoint.layer] ? (
                  <span className="text-[#059669] font-bold">✔ {lang === 'ar' ? 'تم الحفر' : 'Percé'}</span>
                ) : (
                  <span className="text-amber-600 font-bold">⏳ {lang === 'ar' ? 'بانتظار الحفر' : 'En attente'}</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Display Toggles (Single organized row beneath canvas) */}
      <div
        className="flex items-center justify-center gap-1.5 sm:gap-2 overflow-x-auto py-1 px-1 w-full scrollbar-none select-none"
        dir="rtl"
      >
        {/* أبعاد Dimensions */}
        <button
          type="button"
          onClick={() =>
            onChangeOptions({
              ...options,
              dimensions: options.dimensions === false ? true : false,
            })
          }
          className={`shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer select-none flex items-center gap-1.5 active:scale-95 ${
            options.dimensions !== false
              ? 'bg-blue-50 border-[#2563eb]/40 text-[#2563eb] shadow-xs font-bold'
              : 'bg-white border-[#e2e8f0] text-[#64748b] hover:border-[#cbd5e1] hover:text-[#334155]'
          }`}
          title={t.viewDimensions}
        >
          <Ruler className="w-3.5 h-3.5 shrink-0" />
          <span className="whitespace-nowrap">{t.viewDimensions}</span>
        </button>

        {/* رؤوس Heads */}
        <button
          type="button"
          onClick={() => onChangeOptions({ ...options, heads: !options.heads })}
          className={`shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer select-none flex items-center gap-1.5 active:scale-95 ${
            options.heads
              ? 'bg-blue-50 border-[#2563eb]/40 text-[#2563eb] shadow-xs font-bold'
              : 'bg-white border-[#e2e8f0] text-[#64748b] hover:border-[#cbd5e1] hover:text-[#334155]'
          }`}
          title={t.viewHeads}
        >
          <Crosshair className="w-3.5 h-3.5 shrink-0" />
          <span className="whitespace-nowrap">{t.viewHeads}</span>
        </button>

        {/* دوائر Rings */}
        <button
          type="button"
          onClick={() => onChangeOptions({ ...options, rings: !options.rings })}
          className={`shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer select-none flex items-center gap-1.5 active:scale-95 ${
            options.rings
              ? 'bg-blue-50 border-[#2563eb]/40 text-[#2563eb] shadow-xs font-bold'
              : 'bg-white border-[#e2e8f0] text-[#64748b] hover:border-[#cbd5e1] hover:text-[#334155]'
          }`}
          title={t.viewRings}
        >
          <CircleDot className="w-3.5 h-3.5 shrink-0" />
          <span className="whitespace-nowrap">{t.viewRings}</span>
        </button>

        {/* ترقيم Labels */}
        <button
          type="button"
          onClick={() => onChangeOptions({ ...options, labels: !options.labels })}
          className={`shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer select-none flex items-center gap-1.5 active:scale-95 ${
            options.labels
              ? 'bg-blue-50 border-[#2563eb]/40 text-[#2563eb] shadow-xs font-bold'
              : 'bg-white border-[#e2e8f0] text-[#64748b] hover:border-[#cbd5e1] hover:text-[#334155]'
          }`}
          title={t.viewLabels}
        >
          <Hash className="w-3.5 h-3.5 shrink-0" />
          <span className="whitespace-nowrap">{t.viewLabels}</span>
        </button>

        {/* قطاعات Sectors */}
        <button
          type="button"
          onClick={() => onChangeOptions({ ...options, sectors: !options.sectors })}
          className={`shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer select-none flex items-center gap-1.5 active:scale-95 ${
            options.sectors
              ? 'bg-blue-50 border-[#2563eb]/40 text-[#2563eb] shadow-xs font-bold'
              : 'bg-white border-[#e2e8f0] text-[#64748b] hover:border-[#cbd5e1] hover:text-[#334155]'
          }`}
          title={t.viewSectors}
        >
          <PieChart className="w-3.5 h-3.5 shrink-0" />
          <span className="whitespace-nowrap">{t.viewSectors}</span>
        </button>
      </div>

      {/* 3. Visual Legend Strip */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-[#64748b] pt-1" dir="ltr">
        {/* Layer dots */}
        {model.layers.map((l) => (
          <span key={l.i} className="flex items-center gap-1.5 font-medium">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: LAYER_COLORS[l.i % LAYER_COLORS.length] }}
            />
            <span>L{l.i + 1} ({fmt(l.r, 0)} mm)</span>
          </span>
        ))}

        {/* Head markers */}
        {HEADS.map((h) => (
          <span key={h.id} className="flex items-center gap-1.5 font-medium">
            <span
              className="w-2.5 h-2.5 rounded-xs inline-block"
              style={{ backgroundColor: h.color }}
            />
            <span className="font-mono">{h.id} @ {h.angle}°</span>
          </span>
        ))}

        <span className="flex items-center gap-1.5 font-medium text-red-600">
          <span className="w-2.5 h-2.5 rounded-full border-2 border-red-500 inline-block" />
          <span>{lang === 'ar' ? 'تداخل محظور' : 'Collision interdite'}</span>
        </span>
      </div>
    </div>
  );
};
