import type { DriveStep } from "../types";
import { gestionPeriodTour, gestionCarrerasTour } from "./gestionTour";
import { practicasPreEnrollTour, practicasEnrollTour, practicasTrackingTour, practicasEvalTour } from "./practicasTour";
import { registroEstudiantesTour, registroTutoresTour, registroInstitucionesTour } from "./registrosTour";

interface TourEntry {
  steps: DriveStep[];
  moduleName: string;
}

/**
 * Map of route patterns → tour steps + module name.
 * Key is a path prefix the route starts with.
 */
const tourRouteMap: Record<string, TourEntry> = {
  "/period":       { steps: gestionPeriodTour,       moduleName: "Periodos" },
  "/careers":      { steps: gestionCarrerasTour,     moduleName: "Carreras" },
  "/students":     { steps: registroEstudiantesTour, moduleName: "Estudiantes" },
  "/tutors":       { steps: registroTutoresTour,     moduleName: "Tutores" },
  "/institutions": { steps: registroInstitucionesTour, moduleName: "Instituciones" },
  "/pre-enrollment": { steps: practicasPreEnrollTour, moduleName: "Pre-Inscripción" },
  "/enrollment":   { steps: practicasEnrollTour,     moduleName: "Inscripción" },
  "/tracking":     { steps: practicasTrackingTour,   moduleName: "Seguimiento" },
  "/evaluations":  { steps: practicasEvalTour,       moduleName: "Evaluaciones" },
};

/** Find matching tour for a given path, or undefined. */
export function getTourForPath(path: string): { steps: DriveStep[]; moduleName: string } | undefined {
  if (tourRouteMap[path]) return tourRouteMap[path];
  const entry = Object.entries(tourRouteMap).find(([key]) => path.startsWith(key));
  return entry ? entry[1] : undefined;
}
