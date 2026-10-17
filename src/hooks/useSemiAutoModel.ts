import { useMemo } from 'react';
import { norm360 } from '../core/model';
import { TrayModel, SimulationState, Point } from '../types';
import { UseSemiAutoSessionReturn } from './useSemiAutoSession';

export interface UseSemiAutoModelResult {
  semiAutoModel: TrayModel;
  semiAutoState: SimulationState;
}

export function useSemiAutoModel(session: UseSemiAutoSessionReturn): UseSemiAutoModelResult {
  const {
    layersCount,
    ringRadii,
    nPoints,
    stepAngleDeg,
    holes,
    R,
    toolRadius,
    r1,
    rLastR,
    sMm,
    numberingMode,
    executionPlan,
    camPlaybackStep,
    thetaDeg,
    rMm,
    plungeDown,
    currentLayer,
    spindleOn,
    activePlaybackStep,
  } = session;

  const semiAutoModel: TrayModel = useMemo(() => {
    const allPts: Point[] = [];
    const layerPtsMap: Point[][] = Array.from({ length: layersCount }, () => []);

    const holeToStepMap = new Map<string, { stepIndex: number; bandIndex: number }>();
    executionPlan.steps.forEach((st) => {
      st.holes.forEach((h) => {
        holeToStepMap.set(h.id, { stepIndex: st.stepIndex, bandIndex: st.bandIndex });
      });
    });

    ringRadii.forEach((ri, i) => {
      for (let k = 0; k < nPoints; k++) {
        const a = norm360(k * stepAngleDeg);
        const globalIndex = i * nPoints + k + 1;
        const pointK = numberingMode === 'global' ? globalIndex - 1 : k;

        const matchingHole = holes.find((h) => {
          const rMatch = Math.abs(h.r - ri) < 2.0;
          const aDiff = Math.abs(norm360(h.a) - a);
          const aMatch = Math.min(aDiff, 360 - aDiff) < 0.75;
          return rMatch && aMatch;
        });

        const rad = (a * Math.PI) / 180;

        if (matchingHole) {
          const stepInfo = holeToStepMap.get(matchingHole.id);
          let pointLabel: string | undefined;
          if (numberingMode === 'cam') {
            pointLabel = stepInfo ? `${stepInfo.stepIndex}` : String(pointK + 1);
          } else if (numberingMode === 'global') {
            pointLabel = String(globalIndex);
          } else {
            pointLabel = String(k + 1);
          }

          let camStatus: 'active' | 'done' | 'pending' | undefined;
          let isCamActive = false;
          if (camPlaybackStep !== null && stepInfo) {
            if (stepInfo.stepIndex === camPlaybackStep) {
              camStatus = 'active';
              isCamActive = true;
            } else if (stepInfo.stepIndex < camPlaybackStep) {
              camStatus = 'done';
            } else {
              camStatus = 'pending';
            }
          }

          const pt: Point = {
            x: ri * Math.cos(rad),
            y: ri * Math.sin(rad),
            a: matchingHole.a,
            layer: i,
            k: pointK,
            head: matchingHole.head,
            j: 0,
            bad: false,
            fired: true,
            label: pointLabel,
            camStatus,
            isCamActive,
          };
          layerPtsMap[i].push(pt);
          allPts.push(pt);
        } else {
          const ghostLabel = numberingMode === 'global' ? String(globalIndex) : String(k + 1);
          const pt: Point = {
            x: ri * Math.cos(rad),
            y: ri * Math.sin(rad),
            a,
            layer: i,
            k: pointK,
            head: 0,
            j: 0,
            bad: false,
            fired: false,
            label: ghostLabel,
          };
          layerPtsMap[i].push(pt);
          allPts.push(pt);
        }
      }
    });

    holes.forEach((h, hIdx) => {
      const isAccounted = allPts.some(
        (p) =>
          p.fired &&
          Math.abs(p.x - h.r * Math.cos((h.a * Math.PI) / 180)) < 0.5 &&
          Math.abs(p.y - h.r * Math.sin((h.a * Math.PI) / 180)) < 0.5
      );
      if (!isAccounted) {
        const rad = (h.a * Math.PI) / 180;
        let targetLayerIdx = 0;
        let minDiff = Infinity;
        ringRadii.forEach((rk, idx) => {
          const diff = Math.abs(rk - h.r);
          if (diff < minDiff) {
            minDiff = diff;
            targetLayerIdx = idx;
          }
        });

        const stepInfo = holeToStepMap.get(h.id);
        let pointLabel: string | undefined;
        if (numberingMode === 'cam') {
          pointLabel = stepInfo ? `${stepInfo.stepIndex}` : String(hIdx + 1);
        } else if (numberingMode === 'global') {
          pointLabel = String(layersCount * nPoints + hIdx + 1);
        } else {
          pointLabel = String((hIdx % nPoints) + 1);
        }

        let camStatus: 'active' | 'done' | 'pending' | undefined;
        let isCamActive = false;
        if (camPlaybackStep !== null && stepInfo) {
          if (stepInfo.stepIndex === camPlaybackStep) {
            camStatus = 'active';
            isCamActive = true;
          } else if (stepInfo.stepIndex < camPlaybackStep) {
            camStatus = 'done';
          } else {
            camStatus = 'pending';
          }
        }

        const pt: Point = {
          x: h.r * Math.cos(rad),
          y: h.r * Math.sin(rad),
          a: h.a,
          layer: targetLayerIdx,
          k: numberingMode === 'global' ? layersCount * nPoints + hIdx : (hIdx % nPoints),
          head: h.head,
          j: 0,
          bad: false,
          fired: true,
          label: pointLabel,
          camStatus,
          isCamActive,
        };
        layerPtsMap[targetLayerIdx]?.push(pt);
        allPts.push(pt);
      }
    });

    return {
      R,
      toolR: toolRadius,
      r1,
      rLast: rLastR,
      d1: r1 * 2,
      dLast: rLastR * 2,
      radialStepMm: sMm,
      layers: ringRadii.map((ri, i) => ({
        i,
        r: ri,
        n: nPoints,
        per: Math.round(nPoints / 3),
        step: stepAngleDeg,
        off: 0,
        pts: layerPtsMap[i] || [],
        minD: 0,
        bad: 0,
      })),
      all: allPts,
      minD: 0,
      badCount: 0,
      warns: [],
      totalPts: layersCount * nPoints,
      totalDrilled: holes.length,
      totalSteps: 1,
      hasErr: false,
      hasWarn: false,
    };
  }, [
    layersCount,
    ringRadii,
    nPoints,
    stepAngleDeg,
    holes,
    R,
    toolRadius,
    r1,
    rLastR,
    sMm,
    numberingMode,
    executionPlan,
    camPlaybackStep,
  ]);

  const semiAutoState: SimulationState = useMemo(() => {
    const effectiveTheta = activePlaybackStep ? activePlaybackStep.thetaDeg : thetaDeg;
    const effectiveR = activePlaybackStep ? activePlaybackStep.rMm : rMm;
    const isPlungingOrStepActive = plungeDown || activePlaybackStep !== null;

    return {
      theta: effectiveTheta,
      headR: effectiveR,
      counts: ringRadii.map(() => 99999),
      cur: {
        type: isPlungingOrStepActive ? 'fire' : 'index',
        t0: 0,
        d: 0,
        layer: activePlaybackStep ? Math.max(0, activePlaybackStep.bandIndex - 1) : currentLayer,
        j: isPlungingOrStepActive ? 3 : 0,
        r0: effectiveR,
        r1: effectiveR,
        th0: effectiveTheta,
        th1: effectiveTheta,
        fired: spindleOn || activePlaybackStep !== null,
      },
      done: false,
      u: isPlungingOrStepActive ? 1 : 0.8,
    };
  }, [
    activePlaybackStep,
    thetaDeg,
    rMm,
    ringRadii,
    plungeDown,
    currentLayer,
    spindleOn,
  ]);

  return {
    semiAutoModel,
    semiAutoState,
  };
}
