import { useMemo, useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow, Pagination } from "../../../components/ui/table";
import { DropdownPortal } from "../../../components/ui/dropdown/DropdownPortal";
import { DropdownItem } from "../../../components/ui/dropdown/DropdownItem";
import { EditIcon, TrashIcon, RefreshIcon, EyeIcon, ThreeDotsIcon, ChevronDownIcon, ChevronUpIcon } from "../../../icons/actions";
import { PreEnrollmentRowData } from "../types";
import Checkbox from "../../../components/form/input/Checkbox";
import { useDebounce } from "../../../hooks/useDebounce";

interface PreEnrollmentTableProps {
    data: PreEnrollmentRowData[];
    status: "loading" | "success" | "error";
    error: Error | null;
    onEdit?: (item: PreEnrollmentRowData) => void;
    onToggleStatus?: (id: string) => void;
    onView?: (item: PreEnrollmentRowData) => void;
    onBulkDelete?: (ids: string[]) => void;
    onBulkRestore?: (ids: string[]) => void;
    inactiveMode?: boolean;
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
    onBulkDelete,
    onBulkRestore,
    // inactiveMode = false,
    activeTab = "Activas",
}: PreEnrollmentTableProps) {
    const [idFilter, setIdFilter] = useState("");
    const [nameFilter, setNameFilter] = useState("");
    const [periodFilter, setPeriodFilter] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [openRowId, setOpenRowId] = useState<string | number | null>(null);
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: SortOrder }>({
        key: "studentName",
        order: "asc",
    });

    const debouncedIdFilter = useDebounce(idFilter, 300);
    const debouncedNameFilter = useDebounce(nameFilter, 300);

    useEffect(() => {
        setSelectedIds([]);
    }, [activeTab]);

    const filteredData = useMemo(() => {
        const idSearch = debouncedIdFilter.trim().toLowerCase();
        const nameSearch = debouncedNameFilter.trim().toLowerCase();
        const periodSearch = periodFilter.trim().toLowerCase();

        const filtered = data.filter((s) => {
            const matchesId = !idSearch || s.identificationNumber.toLowerCase().includes(idSearch);
            const matchesName = !nameSearch || s.studentName.toLowerCase().includes(nameSearch);
            const matchesPeriod = !periodSearch || s.period.toLowerCase().includes(periodSearch);
            const matchesTab = activeTab === "Activas" ? s.status === true : s.status === false;

            return matchesId && matchesName && matchesPeriod && matchesTab;
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
    }, [data, debouncedIdFilter, debouncedNameFilter, periodFilter, activeTab, sortConfig]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedIdFilter, debouncedNameFilter, periodFilter]);

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
            const allIds = paged.map((s) => s.preEnrollmentId).filter(Boolean) as string[];
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
            const allIds = paged.map((s, index) => s.preEnrollmentId ?? `idx-${index}`);
            setExpandedRows(new Set(allIds));
        }
    };

    const clearFilters = () => {
        setIdFilter("");
        setNameFilter("");
        setPeriodFilter("");
    };

    const handleActionClick = (e: React.MouseEvent<HTMLElement>, id: string) => {
        setAnchorEl(e.currentTarget);
        setOpenRowId(id);
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
                <p className="font-semibold">Error al cargar pre-inscripciones</p>
                <p className="text-sm">{error?.message || "Por favor, intente de nuevo más tarde."}</p>
            </div>
        );
    }

    return (
        <div className="table-container">
            <div className="p-4 border-b border-gray-100 dark:border-white/5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Filtro por Cédula */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar por cédula"
                            value={idFilter}
                            onChange={(e) => setIdFilter(e.target.value)}
                            className="w-full h-11 rounded-lg border border-gray-300 bg-transparent pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                            </svg>
                        </span>
                    </div>

                    {/* Filtro por Estudiante */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar por estudiante"
                            value={nameFilter}
                            onChange={(e) => setNameFilter(e.target.value)}
                            className="w-full h-11 rounded-lg border border-gray-300 bg-transparent pl-3 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
                        />
                    </div>

                    {/* Filtro por Período */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar por período"
                            value={periodFilter}
                            onChange={(e) => setPeriodFilter(e.target.value)}
                            className="w-full h-11 rounded-lg border border-gray-300 bg-transparent pl-3 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            Mostrando <span className="font-bold text-gray-700 dark:text-white">{filteredData.length}</span> resultados
                        </div>
                        {(idFilter || nameFilter || periodFilter) && (
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
                                <div className="flex items-center">Fecha Preinscripción <SortIndicator column="preEnrollmentDate" /></div>
                            </TableCell>
                            <TableCell isHeader className="table-header-cell text-right">Acciones</TableCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
                        {status === "loading" ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    {Array.from({ length: 7 }).map((_, j) => (
                                        <TableCell key={j}><div className="h-4 bg-gray-100 dark:bg-gray-800 animate-pulse rounded" /></TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : paged.length > 0 ? (
                            paged.map((s, index) => (
                                <TableRow
                                    key={s.preEnrollmentId}
                                    className={`table-row-hover ${index % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-gray-50/50 dark:bg-white/2"} ${selectedIds.includes(s.preEnrollmentId) ? "bg-brand-50/30 dark:bg-brand-500/5" : ""}`}
                                >
                                    <TableCell className="table-cell">
                                        <Checkbox
                                            checked={selectedIds.includes(s.preEnrollmentId)}
                                            onChange={(checked) => handleSelectRow(s.preEnrollmentId, checked)}
                                            ariaLabel={`Seleccionar pre-inscripción de ${s.studentName}`}
                                        />
                                    </TableCell>
                                    <TableCell className="table-cell font-medium text-gray-800 dark:text-white/90">
                                        {s.identificationPrefix}-{s.identificationNumber}
                                    </TableCell>
                                    <TableCell className="table-cell">{s.studentName}</TableCell>
                                    <TableCell className="table-cell">{s.period}</TableCell>
                                    <TableCell className="table-cell">{s.enrollmentCode}</TableCell>
                                    <TableCell className="table-cell">{s.preEnrollmentDate}</TableCell>
                                    <TableCell className="table-cell text-right">
                                        <button
                                            onClick={(e) => handleActionClick(e, s.preEnrollmentId)}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors text-gray-500"
                                        >
                                            <ThreeDotsIcon className="icon-sm" />
                                        </button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="py-12 text-center text-gray-500 dark:text-gray-400">
                                    No se encontraron pre-inscripciones.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Vista Móvil (Cards) */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-white/5">
                {paged.length > 0 ? (
                    paged.map((s, index) => {
                        const rowId = s.preEnrollmentId ?? `idx-${index}`;
                        const isExpanded = expandedRows.has(rowId);
                        return (
                            <div key={rowId} className="relative p-4 bg-white dark:bg-transparent transition-colors overflow-hidden">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex-1 text-center">
                                            <h3 className="text-sm font-bold text-gray-800 dark:text-white/90 leading-tight truncate px-8">
                                                {s.studentName}
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-1 truncate">{s.identificationPrefix}-{s.identificationNumber}</p>
                                        </div>
                                        <button
                                            onClick={() => toggleRowExpansion(rowId)}
                                            className="absolute right-2 top-2 p-2 text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 rounded-full min-h-12 min-w-12 flex items-center justify-center transition-transform duration-200"
                                            style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                                        >
                                            <ChevronDownIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="mt-4 space-y-6 animate-fadeIn border-t border-gray-50 dark:border-white/5 pt-6">
                                        <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 mb-1.5">Período</p>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{s.period}</p>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 mb-1.5">Matrícula</p>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{s.enrollmentCode}</p>
                                            </div>
                                            <div className="col-span-2 flex flex-col items-center">
                                                <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 mb-1.5">Fecha</p>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{s.preEnrollmentDate}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3 pt-2">
                                            {onView && (
                                                <button
                                                    onClick={() => onView(s)}
                                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-xl min-h-12 active:scale-95 transition-all border border-transparent hover:border-gray-200 dark:hover:border-white/10"
                                                >
                                                    <EyeIcon className="w-4 h-4" /> Ver
                                                </button>
                                            )}
                                            {onEdit && activeTab === "Activas" && (
                                                <button
                                                    onClick={() => onEdit(s)}
                                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-xl min-h-12 active:scale-95 transition-all border border-transparent hover:border-gray-200 dark:hover:border-white/10"
                                                >
                                                    <EditIcon className="w-4 h-4" /> Editar
                                                </button>
                                            )}
                                            {onToggleStatus && (
                                                <button
                                                    onClick={() => onToggleStatus(s.preEnrollmentId)}
                                                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold rounded-xl min-h-12 active:scale-95 transition-all border border-transparent ${activeTab === "Inactivas"
                                                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:border-emerald-200 dark:hover:border-emerald-500/20"
                                                        : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:border-red-200 dark:hover:border-red-500/20"
                                                        }`}
                                                >
                                                    {activeTab === "Inactivas" ? (
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
                        <div className="inline-flex mb-4 rounded-full bg-gray-50 p-4 dark:bg-white/5">
                            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <h3 className="text-sm font-bold text-gray-800 dark:text-white">No se encontraron pre-inscripciones</h3>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 max-w-50 mx-auto">Intenta ajustar los filtros para encontrar lo que buscas.</p>
                        {(idFilter || nameFilter || periodFilter) && (
                            <button
                                onClick={clearFilters}
                                className="mt-4 text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                            >
                                Ver todas las pre-inscripciones
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Paginación */}
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
                    itemsPerPageOptions={[5, 10, 25]}
                />
            </div>

            {/* Dropdown de Acciones */}
            <DropdownPortal
                isOpen={!!openRowId}
                onClose={() => setOpenRowId(null)}
                anchorRef={{ current: anchorEl as HTMLElement }}
            >
                <div className="w-56 py-1 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-100 dark:border-white/5">
                    <DropdownItem
                        onClick={() => {
                            const item = data.find(i => i.preEnrollmentId === openRowId);
                            if (item) onView?.(item);
                            setOpenRowId(null);
                        }}
                    >
                        <EyeIcon className="icon-sm mr-3 text-gray-400" />
                        <span className="font-medium">Ver detalles</span>
                    </DropdownItem>
                    <DropdownItem
                        onClick={() => {
                            const item = data.find(i => i.preEnrollmentId === openRowId);
                            if (item) onEdit?.(item);
                            setOpenRowId(null);
                        }}
                    >
                        <EditIcon className="icon-sm mr-3 text-gray-400" />
                        <span className="font-medium">Editar registro</span>
                    </DropdownItem>
                    <div className="my-1 border-t border-gray-50 dark:border-white/5" />
                    <DropdownItem
                        onClick={() => {
                            if (openRowId) onToggleStatus?.(openRowId.toString());
                            setOpenRowId(null);
                        }}
                        className={activeTab === "Inactivas" ? "text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-400/10" : "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-400/10"}
                    >
                        {activeTab === "Inactivas" ? (
                            <>
                                <RefreshIcon className="icon-sm mr-3" />
                                <span className="font-medium">Restaurar registro</span>
                            </>
                        ) : (
                            <>
                                <TrashIcon className="icon-sm mr-3" />
                                <span className="font-medium">Desactivar registro</span>
                            </>
                        )}
                    </DropdownItem>
                </div>
            </DropdownPortal>
        </div>
    );
}
