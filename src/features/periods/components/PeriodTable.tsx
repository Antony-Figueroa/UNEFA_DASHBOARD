import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../../../context/ThemeContext";
import { Dropdown } from "../../../components/ui/dropdown/Dropdown";
import { DropdownItem } from "../../../components/ui/dropdown/DropdownItem";
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "../../../components/ui/table";
import Badge from "../../../components/ui/badge/Badge";
import {
    EditIcon,
    TrashIcon,
    ThreeDotsIcon,
    PlayIcon,
    CheckCircleIcon,
    RefreshIcon,
    EyeIcon,
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
    onStart?: () => void;
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
    onStart?: (periodo: PeriodoRowData) => void;
    onCulminate?: (periodo: PeriodoRowData) => void;
    onDelete?: (id: string) => void;
    onRestore?: (periodo: PeriodoRowData) => void;
    onView?: (periodo: PeriodoRowData) => void;
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
    onStart,
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
    const hasStatus = Boolean(periodo.status);

    return (
        <div className={`relative flex justify-end ${highlighted ? "z-50" : ""}`}>
            <button
                ref={trigger}
                onClick={toggleMenu}
                className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                title="Acciones"
                aria-label="Menú de acciones"
            >
                <ThreeDotsIcon className="w-5 h-5" />
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
                            className={`w-40 min-w-[150px] rounded-md border border-stroke bg-white p-2 shadow-lg dark:border-strokedark dark:bg-boxdark animate-fadeIn ${colorMode === "dark" ? "dark" : ""
                                }`}
                        >
                            {hasStatus && currentPeriodStatus !== 3 && onEdit && (
                                <DropdownItem
                                    onItemClick={() => handleAction(onEdit)}
                                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-meta-4"
                                >
                                    <EditIcon className="w-4 h-4" />
                                    Editar
                                </DropdownItem>
                            )}
                            {hasStatus && currentPeriodStatus === 1 && onStart && (
                                <DropdownItem
                                    onItemClick={() => handleAction(onStart)}
                                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-green-600 hover:bg-green-50 dark:text-green-500 dark:hover:bg-meta-4"
                                >
                                    <PlayIcon className="w-4 h-4" />
                                    Iniciar
                                </DropdownItem>
                            )}
                            {hasStatus && currentPeriodStatus === 2 && onCulminate && (
                                <DropdownItem
                                    onItemClick={() => handleAction(onCulminate)}
                                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 dark:text-blue-500 dark:hover:bg-meta-4"
                                >
                                    <CheckCircleIcon className="w-4 h-4" />
                                    Culminar
                                </DropdownItem>
                            )}
                            {hasStatus && currentPeriodStatus === 3 && onView && (
                                <DropdownItem
                                    onItemClick={() => handleAction(onView)}
                                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-meta-4"
                                >
                                    <EyeIcon className="w-4 h-4" />
                                    Ver
                                </DropdownItem>
                            )}
                            {!hasStatus && onRestore && (
                                <DropdownItem
                                    onItemClick={() => handleAction(onRestore)}
                                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 dark:text-blue-500 dark:hover:bg-meta-4"
                                >
                                    <RefreshIcon className="w-4 h-4" />
                                    Restaurar
                                </DropdownItem>
                            )}
                            {hasStatus && currentPeriodStatus === 1 && onDelete && (
                                <DropdownItem
                                    onItemClick={() => handleAction(onDelete)}
                                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:text-red-500 dark:hover:bg-meta-4"
                                >
                                    <TrashIcon className="w-4 h-4" />
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
    onStart,
    onCulminate,
    onDelete,
    onRestore,
    onView,
}: PeriodTableProps) => {
    const [highlightedRow, setHighlightedRow] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("Todos");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    // Validación inicial
    if (!data || !Array.isArray(data)) {
        return (
            <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-center">
                <p className="font-medium text-red-600">Error: Datos no válidos</p>
            </div>
        );
    }

    // Filter data safely
    const filteredData = data.filter((periodo) => {
        const description = periodo.description.toLowerCase();
        const matchesSearch = description.includes(searchTerm.toLowerCase());

        const periodStatus = getSafePeriodStatus(periodo).toString();
        const matchesStatus =
            statusFilter === "Todos" ||
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

    if (status === "error") {
        return (
            <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-center dark:border-red-800 dark:bg-red-900/20">
                <p className="font-medium text-red-600 dark:text-red-400">
                    ¡Ocurrió un error al cargar los datos!
                </p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    {error?.message || "Error desconocido"}
                </p>
            </div>
        );
    }

    const getStatusColor = (status: number) => {
        return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || "warning";
    };

    const getStatusLabel = (status: number) => {
        return STATUS_LABELS[status as keyof typeof STATUS_LABELS] || "Desconocido";
    };

    return (
        <div className="rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
            {/* Search and Filter Bar */}
            <div className="p-4 border-b border-gray-100 dark:border-white/5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
                            className="w-5 h-5"
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
                        className="w-full rounded-lg border border-gray-300 bg-transparent py-2 px-4 text-sm text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                        <option value="Todos" className="dark:bg-gray-800">
                            Todos los estados
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
                </div>
            </div>

            {/* Table */}
            <div className="max-w-full overflow-x-auto">
                <Table>
                    <TableHeader className="border-b border-gray-100 dark:border-white/5">
                        <TableRow>
                            <TableCell
                                isHeader
                                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                Descripción
                            </TableCell>
                            <TableCell
                                isHeader
                                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                Fecha Inicio
                            </TableCell>
                            <TableCell
                                isHeader
                                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                Fecha Fin
                            </TableCell>
                            <TableCell
                                isHeader
                                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                Status
                            </TableCell>
                            <TableCell
                                isHeader
                                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                Progreso
                            </TableCell>
                            <TableCell
                                isHeader
                                className="px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400"
                            >
                                Acciones
                            </TableCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
                        {status === "loading" ? (
                            <TableRow>
                                <td
                                    colSpan={6}
                                    className="py-10 text-center text-gray-500 dark:text-gray-400"
                                >
                                    Cargando periodos...
                                </td>
                            </TableRow>
                        ) : currentData.length > 0 ? (
                            currentData.map((periodo) => {
                                const periodStatus = getSafePeriodStatus(periodo);
                                const periodId = periodo.periodId;

                                return (
                                    <TableRow
                                        key={periodId}
                                        className={
                                            highlightedRow === periodId
                                                ? "bg-gray-50 dark:bg-gray-800"
                                                : ""
                                        }
                                    >
                                        <TableCell className="px-5 py-4 text-start font-medium text-gray-800 dark:text-white/90">
                                            {periodo.description}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                            {periodo.startDate || "-"}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                            {periodo.endDate || "-"}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-start text-theme-sm">
                                            <Badge
                                                size="sm"
                                                color={getStatusColor(periodStatus)}
                                            >
                                                {getStatusLabel(periodStatus)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-start text-theme-sm">
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
                                        <TableCell className="px-5 py-3 text-end">
                                            <ActionMenu
                                                onEdit={onEdit ? () => onEdit(periodo) : undefined}
                                                onStart={onStart ? () => onStart(periodo) : undefined}
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
                                <td
                                    colSpan={6}
                                    className="py-10 text-center text-gray-500 dark:text-gray-400"
                                >
                                    {searchTerm || statusFilter !== "Todos"
                                        ? "No se encontraron periodos con los filtros aplicados"
                                        : "No hay periodos para mostrar."}
                                </td>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {filteredData.length > 0 && (
                <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 dark:border-white/5 sm:px-6">
                    <div className="flex flex-1 justify-between sm:hidden">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        >
                            Anterior
                        </button>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        >
                            Siguiente
                        </button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <div>
                                <p className="text-sm text-gray-700 dark:text-gray-400">
                                    Mostrando{" "}
                                    <span className="font-medium">{startIndex + 1}</span> a{" "}
                                    <span className="font-medium">
                                        {Math.min(
                                            startIndex + itemsPerPage,
                                            filteredData.length
                                        )}
                                    </span>{" "}
                                    de{" "}
                                    <span className="font-medium">{filteredData.length}</span>{" "}
                                    resultados
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) =>
                                        handleItemsPerPageChange(Number(e.target.value))
                                    }
                                    className="rounded border border-gray-300 bg-transparent py-1 px-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <nav
                                className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                                aria-label="Pagination"
                            >
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 dark:ring-gray-700 dark:hover:bg-white/5"
                                >
                                    <span className="sr-only">Anterior</span>
                                    <svg
                                        className="h-5 w-5"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        aria-hidden="true"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 dark:ring-gray-700 dark:hover:bg-white/5"
                                >
                                    <span className="sr-only">Siguiente</span>
                                    <svg
                                        className="h-5 w-5"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        aria-hidden="true"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PeriodTable;