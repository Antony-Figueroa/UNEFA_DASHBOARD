import type { DriveStep } from "../types";

const t = (es: string) => es;

export const gestionEstudiantesTour: DriveStep[] = [
  {
    popover: {
      title: t("Módulo de Estudiantes"),
      description: t(
        "Este módulo gestiona los datos personales y académicos de los estudiantes. Puede crear, editar, buscar, importar, exportar y administrar el estado de cada registro."
      ),
      side: "over",
    },
  },
  {
    element: () => document.querySelector("h2")!,
    popover: {
      title: t("Página de Estudiantes"),
      description: t(
        "Esta es la página principal de gestión de estudiantes. Desde aquí puede crear, importar y exportar registros, además de buscar y filtrar estudiantes."
      ),
      side: "bottom",
    },
  },
  {
    element: () => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) => b.textContent?.includes("Nuevo Estudiante"));
      return btn?.parentElement ?? document.querySelector("h2")!;
    },
    popover: {
      title: t("Botones de Acción Global"),
      description: t(
        "Acciones globales: <b>Reporte</b> genera un PDF del listado, <b>Importar</b> carga estudiantes desde Excel, <b>Exportación</b> descarga la base en JSON/SQL/CSV/Excel y <b>Nuevo Estudiante</b> abre el formulario de registro manual."
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
      title: t("Pestañas Activos / Inactivos"),
      description: t(
        "Alterna entre estudiantes Activos (vigentes) e Inactivos (archivados). Al desactivar un estudiante desde la tabla, se mueve automaticamente a Inactivos."
      ),
      side: "bottom",
    },
  },
  {
    element: () => document.querySelector('input[placeholder*="Buscar por cédula" i]')!,
    popover: {
      title: t("Búsqueda y Filtros de Fecha"),
      description: t(
        "Busque estudiantes por cédula, nombre, teléfono o correo. Use los filtros <b>Desde</b> y <b>Hasta</b> para acotar por rango de fecha de inscripción."
      ),
      side: "bottom",
    },
  },
  {
    element: () => document.querySelector(".table-scrollbar") ?? document.querySelector("table")!,
    popover: {
      title: t("Tabla de Estudiantes"),
      description: t(
        "Cada fila representa un estudiante. Columnas: selección, cédula, nombres, teléfono, estatus, correo y acciones. Use el icono <b>ojo</b> para ver detalles, <b>lápiz</b> para editar, <b>papelera</b> para eliminar y el icono <b>morado</b> para copiar a Pre-inscripción."
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
        "En esta sección se gestionan los tutores académicos: datos personales, especialidad, institución y carga horaria."
      ),
      side: "over",
    },
  },
  {
    element: () => document.querySelector("h2")!,
    popover: {
      title: t("Página de Tutores"),
      description: t(
        "Desde esta página se administran los tutores. Cada registro incluye datos personales, especialidad, institución donde dicta clases y carga horaria."
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
      title: t("Botón Nuevo Tutor"),
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
        "En esta sección se gestionan las empresas e instituciones donde los estudiantes realizan sus prácticas profesionales."
      ),
      side: "over",
    },
  },
  {
    element: () => document.querySelector("h2")!,
    popover: {
      title: t("Página de Instituciones"),
      description: t(
        "Desde esta página se administran las empresas o instituciones. Cada registro incluye nombre, RIF, dirección, contacto, teléfono y correo."
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
      title: t("Botón Nueva Institución"),
      description: t(
        "Haga clic aquí para abrir el formulario y registrar una nueva empresa o institución."
      ),
      side: "left",
    },
  },
];
