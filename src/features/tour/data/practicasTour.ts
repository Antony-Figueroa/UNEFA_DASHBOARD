import type { DriveStep } from "../types";

const t = (es: string) => es;

export const practicasPreEnrollTour: DriveStep[] = [
  {
    popover: {
      title: t("👋 Módulo de Prácticas Profesionales"),
      description: t(
        "Este módulo guía todo el ciclo: <b>Pre-Inscripción → Inscripción → Seguimiento → Evaluación</b>. Empecemos por la primera etapa."
      ),
      side: "center",
    },
  },
  {
    element: () => document.querySelector("h2"),
    popover: {
      title: t("📝 Pre-Inscripción"),
      description: t(
        "Acá los estudiantes registran su intención de cursar prácticas. Se selecciona período, tipo de práctica y carrera."
      ),
      side: "bottom",
    },
  },
  {
    element: () => document.querySelector('button:has(svg[class*="lucide"])') ?? document.querySelector("button:has(svg)"),
    popover: {
      title: t("➕ Nueva Pre-Inscripción"),
      description: t(
        "Creá una pre-inscripción seleccionando estudiante, carrera, tipo de práctica y período."
      ),
      side: "left",
    },
  },
  {
    element: () => document.querySelector("table"),
    popover: {
      title: t("📋 Pre-Inscripciones"),
      description: t(
        "Listado con estado (pendiente/aprobada/rechazada). Podés inscribir o eliminar masivamente."
      ),
      side: "top",
    },
  },
  {
    popover: {
      title: t("⏭️ Siguiente etapa"),
      description: t(
        "Una vez aprobada la pre-inscripción, pasá a <b>Inscripción</b> desde el menú lateral."
      ),
      side: "center",
    },
  },
];

export const practicasEnrollTour: DriveStep[] = [
  {
    popover: {
      title: t("📄 Inscripción"),
      description: t(
        "Acá se formaliza la inscripción del estudiante. Se asigna tutor, institución y fechas definitivas."
      ),
      side: "center",
    },
  },
  {
    element: () => document.querySelector("h2"),
    popover: {
      title: t("📄 Inscripción"),
      description: t(
        "Una vez aprobada la pre-inscripción, acá se completa el registro formal."
      ),
      side: "bottom",
    },
  },
  {
    element: () => document.querySelector('button:has(svg[class*="lucide"])') ?? document.querySelector("button:has(svg)"),
    popover: {
      title: t("➕ Nueva Inscripción"),
      description: t(
        "Inscribí a un estudiante completando empresa, tutor, tipo de práctica y fechas."
      ),
      side: "left",
    },
  },
  {
    element: () => document.querySelector("table"),
    popover: {
      title: t("📋 Inscripciones"),
      description: t(
        "Listado de inscripciones activas. Desde las acciones podés ver detalle o culminar."
      ),
      side: "top",
    },
  },
  {
    popover: {
      title: t("⏭️ Siguiente etapa"),
      description: t(
        "Durante la práctica se hace el seguimiento. Andá a <b>Seguimiento</b> en el menú lateral."
      ),
      side: "center",
    },
  },
];

export const practicasTrackingTour: DriveStep[] = [
  {
    popover: {
      title: t("👣 Seguimiento"),
      description: t(
        "Acá se controla el avance de cada práctica: <b>visitas del tutor</b> y <b>bitácora del estudiante</b>."
      ),
      side: "center",
    },
  },
  {
    element: () => document.querySelector("h2"),
    popover: {
      title: t("👣 Seguimiento"),
      description: t(
        "Tabla de todas las prácticas en curso con enlaces a visitas y actividades."
      ),
      side: "bottom",
    },
  },
  {
    element: () => document.querySelector("table"),
    popover: {
      title: t("📋 Seguimiento"),
      description: t(
        "Cada fila tiene enlaces a <b>Visitas</b> (registro del tutor) y <b>Actividades</b> (bitácora del estudiante)."
      ),
      side: "top",
    },
  },
  {
    popover: {
      title: t("🚗 Visitas"),
      description: t(
        "El tutor registra cada visita a la empresa con fecha, observaciones y estado."
      ),
      side: "center",
    },
  },
  {
    popover: {
      title: t("📓 Bitácora"),
      description: t(
        "El estudiante registra sus actividades. El tutor las revisa y da el visto bueno."
      ),
      side: "center",
    },
  },
  {
    popover: {
      title: t("⏭️ Etapa final"),
      description: t(
        "Completado el seguimiento, pasá a <b>Evaluaciones</b> desde el menú lateral."
      ),
      side: "center",
    },
  },
];

export const practicasEvalTour: DriveStep[] = [
  {
    popover: {
      title: t("⭐ Evaluaciones y Culminación"),
      description: t(
        "Etapa final del ciclo. Acá se registran las evaluaciones del estudiante y se formaliza la culminación de la práctica."
      ),
      side: "center",
    },
  },
  {
    element: () => document.querySelector("h2"),
    popover: {
      title: t("⭐ Evaluaciones"),
      description: t(
        "Listado de estudiantes listos para evaluar. Incluye criterios de evaluación y nota final."
      ),
      side: "bottom",
    },
  },
  {
    element: () => document.querySelector("table"),
    popover: {
      title: t("📋 Evaluaciones"),
      description: t(
        "Seleccioná un estudiante para cargar notas por criterio. Aprobado = acta de culminación generada."
      ),
      side: "top",
    },
  },
  {
    popover: {
      title: t("✅ Ciclo Completo"),
      description: t(
        "Recorriste las 4 etapas: <b>Pre-Inscripción → Inscripción → Seguimiento → Evaluación</b>. Las prácticas profesionales están 100% digitalizadas."
      ),
      side: "center",
    },
  },
];
