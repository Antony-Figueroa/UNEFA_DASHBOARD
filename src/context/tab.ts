import { createContext, useContext } from "react";

export interface Tab {
  id: string;
  path: string;
  label: string;
  icon?: string;
  params?: Record<string, string>;
  pinned: boolean;
  createdAt: number;
  lastAccessedAt: number;
}

export interface TabContextValue {
  tabs: Tab[];
  activeTabId: string | null;
  openTab: (path: string, label: string, opts?: { icon?: string; params?: Record<string, string>; pinned?: boolean }) => void;
  closeTab: (tabId: string) => void;
  closeOtherTabs: (tabId: string) => void;
  closeAllTabs: () => void;
  activateTab: (tabId: string) => void;
  pinTab: (tabId: string) => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
}

export const TabContext = createContext<TabContextValue | undefined>(undefined);

export function useTabs(): TabContextValue {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error("useTabs must be used within a TabProvider");
  }
  return context;
}

/**
 * Generate a stable tab ID from a path and optional params.
 *
 * Examples:
 *   "/students"                  → "students"
 *   "/configure/users"           → "configure_users"
 *   "/visit-registration/5"      → "visit-registration_5"
 *   "/activity-logs/42"          → "activity-logs_42"
 */
export function generateTabId(path: string, params?: Record<string, string>): string {
  const base = path.replace(/\//g, "_").replace(/^_/, "") || "dashboard";
  if (!params) return base;
  const paramStr = Object.values(params).filter(Boolean).join("_");
  return paramStr ? `${base}_${paramStr}` : base;
}
