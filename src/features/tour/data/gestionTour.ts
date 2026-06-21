import type { DriveStep } from "../types";

const t = (es: string) => es;

export const gestionPeriodTour: DriveStep[] = [
  {
    popover: {
      title: t("📋 Módulo de Gestión"),
      description: t(
        "Este módulo administra los datos maestros del sistema: <b>Períodos Académicos</b> y <b>Carreras</b>. Todo el flujo de prácticas depende de estos registros."
      ),
      side: "center",
    },
  },
  {
    element: () => document.querySelector("h2"),
    popover: {
      title: t("📅 Períodos Académicos"),
      description: t(
        "Acá se definen los períodos: fechas de inicio, fin, días de gracia y estado (Pendiente / En Curso / Culminado)."
      ),
      side: "bottom",
    },
  },
  {
    element: () => document.querySelector('button:has(svg[class*="lucide"])') ?? document.querySelector("button:has(svg)"),
    popover: {
      title: t("➕ Nuevo Período"),
      description: t(
        "Botón para crear un nuevo período. Complete código, descripción, fechas y tipo."
      ),
      side: "left",
    },
  },
  {
    element: () => document.querySelector('[role="tablist"]'),
    popover: {
      title: t("📂 Filtros"),
      description: t(
        "Alterná entre <b>Activos</b> e <b>Inactivos</b> para ver períodos vigentes o históricos."
      ),
      side: "bottom",
    },
  },
  {
    element: () => document.querySelector('input[placeholder*="Buscar" i]'),
    popover: {
      title: t("🔍 Búsqueda"),
      description: t(
        "Filtrá períodos por código o descripción en tiempo real."
      ),
      side: "bottom",
    },
  },
  {
    element: () => document.querySelector("table"),
    popover: {
      title: t("📋 Tabla de Períodos"),
      description: t(
        "Listado completo. Cada fila tiene acciones para <b>Ver</b>, <b>Editar</b> o <b>Desactivar</b>."
      ),
      side: "top",
    },
  },
  {
    popover: {
      title: t("✅ Gestión — Completado"),
      description: t(
        "Exploraste la página de Períodos. Visitá también <b>Carreras</b> en el menú lateral para ver la gestión de carreras universitarias."
      ),
      side: "center",
    },
  },
];

export const gestionCarrerasTour: DriveStep[] = [
  {
    popover: {
      title: t("📋 Módulo de Gestión"),
      description: t(
        "Este módulo administra los datos maestros del sistema: <b>Períodos Académicos</b> y <b>Carreras</b>."
      ),
      side: "center",
    },
  },
  {
    element: () => document.querySelector("h2"),
    popover: {
      title: t("🎓 Carreras Universitarias"),
      description: t(
        "Acá se gestionan las carreras: nombre, código, modalidad (presencial/semi-presencial), núcleo y estado."
      ),
      side: "bottom",
    },
  },
  {
    element: () => document.querySelector('button:has(svg[class*="lucide"])') ?? document.querySelector("button:has(svg)"),
    popover: {
      title: t("➕ Nueva Carrera"),
      description: t(
        "Agregá una nueva carrera con su código, nombre, modalidad y núcleo."
      ),
      side: "left",
    },
  },
  {
    element: () => document.querySelector('[role="tablist"]'),
    popover: {
      title: t("📂 Filtros"),
      description: t(
        "Alterná entre carreras <b>Activas</b> e <b>Inactivas</b>."
      ),
      side: "bottom",
    },
  },
  {
    element: () => document.querySelector("table"),
    popover: {
      title: t("📋 Tabla de Carreras"),
      description: t(
        "Listado completo con nombre, código, modalidad, núcleo y acciones disponibles."
      ),
      side: "top",
    },
  },
  {
    popover: {
      title: t("✅ Gestión — Completado"),
      description: t(
        "Ya conocés el módulo de Gestión. Ahora explorá <b>Registros</b> o <b>Prácticas</b> desde el menú lateral."
      ),
      side: "center",
    },
  },
];
