import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Timeline, TrayModel } from '../types';
import { stateAt } from '../core/timeline';

interface UseSimulationOptions {
  model: TrayModel;
  timeline: Timeline;
  initialSpeed?: number;
  onComplete?: () => void;
}

export function useSimulation({
  model,
  timeline,
  initialSpeed = 1,
  onComplete,
}: UseSimulationOptions) {
  const [simTimeMs, setSimTimeMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(initialSpeed);

  const speedRef = useRef(speed);
  speedRef.current = speed;
  const timelineRef = useRef(timeline);
  timelineRef.current = timeline;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const simState = useMemo(() => {
    return stateAt(simTimeMs, timeline, model);
  }, [simTimeMs, timeline, model]);

  // Simulation Animation Loop (Smooth 60 FPS without render cancellations)
  useEffect(() => {
    if (!isPlaying) return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(100, now - lastTime);
      lastTime = now;

      setSimTimeMs((prev) => {
        const curTotal = timelineRef.current.total;
        if (!curTotal || curTotal <= 0) return prev;
        const next = prev + dt * speedRef.current;
        if (next >= curTotal) {
          setIsPlaying(false);
          if (onCompleteRef.current) {
            onCompleteRef.current();
          }
          return curTotal;
        }
        return next;
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  const togglePlay = useCallback(() => {
    setSimTimeMs((prev) => {
      const curTotal = timelineRef.current.total;
      if (prev >= curTotal - 10) {
        return 0;
      }
      return prev;
    });
    setIsPlaying((prev) => !prev);
  }, []);

  const resetSim = useCallback(() => {
    setIsPlaying(false);
    setSimTimeMs(0);
  }, []);

  const scrubTime = useCallback((ms: number) => {
    setIsPlaying(false);
    setSimTimeMs(Math.max(0, Math.min(ms, timeline.total)));
  }, [timeline.total]);

  const stepNext = useCallback(() => {
    setIsPlaying(false);
    const nextAction = timeline.acts.find((a) => a.t0 > simTimeMs);
    if (nextAction) {
      setSimTimeMs(nextAction.t0);
    } else {
      setSimTimeMs(timeline.total);
    }
  }, [simTimeMs, timeline]);

  const stepPrev = useCallback(() => {
    setIsPlaying(false);
    const prevAction = [...timeline.acts]
      .reverse()
      .find((a) => a.t0 < simTimeMs - 50);
    if (prevAction) {
      setSimTimeMs(prevAction.t0);
    } else {
      setSimTimeMs(0);
    }
  }, [simTimeMs, timeline]);

  return {
    simTimeMs,
    setSimTimeMs,
    isPlaying,
    setIsPlaying,
    speed,
    setSpeed,
    simState,
    togglePlay,
    resetSim,
    scrubTime,
    stepNext,
    stepPrev,
  };
}
