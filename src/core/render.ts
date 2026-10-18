import { TrayModel, SimulationState, ViewOptions, Point, CanvasTheme } from '../types';
import { DEG, HEADS, LAYER_COLORS } from './constants';
import { fmt } from './model';

export interface ViewportTransform {
  sc: number;
  cx: number;
  cy: number;
}

interface CanvasThemePalette {
  bgCenter: string;
  bgEdge: string;
  gridMinor: string;
  gridMajor: string;
  axis: string;
  gridText: string;
  trayGrad0: string;
  trayGrad1: string;
  trayGrad2: string;
  trayShadow: string;
  trayRimOuter: string;
  trayRimInner: string;
  tickMajor: string;
  tickMinor: string;
  tickLabel: string;
  holeGrad0: string;
  holeGrad1: string;
  holeGrad2: string;
  pendingFill: string;
  holeLabelDrilled: string;
  holeLabelPending: string;
  headBadgeText: string;
  scaleStroke: string;
  scaleText: string;
  hudText: string;
  dimPillBg: string;
  dimPillBorder: string;
  dimColorD: string;
  dimColorM: string;
  dimColorDelta: string;
  layerColors: string[];
}

const THEME_PALETTES: Record<CanvasTheme, CanvasThemePalette> = {
  light: {
    bgCenter: '#f8fafc',
    bgEdge: '#eef2f6',
    gridMinor: 'rgba(203, 213, 225, 0.38)',
    gridMajor: 'rgba(148, 163, 184, 0.65)',
    axis: 'rgba(100, 116, 139, 0.65)',
    gridText: 'rgba(100, 116, 139, 0.85)',
    trayGrad0: '#ffffff',
    trayGrad1: '#f8fafc',
    trayGrad2: '#e2e8f0',
    trayShadow: 'rgba(15, 23, 42, 0.08)',
    trayRimOuter: '#cbd5e1',
    trayRimInner: '#2563eb',
    tickMajor: 'rgba(71, 85, 105, 0.72)',
    tickMinor: 'rgba(148, 163, 184, 0.48)',
    tickLabel: 'rgba(71, 85, 105, 0.88)',
    holeGrad0: '#1e293b',
    holeGrad1: '#0f172a',
    holeGrad2: '#334155',
    pendingFill: '#ffffff',
    holeLabelDrilled: '#ffffff',
    holeLabelPending: '#1e293b',
    headBadgeText: '#0f172a',
    scaleStroke: '#334155',
    scaleText: '#334155',
    hudText: 'rgba(71, 85, 105, 0.92)',
    dimPillBg: 'rgba(255, 255, 255, 0.92)',
    dimPillBorder: 'rgba(148, 163, 184, 0.5)',
    dimColorD: '#0284c7',
    dimColorM: '#d97706',
    dimColorDelta: '#059669',
    layerColors: LAYER_COLORS,
  },
  dark: {
    bgCenter: '#0f172a',
    bgEdge: '#0b1220',
    gridMinor: 'rgba(148, 163, 184, 0.1)',
    gridMajor: 'rgba(148, 163, 184, 0.24)',
    axis: 'rgba(148, 163, 184, 0.45)',
    gridText: 'rgba(148, 163, 184, 0.78)',
    trayGrad0: '#1e293b',
    trayGrad1: '#162032',
    trayGrad2: '#0f172a',
    trayShadow: 'rgba(0, 0, 0, 0.45)',
    trayRimOuter: '#334155',
    trayRimInner: '#38bdf8',
    tickMajor: 'rgba(226, 232, 240, 0.75)',
    tickMinor: 'rgba(148, 163, 184, 0.38)',
    tickLabel: 'rgba(226, 232, 240, 0.88)',
    holeGrad0: '#090d16',
    holeGrad1: '#020617',
    holeGrad2: '#1e293b',
    pendingFill: '#0f172a',
    holeLabelDrilled: '#f8fafc',
    holeLabelPending: '#e2e8f0',
    headBadgeText: '#f1f5f9',
    scaleStroke: '#94a3b8',
    scaleText: '#cbd5e1',
    hudText: 'rgba(203, 213, 225, 0.92)',
    dimPillBg: 'rgba(15, 23, 42, 0.9)',
    dimPillBorder: 'rgba(148, 163, 184, 0.35)',
    dimColorD: '#38bdf8',
    dimColorM: '#fbbf24',
    dimColorDelta: '#34d399',
    layerColors: [
      '#60a5fa', // L1 - Bright Blue
      '#34d399', // L2 - Bright Emerald
      '#fbbf24', // L3 - Bright Amber
      '#f87171', // L4 - Bright Red
      '#a78bfa', // L5 - Bright Violet
      '#fb923c', // L6 - Bright Orange
      '#22d3ee', // L7 - Bright Cyan
    ],
  },
};

export function computeViewport(
  w: number,
  h: number,
  modelR: number,
  zoom: number,
  px: number,
  py: number
): ViewportTransform {
  const half = Math.min(w, h) / 2;
  const marginPx = Math.max(36, Math.min(80, half * 0.18));
  const base = Math.max(half - marginPx, half * 0.5) / Math.max(modelR + 25, 1);
  const sc = base * zoom;
  return {
    sc,
    cx: w / 2 + px,
    cy: h / 2 + py,
  };
}

function drawArrowhead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angleRad: number,
  size = 6,
  color: string
) {
  const spread = 26 * DEG;
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - size * Math.cos(angleRad - spread), y - size * Math.sin(angleRad - spread));
  ctx.lineTo(x - size * Math.cos(angleRad + spread), y - size * Math.sin(angleRad + spread));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawDimensionSegment(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  dashed = false
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return;

  const angle = Math.atan2(dy, dx);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.35;
  if (dashed) ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);

  if (dist >= 14) {
    drawArrowhead(ctx, x1, y1, angle + Math.PI, 6, color);
    drawArrowhead(ctx, x2, y2, angle, 6, color);
  }
  ctx.restore();
}

function drawDimensionBadge(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  textColor: string,
  bgColor: string,
  borderColor: string
) {
  ctx.save();
  ctx.font = '600 10.5px JetBrains Mono, monospace';
  const metrics = ctx.measureText(text);
  const padX = 6;
  const bw = metrics.width + padX * 2;
  const bh = 18;
  const rx = x - bw / 2;
  const ry = y - bh / 2;

  ctx.fillStyle = bgColor;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(rx, ry, bw, bh, 5);
  } else {
    ctx.rect(rx, ry, bw, bh);
  }
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 0.5);
  ctx.restore();
}

export function renderCanvas(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  dpr: number,
  model: TrayModel,
  state: SimulationState | null,
  options: ViewOptions,
  zoom: number,
  px: number,
  py: number,
  hoverPoint: Point | null,
  themeParam?: CanvasTheme
) {
  if (!w || !h || !model || !Array.isArray(model.layers)) return;

  const activeTheme: CanvasTheme =
    themeParam === 'light' || themeParam === 'dark'
      ? themeParam
      : options?.theme === 'light'
      ? 'light'
      : 'dark';
  const palette = THEME_PALETTES[activeTheme];
  const isDark = activeTheme === 'dark';

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.direction = 'ltr';

  const safeR = Number.isFinite(model.R) && model.R > 0 ? model.R : 0;
  const { sc, cx, cy } = computeViewport(w, h, Math.max(safeR, 1), zoom, px, py);
  const R = safeR;
  const Rp = R * sc;
  const theta = state ? state.theta : 0;

  // Coordinate transform taking tray rotation into account
  const transformPoint = (x: number, y: number, thDeg: number): [number, number] => {
    const c = Math.cos(thDeg * DEG);
    const s = Math.sin(thDeg * DEG);
    return [cx + (x * c - y * s) * sc, cy + (x * s + y * c) * sc];
  };

  // 1. Stage background
  const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.85);
  bg.addColorStop(0, palette.bgCenter);
  bg.addColorStop(1, palette.bgEdge);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // 2. Engineering Grid (Major + Minor + mm labels)
  const stepPairs: Array<[number, number]> = [
    [1, 5],
    [2, 10],
    [5, 25],
    [10, 50],
    [20, 100],
    [50, 250],
    [100, 500],
    [200, 1000],
  ];
  const chosenPair = stepPairs.find(([, maj]) => maj * sc >= 48) || [200, 1000];
  const minorStep = chosenPair[0];
  const majorStep = chosenPair[1];
  const drawMinor = minorStep * sc >= 9;

  // 2a. Minor grid lines (capped for performance)
  if (drawMinor) {
    const startWx = Math.ceil(-cx / sc / minorStep) * minorStep;
    const endWx = (w - cx) / sc;
    const startWy = Math.ceil(-cy / sc / minorStep) * minorStep;
    const endWy = (h - cy) / sc;
    const countX = (endWx - startWx) / minorStep;
    const countY = (endWy - startWy) / minorStep;

    if (countX <= 220 && countY <= 220) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = palette.gridMinor;
      ctx.beginPath();
      for (let wx = startWx; wx <= endWx; wx += minorStep) {
        if (Math.abs(wx % majorStep) < 1e-4) continue;
        const X = Math.round(wx * sc + cx) + 0.5;
        ctx.moveTo(X, 0);
        ctx.lineTo(X, h);
      }
      for (let wy = startWy; wy <= endWy; wy += minorStep) {
        if (Math.abs(wy % majorStep) < 1e-4) continue;
        const Y = Math.round(wy * sc + cy) + 0.5;
        ctx.moveTo(0, Y);
        ctx.lineTo(w, Y);
      }
      ctx.stroke();
    }
  }

  // 2b. Major grid lines
  const startMajX = Math.ceil(-cx / sc / majorStep) * majorStep;
  const endMajX = (w - cx) / sc;
  const startMajY = Math.ceil(-cy / sc / majorStep) * majorStep;
  const endMajY = (h - cy) / sc;

  ctx.lineWidth = 1;
  ctx.strokeStyle = palette.gridMajor;
  ctx.beginPath();
  for (let wx = startMajX; wx <= endMajX; wx += majorStep) {
    if (Math.abs(wx) < 1e-4) continue; // center axis drawn separately
    const X = Math.round(wx * sc + cx) + 0.5;
    ctx.moveTo(X, 0);
    ctx.lineTo(X, h);
  }
  for (let wy = startMajY; wy <= endMajY; wy += majorStep) {
    if (Math.abs(wy) < 1e-4) continue;
    const Y = Math.round(wy * sc + cy) + 0.5;
    ctx.moveTo(0, Y);
    ctx.lineTo(w, Y);
  }
  ctx.stroke();

  // 2c. Center X/Y Axes
  ctx.strokeStyle = palette.axis;
  ctx.lineWidth = 1.25;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(0, Math.round(cy) + 0.5);
  ctx.lineTo(w, Math.round(cy) + 0.5);
  ctx.moveTo(Math.round(cx) + 0.5, 0);
  ctx.lineTo(Math.round(cx) + 0.5, h);
  ctx.stroke();
  ctx.setLineDash([]);

  // 2d. Major Grid mm Labels along axes / viewport edges
  if (majorStep * sc >= 44) {
    ctx.save();
    ctx.fillStyle = palette.gridText;
    ctx.font = '500 9.5px JetBrains Mono, monospace';
    const labelY = Math.min(Math.max(cy + 11, 14), h - 8);
    const labelX = Math.min(Math.max(cx + 6, 8), w - 42);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let wx = startMajX; wx <= endMajX; wx += majorStep) {
      const X = wx * sc + cx;
      if (X < 28 || X > w - 28) continue;
      const val = Math.round(wx);
      ctx.fillText(val === 0 ? '0' : `${val}`, X, labelY);
    }

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (let wy = startMajY; wy <= endMajY; wy += majorStep) {
      const val = Math.round(wy);
      if (val === 0) continue;
      const Y = wy * sc + cy;
      if (Y < 24 || Y > h - 28) continue;
      ctx.fillText(`${val}`, labelX, Y);
    }
    ctx.restore();
  }

  // 3. Tray disk with metallic bevel and drop shadow
  ctx.save();
  ctx.shadowColor = palette.trayShadow;
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  ctx.beginPath();
  ctx.arc(cx, cy, Rp, 0, Math.PI * 2);
  const trayGrad = ctx.createRadialGradient(cx - Rp * 0.2, cy - Rp * 0.2, Rp * 0.1, cx, cy, Rp);
  trayGrad.addColorStop(0, palette.trayGrad0);
  trayGrad.addColorStop(0.7, palette.trayGrad1);
  trayGrad.addColorStop(1, palette.trayGrad2);
  ctx.fillStyle = trayGrad;
  ctx.fill();
  ctx.restore();

  // Tray brushed rim boundary
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, Rp, 0, Math.PI * 2);
  ctx.lineWidth = Math.max(2.5, 3 * sc * 0.08);
  ctx.strokeStyle = palette.trayRimOuter;
  ctx.stroke();

  // Inner border highlight
  ctx.lineWidth = 1.3;
  ctx.strokeStyle = palette.trayRimInner;
  ctx.stroke();
  ctx.restore();

  // 4. Head sectors (0°, 120°, 240°)
  if (options.sectors) {
    HEADS.forEach((hConfig) => {
      const isMachine = options.frameMode === 'machine';
      const a0 = (hConfig.angle + (isMachine ? 0 : theta)) * DEG;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, Rp, a0, a0 + 120 * DEG);
      ctx.closePath();
      ctx.fillStyle = hConfig.color + (isDark ? '1a' : '12');
      ctx.fill();
      ctx.strokeStyle = hConfig.color + (isDark ? '66' : '44');
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    });
  }

  // 5. Angular degree ticks around the rim
  ctx.lineWidth = 1;
  for (let d = 0; d < 360; d += 10) {
    const isMajor = d % 30 === 0;
    const a = (d + theta) * DEG;
    const len = isMajor ? 10 : 5;
    ctx.strokeStyle = isMajor ? palette.tickMajor : palette.tickMinor;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * Rp, cy + Math.sin(a) * Rp);
    ctx.lineTo(cx + Math.cos(a) * (Rp - len), cy + Math.sin(a) * (Rp - len));
    ctx.stroke();

    if (options.labels && isMajor && Rp > 85) {
      ctx.fillStyle = palette.tickLabel;
      ctx.font = '500 10px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${d}°`, cx + Math.cos(a) * (Rp - 22), cy + Math.sin(a) * (Rp - 22));
    }
  }

  // 5.5 Active Clockwise (CW) Table Rotation Motion Indicator
  if (state && state.isRotatingCW) {
    ctx.save();
    const arrowR = Rp + 14;
    const startAng = (theta - 30) * DEG;
    const endAng = (theta + 30) * DEG;
    ctx.beginPath();
    ctx.arc(cx, cy, arrowR, startAng, endAng, false);
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.8;
    ctx.stroke();

    // Arrowhead in CW direction at endAng
    const tipX = cx + Math.cos(endAng) * arrowR;
    const tipY = cy + Math.sin(endAng) * arrowR;
    drawArrowhead(ctx, tipX, tipY, endAng + Math.PI / 2, 7, '#06b6d4');

    // Subtle CW Badge
    drawDimensionBadge(
      ctx,
      '↻ CW',
      cx,
      cy - Rp - 16,
      '#06b6d4',
      palette.dimPillBg,
      '#06b6d4'
    );
    ctx.restore();
  }

  // 6. Concentric Layer Rings
  if (options.rings) {
    model.layers.forEach((L) => {
      if (L.r <= 0) return;
      ctx.beginPath();
      ctx.arc(cx, cy, L.r * sc, 0, Math.PI * 2);
      const col = palette.layerColors[L.i % palette.layerColors.length];
      ctx.strokeStyle = col + (isDark ? '88' : '55');
      ctx.lineWidth = isDark ? 1.4 : 1.2;
      ctx.setLineDash([6, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    });
  }

  // 7. Drilled Hole Points
  const rp = Math.max(model.toolR * sc, 2.5);
  const firing =
    state && state.cur && state.cur.type === 'fire' && !state.done ? state.cur : null;

  model.layers.forEach((L) => {
    const layerColor = palette.layerColors[L.i % palette.layerColors.length];

    for (const q of L.pts) {
      const [x, y] = transformPoint(q.x, q.y, theta); // Always rotate points by tray theta
      if (x < -30 || y < -30 || x > w + 30 || y > h + 30) continue;

      const isSkipped = q.fired === false;
      const isDrilled = !isSkipped && (!state || q.j < state.counts[L.i]);
      const col = options.heads ? HEADS[q.head].color : layerColor;

      ctx.beginPath();
      ctx.arc(x, y, rp, 0, Math.PI * 2);

      if (isSkipped) {
        // Ghost / Phantom stroke for Repteur skipped punch
        ctx.fillStyle = isDark ? 'rgba(30, 41, 59, 0.25)' : 'rgba(241, 245, 249, 0.5)';
        ctx.fill();
        ctx.lineWidth = isDark ? 1.2 : 1.0;
        ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.45)' : 'rgba(148, 163, 184, 0.55)';
        ctx.setLineDash([3, 2.5]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Small subtle center cross for visual clarity
        const cLen = Math.max(rp * 0.35, 1.5);
        ctx.beginPath();
        ctx.moveTo(x - cLen, y);
        ctx.lineTo(x + cLen, y);
        ctx.moveTo(x, y - cLen);
        ctx.lineTo(x, y + cLen);
        ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.35)' : 'rgba(148, 163, 184, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else if (isDrilled) {
        const holeGrad = ctx.createRadialGradient(x - rp * 0.2, y - rp * 0.2, rp * 0.1, x, y, rp);
        holeGrad.addColorStop(0, palette.holeGrad0);
        holeGrad.addColorStop(0.85, palette.holeGrad1);
        holeGrad.addColorStop(1, palette.holeGrad2);
        ctx.fillStyle = holeGrad;
        ctx.fill();

        // Rim chamfer (higher contrast in dark mode)
        ctx.lineWidth = isDark ? 1.5 : 1.2;
        ctx.strokeStyle = col;
        ctx.stroke();
      } else {
        // Pending point
        ctx.lineWidth = isDark ? 1.4 : 1.2;
        ctx.strokeStyle = col + (isDark ? 'aa' : '77');
        ctx.fillStyle = palette.pendingFill;
        ctx.fill();
        ctx.stroke();
      }

      // Overlap / collision indicator
      if (q.bad && !isSkipped) {
        ctx.beginPath();
        ctx.arc(x, y, rp + 3.5, 0, Math.PI * 2);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.2;
        ctx.stroke();
      }

      // Active drilling plunge animation
      if (firing && firing.layer === L.i && q.j === firing.j && state) {
        const pulse = state.u;
        ctx.beginPath();
        ctx.arc(x, y, rp + 2 + 6 * pulse, 0, Math.PI * 2);
        if (isSkipped) {
          // Subtle dashed indicator for skipped stroke
          ctx.strokeStyle = `rgba(148, 163, 184, ${(0.6 - pulse * 0.5).toFixed(2)})`;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([2.5, 2.5]);
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          ctx.strokeStyle = `rgba(56, 189, 248, ${(1 - pulse * 0.6).toFixed(2)})`;
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }
      }

      // Hover ring
      if (hoverPoint && hoverPoint.layer === q.layer && hoverPoint.k === q.k) {
        ctx.beginPath();
        ctx.arc(x, y, rp + 4, 0, Math.PI * 2);
        ctx.strokeStyle = isDark ? '#38bdf8' : '#2563eb';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      // Active CAM execution step highlight
      if (q.camStatus === 'active' || q.isCamActive) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, rp + 5.5, 0, Math.PI * 2);
        ctx.strokeStyle = '#06b6d4'; // Cyan-500 high-visibility ring
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x, y, rp + 8.5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 2.5]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      // Point index label if zoomed in sufficiently or if custom label exists
      if (options.labels && rp >= 6.5) {
        ctx.fillStyle = isDrilled ? palette.holeLabelDrilled : palette.holeLabelPending;
        const fontSize = Math.min(Math.max(rp * 1.0, 9), 13);
        ctx.font = `600 ${fontSize}px JetBrains Mono, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const labelText = q.label ?? String(q.k + 1);
        ctx.fillText(labelText, x, y + 0.5);
      }
    }
  });

  // 7.5 Engineering Dimensions Overlay (D, M, ΔD) when options.dimensions !== false
  if (
    options.dimensions !== false &&
    R > 0 &&
    Array.isArray(model.layers) &&
    model.layers.length > 0 &&
    model.layers[0].r > 0
  ) {
    const trayD = 2 * R;
    const margin = Math.max(0, R - model.r1);
    const hasTwoLayers =
      model.layers.length >= 2 && model.layers[0].r > 0 && model.layers[1].r > 0;
    const spacing = hasTwoLayers
      ? Math.abs(model.layers[0].r - model.layers[1].r)
      : model.radialStepMm;

    // A) Tray Diameter D — Horizontal dimension line below tray outer rim
    const dimY = cy + Rp + 42;
    const leftX = cx - Rp;
    const rightX = cx + Rp;

    ctx.save();
    ctx.strokeStyle = palette.dimColorD + '77';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(leftX, cy + 4);
    ctx.lineTo(leftX, dimY + 5);
    ctx.moveTo(rightX, cy + 4);
    ctx.lineTo(rightX, dimY + 5);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    drawDimensionSegment(ctx, leftX, dimY, rightX, dimY, palette.dimColorD);
    drawDimensionBadge(
      ctx,
      `D=${fmt(trayD, 1)} mm`,
      cx,
      dimY,
      palette.dimColorD,
      palette.dimPillBg,
      palette.dimPillBorder
    );

    // B) Outer Margin M — Radial clearance between tray rim (R) and first layer (r1) at -35°
    if (model.r1 > 0 && model.r1 < R) {
      const angM = -35 * DEG;
      const ux = Math.cos(angM);
      const uy = Math.sin(angM);
      const xOuter = cx + ux * Rp;
      const yOuter = cy + uy * Rp;
      const xInner = cx + ux * (model.r1 * sc);
      const yInner = cy + uy * (model.r1 * sc);

      drawDimensionSegment(ctx, xInner, yInner, xOuter, yOuter, palette.dimColorM);

      // Position badge along radial midpoint or slightly outside rim if gap is narrow
      const gapPx = (R - model.r1) * sc;
      const labelR = gapPx >= 52 ? ((R + model.r1) / 2) * sc : Rp + 24;
      drawDimensionBadge(
        ctx,
        `M=${fmt(margin, 1)} mm`,
        cx + ux * labelR,
        cy + uy * labelR,
        palette.dimColorM,
        palette.dimPillBg,
        palette.dimPillBorder
      );
    }

    // C) Layer Spacing s — Radial step between L1 and L2 at -90° (top vertical axis)
    if (hasTwoLayers) {
      const r1Px = model.layers[0].r * sc;
      const r2Px = model.layers[1].r * sc;
      const angD = -90 * DEG;
      const ux = Math.cos(angD);
      const uy = Math.sin(angD);
      const x1 = cx + ux * r1Px;
      const y1 = cy + uy * r1Px;
      const x2 = cx + ux * r2Px;
      const y2 = cy + uy * r2Px;

      drawDimensionSegment(ctx, x2, y2, x1, y1, palette.dimColorDelta);

      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      // Offset badge slightly to the right of the vertical ray so the arrow stays visible
      const gapPx = Math.abs(r1Px - r2Px);
      const badgeX = gapPx < 36 ? midX + 54 : midX;
      drawDimensionBadge(
        ctx,
        `s=${fmt(spacing, 1)} mm`,
        badgeX,
        midY,
        palette.dimColorDelta,
        palette.dimPillBg,
        palette.dimPillBorder
      );
    }
  }

  // Center Dead Zone / Hazard Disc (منطقة الموت المركزية)
  ctx.save();
  const deadR = Math.max(model.toolR, 8) * sc;
  ctx.beginPath();
  ctx.arc(cx, cy, deadR, 0, Math.PI * 2);
  ctx.fillStyle = isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)';
  ctx.fill();
  ctx.strokeStyle = isDark ? 'rgba(239, 68, 68, 0.45)' : 'rgba(239, 68, 68, 0.35)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.stroke();
  ctx.restore();

  // 8. Machine Center Spindle
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fillStyle = isDark ? '#38bdf8' : '#2563eb';
  ctx.fill();
  ctx.strokeStyle = isDark ? '#0284c7' : '#1d4ed8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 12, cy);
  ctx.lineTo(cx + 12, cy);
  ctx.moveTo(cx, cy - 12);
  ctx.lineTo(cx, cy + 12);
  ctx.stroke();

  // 9. Three Synchronized Machine Drill Heads (T1 @ 0°, T2 @ 120°, T3 @ 240°)
  const outerSpindleR = Rp + 26;

  HEADS.forEach((hConfig) => {
    const a = hConfig.angle * DEG;
    const ux = Math.cos(a);
    const uy = Math.sin(a);
    const nx = -uy;
    const ny = ux;

    if (state) {
      const currentRadius = state.headR * sc;

      // Guide rail
      ctx.strokeStyle = hConfig.color;
      ctx.lineWidth = 2.8;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(cx + ux * outerSpindleR, cy + uy * outerSpindleR);
      ctx.lineTo(cx + ux * currentRadius, cy + uy * currentRadius);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Active Drill Toolhead Chuck
      const toolX = cx + ux * currentRadius;
      const toolY = cy + uy * currentRadius;
      const toolRadius = Math.max(model.toolR * sc, 4);

      ctx.beginPath();
      ctx.arc(toolX, toolY, toolRadius, 0, Math.PI * 2);
      ctx.fillStyle = hConfig.color + '44';
      ctx.fill();
      ctx.strokeStyle = hConfig.color;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Tool reticle
      ctx.beginPath();
      ctx.moveTo(toolX - toolRadius - 4, toolY);
      ctx.lineTo(toolX + toolRadius + 4, toolY);
      ctx.moveTo(toolX, toolY - toolRadius - 4);
      ctx.lineTo(toolX, toolY + toolRadius + 4);
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Plunge spark flash or Repteur bypassed stroke indicator
      if (firing && firing.fired !== false) {
        const glowGrad = ctx.createRadialGradient(
          toolX,
          toolY,
          0,
          toolX,
          toolY,
          toolRadius * 3 + 8
        );
        const sparkIntensity = state ? (0.8 * (1 - state.u)).toFixed(2) : '0';
        glowGrad.addColorStop(0, `rgba(56, 189, 248, ${sparkIntensity})`);
        glowGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.beginPath();
        ctx.arc(toolX, toolY, toolRadius * 3 + 8, 0, Math.PI * 2);
        ctx.fillStyle = glowGrad;
        ctx.fill();
      } else if (firing && firing.fired === false) {
        // Repteur intercepted: punch bypassed by relay, no spark flash
        ctx.beginPath();
        ctx.arc(toolX, toolY, toolRadius + 4, 0, Math.PI * 2);
        ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.45)' : 'rgba(100, 116, 139, 0.4)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Outer Head Housing Pointer & Tag
    ctx.beginPath();
    ctx.moveTo(cx + ux * outerSpindleR, cy + uy * outerSpindleR);
    ctx.lineTo(cx + ux * (outerSpindleR + 14) + nx * 7, cy + uy * (outerSpindleR + 14) + ny * 7);
    ctx.lineTo(cx + ux * (outerSpindleR + 14) - nx * 7, cy + uy * (outerSpindleR + 14) - ny * 7);
    ctx.closePath();
    ctx.fillStyle = hConfig.color;
    ctx.fill();

    // Head Badge Label
    ctx.fillStyle = palette.headBadgeText;
    ctx.font = 'bold 11px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      `${hConfig.id} · ${hConfig.angle}°`,
      cx + ux * (outerSpindleR + 32),
      cy + uy * (outerSpindleR + 32)
    );
  });

  // 10. Measurement scale bar in bottom-left
  const niceScaleMm = [1, 2, 5, 10, 20, 50, 100, 200, 500].find((v) => v * sc >= 65) || 200;
  const barPx = niceScaleMm * sc;
  const bx = 18;
  const by = h - 20;

  ctx.strokeStyle = palette.scaleStroke;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bx, by - 5);
  ctx.lineTo(bx, by);
  ctx.lineTo(bx + barPx, by);
  ctx.lineTo(bx + barPx, by - 5);
  ctx.stroke();

  ctx.fillStyle = palette.scaleText;
  ctx.font = '600 11px JetBrains Mono, monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`${niceScaleMm} mm`, bx, by - 6);

  // 11. HUD status overlay (Zoom & Tray Rotation)
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = palette.hudText;
  ctx.font = '600 11px JetBrains Mono, monospace';
  ctx.fillText(`ZOOM ${Math.round(zoom * 100)}%`, 18, 16);
  if (state) {
    ctx.fillText(`ROT ${fmt(-theta, 1)}°`, 18, 34);
  }
}
