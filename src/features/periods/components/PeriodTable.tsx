import { useState, useEffect, useCallback, useMemo } from "react";
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
import { AsyncActionButton } from "../../../components/common/AsyncActionButton";
import CustomSelect from "../../../components/form/CustomSelect";
import {
    EditIcon,
    TrashIcon,
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

type SortKey = keyof PeriodoRowData;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Obtiene el estatus numérico de un periodo de forma segura.
 * 
 * @param periodo - Objeto de datos del periodo.
 * @returns El estatus como número (1: Pendiente, 2: En Curso, 3: Culminado).
 */
const getSafePeriodStatus = (periodo: PeriodoRowData): number => {
    if (!periodo) return 1;
    // Convierte a número si es necesario
    const status = periodo.periodStatus;
    if (typeof status === 'string') return parseInt(status) || 1;
    return Number(status) || 1;
};

/**
 * Obtiene el progreso numérico de un periodo de forma segura, normalizado entre 0 y 100.
 * 
 * @param periodo - Objeto de datos del periodo.
 * @returns El progreso como número o null si no aplica.
 */
const getSafeProgress = (periodo: PeriodoRowData): number | null => {
    if (!periodo) return null;
    const progress = periodo.progress;
    if (progress === undefined || progress === null) return null;
    const numProgress = Number(progress);
    return isNaN(numProgress) ? null : Math.min(Math.max(numProgress, 0), 100);
};

/**
 * Obtiene la etiqueta legible de un estatus de periodo.
 * 
 * @param status - Estatus numérico.
 * @returns Etiqueta de texto.
 */
const getStatusLabel = (status: number) => {
    return STATUS_LABELS[status as keyof typeof STATUS_LABELS] || "Desconocido";
};

/**
 * Propiedades para el sub-componente de botones de acción.
 */
interface ActionButtonsProps {
    onEdit?: () => void;
    onDelete?: () => void;
    onCulminate?: () => void;
    onActivate?: () => void;
    onRestore?: () => void;
    onView?: () => void;
    periodo: PeriodoRowData;
    canActivate: boolean;
    isMobile?: boolean;
    isDisabled?: boolean;
    disabledTooltip?: string;
}

/**
 * Sub-componente que renderiza los botones de acción para cada fila.
 * La disponibilidad de los botones depende del estatus del periodo y las funciones recibidas.
 */
const ActionButtons = ({
    onEdit,
    onDelete,
    onCulminate,
    onActivate,
    onRestore,
    onView,
    periodo,
    canActivate,
    isMobile = false,
    isDisabled = false,
    disabledTooltip = "",
}: ActionButtonsProps) => {
    const currentPeriodStatus = getSafePeriodStatus(periodo);
    const hasStatus = !!periodo.status;

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
            {hasStatus && currentPeriodStatus !== 3 && onEdit && (
                <AsyncActionButton
                    onClick={async () => {
                        if (window.confirm("¿Editar este período académico?")) onEdit();
                    }}
                    icon={<EditIcon />}
                    tooltip={currentPeriodStatus === 2 ? "Editar (Solo Fecha Fin)" : "Editar"}
                    label={isMobile ? (currentPeriodStatus === 2 ? "Editar Fecha Fin" : "Editar Período") : undefined}
                    variant="primary"
                    fullWidth={isMobile}
                />
            )}
            {hasStatus && currentPeriodStatus === 1 && canActivate && onActivate && (
                <AsyncActionButton
                    onClick={async () => {
                        if (window.confirm("¿Activar este período académico?")) onActivate();
                    }}
                    icon={<CheckCircleIcon />}
                    tooltip="Activar"
                    label={isMobile ? "Activar Período" : undefined}
                    variant="success"
                    fullWidth={isMobile}
                />
            )}
            {hasStatus && currentPeriodStatus === 2 && onCulminate && (
                <AsyncActionButton
                    onClick={async () => {
                        if (window.confirm("¿Culminar este período académico?")) onCulminate();
                    }}
                    icon={<CheckCircleIcon />}
                    tooltip="Culminar"
                    label={isMobile ? "Culminar Período" : undefined}
                    variant="success"
                    fullWidth={isMobile}
                />
            )}
            {!hasStatus && onRestore && (
                <AsyncActionButton
                    onClick={async () => {
                        if (window.confirm("¿Restaurar este período académico?")) onRestore();
                    }}
                    icon={<RefreshIcon />}
                    tooltip="Restaurar"
                    label={isMobile ? "Restaurar Período" : undefined}
                    variant="success"
                    fullWidth={isMobile}
                />
            )}
            {hasStatus && currentPeriodStatus === 1 && onDelete && (
                <AsyncActionButton
                    onClick={async () => {
                        if (window.confirm("¿Eliminar este período académico?")) onDelete();
                    }}
                    icon={<TrashIcon />}
                    tooltip={isDisabled ? disabledTooltip : "Eliminar"}
                    label={isMobile ? "Eliminar Período" : undefined}
                    variant="danger"
                    fullWidth={isMobile}
                    disabled={isDisabled}
                />
            )}
        </div>
    );
};

// ============================================
// INTERFACES
// ============================================
/**
 * Propiedades del componente PeriodTable.
 */
interface PeriodTableProps {
    /** Arreglo de datos de periodos formateados para la tabla */
    data: PeriodoRowData[];
    /** Estado de carga de la petición */
    status: "loading" | "success" | "error" | "idle";
    /** Error capturado si el estado es 'error' */
    error: Error | null;
    /** Función llamada al solicitar editar un periodo */
    onEdit?: (periodo: PeriodoRowData) => void;
    /** Función llamada al solicitar culminar un periodo en curso */
    onCulminate?: (periodo: PeriodoRowData) => void;
    /** Función llamada al solicitar activar un periodo pendiente */
    onActivate?: (periodo: PeriodoRowData) => void;
    /** Función llamada al solicitar eliminar un periodo */
    onDelete?: (periodo: PeriodoRowData) => void;
    /** Función llamada al solicitar restaurar un periodo eliminado */
    onRestore?: (periodo: PeriodoRowData) => void;
    /** Función llamada al solicitar ver detalles de un periodo */
    onView?: (periodo: PeriodoRowData) => void;
    /** Indica si hay una acción asíncrona en curso (guardado, borrado, etc.) */
    loading?: boolean;
}

/**
 * Componente de tabla para la visualización y gestión de periodos académicos.
 * 
 * Soporta filtrado, búsqueda, ordenamiento, paginación y vista responsiva para móviles.
 * Implementa una lógica de activación secuencial cronológica.
 * 
 * @param props - Propiedades del componente.
 */
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

    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: "asc" | "desc" }>({
        key: "startDate",
        order: "asc",
    });

    const [inUseIds, setInUseIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const used = new Set<string>();
        data.forEach(p => {
            if (p.isInUse) used.add(p.periodId);
        });
        setInUseIds(used);
    }, [data]);

    // Verificar si hay algún período "En Curso"
    const hasActivePeriod = useMemo(() => {
        return data.some(p => getSafePeriodStatus(p) === 2);
    }, [data]);

    // Identificar cuál es el PRÓXIMO periodo que se puede activar (Secuencia Cronológica Estricta)
    const nextActivatablePeriodId = useMemo(() => {
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
        const sortedAll = [...safeData].sort((a, b) => {
            const timeA = a.rawStartDate?.getTime() || 0;
            const timeB = b.rawStartDate?.getTime() || 0;
            return timeA - timeB;
        });
        
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
    const filteredData = useMemo(() => {
        const safeData = isInvalidData ? [] : data;

        const filtered = safeData.filter((periodo) => {
            const searchableText = `${periodo.description || ""} ${periodo.startDate || ""} ${periodo.endDate || ""} ${getStatusLabel(getSafePeriodStatus(periodo))}`.toLowerCase();
            const matchesSearch = searchableText.includes(searchTerm.toLowerCase());

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
                valA = a.rawStartDate?.getTime() || 0;
                valB = b.rawStartDate?.getTime() || 0;
            } else if (sortConfig.key === "endDate") {
                valA = a.rawEndDate?.getTime() || 0;
                valB = b.rawEndDate?.getTime() || 0;
            } else if (sortConfig.key === "description") {
                // Ordenar por descripción usando el valor del lapso
                const getLapsoValue = (desc: string) => {
                    if (!desc || !desc.includes('-')) return 0;
                    const [tipo, year] = desc.split('-');
                    const t = parseInt(tipo);
                    const y = parseInt(year);
                    if (isNaN(t) || isNaN(y)) return 0;
                    return y * 10 + t;
                };
                valA = getLapsoValue(a.description);
                valB = getLapsoValue(b.description);
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

    // Generar las opciones del filtro dinámicamente basándose en los estados presentes en los datos
    const statusOptions = useMemo(() => {
        // Obtener estados únicos de los datos
        const uniqueStatuses = Array.from(new Set(data.map(p => getSafePeriodStatus(p))));
        
        // Mapear a opciones con etiquetas amigables
        const options = uniqueStatuses.map(s => ({
            value: String(s),
            label: STATUS_LABELS[s as keyof typeof STATUS_LABELS] || `Estado ${s}`
        }));

        // Ordenar las opciones: En Curso (2) primero, luego Pendiente (1), luego Culminado (3)
        options.sort((a, b) => {
            const orderMap: Record<string, number> = { "2": 1, "1": 2, "3": 3 };
            return (orderMap[a.value] || 99) - (orderMap[b.value] || 99);
        });

        return [
            { value: "", label: "Todos los Estados" },
            ...options
        ];
    }, [data]);

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
                <TableSkeleton columns={4} rows={itemsPerPage} />
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
                            placeholder="Buscar por período"
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
                    <div className="relative w-full sm:w-48">
                        <CustomSelect
                            options={statusOptions}
                            value={statusFilter}
                            onChange={setStatusFilter}
                            placeholder="Estado"
                            className="min-w-[140px]"
                        />
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
                                onClick={async () => handleSort("description")}
                            >
                                <div className="flex items-center">
                                    Descripción
                                    <SortIndicator column="description" />
                                </div>
                            </TableCell>
                            <TableCell
                                isHeader
                                className="table-header-cell cursor-pointer"
                                onClick={async () => handleSort("startDate")}
                            >
                                <div className="flex items-center">
                                    Fecha Inicio
                                    <SortIndicator column="startDate" />
                                </div>
                            </TableCell>
                            <TableCell
                                isHeader
                                className="table-header-cell cursor-pointer"
                                onClick={async () => handleSort("endDate")}
                            >
                                <div className="flex items-center">
                                    Fecha Fin
                                    <SortIndicator column="endDate" />
                                </div>
                            </TableCell>

                            <TableCell
                                isHeader
                                className="table-header-cell cursor-pointer"
                                onClick={async () => handleSort("progress")}
                            >
                                <div className="flex items-center">
                                    Progreso
                                    <SortIndicator column="progress" />
                                </div>
                            </TableCell>
                            <TableCell
                                isHeader
                                className="table-header-cell cursor-pointer"
                                onClick={async () => handleSort("periodStatus")}
                            >
                                <div className="flex items-center">
                                    Status
                                    <SortIndicator column="periodStatus" />
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
                                        className="table-row-hover"
                                    >
                                        <TableCell className="table-cell font-medium text-text-primary dark:text-white">
                                            {periodo.description}
                                        </TableCell>

                                        <TableCell className="table-cell text-text-secondary dark:text-text-tertiary">
                                            {periodo.startDate || "-"}
                                        </TableCell>
                                        <TableCell className="table-cell text-text-secondary dark:text-text-tertiary">
                                            {periodo.endDate || "-"}
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
                                        <TableCell className="table-cell text-right">
                                            <ActionButtons
                                                onEdit={onEdit ? () => onEdit(periodo) : undefined}
                                                onCulminate={
                                                    onCulminate ? () => onCulminate(periodo) : undefined
                                                }
                                                onActivate={
                                                    onActivate ? () => onActivate(periodo) : undefined
                                                }
                                                onView={onView ? () => onView(periodo) : undefined}
                                                onDelete={
                                                    onDelete ? () => onDelete(periodo) : undefined
                                                }
                                                onRestore={
                                                    onRestore ? () => onRestore(periodo) : undefined
                                                }
                                                periodo={periodo}
                                                canActivate={periodId === nextActivatablePeriodId}
                                                isDisabled={inUseIds.has(periodId)}
                                                disabledTooltip="Este período está siendo usado en registros (pre-inscripción o inscripción) y no puede ser eliminado"
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="p-0">
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
                                                onClick={async () => toggleRowExpansion(periodId)}
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
                                                    <p className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary dark:text-text-secondary mb-3">Progreso del Período</p>
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

                                            <ActionButtons
                                                onEdit={onEdit ? () => onEdit(periodo) : undefined}
                                                onCulminate={
                                                    onCulminate ? () => onCulminate(periodo) : undefined
                                                }
                                                onActivate={
                                                    onActivate ? () => onActivate(periodo) : undefined
                                                }
                                                onView={onView ? () => onView(periodo) : undefined}
                                                onDelete={
                                                    onDelete ? () => onDelete(periodo) : undefined
                                                }
                                                onRestore={
                                                    onRestore ? () => onRestore(periodo) : undefined
                                                }
                                                periodo={periodo}
                                                canActivate={periodId === nextActivatablePeriodId}
                                                isMobile={true}
                                                isDisabled={inUseIds.has(periodId)}
                                                disabledTooltip="Este período está siendo usado en registros (pre-inscripción o inscripción) y no puede ser eliminado"
                                            />
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
