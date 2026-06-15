import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import { X, Pin, GripVertical } from "lucide-react";
import { useTabs, type Tab } from "../../context/tab";
import { useDragAndDrop } from "@formkit/drag-and-drop/react";

// ─── Context Menu ────────────────────────────────────────────────────────────

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  tabId: string;
  pinned: boolean;
}

const INITIAL_MENU: ContextMenuState = {
  visible: false,
  x: 0,
  y: 0,
  tabId: "",
  pinned: false,
};

const ContextMenu: React.FC<{
  menu: ContextMenuState;
  onPin: () => void;
  onClose: () => void;
  onCloseOthers: () => void;
  onCloseAll: () => void;
  onCloseMenu: () => void;
}> = ({ menu, onPin, onClose, onCloseOthers, onCloseAll, onCloseMenu }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onCloseMenu();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onCloseMenu]);

  if (!menu.visible) return null;

  return (
    <div
      ref={ref}
      className="fixed z-50 min-w-[180px] rounded-lg border border-border-light/50
        bg-white dark:bg-gray-800 shadow-lg py-1 text-sm
        animate-in fade-in zoom-in-95 duration-100"
      style={{ left: menu.x, top: menu.y }}
    >
      <button
        className="w-full flex items-center gap-2.5 px-3 py-2 text-left
          hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        onClick={onPin}
      >
        <Pin className={`size-3.5 ${menu.pinned ? "text-brand-500" : ""}`} />
        {menu.pinned ? "Desfijar pestaña" : "Fijar pestaña"}
      </button>

      <div className="h-px bg-border-light/30 dark:bg-white/10 my-1" />

      <button
        className="w-full flex items-center gap-2.5 px-3 py-2 text-left
          hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
          text-red-600 dark:text-red-400 disabled:opacity-30"
        onClick={onClose}
        disabled={menu.pinned}
      >
        <X className="size-3.5" />
        Cerrar pestaña
      </button>

      <button
        className="w-full flex items-center gap-2.5 px-3 py-2 text-left
          hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        onClick={onCloseOthers}
      >
        <X className="size-3.5" />
        Cerrar otras
      </button>

      <button
        className="w-full flex items-center gap-2.5 px-3 py-2 text-left
          hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        onClick={onCloseAll}
      >
        <X className="size-3.5" />
        Cerrar todas
      </button>
    </div>
  );
};

// ─── TabItem ─────────────────────────────────────────────────────────────────

interface TabItemProps {
  tab: Tab;
  index: number;
  isActive: boolean;
  onActivate: () => void;
  onClose: () => void;
  onPinToggle: () => void;
  onContextMenu: (e: React.MouseEvent, tabId: string, pinned: boolean) => void;
}

const TabItem: React.FC<TabItemProps> = ({
  tab,
  index,
  isActive,
  onActivate,
  onClose,
  onPinToggle,
  onContextMenu,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Scroll active tab into view
  useEffect(() => {
    if (isActive && buttonRef.current) {
      buttonRef.current.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }
  }, [isActive]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 && !tab.pinned) {
      e.preventDefault();
      onClose();
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu(e, tab.id, tab.pinned);
  };

  return (
    <button
      ref={buttonRef}
      role="tab"
      aria-selected={isActive}
      onMouseDown={handleMouseDown}
      onClick={onActivate}
      onContextMenu={handleContextMenu}
      className={`
        group/tab relative flex items-center gap-1 px-2.5 py-1.5
        text-sm whitespace-nowrap shrink-0 min-w-[72px] max-w-[200px]
        border-r border-border-light/30 dark:border-white/10
        transition-colors duration-150 cursor-default select-none
        ${
          isActive
            ? "bg-white dark:bg-gray-800 text-text-primary shadow-xs z-10"
            : "text-text-tertiary hover:text-text-secondary hover:bg-white/50 dark:hover:bg-white/5"
        }
      `}
    >
      {/* Drag handle */}
      <GripVertical className="tab-drag-handle size-3 shrink-0 opacity-0 group-hover/tab:opacity-30 text-text-tertiary transition-opacity cursor-grab active:cursor-grabbing" />

      {/* Active indicator — 2px brand-colored top border */}
      {isActive && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-brand-500 rounded-t" />
      )}

      {/* Optional icon */}
      {tab.icon && (
        <span className="size-3.5 shrink-0 flex items-center justify-center text-current opacity-60">
          {tab.icon}
        </span>
      )}

      {/* Tab label */}
      <span className="truncate max-w-[140px]">{tab.label}</span>

      {/* Close / Pin button */}
      {tab.pinned ? (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onPinToggle();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              onPinToggle();
            }
          }}
          className="size-4 shrink-0 flex items-center justify-center
            rounded hover:bg-gray-200 dark:hover:bg-gray-700
            transition-all duration-150 cursor-pointer"
          title="Desfijar pestaña"
          aria-label="Desfijar pestaña"
        >
          <Pin className="size-3 text-brand-500" />
        </span>
      ) : (
        <span
          role="button"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="
            opacity-0 group-hover/tab:opacity-100
            size-4 shrink-0 flex items-center justify-center
            rounded hover:bg-gray-200 dark:hover:bg-gray-700
            transition-all duration-150
          "
          aria-label="Cerrar pestaña"
        >
          <X className="size-3" />
        </span>
      )}
    </button>
  );
};

// ─── NavBar ──────────────────────────────────────────────────────────────────

const NavBar: React.FC = () => {
  const {
    tabs: contextTabs,
    activeTabId,
    activateTab,
    closeTab,
    closeOtherTabs,
    closeAllTabs,
    pinTab,
    reorderTabs,
  } = useTabs();

  const [contextMenu, setContextMenu] = useState<ContextMenuState>(INITIAL_MENU);

  // ── FormKit Drag & Drop ────────────────────────────────────────────────

  const [parentRef, dndTabs, setDndTabs] = useDragAndDrop<HTMLDivElement, Tab>(
    contextTabs,
    {
      dragHandle: ".tab-drag-handle",
      draggingClass: "opacity-50 ring-2 ring-brand-400 scale-[1.02] shadow-lg z-20",
      dropZoneClass: "border-l-2 border-l-brand-400",
    },
  );

  // Sync context → FormKit when tabs added/closed externally
  const isDndOrigin = useRef(false);

  useLayoutEffect(() => {
    if (!isDndOrigin.current) {
      setDndTabs(contextTabs);
    }
    isDndOrigin.current = false;
  }, [contextTabs]);

  // Sync FormKit → context when DnD reorders
  useEffect(() => {
    const contextIds = contextTabs.map((t) => t.id).join(",");
    const dndIds = dndTabs.map((t) => t.id).join(",");

    if (contextIds !== dndIds && dndTabs.length === contextTabs.length && dndTabs.length > 0) {
      isDndOrigin.current = true;

      const diffIdx = dndTabs.findIndex((t, i) => t.id !== contextTabs[i]?.id);
      if (diffIdx > -1) {
        const movedId = dndTabs[diffIdx].id;
        const fromIdx = contextTabs.findIndex((t) => t.id === movedId);
        if (fromIdx > -1 && fromIdx !== diffIdx) {
          reorderTabs(fromIdx, diffIdx);
        }
      }
    }
  }, [dndTabs, contextTabs, reorderTabs]);

  // ── Context menu ───────────────────────────────────────────────────────

  const openContextMenu = useCallback(
    (e: React.MouseEvent, tabId: string, pinned: boolean) => {
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        tabId,
        pinned,
      });
    },
    [],
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  const handlePinFromMenu = useCallback(() => {
    pinTab(contextMenu.tabId);
    closeContextMenu();
  }, [contextMenu.tabId, pinTab, closeContextMenu]);

  const handleCloseFromMenu = useCallback(() => {
    if (!contextMenu.pinned) {
      closeTab(contextMenu.tabId);
    }
    closeContextMenu();
  }, [contextMenu.tabId, contextMenu.pinned, closeTab, closeContextMenu]);

  const handleCloseOthersFromMenu = useCallback(() => {
    closeOtherTabs(contextMenu.tabId);
    closeContextMenu();
  }, [contextMenu.tabId, closeOtherTabs, closeContextMenu]);

  const handleCloseAllFromMenu = useCallback(() => {
    closeAllTabs();
    closeContextMenu();
  }, [closeAllTabs, closeContextMenu]);

  // ── Render ─────────────────────────────────────────────────────────────

  if (contextTabs.length === 0) return null;

  return (
    <>
      <div
        ref={parentRef}
        role="tablist"
        className="flex items-center h-10 overflow-x-auto no-scrollbar scroll-smooth
          bg-gray-50 dark:bg-bg-dark
          border-b border-border-light/50 dark:border-border-dark/50"
      >
        {dndTabs.map((tab, idx) => (
          <TabItem
            key={tab.id}
            tab={tab}
            index={idx}
            isActive={tab.id === activeTabId}
            onActivate={() => activateTab(tab.id)}
            onClose={() => closeTab(tab.id)}
            onPinToggle={() => pinTab(tab.id)}
            onContextMenu={openContextMenu}
          />
        ))}
      </div>

      <ContextMenu
        menu={contextMenu}
        onPin={handlePinFromMenu}
        onClose={handleCloseFromMenu}
        onCloseOthers={handleCloseOthersFromMenu}
        onCloseAll={handleCloseAllFromMenu}
        onCloseMenu={closeContextMenu}
      />
    </>
  );
};

export default NavBar;
