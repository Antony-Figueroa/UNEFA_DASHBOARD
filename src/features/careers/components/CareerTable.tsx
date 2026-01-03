import { useMemo, useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow, Pagination } from "../../../components/ui/table";
import { DropdownPortal } from "../../../components/ui/dropdown/DropdownPortal";
import { DropdownItem } from "../../../components/ui/dropdown/DropdownItem";
import { EditIcon, TrashIcon, RefreshIcon, EyeIcon, ThreeDotsIcon, ChevronDownIcon, ChevronUpIcon } from "../../../icons/actions";
import { CareerRowData } from "../types";
import Checkbox from "../../../components/form/input/Checkbox";
import Badge from "../../../components/ui/badge/Badge";

const getCareerColor = (careerName: string): "primary" | "success" | "error" | "warning" | "info" => {
  const colors: ("primary" | "success" | "error" | "warning" | "info")[] = ["primary", "success", "error", "warning", "info"];
  let hash = 0;
  for (let i = 0; i < careerName.length; i++) {
    hash = careerName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

interface CareerTableProps {
  data: CareerRowData[];
  status: "loading" | "success" | "error";
  error: Error | null;
  onEdit?: (career: CareerRowData) => void;
  onDelete?: (careerId: string) => void;
  onToggleStatus?: (careerId: string) => void;
  onView?: (career: CareerRowData) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkRestore?: (ids: string[]) => void;
  inactiveMode?: boolean;
  activeTab?: "Activas" | "Inactivas";
  loading?: boolean;
}

type SortKey = "careerCode" | "careerName" | "minimumGrade" | "careerAbbreviation";
type SortOrder = "asc" | "desc";

const formatDecimal = (n: number) => n.toFixed(2);

export default function CareerTable({
  data = [],
  status,
  error,
  onEdit,
  onDelete,
  onToggleStatus,
  onView,
  onBulkDelete,
  onBulkRestore,
  inactiveMode = false,
  activeTab = "Activas",
  // loading = false,
}: CareerTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [practiceTypeFilter, setPracticeTypeFilter] = useState<string>("Todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [openRowId, setOpenRowId] = useState<string | number | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Estados para selección y ordenamiento
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: SortOrder }>({
    key: "careerName",
    order: "asc",
  });

  // Resetear selección cuando cambia la pestaña o los datos filtrados
  useEffect(() => {
    setSelectedIds([]);
  }, [activeTab]);

  const filteredData = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    const filtered = data.filter((c) => {
      const name = String(c.careerName ?? "").toLowerCase();
      const code = String(c.careerCode ?? "").toLowerCase();
      const matchesSearch = name.includes(search) || code.includes(search);
      const matchesType =
        practiceTypeFilter === "Todos" ||
        (Array.isArray(c.internshipTypeIds) &&
          c.internshipTypeIds
            .map((t) => String(t).toUpperCase())
            .includes(String(practiceTypeFilter).toUpperCase()));
      const matchesTab = activeTab === "Activas" ? c.status === true : c.status === false;
      return matchesSearch && matchesType && matchesTab;
    });

    // Aplicar ordenamiento
    filtered.sort((a, b) => {
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];

      if (typeof valA === "number" && typeof valB === "number") {
        return sortConfig.order === "asc" ? valA - valB : valB - valA;
      }

      const strA = String(valA ?? "").toLowerCase();
      const strB = String(valB ?? "").toLowerCase();

      if (strA < strB) return sortConfig.order === "asc" ? -1 : 1;
      if (strA > strB) return sortConfig.order === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [data, searchTerm, practiceTypeFilter, activeTab, sortConfig]);

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
      const allIds = paged.map((c) => c.careerId).filter(Boolean) as string[];
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
      const allIds = paged.map((c, index) => c.careerId ?? `idx-${index}`);
      setExpandedRows(new Set(allIds));
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setPracticeTypeFilter("Todos");
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
        <p className="font-semibold">Error al cargar carreras</p>
        <p className="text-sm">{error?.message || "Por favor, intente de nuevo más tarde."}</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      {/* Cabecera reorganizada: filtros y búsqueda */}
      <div className="p-4 border-b border-gray-100 dark:border-white/5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-4 w-full sm:flex-row sm:items-center">
          <div className="relative max-w-xs w-full">
            <input
              type="text"
              placeholder="Buscar por nombre o código"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-transparent py-2 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </span>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <select
              aria-label="Filtrar por tipo de práctica"
              value={practiceTypeFilter}
              onChange={(e) => setPracticeTypeFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-transparent py-2 px-4 text-sm text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="Todos" className="dark:bg-gray-800">Todos los tipos</option>
              <option value="HOSPITALARIA" className="dark:bg-gray-800">Hospitalaria</option>
              <option value="COMUNITARIA" className="dark:bg-gray-800">Comunitaria</option>
              <option value="ORDINARIA" className="dark:bg-gray-800">Ordinaria</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
          {(searchTerm || practiceTypeFilter !== "Todos") && (
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

            {/* Acciones Masivas */}
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 animate-fadeIn">
                <span className="hidden sm:inline text-sm font-medium text-gray-600 dark:text-gray-400 mr-2">
                  {selectedIds.length} seleccionados
                </span>
                {activeTab === "Activas" ? (
                  <button
                    onClick={() => onBulkDelete?.(selectedIds)}
                    className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 dark:bg-red-400/10 dark:text-red-400 dark:hover:bg-red-400/20 transition-colors min-h-12"
                  >
                    <TrashIcon className="icon-sm" />
                    Eliminar
                  </button>
                ) : (
                  <button
                    onClick={() => onBulkRestore?.(selectedIds)}
                    className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-600 hover:bg-brand-100 dark:bg-brand-400/10 dark:text-brand-400 dark:hover:bg-brand-400/20 transition-colors min-h-12"
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
                  ariaLabel="Seleccionar todos los elementos de la página actual"
                />
              </TableCell>
              <TableCell
                isHeader
                className="table-header-cell cursor-pointer group"
                onClick={() => handleSort("careerCode")}
              >
                <div className="flex items-center">
                  Código
                  <SortIndicator column="careerCode" />
                </div>
              </TableCell>
              <TableCell
                isHeader
                className="table-header-cell cursor-pointer group"
                onClick={() => handleSort("careerName")}
              >
                <div className="flex items-center">
                  Carrera
                  <SortIndicator column="careerName" />
                </div>
              </TableCell>
              <TableCell
                isHeader
                className="table-header-cell cursor-pointer group"
                onClick={() => handleSort("minimumGrade")}
              >
                <div className="flex items-center">
                  Nota mínima
                  <SortIndicator column="minimumGrade" />
                </div>
              </TableCell>
              <TableCell
                isHeader
                className="table-header-cell cursor-pointer group"
                onClick={() => handleSort("careerAbbreviation")}
              >
                <div className="flex items-center">
                  Abreviatura
                  <SortIndicator column="careerAbbreviation" />
                </div>
              </TableCell>
              <TableCell isHeader className="table-header-cell text-right">Acciones</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
            {paged.length > 0 ? (
              paged.map((c, idx) => (
                <TableRow
                  key={c.careerId ?? `${c.careerCode}-${c.careerAbbreviation}-${idx}`}
                  className={`table-row-hover hover:bg-gray-50 dark:hover:bg-white/2 odd:bg-gray-50/50 dark:odd:bg-white/1 ${selectedIds.includes(c.careerId) ? "bg-brand-50/30 dark:bg-brand-500/5" : ""}`}
                >
                  <TableCell className="table-cell">
                    <Checkbox
                      checked={selectedIds.includes(c.careerId)}
                      onChange={(checked) => handleSelectRow(c.careerId, checked)}
                      ariaLabel={`Seleccionar carrera ${c.careerName}`}
                    />
                  </TableCell>
                  <TableCell className="table-cell font-medium text-gray-800 dark:text-white/90">{c.careerCode}</TableCell>
                  <TableCell className="table-cell">
                    <Badge color={getCareerColor(c.careerName)} variant="light" size="sm">
                      {c.careerName}
                    </Badge>
                  </TableCell>
                  <TableCell className="table-cell text-gray-500 dark:text-gray-400">{formatDecimal(Number(c.minimumGrade))}</TableCell>
                  <TableCell className="table-cell text-gray-500 dark:text-gray-400">{c.careerAbbreviation}</TableCell>
                  <TableCell className="table-cell text-right relative">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="dropdown-toggle inline-flex items-center rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 min-h-12 min-w-12 justify-center"
                        aria-label="Acciones"
                        onClick={(e) => {
                          setAnchorEl(e.currentTarget as HTMLElement);
                          setOpenRowId((prev) =>
                            prev === (c.careerId ?? idx) ? null : (c.careerId ?? idx)
                          );
                        }}
                        aria-expanded={openRowId === (c.careerId ?? idx)}

                      >
                        <ThreeDotsIcon className="icon-sm" />
                      </button>

                      <DropdownPortal
                        isOpen={openRowId === (c.careerId ?? idx)}
                        onClose={() => setOpenRowId(null)}
                        anchorRef={{ current: anchorEl as HTMLElement }}
                        className="min-w-44"
                      >
                        {onEdit && activeTab === "Activas" && (
                          <DropdownItem
                            onItemClick={() => onEdit(c)}
                            className="flex items-center gap-2 text-gray-700 hover:bg-gray-50 dark:text-gray-300"
                          >
                            <EditIcon className="icon-sm" /> Editar
                          </DropdownItem>
                        )}
                        {onToggleStatus && (inactiveMode || c.status === false) && (
                          <DropdownItem
                            onItemClick={() => onToggleStatus(c.careerId)}
                            className="flex items-center gap-2 text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-400/10"
                          >
                            <RefreshIcon className="icon-sm" />
                            {inactiveMode ? "Restaurar" : "Activar"}
                          </DropdownItem>
                        )}
                        {onView && (
                          <DropdownItem
                            onItemClick={() => onView(c)}
                            className="flex items-center gap-2 text-gray-700 hover:bg-gray-50 dark:text-gray-300"
                          >
                            <EyeIcon className="icon-sm" /> Ver
                          </DropdownItem>
                        )}
                        {onDelete && activeTab === "Activas" && (
                          <DropdownItem
                            onItemClick={() => onDelete(c.careerId)}
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
                <TableCell className="table-cell py-20 text-center text-gray-500" colSpan={7}>
                  {searchTerm || practiceTypeFilter !== "Todos"
                    ? "No se encontraron carreras con los filtros aplicados"
                    : "No hay carreras para mostrar."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Vista Móvil (Cards) */}
      <div className="md:hidden divide-y divide-gray-100 dark:divide-white/5">
        {paged.length > 0 ? (
          paged.map((c, idx) => {
            const rowId = c.careerId ?? `idx-${idx}`;
            const isExpanded = expandedRows.has(rowId);
            return (
              <div key={rowId} className="relative p-4 bg-white dark:bg-transparent transition-colors overflow-hidden">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex-1 text-center">
                      <h3 className="text-sm font-bold text-gray-800 dark:text-white/90 leading-tight truncate px-8 uppercase">
                        {c.careerName}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 truncate">{c.careerAbbreviation}</p>
                    </div>
                    <button
                      onClick={() => toggleRowExpansion(rowId)}
                      className="absolute right-2 top-2 p-2 text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 rounded-full min-h-12 min-w-12 flex items-center justify-center transition-transform duration-200"
                      style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                      aria-label={isExpanded ? "Contraer" : "Expandir"}
                    >
                      <ChevronDownIcon className="icon-sm" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 space-y-6 animate-fadeIn border-t border-gray-50 dark:border-white/5 pt-6">
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-center">
                      <div className="flex flex-col items-center">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 mb-1.5">Abreviatura</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{c.careerAbbreviation}</p>
                      </div>
                      <div className="flex flex-col items-center">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 mb-1.5">Código</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{c.careerCode}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                      {onView && (
                        <button
                          onClick={() => onView(c)}
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-xl min-h-12 active:scale-95 transition-all border border-transparent hover:border-gray-200 dark:hover:border-white/10"
                        >
                          <EyeIcon className="icon-sm" /> Ver
                        </button>
                      )}
                      {onEdit && activeTab === "Activas" && (
                        <button
                          onClick={() => onEdit(c)}
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-xl min-h-12 active:scale-95 transition-all border border-transparent hover:border-gray-200 dark:hover:border-white/10"
                        >
                          <EditIcon className="icon-sm" /> Editar
                        </button>
                      )}
                      {onToggleStatus && (
                        <button
                          onClick={() => onToggleStatus(c.careerId)}
                          className={`w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold rounded-xl min-h-12 active:scale-95 transition-all border border-transparent ${inactiveMode
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:border-emerald-200 dark:hover:border-emerald-500/20"
                            : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:border-red-200 dark:hover:border-red-500/20"
                            }`}
                        >
                          {inactiveMode ? (
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
          <div className="p-8 text-center text-gray-500 text-sm">
            No se encontraron carreras.
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