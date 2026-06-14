import { useEffect } from "react";
import type { Tab } from "../context/tab";

/**
 * Registers global keyboard shortcuts for tab navigation.
 *
 * | Shortcut          | Action                | Edge case                           |
 * |-------------------|-----------------------|-------------------------------------|
 * | Ctrl/Cmd + W      | Close active tab      | Works even inside input fields      |
 * | Ctrl + Tab        | Next tab (wrap)       | Skipped when focus is in an input   |
 * | Ctrl + Shift + Tab| Previous tab (wrap)   | Skipped when focus is in an input   |
 * | Ctrl + 1..9       | Activate tab by index | Skipped when focus is in an input   |
 *
 * Designed to be called inside <TabProvider> or inside a descendant
 * component that has access to the tab context.
 */
export function useTabShortcuts(
  tabs: Tab[],
  activeTabId: string | null,
  closeTab: (id: string) => void,
  activateTab: (id: string) => void,
): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      // Ctrl/Cmd + W — always works (even in inputs)
      if ((e.metaKey || e.ctrlKey) && e.key === "w") {
        e.preventDefault();
        if (activeTabId) {
          closeTab(activeTabId);
        }
        return;
      }

      // Skip other shortcuts when focus is inside a form control
      if (isInput) return;

      // Ctrl + Tab / Ctrl + Shift + Tab
      if (e.ctrlKey && e.key === "Tab") {
        e.preventDefault();
        if (tabs.length === 0 || !activeTabId) return;

        const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
        const nextIndex = e.shiftKey
          ? (currentIndex - 1 + tabs.length) % tabs.length
          : (currentIndex + 1) % tabs.length;

        if (tabs[nextIndex]) {
          activateTab(tabs[nextIndex].id);
        }
        return;
      }

      // Ctrl + 1..9
      if (e.ctrlKey && !e.shiftKey && !e.metaKey && e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        const index = Number.parseInt(e.key, 10) - 1;
        if (tabs[index]) {
          activateTab(tabs[index].id);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [tabs, activeTabId, closeTab, activateTab]);
}
