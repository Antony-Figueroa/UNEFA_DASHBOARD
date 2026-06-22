import { useCallback, useEffect, useRef } from "react";
import type { DriveStep } from "../types";
import { startTour, destroyTour } from "../services/tourService";

export function useTour(steps: DriveStep[]) {
  const stepsRef = useRef(steps);
  stepsRef.current = steps;

  const start = useCallback((index = 0, onComplete?: () => void) => {
    startTour(stepsRef.current, index, onComplete);
  }, []);

  useEffect(() => () => destroyTour(), []);

  return { start };
}
