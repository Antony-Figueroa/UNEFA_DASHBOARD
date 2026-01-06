import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../../../context/theme";
import { Dropdown } from "../../../components/ui/dropdown/Dropdown";
import { DropdownItem } from "../../../components/ui/dropdown/DropdownItem";
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
    Pagination,
} from "../../../components/ui/table";
import Badge from "../../../components/ui/badge/Badge";
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
    onRestore?: () => void;
    onView?: () => void;
    onOpen: () => void;
    onClose: () => void;
    periodo: PeriodoRowData;
}

interface PeriodTableProps {
    data: PeriodoRowData[];
    status: "loading" | "success" | "error";
    error: Error | null;
    onEdit?: (periodo: PeriodoRowData) => void;
    onCulminate?: (periodo: PeriodoRowData) => void;
    onDelete?: (id: string) => void;
    onRestore?: (periodo: PeriodoRowData) => void;
    onView?: (periodo: PeriodoRowData) => void;
    loading?: boolean;
}

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
    onRestore,
    onView,
    onOpen,
    onClose,
    periodo,
}: ActionMenuProps) => {
    const { colorMode } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [highlighted, setHighlighted] = useState(false);
    const trigger = useRef<HTMLButtonElement>(null);
    const dropdown = useRef<HTMLDivElement>(null);
    const [isTop, setIsTop] = useState(false);
    const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);

    const toggleMenu = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            if (isOpen) {
                setIsOpen(false);
                setHighlighted(false);
                onClose();
            } else {
                if (trigger.current) {
                    const rect = trigger.current.getBoundingClientRect();
                    setTriggerRect(rect);
                    const spaceBelow = window.innerHeight - rect.bottom;
                    const menuHeight = 120;
                    const showTop = spaceBelow < menuHeight;
                    setIsTop(showTop);
                    setIsOpen(true);
                    setHighlighted(true);
                    onOpen();
                }
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

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdown.current &&
                !dropdown.current.contains(event.target as Node) &&
                trigger.current &&
                !trigger.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
                setHighlighted(false);
                onClose();
            }
        };

        const handleScroll = () => {
            if (isOpen) {
                setIsOpen(false);
                setHighlighted(false);
                onClose();
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsOpen(false);
                setHighlighted(false);
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        window.addEventListener("scroll", handleScroll, true);
        window.addEventListener("resize", handleScroll);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("scroll", handleScroll, true);
            window.removeEventListener("resize", handleScroll);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);

    const currentPeriodStatus = getSafePeriodStatus(periodo);
    const hasStatus = !!periodo.status;

    return (
        <div className={`relative flex justify-end ${highlighted ? "z-50" : ""}`}>
            <button
                ref={trigger}
                onClick={toggleMenu}
                className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                title="Acciones"
                aria-label="Menú de acciones"
            >
                <ThreeDotsIcon className="icon-sm" />
            </button>
            {isOpen &&
                triggerRect &&
                createPortal(
                    <div
                        ref={dropdown}
                        style={{
                            position: "fixed",
                            top: isTop ? "auto" : triggerRect.bottom + 5,
                            bottom: isTop ? window.innerHeight - triggerRect.top + 5 : "auto",
                            left: triggerRect.right,
                            transform: "translateX(-100%)",
                            zIndex: 9999,
                        }}
                    >
                        <Dropdown
                            isOpen={isOpen}
                            onClose={() => {
                                setIsOpen(false);
                                setHighlighted(false);
                                onClose();
                            }}
                            className={`w-40 min-w-37.5 rounded-md border border-stroke bg-white p-2 shadow-lg dark:border-strokedark dark:bg-boxdark animate-fadeIn ${colorMode === "dark" ? "dark" : ""
                                }`}
                        >
                            {hasStatus && currentPeriodStatus !== 3 && onEdit && (
                                <DropdownItem
                                    onItemClick={() => handleAction(onEdit)}
                                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-meta-4"
                                >
                                    <EditIcon className="icon-sm" />
                                    Editar
                                </DropdownItem>
                            )}
                            {hasStatus && currentPeriodStatus === 2 && onCulminate && (
                                <DropdownItem
                                    onItemClick={() => handleAction(onCulminate)}
                                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 dark:text-blue-500 dark:hover:bg-meta-4"
                                >
                                    <CheckCircleIcon className="icon-sm" />
                                    Culminar
                                </DropdownItem>
                            )}
                            {hasStatus && currentPeriodStatus === 3 && onView && (
                                <DropdownItem
                                    onItemClick={() => handleAction(onView)}
                                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-meta-4"
                                >
                                    <EyeIcon className="icon-sm" />
                                    Ver
                                </DropdownItem>
                            )}
                            {!hasStatus && onRestore && (
                                <DropdownItem
                                    onItemClick={() => handleAction(onRestore)}
                                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 dark:text-blue-500 dark:hover:bg-meta-4"
                                >
                                    <RefreshIcon className="icon-sm" />
                                    Restaurar
                                </DropdownItem>
                            )}
                            {hasStatus && currentPeriodStatus === 1 && onDelete && (
                                <DropdownItem
                                    onItemClick={() => handleAction(onDelete)}
                                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:text-red-500 dark:hover:bg-meta-4"
                                >
                                    <TrashIcon className="icon-sm" />
                                    Eliminar
                                </DropdownItem>
                            )}
                        </Dropdown>
                    </div>,
                    document.body
                )}
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
    onDelete,
    onRestore,
    onView,
    // loading = false,
}: PeriodTableProps) => {
    const [highlightedRow, setHighlightedRow] = useState<string | null>(null);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    // Validación inicial (sin retorno temprano para respetar reglas de hooks)
    const isInvalidData = !Array.isArray(data);
    const safeData = isInvalidData ? [] : data;

    // Filter data safely
    const filteredData = safeData.filter((periodo) => {
        const description = periodo.description.toLowerCase();
        const matchesSearch = description.includes(searchTerm.toLowerCase());

        const periodStatus = getSafePeriodStatus(periodo).toString();
        const matchesStatus =
            statusFilter === "" ||
            periodStatus === statusFilter;

        return matchesSearch && matchesStatus;
    });

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

    if (status === "error") {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-red-500 animate-fadeIn">
                <p className="font-semibold text-red-600 dark:text-red-400">Error al cargar periodos</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{error?.message || "Por favor, intente de nuevo más tarde."}</p>
            </div>
        );
    }

    const getStatusColor = (status: number) => {
        return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || "warning";
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
            <div className="p-4 border-b border-gray-100 dark:border-white/5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <div className="relative max-w-xs w-full">
                        <input
                            type="text"
                            placeholder="Buscar por descripción..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-transparent py-2 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
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
                            className="w-full rounded-lg border border-gray-300 bg-transparent py-2 px-4 pr-10 text-sm text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white appearance-none"
                        >
                            <option value="" className="dark:bg-gray-800">
                                Seleccione Estado
                            </option>
                            <option value="2" className="dark:bg-gray-800">
                                En Curso
                            </option>
                            <option value="1" className="dark:bg-gray-800">
                                Pendiente
                            </option>
                            <option value="3" className="dark:bg-gray-800">
                                Culminado
                            </option>
                        </select>
                        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                    {(searchTerm || statusFilter !== "Todos") && (
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
                                className="md:hidden flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:bg-white/5 dark:text-gray-400 transition-colors min-h-12"
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
                                className="table-header-cell"
                            >
                                Descripción
                            </TableCell>
                            <TableCell
                                isHeader
                                className="table-header-cell"
                            >
                                Fecha Inicio
                            </TableCell>
                            <TableCell
                                isHeader
                                className="table-header-cell"
                            >
                                Fecha Fin
                            </TableCell>
                            <TableCell
                                isHeader
                                className="table-header-cell"
                            >
                                Status
                            </TableCell>
                            <TableCell
                                isHeader
                                className="table-header-cell"
                            >
                                Progreso
                            </TableCell>
                            <TableCell
                                isHeader
                                className="table-header-cell text-right"
                            >
                                Acciones
                            </TableCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
                        {currentData.length > 0 ? (
                            currentData.map((periodo) => {
                                const periodStatus = getSafePeriodStatus(periodo);
                                const periodId = periodo.periodId;

                                return (
                                    <TableRow
                                        key={periodId}
                                        className={`${highlightedRow === periodId ? 'bg-gray-50 dark:bg-gray-800' : ''} table-row-hover`}
                                    >
                                        <TableCell className="table-cell font-medium text-gray-800 dark:text-white/90">
                                            {periodo.description}
                                        </TableCell>
                                        <TableCell className="table-cell text-gray-500 dark:text-gray-400">
                                            {periodo.startDate || "-"}
                                        </TableCell>
                                        <TableCell className="table-cell text-gray-500 dark:text-gray-400">
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
                                                <div className="group relative flex items-center gap-2 cursor-help">
                                                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                                        <div
                                                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                                                            style={{ width: `${getSafeProgress(periodo)}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                                        {Math.round(getSafeProgress(periodo) ?? 0)}%
                                                    </span>
                                                    {/* Tooltip */}
                                                    <div className="absolute bottom-full left-1/2 mb-2 w-max -translate-x-1/2 rounded bg-black px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-300 pointer-events-none group-hover:opacity-100 dark:bg-white dark:text-black z-50 shadow-sm">
                                                        <p>Han pasado: {periodo.daysPassed} días</p>
                                                        <p>Faltan: {periodo.daysRemaining} días</p>
                                                        <p>Semanas restantes: {periodo.weeksRemaining}</p>
                                                        <div className="absolute top-full left-1/2 -mt-1 -ml-1 border-4 border-transparent border-t-black dark:border-t-white"></div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 dark:text-gray-500">
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
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="table-cell py-20 text-center text-gray-500 dark:text-gray-400"
                                >
                                    {searchTerm || statusFilter !== "Todos"
                                        ? "No se encontraron periodos con los filtros aplicados"
                                        : "No hay periodos para mostrar."}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile View (Card format) */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-white/5">
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
                                            <h3 className="text-sm font-bold text-gray-800 dark:text-white/90 leading-tight truncate px-12">
                                                {periodo.description}
                                            </h3>
                                            <div className="flex items-center justify-center gap-4 mt-2">
                                                <div className="text-[11px] text-gray-500 dark:text-gray-400">
                                                    <span className="block font-medium uppercase tracking-wider opacity-60">Inicio</span>
                                                    {periodo.startDate || "-"}
                                                </div>
                                                <div className="text-[11px] text-gray-500 dark:text-gray-400">
                                                    <span className="block font-medium uppercase tracking-wider opacity-60">Fin</span>
                                                    {periodo.endDate || "-"}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="absolute right-2 top-2">
                                            <button
                                                onClick={() => toggleRowExpansion(periodId)}
                                                className="p-2 text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 rounded-full min-h-12 min-w-12 flex items-center justify-center transition-transform duration-200"
                                                style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                                                aria-label={isExpanded ? "Contraer" : "Expandir"}
                                            >
                                                <ChevronDownIcon className="icon-sm" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="mt-4 pt-4 border-t border-gray-50 dark:border-white/5 animate-fadeIn">
                                        <div className="space-y-6">
                                            {periodStatus === 2 && getSafeProgress(periodo) !== null && (
                                                <div className="text-center">
                                                    <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 mb-3">Progreso del Periodo</p>
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700 max-w-50">
                                                            <div
                                                                className="bg-blue-600 h-2 rounded-full"
                                                                style={{ width: `${getSafeProgress(periodo)}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                                                            {Math.round(getSafeProgress(periodo) ?? 0)}%
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4 mt-6">
                                                        <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl">
                                                            <p className="text-[9px] text-gray-400 uppercase font-bold mb-1">Días Transcurridos</p>
                                                            <p className="text-xs font-bold dark:text-gray-200">{periodo.daysPassed} días</p>
                                                        </div>
                                                        <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl">
                                                            <p className="text-[9px] text-gray-400 uppercase font-bold mb-1">Días Restantes</p>
                                                            <p className="text-xs font-bold dark:text-gray-200">{periodo.daysRemaining} días</p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 bg-blue-50/50 dark:bg-blue-500/10 p-4 rounded-xl">
                                                        <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase mb-1">Semanas Restantes</p>
                                                        <p className="text-base font-bold text-blue-700 dark:text-blue-300">{periodo.weeksRemaining} semanas</p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex flex-col gap-3 pt-2">
                                                {!!periodo.status && periodStatus !== 3 && onEdit && (
                                                    <button
                                                        onClick={() => onEdit(periodo)}
                                                        className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-xl min-h-12 active:scale-95 transition-all border border-transparent hover:border-gray-200 dark:hover:border-white/10"
                                                    >
                                                        <EditIcon className="icon-sm" /> Editar
                                                    </button>
                                                )}
                                                {!!periodo.status && periodStatus === 2 && onCulminate && (
                                                    <button
                                                        onClick={() => onCulminate(periodo)}
                                                        className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl min-h-12 active:scale-95 transition-all border border-transparent hover:border-blue-200 dark:hover:border-blue-500/20"
                                                    >
                                                        <CheckCircleIcon className="icon-sm" /> Culminar
                                                    </button>
                                                )}
                                                {!!periodo.status && periodStatus === 3 && onView && (
                                                    <button
                                                        onClick={() => onView(periodo)}
                                                        className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-xl min-h-12 active:scale-95 transition-all border border-transparent hover:border-gray-200 dark:hover:border-white/10"
                                                    >
                                                        <EyeIcon className="icon-sm" /> Ver
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
                    <div className="p-8 text-center text-gray-500 text-sm">
                        {searchTerm || statusFilter !== "Todos"
                            ? "No se encontraron periodos con los filtros aplicados"
                            : "No hay periodos para mostrar."}
                    </div>
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
