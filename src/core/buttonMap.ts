import { norm360 } from './model';
import { PlanHole, ExecutionPlan } from './plan';

export type ButtonActionType =
  | 'HOME' // 0° HOME table button
  | 'R_MAX' // r MAX radial button
  | 'R_MINUS' // r− radial inward button
  | 'R_PLUS' // r+ radial outward button
  | 'THETA_MINUS' // θ− table CW rotation button
  | 'THETA_PLUS' // θ+ table CCW rotation button
  | 'PUSH'; // PUSH drill plunge button (3 heads)

export interface ButtonMapStep {
  stepIndex: number; // 1-based sequential step in button map
  action: ButtonActionType;
  buttonLabel: string; // e.g. "(0 HOME)", "(r MAX)", "(θ−)×1", "(r−)×2", "(PUSH)"
  pulses: number; // number of times this button is pressed (>= 1)
  rMm: number; // radius after this step
  thetaDeg: number; // table angle after this step (0..360)
  layerIndex: number; // 0-based layer index
  layerName: string; // e.g. "L1", "L2"
  plungeIndex?: number; // 1-based plunge counter if action === 'PUSH'
  holesDrilled?: PlanHole[]; // holes drilled in this plunge
  explanationAr: string; // Arabic mechanical explanation
  explanationEn: string; // English mechanical explanation
}

export interface ButtonPressesBreakdown {
  home: number;
  rMax: number;
  thetaMinus: number;
  thetaPlus: number;
  rMinus: number;
  rPlus: number;
  push: number;
}

export interface ButtonMapResult {
  steps: ButtonMapStep[];
  condensedString: string; // "(0 HOME) > (r MAX) > (PUSH) > (θ−)×1 > ..."
  totalPresses: number;
  totalPlunges: number;
  totalHoles: number;
  breakdown: ButtonPressesBreakdown;
  layersCount: number;
}

export interface ButtonMapOptions {
  ringRadii: number[];
  nPoints: number;
  stepAngleDeg: number;
  stepRadialMm: number;
  rHeadMinMm?: number;
  layerFilter?: number;
}

/**
 * Calculates the clockwise (CW) angular distance from thetaFrom to thetaTo.
 * In machine table coordinates where table advances in CW direction:
 * dCW = (thetaFrom - thetaTo + 360) % 360
 */
export function angleDistanceCW(thetaFrom: number, thetaTo: number): number {
  const diff = (norm360(thetaFrom) - norm360(thetaTo) + 360) % 360;
  return Number(diff.toFixed(2));
}

/**
 * Generates the deterministic, optimal Button Map from the design geometry.
 * Follows strict single-direction (CW) table rotation and continuous layer transitions:
 * 1) Starts at (0 HOME) and (r MAX).
 * 2) Plunges at initial point.
 * 3) Steps table strictly CW: (θ−)×N > (PUSH).
 * 4) At the end of each layer, table stops at the last drilled hole.
 * 5) Radial carriage steps inward towards center: (r−)×N.
 * 6) Table continues CW to the next hole on the new layer, with zero reversing.
 */
export function generateButtonMap(options: ButtonMapOptions): ButtonMapResult {
  const {
    ringRadii,
    nPoints,
    stepAngleDeg,
    stepRadialMm,
    rHeadMinMm = 40,
    layerFilter,
  } = options;

  if (!ringRadii || ringRadii.length === 0 || nPoints <= 0) {
    return {
      steps: [],
      condensedString: '',
      totalPresses: 0,
      totalPlunges: 0,
      totalHoles: 0,
      breakdown: {
        home: 0,
        rMax: 0,
        thetaMinus: 0,
        thetaPlus: 0,
        rMinus: 0,
        rPlus: 0,
        push: 0,
      },
      layersCount: 0,
    };
  }

  const activeRadii = ringRadii
    .map((r, idx) => ({ r, layerIdx: idx }))
    .filter((item) => layerFilter === undefined || item.layerIdx === layerFilter)
    .filter((item) => item.r >= rHeadMinMm)
    .sort((a, b) => b.r - a.r); // Outermost to innermost

  if (activeRadii.length === 0) {
    return {
      steps: [],
      condensedString: '',
      totalPresses: 0,
      totalPlunges: 0,
      totalHoles: 0,
      breakdown: {
        home: 0,
        rMax: 0,
        thetaMinus: 0,
        thetaPlus: 0,
        rMinus: 0,
        rPlus: 0,
        push: 0,
      },
      layersCount: 0,
    };
  }

  const steps: ButtonMapStep[] = [];
  let stepIndex = 1;
  let plungeCounter = 1;
  let totalHolesCount = 0;

  const breakdown: ButtonPressesBreakdown = {
    home: 0,
    rMax: 0,
    thetaMinus: 0,
    thetaPlus: 0,
    rMinus: 0,
    rPlus: 0,
    push: 0,
  };

  // Initial State: Machine at 0° Home and r MAX
  let currentTheta = 0;
  let currentR = activeRadii[0].r;

  // Step 1: (0 HOME)
  steps.push({
    stepIndex: stepIndex++,
    action: 'HOME',
    buttonLabel: '(0 HOME)',
    pulses: 1,
    rMm: currentR,
    thetaDeg: 0,
    layerIndex: activeRadii[0].layerIdx,
    layerName: `L${activeRadii[0].layerIdx + 1}`,
    explanationAr: 'تصفير طاولة التدوير عند زاوية المرجع 0°',
    explanationEn: 'Home rotary table to reference 0°',
  });
  breakdown.home += 1;

  // Step 2: (r MAX)
  steps.push({
    stepIndex: stepIndex++,
    action: 'R_MAX',
    buttonLabel: '(r MAX)',
    pulses: 1,
    rMm: currentR,
    thetaDeg: 0,
    layerIndex: activeRadii[0].layerIdx,
    layerName: `L${activeRadii[0].layerIdx + 1}`,
    explanationAr: `تقديم الرؤوس الثلاثة إلى نصف القطر الخارجي الأقصى (${currentR} مم)`,
    explanationEn: `Advance 3 heads to outermost radius (${currentR}mm)`,
  });
  breakdown.rMax += 1;

  // Process layers sequentially (outermost to innermost)
  activeRadii.forEach((layerItem, layerSeqIdx) => {
    const { r: targetRadius, layerIdx } = layerItem;
    const layerName = `L${layerIdx + 1}`;

    // If moving between layers: carriage moves radially inward (r−)
    if (layerSeqIdx > 0) {
      const deltaR = currentR - targetRadius;
      if (deltaR > 0.05) {
        const rPulses = Math.max(1, Math.round(deltaR / Math.max(0.1, stepRadialMm)));
        steps.push({
          stepIndex: stepIndex++,
          action: 'R_MINUS',
          buttonLabel: rPulses > 1 ? `(r−)×${rPulses}` : '(r−)',
          pulses: rPulses,
          rMm: targetRadius,
          thetaDeg: currentTheta, // Table remains at last drilled hole!
          layerIndex: layerIdx,
          layerName,
          explanationAr: `تقدم الرؤوس شعاعياً نحو المركز إلى الطبقة ${layerName} (r=${targetRadius} مم، ${rPulses} نبضة)`,
          explanationEn: `Heads advance radially inward to ${layerName} (r=${targetRadius}mm, ${rPulses} pulses)`,
        });
        breakdown.rMinus += rPulses;
        currentR = targetRadius;
      }
    }

    // Build the set of unique plunge angles for this layer
    // Each plunge covers 3 holes at 120° offsets (head 0, 1, 2)
    interface PlungeCandidate {
      thetaDeg: number;
      holes: PlanHole[];
    }

    // Candidate tray angles on this layer
    interface TrayPoint {
      k: number;
      a: number;
    }
    const unvisited: TrayPoint[] = [];
    for (let k = 0; k < nPoints; k++) {
      unvisited.push({
        k,
        a: Number(norm360(k * stepAngleDeg).toFixed(2)),
      });
    }

    const layerPlunges: PlungeCandidate[] = [];

    while (unvisited.length > 0) {
      const p0 = unvisited.shift()!;
      // theta = norm360(-p0.a)
      const theta = Number(norm360(-p0.a).toFixed(2));

      const plungeHoles: PlanHole[] = [
        {
          id: `bm-L${layerIdx + 1}-k${p0.k}-h0`,
          globalIndex: layerIdx * nPoints + p0.k + 1,
          layer: layerIdx,
          r: targetRadius,
          a: p0.a,
          head: 0,
          drilledAt: 0,
        },
      ];

      // Find matching points for head 1 (120°) and head 2 (240°)
      const a1Expected = Number(norm360(120 - theta).toFixed(2));
      const a2Expected = Number(norm360(240 - theta).toFixed(2));

      const idx1 = unvisited.findIndex((p) => {
        const diff = Math.abs(norm360(p.a) - norm360(a1Expected));
        return Math.min(diff, 360 - diff) <= 0.75;
      });
      if (idx1 !== -1) {
        const p1 = unvisited.splice(idx1, 1)[0];
        plungeHoles.push({
          id: `bm-L${layerIdx + 1}-k${p1.k}-h1`,
          globalIndex: layerIdx * nPoints + p1.k + 1,
          layer: layerIdx,
          r: targetRadius,
          a: p1.a,
          head: 1,
          drilledAt: 0,
        });
      }

      const idx2 = unvisited.findIndex((p) => {
        const diff = Math.abs(norm360(p.a) - norm360(a2Expected));
        return Math.min(diff, 360 - diff) <= 0.75;
      });
      if (idx2 !== -1) {
        const p2 = unvisited.splice(idx2, 1)[0];
        plungeHoles.push({
          id: `bm-L${layerIdx + 1}-k${p2.k}-h2`,
          globalIndex: layerIdx * nPoints + p2.k + 1,
          layer: layerIdx,
          r: targetRadius,
          a: p2.a,
          head: 2,
          drilledAt: 0,
        });
      }

      layerPlunges.push({
        thetaDeg: theta,
        holes: plungeHoles,
      });
    }

    // Sort plunges in continuous CW order starting from currentTheta!
    // In CW, dCW = (currentTheta - theta + 360) % 360
    layerPlunges.sort((a, b) => {
      const distA = angleDistanceCW(currentTheta, a.thetaDeg);
      const distB = angleDistanceCW(currentTheta, b.thetaDeg);
      return distA - distB;
    });

    // Execute each plunge in this layer
    layerPlunges.forEach((plunge, plungeIdx) => {
      const dCW = angleDistanceCW(currentTheta, plunge.thetaDeg);

      // If rotation is required to reach this plunge
      if (dCW > 0.05 && dCW < 359.95) {
        const thetaPulses = Math.max(1, Math.round(dCW / Math.max(0.1, stepAngleDeg)));
        steps.push({
          stepIndex: stepIndex++,
          action: 'THETA_PLUS',
          buttonLabel: thetaPulses > 1 ? `(θ+)×${thetaPulses}` : '(θ+)',
          pulses: thetaPulses,
          rMm: currentR,
          thetaDeg: plunge.thetaDeg,
          layerIndex: layerIdx,
          layerName,
          explanationAr: `تدوير الطاولة باتجاه عقارب الساعة (CW) بمقدار ${dCW}° (${thetaPulses} نبضة) إلى θ=${plunge.thetaDeg}°`,
          explanationEn: `Rotate table Clockwise (CW) by ${dCW}° (${thetaPulses} pulses) to θ=${plunge.thetaDeg}°`,
        });
        breakdown.thetaPlus += thetaPulses;
        currentTheta = plunge.thetaDeg;
      } else {
        // Table is already at the target plunge angle (e.g. after radial step or initial 0°)
        currentTheta = plunge.thetaDeg;
      }

      // Plunge trigger (PUSH)
      steps.push({
        stepIndex: stepIndex++,
        action: 'PUSH',
        buttonLabel: '(PUSH)',
        pulses: 1,
        rMm: currentR,
        thetaDeg: currentTheta,
        layerIndex: layerIdx,
        layerName,
        plungeIndex: plungeCounter++,
        holesDrilled: plunge.holes,
        explanationAr: `ضربة حفر متزامنة للرؤوس الثلاثة (${plunge.holes.length} ثقوب) عند r=${currentR} مم و θ=${currentTheta}°`,
        explanationEn: `Synchronized 3-head plunge drill (${plunge.holes.length} holes) at r=${currentR}mm, θ=${currentTheta}°`,
      });
      breakdown.push += 1;
      totalHolesCount += plunge.holes.length;
    });
  });

  const totalPresses =
    breakdown.home +
    breakdown.rMax +
    breakdown.thetaMinus +
    breakdown.thetaPlus +
    breakdown.rMinus +
    breakdown.rPlus +
    breakdown.push;

  const condensedString = steps.map((s) => s.buttonLabel).join(' > ');

  return {
    steps,
    condensedString,
    totalPresses,
    totalPlunges: breakdown.push,
    totalHoles: totalHolesCount,
    breakdown,
    layersCount: activeRadii.length,
  };
}

/**
 * Generates the deterministic Button Map directly from an ExecutionPlan (e.g. user design or replay plan).
 */
export function generateButtonMapFromExecutionPlan(
  plan: ExecutionPlan,
  stepRadialMm: number = 15,
  stepAngleDeg: number = 30
): ButtonMapResult {
  const steps: ButtonMapStep[] = [];
  if (!plan || !plan.steps || plan.steps.length === 0) {
    return {
      steps: [],
      condensedString: '(0 HOME) > (r MAX)',
      totalPresses: 2,
      totalPlunges: 0,
      totalHoles: 0,
      breakdown: { home: 1, rMax: 1, thetaMinus: 0, thetaPlus: 0, rMinus: 0, rPlus: 0, push: 0 },
      layersCount: 0,
    };
  }

  let stepIndex = 1;
  let plungeCounter = 1;
  let currentTheta = 0;
  let currentR = plan.steps[0].rMm;

  const breakdown: ButtonPressesBreakdown = {
    home: 1,
    rMax: 1,
    thetaMinus: 0,
    thetaPlus: 0,
    rMinus: 0,
    rPlus: 0,
    push: 0,
  };

  // Step 1: (0 HOME)
  steps.push({
    stepIndex: stepIndex++,
    action: 'HOME',
    buttonLabel: '(0 HOME)',
    pulses: 1,
    rMm: currentR,
    thetaDeg: 0,
    layerIndex: 0,
    layerName: 'L1',
    explanationAr: 'تصفير طاولة التدوير عند زاوية المرجع 0°',
    explanationEn: 'Home rotary table to reference 0°',
  });

  // Step 2: (r MAX)
  steps.push({
    stepIndex: stepIndex++,
    action: 'R_MAX',
    buttonLabel: '(r MAX)',
    pulses: 1,
    rMm: currentR,
    thetaDeg: 0,
    layerIndex: 0,
    layerName: 'L1',
    explanationAr: `تقديم الرؤوس الثلاثة إلى نصف القطر الأقصى (${currentR} مم)`,
    explanationEn: `Advance 3 heads to outermost radius (${currentR}mm)`,
  });

  let lastR = currentR;

  plan.steps.forEach((pStep) => {
    // Check radial movement
    if (pStep.rMm < lastR - 0.05) {
      const deltaR = lastR - pStep.rMm;
      const rPulses = Math.max(1, Math.round(deltaR / Math.max(0.1, stepRadialMm)));
      steps.push({
        stepIndex: stepIndex++,
        action: 'R_MINUS',
        buttonLabel: rPulses > 1 ? `(r−)×${rPulses}` : '(r−)',
        pulses: rPulses,
        rMm: pStep.rMm,
        thetaDeg: currentTheta,
        layerIndex: pStep.bandIndex - 1,
        layerName: pStep.matchingLayerName,
        explanationAr: `تحريك الرؤوس شعاعياً للداخل (r−) بمقدار ${deltaR.toFixed(1)} مم (${rPulses} نبضة)`,
        explanationEn: `Move heads radially inward (r−) by ${deltaR.toFixed(1)}mm (${rPulses} pulses)`,
      });
      breakdown.rMinus += rPulses;
      lastR = pStep.rMm;
    } else if (pStep.rMm > lastR + 0.05) {
      const deltaR = pStep.rMm - lastR;
      const rPulses = Math.max(1, Math.round(deltaR / Math.max(0.1, stepRadialMm)));
      steps.push({
        stepIndex: stepIndex++,
        action: 'R_PLUS',
        buttonLabel: rPulses > 1 ? `(r+)×${rPulses}` : '(r+)',
        pulses: rPulses,
        rMm: pStep.rMm,
        thetaDeg: currentTheta,
        layerIndex: pStep.bandIndex - 1,
        layerName: pStep.matchingLayerName,
        explanationAr: `تحريك الرؤوس شعاعياً للخارج (r+) بمقدار ${deltaR.toFixed(1)} مم (${rPulses} نبضة)`,
        explanationEn: `Move heads radially outward (r+) by ${deltaR.toFixed(1)}mm (${rPulses} pulses)`,
      });
      breakdown.rPlus += rPulses;
      lastR = pStep.rMm;
    }

    // Check angular movement CW
    const dCW = angleDistanceCW(currentTheta, pStep.thetaDeg);
    if (dCW > 0.05 && dCW < 359.95) {
      const thetaPulses = Math.max(1, Math.round(dCW / Math.max(0.1, stepAngleDeg)));
      steps.push({
        stepIndex: stepIndex++,
        action: 'THETA_PLUS',
        buttonLabel: thetaPulses > 1 ? `(θ+)×${thetaPulses}` : '(θ+)',
        pulses: thetaPulses,
        rMm: lastR,
        thetaDeg: pStep.thetaDeg,
        layerIndex: pStep.bandIndex - 1,
        layerName: pStep.matchingLayerName,
        explanationAr: `تدوير الطاولة CW بمقدار ${dCW}° (${thetaPulses} نبضة) إلى θ=${pStep.thetaDeg}°`,
        explanationEn: `Rotate table CW by ${dCW}° (${thetaPulses} pulses) to θ=${pStep.thetaDeg}°`,
      });
      breakdown.thetaPlus += thetaPulses;
      currentTheta = pStep.thetaDeg;
    } else {
      currentTheta = pStep.thetaDeg;
    }

    // PUSH
    steps.push({
      stepIndex: stepIndex++,
      action: 'PUSH',
      buttonLabel: '(PUSH)',
      pulses: 1,
      rMm: lastR,
      thetaDeg: currentTheta,
      layerIndex: pStep.bandIndex - 1,
      layerName: pStep.matchingLayerName,
      plungeIndex: plungeCounter++,
      holesDrilled: pStep.holes,
      explanationAr: `ضربة حفر متزامنة (${pStep.holesCount} ثقوب) عند r=${lastR} مم و θ=${currentTheta}°`,
      explanationEn: `Synchronized plunge drill (${pStep.holesCount} holes) at r=${lastR}mm, θ=${currentTheta}°`,
    });
    breakdown.push += 1;
  });

  const totalPresses =
    breakdown.home +
    breakdown.rMax +
    breakdown.thetaMinus +
    breakdown.thetaPlus +
    breakdown.rMinus +
    breakdown.rPlus +
    breakdown.push;

  const condensedString = steps.map((s) => s.buttonLabel).join(' > ');

  return {
    steps,
    condensedString,
    totalPresses,
    totalPlunges: breakdown.push,
    totalHoles: plan.totalHoles,
    breakdown,
    layersCount: plan.totalBands,
  };
}
