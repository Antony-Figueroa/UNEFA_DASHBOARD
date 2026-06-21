import type { DriveStep } from "../types";

const t = (es: string) => es;

export const registroEstudiantesTour: DriveStep[] = [
  {
    popover: {
      title: t("👤 Módulo de Registros"),
      description: t(
        "Acá se administran los <b>Estudiantes</b>, <b>Tutores</b> e <b>Instituciones</b> que participan en las prácticas profesionales."
      ),
      side: "center",
    },
  },
  {
    element: () => document.querySelector("h2"),
    popover: {
      title: t("👤 Estudiantes"),
      description: t(
        "Listado completo del alumnado. Podés crear, editar, importar desde Excel y hacer pre-inscripciones masivas."
      ),
      side: "bottom",
    },
  },
  {
    element: () => document.querySelector('button:has(svg[class*="lucide"])') ?? document.querySelector("button:has(svg)"),
    popover: {
      title: t("➕ Agregar Estudiante"),
      description: t(
        "Registrá un nuevo estudiante con datos personales, identificación, contacto e información académica."
      ),
      side: "left",
    },
  },
  {
    element: () => document.querySelector('[role="tablist"]'),
    popover: {
      title: t("📂 Filtros"),
      description: t(
        "Alterná entre estudiantes <b>Activos</b> e <b>Inactivos</b>."
      ),
      side: "bottom",
    },
  },
  {
    element: () => document.querySelector('input[placeholder*="Buscar" i]'),
    popover: {
      title: t("🔍 Búsqueda"),
      description: t(
        "Buscá estudiantes por nombre, cédula o cualquier campo."
      ),
      side: "bottom",
    },
  },
  {
    element: () => document.querySelector("table"),
    popover: {
      title: t("📋 Tabla de Estudiantes"),
      description: t(
        "Acá ves todos los estudiantes con sus datos principales. Cada fila tiene acciones: <b>Ver</b>, <b>Editar</b>, <b>Desactivar</b>."
      ),
      side: "top",
    },
  },
  {
    popover: {
      title: t("✅ Estudiantes — Completado"),
      description: t(
        "Exploraste la página de Estudiantes. Visitá también <b>Tutores</b> e <b>Instituciones</b> desde el menú lateral."
      ),
      side: "center",
    },
  },
];

export const registroTutoresTour: DriveStep[] = [
  {
    popover: {
      title: t("👨‍🏫 Módulo de Registros — Tutores"),
      description: t(
        "Acá se gestionan los tutores académicos que realizan el seguimiento de los estudiantes durante sus prácticas."
      ),
      side: "center",
    },
  },
  {
    element: () => document.querySelector("h2"),
    popover: {
      title: t("👨‍🏫 Tutores"),
      description: t(
        "Listado de tutores. Cada uno puede tener varios estudiantes asignados. Se encargan del acompañamiento y las visitas."
      ),
      side: "bottom",
    },
  },
  {
    element: () => document.querySelector('button:has(svg[class*="lucide"])') ?? document.querySelector("button:has(svg)"),
    popover: {
      title: t("➕ Agregar Tutor"),
      description: t(
        "Registrá un nuevo tutor con datos personales, especialidad y asignación de estudiantes."
      ),
      side: "left",
    },
  },
  {
    element: () => document.querySelector('[role="tablist"]'),
    popover: {
      title: t("📂 Filtros"),
      description: t("Alterná entre tutores <b>Activos</b> e <b>Inactivos</b>."),
      side: "bottom",
    },
  },
  {
    element: () => document.querySelector("table"),
    popover: {
      title: t("📋 Tabla de Tutores"),
      description: t(
        "Listado con nombre, especialidad, estudiantes a cargo y acciones."
      ),
      side: "top",
    },
  },
  {
    popover: {
      title: t("✅ Tutores — Completado"),
      description: t(
        "Visitá también <b>Empresas o Instituciones</b> desde el menú lateral."
      ),
      side: "center",
    },
  },
];

export const registroInstitucionesTour: DriveStep[] = [
  {
    popover: {
      title: t("🏢 Módulo de Registros — Instituciones"),
      description: t(
        "Acá se registran las empresas e instituciones donde los estudiantes realizan sus prácticas profesionales."
      ),
      side: "center",
    },
  },
  {
    element: () => document.querySelector("h2"),
    popover: {
      title: t("🏢 Empresas o Instituciones"),
      description: t(
        "Listado completo de instituciones. Cada una tiene datos fiscales, dirección y contacto."
      ),
      side: "bottom",
    },
  },
  {
    element: () => document.querySelector('button:has(svg[class*="lucide"])') ?? document.querySelector("button:has(svg)"),
    popover: {
      title: t("➕ Agregar Institución"),
      description: t(
        "Registrá una nueva empresa o institución con su RIF, dirección y persona de contacto."
      ),
      side: "left",
    },
  },
  {
    element: () => document.querySelector("table"),
    popover: {
      title: t("📋 Tabla de Instituciones"),
      description: t(
        "Listado de todas las instituciones registradas con su información principal y acciones."
      ),
      side: "top",
    },
  },
  {
    popover: {
      title: t("✅ Registros — Completado"),
      description: t(
        "Completaste el módulo de Registros. Ahora explorá <b>Prácticas Profesionales</b> desde el menú lateral."
      ),
      side: "center",
    },
  },
];
