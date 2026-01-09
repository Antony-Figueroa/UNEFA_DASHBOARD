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
    bg: "bg-success-50 dark:bg-success-500/15",
    border: "border-success-500 dark:border-success-500/30",
    text: "text-success-600 dark:text-success-400",
    icon: "text-success-600 dark:text-success-400",
    button: "bg-success-600 hover:bg-success-700",
  },
  error: {
    bg: "bg-error-50 dark:bg-error-500/15",
    border: "border-error-500 dark:border-error-500/30",
    text: "text-error-600 dark:text-error-400",
    icon: "text-error-600 dark:text-error-400",
    button: "bg-error-600 hover:bg-error-700",
  },
  warning: {
    bg: "bg-warning-50 dark:bg-warning-500/15",
    border: "border-warning-500 dark:border-warning-500/30",
    text: "text-warning-600 dark:text-warning-400",
    icon: "text-warning-600 dark:text-warning-400",
    button: "bg-warning-600 hover:bg-warning-700",
  },
  info: {
    bg: "bg-blue-light-50 dark:bg-blue-light-500/15",
    border: "border-blue-light-500 dark:border-blue-light-500/30",
    text: "text-blue-light-600 dark:text-blue-light-400",
    icon: "text-blue-light-600 dark:text-blue-light-400",
    button: "bg-blue-light-600 hover:bg-blue-light-700",
  },
  confirm: {
    bg: "bg-orange-50 dark:bg-orange-500/15",
    border: "border-orange-500 dark:border-orange-500/30",
    text: "text-orange-500",
    icon: "text-orange-500",
    button: "bg-orange-500 hover:bg-orange-600",
  },
};

export const STANDARD_TEXTS = {
  CONFIRM_DELETE: {
    title: "¿Está seguro de eliminar este registro?",
    message: "Esta acción no se puede deshacer y el registro será marcado como inactivo.",
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
