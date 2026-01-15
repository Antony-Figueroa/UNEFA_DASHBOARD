import { useMemo, useState, useEffect } from "react";
import { useDbStatus } from "../../../context/db-status";
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
  onDelete?: (careerId: string | number) => void;
  onToggleStatus?: (careerId: string | number) => void;
  onView?: (career: CareerRowData) => void;
  onBulkDelete?: (ids: (string | number)[]) => void;
  onBulkRestore?: (ids: (string | number)[]) => void;
  inactiveMode?: boolean;
  activeTab?: "Activas" | "Inactivas";
  loading?: boolean;
  practiceOptions?: { value: string; label: string }[];
}

type SortKey = "careerCode" | "careerName" | "minimumGrade" | "careerAbbreviation";
type SortOrder = "asc" | "desc";

const formatDecimal = (n: number) => n.toFixed(2);

export default function CareerTable({
  data = [],
  status,
  onEdit,
  onDelete,
  onToggleStatus,
  onView,
  onBulkDelete,
  onBulkRestore,
  inactiveMode = false,
  activeTab = "Activas",
  practiceOptions = [],
}: CareerTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [practiceTypeFilter, setPracticeTypeFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [openRowId, setOpenRowId] = useState<string | number | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set());
  const { status: dbStatus } = useDbStatus();

  // Estados para selección y ordenamiento
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
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
        practiceTypeFilter === "" ||
        (Array.isArray(c.internshipTypeIds) &&
          c.internshipTypeIds
            .map((t) => String(t).toUpperCase())
            .includes(String(practiceTypeFilter).toUpperCase()));
      const matchesTab = activeTab === "Activas" 
        ? (c.status === true || c.status === 1) 
        : (c.status === false || c.status === 0);
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

  if (status === "error" || dbStatus === "disconnected") {
    return (
      <div className="rounded-xl border border-alert-error-border bg-alert-error-bg p-8 text-center dark:border-error-800 dark:bg-error-950 animate-fadeIn">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error-100 dark:bg-error-900/30">
          <svg className="h-6 w-6 text-error-600 dark:text-error-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-alert-error-text dark:text-error-400">Error de conexión</h3>
        <p className="mt-2 text-text-secondary dark:text-text-tertiary font-medium">
          {dbStatus === "disconnected" ? "La conexión con la base de datos se ha perdido" : "no hay conexion a la bd"}
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-6 px-4 py-2 bg-error-600 text-white rounded-lg hover:bg-error-700 transition-colors text-sm font-medium"
        >
          Reintentar conexión
        </button>
      </div>
    );
  }

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

  const handleSelectRow = (id: string | number, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  };

  const toggleRowExpansion = (id: string | number) => {
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
    setPracticeTypeFilter("");
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
      {/* Indicador de conexión a BD */}
      {/* <div className="px-4 py-2 border-b border-border-light dark:border-border-dark flex justify-end items-center gap-2 bg-gray-50/50 dark:bg-gray-900/20">
        <span className="text-xs font-medium text-text-tertiary">Estado de BD:</span>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white dark:bg-bg-dark border border-border-light dark:border-border-dark shadow-sm">
          <span className={`h-2 w-2 rounded-full ${
            (dbStatus as string) === "connected" ? "bg-success-500 animate-pulse" : 
            (dbStatus as string) === "disconnected" ? "bg-error-500" : "bg-warning-500"
          }`} />
          <span className={`text-[10px] font-bold uppercase tracking-wider ${
            (dbStatus as string) === "connected" ? "text-success-600 dark:text-success-400" : 
            (dbStatus as string) === "disconnected" ? "text-error-600 dark:text-error-400" : "text-warning-600 dark:text-warning-400"
          }`}>
            {(dbStatus as string) === "connected" ? "Conectado" : 
             (dbStatus as string) === "disconnected" ? "No conectado" : "Verificando..."}
          </span>
        </div>
      </div> */}

      {/* Cabecera reorganizada: filtros y búsqueda */}
      <div className="p-4 border-b border-border-light dark:border-border-dark space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por nombre o código"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 rounded-lg border border-border-medium bg-transparent pl-10 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:border-brand-500 focus:outline-none dark:border-border-dark dark:bg-bg-dark dark:text-text-emphasis dark:placeholder:text-text-tertiary"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </span>
          </div>
          <div className="relative">
            <select
              aria-label="Filtrar por tipo de práctica"
              value={practiceTypeFilter}
              onChange={(e) => setPracticeTypeFilter(e.target.value)}
              className="w-full h-11 rounded-lg border border-border-medium bg-transparent pl-3 pr-10 text-sm text-text-primary focus:border-brand-500 focus:outline-none dark:border-border-dark dark:bg-bg-dark dark:text-text-emphasis appearance-none"
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
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border-light dark:border-border-dark">
          <div className="flex items-center gap-4">
            <div className="text-xs text-text-secondary dark:text-text-tertiary">
              Mostrando <span className="font-bold text-text-primary dark:text-text-emphasis">{filteredData.length}</span> resultados
            </div>
            {(searchTerm || practiceTypeFilter !== "") && (
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

            {/* Acciones Masivas */}
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
              <TableCell isHeader className="table-header-cell">Tipos de Prácticas</TableCell>
              <TableCell isHeader className="table-header-cell text-right">&nbsp;</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border-light dark:divide-border-dark">
            {paged.length > 0 ? (
              paged.map((c, idx) => (
                <TableRow
                  key={c.careerId ?? `${c.careerCode}-${c.careerAbbreviation}-${idx}`}
                  className={`table-row-hover hover:bg-bg-secondary dark:hover:bg-white/2 odd:bg-bg-secondary/50 dark:odd:bg-white/1 ${selectedIds.includes(c.careerId) ? "bg-brand-50/30 dark:bg-brand-500/5" : ""}`}
                >
                  <TableCell className="table-cell">
                    <Checkbox
                      checked={selectedIds.includes(c.careerId)}
                      onChange={(checked) => handleSelectRow(c.careerId, checked)}
                      ariaLabel={`Seleccionar carrera ${c.careerName}`}
                    />
                  </TableCell>
                  <TableCell className="table-cell font-medium text-text-primary dark:text-text-emphasis">{c.careerCode}</TableCell>
                  <TableCell className="table-cell">
                    <Badge color={getCareerColor(c.careerName)} variant="light" size="sm" shape="rounded">
                      {c.careerName}
                    </Badge>
                  </TableCell>
                  <TableCell className="table-cell text-text-secondary dark:text-text-tertiary">{formatDecimal(Number(c.minimumGrade))}</TableCell>
                  <TableCell className="table-cell text-text-secondary dark:text-text-tertiary">{c.careerAbbreviation}</TableCell>
                  <TableCell className="table-cell">
                    <div className="flex flex-wrap gap-1">
                      {c.internshipTypeIds && c.internshipTypeIds.length > 0 ? (
                        c.internshipTypeIds.slice(0, 2).map((id, i) => {
                          const opt = practiceOptions.find(o => String(o.value) === String(id));
                          return (
                            <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-brand-50 text-brand-600 border border-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:border-brand-500/20">
                              {opt ? opt.label : id}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-[10px] text-text-tertiary italic">Ninguno</span>
                      )}
                      {c.internshipTypeIds && c.internshipTypeIds.length > 2 && (
                        <span className="text-[10px] text-text-tertiary">+{c.internshipTypeIds.length - 2}</span>
                      )}
                    </div>
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
                            prev === (c.careerId ?? idx) ? null : (c.careerId ?? idx)
                          );
                        }}
                        aria-expanded={openRowId === (c.careerId ?? idx)}

                      >
                        <ThreeDotsIcon className="icon-sm" />
                      </button>

                      <DropdownPortal
                        isOpen={openRowId === (c.careerId ?? idx)}
                        onClose={() => {
                          setOpenRowId(null);
                          setAnchorEl(null);
                        }}
                        anchorEl={anchorEl}
                        className="min-w-44"
                      >
                        {onView && (
                          <DropdownItem
                            onItemClick={() => onView(c)}
                            variant="view"
                          >
                            <EyeIcon className="icon-md" /> Ver Detalles
                          </DropdownItem>
                        )}

                        {onEdit && activeTab === "Activas" && (
                          <DropdownItem
                            onItemClick={() => onEdit(c)}
                            variant="edit"
                          >
                            <EditIcon className="icon-md" /> Editar
                          </DropdownItem>
                        )}
                        {onToggleStatus && (inactiveMode || c.status === false) && (
                          <DropdownItem
                            onItemClick={() => onToggleStatus(c.careerId)}
                            variant="restore"
                          >
                            <RefreshIcon className="icon-md" />
                            {inactiveMode ? "Restaurar" : "Activar"}
                          </DropdownItem>
                        )}
                        {onDelete && activeTab === "Activas" && (
                          <DropdownItem
                            onItemClick={() => onDelete(c.careerId)}
                            variant="delete"
                          >
                            <TrashIcon className="icon-md" /> Eliminar
                          </DropdownItem>
                        )}
                      </DropdownPortal>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="table-cell py-24 text-center" colSpan={7}>
                  <div className="flex flex-col items-center justify-center animate-fadeIn">
                    <div className="mb-4 rounded-full bg-bg-secondary p-4 dark:bg-white/5">
                      <svg className="h-8 w-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-bold text-text-primary dark:text-text-emphasis">No se encontraron carreras</h3>
                    <p className="mt-1 text-xs text-text-secondary dark:text-text-tertiary">Intenta ajustar los filtros para encontrar lo que buscas.</p>
                    {(searchTerm || practiceTypeFilter !== "") && (
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          setPracticeTypeFilter("");
                        }}
                        className="mt-4 text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                      >
                        Ver todas las carreras
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
          paged.map((c, idx) => {
            const rowId = c.careerId ?? `idx-${idx}`;
            const isExpanded = expandedRows.has(rowId);
            return (
              <div key={rowId} className="relative p-4 bg-white dark:bg-transparent transition-colors overflow-hidden">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex-1 text-center">
                      <h3 className="text-sm font-bold text-text-primary dark:text-text-emphasis leading-tight truncate px-8 uppercase">
                        {c.careerName}
                      </h3>
                      <p className="text-xs text-text-secondary mt-1 truncate">{c.careerAbbreviation}</p>
                    </div>
                    <button
                      onClick={() => toggleRowExpansion(rowId)}
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
                        <p className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary dark:text-text-tertiary mb-1.5">Abreviatura</p>
                        <p className="text-sm text-text-primary dark:text-text-emphasis font-medium">{c.careerAbbreviation}</p>
                      </div>
                      <div className="flex flex-col items-center">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary dark:text-text-tertiary mb-1.5">Código</p>
                        <p className="text-sm text-text-primary dark:text-text-emphasis font-medium">{c.careerCode}</p>
                      </div>
                      <div className="flex flex-col items-center col-span-2">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary dark:text-text-tertiary mb-1.5">Tipos de Prácticas</p>
                        <div className="flex flex-wrap justify-center gap-1">
                          {c.internshipTypeIds && c.internshipTypeIds.length > 0 ? (
                            c.internshipTypeIds.map((id, i) => {
                              const opt = practiceOptions.find(o => String(o.value) === String(id));
                              return (
                                <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-brand-50 text-brand-600 border border-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:border-brand-500/20">
                                  {opt ? opt.label : id}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-[10px] text-text-tertiary italic">Ninguno</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                      {onView && (
                        <button
                          onClick={() => onView(c)}
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold bg-bg-secondary dark:bg-white/5 text-text-primary dark:text-text-emphasis rounded-xl min-h-12 active:scale-95 transition-all border border-transparent hover:border-border-medium dark:hover:border-white/10"
                        >
                          <EyeIcon className="icon-sm" /> Ver
                        </button>
                      )}
                      {onEdit && activeTab === "Activas" && (
                        <button
                          onClick={() => onEdit(c)}
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold bg-bg-secondary dark:bg-white/5 text-text-primary dark:text-text-emphasis rounded-xl min-h-12 active:scale-95 transition-all border border-transparent hover:border-border-medium dark:hover:border-white/10"
                        >
                          <EditIcon className="icon-sm" /> Editar
                        </button>
                      )}
                      {onToggleStatus && (
                        <button
                          onClick={() => {
                            if (!inactiveMode && onDelete) {
                              onDelete(c.careerId);
                            } else {
                              onToggleStatus(c.careerId);
                            }
                          }}
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
                      {onDelete && activeTab === "Activas" && !onToggleStatus && (
                        <button
                          onClick={() => onDelete(c.careerId)}
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl min-h-12 active:scale-95 transition-all border border-transparent hover:border-red-200 dark:hover:border-red-500/20"
                        >
                          <TrashIcon className="icon-sm" /> Eliminar
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-text-primary dark:text-text-emphasis">No se encontraron carreras</h3>
            <p className="mt-1 text-xs text-text-secondary dark:text-text-tertiary max-w-50 mx-auto">Intenta ajustar los filtros para encontrar lo que buscas.</p>
            {(searchTerm || practiceTypeFilter !== "") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setPracticeTypeFilter("");
                }}
                className="mt-4 text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400"
              >
                Ver todas las carreras
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