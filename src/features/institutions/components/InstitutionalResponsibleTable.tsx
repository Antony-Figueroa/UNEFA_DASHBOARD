/**
 * @file InstitutionalResponsibleTable.tsx
 * @description Tabla para listar responsables institucionales con filtros y acciones.
 */

import { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  Pagination,
} from "../../../components/ui/table";
import { EmptyState } from "../../../components/ui/table/EmptyState";
import { TableSkeleton } from "../../../components/ui/skeleton";
import {
  ChevronDownIcon,
  EditIcon,
  TrashIcon,
  RefreshIcon,
  EyeIcon,
} from "../../../icons/actions";
import Badge from "../../../components/ui/badge/Badge";
import Button from "../../../components/ui/button/Button";
import { AsyncActionButton } from "../../../components/common/AsyncActionButton";
import { useDebounce } from "../../../hooks/useDebounce";
import Checkbox from "../../../components/form/input/Checkbox";
import { InstitutionalResponsible } from "../types";
import { formatPhoneDisplay } from "../../../utils/inputFormat";
import { matchSearch } from "../../../utils/searchNormalizer";

/**
 * Props for the InstitutionalResponsibleTable component.
 */
interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface InstitutionalResponsibleTableProps {
  /** Array of institutional responsible records to display */
  data: InstitutionalResponsible[];
  /** Current active tab filter */
  activeTab: "Activas" | "Inactivas";
  /** Current loading/error status of the data */
  status?: "loading" | "success" | "error";
  /** Optional error object with message */
  error?: { message: string };
  /** Callback fired when the edit button is clicked */
  onEdit?: (resp: InstitutionalResponsible) => void;
  /** Callback fired when the view button is clicked */
  onView?: (resp: InstitutionalResponsible) => void;
  /** Callback fired when the toggle status button is clicked */
  onToggleStatus?: (resp: InstitutionalResponsible) => void;
  /** Callback fired for bulk actions on selected records */
  onBulkAction?: (ids: string[], action: "inactivate" | "restore") => void;
  /** Whether a background loading action is in progress */
  isLoading?: boolean;
  /** Paginación server-side — reemplaza la paginación local */
  pagination?: PaginationInfo;
  /** Callback para cambiar de página (requerido si se usa paginación server-side) */
  onPageChange?: (page: number) => void;
}

/**
 * Valid sort keys for the institutional responsible table.
 */
type SortKey = keyof InstitutionalResponsible;

/**
 * Props for the ActionButtons sub-component.
 */
interface ActionButtonsProps {
  /** Callback for view action */
  onView?: () => void;
  /** Callback for edit action */
  onEdit?: () => void;
  /** Callback for toggle status action */
  onToggleStatus?: () => void;
  /** Current active tab filter */
  activeTab: "Activas" | "Inactivas";
  /** Whether the buttons are rendered in a mobile view */
  isMobile?: boolean;
  /** Whether editing is allowed */
  canEdit?: boolean;
  /** Whether status toggling is allowed */
  canToggle?: boolean;
}

/**
 * Renders action buttons (view, edit, delete/restore) for a table row.
 */
const ActionButtons = ({
  onView,
  onEdit,
  onToggleStatus,
  activeTab,
  isMobile = false,
  canEdit = false,
  canToggle = false,
}: ActionButtonsProps) => {
    const containerClasses = isMobile 
        ? "flex flex-col gap-3 pt-2" 
        : "flex justify-end gap-3";

    return (
        <div className={containerClasses}>
            {onView && (
                <AsyncActionButton
                    onClick={async () => onView()}
                    icon={<EyeIcon />}
                    tooltip="Ver Detalles"
                    label={isMobile ? "Ver Detalles" : undefined}
                    variant="primary"
                    fullWidth={isMobile}
                />
            )}
            {canEdit && activeTab === "Activas" && onEdit && (
                <AsyncActionButton
                    onClick={async () => onEdit()}
                    icon={<EditIcon />}
                    tooltip="Editar"
                    label={isMobile ? "Editar Responsable" : undefined}
                    variant="primary"
                    fullWidth={isMobile}
                />
            )}
            {canToggle && onToggleStatus && (
                <AsyncActionButton
                    onClick={async () => onToggleStatus()}
                    icon={activeTab === "Inactivas" ? <RefreshIcon /> : <TrashIcon />}
                    tooltip={activeTab === "Inactivas" ? "Restaurar" : "Eliminar"}
                    label={isMobile ? (activeTab === "Inactivas" ? "Restaurar Responsable" : "Eliminar Responsable") : undefined}
                    variant={activeTab === "Inactivas" ? "success" : "error"}
                    fullWidth={isMobile}
                />
            )}
        </div>
    );
};

/**
 * Component for displaying and managing institutional responsibles in a tabular format.
 * Supports filtering, sorting, pagination, and bulk actions.
 * 
 * @example
 * ```tsx
 * <InstitutionalResponsibleTable
 *   data={responsibles}
 *   activeTab="Activas"
 *   onEdit={(resp) => handleEdit(resp)}
 *   onToggleStatus={(resp) => handleToggle(resp)}
 * />
 * ```
 */
export default function InstitutionalResponsibleTable({
  data,
  activeTab,
  status,
  error,
  onEdit,
  onView,
  onToggleStatus,
  onBulkAction,
  isLoading = false,
  pagination,
  onPageChange,
}: InstitutionalResponsibleTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [localPage, setLocalPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: "asc" | "desc" }>({
    key: "lastName",
    order: "asc",
  });

  // Limpiar selección al cambiar de pestaña
  useEffect(() => {
    setSelectedIds(new Set());
  }, [activeTab]);

  // Filtros
  const [filters, setFilters] = useState({
    search: "",
    institution: "all",
    dateFrom: "",
    dateTo: "",
  });

  const debouncedSearch = useDebounce(filters.search, 300);

  const filteredData = useMemo(() => {
    const filtered = data.filter((item) => {
      const matchesTab = activeTab === "Activas" ? item.status : !item.status;
      const matchesSearch =
        debouncedSearch === "" ||
        matchSearch(`${item.identificationPrefix}${item.identificationNumber}`, debouncedSearch) ||
        matchSearch(`${item.firstName} ${item.lastName}`, debouncedSearch) ||
        matchSearch(item.email, debouncedSearch);
      const matchesInstitution = filters.institution === "all" || (item.institutions?.some(inst => inst.institutionId === filters.institution));
      const matchesDate =
        (!filters.dateFrom || new Date(item.registrationDate) >= new Date(filters.dateFrom)) &&
        (!filters.dateTo || new Date(item.registrationDate) <= new Date(filters.dateTo + 'T23:59:59'));

      return matchesTab && matchesSearch && matchesInstitution && matchesDate;
    });

    filtered.sort((a, b) => {
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];

      if (valA === undefined || valB === undefined) return 0;
      if (valA === null || valB === null) return 0;

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();

      if (strA < strB) return sortConfig.order === "asc" ? -1 : 1;
      if (strA > strB) return sortConfig.order === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [data, activeTab, debouncedSearch, filters.institution, filters.dateFrom, filters.dateTo, sortConfig]);

  /**
   * Generates institution options for the filter dropdown based on unique institutions in the data.
   */
  const institutionOptions = useMemo(() => {
    const allInstitutions = data.flatMap(i => i.institutions || []);
    const uniqueInstitutions = Array.from(new Set(allInstitutions.map(inst => inst.institutionId)))
      .map(id => {
        const inst = allInstitutions.find(item => item.institutionId === id);
        return { value: id, label: inst?.institutionName || "Desconocida" };
      });
    return [{ value: "all", label: "Todas las Empresas o Instituciones" }, ...uniqueInstitutions];
  }, [data]);

  // Paginación server-side o local
  const isServerSide = !!pagination && !!onPageChange;
  const currentPage = isServerSide ? pagination.page : localPage;
  const totalPages = isServerSide ? pagination.totalPages : Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const currentData = isServerSide ? data : filteredData.slice((localPage - 1) * itemsPerPage, localPage * itemsPerPage);

  if (status === "error") {
    return (
      <div className="rounded-xl border border-alert-error-border bg-alert-error-bg p-8 text-center dark:border-error-800 dark:bg-error-950 animate-fadeIn">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error-100 dark:bg-error-900/30">
          <svg className="h-6 w-6 text-error-600 dark:text-error-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-alert-error-text dark:text-error-400">Error de conexión</h3>
        <p className="mt-2 text-text-secondary dark:text-text-tertiary font-medium">
          no hay conexion a la bd
        </p>
        {error && error.message !== 'no hay conexion a la bd' && (
          <div className="mt-4 text-xs text-alert-error-text/70 dark:text-error-500/70 italic">
            Detalles: {error.message}
          </div>
        )}
      </div>
    );
  }

  /**
   * Toggles the expanded state of a row in mobile view.
   * @param id - The ID of the responsible to toggle.
   */
  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedRows(newExpanded);
  };

  /**
   * Updates the sort configuration when a column header is clicked.
   * @param key - The field to sort by.
   */
  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => ({
      key,
      order: prev.key === key && prev.order === "asc" ? "desc" : "asc",
    }));
  };

  /**
   * Renders an icon indicating the current sort direction for a column.
   */
  const SortIndicator = ({ column }: { column: SortKey }) => {
    if (sortConfig.key !== column) {
      return (
        <svg className="ml-1 icon-xs text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortConfig.order === "asc" ? (
      <svg className="ml-1 icon-xs text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="ml-1 icon-xs text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  /**
   * Toggles selection for all items in the current page.
   * @param checked - Whether to select or deselect all.
   */
  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(currentData.map((i) => i.responsibleId)));
    } else {
      setSelectedIds(new Set());
    }
  };

  /**
   * Toggles selection for a single item.
   * @param id - The ID of the responsible to toggle.
   * @param checked - Whether the item is selected.
   */
  const toggleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) newSelected.add(id);
    else newSelected.delete(id);
    setSelectedIds(newSelected);
  };

  if (isLoading) {
    return <TableSkeleton rows={5} columns={7} />;
  }

  return (
    <div className="table-container">
      <div className="p-4 border-b border-border-light dark:border-white/5 space-y-4">
        {/* Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Cédula, nombre o correo..."
              defaultValue={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              className="w-full h-11 rounded-lg border border-border-medium bg-transparent pl-10 pr-4 text-sm text-text-primary placeholder-text-tertiary focus:border-brand-500 focus:outline-none dark:border-border-dark dark:bg-bg-dark dark:text-white/90 dark:placeholder-text-tertiary"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </span>
          </div>
          <div className="relative">
            <select
              value={filters.institution}
              onChange={(e) => setFilters((prev) => ({ ...prev, institution: e.target.value }))}
              className="w-full h-11 rounded-lg border border-border-medium bg-transparent pl-3 pr-10 text-sm text-text-primary focus:border-brand-500 focus:outline-none dark:border-border-dark dark:bg-bg-dark dark:text-white/90 appearance-none"
            >
              {institutionOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="dark:bg-bg-dark">
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <div>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
              className="w-full h-11 rounded-lg border border-border-medium bg-transparent px-3 text-sm text-text-primary focus:border-brand-500 focus:outline-none dark:border-border-dark dark:bg-bg-dark dark:text-white/90"
              title="Fecha desde"
            />
          </div>
          <div>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
              className="w-full h-11 rounded-lg border border-border-medium bg-transparent px-3 text-sm text-text-primary focus:border-brand-500 focus:outline-none dark:border-border-dark dark:bg-bg-dark dark:text-white/90"
              title="Fecha hasta"
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t border-border-light dark:border-white/5">
          <div className="flex items-center gap-4">
            <div className="text-xs text-text-secondary dark:text-text-tertiary">
              Mostrando <span className="font-bold text-text-primary dark:text-white">{filteredData.length}</span> resultados
            </div>
            {(filters.search || filters.institution !== "all" || filters.dateFrom || filters.dateTo) && (
              <button
                onClick={async () => setFilters({ search: "", institution: "all", dateFrom: "", dateTo: "" })}
                className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1 transition-colors"
              >
                <RefreshIcon className="icon-xs" />
                Limpiar filtros
              </button>
            )}
          </div>
          <div className="flex items-center">
            {selectedIds.size > 0 && onBulkAction && (
              <div className="flex items-center gap-2 animate-fadeIn">
                <span className="hidden sm:inline text-xs font-medium text-text-secondary dark:text-text-tertiary mr-2">
                  {selectedIds.size} seleccionados
                </span>
                <Button
                  variant={activeTab === "Activas" ? "outline" : "primary"}
                  size="sm"
                  className="min-h-12"
                  onClick={() => {
                    onBulkAction(Array.from(selectedIds), activeTab === "Activas" ? "inactivate" : "restore");
                    setSelectedIds(new Set());
                  }}
                >
                  {activeTab === "Activas" ? (
                    <span className="flex items-center gap-2">
                      <TrashIcon className="icon-sm" /> Eliminar
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <RefreshIcon className="icon-sm" /> Restaurar
                    </span>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block max-w-full overflow-x-auto table-scrollbar">
        <Table>
          <TableHeader className="table-header-row">
            <TableRow>
              <TableCell isHeader className="table-header-cell w-12">
                <Checkbox
                  checked={selectedIds.size === currentData.length && currentData.length > 0}
                  onChange={toggleSelectAll}
                  ariaLabel="Seleccionar todos"
                />
              </TableCell>
              <TableCell isHeader className="table-header-cell cursor-pointer" onClick={async () => handleSort("identificationNumber")}>
                <div className="flex items-center">
                  CÉDULA
                  <SortIndicator column="identificationNumber" />
                </div>
              </TableCell>
              <TableCell isHeader className="table-header-cell cursor-pointer" onClick={async () => handleSort("firstName")}>
                <div className="flex items-center">
                  NOMBRE COMPLETO
                  <SortIndicator column="firstName" />
                </div>
              </TableCell>
              <TableCell isHeader className="table-header-cell cursor-pointer text-center" onClick={async () => handleSort("institutions")}>
                <div className="flex items-center justify-center">
                  EMPRESA O INSTITUCIÓN
                  <SortIndicator column="institutions" />
                </div>
              </TableCell>
              <TableCell isHeader className="table-header-cell">
                <div className="flex items-center">
                  CONTACTO
                </div>
              </TableCell>
              <TableCell isHeader className="table-header-cell cursor-pointer text-center" onClick={async () => handleSort("registrationDate")}>
                <div className="flex items-center justify-center">
                  FECHA DE REGISTRO
                  <SortIndicator column="registrationDate" />
                </div>
              </TableCell>
              <TableCell isHeader className="table-header-cell text-right">
                &nbsp;
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.length > 0 ? (
              currentData.map((item, index) => (
                <TableRow
                  key={item.responsibleId}
                  className={`${index % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-bg-secondary/50 dark:bg-white/2"} ${selectedIds.has(item.responsibleId) ? "bg-brand-50/30 dark:bg-brand-500/5" : ""}`}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(item.responsibleId)}
                      onChange={(checked) => toggleSelectOne(item.responsibleId, checked)}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-text-primary dark:text-white/90 whitespace-nowrap">
                    {`${(item.identificationPrefix || 'V').replace(/-/g, '')}-${String(item.identificationNumber).replace(/-/g, '')}`}
                  </TableCell>
                  <TableCell className="text-text-secondary dark:text-text-tertiary font-semibold">
                    {[item.firstName, item.middleName, item.lastName, item.secondLastName].filter(Boolean).join(' ')}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge color="primary" variant="light" size="sm" shape="rounded">
                      {item.institutions?.map(inst => inst.institutionName).join(", ") || "Sin empresa o institución"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-text-primary dark:text-white/90 text-sm">{item.email}</span>
                      <span className="text-text-tertiary dark:text-text-secondary text-xs mt-0.5">{formatPhoneDisplay(item.phone)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-text-secondary dark:text-text-tertiary whitespace-nowrap text-sm">
                    {new Date(item.registrationDate).toLocaleDateString('es-VE', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit'
                    })}
                  </TableCell>
                  <TableCell className="table-cell text-right">
                    <ActionButtons
                      onView={onView ? () => onView(item) : undefined}
                      onEdit={onEdit ? () => onEdit(item) : undefined}
                      onToggleStatus={onToggleStatus ? () => onToggleStatus(item) : undefined}
                      activeTab={activeTab}
                      canEdit={!!onEdit}
                      canToggle={!!onToggleStatus}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="p-0">
                  <EmptyState
                    title="No se encontraron responsables"
                    description={filters.search || filters.institution !== "all" || filters.dateFrom || filters.dateTo
                      ? "Intenta ajustar los filtros para encontrar lo que buscas."
                      : "Aún no hay responsables registrados en esta categoría."}
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden divide-y divide-border-light dark:divide-white/5">
        {currentData.length > 0 ? (
          currentData.map((item) => {
            const rowId = item.responsibleId;
            const isExpanded = expandedRows.has(rowId);
            const fullName = [item.firstName, item.middleName, item.lastName, item.secondLastName].filter(Boolean).join(' ');

            return (
              <div
                key={rowId}
                className="relative p-4 bg-white dark:bg-transparent transition-colors overflow-hidden"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex-1 text-center">
                      <h3 className="text-sm font-bold text-text-primary dark:text-white/90 leading-tight truncate px-8">
                        {fullName}
                      </h3>
                      <p className="text-xs text-text-secondary mt-1 truncate">
                        {`${(item.identificationPrefix || 'V').replace(/-/g, '')}-${String(item.identificationNumber).replace(/-/g, '')}`}
                      </p>
                    </div>
                    <button
                      onClick={async () => toggleRow(rowId)}
                      className="absolute right-2 top-2 p-2 text-text-tertiary hover:bg-bg-secondary dark:hover:bg-white/5 rounded-full min-h-12 min-w-12 flex items-center justify-center transition-transform duration-200"
                      style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                    >
                      <ChevronDownIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 space-y-6 animate-fadeIn border-t border-border-light dark:border-white/5 pt-6">
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-center">
                      <div className="col-span-2 flex flex-col items-center">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary dark:text-text-secondary mb-1.5">
                          Empresa o Institución
                        </p>
                        <div className="flex justify-center w-full">
                          <Badge color="primary" variant="light" size="sm">
                      {item.institutions?.map(inst => inst.institutionName).join(", ") || "Sin empresa o institución"}
                          </Badge>
                        </div>
                      </div>
                      <div className="col-span-2 flex flex-col items-center">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary dark:text-text-secondary mb-1.5">
                          Contacto
                        </p>
                        <p className="text-sm text-text-primary dark:text-text-tertiary font-medium truncate w-full max-w-62.5">
                          {item.email}
                        </p>
                        <p className="text-xs text-text-secondary dark:text-text-secondary mt-1">
                          {formatPhoneDisplay(item.phone)}
                        </p>
                      </div>
                      <div className="col-span-2 flex flex-col items-center">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary dark:text-text-secondary mb-1.5">
                          Fecha de Registro
                        </p>
                        <p className="text-sm text-text-primary dark:text-text-tertiary font-medium">
                          {new Date(item.registrationDate).toLocaleDateString('es-VE', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    <ActionButtons
                      onView={onView ? () => onView(item) : undefined}
                      onEdit={onEdit ? () => onEdit(item) : undefined}
                      onToggleStatus={onToggleStatus ? () => onToggleStatus(item) : undefined}
                      activeTab={activeTab}
                      canEdit={!!onEdit}
                      canToggle={!!onToggleStatus}
                      isMobile={true}
                    />
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <EmptyState
            title="No se encontraron responsables"
            description={filters.search || filters.institution !== "all" || filters.dateFrom || filters.dateTo
              ? "Intenta ajustar los filtros para encontrar lo que buscas."
              : "Aún no hay responsables registrados en esta categoría."}
          />
        )}
      </div>

      {isServerSide && pagination.total === 0 ? null : (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={isServerSide ? onPageChange : setLocalPage}
          itemsPerPage={isServerSide ? pagination.limit : itemsPerPage}
          onItemsPerPageChange={isServerSide ? undefined : (newItems) => { setItemsPerPage(newItems); setLocalPage(1); }}
          totalItems={isServerSide ? pagination.total : filteredData.length}
        />
      )}
    </div>
  );
}
