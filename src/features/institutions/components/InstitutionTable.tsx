/**
 * @file InstitutionTable.tsx
 * @description Tabla para visualizar instituciones con soporte para filtros, ordenamiento y paginación.
 */

import { useMemo, useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow, Pagination } from "../../../components/ui/table";
import { DropdownPortal } from "../../../components/ui/dropdown/DropdownPortal";
import { DropdownItem } from "../../../components/ui/dropdown/DropdownItem";
import { EmptyState } from "../../../components/ui/table/EmptyState";
import { EditIcon, TrashIcon, RefreshIcon, EyeIcon, ThreeDotsIcon, ChevronDownIcon, ChevronUpIcon } from "../../../icons/actions";
import { InstitutionRowData } from "../types";
import Checkbox from "../../../components/form/input/Checkbox";
import Badge from "../../../components/ui/badge/Badge";
import { useDebounce } from "../../../hooks/useDebounce";

interface InstitutionTableProps {
  data: InstitutionRowData[];
  status: "loading" | "success" | "error";
  onEdit?: (inst: InstitutionRowData) => void;
  onToggleStatus?: (inst: InstitutionRowData) => void;
  onView?: (inst: InstitutionRowData) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkRestore?: (ids: string[]) => void;
  activeTab?: "Activas" | "Inactivas";
  careerOptions?: { value: string | number; label: string }[];
  practiceOptions?: { value: string; label: string }[];
}

type SortKey = "rif" | "name" | "practiceType" | "careerName";
type SortOrder = "asc" | "desc";

export default function InstitutionTable({
  data = [],
  status,
  onEdit,
  onToggleStatus,
  onView,
  onBulkDelete,
  onBulkRestore,
  activeTab = "Activas",
  careerOptions = [],
  practiceOptions = [],
}: InstitutionTableProps) {
  const [rifFilter, setRifFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [practiceTypeFilter, setPracticeTypeFilter] = useState("");
  const [careerFilter, setCareerFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [openRowId, setOpenRowId] = useState<string | number | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: SortOrder }>({
    key: "name",
    order: "asc",
  });

  const debouncedRifFilter = useDebounce(rifFilter, 300);
  const debouncedNameFilter = useDebounce(nameFilter, 300);

  useEffect(() => {
    setSelectedIds([]);
  }, [activeTab]);

  const filteredData = useMemo(() => {
    const rifSearch = debouncedRifFilter.trim().toLowerCase();
    const nameSearch = debouncedNameFilter.trim().toLowerCase();
    const typeSearch = practiceTypeFilter;
    const careerSearch = careerFilter;

    const filtered = data.filter((i) => {
      const matchesRif = !rifSearch || i.rif.toLowerCase().includes(rifSearch);
      const matchesName = !nameSearch || i.name.toLowerCase().includes(nameSearch);
      const matchesType = !typeSearch || i.practiceType === typeSearch;
      const matchesCareer = !careerSearch || i.careerId === careerSearch;
      const matchesTab = activeTab === "Activas" ? i.status === true : i.status === false;
      return matchesRif && matchesName && matchesType && matchesCareer && matchesTab;
    });

    filtered.sort((a, b) => {
      const valA = String(a[sortConfig.key] || "").toLowerCase();
      const valB = String(b[sortConfig.key] || "").toLowerCase();
      
      if (valA < valB) return sortConfig.order === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.order === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [data, debouncedRifFilter, debouncedNameFilter, practiceTypeFilter, careerFilter, activeTab, sortConfig]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedRifFilter, debouncedNameFilter, practiceTypeFilter, careerFilter]);

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
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paged = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (key: SortKey) => {
    setSortConfig(prev => ({
      key,
      order: prev.key === key && prev.order === "asc" ? "desc" : "asc"
    }));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paged.map(i => i.institutionId));
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
          const allIds = paged.map((s, index) => s.institutionId ?? `idx-${index}`);
          setExpandedRows(new Set(allIds));
      }
  };

  const clearFilters = () => {
    setRifFilter("");
    setNameFilter("");
    setPracticeTypeFilter("");
    setCareerFilter("");
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

  if (status === "loading") {
      return <div className="p-8 text-center text-text-secondary">Cargando instituciones...</div>;
  }

  return (
    <div className="table-container">
      <div className="p-4 border-b border-border-light dark:border-white/5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
                <input
                    type="text"
                    placeholder="Buscar por RIF"
                    value={rifFilter}
                    onChange={(e) => setRifFilter(e.target.value)}
                    className="w-full h-11 rounded-lg border border-border-medium bg-transparent pl-10 pr-4 text-sm text-text-primary placeholder-text-tertiary focus:border-brand-500 focus:outline-none dark:border-border-dark dark:bg-bg-dark dark:text-white/90 dark:placeholder-text-tertiary"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                </span>
            </div>

            <div className="relative">
                <input
                    type="text"
                    placeholder="Buscar por nombre"
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                    className="w-full h-11 rounded-lg border border-border-medium bg-transparent pl-3 pr-4 text-sm text-text-primary placeholder-text-tertiary focus:border-brand-500 focus:outline-none dark:border-border-dark dark:bg-bg-dark dark:text-white/90 dark:placeholder-text-tertiary"
                />
            </div>

            {/* Filtro por Tipo de Práctica */}
            <div className="relative">
                <select
                    value={practiceTypeFilter}
                    onChange={(e) => setPracticeTypeFilter(e.target.value)}
                    className="w-full h-11 rounded-lg border border-border-medium bg-transparent pl-3 pr-10 text-sm text-text-primary focus:border-brand-500 focus:outline-none dark:border-border-dark dark:bg-bg-dark dark:text-white/90 appearance-none"
                >
                    <option value="" className="dark:bg-bg-dark">Todos los tipos</option>
                    {practiceOptions.map((opt) => (
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

            {/* Filtro por Carrera */}
            <div className="relative">
                <select
                    value={careerFilter}
                    onChange={(e) => setCareerFilter(e.target.value)}
                    className="w-full h-11 rounded-lg border border-border-medium bg-transparent pl-3 pr-10 text-sm text-text-primary focus:border-brand-500 focus:outline-none dark:border-border-dark dark:bg-bg-dark dark:text-white/90 appearance-none"
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

        <div className="flex items-center justify-between pt-2 border-t border-border-light dark:border-white/5">
            <div className="flex items-center gap-4">
                <div className="text-xs text-text-secondary dark:text-text-tertiary">
                    Mostrando <span className="font-bold text-text-primary dark:text-white">{filteredData.length}</span> resultados
                </div>
                {(rifFilter || nameFilter || practiceTypeFilter || careerFilter) && (
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
                        className="md:hidden flex items-center gap-2 rounded-lg bg-bg-secondary px-3 py-2 text-xs font-medium text-text-secondary hover:bg-bg-secondary/80 dark:bg-white/5 dark:text-text-tertiary transition-colors min-h-12"
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell isHeader className="w-10">
                <Checkbox
                  checked={paged.length > 0 && selectedIds.length === paged.length}
                  onChange={handleSelectAll}
                  ariaLabel="Seleccionar todos"
                />
              </TableCell>
              <TableCell isHeader className="cursor-pointer group" onClick={() => handleSort("rif")}>
                  <div className="flex items-center">RIF <SortIndicator column="rif" /></div>
              </TableCell>
              <TableCell isHeader className="cursor-pointer group" onClick={() => handleSort("name")}>
                  <div className="flex items-center">Nombre <SortIndicator column="name" /></div>
              </TableCell>
              <TableCell isHeader>Teléfono</TableCell>
              <TableCell isHeader className="cursor-pointer group" onClick={() => handleSort("practiceType")}>
                  <div className="flex items-center">Tipo Práctica <SortIndicator column="practiceType" /></div>
              </TableCell>
              <TableCell isHeader className="cursor-pointer group" onClick={() => handleSort("careerName")}>
                  <div className="flex items-center">Carrera <SortIndicator column="careerName" /></div>
              </TableCell>
              <TableCell isHeader className="text-right">&nbsp;</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length > 0 ? (
                paged.map((i, index) => (
                    <TableRow
                        key={i.institutionId}
                        className={`${index % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-bg-secondary/50 dark:bg-white/2"} ${selectedIds.includes(i.institutionId) ? "bg-brand-50/30 dark:bg-brand-500/5" : ""}`}
                    >
                        <TableCell>
                            <Checkbox checked={selectedIds.includes(i.institutionId)} onChange={(checked) => handleSelectRow(i.institutionId, checked)} />
                        </TableCell>
                        <TableCell className="font-medium text-text-primary dark:text-white/90">
                            {i.rif}
                        </TableCell>
                        <TableCell className="text-text-secondary dark:text-text-tertiary font-semibold">{i.name}</TableCell>
                        <TableCell className="text-text-secondary dark:text-text-tertiary whitespace-nowrap">{i.phone}</TableCell>
                        <TableCell>
                            <Badge color={i.practiceType === "HOSPITALARIA" ? "error" : i.practiceType === "COMUNITARIA" ? "warning" : "success"} variant="light" size="sm" shape="rounded">
                                {i.practiceType}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-text-secondary dark:text-text-tertiary">{i.careerName}</TableCell>
                        <TableCell className="text-right relative">
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    className="dropdown-toggle inline-flex items-center rounded-full p-1 text-text-secondary hover:bg-bg-secondary hover:text-text-primary dark:text-text-tertiary dark:hover:bg-white/5 min-h-12 min-w-12 justify-center"
                                    aria-label="Acciones"
                                    onClick={(e) => {
                                        setAnchorEl(e.currentTarget as HTMLElement);
                                        setOpenRowId((prev) =>
                                            prev === (i.institutionId ?? index) ? null : (i.institutionId ?? index)
                                        );
                                    }}
                                    aria-expanded={openRowId === (i.institutionId ?? index)}
                                >
                                    <ThreeDotsIcon className="icon-sm" />
                                </button>
                                <DropdownPortal
                                    isOpen={openRowId === (i.institutionId ?? index)}
                                    onClose={() => {
                                        setOpenRowId(null);
                                        setAnchorEl(null);
                                    }}
                                    anchorEl={anchorEl}
                                    className="min-w-44"
                                >
                                    {onView && (
                                        <DropdownItem
                                            onItemClick={() => onView(i)}
                                            variant="view"
                                        >
                                            <EyeIcon className="icon-md" /> Ver Detalles
                                        </DropdownItem>
                                    )}
                                    {onEdit && activeTab === "Activas" && (
                                        <DropdownItem
                                            onItemClick={() => onEdit(i)}
                                            variant="edit"
                                        >
                                            <EditIcon className="icon-md" /> Editar
                                        </DropdownItem>
                                    )}
                                    {onToggleStatus && (
                                        <DropdownItem
                                            onItemClick={() => onToggleStatus(i)}
                                            variant={activeTab === "Inactivas" ? "restore" : "delete"}
                                        >
                                            {activeTab === "Inactivas" ? <RefreshIcon className="icon-md" /> : <TrashIcon className="icon-md" />}
                                            {activeTab === "Inactivas" ? "Restaurar" : "Eliminar"}
                                        </DropdownItem>
                                    )}
                                </DropdownPortal>
                            </div>
                        </TableCell>
                    </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={7} className="p-0">
                        <EmptyState
                            title="No se encontraron instituciones"
                            description={rifFilter || nameFilter || practiceTypeFilter || careerFilter
                                ? "Intenta ajustar los filtros para encontrar lo que buscas."
                                : "Aún no hay instituciones registradas en esta categoría."}
                        />
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Vista Móvil (Cards) */}
      <div className="md:hidden divide-y divide-border-light dark:divide-white/5">
        {paged.length > 0 ? (
            paged.map((i, index) => {
                const rowId = i.institutionId ?? `idx-${index}`;
                const isExpanded = expandedRows.has(rowId);
                return (
                    <div key={rowId} className="relative p-4 bg-white dark:bg-transparent transition-colors overflow-hidden">
                        <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center justify-between w-full">
                                <div className="flex-1 text-center">
                                    <h3 className="text-sm font-bold text-text-primary dark:text-white/90 leading-tight truncate px-8">
                                        {i.name}
                                    </h3>
                                    <p className="text-xs text-text-secondary mt-1 truncate">{i.rif}</p>
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
                            <div className="mt-4 space-y-6 animate-fadeIn border-t border-border-light dark:border-white/5 pt-6">
                                <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-center">
                                    <div className="flex flex-col items-center">
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary dark:text-text-secondary mb-1.5">Tipo Práctica</p>
                                        <div className="flex justify-center w-full">
                                            <Badge color={i.practiceType === "HOSPITALARIA" ? "error" : i.practiceType === "COMUNITARIA" ? "warning" : "success"} variant="light" size="sm">
                                                {i.practiceType}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary dark:text-text-secondary mb-1.5">Teléfono</p>
                                        <p className="text-sm text-text-primary dark:text-text-tertiary font-medium">{i.phone}</p>
                                    </div>
                                    <div className="col-span-2 flex flex-col items-center">
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary dark:text-text-secondary mb-1.5">Carrera</p>
                                        <p className="text-sm text-text-primary dark:text-text-tertiary font-medium truncate w-full max-w-62.5">{i.careerName}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 pt-2">
                                    {onView && (
                                        <button
                                            onClick={() => onView(i)}
                                            className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold bg-bg-secondary dark:bg-white/5 text-text-primary dark:text-text-tertiary rounded-xl min-h-12 active:scale-95 transition-all border border-transparent hover:border-border-light dark:hover:border-white/10"
                                        >
                                            <EyeIcon className="w-4 h-4" /> Ver
                                        </button>
                                    )}
                                    {onEdit && activeTab === "Activas" && (
                                        <button
                                            onClick={() => onEdit(i)}
                                            className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold bg-bg-secondary dark:bg-white/5 text-text-primary dark:text-text-tertiary rounded-xl min-h-12 active:scale-95 transition-all border border-transparent hover:border-border-light dark:hover:border-white/10"
                                        >
                                            <EditIcon className="w-4 h-4" /> Editar
                                        </button>
                                    )}
                                    {onToggleStatus && (
                                        <button
                                            onClick={() => onToggleStatus(i)}
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
            <EmptyState
                title="No se encontraron instituciones"
                description={rifFilter || nameFilter || practiceTypeFilter || careerFilter
                    ? "Intenta ajustar los filtros para encontrar lo que buscas."
                    : "Aún no hay instituciones registradas en esta categoría."}
            />
        )}
      </div>

      <div className="p-4 border-t border-border-light dark:border-white/5">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          totalItems={filteredData.length}
        />
      </div>
    </div>
  );
}
