import { useMemo, useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow, Pagination } from "../../../components/ui/table";
import { DropdownPortal } from "../../../components/ui/dropdown/DropdownPortal";
import { DropdownItem } from "../../../components/ui/dropdown/DropdownItem";
import { EditIcon, TrashIcon, RefreshIcon, EyeIcon, ThreeDotsIcon, ChevronDownIcon, ChevronUpIcon } from "../../../icons/actions";
import { StudentRowData } from "../types";
import Checkbox from "../../../components/form/input/Checkbox";
import { useDebounce } from "../../../hooks/useDebounce";
import Badge from "../../../components/ui/badge/Badge";

const getCareerColor = (careerName: string): "primary" | "success" | "error" | "warning" | "info" => {
    const colors: ("primary" | "success" | "error" | "warning" | "info")[] = ["primary", "success", "error", "warning", "info"];
    let hash = 0;
    for (let i = 0; i < careerName.length; i++) {
        hash = careerName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

interface StudentTableProps {
    data: StudentRowData[];
    status: "loading" | "success" | "error";
    error: Error | null;
    onEdit?: (student: StudentRowData) => void;
    onToggleStatus?: (studentId: string) => void;
    onView?: (student: StudentRowData) => void;
    onBulkDelete?: (ids: string[]) => void;
    onBulkRestore?: (ids: string[]) => void;
    inactiveMode?: boolean;
    activeTab?: "Activas" | "Inactivas";
    careerOptions?: { value: string | number; label: string }[];
    loading?: boolean;
}

type SortKey = "identificationNumber" | "firstName" | "lastName" | "email" | "careerName" | "enrollmentDate";
type SortOrder = "asc" | "desc";

export default function StudentTable({
    data = [],
    status,
    error,
    onEdit,
    onToggleStatus,
    onView,
    onBulkDelete,
    onBulkRestore,
    inactiveMode = false,
    activeTab = "Activas",
    careerOptions = [],
    // loading = false,
}: StudentTableProps) {
    const [idFilter, setIdFilter] = useState("");
    const [nameFilter, setNameFilter] = useState("");
    const [lastNameFilter, setLastNameFilter] = useState("");
    const [careerFilter, setCareerFilter] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [openRowId, setOpenRowId] = useState<string | number | null>(null);
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: SortOrder }>({
        key: "lastName",
        order: "asc",
    });

    const debouncedIdFilter = useDebounce(idFilter, 300);
    const debouncedNameFilter = useDebounce(nameFilter, 300);
    const debouncedLastNameFilter = useDebounce(lastNameFilter, 300);

    useEffect(() => {
        setSelectedIds([]);
        // Reset filters when changing tabs? User didn't specify, but usually good.
        // For now let's keep them as requested.
    }, [activeTab]);

    const filteredData = useMemo(() => {
        const idSearch = debouncedIdFilter.trim().toLowerCase();
        const nameSearch = debouncedNameFilter.trim().toLowerCase();
        const lastNameSearch = debouncedLastNameFilter.trim().toLowerCase();
        const careerSearch = careerFilter;

        const filtered = data.filter((s) => {
            const matchesId = !idSearch || s.identificationNumber.toLowerCase().includes(idSearch);
            const matchesName = !nameSearch ||
                s.firstName.toLowerCase().includes(nameSearch) ||
                (s.middleName || "").toLowerCase().includes(nameSearch);
            const matchesLastName = !lastNameSearch ||
                s.lastName.toLowerCase().includes(lastNameSearch) ||
                (s.secondLastName || "").toLowerCase().includes(lastNameSearch);
            const matchesCareer = !careerSearch || s.careerId === careerSearch;

            const matchesTab = activeTab === "Activas" ? s.status === true : s.status === false;

            return matchesId && matchesName && matchesLastName && matchesCareer && matchesTab;
        });

        filtered.sort((a, b) => {
            // Prioritize relevance if there's an ID search
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
    }, [data, debouncedIdFilter, debouncedNameFilter, debouncedLastNameFilter, careerFilter, activeTab, sortConfig]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedIdFilter, debouncedNameFilter, debouncedLastNameFilter, careerFilter]);

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
            const allIds = paged.map((s) => s.studentId).filter(Boolean) as string[];
            setSelectedIds(allIds);
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
            const allIds = paged.map((s, index) => s.studentId ?? `idx-${index}`);
            setExpandedRows(new Set(allIds));
        }
    };

    const clearFilters = () => {
        setIdFilter("");
        setNameFilter("");
        setLastNameFilter("");
        setCareerFilter("");
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

                    {/* Filtro por Carrera */}
                    <div className="relative">
                        <select
                            value={careerFilter}
                            onChange={(e) => setCareerFilter(e.target.value)}
                            className="w-full h-11 rounded-lg border border-border-medium bg-transparent pl-3 pr-10 text-sm text-text-primary focus:border-brand-500 focus:outline-none dark:border-border-dark dark:bg-bg-dark dark:text-text-emphasis appearance-none"
                        >
                            <option value="" className="dark:bg-bg-dark">Todas las Carreras</option>
                            {careerOptions.map((opt) => (
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
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border-light dark:border-border-dark">
                    <div className="flex items-center gap-4">
                        <div className="text-xs text-text-secondary dark:text-text-tertiary">
                            Mostrando <span className="font-bold text-text-primary dark:text-text-emphasis">{filteredData.length}</span> resultados
                        </div>
                        {(idFilter || nameFilter || lastNameFilter || careerFilter) && (
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
                                className="md:hidden flex items-center gap-2 rounded-lg bg-bg-secondary px-3 py-2 text-xs font-medium text-text-secondary hover:bg-bg-tertiary dark:bg-white/5 dark:text-text-tertiary transition-colors min-h-12"
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
                    <TableHeader className="table-header-row">
                        <TableRow>
                            <TableCell isHeader className="table-header-cell w-10">
                                <Checkbox
                                    checked={paged.length > 0 && selectedIds.length === paged.length}
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
                            <TableCell isHeader className="table-header-cell cursor-pointer group" onClick={() => handleSort("careerName")}>
                                <div className="flex items-center">Carrera <SortIndicator column="careerName" /></div>
                            </TableCell>
                            <TableCell isHeader className="table-header-cell text-right">Acciones</TableCell>
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
                                        <Checkbox checked={selectedIds.includes(s.studentId)} onChange={(checked) => handleSelectRow(s.studentId, checked)} />
                                    </TableCell>
                                    <TableCell className="table-cell font-medium text-text-primary dark:text-text-emphasis">
                                        {s.identificationPrefix}-{s.identificationNumber}
                                    </TableCell>
                                    <TableCell className="table-cell text-text-secondary dark:text-text-tertiary font-semibold uppercase">
                                        {s.firstName} {s.middleName}
                                    </TableCell>
                                    <TableCell className="table-cell text-text-secondary dark:text-text-tertiary font-semibold uppercase">
                                        {s.lastName} {s.secondLastName}
                                    </TableCell>
                                    <TableCell className="table-cell text-text-secondary dark:text-text-tertiary">{s.sex}</TableCell>
                                    <TableCell className="table-cell text-text-secondary dark:text-text-tertiary whitespace-nowrap">{s.phone}</TableCell>
                                    <TableCell className="table-cell text-text-secondary dark:text-text-tertiary">{s.email}</TableCell>
                                    <TableCell className="table-cell">
                                        {s.careerName ? (
                                            <Badge color={getCareerColor(s.careerName)} variant="light" size="sm" shape="rounded">
                                                {s.careerName}
                                            </Badge>
                                        ) : (
                                            <span className="text-text-tertiary">N/A</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="table-cell text-right relative">
                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                className="dropdown-toggle inline-flex items-center rounded-full p-1 text-text-secondary hover:bg-bg-secondary hover:text-text-primary dark:text-text-tertiary dark:hover:bg-white/5 min-h-12 min-w-12 justify-center"
                                                aria-label="Acciones"
                                                onClick={(e) => {
                                                    setAnchorEl(e.currentTarget as HTMLElement);
                                                    setOpenRowId((prev) =>
                                                        prev === (s.studentId ?? index) ? null : (s.studentId ?? index)
                                                    );
                                                }}
                                                aria-expanded={openRowId === (s.studentId ?? index)}
                                            >
                                                <ThreeDotsIcon className="icon-sm" />
                                            </button>

                                            <DropdownPortal
                                                isOpen={openRowId === (s.studentId ?? index)}
                                                onClose={() => setOpenRowId(null)}
                                                anchorRef={{ current: anchorEl as HTMLElement }}
                                                className="min-w-44"
                                            >
                                                {onView && (
                                                    <DropdownItem
                                                        onItemClick={() => onView(s)}
                                                        className="flex items-center gap-2 text-text-primary hover:bg-bg-secondary dark:text-text-emphasis"
                                                    >
                                                        <EyeIcon className="icon-sm" /> Ver Detalles
                                                    </DropdownItem>
                                                )}
                                                {onEdit && activeTab === "Activas" && (
                                                    <DropdownItem
                                                        onItemClick={() => onEdit(s)}
                                                        className="flex items-center gap-2 text-text-primary hover:bg-bg-secondary dark:text-text-emphasis"
                                                    >
                                                        <EditIcon className="icon-sm" /> Editar
                                                    </DropdownItem>
                                                )}
                                                {onToggleStatus && (inactiveMode || s.status === false) && (
                                                    <DropdownItem
                                                        onItemClick={() => onToggleStatus(s.studentId)}
                                                        className="flex items-center gap-2 text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-400/10"
                                                    >
                                                        <RefreshIcon className="icon-sm" />
                                                        {inactiveMode ? "Restaurar" : "Activar"}
                                                    </DropdownItem>
                                                )}
                                                {onToggleStatus && activeTab === "Activas" && (
                                                    <DropdownItem
                                                        onItemClick={() => onToggleStatus(s.studentId)}
                                                        className="flex items-center gap-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-400/10"
                                                    >
                                                        <TrashIcon className="icon-sm" /> Eliminar
                                                    </DropdownItem>
                                                )}
                                            </DropdownPortal>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell className="table-cell py-24 text-center" colSpan={9}>
                                    <div className="flex flex-col items-center justify-center animate-fadeIn">
                                        <div className="mb-4 rounded-full bg-bg-secondary p-4 dark:bg-white/5">
                                            <svg className="h-8 w-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-sm font-bold text-text-primary dark:text-text-emphasis">No se encontraron estudiantes</h3>
                                        <p className="mt-1 text-xs text-text-secondary dark:text-text-tertiary">Intenta ajustar los filtros para encontrar lo que buscas.</p>
                                        {(idFilter || nameFilter || lastNameFilter || careerFilter) && (
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
                                                {s.fullNames}
                                            </h3>
                                            <p className="text-xs text-text-secondary dark:text-text-tertiary mt-1 truncate">{s.identificationPrefix}-{s.identificationNumber}</p>
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
                                                <p className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary dark:text-text-tertiary mb-1.5">Carrera</p>
                                                <div className="flex justify-center w-full">
                                                    {s.careerName ? (
                                                        <Badge color={getCareerColor(s.careerName)} variant="light" size="sm">
                                                            {s.careerName}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-xs text-text-tertiary font-medium">N/A</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <p className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary dark:text-text-tertiary mb-1.5">Sexo</p>
                                                <p className="text-sm text-text-secondary dark:text-text-tertiary font-medium">{s.sex}</p>
                                            </div>
                                            <div className="col-span-2 flex flex-col items-center">
                                                <p className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary dark:text-text-tertiary mb-1.5">Correo</p>
                                                <p className="text-sm text-text-secondary dark:text-text-tertiary font-medium truncate w-full max-w-62.5">{s.email}</p>
                                            </div>
                                            <div className="col-span-2 flex flex-col items-center">
                                                <p className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary dark:text-text-tertiary mb-1.5">Teléfono</p>
                                                <p className="text-sm text-text-secondary dark:text-text-tertiary font-medium">{s.phone}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3 pt-2">
                                            {onView && (
                                                <button
                                                    onClick={() => onView(s)}
                                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold bg-bg-secondary dark:bg-white/5 text-text-secondary dark:text-text-tertiary rounded-xl min-h-12 active:scale-95 transition-all border border-transparent hover:border-border-medium dark:hover:border-white/10"
                                                >
                                                    <EyeIcon className="w-4 h-4" /> Ver
                                                </button>
                                            )}
                                            {onEdit && activeTab === "Activas" && (
                                                <button
                                                    onClick={() => onEdit(s)}
                                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold bg-bg-secondary dark:bg-white/5 text-text-secondary dark:text-text-tertiary rounded-xl min-h-12 active:scale-95 transition-all border border-transparent hover:border-border-medium dark:hover:border-white/10"
                                                >
                                                    <EditIcon className="w-4 h-4" /> Editar
                                                </button>
                                            )}
                                            {onToggleStatus && (
                                                <button
                                                    onClick={() => onToggleStatus(s.studentId)}
                                                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold rounded-xl min-h-12 active:scale-95 transition-all border border-transparent ${inactiveMode
                                                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:border-emerald-200 dark:hover:border-emerald-500/20"
                                                        : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:border-red-200 dark:hover:border-red-500/20"
                                                        }`}
                                                >
                                                    {inactiveMode ? (
                                                        <>
                                                            <RefreshIcon className="w-4 h-4" /> Restaurar
                                                        </>
                                                    ) : (
                                                        <>
                                                            <TrashIcon className="w-4 h-4" /> Eliminar
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
                        <div className="inline-flex mb-4 rounded-full bg-bg-secondary p-4 dark:bg-white/5">
                            <svg className="h-8 w-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <h3 className="text-sm font-bold text-text-primary dark:text-text-emphasis">No se encontraron estudiantes</h3>
                        <p className="mt-1 text-xs text-text-secondary dark:text-text-tertiary max-w-50 mx-auto">Intenta ajustar los filtros para encontrar lo que buscas.</p>
                        {(idFilter || nameFilter || lastNameFilter || careerFilter) && (
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
