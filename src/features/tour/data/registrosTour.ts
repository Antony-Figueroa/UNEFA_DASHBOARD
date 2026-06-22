import type { DriveStep } from "../types";

const t = (es: string) => es;

export const gestionEstudiantesTour: DriveStep[] = [
  {
    popover: {
      title: t("Modulo de Estudiantes"),
      description: t(
        "Este modulo gestiona los datos personales y academicos de los estudiantes. Puede crear, editar, buscar, importar, exportar y administrar el estado de cada registro."
      ),
      side: "over",
    },
  },
  {
    element: () => document.querySelector("h2")!,
    popover: {
      title: t("Pagina de Estudiantes"),
      description: t(
        "Esta es la pagina principal de gestion de estudiantes. Desde aqui puede crear, importar y exportar registros, ademas de buscar y filtrar estudiantes."
      ),
      side: "bottom",
    },
  },
  {
    element: () => {
      const actions = document.querySelector("h2")?.closest("div")?.nextElementSibling;
      return (actions?.querySelector("button")) ? actions : document.querySelector("h2")!;
    },
    popover: {
      title: t("Botones de Accion"),
      description: t(
        "Acciones globales: <b>Reporte</b> genera un PDF del listado, <b>Importar</b> carga estudiantes desde Excel, <b>Exportacion</b> descarga la base en JSON/SQL/CSV/Excel y <b>Nuevo Estudiante</b> abre el formulario de registro manual."
      ),
      side: "left",
    },
  },
  {
    element: () => {
      const lists = document.querySelectorAll('[role="tablist"]');
      return Array.from(lists).find((tl) => tl.textContent?.includes("Activos")) ?? document.querySelector("h2")!;
    },
    popover: {
      title: t("Pestanas Activos / Inactivos"),
      description: t(
        "Alterna entre estudiantes Activos (vigentes) e Inactivos (archivados). Al desactivar un estudiante desde la tabla, se mueve automaticamente a Inactivos."
      ),
      side: "bottom",
    },
  },
  {
    element: () => document.querySelector('input[placeholder*="Buscar por cedula" i]')!,
    popover: {
      title: t("Busqueda y Filtros de Fecha"),
      description: t(
        "Busque estudiantes por cedula, nombre, telefono o correo. Use los filtros <b>Desde</b> y <b>Hasta</b> para acotar por rango de fecha de inscripcion."
      ),
      side: "bottom",
    },
  },
  {
    element: () => document.querySelector(".table-scrollbar") ?? document.querySelector("table")!,
    popover: {
      title: t("Tabla de Estudiantes"),
      description: t(
        "Cada fila representa un estudiante. Columnas: seleccion, cedula, nombres, telefono, estatus, correo y acciones. Use el icono <b>ojo</b> para ver detalles, <b>lapiz</b> para editar, <b>papelera</b> para eliminar y el icono <b>morado</b> para copiar a Pre-inscripcion."
      ),
      side: "top",
    },
  },
  {
    popover: {
      title: t("Fin del recorrido"),
      description: t(
        "Ha completado el recorrido del modulo de Estudiantes. Puede explorar Tutores o Instituciones desde el menu lateral."
      ),
      side: "over",
    },
  },
];

export const registroTutoresTour: DriveStep[] = [
  {
    popover: {
      title: t("Registros — Tutores"),
      description: t(
        "En esta seccion se gestionan los tutores academicos: datos personales, especialidad, institucion y carga horaria."
      ),
      side: "over",
    },
  },
  {
    element: () => document.querySelector("h2")!,
    popover: {
      title: t("Pagina de Tutores"),
      description: t(
        "Desde esta pagina se administran los tutores. Cada registro incluye datos personales, especialidad, institucion donde dicta clases y carga horaria."
      ),
      side: "bottom",
    },
  },
  {
    element: () => {
      const btns = document.querySelectorAll("button");
      return Array.from(btns).find((b) => b.textContent?.includes("Nuevo Tutor") || b.textContent?.includes("Agregar Tutor")) ?? document.querySelector('button:has(svg)')!;
    },
    popover: {
      title: t("Boton Nuevo Tutor"),
      description: t(
        "Haga clic aqui para abrir el formulario y registrar un nuevo tutor."
      ),
      side: "left",
    },
  },
];

export const registroInstitucionesTour: DriveStep[] = [
  {
    popover: {
      title: t("Registros — Instituciones"),
      description: t(
        "En esta seccion se gestionan las empresas e instituciones donde los estudiantes realizan sus practicas profesionales."
      ),
      side: "over",
    },
  },
  {
    element: () => document.querySelector("h2")!,
    popover: {
      title: t("Pagina de Instituciones"),
      description: t(
        "Desde esta pagina se administran las empresas o instituciones. Cada registro incluye nombre, RIF, direccion, contacto, telefono y correo."
      ),
      side: "bottom",
    },
  },
  {
    element: () => {
      const btns = document.querySelectorAll("button");
      return Array.from(btns).find((b) => b.textContent?.includes("Nueva Empre") || b.textContent?.includes("Agregar Responsable")) ?? document.querySelector('button:has(svg)')!;
    },
    popover: {
      title: t("Boton Nueva Institucion"),
      description: t(
        "Haga clic aqui para abrir el formulario y registrar una nueva empresa o institucion."
      ),
      side: "left",
    },
  },
];
