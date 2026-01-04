import { useMemo, useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow, Pagination } from "../../../components/ui/table";
import { DropdownPortal } from "../../../components/ui/dropdown/DropdownPortal";
import { DropdownItem } from "../../../components/ui/dropdown/DropdownItem";
import { EditIcon, TrashIcon, RefreshIcon, EyeIcon, ThreeDotsIcon, ChevronDownIcon, ChevronUpIcon } from "../../../icons/actions";
import { TutorRowData } from "../types";
import Checkbox from "../../../components/form/input/Checkbox";
import { useDebounce } from "../../../hooks/useDebounce";
// import Badge from "../../../components/ui/badge/Badge";

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
    const [openRowId, setOpenRowId] = useState<string | number | null>(null);
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

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
            const matchesId = !idSearch || t.identificationNumber.toLowerCase().includes(idSearch);
            const matchesName = !nameSearch ||
                t.firstName.toLowerCase().includes(nameSearch) ||
                (t.middleName || "").toLowerCase().includes(nameSearch);
            const matchesLastName = !lastNameSearch ||
                t.lastName.toLowerCase().includes(lastNameSearch) ||
                (t.secondLastName || "").toLowerCase().includes(lastNameSearch);
            const matchesProfession = !professionSearch || t.profession === professionSearch;

            const matchesTab = activeTab === "Activas" ? t.status === true : t.status === false;

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
            const allIds = paged.map((t) => t.tutorId).filter(Boolean) as string[];
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
                <svg className="ml-1 h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

    if (status === "error") {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-red-500 animate-fadeIn">
                <p className="font-semibold">Error al cargar tutores</p>
                <p className="text-sm">{error?.message || "Por favor, intente de nuevo más tarde."}</p>
            </div>
        );
    }

    return (
        <div className="table-container">
            <div className="p-4 border-b border-gray-100 dark:border-white/5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Filtro por Cédula */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar por cédula"
                            value={idFilter}
                            onChange={(e) => setIdFilter(e.target.value)}
                            className="w-full h-11 rounded-lg border border-gray-300 bg-transparent pl-3 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
                        />
                    </div>

                    {/* Filtro por Nombres */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar nombres"
                            value={nameFilter}
                            onChange={(e) => setNameFilter(e.target.value)}
                            className="w-full h-11 rounded-lg border border-gray-300 bg-transparent pl-3 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
                        />
                    </div>

                    {/* Filtro por Apellidos */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar apellidos"
                            value={lastNameFilter}
                            onChange={(e) => setLastNameFilter(e.target.value)}
                            className="w-full h-11 rounded-lg border border-gray-300 bg-transparent pl-3 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
                        />
                    </div>

                    {/* Filtro por Profesión */}
                    <div className="relative">
                        <select
                            value={professionFilter}
                            onChange={(e) => setProfessionFilter(e.target.value)}
                            className="w-full h-11 rounded-lg border border-gray-300 bg-transparent pl-3 pr-10 text-sm text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white appearance-none"
                        >
                            <option value="">Todas las profesiones</option>
                            {professionOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            Mostrando <span className="font-bold text-gray-700 dark:text-white">{filteredData.length}</span> resultados
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
                                className="md:hidden flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:bg-white/5 dark:text-gray-400 transition-colors min-h-12"
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
                                <span className="hidden sm:inline text-xs font-medium text-gray-600 dark:text-gray-400 mr-2">
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
                    <TableHeader className="table-header-row bg-gray-50 dark:bg-gray-800/50">
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
                            <TableCell isHeader className="table-header-cell cursor-pointer group" onClick={() => handleSort("profession")}>
                                <div className="flex items-center">Profesión <SortIndicator column="profession" /></div>
                            </TableCell>
                            <TableCell isHeader className="table-header-cell text-right">Acciones</TableCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
                        {paged.length > 0 ? (
                            paged.map((t, index) => (
                                <TableRow
                                    key={t.tutorId}
                                    className={`table-row-hover ${index % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-gray-50/50 dark:bg-white/2"} ${selectedIds.includes(t.tutorId) ? "bg-brand-50/30 dark:bg-brand-500/5" : ""}`}
                                >
                                    <TableCell className="table-cell">
                                        <Checkbox checked={selectedIds.includes(t.tutorId)} onChange={(checked) => handleSelectRow(t.tutorId, checked)} />
                                    </TableCell>
                                    <TableCell className="table-cell font-medium text-gray-800 dark:text-white/90">
                                        {t.identificationPrefix}-{t.identificationNumber}
                                    </TableCell>
                                    <TableCell className="table-cell">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t.firstName} {t.middleName || ""}
                                        </span>
                                    </TableCell>
                                    <TableCell className="table-cell">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t.lastName} {t.secondLastName || ""}
                                        </span>
                                    </TableCell>
                                    <TableCell className="table-cell text-sm text-gray-600 dark:text-gray-400 capitalize">
                                        {t.sex.toLowerCase()}
                                    </TableCell>
                                    <TableCell className="table-cell text-sm text-gray-600 dark:text-gray-400">
                                        {t.phone}
                                    </TableCell>
                                    <TableCell className="table-cell text-sm text-gray-600 dark:text-gray-400">
                                        {t.email}
                                    </TableCell>
                                    <TableCell className="table-cell">
                                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-400/10 dark:text-blue-400">
                                            {t.profession}
                                        </span>
                                    </TableCell>
                                    <TableCell className="table-cell text-right">
                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                className="dropdown-toggle inline-flex items-center rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 min-h-12 min-w-12 justify-center"
                                                aria-label="Acciones"
                                                onClick={(e) => {
                                                    setAnchorEl(e.currentTarget as HTMLElement);
                                                    setOpenRowId((prev) =>
                                                        prev === t.tutorId ? null : t.tutorId
                                                    );
                                                }}
                                                aria-expanded={openRowId === t.tutorId}
                                            >
                                                <ThreeDotsIcon className="icon-sm" />
                                            </button>

                                            <DropdownPortal
                                                isOpen={openRowId === t.tutorId}
                                                onClose={() => {
                                                    setOpenRowId(null);
                                                    setAnchorEl(null);
                                                }}
                                                anchorRef={{ current: anchorEl as HTMLElement }}
                                                className="min-w-44"
                                            >
                                                <div className="p-1">
                                                    <DropdownItem
                                                        onItemClick={() => {
                                                            onView?.(t);
                                                            setOpenRowId(null);
                                                        }}
                                                        className="flex items-center gap-2 text-gray-700 hover:bg-gray-50 dark:text-gray-300"
                                                    >
                                                        <EyeIcon className="icon-sm" />
                                                        Ver detalles
                                                    </DropdownItem>
                                                    <DropdownItem
                                                        onItemClick={() => {
                                                            onEdit?.(t);
                                                            setOpenRowId(null);
                                                        }}
                                                        className="flex items-center gap-2 text-gray-700 hover:bg-gray-50 dark:text-gray-300"
                                                    >
                                                        <EditIcon className="icon-sm" />
                                                        Editar
                                                    </DropdownItem>
                                                    <DropdownItem
                                                        onItemClick={() => {
                                                            onToggleStatus?.(t.tutorId);
                                                            setOpenRowId(null);
                                                        }}
                                                        className={`flex items-center gap-2 ${activeTab === "Activas"
                                                            ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-400/10"
                                                            : "text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-400/10"}`}
                                                    >
                                                        {activeTab === "Activas" ? (
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
                                                </div>
                                            </DropdownPortal>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={8} className="py-12 text-center text-gray-500 dark:text-gray-400">
                                    No se encontraron tutores.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Vista Móvil (Cards) */}
            <div className="md:hidden p-4 space-y-4">
                {paged.length > 0 ? (
                    paged.map((t) => (
                        <div key={t.tutorId} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-gray-800/40">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <Checkbox checked={selectedIds.includes(t.tutorId)} onChange={(checked) => handleSelectRow(t.tutorId, checked)} />
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-800 dark:text-white">{t.firstName} {t.lastName}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{t.identificationPrefix}-{t.identificationNumber}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => toggleRowExpansion(t.tutorId)}
                                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                                    >
                                        {expandedRows.has(t.tutorId) ? <ChevronUpIcon className="icon-sm" /> : <ChevronDownIcon className="icon-sm" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-400/10 dark:text-blue-400">
                                    {t.profession}
                                </span>
                            </div>

                            {expandedRows.has(t.tutorId) && (
                                <div className="space-y-3 pt-3 border-t border-gray-50 dark:border-white/5 animate-fadeIn">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Correo</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-300 break-all">{t.email}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Teléfono</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-300">{t.phone}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Sexo</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-300 capitalize">{t.sex.toLowerCase()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Registro</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-300">{t.registrationDate}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Acciones
                                </div>
                                <div className="relative">
                                    <button
                                        type="button"
                                        className="dropdown-toggle inline-flex items-center rounded-lg bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:bg-white/5 dark:text-gray-400 transition-colors"
                                        onClick={(e) => {
                                            setAnchorEl(e.currentTarget as HTMLElement);
                                            setOpenRowId((prev) =>
                                                prev === t.tutorId ? null : t.tutorId
                                            );
                                        }}
                                        aria-expanded={openRowId === t.tutorId}
                                    >
                                        <ThreeDotsIcon className="icon-sm" />
                                        Opciones
                                    </button>

                                    <DropdownPortal
                                        isOpen={openRowId === t.tutorId}
                                        onClose={() => {
                                            setOpenRowId(null);
                                            setAnchorEl(null);
                                        }}
                                        anchorRef={{ current: anchorEl as HTMLElement }}
                                        className="min-w-44"
                                    >
                                        <div className="p-1">
                                            <DropdownItem
                                                onItemClick={() => {
                                                    onView?.(t);
                                                    setOpenRowId(null);
                                                }}
                                                className="flex items-center gap-2 text-gray-700 hover:bg-gray-50 dark:text-gray-300"
                                            >
                                                <EyeIcon className="icon-sm" />
                                                Ver detalles
                                            </DropdownItem>
                                            <DropdownItem
                                                onItemClick={() => {
                                                    onEdit?.(t);
                                                    setOpenRowId(null);
                                                }}
                                                className="flex items-center gap-2 text-gray-700 hover:bg-gray-50 dark:text-gray-300"
                                            >
                                                <EditIcon className="icon-sm" />
                                                Editar
                                            </DropdownItem>
                                            <DropdownItem
                                                onItemClick={() => {
                                                    onToggleStatus?.(t.tutorId);
                                                    setOpenRowId(null);
                                                }}
                                                className={`flex items-center gap-2 ${activeTab === "Activas"
                                                    ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-400/10"
                                                    : "text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-400/10"}`}
                                            >
                                                {activeTab === "Activas" ? (
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
                                        </div>
                                    </DropdownPortal>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                        No se encontraron tutores.
                    </div>
                )}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
                <div className="p-4 border-t border-gray-100 dark:border-white/5">
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
