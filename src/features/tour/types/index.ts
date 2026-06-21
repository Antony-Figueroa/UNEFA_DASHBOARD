import type { DriveStep } from "driver.js";

export type { DriveStep };

export interface TourDefinition {
  name: string;
  steps: DriveStep[];
  routes: string[];
}
