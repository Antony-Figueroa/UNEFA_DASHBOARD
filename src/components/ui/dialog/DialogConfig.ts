/**
 * @file DialogConfig.ts
 * @description Configuración centralizada para el sistema de diálogos y alertas.
 * Define colores, textos estándar y comportamientos unificados.
 * Fuente única de verdad para todos los mensajes del sistema.
 */

export const DIALOG_VARIANTS = {
  SUCCESS: "success",
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
  CONFIRM: "confirm",
} as const;

export type DialogVariant = (typeof DIALOG_VARIANTS)[keyof typeof DIALOG_VARIANTS];

export interface DialogTextConfig {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: DialogVariant;
}

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

// ===== TOAST SUCCESS MESSAGES =====
export const TOAST_SUCCESS = {
  created: (resource: string) => `${resource} creado exitosamente`,
  updated: (resource: string) => `${resource} actualizado exitosamente`,
  deleted: (resource: string) => `${resource} eliminado exitosamente`,
  restored: (resource: string) => `${resource} restaurado exitosamente`,
  statusChanged: (resource: string, active: boolean) =>
    `Estado de ${resource.toLowerCase()} ${active ? 'activado' : 'inactivado'} exitosamente`,
};

// ===== TOAST ERROR MESSAGES =====
export const TOAST_ERROR = {
  create: (resource: string) => `Error al crear ${resource.toLowerCase()}`,
  update: (resource: string) => `Error al actualizar ${resource.toLowerCase()}`,
  delete: (resource: string) => `Error al eliminar ${resource.toLowerCase()}`,
  restore: (resource: string) => `Error al restaurar ${resource.toLowerCase()}`,
  load: (resource: string) => `Error al cargar ${resource.toLowerCase()}`,
};

// ===== TOAST TITLES =====
export const TOAST_TITLES = {
  created: (resource: string) => `${resource} Creado`,
  updated: (resource: string) => `${resource} Actualizado`,
  deleted: (resource: string) => `${resource} Eliminado`,
  restored: (resource: string) => `${resource} Restaurado`,
};

// ===== CONFIRM DIALOGS =====
export const CONFIRM_MESSAGES = {
  create: (resource: string): DialogTextConfig => ({
    title: 'Confirmar registro',
    message: `¿Estás seguro de que deseas registrar ${resource.toLowerCase()}?`,
    confirmLabel: 'Registrar',
  }),
  update: (resource: string): DialogTextConfig => ({
    title: 'Confirmar cambios',
    message: `¿Estás seguro de que deseas actualizar ${resource.toLowerCase()}?`,
    confirmLabel: 'Actualizar',
  }),
  delete: (resource: string): DialogTextConfig => ({
    title: 'Confirmar eliminación',
    message: `¿Estás seguro de que deseas eliminar ${resource.toLowerCase()}? Esta acción no se puede deshacer.`,
    confirmLabel: 'Eliminar',
    variant: 'error',
  }),
  deactivate: (resource: string): DialogTextConfig => ({
    title: 'Confirmar desactivación',
    message: `¿Estás seguro de que deseas desactivar ${resource.toLowerCase()}? Podrás restaurarlo después si es necesario.`,
    confirmLabel: 'Desactivar',
    variant: 'warning',
  }),
  activate: (resource: string): DialogTextConfig => ({
    title: 'Confirmar restauración',
    message: `¿Estás seguro de que deseas restaurar ${resource.toLowerCase()}?`,
    confirmLabel: 'Restaurar',
    variant: 'success',
  }),
  restore: (resource: string): DialogTextConfig => ({
    title: 'Confirmar restauración',
    message: `¿Estás seguro de que deseas restaurar ${resource.toLowerCase()}?`,
    confirmLabel: 'Restaurar',
    variant: 'success',
  }),
};

// ===== SYSTEM DIALOGS =====
export const SYSTEM_DIALOGS = {
  closeWithoutSaving: {
    title: 'Cambios sin guardar',
    message: '¿Estás seguro de que deseas cerrar? Los cambios no se guardarán.',
    confirmLabel: 'Cerrar sin guardar',
    cancelLabel: 'Seguir editando',
  },
};

// ===== STANDARD TEXTS (legacy, kept for backwards compatibility) =====
export const STANDARD_TEXTS = {
  CONFIRM_DELETE: {
    title: 'Confirmar eliminación',
    message: '¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.',
    confirmLabel: 'Eliminar',
    cancelLabel: 'Cancelar',
  },
  CONFIRM_RESTORE: {
    title: 'Confirmar restauración',
    message: '¿Estás seguro de que deseas restaurar este registro?',
    confirmLabel: 'Restaurar',
    cancelLabel: 'Cancelar',
  },
  SUCCESS_SAVE: {
    title: 'Registro guardado',
    message: 'La información se ha procesado correctamente.',
  },
  ERROR_GENERIC: {
    title: 'Ha ocurrido un error',
    message: 'No se pudo completar la operación. Intenta de nuevo.',
  },
};

export const DIALOG_LAYOUT = {
  borderRadius: "rounded-[24px] sm:rounded-[32px]",
  padding: "px-5 py-4 sm:px-8 sm:py-6",
  spacing: "gap-4.5",
  titleSize: "text-lg sm:text-xl font-bold",
  messageSize: "text-sm sm:text-base",
};

// ===== STANDARDIZED TOAST MESSAGES (addToast-compatible) =====
// Cada función retorna { variant, title, message } listo para addToast.
// Usar: addToast(TOAST.created('Visita'))

export const TOAST = {
  // ── Success ──────────────────────────────────────────
  created: (resource: string) => ({
    variant: "success" as const,
    title: `${resource} creado`,
    message: `${resource} creado correctamente.`,
  }),
  updated: (resource: string) => ({
    variant: "success" as const,
    title: `${resource} actualizado`,
    message: `${resource} actualizado correctamente.`,
  }),
  deleted: (resource: string) => ({
    variant: "warning" as const,
    title: `${resource} eliminado`,
    message: `${resource} eliminado correctamente.`,
  }),
  restored: (resource: string) => ({
    variant: "success" as const,
    title: `${resource} restaurado`,
    message: `${resource} restaurado correctamente.`,
  }),

  // ── Error ────────────────────────────────────────────
  createError: (resource: string) => ({
    variant: "error" as const,
    title: "Error al crear",
    message: `No se pudo crear ${resource}. Intentá de nuevo.`,
  }),
  updateError: (resource: string) => ({
    variant: "error" as const,
    title: "Error al actualizar",
    message: `No se pudo actualizar ${resource}. Intentá de nuevo.`,
  }),
  deleteError: (resource: string) => ({
    variant: "error" as const,
    title: "Error al eliminar",
    message: `No se pudo eliminar ${resource}. Intentá de nuevo.`,
  }),
  loadError: () => ({
    variant: "error" as const,
    title: "Error al cargar",
    message: "No se pudieron cargar los datos. Intentá de nuevo.",
  }),
  restoreError: (resource: string) => ({
    variant: "error" as const,
    title: "Error al restaurar",
    message: `No se pudo restaurar ${resource}. Intentá de nuevo.`,
  }),
} as const;
