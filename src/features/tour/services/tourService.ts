import { driver, type Driver } from "driver.js";
import "driver.js/dist/driver.css";
import type { DriveStep, AllowedButtons } from "../types";

let activeDriver: Driver | null = null;
let _onComplete: (() => void) | null = null;
let _closedEarly = false;

const defaultConfig = {
  animate: true,
  overlayOpacity: 0.35,
  overlayColor: "#000",
  smoothScroll: true,
  stagePadding: 6,
  stageRadius: 10,
  showProgress: true,
  progressText: "Paso {{current}} de {{total}}",
  nextBtnText: "Siguiente →",
  prevBtnText: "← Anterior",
  doneBtnText: "Finalizar",
  popoverClass: "unefa-tour-popover",
  allowClose: true,
  allowKeyboardControl: true,
  onCloseClick: () => {
    _closedEarly = true;
  },
  onHighlightStarted: () => {
    document.body.style.overflow = "hidden";
  },
  onDestroyed: () => {
    document.body.style.overflow = "";
    if (!_closedEarly && _onComplete) {
      const cb = _onComplete;
      _onComplete = null;
      setTimeout(cb, 0);
    }
  },
};

export function createTour(steps: DriveStep[]) {
  destroyTour();
  // Hide "Anterior" button on first step
  const processed = steps.map((step, i) => {
    if (i === 0 && step.popover) {
      return { ...step, popover: { ...step.popover, showButtons: ["next", "close"] as AllowedButtons[] } };
    }
    return step;
  });
  activeDriver = driver({ ...defaultConfig, steps: processed });
  return activeDriver;
}

export function startTour(steps: DriveStep[], startIndex = 0, onComplete?: () => void) {
  _closedEarly = false;
  // createTour calls destroyTour which resets _onComplete, so set AFTER
  const d = createTour(steps);
  _onComplete = onComplete ?? null;
  d.drive(startIndex);
  return d;
}

export function destroyTour() {
  _onComplete = null;
  if (activeDriver?.isActive()) activeDriver.destroy();
  activeDriver = null;
}
