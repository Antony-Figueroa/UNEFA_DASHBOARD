import { driver, type Driver } from "driver.js";
import "driver.js/dist/driver.css";
import type { DriveStep } from "../types";

let activeDriver: Driver | null = null;

const defaultConfig = {
  animate: true,
  overlayOpacity: 0.35,
  overlayColor: "#000",
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
};

export function createTour(steps: DriveStep[]) {
  destroyTour();
  activeDriver = driver({ ...defaultConfig, steps });
  return activeDriver;
}

export function startTour(steps: DriveStep[], startIndex = 0) {
  const d = createTour(steps);
  d.drive(startIndex);
  return d;
}

export function destroyTour() {
  if (activeDriver?.isActive()) activeDriver.destroy();
  activeDriver = null;
}
