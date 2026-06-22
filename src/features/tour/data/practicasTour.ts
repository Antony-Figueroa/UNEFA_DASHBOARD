import type { DriveStep } from "../types";

const t = (es: string) => es;

export const practicasPreEnrollTour: DriveStep[] = [
  {
    popover: {
      title: t("Practicas Profesionales"),
      description: t(
        "Este modulo abarca el ciclo completo: Pre-Inscripcion, Inscripcion, Seguimiento y Evaluacion de las practicas profesionales. Comenzaremos por la primera etapa."
      ),
      side: "over",
    },
  },
  {
    element: () => document.querySelector("h2")!,
    popover: {
      title: t("Pagina de Pre-Inscripcion"),
      description: t(
        "Los estudiantes registran su intencion de cursar las practicas profesionales seleccionando el periodo academico, el tipo de practica y la carrera."
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
      title: t("Boton Nueva Pre-Inscripcion"),
      description: t(
        "Haga clic aqui para abrir el formulario y crear una nueva pre-inscripcion."
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
        "Una vez aprobada la pre-inscripcion, continue con la Inscripcion desde el menu lateral."
      ),
      side: "over",
    },
  },
];

export const practicasEnrollTour: DriveStep[] = [
  {
    popover: {
      title: t("Inscripcion"),
      description: t(
        "En esta etapa se formaliza la inscripcion del estudiante. Se asigna el tutor academico, la institucion y las fechas definitivas de la practica."
      ),
      side: "over",
    },
  },
  {
    element: () => document.querySelector("h2")!,
    popover: {
      title: t("Pagina de Inscripcion"),
      description: t(
        "Una vez aprobada la pre-inscripcion, aqui se completa el registro formal de la practica."
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
      title: t("Boton Nueva Inscripcion"),
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
        "En esta seccion se controla el avance de cada practica: las visitas del tutor a la empresa y la bitacora de actividades del estudiante."
      ),
      side: "over",
    },
  },
  {
    element: () => document.querySelector("h2")!,
    popover: {
      title: t("Pagina de Seguimiento"),
      description: t(
        "Tabla de todas las practicas en curso con enlaces a las visitas y al registro de actividades."
      ),
      side: "bottom",
    },
  },
  {
    element: () => document.querySelector("table")!,
    popover: {
      title: t("Tabla de Seguimiento"),
      description: t(
        "Cada fila contiene enlaces a Visitas (registro del tutor en la empresa) y Actividades (bitacora del estudiante)."
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
      title: t("Bitacora de Actividades"),
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
        "Etapa final del ciclo de practicas profesionales. Aqui se registran las evaluaciones del estudiante y se formaliza la culminacion."
      ),
      side: "over",
    },
  },
  {
    element: () => document.querySelector("h2")!,
    popover: {
      title: t("Pagina de Evaluaciones"),
      description: t(
        "Listado de estudiantes listos para evaluar con sus criterios de evaluacion y nota final."
      ),
      side: "bottom",
    },
  },
  {
    element: () => document.querySelector("table")!,
    popover: {
      title: t("Tabla de Evaluaciones"),
      description: t(
        "Seleccione un estudiante para cargar las notas por criterio. Si aprueba, se genera el acta de culminacion."
      ),
      side: "top",
    },
  },
  {
    popover: {
      title: t("Ciclo completado"),
      description: t(
        "Ha recorrido las 4 etapas: Pre-Inscripcion, Inscripcion, Seguimiento y Evaluacion. Todo el proceso de practicas profesionales esta digitalizado en el sistema."
      ),
      side: "over",
    },
  },
];
