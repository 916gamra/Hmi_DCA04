import { norm360 } from './model';

export interface PlanHole {
  id: string;
  globalIndex?: number;
  layer: number;
  r: number;
  a: number; // Tray coordinate angle (0..360°)
  head: 0 | 1 | 2;
  drilledAt: number;
}

export interface PlanStep {
  stepIndex: number; // 1-based global execution step
  bandIndex: number; // 1-based radial band (1 = outermost, N = innermost)
  rMm: number; // Nominal radius of this radial band (mm)
  thetaDeg: number; // Required machine table angle (deg, 0..360)
  holes: PlanHole[]; // The holes drilled simultaneously in this plunge
  holesCount: number; // 1, 2, or 3
  heads: Array<0 | 1 | 2>; // drill heads firing
  isFullTriad: boolean; // true if heads.length === 3
  matchingLayerName: string; // e.g. "L1", "L2", "Off-grid"
  // Estimated machine movements from PREVIOUS step:
  deltaR: number; // rCurr - rPrev (always <= 0 in Outer->Inner plan)
  deltaTheta: number; // norm360(thetaCurr - thetaPrev)
  rPulses: number; // estimated R- presses
  thetaPulses: number; // estimated T+ presses
}

export interface RadialBand {
  bandIndex: number;
  nominalR: number;
  holesCount: number;
  plungesCount: number;
  matchingLayerName: string;
  steps: PlanStep[];
}

export interface ExecutionPlan {
  bands: RadialBand[];
  steps: PlanStep[];
  totalHoles: number;
  totalPlunges: number;
  totalBands: number;
  totalRadialTravelMm: number;
  yoYoReversalsEliminated: number;
}

export interface PlanOptions {
  stepRadialMm: number;
  stepAngleDeg: number;
  ringRadii?: number[];
  rToleranceMm?: number; // default 1.5mm
  thetaToleranceDeg?: number; // default 0.75deg
}

/**
 * Calculates the required machine table angle θ for a hole given
 * its tray angle a and the head index h (0=0°, 1=120°, 2=240°).
 *
 * Invariant: headAngle - theta = a  (mod 360)
 * => theta = norm360(h * 120 - a)
 */
export function deriveTableAngle(a: number, head: 0 | 1 | 2): number {
  return Number(norm360(head * 120 - a).toFixed(2));
}

/**
 * Builds an optimal Outer -> Inner (Monotonic radial descent) execution plan
 * from a raw set of drilled holes. Eliminates radial backlash / "Yo-Yo" travel.
 */
export function buildExecutionPlan(
  holes: PlanHole[],
  options: PlanOptions
): ExecutionPlan {
  const {
    stepRadialMm = 15,
    stepAngleDeg = 30,
    ringRadii = [],
    rToleranceMm = 1.5,
    thetaToleranceDeg = 0.75,
  } = options;

  if (!holes || holes.length === 0) {
    return {
      bands: [],
      steps: [],
      totalHoles: 0,
      totalPlunges: 0,
      totalBands: 0,
      totalRadialTravelMm: 0,
      yoYoReversalsEliminated: 0,
    };
  }

  // 1. Calculate Yo-Yo reversals in raw history (outward moves after inward moves)
  let rawYoYoReversals = 0;
  for (let i = 1; i < holes.length; i++) {
    // If consecutive holes or plunges moved outwards by > 2mm
    if (holes[i].r - holes[i - 1].r > 2.0) {
      rawYoYoReversals++;
    }
  }

  // 2. Cluster holes by radius r into Radial Bands
  // Sort descending by r so outermost is processed first
  const sortedHoles = [...holes].sort((a, b) => b.r - a.r);

  interface RawBandCluster {
    holes: PlanHole[];
    sumR: number;
  }

  const clusters: RawBandCluster[] = [];

  for (const h of sortedHoles) {
    let matchedCluster: RawBandCluster | null = null;
    for (const cluster of clusters) {
      const avgR = cluster.sumR / cluster.holes.length;
      if (Math.abs(h.r - avgR) <= rToleranceMm) {
        matchedCluster = cluster;
        break;
      }
    }

    if (matchedCluster) {
      matchedCluster.holes.push(h);
      matchedCluster.sumR += h.r;
    } else {
      clusters.push({
        holes: [h],
        sumR: h.r,
      });
    }
  }

  // Sort clusters descending by nominal radius
  clusters.sort((a, b) => {
    const avgA = a.sumR / a.holes.length;
    const avgB = b.sumR / b.holes.length;
    return avgB - avgA;
  });

  // 3. For each cluster, group holes into Plunge Steps by table angle θ
  const builtBands: RadialBand[] = [];
  let globalStepCounter = 1;
  let previousStep: PlanStep | null = null;
  const allSteps: PlanStep[] = [];

  clusters.forEach((cluster, bandIdx) => {
    const nominalR = Number((cluster.sumR / cluster.holes.length).toFixed(1));

    // Match layer from ringRadii
    let matchingLayerName = 'Off-grid';
    if (ringRadii && ringRadii.length > 0) {
      let minDiff = Infinity;
      let closestIdx = -1;
      ringRadii.forEach((ri, idx) => {
        const diff = Math.abs(ri - nominalR);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = idx;
        }
      });
      if (minDiff <= 2.5 && closestIdx >= 0) {
        matchingLayerName = `L${closestIdx + 1}`;
      }
    }

    // Group holes in this band by table angle θ
    interface PlungeCluster {
      thetaDeg: number;
      holes: PlanHole[];
    }
    const plungeClusters: PlungeCluster[] = [];

    for (const h of cluster.holes) {
      const tableAngle = deriveTableAngle(h.a, h.head);
      let matchedPlunge: PlungeCluster | null = null;

      for (const p of plungeClusters) {
        const diff = Math.abs(norm360(p.thetaDeg) - norm360(tableAngle));
        const angDist = Math.min(diff, 360 - diff);
        if (angDist <= thetaToleranceDeg) {
          matchedPlunge = p;
          break;
        }
      }

      if (matchedPlunge) {
        matchedPlunge.holes.push(h);
      } else {
        plungeClusters.push({
          thetaDeg: tableAngle,
          holes: [h],
        });
      }
    }

    // Sort plunges within band by angle θ ascending (0° -> 360°)
    plungeClusters.sort((a, b) => a.thetaDeg - b.thetaDeg);

    const bandSteps: PlanStep[] = [];

    for (const pc of plungeClusters) {
      const heads = Array.from(new Set(pc.holes.map((h) => h.head))).sort() as Array<0 | 1 | 2>;
      const isFullTriad = heads.length === 3;

      let deltaR = 0;
      let deltaTheta = 0;
      let rPulses = 0;
      let thetaPulses = 0;

      if (previousStep) {
        deltaR = Number((nominalR - previousStep.rMm).toFixed(2));
        deltaTheta = Number(norm360(pc.thetaDeg - previousStep.thetaDeg).toFixed(2));

        if (Math.abs(deltaR) > 0.05) {
          rPulses = Math.max(1, Math.round(Math.abs(deltaR) / Math.max(0.1, stepRadialMm)));
        }
        if (deltaTheta > 0.05 && deltaTheta < 359.95) {
          thetaPulses = Math.max(1, Math.round(deltaTheta / Math.max(0.1, stepAngleDeg)));
        }
      }

      const step: PlanStep = {
        stepIndex: globalStepCounter++,
        bandIndex: bandIdx + 1,
        rMm: nominalR,
        thetaDeg: pc.thetaDeg,
        holes: pc.holes,
        holesCount: pc.holes.length,
        heads,
        isFullTriad,
        matchingLayerName,
        deltaR,
        deltaTheta,
        rPulses,
        thetaPulses,
      };

      bandSteps.push(step);
      allSteps.push(step);
      previousStep = step;
    }

    builtBands.push({
      bandIndex: bandIdx + 1,
      nominalR,
      holesCount: cluster.holes.length,
      plungesCount: bandSteps.length,
      matchingLayerName,
      steps: bandSteps,
    });
  });

  const totalRadialTravelMm =
    builtBands.length > 1
      ? Number((builtBands[0].nominalR - builtBands[builtBands.length - 1].nominalR).toFixed(1))
      : 0;

  return {
    bands: builtBands,
    steps: allSteps,
    totalHoles: holes.length,
    totalPlunges: allSteps.length,
    totalBands: builtBands.length,
    totalRadialTravelMm,
    yoYoReversalsEliminated: rawYoYoReversals,
  };
}

export interface PreviewPlanOptions {
  ringRadii: number[];
  nPoints: number;
  stepAngleDeg: number;
  stepRadialMm: number;
  layerFilter?: number;
  rToleranceMm?: number;
  thetaToleranceDeg?: number;
}

/**
 * Generates the theoretical planned grid holes for either all layers or a specific layer.
 * Correctly assigns 120° drill heads (0, 1, 2) to each angular position so that
 * buildExecutionPlan groups them into optimal 3-head simultaneous plunges.
 */
export function generatePreviewHoles(
  ringRadii: number[],
  nPoints: number,
  stepAngleDeg: number,
  layerFilter?: number
): PlanHole[] {
  if (!ringRadii || ringRadii.length === 0 || nPoints <= 0) {
    return [];
  }

  const generatedHoles: PlanHole[] = [];

  ringRadii.forEach((ri, layerIdx) => {
    if (layerFilter !== undefined && layerFilter !== layerIdx) {
      return;
    }

    // List all angular positions on this ring
    interface CandidatePoint {
      k: number;
      a: number;
    }

    const unvisited: CandidatePoint[] = [];
    for (let k = 0; k < nPoints; k++) {
      unvisited.push({
        k,
        a: Number(norm360(k * stepAngleDeg).toFixed(2)),
      });
    }

    // Group into 120° triads (heads 0, 1, 2)
    while (unvisited.length > 0) {
      const p0 = unvisited.shift()!;
      const theta = Number(norm360(-p0.a).toFixed(2));

      // Head 0 drills at p0.a
      generatedHoles.push({
        id: `preview-L${layerIdx + 1}-k${p0.k}-h0`,
        globalIndex: layerIdx * nPoints + p0.k + 1,
        layer: layerIdx,
        r: ri,
        a: p0.a,
        head: 0,
        drilledAt: 0,
      });

      // Theoretical tray angles that heads 1 and 2 would hit at table angle theta:
      // Invariant: a = norm360(head * 120 - theta)
      const a1Expected = Number(norm360(120 - theta).toFixed(2));
      const a2Expected = Number(norm360(240 - theta).toFixed(2));

      // Check if unvisited contains a point matching a1Expected
      const idx1 = unvisited.findIndex((p) => {
        const diff = Math.abs(norm360(p.a) - norm360(a1Expected));
        return Math.min(diff, 360 - diff) <= 0.75;
      });

      if (idx1 !== -1) {
        const p1 = unvisited.splice(idx1, 1)[0];
        generatedHoles.push({
          id: `preview-L${layerIdx + 1}-k${p1.k}-h1`,
          globalIndex: layerIdx * nPoints + p1.k + 1,
          layer: layerIdx,
          r: ri,
          a: p1.a,
          head: 1,
          drilledAt: 0,
        });
      }

      // Check if unvisited contains a point matching a2Expected
      const idx2 = unvisited.findIndex((p) => {
        const diff = Math.abs(norm360(p.a) - norm360(a2Expected));
        return Math.min(diff, 360 - diff) <= 0.75;
      });

      if (idx2 !== -1) {
        const p2 = unvisited.splice(idx2, 1)[0];
        generatedHoles.push({
          id: `preview-L${layerIdx + 1}-k${p2.k}-h2`,
          globalIndex: layerIdx * nPoints + p2.k + 1,
          layer: layerIdx,
          r: ri,
          a: p2.a,
          head: 2,
          drilledAt: 0,
        });
      }
    }
  });

  return generatedHoles;
}

/**
 * Builds an optimal execution plan directly from the planned geometric grid.
 * Operates even when no actual holes have been drilled yet (holes = []).
 */
export function buildPreviewPlan(options: PreviewPlanOptions): ExecutionPlan {
  const {
    ringRadii,
    nPoints,
    stepAngleDeg,
    stepRadialMm,
    layerFilter,
    rToleranceMm = 1.5,
    thetaToleranceDeg = 0.75,
  } = options;

  const previewHoles = generatePreviewHoles(ringRadii, nPoints, stepAngleDeg, layerFilter);

  return buildExecutionPlan(previewHoles, {
    stepRadialMm,
    stepAngleDeg,
    ringRadii,
    rToleranceMm,
    thetaToleranceDeg,
  });
}

