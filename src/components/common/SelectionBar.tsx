import React from "react";
import { Tooltip } from "../ui/tooltip/Tooltip";
import Button from "../ui/button/Button";
import { cn } from "../../utils/cn";

export interface SelectionAction {
  label: string;
  variant: "primary" | "error" | "success" | "warning";
  onClick: () => void;
  disabled?: boolean;
  tooltip?: string;
  loading?: boolean;
}

interface SelectionBarProps {
  count: number;
  actions: SelectionAction[];
  className?: string;
  hideCountOnMobile?: boolean;
}

// ponytail: contenedor flex + map de actions. Sin state, sin efectos.
export const SelectionBar: React.FC<SelectionBarProps> = ({
  count,
  actions,
  className,
  hideCountOnMobile = true,
}) => {
  if (count === 0) return null;

  return (
    <div className={cn("flex items-center gap-2 animate-fadeIn", className)}>
      <span className={cn(
        "text-sm font-medium text-text-secondary dark:text-text-tertiary",
        hideCountOnMobile && "hidden sm:inline"
      )}>
        {count} seleccionado{count !== 1 ? "s" : ""}
      </span>
      {actions.map((action, i) => {
        const btn = (
          <Button
            key={i}
            variant={action.variant}
            size="sm"
            onClick={action.onClick}
            disabled={action.disabled}
            loading={action.loading}
          >
            {action.label}
          </Button>
        );
        return action.tooltip ? (
          <Tooltip key={i} content={action.tooltip} isDisabled={!action.disabled}>
            {btn}
          </Tooltip>
        ) : btn;
      })}
    </div>
  );
};

export default SelectionBar;
