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
      title: t("Modulo de Gestion"),
      description: t(
        "Este modulo contiene los datos maestros del sistema: Periodos Academicos y Carreras. Todo el flujo de practicas profesionales (pre-inscripcion, inscripcion, seguimiento y evaluaciones) depende directamente de estos registros."
      ),
      side: "over",
    },
  },
  {
    element: () => document.querySelector("h2")!,
    popover: {
      title: t("Pagina de Periodos"),
      description: t(
        "Esta es la pagina principal de gestion de periodos. Desde aqui podra crear, editar, activar, culminar y desactivar los lapsos academicos del sistema."
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
      title: t("Boton Nuevo Periodo"),
      description: t(
        "Haga clic aqui para abrir el formulario y crear un nuevo periodo academico. Debera completar codigo, descripcion, fechas, tipo y dias de gracia."
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
      title: t("Pestanas Activos / Inactivos"),
      description: t(
        "Estas pestanas permiten alternar entre los periodos Activos (los que estan vigentes) y los Inactivos (periodos archivados). Al desactivar un periodo desde la tabla, se mueve automaticamente a Inactivos."
      ),
      side: "bottom",
    },
  },
  {
    element: () => document.querySelector('input[placeholder*="Buscar periodo" i]')!,
    popover: {
      title: t("Busqueda y Filtros"),
      description: t(
        "Filtre los periodos escribiendo en el campo de busqueda. Tambien puede usar el selector de estado (Pendiente, En Curso, Culminado) que se encuentra a la derecha para acotar los resultados."
      ),
      side: "bottom",
    },
  },
  {
    element: () => document.querySelector("table")!,
    popover: {
      title: t("Tabla de Periodos"),
      description: t(
        "Cada fila representa un periodo. Las columnas muestran: nombre del lapso, fecha de inicio, fecha de fin, barra de progreso (si esta En Curso), estado actual y las acciones disponibles.<br><br>Puede seleccionar varias filas con los checkboxes para realizar acciones masivas como eliminar o restaurar."
      ),
      side: "top",
    },
  },
  {
    popover: {
      title: t("Fin del recorrido"),
      description: t(
        "Estos son los elementos principales de la pagina de Periodos. Puede visitar Carreras desde el menu lateral para continuar con el modulo de Gestion, o explorar Registros y Practicas Profesionales."
      ),
      side: "over",
    },
  },
];

export const gestionCarrerasTour: DriveStep[] = [
  {
    popover: {
      title: t("Modulo de Gestion"),
      description: t(
        "Este modulo administra los datos maestros del sistema: Periodos Academicos y Carreras."
      ),
      side: "over",
    },
  },
  {
    element: () => document.querySelector("h2")!,
    popover: {
      title: t("Pagina de Carreras"),
      description: t(
        "Desde esta pagina se gestionan las carreras universitarias: nombre, codigo, modalidad (presencial o semi-presencial), nucleo y estado."
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
      title: t("Boton Nueva Carrera"),
      description: t(
        "Haga clic aqui para abrir el formulario de creacion de una nueva carrera."
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
      title: t("Pestanas Activas / Inactivas"),
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
        "Listado completo de carreras con columnas de nombre, codigo, modalidad, nucleo y acciones para editar o desactivar cada registro."
      ),
      side: "top",
    },
  },
  {
    popover: {
      title: t("Fin del recorrido"),
      description: t(
        "Ha completado el recorrido del modulo de Gestion. Puede explorar Registros o Practicas Profesionales desde el menu lateral."
      ),
      side: "over",
    },
  },
];
