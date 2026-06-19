import React from "react";
import { cn } from "../../utils/cn";

interface TableToolbarProps {
  search?: React.ReactNode;
  filters?: React.ReactNode[];
  actions?: React.ReactNode;
  selectionBar?: React.ReactNode;
  className?: string;
}

// ponytail: contenedor flex con slots. Sin lógica de negocio.
export const TableToolbar: React.FC<TableToolbarProps> = ({
  search,
  filters,
  actions,
  selectionBar,
  className,
}) => (
  <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap mb-4", className)}>
    {search && <div className="w-full sm:w-auto sm:min-w-[200px]">{search}</div>}
    {filters && filters.length > 0 && (
      <div className="flex flex-wrap items-center gap-3">
        {filters.map((f, i) => <React.Fragment key={i}>{f}</React.Fragment>)}
      </div>
    )}
    {selectionBar && <div className="sm:ml-auto">{selectionBar}</div>}
    {actions && <div className="flex items-center gap-2 sm:ml-auto">{actions}</div>}
  </div>
);

export default TableToolbar;
