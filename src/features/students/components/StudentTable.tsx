import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow, Pagination } from "../../../components/ui/table";
import { AsyncActionButton } from "../../../components/common/AsyncActionButton";
import Button from "../../../components/ui/button/Button";
import AsyncButton from "../../../components/ui/button/AsyncButton";
import { EditIcon, TrashIcon, RefreshIcon, EyeIcon, ChevronDownIcon, ChevronUpIcon } from "../../../icons/actions";
import { PlusIcon } from "../../../icons";
import { StudentRowData } from "../types";
import Checkbox from "../../../components/form/input/Checkbox";
import { useDebounce } from "../../../hooks/useDebounce";

import Badge from "../../../components/ui/badge/Badge";
import { Tooltip } from "../../../components/ui/tooltip/Tooltip";
import { CrudStatus } from "../../../hooks/useCrud";
import { formatPhoneDisplay } from "../../../utils/inputFormat";
import { matchSearch } from "../../../utils/searchNormalizer";
import { toTitleCase } from "../../../utils/textFormat";

/**
 * Mapea el status numérico a color y etiqueta para el badge.
 */
const STATUS_CONFIG: Record<number, { color: "success" | "info" | "warning" | "error" | "light"; label: string }> = {
  0: { color: "error", label: "Retirado" },
  1: { color: "warning", label: "Pre-inscrito" },
  2: { color: "info", label: "Inscrito" },
  3: { color: "success", label: "Culminado" },
};

/** Badge que muestra el estado de práctica profesional del estudiante. */
const StatusBadge = ({ status }: { status: number | null }) => {
  if (status === null || status === undefined) {
    return <Badge color="light" size="sm">Sin registro</Badge>;
  }
  const config = STATUS_CONFIG[status] ?? { color: "light" as const, label: "Desconocido" };
  return <Badge color={config.color} size="sm">{config.label}</Badge>;
};

/**
 * Propiedades del componente StudentTable.
 */
interface StudentTableProps {
    /** Listado de estudiantes a mostrar */
    data: StudentRowData[];
    /** Estado de la carga de datos */
    status: CrudStatus;
    /** Error en caso de que la carga falle */
    error: Error | null;
    /** Función llamada al solicitar editar un estudiante */
    onEdit?: (student: StudentRowData) => void;
    /** Función llamada al solicitar cambiar el estado (activar/eliminar/restaurar) de un estudiante */
    onToggleStatus?: (student: StudentRowData) => void;
    /** Función llamada al solicitar exportar un estudiante a pre-inscripción */
    onExportToPreEnrollment?: (student: StudentRowData) => void;
    /** Función llamada al solicitar ver los detalles de un estudiante */
    onView?: (student: StudentRowData) => void;
    /** Función llamada para eliminar múltiples estudiantes en bloque */
    onBulkDelete?: (ids: string[]) => void;
    /** Función llamada para pre-inscribir en lote */
    onBatchPreEnroll?: (ids: string[]) => void;
    /** Función llamada para restaurar múltiples estudiantes en bloque */
    onBulkRestore?: (ids: string[]) => void;
    /** IDs de los estudiantes seleccionados (controlado externamente) */
    selectedIds?: string[];
    /** Función llamada cuando cambia la selección de estudiantes */
    onSelectionChange?: (ids: string[]) => void;
    /** Indica si se está en modo de visualización de registros inactivos */
    inactiveMode?: boolean;
    /** Pestaña activa actual (Activas o Inactivas) */
    activeTab?: "Activas" | "Inactivas";

    /** Indica si hay una acción en curso (loading de acción) */
    loading?: boolean;
}

/** Claves permitidas para el ordenamiento de la tabla */
type SortKey = "identificationNumber" | "fullNames" | "email" | "enrollmentDate";
/** Direcciones permitidas para el ordenamiento */
type SortOrder = "asc" | "desc";

/**
 * Propiedades para el componente de botones de acción.
 */
interface ActionButtonsProps {
    /** Callback para editar */
    onEdit?: () => void;
    /** Callback para cambiar estado */
    onToggleStatus?: () => void;
    /** Callback para exportar a pre-inscripción */
    onExportToPreEnrollment?: () => void;
    /** Callback para ver detalles */
    onView?: () => void;
    /** Pestaña activa */
    activeTab: "Activas" | "Inactivas";
    /** Modo inactivo */
    inactiveMode?: boolean;
    /** Indica si la vista es móvil */
    isMobile?: boolean;
    /** Estado actual del estudiante (activo/inactivo) */
    status?: boolean;
    /** Indica si el botón de eliminar está deshabilitado */
    isDisabled?: boolean;
    /** Tooltip a mostrar cuando está deshabilitado */
    disabledTooltip?: string;
    /** Indica si el botón de exportar está deshabilitado */
    isExportDisabled?: boolean;
    /** Tooltip para exportación deshabilitada */
    exportDisabledTooltip?: string;
    /** Deshabilita todas las acciones (cuando hay selección múltiple activa) */
    disableAll?: boolean;
}

/**
 * Icono de exportación personalizado.
 */
const ExportIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <polyline points="10 17 15 12 10 7" />
        <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
);

/**
 * Renderiza el conjunto de botones de acción para cada fila de la tabla.
 */
const ActionButtons = ({
    onEdit,
    onToggleStatus,
    onExportToPreEnrollment,
    onView,
    activeTab,
    inactiveMode = false,
    isMobile = false,
    status,
    isDisabled = false,
    disabledTooltip = "",
    isExportDisabled = false,
    exportDisabledTooltip = "",
    disableAll = false,
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
                    disabled={disableAll}
                />
            )}
            {onEdit && activeTab === "Activas" && (
                <AsyncActionButton
                    onClick={async () => onEdit()}
                    icon={<EditIcon />}
                    tooltip="Editar"
                    label={isMobile ? "Editar Estudiante" : undefined}
                    variant="primary"
                    fullWidth={isMobile}
                    disabled={disableAll}
                />
            )}
            {onToggleStatus && (inactiveMode || status === false) && (
                <AsyncActionButton
                    onClick={async () => onToggleStatus()}
                    icon={<RefreshIcon />}
                    tooltip={inactiveMode ? "Restaurar" : "Activar"}
                    label={isMobile ? (inactiveMode ? "Restaurar Estudiante" : "Activar Estudiante") : undefined}
                    variant="success"
                    fullWidth={isMobile}
                    disabled={disableAll}
                />
            )}
            {onToggleStatus && activeTab === "Activas" && (
                <AsyncActionButton
                    onClick={async () => onToggleStatus()}
                    icon={<TrashIcon />}
                    tooltip={isDisabled ? disabledTooltip : "Eliminar"}
                    label={isMobile ? "Eliminar Estudiante" : undefined}
                    variant="error"
                    fullWidth={isMobile}
                    disabled={disableAll || isDisabled}
                />
            )}
            {onExportToPreEnrollment && activeTab === "Activas" && (
                <AsyncActionButton
                    onClick={async () => onExportToPreEnrollment()}
                    icon={<ExportIcon className="icon-sm" />}
                    tooltip={isExportDisabled ? exportDisabledTooltip : "Exportar a Pre-Inscripción"}
                    label={isMobile ? "Exportar a Pre-Inscripción" : undefined}
                    variant="info"
                    fullWidth={isMobile}
                    disabled={disableAll || isExportDisabled}
                />
            )}
        </div>
    );
};

/**
 * Componente de tabla principal para la gestión de estudiantes.
 * Implementa filtrado, ordenamiento, paginación y acciones masivas.
 * 
 * @example
 * ```tsx
 * <StudentTable 
 *   data={students} 
 *   status="success" 
 *   error={null} 
 *   onEdit={handleEdit}
 * />
 * ```
 */
export default function StudentTable({
    data = [],
    status,
    error,
    onEdit,
    onToggleStatus,
    onExportToPreEnrollment,
    onView,
    onBulkDelete,
    onBulkRestore,
    onBatchPreEnroll,
    selectedIds: controlledSelectedIds,
    onSelectionChange,
    inactiveMode = false,
    activeTab = "Activas",

    loading = false,
}: StudentTableProps) {
    const [searchTerm, setSearchTerm] = useState("");

    const [dateFromFilter, setDateFromFilter] = useState("");
    const [dateToFilter, setDateToFilter] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    // Internal state for selection if not controlled from outside
    const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>([]);
    
    // Derived values to handle controlled/uncontrolled state
    const selectedIds = controlledSelectedIds !== undefined ? controlledSelectedIds : internalSelectedIds;
    
    // Ref to keep track of selectedIds without triggering re-renders in callbacks
    const selectedIdsRef = useRef(selectedIds);
    useEffect(() => {
        selectedIdsRef.current = selectedIds;
    }, [selectedIds]);

    const setSelectedIds = useCallback((ids: string[] | ((prev: string[]) => string[])) => {
        if (onSelectionChange) {
            if (typeof ids === "function") {
                onSelectionChange(ids(selectedIdsRef.current));
            } else {
                onSelectionChange(ids);
            }
        } else {
            setInternalSelectedIds(ids);
        }
    }, [onSelectionChange]);
    const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set());
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: SortOrder }>({
        key: "fullNames",
        order: "asc",
    });

    const debouncedSearch = useDebounce(searchTerm, 300);
    const debouncedDateFromFilter = useDebounce(dateFromFilter, 300);
    const debouncedDateToFilter = useDebounce(dateToFilter, 300);

    useEffect(() => {
        setSelectedIds([]);
    }, [activeTab, setSelectedIds]);

    const filteredData = useMemo(() => {
        const search = debouncedSearch.trim().toLowerCase();
        const filtered = data.filter((s) => {
            const matchesSearch = !search || matchSearch(s.identificationNumber || "", search) || matchSearch(s.fullNames || "", search) || matchSearch(s.phone || "", search) || matchSearch(s.email || "", search);
            // Filtros de fecha
            let matchesDateFrom = true;
            let matchesDateTo = true;
            
            if (debouncedDateFromFilter && s.enrollmentDate) {
                const enrollmentDate = new Date(s.enrollmentDate);
                const fromDate = new Date(debouncedDateFromFilter);
                fromDate.setHours(0, 0, 0, 0);
                matchesDateFrom = enrollmentDate >= fromDate;
            }
            
            if (debouncedDateToFilter && s.enrollmentDate) {
                const enrollmentDate = new Date(s.enrollmentDate);
                const toDate = new Date(debouncedDateToFilter);
                toDate.setHours(23, 59, 59, 999);
                matchesDateTo = enrollmentDate <= toDate;
            }

            const matchesTab = activeTab === "Activas" ? !!s.status : !s.status;

            return matchesSearch && 
                   matchesDateFrom && matchesDateTo &&
                   matchesTab;
        });

        filtered.sort((a, b) => {
            // Prioritize relevance if there's a search
            if (debouncedSearch) {
                const idA = a.identificationNumber.toLowerCase();
                const idB = b.identificationNumber.toLowerCase();
                const s = debouncedSearch.trim().toLowerCase();

                const getRelevance = (id: string) => {
                    if (id === s) return 2;
                    if (id.startsWith(s)) return 1;
                    return 0;
                };

                const relA = getRelevance(idA);
                const relB = getRelevance(idB);

                if (relA !== relB) return relB - relA;
            }

            const valA = a[sortConfig.key];
            const valB = b[sortConfig.key];
            const strA = String(valA ?? "").toLowerCase();
            const strB = String(valB ?? "").toLowerCase();

            if (strA < strB) return sortConfig.order === "asc" ? -1 : 1;
            if (strA > strB) return sortConfig.order === "asc" ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [debouncedSearch, data, debouncedDateFromFilter, debouncedDateToFilter, activeTab, sortConfig.key, sortConfig.order]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch]);

    const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paged = filteredData.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (page: number) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    const handleSort = (key: SortKey) => {
        setSortConfig((prev) => ({
            key,
            order: prev.key === key && prev.order === "asc" ? "desc" : "asc",
        }));
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            // Solo seleccionar IDs de estudiantes que no estén en uso ni pre-inscritos
            const selectableIds = paged
                .filter((s) => !s.isInUse && !s.hasActivePreEnrollment)
                .map((s) => s.studentId)
                .filter(Boolean) as string[];
            setSelectedIds(selectableIds);
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id: string, checked: boolean) => {
        const student = paged.find(s => s.studentId === id);
        if (student?.isInUse || student?.hasActivePreEnrollment) return; // No permitir seleccionar si está en uso o ya pre-inscrito

        if (checked) {
            setSelectedIds((prev) => [...prev, id]);
        } else {
            setSelectedIds((prev) => prev.filter((item) => item !== id));
        }
    };

    const toggleRowExpansion = (id: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    const toggleAllRows = () => {
        if (expandedRows.size === paged.length) {
            setExpandedRows(new Set());
        } else {
            const allIds = paged.map((s, index) => s.studentId ?? `idx-${index}`);
            setExpandedRows(new Set(allIds));
        }
    };

    const clearFilters = () => {
        setSearchTerm("");
        setDateFromFilter("");
        setDateToFilter("");
    };

    const SortIndicator = ({ column }: { column: SortKey }) => {
        if (sortConfig.key !== column) {
            return (
                <svg className="ml-1 icon-sm text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
            );
        }
        return sortConfig.order === "asc" ? (
            <svg className="ml-1 icon-sm text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
        ) : (
            <svg className="ml-1 icon-sm text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        );
    };

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

    return (
        <div className="table-container">
            <div className="p-4 border-b border-border-light dark:border-border-dark space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Filtro Unificado */}
                    <div className="col-span-1 lg:col-span-2">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Buscar por cédula, nombre, teléfono o correo"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full h-11 rounded-lg border border-border-medium bg-transparent px-4 py-2.5 pl-10 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 dark:border-border-dark dark:text-text-emphasis"
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>



                    {/* Filtro Fecha Desde */}
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-text-tertiary pointer-events-none">Desde</span>
                        <input
                            type="date"
                            value={dateFromFilter}
                            onChange={(e) => setDateFromFilter(e.target.value)}
                            className="w-full h-11 rounded-lg border border-border-medium bg-transparent pl-12 pr-4 text-sm text-text-primary focus:border-brand-500 focus:outline-none dark:border-border-dark dark:bg-bg-dark dark:text-text-emphasis"
                        />
                    </div>

                    {/* Filtro Fecha Hasta */}
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-text-tertiary pointer-events-none">Hasta</span>
                        <input
                            type="date"
                            value={dateToFilter}
                            onChange={(e) => setDateToFilter(e.target.value)}
                            className="w-full h-11 rounded-lg border border-border-medium bg-transparent pl-12 pr-4 text-sm text-text-primary focus:border-brand-500 focus:outline-none dark:border-border-dark dark:bg-bg-dark dark:text-text-emphasis"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border-light dark:border-border-dark">
                    <div className="flex items-center gap-4">
                        <div className="text-xs text-text-secondary dark:text-text-tertiary">
                            Mostrando <span className="font-bold text-text-primary dark:text-text-emphasis">{filteredData.length}</span> resultados
                        </div>
                        {searchTerm && (
                            <button
                                onClick={clearFilters}
                                className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1 transition-colors"
                            >
                                <RefreshIcon className="icon-xs" />
                                Limpiar filtros
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {paged.length > 0 && (
                            <Button variant="ghost" size="sm" className="md:hidden" onClick={toggleAllRows}>
                                {expandedRows.size === paged.length ? (
                                    <>
                                        <ChevronUpIcon className="icon-sm" />
                                        Contraer todo
                                    </>
                                ) : (
                                    <>
                                        <ChevronDownIcon className="icon-sm" />
                                        Expandir todo
                                    </>
                                )}
                            </Button>
                        )}

                        {selectedIds.length > 0 && !loading && (
                            <div className="flex items-center gap-2 animate-fadeIn">
                                <span className="hidden sm:inline text-xs font-medium text-text-secondary dark:text-text-tertiary mr-2">
                                    {selectedIds.length} seleccionados
                                </span>
                                {activeTab === "Activas" ? (
                                    <>
                                        {onBatchPreEnroll && (
                                            <AsyncButton
                                                variant="primary"
                                                size="sm"
                                                onClick={async () => onBatchPreEnroll(selectedIds)}
                                                className="gap-1.5"
                                            >
                                                <PlusIcon className="icon-sm" />
                                                Preinscribir en Lote
                                            </AsyncButton>
                                        )}
                                        <Tooltip 
                                            content={paged.filter(s => selectedIds.includes(s.studentId)).some(s => s.isInUse) ? "Algunos estudiantes seleccionados están en uso y no pueden ser eliminados" : "Eliminar seleccionados"}
                                            isDisabled={!paged.filter(s => selectedIds.includes(s.studentId)).some(s => s.isInUse)}
                                        >
                                            <Button
                                                variant="error"
                                                size="sm"
                                                onClick={async () => onBulkDelete?.(selectedIds)}
                                                disabled={paged.filter(s => selectedIds.includes(s.studentId)).some(s => s.isInUse)}
                                            >
                                                Eliminar
                                            </Button>
                                        </Tooltip>
                                    </>
                                ) : (
                                    <AsyncButton variant="success" size="sm" onClick={async () => onBulkRestore?.(selectedIds)}>
                                        Restaurar
                                    </AsyncButton>
                                )}
                            </div>
                        )}
                        {loading && selectedIds.length > 0 && (
                            <div className="flex items-center gap-2 animate-pulse">
                                <span className="text-xs font-medium text-text-secondary dark:text-text-tertiary italic">
                                    Procesando {selectedIds.length} registros...
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Vista de Escritorio (Tabla) */}
            <div className="hidden md:block max-w-full overflow-x-auto table-scrollbar">
                <Table className="table-root">
                    <TableHeader className="table-header-row">
                        <TableRow>
                            <TableCell isHeader className="table-header-cell w-10">
                                <Checkbox
                                    checked={
                                        paged.length > 0 && 
                                        paged.filter(s => !s.isInUse).length > 0 &&
                                        paged.filter(s => !s.isInUse).every(s => selectedIds.includes(s.studentId))
                                    }
                                    onChange={handleSelectAll}
                                    ariaLabel="Seleccionar todos los estudiantes"
                                />
                            </TableCell>
                            <TableCell isHeader className="table-header-cell cursor-pointer group" onClick={async () => handleSort("identificationNumber")}>
                                <div className="flex items-center">Cédula <SortIndicator column="identificationNumber" /></div>
                            </TableCell>
                            <TableCell isHeader className="table-header-cell cursor-pointer group" onClick={async () => handleSort("fullNames")}>
                                <div className="flex items-center">Nombres y Apellidos <SortIndicator column="fullNames" /></div>
                            </TableCell>
                            <TableCell isHeader className="table-header-cell">Teléfono</TableCell>
                            <TableCell isHeader className="table-header-cell">Estatus</TableCell>
                            <TableCell isHeader className="table-header-cell cursor-pointer group" onClick={async () => handleSort("email")}>
                                <div className="flex items-center">Correo Electrónico <SortIndicator column="email" /></div>
                            </TableCell>
                            <TableCell isHeader className="table-header-cell text-right"> </TableCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-border-light dark:divide-border-dark">
                        {paged.length > 0 ? (
                            paged.map((s, index) => (
                                <TableRow
                                    key={s.studentId}
                                    className={`table-row-hover ${index % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-bg-secondary/50 dark:bg-white/2"} ${selectedIds.includes(s.studentId) ? "bg-brand-50/30 dark:bg-brand-500/5" : ""}`}
                                >
                                    <TableCell className="table-cell">
                                        <Tooltip 
                                            content={s.isInUse ? "Este estudiante tiene registros relacionados y no puede ser seleccionado" : s.hasActivePreEnrollment ? "Este estudiante ya tiene una pre-inscripción activa" : ""}
                                            isDisabled={!s.isInUse && !s.hasActivePreEnrollment}
                                        >
                                            <div className="flex items-center justify-center">
                                                <Checkbox
                                                    checked={selectedIds.includes(s.studentId)}
                                                    onChange={(checked) => handleSelectRow(s.studentId, checked)}
                                                    disabled={s.isInUse || s.hasActivePreEnrollment}
                                                />
                                            </div>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell className="table-cell font-medium text-text-primary dark:text-text-emphasis">
                                        {s.identificationPrefix}-{s.identificationNumber}
                                    </TableCell>
                                    <TableCell className="table-cell text-text-secondary dark:text-text-tertiary font-semibold">
                                        {toTitleCase(s.fullNames)}
                                    </TableCell>
                                    <TableCell className="table-cell text-text-secondary dark:text-text-tertiary whitespace-nowrap">{formatPhoneDisplay(s.phone)}</TableCell>
                                    <TableCell className="table-cell">
                                        <StatusBadge status={s.currentPracticeStatus ?? null} />
                                    </TableCell>
                                    <TableCell className="table-cell text-text-secondary dark:text-text-tertiary">{s.email}</TableCell>
                                    <TableCell className="table-cell text-right relative">
                                        <ActionButtons
                                            onView={onView ? () => onView(s) : undefined}
                                            onEdit={onEdit ? () => onEdit(s) : undefined}
                                            onToggleStatus={onToggleStatus ? () => onToggleStatus(s) : undefined}
                                            onExportToPreEnrollment={onExportToPreEnrollment ? () => onExportToPreEnrollment(s) : undefined}
                                            activeTab={activeTab}
                                            inactiveMode={inactiveMode}
                                            status={s.status}
                                            isDisabled={s.isInUse}
                                            disabledTooltip="Este estudiante tiene registros relacionados y no puede ser eliminado"
                                            isExportDisabled={s.isInUse}
                                            exportDisabledTooltip="El estudiante ya tiene un registro en prácticas profesionales"
                                            disableAll={selectedIds.length > 0}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                    <TableCell className="table-cell py-24 text-center" colSpan={7}>
                                    <div className="flex flex-col items-center justify-center animate-fadeIn">
                                        <div className="mb-4 rounded-full bg-bg-secondary p-4 dark:bg-white/5">
                                            <svg className="h-8 w-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-sm font-bold text-text-primary dark:text-text-emphasis">No se encontraron estudiantes</h3>
                                        <p className="mt-1 text-xs text-text-secondary dark:text-text-tertiary">Intenta ajustar los filtros para encontrar lo que buscas.</p>
                        {(searchTerm || dateFromFilter || dateToFilter) && (
                                            <button
                                                onClick={clearFilters}
                                                className="mt-4 text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                                            >
                                                Ver todos los estudiantes
                                            </button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Vista Móvil (Cards) */}
            <div className="md:hidden divide-y divide-border-light dark:divide-border-dark">
                {paged.length > 0 ? (
                    paged.map((s, index) => {
                        const rowId = s.studentId ?? `idx-${index}`;
                        const isExpanded = expandedRows.has(rowId);
                        return (
                            <div key={rowId} className="relative p-4 bg-white dark:bg-transparent transition-colors overflow-hidden">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex-1 text-center">
                                            <h3 className="text-sm font-bold text-text-primary dark:text-text-emphasis leading-tight truncate px-8">
                                                {toTitleCase(s.fullNames)}
                                            </h3>
                                            <div className="flex justify-center mt-1.5">
                                                <StatusBadge status={s.currentPracticeStatus ?? null} />
                                            </div>
                                            <p className="text-xs text-text-secondary dark:text-text-tertiary mt-1 truncate">{s.identificationPrefix}-{s.identificationNumber}</p>
                                        </div>
                                        <button
                                            onClick={async () => toggleRowExpansion(rowId)}
                                            className="absolute right-2 top-2 p-2 text-text-tertiary hover:bg-bg-secondary dark:hover:bg-white/5 rounded-full min-h-12 min-w-12 flex items-center justify-center transition-transform duration-200"
                                            style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                                        >
                                            <ChevronDownIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="mt-4 space-y-6 animate-fadeIn border-t border-border-light dark:border-border-dark pt-6">
                                        <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-center">
                                            <div className="col-span-2 flex flex-col items-center">
                                                <p className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary dark:text-text-tertiary mb-1.5">Estatus</p>
                                                <StatusBadge status={s.currentPracticeStatus ?? null} />
                                            </div>
                                            <div className="col-span-2 flex flex-col items-center">
                                                <p className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary dark:text-text-tertiary mb-1.5">Correo Electrónico</p>
                                                <p className="text-sm text-text-secondary dark:text-text-tertiary font-medium truncate w-full max-w-62.5">{s.email}</p>
                                            </div>
                                            <div className="col-span-2 flex flex-col items-center">
                                                <p className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary dark:text-text-tertiary mb-1.5">Teléfono</p>
                                                <p className="text-sm text-text-secondary dark:text-text-tertiary font-medium">{formatPhoneDisplay(s.phone)}</p>
                                            </div>
                                        </div>

                                        <ActionButtons
                                            onView={onView ? () => onView(s) : undefined}
                                            onEdit={onEdit ? () => onEdit(s) : undefined}
                                            onToggleStatus={onToggleStatus ? () => onToggleStatus(s) : undefined}
                                            onExportToPreEnrollment={onExportToPreEnrollment ? () => onExportToPreEnrollment(s) : undefined}
                                            activeTab={activeTab}
                                            inactiveMode={inactiveMode}
                                            status={s.status}
                                            isMobile={true}
                                            isDisabled={s.isInUse}
                                            disabledTooltip="Este estudiante tiene registros relacionados y no puede ser eliminado"
                                            isExportDisabled={s.isInUse}
                                            exportDisabledTooltip="El estudiante ya tiene un registro en prácticas profesionales"
                                            disableAll={selectedIds.length > 0}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="py-20 text-center animate-fadeIn">
                        <div className="inline-flex mb-4 rounded-full bg-bg-secondary p-4 dark:bg-white/5">
                            <svg className="h-8 w-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <h3 className="text-sm font-bold text-text-primary dark:text-text-emphasis">No se encontraron estudiantes</h3>
                        <p className="mt-1 text-xs text-text-secondary dark:text-text-tertiary max-w-50 mx-auto">Intenta ajustar los filtros para encontrar lo que buscas.</p>
                        {searchTerm && (
                            <button
                                onClick={clearFilters}
                                className="mt-4 text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                            >
                                Ver todos los estudiantes
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Paginación */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredData.length}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={(newItemsPerPage) => {
                    setItemsPerPage(newItemsPerPage);
                    setCurrentPage(1);
                }}
                itemsPerPageOptions={[5, 10, 25]}
            />
        </div>
    );
}
