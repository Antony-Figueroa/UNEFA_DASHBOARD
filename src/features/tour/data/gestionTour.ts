import type { DriveStep } from "../types";

const t = (es: string) => es;

/** True when the page shows the "Carreras" sub-tab (not "Tipos de Prácticas") */
function isCarrerasTab(): boolean {
  const btns = document.querySelectorAll("button");
  return Array.from(btns).some((b) => b.textContent?.includes("Nueva Carrera"));
}

/** Fallback element for Carreras tour when user is on the wrong sub-tab */
function h2OrBody(): Element {
  return document.querySelector("h2") ?? document.body;
}

export const gestionPeriodTour: DriveStep[] = [
  {
    popover: {
      title: t("Módulo de Gestión"),
      description: t(
        "Este módulo contiene los datos maestros del sistema: Períodos Académicos y Carreras. Todo el flujo de prácticas profesionales (pre-inscripción, inscripción, seguimiento y evaluaciones) depende directamente de estos registros."
      ),
      side: "over",
    },
  },
  {
    element: () => document.querySelector("h2")!,
    popover: {
      title: t("Página de Períodos"),
      description: t(
        "Esta es la página principal de gestión de períodos. Desde aquí podrá crear, editar, activar, culminar y desactivar los lapsos académicos del sistema."
      ),
      side: "bottom",
    },
  },
  {
    element: () => {
      const btns = document.querySelectorAll("button");
      return Array.from(btns).find((b) => b.textContent?.includes("Nuevo Per"))!;
    },
    popover: {
      title: t("Botón Nuevo Período"),
      description: t(
        "Haga clic aquí para abrir el formulario y crear un nuevo período académico. Deberá completar código, descripción, fechas, tipo y días de gracia."
      ),
      side: "left",
    },
  },
  {
    element: () => {
      const lists = document.querySelectorAll('[role="tablist"]');
      return Array.from(lists).find((tl) => tl.textContent?.includes("Activos"))!;
    },
    popover: {
      title: t("Pestañas Activos / Inactivos"),
      description: t(
        "Estas pestañas permiten alternar entre los períodos Activos (los que están vigentes) y los Inactivos (períodos archivados). Al desactivar un período desde la tabla, se mueve automáticamente a Inactivos."
      ),
      side: "bottom",
    },
  },
  {
    element: () => document.querySelector('input[placeholder*="Buscar periodo" i]')!,
    popover: {
      title: t("Búsqueda y Filtros"),
      description: t(
        "Filtre los períodos escribiendo en el campo de búsqueda. También puede usar el selector de estado (Pendiente, En Curso, Culminado) que se encuentra a la derecha para acotar los resultados."
      ),
      side: "bottom",
    },
  },
  {
    element: () => document.querySelector("table")!,
    popover: {
      title: t("Tabla de Períodos"),
      description: t(
        "Cada fila representa un período. Las columnas muestran: nombre del lapso, fecha de inicio, fecha de fin, barra de progreso (si está En Curso), estado actual y las acciones disponibles.<br><br>Puede seleccionar varias filas con los checkboxes para realizar acciones masivas como eliminar o restaurar."
      ),
      side: "top",
    },
  },
  {
    popover: {
      title: t("Fin del recorrido"),
      description: t(
        "Estos son los elementos principales de la página de Períodos. Puede visitar Carreras desde el menú lateral para continuar con el módulo de Gestión, o explorar Registros y Prácticas Profesionales."
      ),
      side: "over",
    },
  },
];

export const gestionCarrerasTour: DriveStep[] = [
  {
    popover: {
      title: t("Módulo de Gestión"),
      description: t(
        "Este módulo administra los datos maestros del sistema: Períodos Académicos y Carreras."
      ),
      side: "over",
    },
  },
  {
    element: () => document.querySelector("h2")!,
    popover: {
      title: t("Página de Carreras"),
      description: t(
        "Desde esta página se gestionan las carreras universitarias: nombre, código, modalidad (presencial o semipresencial), núcleo y estado."
      ),
      side: "bottom",
    },
  },
  {
    element: () => {
      if (!isCarrerasTab()) return h2OrBody();
      const btns = document.querySelectorAll("button");
      return Array.from(btns).find((b) => b.textContent?.includes("Nueva Carrera")) ?? h2OrBody();
    },
    popover: {
      title: t("Botón Nueva Carrera"),
      description: t(
        "Haga clic aquí para abrir el formulario de creación de una nueva carrera."
      ),
      side: "left",
    },
  },
  {
    element: () => {
      if (!isCarrerasTab()) return h2OrBody();
      const lists = document.querySelectorAll('[role="tablist"]');
      return Array.from(lists).find((tl) => tl.textContent?.includes("Activos")) ?? h2OrBody();
    },
    popover: {
      title: t("Pestañas Activas / Inactivas"),
      description: t(
        "Alterna entre carreras Activas (vigentes) e Inactivas (archivadas)."
      ),
      side: "bottom",
    },
  },
  {
    element: () => {
      if (!isCarrerasTab()) return h2OrBody();
      return document.querySelector("table") ?? h2OrBody();
    },
    popover: {
      title: t("Tabla de Carreras"),
      description: t(
        "Listado completo de carreras con columnas de nombre, código, modalidad, núcleo y acciones para editar o desactivar cada registro."
      ),
      side: "top",
    },
  },
  {
    popover: {
      title: t("Fin del recorrido"),
      description: t(
        "Ha completado el recorrido del módulo de Gestión. Puede explorar Registros o Prácticas Profesionales desde el menú lateral."
      ),
      side: "over",
    },
  },
];
