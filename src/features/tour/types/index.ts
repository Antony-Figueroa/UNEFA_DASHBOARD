import type { DriveStep, Side, AllowedButtons } from "driver.js";

export type { DriveStep, Side, AllowedButtons };

export interface TourDefinition {
  name: string;
  steps: DriveStep[];
  routes: string[];
}
