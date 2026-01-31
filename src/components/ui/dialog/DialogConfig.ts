/**
 * @file DialogConfig.ts
 * @description Configuración centralizada para el sistema de diálogos y alertas.
 * Define colores, textos estándar y comportamientos unificados (Actualizado).
 */

export const DIALOG_VARIANTS = {
  SUCCESS: "success",
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
  CONFIRM: "confirm",
} as const;

export type DialogVariant = (typeof DIALOG_VARIANTS)[keyof typeof DIALOG_VARIANTS];

export const DIALOG_COLORS = {
  success: {
    bg: "bg-alert-success-bg",
    border: "border-alert-success-border",
    text: "text-alert-success-text",
    icon: "text-alert-success-text",
    button: "bg-success-600 hover:bg-success-700",
  },
  error: {
    bg: "bg-alert-error-bg",
    border: "border-alert-error-border",
    text: "text-alert-error-text",
    icon: "text-alert-error-text",
    button: "bg-error-600 hover:bg-error-700",
  },
  warning: {
    bg: "bg-alert-warning-bg",
    border: "border-alert-warning-border",
    text: "text-alert-warning-text",
    icon: "text-alert-warning-text",
    button: "bg-warning-600 hover:bg-warning-700",
  },
  info: {
    bg: "bg-alert-info-bg",
    border: "border-alert-info-border",
    text: "text-alert-info-text",
    icon: "text-alert-info-text",
    button: "bg-blue-light-600 hover:bg-blue-light-700",
  },
  confirm: {
    bg: "bg-alert-warning-bg",
    border: "border-alert-warning-border",
    text: "text-alert-warning-text",
    icon: "text-alert-warning-text",
    button: "bg-warning-600 hover:bg-warning-700",
  },
};

export const STANDARD_TEXTS = {
  CONFIRM_DELETE: {
    title: "¿Está seguro de eliminar este registro?",
    message: "El registro será marcado como inactivo.",
    confirmLabel: "Eliminar",
    cancelLabel: "Cancelar",
  },
  CONFIRM_RESTORE: {
    title: "¿Desea restaurar este registro?",
    message: "El registro volverá a estar activo en el sistema.",
    confirmLabel: "Restaurar",
    cancelLabel: "Cancelar",
  },
  SUCCESS_SAVE: {
    title: "Registro guardado",
    message: "La información se ha procesado correctamente.",
  },
  ERROR_GENERIC: {
    title: "Ha ocurrido un error",
    message: "No se pudo completar la operación. Por favor, intente de nuevo.",
  },
};

export const DIALOG_LAYOUT = {
  borderRadius: "rounded-[24px] sm:rounded-[32px]",
  padding: "px-5 py-4 sm:px-8 sm:py-6",
  spacing: "gap-4.5",
  titleSize: "text-lg sm:text-xl font-bold",
  messageSize: "text-sm sm:text-base",
};
