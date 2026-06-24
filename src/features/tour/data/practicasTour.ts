import type { DriveStep } from "../types";

const t = (es: string) => es;

export const practicasPreEnrollTour: DriveStep[] = [
  {
    popover: {
      title: t("Prácticas Profesionales"),
      description: t(
        "Este módulo abarca el ciclo completo: Pre-Inscripción, Inscripción, Seguimiento y Evaluación de las prácticas profesionales. Comenzaremos por la primera etapa."
      ),
      side: "over",
    },
  },
  {
    element: () => document.querySelector("h2")!,
    popover: {
      title: t("Página de Pre-Inscripción"),
      description: t(
        "Los estudiantes registran su intención de cursar las prácticas profesionales seleccionando el período académico, el tipo de práctica y la carrera."
      ),
      side: "bottom",
    },
  },
  {
    element: () => {
      const btns = document.querySelectorAll("button");
      return Array.from(btns).find((b) => b.textContent?.includes("Pre-Inscrip") || b.textContent?.includes("Nuevo")) ?? document.querySelector("table")!;
    },
    popover: {
      title: t("Botón Nueva Pre-Inscripción"),
      description: t(
        "Haga clic aquí para abrir el formulario y crear una nueva pre-inscripción."
      ),
      side: "left",
    },
  },
  {
    element: () => document.querySelector("table")!,
    popover: {
      title: t("Listado de Pre-Inscripciones"),
      description: t(
        "Tabla con las pre-inscripciones registradas. Cada fila muestra el estado (pendiente, aprobada o rechazada) y permite realizar acciones masivas."
      ),
      side: "top",
    },
  },
  {
    popover: {
      title: t("Etapa siguiente"),
      description: t(
        "Una vez aprobada la pre-inscripción, continúe con la Inscripción desde el menú lateral."
      ),
      side: "over",
    },
  },
];

export const practicasEnrollTour: DriveStep[] = [
  {
    popover: {
      title: t("Inscripción"),
      description: t(
        "En esta etapa se formaliza la inscripción del estudiante. Se asigna el tutor académico, la institución y las fechas definitivas de la práctica."
      ),
      side: "over",
    },
  },
  {
    element: () => document.querySelector("h2")!,
    popover: {
      title: t("Página de Inscripción"),
      description: t(
        "Una vez aprobada la pre-inscripción, aquí se completa el registro formal de la práctica."
      ),
      side: "bottom",
    },
  },
  {
    element: () => {
      const btns = document.querySelectorAll("button");
      return Array.from(btns).find((b) => b.textContent?.includes("Nueva Inscrip") || b.textContent?.includes("Nuevo")) ?? document.querySelector("table")!;
    },
    popover: {
      title: t("Botón Nueva Inscripción"),
      description: t(
        "Haga clic aqui para abrir el formulario e inscribir a un nuevo estudiante."
      ),
      side: "left",
    },
  },
  {
    element: () => document.querySelector("table")!,
    popover: {
      title: t("Inscripciones Activas"),
      description: t(
        "Listado de inscripciones activas. Desde las acciones de cada fila puede ver el detalle o culminar la practica."
      ),
      side: "top",
    },
  },
  {
    popover: {
      title: t("Etapa siguiente"),
      description: t(
        "Durante la practica se realiza el seguimiento. Acceda a Seguimiento desde el menu lateral."
      ),
      side: "over",
    },
  },
];

export const practicasTrackingTour: DriveStep[] = [
  {
    popover: {
      title: t("Seguimiento"),
      description: t(
        "En esta sección se controla el avance de cada práctica: las visitas del tutor a la empresa y la bitácora de actividades del estudiante."
      ),
      side: "over",
    },
  },
  {
    element: () => document.querySelector("h2")!,
    popover: {
      title: t("Página de Seguimiento"),
      description: t(
        "Tabla de todas las prácticas en curso con enlaces a las visitas y al registro de actividades."
      ),
      side: "bottom",
    },
  },
  {
    element: () => document.querySelector("table")!,
    popover: {
      title: t("Tabla de Seguimiento"),
      description: t(
        "Cada fila contiene enlaces a Visitas (registro del tutor en la empresa) y Actividades (bitácora del estudiante)."
      ),
      side: "top",
    },
  },
  {
    popover: {
      title: t("Registro de Visitas"),
      description: t(
        "El tutor registra cada visita a la empresa indicando fecha, observaciones y estado."
      ),
      side: "over",
    },
  },
  {
    popover: {
      title: t("Bitácora de Actividades"),
      description: t(
        "El estudiante registra sus actividades diarias o semanales. El tutor las revisa y da el visto bueno."
      ),
      side: "over",
    },
  },
  {
    popover: {
      title: t("Etapa final"),
      description: t(
        "Completado el seguimiento, acceda a Evaluaciones desde el menu lateral."
      ),
      side: "over",
    },
  },
];

export const practicasEvalTour: DriveStep[] = [
  {
    popover: {
      title: t("Evaluaciones"),
      description: t(
        "Etapa final del ciclo de prácticas profesionales. Aquí se registran las evaluaciones del estudiante y se formaliza la culminación."
      ),
      side: "over",
    },
  },
  {
    element: () => document.querySelector("h2")!,
    popover: {
      title: t("Página de Evaluaciones"),
      description: t(
        "Listado de estudiantes listos para evaluar con sus criterios de evaluación y nota final."
      ),
      side: "bottom",
    },
  },
  {
    element: () => document.querySelector("table")!,
    popover: {
      title: t("Tabla de Evaluaciones"),
      description: t(
        "Seleccione un estudiante para cargar las notas por criterio. Si aprueba, se genera el acta de culminación."
      ),
      side: "top",
    },
  },
  {
    popover: {
      title: t("Ciclo completado"),
      description: t(
        "Ha recorrido las 4 etapas: Pre-Inscripción, Inscripción, Seguimiento y Evaluación. Todo el proceso de prácticas profesionales está digitalizado en el sistema."
      ),
      side: "over",
    },
  },
];
