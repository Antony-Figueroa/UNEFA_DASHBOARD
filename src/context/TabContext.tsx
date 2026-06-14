import { useState, useEffect, useCallback } from "react";
import { TabContext, type Tab, type TabContextValue } from "./tab";
import { useTabShortcuts } from "../hooks/useTabShortcuts";
import { generateTabId } from "./tab";

// ─── Persistence ────────────────────────────────────────────────────────────

const STORAGE_KEY = "unefa:tabs";
const STORAGE_VERSION = 1;
const MAX_TABS = 15;

interface StoredTab {
  id: string;
  path: string;
  label: string;
  icon?: string;
  pinned: boolean;
  createdAt: number;
  lastAccessedAt?: number;
}

interface StoredData {
  version: number;
  tabs: StoredTab[];
  activeTabId: string | null;
}

function loadTabs(): { tabs: Tab[]; activeTabId: string | null } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: StoredData = JSON.parse(raw);
    if (data.version !== STORAGE_VERSION) return null;
    if (!Array.isArray(data.tabs) || data.tabs.length === 0) return null;

    const now = Date.now();
    const tabs: Tab[] = data.tabs.map((st) => ({
      id: st.id,
      path: st.path,
      label: st.label,
      icon: st.icon,
      pinned: st.pinned,
      createdAt: st.createdAt ?? now,
      lastAccessedAt: st.lastAccessedAt ?? st.createdAt ?? now,
    }));

    const activeTabId = data.activeTabId ?? null;
    const activeStillExists = activeTabId && tabs.some((t) => t.id === activeTabId);
    return { tabs, activeTabId: activeStillExists ? activeTabId : tabs[0].id };
  } catch {
    return null;
  }
}

function saveTabs(tabs: Tab[], activeTabId: string | null): void {
  try {
    const data: StoredData = {
      version: STORAGE_VERSION,
      tabs: tabs.map((t) => ({
        id: t.id,
        path: t.path,
        label: t.label,
        icon: t.icon,
        pinned: t.pinned,
        createdAt: t.createdAt,
        lastAccessedAt: t.lastAccessedAt,
      })),
      activeTabId,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Quota exceeded or storage unavailable — silently ignore.
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function createDefaultTab(): Tab {
  const now = Date.now();
  return {
    id: "dashboard",
    path: "/dashboard",
    label: "Inicio",
    pinned: true,
    createdAt: now,
    lastAccessedAt: now,
  };
}

/**
 * If the tab count exceeds MAX_TABS, evict the oldest unpinned tab (LRU).
 */
function enforceMaxTabs(tabs: Tab[]): Tab[] {
  if (tabs.length <= MAX_TABS) return tabs;
  const nonPinned = tabs.filter((t) => !t.pinned);
  if (nonPinned.length === 0) return tabs;

  const sorted = [...nonPinned].sort((a, b) => a.lastAccessedAt - b.lastAccessedAt);
  const toRemove = sorted[0];
  return tabs.filter((t) => t.id !== toRemove.id);
}

// ─── Provider ───────────────────────────────────────────────────────────────

export const TabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tabs, setTabs] = useState<Tab[]>(() => {
    const stored = loadTabs();
    if (stored) return stored.tabs;
    return [createDefaultTab()];
  });

  const [activeTabId, setActiveTabId] = useState<string | null>(() => {
    const stored = loadTabs();
    if (stored && stored.activeTabId) return stored.activeTabId;
    return "dashboard";
  });

  // ── Persist on every state change ──────────────────────────────────────

  useEffect(() => {
    saveTabs(tabs, activeTabId);
  }, [tabs, activeTabId]);

  // ── popstate (browser back/forward) ────────────────────────────────────

  useEffect(() => {
    const handlePopState = () => {
      const currentPath = window.location.pathname;
      const id = generateTabId(currentPath);
      const now = Date.now();

      setTabs((prev) => {
        const existing = prev.find((t) => t.id === id);
        if (existing) {
          setActiveTabId(existing.id);
          return prev.map((t) =>
            t.id === existing.id ? { ...t, lastAccessedAt: now } : t,
          );
        }
        return prev;
      });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────

  const openTab: TabContextValue["openTab"] = useCallback(
    (path, label, opts) => {
      const id = generateTabId(path, opts?.params);
      const now = Date.now();

      setTabs((prev) => {
        // Activate existing tab if one with the same ID is already open
        const existing = prev.find((t) => t.id === id);
        if (existing) {
          setActiveTabId(id);
          return prev.map((t) =>
            t.id === id ? { ...t, lastAccessedAt: now } : t,
          );
        }

        // Create a new tab
        const newTab: Tab = {
          id,
          path,
          label,
          icon: opts?.icon,
          params: opts?.params,
          pinned: opts?.pinned ?? false,
          createdAt: now,
          lastAccessedAt: now,
        };

        const updated = enforceMaxTabs([...prev, newTab]);
        setActiveTabId(id);
        return updated;
      });
    },
    [],
  );

  const closeTab: TabContextValue["closeTab"] = useCallback((tabId) => {
    setTabs((prev) => {
      const tabIndex = prev.findIndex((t) => t.id === tabId);
      if (tabIndex === -1) return prev;

      const newTabs = prev.filter((t) => t.id !== tabId);

      // If active tab was closed, pick the right-adjacent tab, then left
      if (prev[tabIndex].id === activeTabId) {
        const right = newTabs[tabIndex]; // same index in the new array
        const left = newTabs[tabIndex - 1];
        const next = right?.id ?? left?.id ?? null;

        // If no tabs remain, recreate the default dashboard tab
        if (next === null) {
          const def = createDefaultTab();
          setActiveTabId(def.id);
          return [def];
        }

        setActiveTabId(next);
      }

      return newTabs;
    });
  }, [activeTabId]);

  const closeOtherTabs: TabContextValue["closeOtherTabs"] = useCallback((tabId) => {
    setTabs((prev) => {
      const keepPinned = prev.filter((t) => t.pinned && t.id !== tabId);
      const keepTarget = prev.find((t) => t.id === tabId);
      if (!keepTarget) return prev;
      const result = [keepTarget, ...keepPinned];
      if (!result.some((t) => t.id === activeTabId)) {
        setActiveTabId(keepTarget.id);
      }
      return result;
    });
  }, [activeTabId]);

  const closeAllTabs: TabContextValue["closeAllTabs"] = useCallback(() => {
    setTabs((prev) => {
      const pinned = prev.filter((t) => t.pinned);
      if (pinned.length === prev.length) return prev; // all pinned — noop

      if (pinned.length === 0) {
        const def = createDefaultTab();
        setActiveTabId(def.id);
        return [def];
      }

      const activeIsPinned = pinned.some((t) => t.id === activeTabId);
      if (!activeIsPinned) {
        setActiveTabId(pinned[0].id);
      }
      return pinned;
    });
  }, [activeTabId]);

  const activateTab: TabContextValue["activateTab"] = useCallback((tabId) => {
    const now = Date.now();
    setTabs((prev) => {
      const tab = prev.find((t) => t.id === tabId);
      if (!tab) return prev;
      setActiveTabId(tabId);
      return prev.map((t) =>
        t.id === tabId ? { ...t, lastAccessedAt: now } : t,
      );
    });
  }, []);

  const pinTab: TabContextValue["pinTab"] = useCallback((tabId) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, pinned: !t.pinned } : t)),
    );
  }, []);

  const reorderTabs: TabContextValue["reorderTabs"] = useCallback((fromIndex, toIndex) => {
    setTabs((prev) => {
      if (
        fromIndex < 0 ||
        fromIndex >= prev.length ||
        toIndex < 0 ||
        toIndex >= prev.length
      ) {
        return prev;
      }
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────

  useTabShortcuts(tabs, activeTabId, closeTab, activateTab);

  // ── Context value (stable reference via useMemo) ───────────────────────

  const value: TabContextValue = {
    tabs,
    activeTabId,
    openTab,
    closeTab,
    closeOtherTabs,
    closeAllTabs,
    activateTab,
    pinTab,
    reorderTabs,
  };

  return <TabContext.Provider value={value}>{children}</TabContext.Provider>;
};
