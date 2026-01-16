import type React from "react";
import { Link } from "react-router";

interface DropdownItemProps {
  tag?: "a" | "button";
  to?: string;
  onClick?: () => void;
  onItemClick?: () => void;
  baseClassName?: string;
  className?: string;
  variant?: "default" | "view" | "edit" | "delete" | "restore";
  children: React.ReactNode;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({
  tag = "button",
  to,
  onClick,
  onItemClick,
  baseClassName = "block w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-brand-500 hover:text-white dark:text-text-tertiary dark:hover:bg-brand-500 dark:hover:text-white transition-all duration-200",
  className = "",
  variant = "default",
  children,
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case "view":
        return "action-menu-item text-[var(--color-action-view)] hover:bg-[var(--color-action-hover-bg)] hover:text-white dark:hover:bg-[var(--color-action-dark-hover-bg)] dark:hover:text-white";
      case "edit":
        return "action-menu-item text-[var(--color-action-edit)] hover:bg-[var(--color-action-hover-bg)] hover:text-white dark:hover:bg-[var(--color-action-dark-hover-bg)] dark:hover:text-white";
      case "delete":
        return "action-menu-item text-[var(--color-action-delete)] hover:bg-red-500 hover:text-white dark:hover:bg-red-500 dark:hover:text-white";
      case "restore":
        return "action-menu-item text-[var(--color-action-restore)] hover:bg-green-500 hover:text-white dark:hover:bg-green-500 dark:hover:text-white";
      default:
        return "";
    }
  };

  const combinedClasses = variant === "default" 
    ? `${baseClassName} ${className}`.trim()
    : `action-menu-item ${getVariantClasses()} ${className}`.trim();

  const handleClick = (event: React.MouseEvent) => {
    if (tag === "button") {
      event.preventDefault();
    }
    if (onClick) onClick();
    if (onItemClick) onItemClick();
  };

  if (tag === "a" && to) {
    return (
      <Link to={to} className={combinedClasses} onClick={handleClick}>
        {children}
      </Link>
    );
  }

  return (
    <button onClick={handleClick} className={combinedClasses}>
      {children}
    </button>
  );
};
