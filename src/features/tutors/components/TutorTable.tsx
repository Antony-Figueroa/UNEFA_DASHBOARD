import { useMemo, useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow, Pagination } from "../../../components/ui/table";

import { ActionButton } from "../../../components/common/ActionButton";
import { EditIcon, TrashIcon, RefreshIcon, EyeIcon, ChevronDownIcon, ChevronUpIcon } from "../../../icons/actions";
import { TutorRowData } from "../types";
import Checkbox from "../../../components/form/input/Checkbox";
import { useDebounce } from "../../../hooks/useDebounce";
import Badge from "../../../components/ui/badge/Badge";
import { Tooltip } from "../../../components/ui/tooltip/Tooltip";

const getProfessionColor = (profession: string): "primary" | "success" | "error" | "warning" | "info" => {
    const colors: ("primary" | "success" | "error" | "warning" | "info")[] = ["primary", "success", "error", "warning", "info"];
    let hash = 0;
    for (let i = 0; i < (profession || "").length; i++) {
        hash = profession.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

interface TutorTableProps {
    data: TutorRowData[];
    status: "loading" | "success" | "error";
    error: Error | null;
    onEdit?: (tutor: TutorRowData) => void;
    onToggleStatus?: (tutorId: string) => void;
    onView?: (tutor: TutorRowData) => void;
    onBulkDelete?: (ids: string[]) => void;
    onBulkRestore?: (ids: string[]) => void;
    inactiveMode?: boolean;
    activeTab?: "Activas" | "Inactivas";
    professionOptions?: { value: string; label: string }[];
    loading?: boolean;
}

type SortKey = "identificationNumber" | "firstName" | "lastName" | "email" | "profession" | "registrationDate";
type SortOrder = "asc" | "desc";

interface ActionButtonsProps {
    onEdit?: () => void;
    onToggleStatus?: () => void;
    onView?: () => void;
    activeTab: "Activas" | "Inactivas";
    isMobile?: boolean;
}

const ActionButtons = ({
    onEdit,
    onToggleStatus,
    onView,
    activeTab,
    isMobile = false,
}: ActionButtonsProps) => {
    const containerClasses = isMobile 
        ? "flex flex-col gap-3 pt-2" 
        : "flex justify-end gap-3";

    return (
        <div className={containerClasses}>
            {onView && (
                <ActionButton
                    onClick={() => onView()}
                    icon={<EyeIcon />}
                    tooltip="Ver detalles"
                    label={isMobile ? "Ver Detalles" : undefined}
                    variant="primary"
                    fullWidth={isMobile}
                />
            )}
            {onEdit && activeTab === "Activas" && (
                <ActionButton
                    onClick={() => onEdit()}
                    icon={<EditIcon />}
                    tooltip="Editar"
                    label={isMobile ? "Editar Tutor" : undefined}
                    variant="primary"
                    fullWidth={isMobile}
                />
            )}
            {onToggleStatus && (
                <ActionButton
                    onClick={() => onToggleStatus()}
                    icon={activeTab === "Activas" ? <TrashIcon /> : <RefreshIcon />}
                    tooltip={activeTab === "Activas" ? "Eliminar" : "Restaurar"}
                    label={isMobile ? (activeTab === "Activas" ? "Eliminar Tutor" : "Restaurar Tutor") : undefined}
                    variant={activeTab === "Activas" ? "danger" : "success"}
                    fullWidth={isMobile}
                />
            )}
        </div>
    );
};

export default function TutorTable({
    data = [],
    status,
    error,
    onEdit,
    onToggleStatus,
    onView,
    onBulkDelete,
    onBulkRestore,
    // inactiveMode = false,
    activeTab = "Activas",
    professionOptions = [],
    // loading = false,
}: TutorTableProps) {
    const [idFilter, setIdFilter] = useState("");
    const [nameFilter, setNameFilter] = useState("");
    const [lastNameFilter, setLastNameFilter] = useState("");
    const [professionFilter, setProfessionFilter] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: SortOrder }>({
        key: "firstName",
        order: "asc",
    });

    const debouncedIdFilter = useDebounce(idFilter, 300);
    const debouncedNameFilter = useDebounce(nameFilter, 300);
    const debouncedLastNameFilter = useDebounce(lastNameFilter, 300);

    useEffect(() => {
        setSelectedIds([]);
    }, [activeTab]);

    const filteredData = useMemo(() => {
        const idSearch = debouncedIdFilter.trim().toLowerCase();
        const nameSearch = debouncedNameFilter.trim().toLowerCase();
        const lastNameSearch = debouncedLastNameFilter.trim().toLowerCase();
        const professionSearch = professionFilter.trim().toLowerCase();

        const filtered = data.filter((t) => {
            const matchesId = !idSearch || (t.identificationNumber || "").toLowerCase().includes(idSearch);
            const matchesName = !nameSearch ||
                (t.firstName || "").toLowerCase().includes(nameSearch) ||
                (t.middleName || "").toLowerCase().includes(nameSearch);
            const matchesLastName = !lastNameSearch ||
                (t.lastName || "").toLowerCase().includes(lastNameSearch) ||
                (t.secondLastName || "").toLowerCase().includes(lastNameSearch);
            const matchesProfession = !professionSearch || (t.profession || "").toLowerCase() === professionSearch;

            const matchesTab = activeTab === "Activas" ? !!t.status : !t.status;

            return matchesId && matchesName && matchesLastName && matchesProfession && matchesTab;
        });

        filtered.sort((a, b) => {
            if (idSearch) {
                const idA = a.identificationNumber.toLowerCase();
                const idB = b.identificationNumber.toLowerCase();

                const getRelevance = (id: string) => {
                    if (id === idSearch) return 2;
                    if (id.startsWith(idSearch)) return 1;
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
    }, [data, debouncedIdFilter, debouncedNameFilter, debouncedLastNameFilter, professionFilter, activeTab, sortConfig]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedIdFilter, debouncedNameFilter, debouncedLastNameFilter, professionFilter]);

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
            const deletableIds = paged
                .filter((t) => !t.isInUse)
                .map((t) => t.tutorId)
                .filter(Boolean) as string[];
            setSelectedIds(deletableIds);
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id: string, checked: boolean) => {
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
            const allIds = paged.map((t, index) => t.tutorId ?? `idx-${index}`);
            setExpandedRows(new Set(allIds));
        }
    };

    const clearFilters = () => {
        setIdFilter("");
        setNameFilter("");
        setLastNameFilter("");
        setProfessionFilter("");
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

    return (
        <div className="table-container">
            <div className="p-4 border-b border-border-light dark:border-border-dark space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Filtro por Cédula */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar por cédula"
                            value={idFilter}
                            onChange={(e) => setIdFilter(e.target.value)}
                            className="w-full h-11 rounded-lg border border-border-medium bg-transparent pl-10 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:border-brand-500 focus:outline-none dark:border-border-dark dark:bg-bg-dark dark:text-text-emphasis dark:placeholder:text-text-tertiary"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                            </svg>
                        </span>
                    </div>

                    {/* Filtro por Nombres */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar nombres"
                            value={nameFilter}
                            onChange={(e) => setNameFilter(e.target.value)}
                            className="w-full h-11 rounded-lg border border-border-medium bg-transparent pl-3 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:border-brand-500 focus:outline-none dark:border-border-dark dark:bg-bg-dark dark:text-text-emphasis dark:placeholder:text-text-tertiary"
                        />
                    </div>

                    {/* Filtro por Apellidos */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar apellidos"
                            value={lastNameFilter}
                            onChange={(e) => setLastNameFilter(e.target.value)}
                            className="w-full h-11 rounded-lg border border-border-medium bg-transparent pl-3 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:border-brand-500 focus:outline-none dark:border-border-dark dark:bg-bg-dark dark:text-text-emphasis dark:placeholder:text-text-tertiary"
                        />
                    </div>

                    {/* Filtro por Profesión */}
                    <div className="relative">
                        <select
                            value={professionFilter}
                            onChange={(e) => setProfessionFilter(e.target.value)}
                            className="w-full h-11 rounded-lg border border-border-medium bg-transparent pl-3 pr-4 text-sm text-text-primary focus:border-brand-500 focus:outline-none dark:border-border-dark dark:bg-bg-dark dark:text-text-emphasis appearance-none"
                        >
                            <option value="">Todas las Profesiones</option>
                            {professionOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
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
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-bg-secondary dark:border-border-dark">
                    <div className="flex items-center gap-4">
                        <div className="text-xs text-text-tertiary dark:text-text-tertiary">
                            Mostrando <span className="font-bold text-text-secondary dark:text-text-emphasis">{filteredData.length}</span> resultados
                        </div>
                        {(idFilter || nameFilter || lastNameFilter || professionFilter) && (
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
                            <button
                                onClick={toggleAllRows}
                                className="md:hidden flex items-center gap-2 rounded-lg bg-bg-secondary px-3 py-2 text-xs font-medium text-text-secondary hover:bg-bg-main dark:bg-white/5 dark:text-text-tertiary transition-colors min-h-12"
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

                        {selectedIds.length > 0 && (
                            <div className="flex items-center gap-2 animate-fadeIn">
                                <span className="hidden sm:inline text-xs font-medium text-text-secondary dark:text-text-tertiary mr-2">
                                    {selectedIds.length} seleccionados
                                </span>
                                {activeTab === "Activas" ? (
                                    <button
                                        onClick={() => onBulkDelete?.(selectedIds)}
                                        className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100 dark:bg-red-400/10 dark:text-red-400 dark:hover:bg-red-400/20 transition-colors min-h-12"
                                    >
                                        <TrashIcon className="icon-sm" />
                                        Eliminar
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => onBulkRestore?.(selectedIds)}
                                        className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-xs font-medium text-brand-600 hover:bg-brand-100 dark:bg-brand-400/10 dark:text-brand-400 dark:hover:bg-brand-400/20 transition-colors min-h-12"
                                    >
                                        <RefreshIcon className="icon-sm" />
                                        Restaurar
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Vista de Escritorio (Tabla) */}
            <div className="hidden md:block max-w-full overflow-x-auto table-scrollbar">
                <Table className="table-root">
                    <TableHeader className="table-header-row bg-bg-secondary dark:bg-bg-dark/50">
                        <TableRow>
                            <TableCell isHeader className="table-header-cell w-10">
                                <Checkbox
                                    checked={
                                        paged.length > 0 &&
                                        paged.filter((t) => !t.isInUse).length > 0 &&
                                        paged.filter((t) => !t.isInUse).every((t) => selectedIds.includes(t.tutorId))
                                    }
                                    onChange={handleSelectAll}
                                    ariaLabel="Seleccionar todos"
                                />
                            </TableCell>
                            <TableCell isHeader className="table-header-cell cursor-pointer group" onClick={() => handleSort("identificationNumber")}>
                                <div className="flex items-center">Cédula <SortIndicator column="identificationNumber" /></div>
                            </TableCell>
                            <TableCell isHeader className="table-header-cell cursor-pointer group" onClick={() => handleSort("firstName")}>
                                <div className="flex items-center">Nombres <SortIndicator column="firstName" /></div>
                            </TableCell>
                            <TableCell isHeader className="table-header-cell cursor-pointer group" onClick={() => handleSort("lastName")}>
                                <div className="flex items-center">Apellidos <SortIndicator column="lastName" /></div>
                            </TableCell>
                            <TableCell isHeader className="table-header-cell">Sexo</TableCell>
                            <TableCell isHeader className="table-header-cell">Teléfono</TableCell>
                            <TableCell isHeader className="table-header-cell cursor-pointer group" onClick={() => handleSort("email")}>
                                <div className="flex items-center">Correo Electrónico <SortIndicator column="email" /></div>
                            </TableCell>
                            <TableCell isHeader className="table-header-cell cursor-pointer group" onClick={() => handleSort("profession")}>
                                <div className="flex items-center">Profesión <SortIndicator column="profession" /></div>
                            </TableCell>
                            <TableCell isHeader className="table-header-cell text-right">&nbsp;</TableCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-border-light dark:divide-border-dark">
                        {paged.length > 0 ? (
                            paged.map((t, index) => (
                                <TableRow
                                    key={t.tutorId}
                                    className={`table-row-hover ${index % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-bg-secondary/50 dark:bg-white/2"} ${selectedIds.includes(t.tutorId) ? "bg-brand-50/30 dark:bg-brand-500/5" : ""}`}
                                >
                                    <TableCell className="table-cell">
                                        <Tooltip 
                                            content={t.isInUse ? "Este tutor tiene carreras asignadas y no puede ser seleccionado para eliminar" : ""}
                                            isDisabled={!t.isInUse}
                                        >
                                            <div>
                                                <Checkbox 
                                                    checked={selectedIds.includes(t.tutorId)} 
                                                    onChange={(checked) => handleSelectRow(t.tutorId, checked)} 
                                                    disabled={t.isInUse}
                                                />
                                            </div>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell className="table-cell font-medium text-text-primary dark:text-text-emphasis">
                                        {t.identificationPrefix}-{t.identificationNumber}
                                    </TableCell>
                                    <TableCell className="table-cell">
                                        <span className="text-sm font-medium text-text-secondary dark:text-text-secondary">
                                            {t.firstName} {t.middleName || ""}
                                        </span>
                                    </TableCell>
                                    <TableCell className="table-cell">
                                        <span className="text-sm font-medium text-text-secondary dark:text-text-secondary">
                                            {t.lastName} {t.secondLastName || ""}
                                        </span>
                                    </TableCell>
                                    <TableCell className="table-cell text-sm text-text-secondary dark:text-text-tertiary capitalize">
                                        {(t.sex || "N/A").toLowerCase()}
                                    </TableCell>
                                    <TableCell className="table-cell text-sm text-text-secondary dark:text-text-tertiary">
                                        {t.phone}
                                    </TableCell>
                                    <TableCell className="table-cell text-sm text-text-secondary dark:text-text-tertiary">
                                        {t.email}
                                    </TableCell>
                                    <TableCell className="table-cell">
                                        {t.profession ? (
                                            <Badge color={getProfessionColor(t.profession)} variant="light" size="sm" shape="rounded">
                                                {t.profession}
                                            </Badge>
                                        ) : (
                                            <span className="text-text-tertiary">N/A</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="table-cell text-right">
                                        <ActionButtons
                                            onView={onView ? () => onView(t) : undefined}
                                            onEdit={onEdit ? () => onEdit(t) : undefined}
                                            onToggleStatus={onToggleStatus ? () => onToggleStatus(t.tutorId) : undefined}
                                            activeTab={activeTab}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell className="table-cell py-24 text-center" colSpan={8}>
                                    <div className="flex flex-col items-center justify-center animate-fadeIn">
                                        <div className="mb-4 rounded-full bg-bg-secondary p-4 dark:bg-white/5">
                                            <svg className="h-8 w-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-sm font-bold text-text-primary dark:text-text-emphasis">No se encontraron tutores</h3>
                                        <p className="mt-1 text-xs text-text-tertiary dark:text-text-tertiary">Intenta ajustar los filtros para encontrar lo que buscas.</p>
                                        {(idFilter || nameFilter || lastNameFilter || professionFilter) && (
                                            <button
                                                onClick={clearFilters}
                                                className="mt-4 text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                                            >
                                                Ver todos los tutores
                                            </button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Vista Móvil */}
            <div className="md:hidden divide-y divide-border-light dark:divide-border-dark">
                {paged.length > 0 ? (
                    paged.map((t, index) => {
                        const rowId = t.tutorId ?? `idx-${index}`;
                        const isExpanded = expandedRows.has(rowId);
                        return (
                            <div key={rowId} className="relative p-4 bg-white dark:bg-transparent transition-colors overflow-hidden">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex-1 text-center">
                                            <h3 className="text-sm font-bold text-text-primary dark:text-text-emphasis leading-tight truncate px-8">
                                                {t.firstName} {t.lastName}
                                            </h3>
                                            <p className="text-xs text-text-tertiary mt-1 truncate">{t.identificationPrefix}-{t.identificationNumber}</p>
                                        </div>
                                        <button
                                            onClick={() => toggleRowExpansion(rowId)}
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
                                            <div className="flex flex-col items-center">
                                                <p className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary dark:text-text-tertiary mb-1.5">Profesión</p>
                                                <div className="flex justify-center w-full">
                                                    {t.profession ? (
                                                        <Badge color={getProfessionColor(t.profession)} variant="light" size="sm">
                                                            {t.profession}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-xs text-text-tertiary font-medium">N/A</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <p className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary dark:text-text-tertiary mb-1.5">Sexo</p>
                                                <p className="text-sm text-text-secondary dark:text-text-secondary font-medium capitalize">{(t.sex || "N/A").toLowerCase()}</p>
                                            </div>
                                            <div className="col-span-2 flex flex-col items-center">
                                                <p className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary dark:text-text-tertiary mb-1.5">Correo</p>
                                                <p className="text-sm text-text-secondary dark:text-text-secondary font-medium truncate w-full max-w-62.5">{t.email}</p>
                                            </div>
                                            <div className="col-span-2 flex flex-col items-center">
                                                <p className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary dark:text-text-tertiary mb-1.5">Teléfono</p>
                                                <p className="text-sm text-text-secondary dark:text-text-secondary font-medium">{t.phone}</p>
                                            </div>
                                        </div>

                                        <ActionButtons
                                            onView={onView ? () => onView(t) : undefined}
                                            onEdit={onEdit ? () => onEdit(t) : undefined}
                                            onToggleStatus={onToggleStatus ? () => onToggleStatus(t.tutorId) : undefined}
                                            activeTab={activeTab}
                                            isMobile={true}
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
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <h3 className="text-sm font-bold text-text-primary dark:text-text-emphasis">No se encontraron tutores</h3>
                        <p className="mt-1 text-xs text-text-tertiary dark:text-text-tertiary max-w-50 mx-auto">Intenta ajustar los filtros para encontrar lo que buscas.</p>
                        {(idFilter || nameFilter || lastNameFilter || professionFilter) && (
                            <button
                                onClick={clearFilters}
                                className="mt-4 text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                            >
                                Ver todos los tutores
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
                <div className="p-4 border-t border-border-light dark:border-border-dark">
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
                    />
                </div>
            )}
        </div>
    );
}
