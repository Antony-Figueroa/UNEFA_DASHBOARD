/**
 * @file InstitutionTable.tsx
 * @description Tabla para visualizar instituciones con soporte para filtros, ordenamiento y paginación.
 */

import { useMemo, useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow, Pagination } from "../../../components/ui/table";
import { AsyncActionButton } from "../../../components/common/AsyncActionButton";
import { SelectionBar } from "../../../components/common/SelectionBar";
import { SearchInput } from "../../../components/common/SearchInput";
import Button from "../../../components/ui/button/Button";
import { EmptyState } from "../../../components/ui/table/EmptyState";
import { EditIcon, TrashIcon, RefreshIcon, EyeIcon, ChevronDownIcon, ChevronUpIcon } from "../../../icons/actions";
import { Institution } from "../types";
import Checkbox from "../../../components/form/input/Checkbox";
import { Tooltip } from "../../../components/ui/tooltip/Tooltip";
import { useDebounce } from "../../../hooks/useDebounce";
import { formatPhoneDisplay } from "../../../utils/inputFormat";
import { toTitleCase } from "../../../utils/textFormat";
import { matchSearch } from "../../../utils/searchNormalizer";

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface InstitutionTableProps {
  data: Institution[];
  status: "loading" | "success" | "error";
  onEdit?: (inst: Institution) => void;
  onToggleStatus?: (inst: Institution) => void;
  onView?: (inst: Institution) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkRestore?: (ids: string[]) => void;
  activeTab?: "Activas" | "Inactivas";
  institutionTypeOptions?: { value: string; label: string }[];
  /** Paginación server-side — si se provee, reemplaza la paginación local */
  pagination?: PaginationInfo;
  /** Callback para cambiar de página (requerido si se usa paginación server-side) */
  onPageChange?: (page: number) => void;
}

type SortKey = "rif" | "name";
type SortOrder = "asc" | "desc";

interface ActionButtonsProps {
    onEdit?: () => void;
    onToggleStatus?: () => void;
    onView?: () => void;
    activeTab: "Activas" | "Inactivas";
    isMobile?: boolean;
    isInUse?: boolean;
    disableAll?: boolean;
}

const ActionButtons = ({
    onEdit,
    onToggleStatus,
    onView,
    activeTab,
    isMobile = false,
    isInUse = false,
    disableAll = false,
}: ActionButtonsProps) => {
    const containerClasses = isMobile 
        ? "flex flex-col gap-3 pt-2" 
        : "flex justify-end gap-3";

    return (
        <div className={containerClasses}>
            {onView && (
                <AsyncActionButton
                    onClick={async () => onView()}
                    icon={<EyeIcon />}
                    tooltip="Ver Detalles"
                    label={isMobile ? "Ver Detalles" : undefined}
                    variant="primary"
                    fullWidth={isMobile}
                    disabled={disableAll}
                />
            )}
            {onEdit && activeTab === "Activas" && (
                <AsyncActionButton
                    onClick={async () => onEdit && onEdit()}
                    icon={<EditIcon />}
                    tooltip="Editar"
                    label={isMobile ? "Editar Empresa o Institución" : undefined}
                    variant="primary"
                    fullWidth={isMobile}
                    disabled={disableAll}
                />
            )}
            {onToggleStatus && (
                <AsyncActionButton
                    onClick={async () => {
                        if (isInUse && activeTab === "Activas") return;
                        onToggleStatus();
                    }}
                    icon={activeTab === "Inactivas" ? <RefreshIcon /> : <TrashIcon />}
                    tooltip={activeTab === "Inactivas" ? "Restaurar" : (isInUse ? "Esta empresa o institución está en uso y no se puede eliminar" : "Eliminar")}
                    label={isMobile ? (activeTab === "Inactivas" ? "Restaurar Empresa o Institución" : "Eliminar Empresa o Institución") : undefined}
                    variant={activeTab === "Inactivas" ? "success" : "error"}
                    fullWidth={isMobile}
                    disabled={disableAll || (isInUse && activeTab === "Activas")}
                />
            )}
        </div>
    );
};

export default function InstitutionTable({
  data = [],
  status,
  onEdit,
  onToggleStatus,
  onView,
  onBulkDelete,
  onBulkRestore,
  activeTab = "Activas",
  institutionTypeOptions = [],
  pagination,
  onPageChange,
}: InstitutionTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [institutionTypeFilter, setInstitutionTypeFilter] = useState("");

  // Paginación local (fallback cuando no se usa server-side pagination)
  const [localPage, setLocalPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: SortOrder }>({
    key: "name",
    order: "asc",
  });

  const debouncedSearch = useDebounce(searchTerm, 300);

  useEffect(() => {
    setSelectedIds([]);
  }, [activeTab]);

  const filteredData = useMemo(() => {
    const search = debouncedSearch.trim().toLowerCase();
    const institutionTypeSearch = institutionTypeFilter;

    const filtered = data.filter((i) => {
      const matchesSearch = !search || matchSearch(i.rif, search) || matchSearch(i.name, search) || matchSearch(i.phone || "", search);
      const matchesInstitutionType = !institutionTypeSearch || i.institutionType === institutionTypeSearch;
      
      const matchesTab = activeTab === "Activas" ? i.status : !i.status;
      
      return matchesSearch && matchesInstitutionType && matchesTab;
    });

    filtered.sort((a, b) => {
      const valA = String(a[sortConfig.key] || "").toLowerCase();
      const valB = String(b[sortConfig.key] || "").toLowerCase();
      
      if (valA < valB) return sortConfig.order === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.order === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [
    data, 
    debouncedSearch, 
    institutionTypeFilter,
    activeTab, 
    sortConfig
  ]);

  useEffect(() => {
    setLocalPage(1);
  }, [
    debouncedSearch, 
    institutionTypeFilter,
    activeTab
  ]);

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

  // Usar paginación server-side si está disponible, pero siempre aplicar filtros locales
  const isServerSide = !!pagination && !!onPageChange;
  const currentPage = isServerSide ? pagination.page : localPage;
  const totalPages = Math.max(1, Math.ceil(filteredData.length / (isServerSide ? pagination.limit : itemsPerPage)));
  const paged = filteredData.slice((currentPage - 1) * (isServerSide ? pagination.limit : itemsPerPage), currentPage * (isServerSide ? pagination.limit : itemsPerPage));

  const handleSort = (key: SortKey) => {
    setSortConfig(prev => ({
      key,
      order: prev.key === key && prev.order === "asc" ? "desc" : "asc"
    }));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const deletableIds = paged
        .filter(i => !i.isInUse)
        .map(i => i.institutionId);
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
          const allIds = paged.map((s, index) => s.institutionId ?? `idx-${index}`);
          setExpandedRows(new Set(allIds));
      }
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
      return <div className="p-8 text-center text-text-secondary">Cargando empresas o instituciones...</div>;
  }

  return (
    <div className="table-container">
      <div className="p-4 border-b border-border-light dark:border-white/5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar por RIF, nombre o teléfono"
              className="h-11"
            />

            {/* Filtro por Carrera */}
            {/* Filtro por Tipo de Institución */}
            <div className="relative">
                <select
                    value={institutionTypeFilter}
                    onChange={(e) => setInstitutionTypeFilter(e.target.value)}
                    className="w-full h-11 rounded-lg border border-border-medium bg-transparent pl-3 pr-10 text-sm text-text-primary focus:border-brand-500 focus:outline-none dark:border-border-dark dark:bg-bg-dark dark:text-white/90 appearance-none"
                >
                    <option value="" className="dark:bg-bg-dark">Todos los Tipos</option>
                    {institutionTypeOptions.map((opt) => (
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
            </div>

            <div className="flex items-center gap-2">
                {paged.length > 0 && (
                    <Button variant="ghost" size="sm" className="md:hidden" onClick={toggleAllRows}>
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
                    </Button>
                )}

                <SelectionBar
                  count={selectedIds.length}
                  actions={activeTab === "Activas" ? [
                    { label: "Eliminar", variant: "error", onClick: () => onBulkDelete?.(selectedIds) },
                  ] : [
                    { label: "Restaurar", variant: "success", onClick: () => onBulkRestore?.(selectedIds) },
                  ]}
                />
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
                  checked={
                    paged.length > 0 && 
                    paged.filter(i => !i.isInUse).length > 0 &&
                    paged.filter(i => !i.isInUse).every(i => selectedIds.includes(i.institutionId))
                  }
                  onChange={handleSelectAll}
                  ariaLabel="Seleccionar todas las empresas o instituciones"
                />
              </TableCell>
              <TableCell isHeader className="cursor-pointer group" onClick={async () => handleSort("rif")}>
                  <div className="flex items-center">RIF <SortIndicator column="rif" /></div>
              </TableCell>
              <TableCell isHeader className="cursor-pointer group" onClick={async () => handleSort("name")}>
                  <div className="flex items-center">Nombre <SortIndicator column="name" /></div>
              </TableCell>
              <TableCell isHeader>Teléfono</TableCell>
              <TableCell isHeader>Carrera</TableCell>
              <TableCell isHeader>Tipo de Práctica</TableCell>
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
                            <Tooltip
                                content={i.isInUse ? "Esta empresa o institución está en uso y no puede ser seleccionada para eliminar" : ""}
                                isDisabled={!i.isInUse}
                            >
                                <div>
                                    <Checkbox
                                        checked={selectedIds.includes(i.institutionId)}
                                        onChange={(checked) => handleSelectRow(i.institutionId, checked)}
                                        disabled={i.isInUse}
                                    />
                                </div>
                            </Tooltip>
                        </TableCell>
                        <TableCell className="font-medium text-text-primary dark:text-white/90">
                            {i.rif}
                        </TableCell>
                        <TableCell className="text-text-secondary dark:text-text-tertiary font-semibold">{toTitleCase(i.name)}</TableCell>
                        <TableCell className="text-text-secondary dark:text-text-tertiary whitespace-nowrap">{formatPhoneDisplay(i.phone)}</TableCell>
                        <TableCell className="text-text-secondary dark:text-text-tertiary text-xs">
                          {(i.careerNames && i.careerNames.length > 0)
                            ? i.careerNames.map(toTitleCase).join(", ")
                            : "-"}
                        </TableCell>
                        <TableCell className="text-text-secondary dark:text-text-tertiary text-xs">
                                          {(i.practiceTypes ? i.practiceTypes.map(toTitleCase).join(", ") : (i.practiceType ? toTitleCase(i.practiceType) : "-"))}
                        </TableCell>
                        <TableCell className="table-cell text-right">
                            <ActionButtons
                                onView={onView ? () => onView(i) : undefined}
                                onEdit={onEdit ? () => onEdit(i) : undefined}
                                onToggleStatus={onToggleStatus ? () => onToggleStatus(i) : undefined}
                                activeTab={activeTab}
                                isInUse={i.isInUse}
                                disableAll={selectedIds.length > 0}
                            />
                        </TableCell>
                    </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={8} className="p-0">
                        <EmptyState
                            title="No se encontraron empresas o instituciones"
                            description={searchTerm
                                ? "Intenta ajustar los filtros para encontrar lo que buscas."
                                : "Aún no hay empresas o instituciones registradas en esta categoría."}
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
                                        {toTitleCase(i.name)}
                                    </h3>
                                    <p className="text-xs text-text-secondary mt-1 truncate">{i.rif}</p>
                                </div>
                                <button
                                    onClick={async () => toggleRowExpansion(rowId)}
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
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary dark:text-text-secondary mb-1.5">Teléfono</p>
                                        <p className="text-sm text-text-primary dark:text-text-tertiary font-medium">{formatPhoneDisplay(i.phone)}</p>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary dark:text-text-secondary mb-1.5">Tipo</p>
                                        <p className="text-sm text-text-primary dark:text-text-tertiary font-medium">{toTitleCase(i.institutionType) || "-"}</p>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary dark:text-text-secondary mb-1.5">Carrera</p>
                                        <p className="text-sm text-text-primary dark:text-text-tertiary font-medium text-center">
                                          {(i.careerNames && i.careerNames.length > 0)
                                            ? i.careerNames.map(toTitleCase).join(", ")
                                            : "-"}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary dark:text-text-secondary mb-1.5">Tipo de Práctica</p>
                                        <p className="text-sm text-text-primary dark:text-text-tertiary font-medium text-center">
                          {(i.practiceTypes ? i.practiceTypes.map(toTitleCase).join(", ") : (i.practiceType ? toTitleCase(i.practiceType) : "-"))}
                                        </p>
                                    </div>
                                </div>

                                <ActionButtons
                                    onView={onView ? () => onView(i) : undefined}
                                    onEdit={onEdit ? () => onEdit(i) : undefined}
                                    onToggleStatus={onToggleStatus ? () => onToggleStatus(i) : undefined}
                                    activeTab={activeTab}
                                    isMobile={true}
                                    isInUse={i.isInUse}
                                    disableAll={selectedIds.length > 0}
                                />
                            </div>
                        )}
                    </div>
                );
            })
        ) : (
            <EmptyState
                title="No se encontraron empresas o instituciones"
                description={searchTerm
                    ? "Intenta ajustar los filtros para encontrar lo que buscas."
                    : "Aún no hay empresas o instituciones registradas en esta categoría."}
            />
        )}
      </div>

      {isServerSide && pagination.total === 0 ? null : (
        <div className="p-4 border-t border-border-light dark:border-white/5">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={isServerSide ? onPageChange : setLocalPage}
            itemsPerPage={isServerSide ? pagination.limit : itemsPerPage}
            onItemsPerPageChange={isServerSide ? undefined : (n: number) => setItemsPerPage(n)}
            totalItems={isServerSide ? pagination.total : filteredData.length}
          />
        </div>
      )}
    </div>
  );
}
