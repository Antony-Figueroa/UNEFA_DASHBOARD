import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Dropdown } from "../../../components/ui/dropdown/Dropdown";
import { Table, TableBody, TableCell, TableHeader, TableRow, Pagination } from "../../../components/ui/table";
import { DropdownItem } from "../../../components/ui/dropdown/DropdownItem";
import { EditIcon, TrashIcon, RefreshIcon, EyeIcon, ThreeDotsIcon, ChevronDownIcon, ChevronUpIcon } from "../../../icons/actions";
import { PreEnrollmentRowData } from "../types";
import { useDebounce } from "../../../hooks/useDebounce";
import { TableSkeleton } from "../../../components/ui/table/TableSkeleton";
import { EmptyState } from "../../../components/ui/table/EmptyState";
import Button from "../../../components/ui/button/Button";

interface ActionMenuProps {
    onEdit?: () => void;
    onToggleStatus?: () => void;
    onView?: () => void;
    onOpen: () => void;
    onClose: () => void;
    item: PreEnrollmentRowData;
}

const ActionMenu = ({
    onEdit,
    onToggleStatus,
    onView,
    onOpen,
    onClose,
    item,
}: ActionMenuProps) => {
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

    return (
        <div className={`relative flex justify-end ${highlighted ? "z-50" : ""}`}>
            <button
                ref={trigger}
                onClick={toggleMenu}
                className="dropdown-toggle inline-flex items-center rounded-full p-1 text-text-secondary hover:bg-bg-secondary hover:text-text-emphasis dark:text-text-tertiary dark:hover:bg-white/10 min-h-12 min-w-12 justify-center"
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
                            className="w-40 min-w-37.5 animate-fadeIn"
                        >
                            {onView && (
                                <DropdownItem
                                    onItemClick={() => handleAction(onView)}
                                    className="flex items-center gap-2 text-text-primary hover:bg-bg-secondary dark:text-text-secondary"
                                >
                                    <EyeIcon className="icon-sm" />
                                    Ver Detalles
                                </DropdownItem>
                            )}
                            {onEdit && (
                                <DropdownItem
                                    onItemClick={() => handleAction(onEdit)}
                                    className="flex items-center gap-2 text-text-primary hover:bg-bg-secondary dark:text-text-secondary"
                                >
                                    <EditIcon className="icon-sm" />
                                    Editar
                                </DropdownItem>
                            )}
                            {onToggleStatus && (
                                <DropdownItem
                                    onItemClick={() => handleAction(onToggleStatus)}
                                    className={`flex items-center gap-2 font-medium ${
                                        item.status 
                                            ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-error-950" 
                                            : "text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-950"
                                    }`}
                                >
                                    {item.status ? (
                                        <>
                                            <TrashIcon className="icon-sm" />
                                            Eliminar
                                        </>
                                    ) : (
                                        <>
                                            <RefreshIcon className="icon-sm" />
                                            Restaurar
                                        </>
                                    )}
                                </DropdownItem>
                            )}
                        </Dropdown>
                    </div>,
                    document.body
                )}
        </div>
    );
};

interface PreEnrollmentTableProps {
    data: PreEnrollmentRowData[];
    status: "loading" | "success" | "error";
    error: Error | null;
    onEdit?: (item: PreEnrollmentRowData) => void;
    onToggleStatus?: (id: string) => void;
    onView?: (item: PreEnrollmentRowData) => void;
    activeTab?: "Activas" | "Inactivas";
    loading?: boolean;
}

type SortKey = "identificationNumber" | "studentName" | "period" | "preEnrollmentDate" | "enrollmentCode";
type SortOrder = "asc" | "desc";

export default function PreEnrollmentTable({
    data = [],
    status,
    error,
    onEdit,
    onToggleStatus,
    onView,
    activeTab = "Activas",
    loading: externalLoading,
}: PreEnrollmentTableProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [periodFilter, setPeriodFilter] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [highlightedRow, setHighlightedRow] = useState<string | null>(null);

    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: SortOrder }>({
        key: "studentName",
        order: "asc",
    });

    const debouncedSearch = useDebounce(searchTerm, 300);

    const filteredData = useMemo(() => {
        const search = debouncedSearch.trim().toLowerCase();
        const periodSearch = periodFilter.trim().toLowerCase();

        const filtered = data.filter((s) => {
            const matchesSearch = !search || 
                s.identificationNumber.toLowerCase().includes(search) || 
                s.studentName.toLowerCase().includes(search);
            const matchesPeriod = !periodSearch || s.period.toLowerCase().includes(periodSearch);
            const matchesTab = activeTab === "Activas" ? s.status === true : s.status === false;

            return matchesSearch && matchesPeriod && matchesTab;
        });

        filtered.sort((a, b) => {
            const valA = a[sortConfig.key];
            const valB = b[sortConfig.key];
            const strA = String(valA ?? "").toLowerCase();
            const strB = String(valB ?? "").toLowerCase();

            if (strA < strB) return sortConfig.order === "asc" ? -1 : 1;
            if (strA > strB) return sortConfig.order === "asc" ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [data, debouncedSearch, periodFilter, activeTab, sortConfig]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, periodFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paged = filteredData.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    const handleSort = (key: SortKey) => {
        setSortConfig((prev) => ({
            key,
            order: prev.key === key && prev.order === "asc" ? "desc" : "asc",
        }));
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
            const allIds = paged.map((s, index) => s.preEnrollmentId ?? `idx-${index}`);
            setExpandedRows(new Set(allIds));
        }
    };

    const clearFilters = () => {
        setSearchTerm("");
        setPeriodFilter("");
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

    if (status === "loading" || externalLoading) {
        return (
            <div className="table-container">
                <TableSkeleton columns={6} rows={itemsPerPage} />
            </div>
        );
    }

    if (status === "error") {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-error-500 animate-fadeIn">
                <h3 className="text-lg font-semibold text-error-600 dark:text-error-400">Error de conexión</h3>
                <p className="mt-2 text-text-secondary dark:text-text-tertiary font-medium">
                    no hay conexion a la bd
                </p>
                {error && error.message !== 'no hay conexion a la bd' && (
                    <div className="mt-4 text-xs text-error-500/70 italic">
                        Detalles: {error.message}
                    </div>
                )}
            </div>
        );
    }

    // Get unique periods for the filter dropdown
    const uniquePeriods = Array.from(new Set(data.map(item => item.period))).sort();

    return (
        <div className="table-container">
            {/* Search and Filter Bar */}
            <div className="p-4 border-b border-border-light dark:border-border-dark flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <div className="relative max-w-xs w-full">
                        <input
                            type="text"
                            placeholder="Buscar por cédula o estudiante..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-lg border border-border-medium bg-transparent py-2 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:border-brand-500 focus:outline-none dark:border-border-dark dark:bg-bg-dark dark:text-text-emphasis dark:placeholder:text-text-tertiary"
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
                            value={periodFilter}
                            onChange={(e) => setPeriodFilter(e.target.value)}
                            className="w-full rounded-lg border border-border-medium bg-transparent py-2 px-4 pr-10 text-sm text-text-primary focus:border-brand-500 focus:outline-none dark:border-border-dark dark:bg-bg-dark dark:text-text-emphasis appearance-none"
                        >
                            <option value="" className="dark:bg-bg-dark">
                                Seleccione Período
                            </option>
                            {uniquePeriods.map(period => (
                                <option key={period} value={period} className="dark:bg-bg-dark">
                                    {period}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                    {(searchTerm || periodFilter) && (
                        <button
                            onClick={clearFilters}
                            className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1 transition-colors"
                        >
                            <RefreshIcon className="icon-xs" />
                            Limpiar filtros
                        </button>
                    )}

                    <div className="flex items-center gap-2">
                        {paged.length > 0 && (
                            <button
                                onClick={toggleAllRows}
                                className="md:hidden flex items-center gap-2 rounded-lg bg-bg-secondary px-3 py-2 text-xs font-medium text-text-secondary hover:bg-bg-secondary hover:text-text-emphasis dark:bg-white/5 dark:text-text-tertiary transition-colors min-h-12"
                            >
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
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Desktop View (Table) */}
            <div className="hidden md:block max-w-full overflow-x-auto table-scrollbar">
                <Table className="table-root">
                    <TableHeader className="table-header-row">
                        <TableRow>
                            <TableCell isHeader className="table-header-cell cursor-pointer group" onClick={() => handleSort("identificationNumber")}>
                                <div className="flex items-center">Cédula <SortIndicator column="identificationNumber" /></div>
                            </TableCell>
                            <TableCell isHeader className="table-header-cell cursor-pointer group" onClick={() => handleSort("studentName")}>
                                <div className="flex items-center">Estudiante <SortIndicator column="studentName" /></div>
                            </TableCell>
                            <TableCell isHeader className="table-header-cell cursor-pointer group" onClick={() => handleSort("period")}>
                                <div className="flex items-center">Período <SortIndicator column="period" /></div>
                            </TableCell>
                            <TableCell isHeader className="table-header-cell cursor-pointer group" onClick={() => handleSort("enrollmentCode")}>
                                <div className="flex items-center">Matrícula <SortIndicator column="enrollmentCode" /></div>
                            </TableCell>
                            <TableCell isHeader className="table-header-cell cursor-pointer group" onClick={() => handleSort("preEnrollmentDate")}>
                                <div className="flex items-center">Fecha <SortIndicator column="preEnrollmentDate" /></div>
                            </TableCell>
                            <TableCell isHeader className="table-header-cell text-right">
                                Acciones
                            </TableCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-border-light dark:divide-border-dark">
                        {paged.length > 0 ? (
                            paged.map((s) => (
                                <TableRow 
                                    key={s.preEnrollmentId}
                                    className={`${highlightedRow === s.preEnrollmentId ? 'bg-bg-secondary dark:bg-white/5' : ''} table-row-hover`}
                                >
                                    <TableCell className="table-cell font-medium text-text-primary dark:text-text-emphasis">
                                        {s.identificationPrefix}-{s.identificationNumber}
                                    </TableCell>
                                    <TableCell className="table-cell text-text-secondary dark:text-text-tertiary">
                                        {s.studentName}
                                    </TableCell>
                                    <TableCell className="table-cell text-text-secondary dark:text-text-tertiary">
                                        {s.period}
                                    </TableCell>
                                    <TableCell className="table-cell text-text-secondary dark:text-text-tertiary">
                                        {s.enrollmentCode}
                                    </TableCell>
                                    <TableCell className="table-cell text-text-secondary dark:text-text-tertiary">
                                        {s.preEnrollmentDate}
                                    </TableCell>
                                    <TableCell className="table-cell text-right">
                                        <ActionMenu
                                            item={s}
                                            onView={onView ? () => onView(s) : undefined}
                                            onEdit={onEdit ? () => onEdit(s) : undefined}
                                            onToggleStatus={onToggleStatus ? () => onToggleStatus(s.preEnrollmentId) : undefined}
                                            onOpen={() => setHighlightedRow(s.preEnrollmentId)}
                                            onClose={() => setHighlightedRow(null)}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="p-0">
                                    <EmptyState
                                        title="No se encontraron pre-inscripciones"
                                        description={
                                            searchTerm || periodFilter
                                                ? "No se encontraron pre-inscripciones con los filtros aplicados. Intenta con otros términos."
                                                : "No hay pre-inscripciones registradas en el sistema actualmente."
                                        }
                                        action={
                                            searchTerm || periodFilter ? (
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
            <div className="md:hidden divide-y divide-border-light dark:divide-border-dark">
                {paged.length > 0 ? (
                    paged.map((s, index) => {
                        const preEnrollmentId = s.preEnrollmentId || `idx-${index}`;
                        const isExpanded = expandedRows.has(preEnrollmentId);

                        return (
                            <div key={preEnrollmentId} className="relative p-4 bg-white dark:bg-transparent transition-colors overflow-hidden">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex-1 text-center">
                                            <h3 className="text-sm font-bold text-text-primary dark:text-text-emphasis leading-tight truncate px-8 uppercase">
                                                {s.studentName}
                                            </h3>
                                            <p className="text-xs text-text-secondary mt-1 truncate uppercase">{s.identificationPrefix}-{s.identificationNumber}</p>
                                        </div>
                                        <button
                                            onClick={() => toggleRowExpansion(preEnrollmentId)}
                                            className="absolute right-2 top-2 p-2 text-text-tertiary hover:bg-bg-secondary dark:hover:bg-white/5 rounded-full min-h-12 min-w-12 flex items-center justify-center transition-transform duration-200"
                                            style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                                            aria-label={isExpanded ? "Contraer" : "Expandir"}
                                        >
                                            <ChevronDownIcon className="icon-sm" />
                                        </button>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="mt-4 space-y-6 animate-fadeIn border-t border-border-light dark:border-border-dark pt-6">
                                        <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <p className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary dark:text-text-secondary mb-1.5">Período</p>
                                                <p className="text-sm text-text-primary dark:text-text-secondary font-medium">{s.period}</p>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <p className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary dark:text-text-secondary mb-1.5">Fecha</p>
                                                <p className="text-sm text-text-primary dark:text-text-secondary font-medium">{s.preEnrollmentDate}</p>
                                            </div>
                                            <div className="flex flex-col items-center col-span-2">
                                                <p className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary dark:text-text-secondary mb-1.5">Código de Matrícula</p>
                                                <p className="text-sm text-text-primary dark:text-text-secondary font-medium">{s.enrollmentCode}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3 pt-2">
                                            {onView && (
                                                <button
                                                    onClick={() => onView(s)}
                                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold bg-bg-secondary dark:bg-white/5 text-text-primary dark:text-text-secondary rounded-xl min-h-12 active:scale-95 transition-all border border-transparent hover:border-border-medium dark:hover:border-border-dark"
                                                >
                                                    <EyeIcon className="icon-sm" /> Ver Detalles
                                                </button>
                                            )}
                                            {onEdit && s.status && (
                                                <button
                                                    onClick={() => onEdit(s)}
                                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold bg-bg-secondary dark:bg-white/5 text-text-primary dark:text-text-secondary rounded-xl min-h-12 active:scale-95 transition-all border border-transparent hover:border-border-medium dark:hover:border-border-dark"
                                                >
                                                    <EditIcon className="icon-sm" /> Editar
                                                </button>
                                            )}
                                            {onToggleStatus && (
                                                <button
                                                    onClick={() => onToggleStatus(s.preEnrollmentId)}
                                                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold rounded-xl min-h-12 active:scale-95 transition-all border border-transparent ${!s.status
                                                        ? "bg-success-50 dark:bg-success-950 text-success-600 dark:text-success-400 hover:border-success-200 dark:hover:border-success-700"
                                                        : "bg-error-50 dark:bg-error-950 text-error-600 dark:text-error-400 hover:border-error-200 dark:hover:border-error-700"
                                                        }`}
                                                >
                                                    {!s.status ? (
                                                        <>
                                                            <RefreshIcon className="icon-sm" /> Restaurar
                                                        </>
                                                    ) : (
                                                        <>
                                                            <TrashIcon className="icon-sm" /> Eliminar
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="py-20 text-center animate-fadeIn">
                        <EmptyState
                            title="No se encontraron pre-inscripciones"
                            description={
                                searchTerm || periodFilter
                                    ? "No se encontraron pre-inscripciones con los filtros aplicados. Intenta ajustar los términos."
                                    : "No hay pre-inscripciones registradas en el sistema actualmente."
                            }
                            action={
                                (searchTerm || periodFilter) ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={clearFilters}
                                        className="flex items-center gap-2 mx-auto"
                                    >
                                        <RefreshIcon className="icon-xs" />
                                        Limpiar filtros
                                    </Button>
                                ) : undefined
                            }
                        />
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
                onItemsPerPageChange={(val) => {
                    setItemsPerPage(val);
                    setCurrentPage(1);
                }}
                itemsPerPageOptions={[5, 10, 25]}
            />
        </div>
    );
}
