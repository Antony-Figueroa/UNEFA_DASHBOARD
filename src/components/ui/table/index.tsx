import { ReactNode } from "react";

// Props for Table
interface TableProps {
  children: ReactNode; // Table content (thead, tbody, etc.)
  className?: string; // Optional className for styling
}

// Props for TableHeader
interface TableHeaderProps {
  children: ReactNode; // Header row(s)
  className?: string; // Optional className for styling
}

// Props for TableBody
interface TableBodyProps {
  children: ReactNode; // Body row(s)
  className?: string; // Optional className for styling
}

// Props for TableRow
interface TableRowProps {
  children: ReactNode; // Cells (th or td)
  className?: string; // Optional className for styling
}

// Props for TableCell
interface TableCellProps {
  children: ReactNode; // Cell content
  isHeader?: boolean; // If true, renders as <th>, otherwise <td>
  className?: string; // Optional className for styling
  colSpan?: number; // Optional colspan for spanning multiple columns
  onClick?: () => void; // Optional onClick handler
}

// Table Component
const Table: React.FC<TableProps> = ({ children, className }) => {
  return <table className={`min-w-full  ${className}`}>{children}</table>;
};

// TableHeader Component
const TableHeader: React.FC<TableHeaderProps> = ({ children, className }) => {
  return (
    <thead className={`bg-bg-secondary/50 dark:bg-white/5 border-b border-border-light dark:border-border-dark/50 ${className ?? ""}`}>
      {children}
    </thead>
  );
};

// TableBody Component
const TableBody: React.FC<TableBodyProps> = ({ children, className }) => {
  return <tbody className={`divide-y divide-border-light dark:divide-border-dark/50 ${className ?? ""}`}>{children}</tbody>;
};

// TableRow Component
const TableRow: React.FC<TableRowProps> = ({ children, className }) => {
  return <tr className={`transition-colors duration-200 ${className ?? ""}`}>{children}</tr>;
};

// TableCell Component
const TableCell: React.FC<TableCellProps> = ({
  children,
  isHeader = false,
  className,
  colSpan,
  onClick,
}) => {
  const CellTag = isHeader ? "th" : "td";
  const baseClasses = isHeader
    ? "px-6 py-4 text-left text-xs font-bold text-text-tertiary uppercase tracking-wider dark:text-text-tertiary"
    : "px-6 py-4 text-sm text-text-secondary dark:text-text-tertiary";
    
  return (
    <CellTag className={`${baseClasses} ${className ?? ""}`} colSpan={colSpan} onClick={onClick}>
      {children}
    </CellTag>
  );
};

export { Table, TableHeader, TableBody, TableRow, TableCell };
export { Pagination } from "./Pagination";
