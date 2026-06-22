import type { DriveStep } from "../types";

const t = (es: string) => es;

export const registroEstudiantesTour: DriveStep[] = [
  {
    popover: {
      title: t("Registros — Estudiantes"),
      description: t(
        "En esta seccion se gestionan los datos personales y academicos de los estudiantes. Puede crear, editar, buscar y administrar el estado de cada estudiante."
      ),
      side: "over",
    },
  },
  {
    element: () => document.querySelector("h2")!,
    popover: {
      title: t("Pagina de Estudiantes"),
      description: t(
        "Esta es la pagina principal de gestion de estudiantes. Cada registro incluye cedula, nombres, apellidos, correo electronico, telefono y datos de contacto. Tambien puede asociar al estudiante a una carrera y un periodo."
      ),
      side: "bottom",
    },
  },
  {
    element: () => {
      const btns = document.querySelectorAll("button");
      return Array.from(btns).find((b) => b.textContent?.includes("Nuevo Estudiante") || b.textContent?.includes("Agregar Estudiante")) ?? document.querySelector('button:has(svg)')!;
    },
    popover: {
      title: t("Boton Nuevo Estudiante"),
      description: t(
        "Haga clic aqui para abrir el formulario y registrar un nuevo estudiante."
      ),
      side: "left",
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
