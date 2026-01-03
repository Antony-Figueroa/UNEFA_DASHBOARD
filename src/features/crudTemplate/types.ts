import type { ReactNode } from "react";

export type SortDirection = "asc" | "desc";

export interface CrudColumn<TItem> {
  id: string;
  header: string;
  accessor: (item: TItem) => string | number | boolean | null | undefined;
  sortable?: boolean;
  widthClassName?: string;
  alignRight?: boolean;
  render?: (item: TItem) => ReactNode;
}

export interface CrudFilterOption {
  value: string;
  label: string;
}

export type CrudFilterType = "search" | "select" | "multi-select";

export interface CrudFilterConfig {
  id: string;
  label: string;
  type: CrudFilterType;
  placeholder?: string;
  options?: CrudFilterOption[];
}

export interface CrudFilterState {
  [filterId: string]: string | string[];
}

export interface CrudActionConfig<TItem> {
  id: string;
  label: string;
  variant?: "primary" | "danger" | "secondary";
  onAction: (items: TItem[]) => void;
  requiresConfirmation?: boolean;
  confirmationTitle?: string;
  confirmationMessage?: (items: TItem[]) => string;
}

export interface CrudRowAction<TItem> {
  id: string;
  label: string;
  icon?: "edit" | "delete" | "view" | "restore" | ReactNode;
  variant?: "danger" | "brand" | "default";
  onClick: (item: TItem) => void;
  show?: (item: TItem) => boolean;
}

export interface CrudPageAlert {
  id: string;
  variant: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
}

