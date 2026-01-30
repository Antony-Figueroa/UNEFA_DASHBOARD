import type { ReactNode } from "react";

/**
 * Dirección de ordenamiento para tablas.
 */
export type SortDirection = "asc" | "desc";

/**
 * Configuración de una columna para la tabla CRUD.
 * 
 * @template TItem - El tipo de dato de la fila.
 */
export interface CrudColumn<TItem> {
  /** Identificador único de la columna. */
  id: string;
  /** Título visible en el encabezado. */
  header: string;
  /** Función para obtener el valor crudo de la celda. */
  accessor: (item: TItem) => string | number | boolean | null | undefined;
  /** Si permite ordenar por esta columna. */
  sortable?: boolean;
  /** Clase CSS para controlar el ancho (ej. 'w-32', 'flex-1'). */
  widthClassName?: string;
  /** Si debe alinear el contenido a la derecha. */
  alignRight?: boolean;
  /** Función opcional para renderizar contenido personalizado (JSX). */
  render?: (item: TItem) => ReactNode;
}

/**
 * Opción para filtros de tipo select.
 */
export interface CrudFilterOption {
  value: string;
  label: string;
}

/**
 * Tipos de filtros soportados en la barra de búsqueda.
 */
export type CrudFilterType = "search" | "select" | "multi-select";

/**
 * Configuración de un filtro dinámico.
 */
export interface CrudFilterConfig {
  /** Identificador único del filtro (usado en el estado). */
  id: string;
  /** Etiqueta visible. */
  label: string;
  /** Tipo de control de entrada. */
  type: CrudFilterType;
  /** Texto de sugerencia (opcional). */
  placeholder?: string;
  /** Opciones disponibles si el tipo es select o multi-select. */
  options?: CrudFilterOption[];
}

/**
 * Estado actual de los filtros activos.
 */
export interface CrudFilterState {
  [filterId: string]: string | string[];
}

/**
 * Configuración para acciones masivas (sobre múltiples elementos).
 * 
 * @template TItem - El tipo de dato de los elementos seleccionados.
 */
export interface CrudActionConfig<TItem> {
  /** Identificador único de la acción. */
  id: string;
  /** Etiqueta del botón. */
  label: string;
  /** Variante visual del botón. */
  variant?: "primary" | "danger" | "secondary";
  /** Función que se ejecuta al confirmar la acción. */
  onAction: (items: TItem[]) => void;
  /** Si requiere una confirmación previa del usuario. */
  requiresConfirmation?: boolean;
  /** Título del diálogo de confirmación. */
  confirmationTitle?: string;
  /** Función para generar el mensaje de confirmación basado en los items. */
  confirmationMessage?: (items: TItem[]) => string;
}

/**
 * Configuración para acciones por fila (individuales).
 * 
 * @template TItem - El tipo de dato del elemento de la fila.
 */
export interface CrudRowAction<TItem> {
  /** Identificador único. */
  id: string;
  /** Etiqueta (usada como tooltip o texto). */
  label: string;
  /** Icono predefinido o componente ReactNode. */
  icon?: "edit" | "delete" | "view" | "restore" | ReactNode;
  /** Variante visual. */
  variant?: "danger" | "brand" | "default";
  /** Función que se ejecuta al hacer click. */
  onClick: (item: TItem) => void;
  /** Función opcional para determinar si la acción debe mostrarse para un item específico. */
  show?: (item: TItem) => boolean;
}

/**
 * Estructura de alertas para la página de gestión.
 */
export interface CrudPageAlert {
  id: string;
  variant: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
}

