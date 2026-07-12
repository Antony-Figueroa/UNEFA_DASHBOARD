import { useState, useEffect, useMemo } from "react";
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
import { matchSearch } from "../../../utils/searchNormalizer";
import { TableSkeleton } from "../../../components/ui/skeleton";
import { AsyncActionButton } from "../../../components/common/AsyncActionButton";
import DisplayText from "../../../components/common/DisplayText";
import CustomSelect from "../../../components/form/CustomSelect";
import InputField from "../../../components/form/input/InputField";
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
import PeriodTimeline from "./PeriodTimeline";
import CurrentPeriodCard from "./CurrentPeriodCard";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  getSafePeriodStatus,
  getSafeProgress,
  getStatusLabel,
} from "./periodUtils";

type SortKey = keyof PeriodoRowData;

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
    disableAll?: boolean;
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
    disableAll = false,
}: ActionButtonsProps) => {
    const currentPeriodStatus = getSafePeriodStatus(periodo);
    const hasStatus = !!periodo.periodStatus;
    const isInactive = periodo.status === false; // Período en papelera (inactivo)

    const containerClasses = isMobile 
        ? "flex flex-col gap-3 pt-2" 
        : "flex justify-end gap-3";

    return (
        <div className={containerClasses}>
            {/* Botón siempre disponible: Ver Detalles */}
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
            
            {/* SI el período está INACTIVO: solo mostrar botón de Restaurar */}
            {isInactive && onRestore && (
                <AsyncActionButton
                    onClick={async () => onRestore()}
                    icon={<RefreshIcon />}
                    tooltip="Restaurar"
                    label={isMobile ? "Restaurar Período" : undefined}
                    variant="success"
                    fullWidth={isMobile}
                    disabled={disableAll}
                />
            )}
            
            {/* SI el período está ACTIVO: mostrar toda la botonera normal */}
            {!isInactive && (
                <>
                    {hasStatus && currentPeriodStatus !== 3 && onEdit && (
                        <AsyncActionButton
                            onClick={async () => onEdit()}
                            icon={<EditIcon />}
                            tooltip={currentPeriodStatus === 2 ? "Editar (Solo Fecha Fin)" : "Editar"}
                            label={isMobile ? (currentPeriodStatus === 2 ? "Editar Fecha Fin" : "Editar Período") : undefined}
                            variant="primary"
                            fullWidth={isMobile}
                            disabled={disableAll}
                        />
                    )}
                    {hasStatus && currentPeriodStatus === 1 && canActivate && periodo.status && onActivate && (
                        <AsyncActionButton
                            onClick={async () => onActivate()}
                            icon={<CheckCircleIcon />}
                            tooltip="Activar"
                            label={isMobile ? "Activar Período" : undefined}
                            variant="success"
                            fullWidth={isMobile}
                            disabled={disableAll}
                        />
                    )}
                    {hasStatus && currentPeriodStatus === 2 && onCulminate && (
                        <AsyncActionButton
                            onClick={async () => onCulminate()}
                            icon={<CheckCircleIcon />}
                            tooltip="Culminar"
                            label={isMobile ? "Culminar Período" : undefined}
                            variant="success"
                            fullWidth={isMobile}
                            disabled={disableAll}
                        />
                    )}
                    {hasStatus && currentPeriodStatus === 1 && onDelete && (
                        <AsyncActionButton
                            onClick={async () => onDelete()}
                            icon={<TrashIcon />}
                            tooltip={isDisabled ? disabledTooltip : "Eliminar"}
                            label={isMobile ? "Eliminar Período" : undefined}
                            variant="error"
                            fullWidth={isMobile}
                            disabled={disableAll || isDisabled}
                        />
                    )}
                </>
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
    /** Array de datos de periodos */
    data: PeriodoRowData[];
    /** Estado de carga/error */
    status: "loading" | "success" | "error" | "idle";
    /** Objeto de error si existe */
    error: Error | null;
    /** Callback para editar */
    onEdit?: (periodo: PeriodoRowData) => void;
    /** Callback para eliminar */
    onDelete?: (periodo: PeriodoRowData) => void;
    /** Callback para culminar */
    onCulminate?: (periodo: PeriodoRowData) => void;
    /** Callback para activar */
    onActivate?: (periodo: PeriodoRowData) => void;
    /** Callback para restaurar */
    onRestore?: (periodo: PeriodoRowData) => void;
    /** Callback para ver detalles */
    onView?: (periodo: PeriodoRowData) => void;
    /** Callback para eliminación masiva */
    onBulkDelete?: (periodos: PeriodoRowData[]) => void;
    /** Callback para restauración masiva */
    onBulkRestore?: (periodos: PeriodoRowData[]) => void;
    /** Tab activa (filtro) - Obsoleto */
    activeTab?: string;
    /** Indica si hay carga externa */
    externalLoading?: boolean;
    /** Callback que notifica si hay filas seleccionadas (para bloquear botonera externa) */
    onSelectionChange?: (selecting: boolean) => void;
    /** Modo solo lectura: oculta edición, culminación, activación, eliminación y selección masiva */
    readOnly?: boolean;
}

/**
 * Componente de tabla para la gestión de periodos académicos.
 * 
 * Muestra una lista de periodos con su estatus, fechas y progreso.
 * Permite filtrar, ordenar y realizar acciones (editar, activar, culminar, eliminar).
 */
const PeriodTable = ({
    data,
    status,
    error,
    onEdit,
    onDelete,
    onCulminate,
    onActivate,
    onRestore,
    onView,
    onBulkDelete,
    onBulkRestore,
    onSelectionChange,
    externalLoading = false,
    readOnly = false,
}: PeriodTableProps) => {
    // En modo solo lectura solo se permite la acción de ver detalles.
    const effectiveOnEdit = readOnly ? undefined : onEdit;
    const effectiveOnCulminate = readOnly ? undefined : onCulminate;
    const effectiveOnActivate = readOnly ? undefined : onActivate;
    const effectiveOnDelete = readOnly ? undefined : onDelete;
    const effectiveOnRestore = readOnly ? undefined : onRestore;
    // ============================================
    // STATE
    // ============================================
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [sortKey, setSortKey] = useState<SortKey>("startDate");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [inUseIds, setInUseIds] = useState<Set<string>>(new Set());
    const [viewMode, setViewMode] = useState<"timeline" | "table">("table");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Notificar a la página cuando hay selección activa (para bloquear botonera)
    useEffect(() => {
        onSelectionChange?.(selectedIds.size > 0);
    }, [selectedIds, onSelectionChange]);

    // IDs elegibles para operaciones bulk (eliminar o restaurar)
    const eligibleForBulkIds = useMemo(() => {
      const eligible = new Set<string>();
      data.forEach(p => {
        const canDelete = p.status === true && getSafePeriodStatus(p) === 1 && !inUseIds.has(p.periodId);
        const canRestore = p.status === false;
        if (canDelete || canRestore) {
          eligible.add(p.periodId);
        }
      });
      return eligible;
    }, [data, inUseIds]);

    // Período actual (en curso)
    const currentPeriod = useMemo(() => {
        return data.find(p => getSafePeriodStatus(p) === 2) || null;
    }, [data]);

    useEffect(() => {
        const used = new Set<string>();
        data.forEach(p => {
            if (p.isInUse) used.add(p.periodId);
        });
        setInUseIds(used);
    }, [data]);

    // IDs elegibles realmente procesables (ya filtrados por bulk handler)
    const actionableSelectedCount = useMemo(() => {
        let deleteCount = 0;
        let restoreCount = 0;
        data.forEach(p => {
            if (!selectedIds.has(p.periodId)) return;
            if (p.status === true && getSafePeriodStatus(p) === 1 && !inUseIds.has(p.periodId)) deleteCount++;
            if (p.status === false) restoreCount++;
        });
        return { total: selectedIds.size, deleteCount, restoreCount };
    }, [data, selectedIds, inUseIds]);

    // Verificar si hay algún período "En Curso"
    const hasActivePeriod = useMemo(() => {
        return data.some(p => getSafePeriodStatus(p) === 2);
    }, [data]);

    // Identificar cuál es el PRÓXIMO periodo que se puede activar (Secuencia Cronológica Estricta)
    const nextActivatablePeriodId = useMemo(() => {
        if (hasActivePeriod) return null; // No se puede activar nada si ya hay uno en curso

        const safeData = data;
        
        // Obtener todos los periodos que no están culminados ni en curso (es decir, Pendientes)
        const pendingPeriods = safeData.filter(p => getSafePeriodStatus(p) === 1);
        if (pendingPeriods.length === 0) return null;

        // Ordenar todos los periodos cronológicamente usando rawStartDate (Date object) o startDate
        const sortedPending = [...pendingPeriods].sort((a, b) => {
            // Usar rawStartDate si existe (Date object), sino intentar parsear startDate
            const dateA = a.rawStartDate instanceof Date ? a.rawStartDate : new Date(a.startDate);
            const dateB = b.rawStartDate instanceof Date ? b.rawStartDate : new Date(b.startDate);
            
            return dateA.getTime() - dateB.getTime();
        });

        // El primero de la lista ordenada es el único que se puede activar
        return sortedPending[0]?.periodId || null;
    }, [data, hasActivePeriod]);


    // ============================================
    // HANDLERS
    // ============================================
    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortOrder("asc");
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleItemsPerPageChange = (items: number) => {
        setItemsPerPage(items);
        setCurrentPage(1);
    };

    const toggleRow = (id: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    const toggleSelectAll = () => {
        const eligibleIds = filteredData
            .filter(p => eligibleForBulkIds.has(p.periodId))
            .map(p => p.periodId);
        
        // Si ya están todos los elegibles seleccionados, deseleccionar todo
        const allEligibleSelected = eligibleIds.length > 0 && eligibleIds.every(id => selectedIds.has(id));
        
        if (allEligibleSelected) {
            // Solo deseleccionar los elegibles, mantener los no elegibles si estaban
            const newSelected = new Set(selectedIds);
            eligibleIds.forEach(id => newSelected.delete(id));
            setSelectedIds(newSelected);
        } else {
            // Seleccionar todos los elegibles (merge con lo ya seleccionado)
            const newSelected = new Set(selectedIds);
            eligibleIds.forEach(id => newSelected.add(id));
            setSelectedIds(newSelected);
        }
    };

    const toggleSelectRow = (id: string) => {
        // No permitir seleccionar períodos no elegibles
        if (!eligibleForBulkIds.has(id)) return;
        
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleBulkDelete = () => {
        const selectedPeriods = data.filter(p => 
            selectedIds.has(p.periodId) && 
            p.status === true && 
            getSafePeriodStatus(p) === 1 && 
            !inUseIds.has(p.periodId)
        );
        if (selectedPeriods.length === 0) return;
        onBulkDelete?.(selectedPeriods);
    };

    const handleBulkRestore = () => {
        const selectedPeriods = data.filter(p => 
            selectedIds.has(p.periodId) && 
            p.status === false
        );
        if (selectedPeriods.length === 0) return;
        onBulkRestore?.(selectedPeriods);
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
          {error?.message || 'Error de conexión con la base de datos'}
        </p>
        {error && (
          <div className="mt-4 text-xs text-alert-error-text/70 dark:text-error-500/70 italic">
            Detalles: {error.message}
          </div>
        )}
                <div className="mt-6">
                    <Button
                        variant="outline"
                        onClick={() => window.location.reload()}
                        className="mx-auto"
                    >
                        Reintentar
                    </Button>
                </div>
            </div>
        );
    }

    // ============================================
    // FILTERING & SORTING
    // ============================================
    const filteredData = data.filter((item) => {
        const matchesSearch =
            matchSearch(item.description, searchTerm) ||
            item.startDate.includes(searchTerm) ||
            item.endDate.includes(searchTerm);
        
        const periodStatus = getSafePeriodStatus(item);
        const matchesStatus = statusFilter ? periodStatus === Number(statusFilter) : true;
        
        // Filtro por tab (Activos vs Papelera)
        // En este contexto, "Activos" son los que tienen estatus (1, 2, 3)
        // y "Papelera" o inactivos son los que no tienen estatus (null/undefined/0)
        // Ajustar según la lógica real de tu backend.
        // Si `periodStatus` es el campo que indica si está "borrado" o no, úsalo.
        // Asumiremos que si activeTab es "Papelera", mostramos los que tienen deletedAt o similar.
        // Pero basándonos en tu código anterior, parece que usas `item.periodStatus` para todo.
        // Si activeTab filtra por "Activos" (default), mostramos todos los que no están eliminados lógicamente.
        
        // Lógica simplificada basada en tu componente original:
        // Parece que mostrabas todos. Si hay un campo `status` booleano, úsalo.
        // Si no, asumimos que todos los que llegan aquí corresponden al tab seleccionado en el padre.
        
        return matchesSearch && matchesStatus;
    });

    const sortedData = [...filteredData].sort((a, b) => {
        // Manejo seguro de nulos
        const aValue = a[sortKey];
        const bValue = b[sortKey];

        // Manejo especial para fechas y estatus
        if (sortKey === "periodStatus") {
             const statusA = getSafePeriodStatus(a);
             const statusB = getSafePeriodStatus(b);
             return sortOrder === "asc" ? statusA - statusB : statusB - statusA;
        }

        // Manejo especial para fechas (startDate, endDate) — usa raw Date objects
        if (sortKey === "startDate") {
            const dateA = a.rawStartDate;
            const dateB = b.rawStartDate;
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;
            return sortOrder === "asc"
                ? dateA.getTime() - dateB.getTime()
                : dateB.getTime() - dateA.getTime();
        }
        if (sortKey === "endDate") {
            const dateA = a.rawEndDate;
            const dateB = b.rawEndDate;
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;
            return sortOrder === "asc"
                ? dateA.getTime() - dateB.getTime()
                : dateB.getTime() - dateA.getTime();
        }

        if (aValue === bValue) return 0;
        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;

        if (sortOrder === "asc") {
            // @ts-ignore
            return aValue > bValue ? 1 : -1;
        } else {
            // @ts-ignore
            return aValue < bValue ? 1 : -1;
        }
    });

    const totalPages = Math.ceil(sortedData.length / itemsPerPage);
    const paginatedData = sortedData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // ============================================
    // RENDER
    // ============================================
    if (data.length === 0) {
        return <EmptyState title="No hay periodos registrados" description="Comienza creando uno nuevo." />;
    }

    return (
        <div className="space-y-4 animate-fadeIn">
            {/* Período Actual Destacado */}
            {currentPeriod && (
                <CurrentPeriodCard 
                    period={currentPeriod}
                    onEdit={effectiveOnEdit ? () => effectiveOnEdit(currentPeriod) : undefined}
                    onView={onView ? () => onView(currentPeriod) : undefined}
                    onCulminate={effectiveOnCulminate ? () => effectiveOnCulminate(currentPeriod) : undefined}
                />
            )}

            {/* Toggle Vista + Filtros */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Toggle de vista */}
                <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <button
                        onClick={() => setViewMode("table")}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                            viewMode === "table" 
                                ? "bg-white dark:bg-gray-700 shadow-sm text-brand-600 dark:text-brand-400" 
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                        }`}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                        Tabla
                    </button>
                    <button
                        onClick={() => setViewMode("timeline")}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                            viewMode === "timeline" 
                                ? "bg-white dark:bg-gray-700 shadow-sm text-brand-600 dark:text-brand-400" 
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                        }`}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Cronología
                    </button>
                </div>

                {/* Filtros */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 min-w-0">
                    <InputField
                        type="text"
                        placeholder="Buscar periodo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <CustomSelect
                        options={[
                            { value: "", label: "Todos los estatus" },
                            { value: "1", label: "Pendiente" },
                            { value: "2", label: "En Curso" },
                            { value: "3", label: "Culminado" },
                        ]}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e as unknown as string)}
                        placeholder="Filtrar por estatus"
                        className="w-full"
                    />
                    <div className="flex items-center">
                    {(searchTerm || statusFilter) && (
                        <Button
                            variant="ghost"
                            onClick={clearFilters}
                            className="text-text-secondary hover:text-text-primary"
                        >
                            Limpiar
                        </Button>
                    )}
                    </div>
                </div>
            </div>

            {/* Bulk Action Toolbar */}
            {selectedIds.size > 0 && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            {actionableSelectedCount.total} seleccionado{actionableSelectedCount.total > 1 ? 's' : ''}
                            {actionableSelectedCount.deleteCount > 0 && actionableSelectedCount.restoreCount > 0 && (
                                <span className="text-xs ml-2 font-normal text-blue-500 dark:text-blue-400">
                                    ({actionableSelectedCount.deleteCount} a eliminar, {actionableSelectedCount.restoreCount} a restaurar)
                                </span>
                            )}
                            {actionableSelectedCount.deleteCount > 0 && actionableSelectedCount.restoreCount === 0 && (
                                <span className="text-xs ml-2 font-normal text-blue-500 dark:text-blue-400">
                                    ({actionableSelectedCount.deleteCount} a eliminar)
                                </span>
                            )}
                            {actionableSelectedCount.restoreCount > 0 && actionableSelectedCount.deleteCount === 0 && (
                                <span className="text-xs ml-2 font-normal text-blue-500 dark:text-blue-400">
                                    ({actionableSelectedCount.restoreCount} a restaurar)
                                </span>
                            )}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        {actionableSelectedCount.restoreCount > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleBulkRestore}
                                className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400"
                            >
                                <RefreshIcon className="w-4 h-4 mr-1" />
                                Restaurar ({actionableSelectedCount.restoreCount})
                            </Button>
                        )}
                        {actionableSelectedCount.deleteCount > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleBulkDelete}
                                className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400"
                            >
                                <TrashIcon className="w-4 h-4 mr-1" />
                                Eliminar ({actionableSelectedCount.deleteCount})
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedIds(new Set())}
                        >
                            Cancelar
                        </Button>
                    </div>
                </div>
            )}

            {/* Timeline View — solo desktop */}
            {viewMode === "timeline" && (
                <div className="hidden md:block p-6 bg-white dark:bg-gray-900 rounded-xl border border-border-light dark:border-border-dark">
                    <PeriodTimeline 
                        periods={filteredData} 
                        activePeriodId={currentPeriod?.periodId}
                        onPeriodClick={(period) => onView?.(period)}
                    />
                </div>
            )}

            {/* Tabla Desktop — solo desktop */}
            <div className={`${viewMode === "timeline" ? "hidden" : ""} hidden md:block overflow-hidden rounded-lg border border-border-default dark:border-border-dark bg-bg-surface dark:bg-bg-dark-surface shadow-sm`}>
                <Table>
                    <TableHeader>
                        <TableRow>
                            {!readOnly && (
                            <TableCell isHeader className="w-10">
                                <input
                                    type="checkbox"
                                    checked={
                                        filteredData.filter(p => eligibleForBulkIds.has(p.periodId)).length > 0 &&
                                        filteredData.filter(p => eligibleForBulkIds.has(p.periodId)).every(p => selectedIds.has(p.periodId))
                                    }
                                    onChange={toggleSelectAll}
                                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                                />
                            </TableCell>
                            )}
                            <TableCell isHeader onClick={() => handleSort("description")} className="cursor-pointer hover:bg-bg-subtle dark:hover:bg-bg-dark-subtle transition-colors">
                                <div className="flex items-center gap-2">
                                    Lapso
                                    {sortKey === "description" && (
                                        sortOrder === "asc" ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />
                                    )}
                                </div>
                            </TableCell>
                            <TableCell isHeader onClick={() => handleSort("startDate")} className="cursor-pointer hover:bg-bg-subtle dark:hover:bg-bg-dark-subtle transition-colors">
                                <div className="flex items-center gap-2">
                                    Inicio
                                    {sortKey === "startDate" && (
                                        sortOrder === "asc" ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />
                                    )}
                                </div>
                            </TableCell>
                            <TableCell isHeader onClick={() => handleSort("endDate")} className="cursor-pointer hover:bg-bg-subtle dark:hover:bg-bg-dark-subtle transition-colors">
                                <div className="flex items-center gap-2">
                                    Fin
                                    {sortKey === "endDate" && (
                                        sortOrder === "asc" ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />
                                    )}
                                </div>
                            </TableCell>
                            <TableCell isHeader className="w-32">Progreso</TableCell>
                            <TableCell isHeader onClick={() => handleSort("periodStatus")} className="cursor-pointer hover:bg-bg-subtle dark:hover:bg-bg-dark-subtle transition-colors">
                                <div className="flex items-center gap-2">
                                    Estatus
                                    {sortKey === "periodStatus" && (
                                        sortOrder === "asc" ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />
                                    )}
                                </div>
                            </TableCell>
                            <TableCell isHeader className="text-right">Acciones</TableCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedData.length > 0 ? (
                            paginatedData.map((periodo) => {
                                const periodStatus = getSafePeriodStatus(periodo);
                                const progress = getSafeProgress(periodo);
                                
                                // Determinar si este periodo específico se puede activar
                                const canActivate = nextActivatablePeriodId === periodo.periodId;
                                
                                // Determinar tooltip de deshabilitado
                                let disabledTooltip = "";
                                if (inUseIds.has(periodo.periodId)) {
                                    disabledTooltip = "No se puede eliminar porque tiene registros asociados";
                                }

                                return (
                                    <TableRow key={periodo.periodId} className="hover:bg-bg-subtle/50 dark:hover:bg-bg-dark-subtle/50 transition-colors">
                                        {!readOnly && (
                                        <TableCell>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(periodo.periodId)}
                                                onChange={() => toggleSelectRow(periodo.periodId)}
                                                disabled={!eligibleForBulkIds.has(periodo.periodId)}
                                                className={`w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 ${
                                                    !eligibleForBulkIds.has(periodo.periodId)
                                                        ? 'opacity-40 cursor-not-allowed'
                                                        : 'cursor-pointer'
                                                }`}
                                                title={
                                                    !eligibleForBulkIds.has(periodo.periodId)
                                                        ? periodo.status === false
                                                            ? 'Período ya inactivo — usa Restaurar'
                                                            : periodo.isInUse
                                                                ? 'Tiene registros asociados'
                                                                : getSafePeriodStatus(periodo) === 2
                                                                    ? 'Período en curso — no se puede eliminar'
                                                                    : getSafePeriodStatus(periodo) === 3
                                                                        ? 'Período culminado — no se puede eliminar'
                                                                        : 'No elegible para acciones masivas'
                                                        : ''
                                                }
                                            />
                                        </TableCell>
                                        )}
                                        <TableCell className="font-medium text-text-primary dark:text-text-emphasis">
                                            <DisplayText>{periodo.description}</DisplayText>
                                        </TableCell>
                                        <TableCell className="text-text-secondary dark:text-text-tertiary">
                                            {periodo.startDate}
                                        </TableCell>
                                        <TableCell className="text-text-secondary dark:text-text-tertiary">
                                            {periodo.endDate}
                                        </TableCell>
                                        <TableCell>
                                            {progress !== null ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-full min-w-[60px] max-w-[100px] rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full transition-all duration-500 ${
                                                                progress >= 100 ? 'bg-success-500' : 'bg-primary-500'
                                                            }`}
                                                            style={{ width: `${Number(progress).toFixed(2)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-medium text-text-secondary dark:text-text-tertiary">
                                                        {progress.toFixed(2)}%
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-text-disabled">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                color={STATUS_COLORS[periodStatus as keyof typeof STATUS_COLORS]}
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
                                                onCulminate={onCulminate ? () => onCulminate(periodo) : undefined}
                                                onActivate={onActivate ? () => onActivate(periodo) : undefined}
                                                onView={onView ? () => onView(periodo) : undefined}
                                                onDelete={onDelete ? () => onDelete(periodo) : undefined}
                                                onRestore={onRestore ? () => onRestore(periodo) : undefined}
                                                periodo={periodo}
                                                canActivate={canActivate}
                                                isDisabled={inUseIds.has(periodo.periodId)}
                                                disabledTooltip={disabledTooltip}
                                                disableAll={selectedIds.size > 0}
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center text-text-secondary dark:text-text-tertiary">
                                    No se encontraron periodos que coincidan con los filtros.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Lista Mobile */}
            <div className="md:hidden flex flex-col gap-4">
                {paginatedData.length > 0 ? (
                    paginatedData.map((periodo) => {
                        const periodStatus = getSafePeriodStatus(periodo);
                        const progress = getSafeProgress(periodo);
                        const canActivate = nextActivatablePeriodId === periodo.periodId;
                        let disabledTooltip = "";
                        if (inUseIds.has(periodo.periodId)) {
                            disabledTooltip = "No se puede eliminar porque tiene registros asociados";
                        }

                        return (
                            <div 
                                key={periodo.periodId}
                                className="bg-bg-surface dark:bg-bg-dark-surface rounded-lg border border-border-default dark:border-border-dark p-4 shadow-sm"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-semibold text-text-primary dark:text-text-emphasis">
                                            <DisplayText>{periodo.description}</DisplayText>
                                        </h3>
                                        <p className="text-sm text-text-secondary dark:text-text-tertiary mt-1">
                                            {periodo.startDate} - {periodo.endDate}
                                        </p>
                                    </div>
                                    <Badge
                                        color={STATUS_COLORS[periodStatus as keyof typeof STATUS_COLORS]}
                                        variant="light"
                                        shape="rounded"
                                    >
                                        {getStatusLabel(periodStatus)}
                                    </Badge>
                                </div>

                                {progress !== null && (
                                    <div className="mb-4">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-text-secondary dark:text-text-tertiary">Progreso</span>
                                            <span className="font-medium text-text-primary dark:text-text-emphasis">{progress.toFixed(2)}%</span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-500 ${
                                                    progress >= 100 ? 'bg-success-500' : 'bg-primary-500'
                                                }`}
                                                style={{ width: `${progress.toFixed(2)}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="border-t border-border-default dark:border-border-dark pt-3">
                                    <button
                                        onClick={() => toggleRow(periodo.periodId)}
                                        className="w-full flex items-center justify-between text-sm text-text-secondary dark:text-text-tertiary hover:text-primary-600 dark:hover:text-primary-400"
                                    >
                                        <span>Acciones</span>
                                        {expandedRows.has(periodo.periodId) ? (
                                            <ChevronUpIcon className="w-4 h-4" />
                                        ) : (
                                            <ChevronDownIcon className="w-4 h-4" />
                                        )}
                                    </button>
                                    
                                    {expandedRows.has(periodo.periodId) && (
                                        <ActionButtons
                                            onEdit={effectiveOnEdit ? () => effectiveOnEdit(periodo) : undefined}
                                            onCulminate={effectiveOnCulminate ? () => effectiveOnCulminate(periodo) : undefined}
                                            onActivate={effectiveOnActivate ? () => effectiveOnActivate(periodo) : undefined}
                                            onView={onView ? () => onView(periodo) : undefined}
                                            onDelete={effectiveOnDelete ? () => effectiveOnDelete(periodo) : undefined}
                                            onRestore={effectiveOnRestore ? () => effectiveOnRestore(periodo) : undefined}
                                            periodo={periodo}
                                            canActivate={canActivate}
                                            isMobile={true}
                                            isDisabled={inUseIds.has(periodo.periodId)}
                                            disabledTooltip={disabledTooltip}
                                            disableAll={selectedIds.size > 0}
                                        />
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <EmptyState
                        title={searchTerm || statusFilter ? "No se encontraron periodos" : "No hay periodos registrados"}
                        description={searchTerm || statusFilter ? "Intenta ajustar los filtros para encontrar lo que buscas." : "Comienza creando uno nuevo."}
                    />
                )}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredData.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={handleItemsPerPageChange}
                    itemsPerPageOptions={[5, 10, 25]}
                />
            )}
        </div>
    );
};

export default PeriodTable;
