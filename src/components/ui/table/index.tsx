import React, { ReactNode } from "react";
import { cn } from "../../../utils/cn";

/**
 * Propiedades para el componente Table.
 */
export interface TableProps {
  /** Contenido de la tabla (thead, tbody, etc.). */
  children: ReactNode;
  /** Clases CSS adicionales para el elemento table. */
  className?: string;
  /** Si la tabla debe tener un contenedor con scroll horizontal. Por defecto true. */
  responsive?: boolean;
}

/**
 * Propiedades para el componente TableHeader.
 */
export interface TableHeaderProps {
  /** Filas de encabezado. */
  children: ReactNode;
  /** Clases CSS adicionales para el elemento thead. */
  className?: string;
}

/**
 * Propiedades para el componente TableBody.
 */
export interface TableBodyProps {
  /** Filas del cuerpo. */
  children: ReactNode;
  /** Clases CSS adicionales para el elemento tbody. */
  className?: string;
}

/**
 * Propiedades para el componente TableRow.
 */
export interface TableRowProps {
  /** Celdas (th o td). */
  children: ReactNode;
  /** Clases CSS adicionales para el elemento tr. */
  className?: string;
  /** Manejador de clic opcional para la fila. */
  onClick?: () => void;
  /** Si la fila es interactiva (añade efectos hover). */
  hoverable?: boolean;
}

/**
 * Propiedades para el componente TableCell.
 */
export interface TableCellProps {
  /** Contenido de la celda. */
  children: ReactNode;
  /** Si es true, se renderiza como <th>, de lo contrario como <td>. */
  isHeader?: boolean;
  /** Clases CSS adicionales para el elemento de celda. */
  className?: string;
  /** Colspan opcional. */
  colSpan?: number;
  /** Rowspan opcional. */
  rowSpan?: number;
  /** Manejador de clic opcional para la celda. */
  onClick?: () => void;
  /** Alineación del texto. */
  align?: "left" | "center" | "right";
}

/**
 * Componente Table principal.
 * Proporciona un contenedor responsivo y estilos base para tablas.
 * 
 * @component
 * @example
 * ```tsx
 * <Table>
 *   <TableHeader>
 *     <TableRow>
 *       <TableCell isHeader>ID</TableCell>
 *       <TableCell isHeader>Nombre</TableCell>
 *     </TableRow>
 *   </TableHeader>
 *   <TableBody>
 *     <TableRow hoverable>
 *       <TableCell>1</TableCell>
 *       <TableCell>Antony</TableCell>
 *     </TableRow>
 *   </TableBody>
 * </Table>
 * ```
 */
export const Table: React.FC<TableProps> = ({ children, className, responsive = true }) => {
  const table = (
    <table className={cn("w-full border-collapse text-sm text-left", className)}>
      {children}
    </table>
  );

  if (!responsive) return table;

  return (
    <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
      {table}
    </div>
  );
};

/**
 * Componente de encabezado de tabla (thead).
 */
export const TableHeader: React.FC<TableHeaderProps> = ({ children, className }) => {
  return (
    <thead className={cn(
      "bg-bg-secondary/50 dark:bg-white/5 border-b border-border-light dark:border-border-dark",
      className
    )}>
      {children}
    </thead>
  );
};

/**
 * Componente de cuerpo de tabla (tbody).
 */
export const TableBody: React.FC<TableBodyProps> = ({ children, className }) => {
  return (
    <tbody className={cn("divide-y divide-border-light dark:divide-border-dark", className)}>
      {children}
    </tbody>
  );
};

/**
 * Componente de fila de tabla (tr).
 */
export const TableRow: React.FC<TableRowProps> = ({ 
  children, 
  className, 
  onClick,
  hoverable = false
}) => {
  return (
    <tr
      onClick={onClick}
      className={cn(
        "transition-colors duration-200",
        hoverable && "hover:bg-bg-secondary/30 dark:hover:bg-white/5 cursor-pointer",
        className
      )}
    >
      {children}
    </tr>
  );
};

/**
 * Componente de celda de tabla (th o td).
 */
export const TableCell: React.FC<TableCellProps> = ({
  children,
  isHeader = false,
  className,
  colSpan,
  rowSpan,
  onClick,
  align = "left",
}) => {
  const Tag = isHeader ? "th" : "td";
  
  const alignClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <Tag
      colSpan={colSpan}
      rowSpan={rowSpan}
      onClick={onClick}
      className={cn(
        "px-4 py-3.5",
        isHeader 
          ? "font-semibold text-text-secondary dark:text-text-tertiary uppercase tracking-wider text-xs"
          : "text-text-main dark:text-gray-300",
        alignClasses[align],
        className
      )}
    >
      {children}
    </Tag>
  );
};

export { Pagination } from "./Pagination";
export default Table;

