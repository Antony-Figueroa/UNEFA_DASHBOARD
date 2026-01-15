import React, { useState, useRef, useEffect, useCallback } from "react";
import { DropdownPortal } from "../../../components/ui/dropdown/DropdownPortal";
import { DropdownItem } from "../../../components/ui/dropdown/DropdownItem";
import { Tooltip } from "../../../components/ui/tooltip/Tooltip";
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
    Pagination,
} from "../../../components/ui/table";
import Badge from "../../../components/ui/badge/Badge";
import Button from "../../../components/ui/button/Button";
import { EmptyState } from "../../../components/ui/table/EmptyState";
import { TableSkeleton } from "../../../components/ui/table/TableSkeleton";
import {
    EditIcon,
    TrashIcon,
    ThreeDotsIcon,
    CheckCircleIcon,
    RefreshIcon,
    EyeIcon,
    ChevronDownIcon,
    ChevronUpIcon,
} from "../../../icons/actions";
import { PeriodoRowData } from "../types";

// ============================================
// CONSTANTS
// ============================================
const STATUS_COLORS = {
    1: "warning", // Pendiente
    2: "success", // En Curso
    3: "error",   // Culminado
} as const;

const STATUS_LABELS = {
    1: "Pendiente",
    2: "En Curso",
    3: "Culminado",
} as const;

// ============================================
// INTERFACES
// ============================================
interface ActionMenuProps {
    onEdit?: () => void;
    onDelete?: () => void;
    onCulminate?: () => void;
    onActivate?: () => void;
    onRestore?: () => void;
    onView?: () => void;
    onOpen: () => void;
    onClose: () => void;
    periodo: PeriodoRowData;
    canActivate?: boolean;
}

interface PeriodTableProps {
    data: PeriodoRowData[];
    status: "loading" | "success" | "error";
    error: Error | null;
    onEdit?: (periodo: PeriodoRowData) => void;
    onCulminate?: (periodo: PeriodoRowData) => void;
    onActivate?: (periodo: PeriodoRowData) => void;
    onDelete?: (id: string) => void;
    onRestore?: (periodo: PeriodoRowData) => void;
    onView?: (periodo: PeriodoRowData) => void;
    loading?: boolean;
}

type SortKey = keyof PeriodoRowData;

// ============================================
// HELPER FUNCTIONS
// ============================================

const getSafePeriodStatus = (periodo: PeriodoRowData): number => {
    // Convierte a número si es necesario
    const status = periodo.periodStatus;
    if (typeof status === 'string') return parseInt(status) || 1;
    return Number(status) || 1;
};

const getSafeProgress = (periodo: PeriodoRowData): number | null => {
    const progress = periodo.progress;
    if (progress === undefined || progress === null) return null;
    const numProgress = Number(progress);
    return isNaN(numProgress) ? null : Math.min(Math.max(numProgress, 0), 100);
};

// ============================================
// COMPONENT: ActionMenu
// ============================================
const ActionMenu = ({
    onEdit,
    onDelete,
    onCulminate,
    onActivate,
    onRestore,
    onView,
    onOpen,
    onClose,
    periodo,
    canActivate,
}: ActionMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [highlighted, setHighlighted] = useState(false);
    const trigger = useRef<HTMLButtonElement>(null);

    const toggleMenu = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            if (isOpen) {
                setIsOpen(false);
                setHighlighted(false);
                onClose();
            } else {
                setIsOpen(true);
                setHighlighted(true);
                onOpen();
            }
        },
        [isOpen, onOpen, onClose]
    );

    const handleAction = useCallback(
        (action?: () => void) => {
            setIsOpen(false);
            setHighlighted(false);
            onClose();
            action?.();
        },
        [onClose]
    );

    const currentPeriodStatus = getSafePeriodStatus(periodo);
    const hasStatus = !!periodo.status;

    return (
        <div className={`relative flex justify-end ${highlighted ? "z-50" : ""}`}>
            <button
                ref={trigger}
                onClick={toggleMenu}
                className="dropdown-toggle inline-flex items-center rounded-full p-1 text-text-secondary hover:bg-bg-secondary hover:text-text-primary dark:text-text-tertiary dark:hover:bg-white/5 min-h-12 min-w-12 justify-center"
                title="Acciones"
                aria-label="Menú de acciones"
            >
                <ThreeDotsIcon className="icon-sm" />
            </button>
            <DropdownPortal
                isOpen={isOpen}
                onClose={() => {
                    setIsOpen(false);
                    setHighlighted(false);
                    onClose();
                }}
                anchorEl={trigger.current}
                className="min-w-40"
            >
                {onView && (
                    <DropdownItem
                        onItemClick={() => handleAction(onView)}
                        variant="view"
                    >
                        <EyeIcon className="icon-md" />
                        Ver Detalles
                    </DropdownItem>
                )}
                {hasStatus && currentPeriodStatus !== 3 && onEdit && (
                    <DropdownItem
                        onItemClick={() => handleAction(onEdit)}
                        variant="edit"
                    >
                        <EditIcon className="icon-md" />
                        Editar
                    </DropdownItem>
                )}
                {hasStatus && currentPeriodStatus === 1 && canActivate && onActivate && (
                    <DropdownItem
                        onItemClick={() => handleAction(onActivate)}
                        variant="restore"
                    >
                        <CheckCircleIcon className="icon-md" />
                        Activar
                    </DropdownItem>
                )}
                {hasStatus && currentPeriodStatus === 2 && onCulminate && (
                    <DropdownItem
                        onItemClick={() => handleAction(onCulminate)}
                        variant="restore"
                    >
                        <CheckCircleIcon className="icon-md" />
                        Culminar
                    </DropdownItem>
                )}
                {!hasStatus && onRestore && (
                    <DropdownItem
                        onItemClick={() => handleAction(onRestore)}
                        variant="restore"
                    >
                        <RefreshIcon className="icon-md" />
                        Restaurar
                    </DropdownItem>
                )}
                {hasStatus && currentPeriodStatus === 1 && onDelete && (
                    <DropdownItem
                        onItemClick={() => handleAction(onDelete)}
                        variant="delete"
                    >
                        <TrashIcon className="icon-md" />
                        Eliminar
                    </DropdownItem>
                )}
            </DropdownPortal>
        </div>
    );
};

// ============================================
// COMPONENT: PeriodTable
// ============================================
const PeriodTable = ({
    data = [],
    status,
    error,
    onEdit,
    onCulminate,
    onActivate,
    onDelete,
    onRestore,
    onView,
    loading: externalLoading,
}: PeriodTableProps) => {
    // Check if data is valid for rendering
    const isInvalidData = !Array.isArray(data);

    const [highlightedRow, setHighlightedRow] = useState<string | null>(null);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: "asc" | "desc" }>({
        key: "startDate",
        order: "asc",
    });

    // Verificar si hay algún periodo "En Curso"
    const hasActivePeriod = React.useMemo(() => {
        return data.some(p => getSafePeriodStatus(p) === 2);
    }, [data]);

    // Identificar cuál es el PRÓXIMO periodo que se puede activar (Secuencia Cronológica Estricta)
    const nextActivatablePeriodId = React.useMemo(() => {
        if (hasActivePeriod) return null; // No se puede activar nada si ya hay uno en curso

        const safeData = isInvalidData ? [] : data;
        
        // Obtener todos los periodos que no están culminados ni en curso (es decir, Pendientes)
        const pendingPeriods = safeData.filter(p => getSafePeriodStatus(p) === 1);
        if (pendingPeriods.length === 0) return null;

        // Obtener el último periodo que fue culminado (si existe)
        const nonPendingPeriods = safeData.filter(p => getSafePeriodStatus(p) !== 1);
        
        // Ordenar todos los periodos cronológicamente por su descripción (lapso)
        // Usamos una versión local de getLapsoValue para no depender de imports externos si es posible,
        // pero como ya lo tenemos en el proyecto, lo ideal es usarlo.
        // Por simplicidad en este componente, ordenaremos por la fecha de inicio.
        const sortedAll = [...safeData].sort((a, b) => a.rawStartDate.getTime() - b.rawStartDate.getTime());
        
        if (nonPendingPeriods.length === 0) {
            // Si no hay ninguno culminado, el primero cronológicamente es el activable
            return sortedAll[0]?.periodId;
        }

        // Si hay culminados, buscamos el primero que sea "Pendiente" después del último culminado
        // Implementación manual de findLastIndex para compatibilidad
        let lastNonPendingIndex = -1;
        for (let i = sortedAll.length - 1; i >= 0; i--) {
            if (getSafePeriodStatus(sortedAll[i]) !== 1) {
                lastNonPendingIndex = i;
                break;
            }
        }
        const nextPeriod = sortedAll[lastNonPendingIndex + 1];

        return (nextPeriod && getSafePeriodStatus(nextPeriod) === 1) ? nextPeriod.periodId : null;
    }, [data, hasActivePeriod, isInvalidData]);

    // Filter and Sort data
    const filteredData = React.useMemo(() => {
        const safeData = isInvalidData ? [] : data;

        const filtered = safeData.filter((periodo) => {
            const description = periodo.description.toLowerCase();
            const matchesSearch = description.includes(searchTerm.toLowerCase());

            const periodStatus = getSafePeriodStatus(periodo).toString();
            const matchesStatus =
                statusFilter === "" ||
                periodStatus === statusFilter;

            return matchesSearch && matchesStatus;
        });

        filtered.sort((a, b) => {
            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];

            // Usar fechas originales para ordenamiento cronológico preciso
            if (sortConfig.key === "startDate") {
                valA = a.rawStartDate.getTime();
                valB = b.rawStartDate.getTime();
            } else if (sortConfig.key === "endDate") {
                valA = a.rawEndDate.getTime();
                valB = b.rawEndDate.getTime();
            }

            if (valA === undefined || valB === undefined || valA === null || valB === null) return 0;

            // Comparación genérica (funciona para números y strings)
            if (valA < valB) return sortConfig.order === "asc" ? -1 : 1;
            if (valA > valB) return sortConfig.order === "asc" ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [data, searchTerm, statusFilter, sortConfig, isInvalidData]);

    // Calculate pagination
    const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    // Event handlers
    const handlePageChange = useCallback((newPage: number) => {
        setCurrentPage(Math.max(1, Math.min(newPage, totalPages)));
    }, [totalPages]);

    const handleItemsPerPageChange = useCallback((value: number) => {
        setItemsPerPage(value);
        setCurrentPage(1);
    }, []);

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
        if (expandedRows.size === currentData.length) {
            setExpandedRows(new Set());
        } else {
            const allIds = currentData.map((p, index) => p.periodId ?? `idx-${index}`);
            setExpandedRows(new Set(allIds));
        }
    };

    const clearFilters = () => {
        setSearchTerm("");
        setStatusFilter("");
    };

    if (status === "loading" || externalLoading) {
        return (
            <div className="table-container">
                <TableSkeleton columns={5} rows={itemsPerPage} />
            </div>
        );
    }

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

    const getStatusColor = (status: number) => {
        return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || "warning";
    };

    // Handlers
    const handleSort = (key: SortKey) => {
        setSortConfig((prev) => ({
            key,
            order: prev.key === key && prev.order === "asc" ? "desc" : "asc",
        }));
    };

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

    const getStatusLabel = (status: number) => {
        return STATUS_LABELS[status as keyof typeof STATUS_LABELS] || "Desconocido";
    };

    // Si los datos son inválidos, mostrar mensaje de error después de ejecutar hooks
    if (isInvalidData) {
        return (
            <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-center">
                <p className="font-medium text-red-600">Error: Datos no válidos</p>
            </div>
        );
    }

    return (
        <div className="table-container">
            {/* Search and Filter Bar */}
            <div className="p-4 border-b border-border-light dark:border-white/5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <div className="relative max-w-xs w-full">
                        <input
                            type="text"
                            placeholder="Buscar por descripción..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-lg border border-border-medium bg-transparent py-2 pl-10 pr-4 text-sm text-text-primary placeholder-text-tertiary focus:border-brand-500 focus:outline-none dark:border-border-dark dark:bg-bg-dark dark:text-white/90 dark:placeholder-text-tertiary"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="icon-md"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                                />
                            </svg>
                        </span>
                    </div>
                    <div className="relative w-full sm:w-auto">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full rounded-lg border border-border-medium bg-transparent py-2 px-4 pr-10 text-sm text-text-primary focus:border-brand-500 focus:outline-none dark:border-border-dark dark:bg-bg-dark dark:text-white/90 appearance-none"
                        >
                            <option value="" className="dark:bg-bg-dark">
                                Seleccione Estado
                            </option>
                            <option value="2" className="dark:bg-bg-dark">
                                En Curso
                            </option>
                            <option value="1" className="dark:bg-bg-dark">
                                Pendiente
                            </option>
                            <option value="3" className="dark:bg-bg-dark">
                                Culminado
                            </option>
                        </select>
                        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                    {(searchTerm || statusFilter !== "") && (
                        <button
                            onClick={clearFilters}
                            className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1 transition-colors"
                        >
                            <RefreshIcon className="icon-xs" />
                            Limpiar filtros
                        </button>
                    )}

                    <div className="flex items-center gap-2">
                        {currentData.length > 0 && (
                            <button
                                onClick={toggleAllRows}
                                className="md:hidden flex items-center gap-2 rounded-lg bg-bg-secondary px-3 py-2 text-xs font-medium text-text-secondary hover:bg-bg-secondary/80 dark:bg-white/5 dark:text-text-tertiary transition-colors min-h-12"
                            >
                                {expandedRows.size === currentData.length ? (
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
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="hidden md:block max-w-full overflow-x-auto table-scrollbar">
                <Table className="table-root">
                    <TableHeader className="table-header-row">
                        <TableRow>
                            <TableCell
                                isHeader
                                className="table-header-cell cursor-pointer"
                                onClick={() => handleSort("description")}
                            >
                                <div className="flex items-center">
                                    Descripción
                                    <SortIndicator column="description" />
                                </div>
                            </TableCell>
                            <TableCell
                                isHeader
                                className="table-header-cell cursor-pointer"
                                onClick={() => handleSort("startDate")}
                            >
                                <div className="flex items-center">
                                    Fecha Inicio
                                    <SortIndicator column="startDate" />
                                </div>
                            </TableCell>
                            <TableCell
                                isHeader
                                className="table-header-cell cursor-pointer"
                                onClick={() => handleSort("endDate")}
                            >
                                <div className="flex items-center">
                                    Fecha Fin
                                    <SortIndicator column="endDate" />
                                </div>
                            </TableCell>
                            <TableCell
                                isHeader
                                className="table-header-cell cursor-pointer"
                                onClick={() => handleSort("periodStatus")}
                            >
                                <div className="flex items-center">
                                    Status
                                    <SortIndicator column="periodStatus" />
                                </div>
                            </TableCell>
                            <TableCell
                                isHeader
                                className="table-header-cell cursor-pointer"
                                onClick={() => handleSort("progress")}
                            >
                                <div className="flex items-center">
                                    Progreso
                                    <SortIndicator column="progress" />
                                </div>
                            </TableCell>
                            <TableCell
                                isHeader
                                className="table-header-cell"
                            >
                                &nbsp;
                            </TableCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-border-light dark:divide-white/5">
                        {currentData.length > 0 ? (
                            currentData.map((periodo) => {
                                const periodStatus = getSafePeriodStatus(periodo);
                                const periodId = periodo.periodId;

                                return (
                                    <TableRow
                                        key={periodId}
                                        className={`${highlightedRow === periodId ? 'bg-bg-secondary dark:bg-bg-dark' : ''} table-row-hover`}
                                    >
                                        <TableCell className="table-cell font-medium text-text-primary dark:text-white/90">
                                            {periodo.description}
                                        </TableCell>
                                        <TableCell className="table-cell text-text-secondary dark:text-text-tertiary">
                                            {periodo.startDate || "-"}
                                        </TableCell>
                                        <TableCell className="table-cell text-text-secondary dark:text-text-tertiary">
                                            {periodo.endDate || "-"}
                                        </TableCell>
                                        <TableCell className="table-cell">
                                            <Badge
                                                size="sm"
                                                color={getStatusColor(periodStatus)}
                                                variant="light"
                                                shape="rounded"
                                                className="font-semibold"
                                            >
                                                {getStatusLabel(periodStatus)}
                                            </Badge>
                                        </TableCell>
                                          <TableCell className="table-cell">
                                            {getSafePeriodStatus(periodo) === 2 && getSafeProgress(periodo) !== null ? (
                                                <Tooltip content={
                                                    <div className="space-y-1">
                                                        <p>Han pasado: {periodo.daysPassed} días</p>
                                                        <p>Faltan: {periodo.daysRemaining} días</p>
                                                        <p>Semanas restantes: {periodo.weeksRemaining}</p>
                                                    </div>
                                                }>
                                                    <div className="flex items-center gap-2 cursor-help">
                                                        <div className="w-full bg-border-light rounded-full h-2.5 dark:bg-border-dark">
                                                            <div
                                                                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                                                                style={{ width: `${getSafeProgress(periodo)}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-xs font-medium text-text-secondary dark:text-text-tertiary">
                                                            {Math.round(getSafeProgress(periodo) ?? 0)}%
                                                        </span>
                                                    </div>
                                                </Tooltip>
                                            ) : (
                                                <span className="text-text-tertiary dark:text-text-secondary">
                                                    -
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="table-cell text-right">
                                            <ActionMenu
                                                onEdit={onEdit ? () => onEdit(periodo) : undefined}
                                                onCulminate={
                                                    onCulminate ? () => onCulminate(periodo) : undefined
                                                }
                                                onActivate={
                                                    onActivate ? () => onActivate(periodo) : undefined
                                                }
                                                onView={onView ? () => onView(periodo) : undefined}
                                                onDelete={
                                                    onDelete && periodId
                                                        ? () => onDelete(periodId)
                                                        : undefined
                                                }
                                                onRestore={
                                                    onRestore ? () => onRestore(periodo) : undefined
                                                }
                                                onOpen={() => setHighlightedRow(periodId)}
                                                onClose={() => setHighlightedRow(null)}
                                                periodo={periodo}
                                                canActivate={periodId === nextActivatablePeriodId}
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="p-0">
                                    <EmptyState
                                        title="No se encontraron períodos"
                                        description={
                                            searchTerm || (statusFilter && statusFilter !== "")
                                                ? "No se encontraron períodos con los filtros aplicados. Intenta con otros términos."
                                                : "No hay períodos registrados en el sistema actualmente."
                                        }
                                        action={
                                            searchTerm || (statusFilter && statusFilter !== "") ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={clearFilters}
                                                    className="flex items-center gap-2"
                                                >
                                                    <RefreshIcon className="icon-xs" />
                                                    Limpiar filtros
                                                </Button>
                                            ) : undefined
                                        }
                                    />
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile View (Card format) */}
            <div className="md:hidden divide-y divide-border-light dark:divide-white/5">
                {currentData.length > 0 ? (
                    currentData.map((periodo, index) => {
                        const periodStatus = getSafePeriodStatus(periodo);
                        const periodId = periodo.periodId || `idx-${index}`;
                        const isExpanded = expandedRows.has(periodId);

                        return (
                            <div key={periodId} className="relative p-4 bg-white dark:bg-transparent transition-colors overflow-hidden">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex-1 text-center">
                                            <div className="flex justify-center mb-2">
                                                <Badge
                                                    size="sm"
                                                    color={getStatusColor(periodStatus)}
                                                >
                                                    {getStatusLabel(periodStatus)}
                                                </Badge>
                                            </div>
                                            <h3 className="text-sm font-bold text-text-primary dark:text-white/90 leading-tight truncate px-12">
                                                {periodo.description}
                                            </h3>
                                            <div className="flex items-center justify-center gap-4 mt-2">
                                                <div className="text-[11px] text-text-secondary dark:text-text-tertiary">
                                                    <span className="block font-medium uppercase tracking-wider opacity-60">Inicio</span>
                                                    {periodo.startDate || "-"}
                                                </div>
                                                <div className="text-[11px] text-text-secondary dark:text-text-tertiary">
                                                    <span className="block font-medium uppercase tracking-wider opacity-60">Fin</span>
                                                    {periodo.endDate || "-"}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="absolute right-2 top-2">
                                            <button
                                                onClick={() => toggleRowExpansion(periodId)}
                                                className="p-2 text-text-tertiary hover:bg-bg-secondary dark:hover:bg-white/5 rounded-full min-h-12 min-w-12 flex items-center justify-center transition-transform duration-200"
                                                style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                                                aria-label={isExpanded ? "Contraer" : "Expandir"}
                                            >
                                                <ChevronDownIcon className="icon-sm" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="mt-4 pt-4 border-t border-border-light dark:border-white/5 animate-fadeIn">
                                        <div className="space-y-6">
                                            {periodStatus === 2 && getSafeProgress(periodo) !== null && (
                                                <div className="text-center">
                                                    <p className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary dark:text-text-secondary mb-3">Progreso del Periodo</p>
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="w-full bg-border-light rounded-full h-2 dark:bg-border-dark max-w-50">
                                                            <div
                                                                className="bg-blue-600 h-2 rounded-full"
                                                                style={{ width: `${getSafeProgress(periodo)}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-xs font-bold text-text-primary dark:text-text-tertiary">
                                                            {Math.round(getSafeProgress(periodo) ?? 0)}%
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4 mt-6">
                                                        <div className="bg-bg-secondary dark:bg-white/5 p-3 rounded-xl">
                                                            <p className="text-[9px] text-text-tertiary uppercase font-bold mb-1">Días Transcurridos</p>
                                                            <p className="text-xs font-bold dark:text-text-tertiary">{periodo.daysPassed} días</p>
                                                        </div>
                                                        <div className="bg-bg-secondary dark:bg-white/5 p-3 rounded-xl">
                                                            <p className="text-[9px] text-text-tertiary uppercase font-bold mb-1">Días Restantes</p>
                                                            <p className="text-xs font-bold dark:text-text-tertiary">{periodo.daysRemaining} días</p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 bg-blue-50/50 dark:bg-blue-500/10 p-4 rounded-xl">
                                                        <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase mb-1">Semanas Restantes</p>
                                                        <p className="text-base font-bold text-blue-700 dark:text-blue-300">{periodo.weeksRemaining} semanas</p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex flex-col gap-3 pt-2">
                                                {!!periodo.status && periodStatus === 3 && onView && (
                                                    <button
                                                        onClick={() => onView(periodo)}
                                                        className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold bg-bg-secondary dark:bg-white/5 text-text-primary dark:text-text-tertiary rounded-xl min-h-12 active:scale-95 transition-all border border-transparent hover:border-border-light dark:hover:border-white/10"
                                                    >
                                                        <EyeIcon className="icon-sm" /> Ver
                                                    </button>
                                                )}
                                                {!!periodo.status && periodStatus !== 3 && onEdit && (
                                                    <button
                                                        onClick={() => onEdit(periodo)}
                                                        className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold bg-bg-secondary dark:bg-white/5 text-text-primary dark:text-text-tertiary rounded-xl min-h-12 active:scale-95 transition-all border border-transparent hover:border-border-light dark:hover:border-white/10"
                                                    >
                                                        <EditIcon className="icon-sm" /> Editar
                                                    </button>
                                                )}
                                                {!periodo.status && onRestore && (
                                                    <button
                                                        onClick={() => onRestore(periodo)}
                                                        className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl min-h-12 active:scale-95 transition-all border border-transparent hover:border-blue-200 dark:hover:border-blue-500/20"
                                                    >
                                                        <RefreshIcon className="icon-sm" /> Restaurar
                                                    </button>
                                                )}
                                                {!!periodo.status && periodStatus === 1 && !hasActivePeriod && onActivate && (
                                                    <button
                                                        onClick={() => onActivate(periodo)}
                                                        className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-xl min-h-12 active:scale-95 transition-all border border-transparent hover:border-brand-200 dark:hover:border-brand-500/20"
                                                    >
                                                        <CheckCircleIcon className="icon-sm" /> Activar
                                                    </button>
                                                )}
                                                {!!periodo.status && periodStatus === 1 && onDelete && (
                                                    <button
                                                        onClick={() => onDelete(periodo.periodId!)}
                                                        className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl min-h-12 active:scale-95 transition-all border border-transparent hover:border-red-200 dark:hover:border-red-500/20"
                                                    >
                                                        <TrashIcon className="icon-sm" /> Eliminar
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <EmptyState
                         title="No se encontraron períodos"
                         description={
                             searchTerm || (statusFilter && statusFilter !== "")
                                 ? "No se encontraron períodos con los filtros aplicados."
                                 : "No hay períodos para mostrar."
                         }
                         action={
                             searchTerm || (statusFilter && statusFilter !== "") ? (
                                 <Button
                                     variant="outline"
                                     size="sm"
                                     onClick={clearFilters}
                                     className="flex items-center gap-2"
                                 >
                                     <RefreshIcon className="icon-xs" />
                                     Limpiar filtros
                                 </Button>
                             ) : undefined
                         }
                     />
                )}
            </div>

            {/* Pagination Controls */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredData.length}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
                itemsPerPageOptions={[5, 10, 25]}
            />
        </div>
    );
};

export default PeriodTable;
