import { useEffect, useRef } from "react";
import { X, Pin } from "lucide-react";
import { useTabs, type Tab } from "../../context/tab";

// ─── TabItem ────────────────────────────────────────────────────────────────

interface TabItemProps {
  tab: Tab;
  isActive: boolean;
  onActivate: () => void;
  onClose: () => void;
}

const TabItem: React.FC<TabItemProps> = ({ tab, isActive, onActivate, onClose }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Scroll active tab into view
  useEffect(() => {
    if (isActive && buttonRef.current) {
      buttonRef.current.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }
  }, [isActive]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1) {
      // Middle-click: close tab
      e.preventDefault();
      onClose();
    }
  };

  return (
    <button
      ref={buttonRef}
      role="tab"
      aria-selected={isActive}
      onMouseDown={handleMouseDown}
      onClick={onActivate}
      className={`
        group/tab relative flex items-center gap-1.5 px-3 py-1.5
        text-sm whitespace-nowrap shrink-0 min-w-[80px] max-w-[200px]
        border-r border-border-light/30 dark:border-white/10
        transition-colors duration-150 cursor-default select-none
        ${
          isActive
            ? "bg-white dark:bg-gray-800 text-text-primary shadow-xs z-10"
            : "text-text-tertiary hover:text-text-secondary hover:bg-white/50 dark:hover:bg-white/5"
        }
      `}
    >
      {/* Active indicator — 2px brand-colored top border */}
      {isActive && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-brand-500 rounded-t" />
      )}

      {/* Optional icon */}
      {tab.icon && (
        <span className="size-3.5 shrink-0 flex items-center justify-center text-current opacity-60">
          {/* The icon is rendered as text/emoji for now; real icons will use lucide-react mapping */}
          {tab.icon}
        </span>
      )}

      {/* Tab label */}
      <span className="truncate max-w-[160px]">{tab.label}</span>

      {/* Close button (pinned tabs show a pin icon instead) */}
      {tab.pinned ? (
        <Pin className="size-3 shrink-0 text-text-tertiary/50" />
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

// ─── NavBar ─────────────────────────────────────────────────────────────────

const NavBar: React.FC = () => {
  const { tabs, activeTabId, activateTab, closeTab } = useTabs();

  // Hide when there are no tabs
  if (tabs.length === 0) return null;

  return (
    <div
      role="tablist"
      className="sticky top-[calc(var(--banner-height,0px)+var(--header-height,64px))] z-30 flex items-center h-10 overflow-x-auto no-scrollbar scroll-smooth
        bg-gray-50/80 dark:bg-bg-dark/90
        border-b border-border-light/50 dark:border-border-dark/50"
    >
      {tabs.map((tab) => (
        <TabItem
          key={tab.id}
          tab={tab}
          isActive={tab.id === activeTabId}
          onActivate={() => activateTab(tab.id)}
          onClose={() => closeTab(tab.id)}
        />
      ))}
    </div>
  );
};

export default NavBar;
