/**
 * @file CareerTable.tsx
 * @description Componente de tabla especializado para mostrar y gestionar carreras.
 * Soporta ordenamiento, paginación, selección múltiple y acciones CRUD.
 * 
 * @module features/careers/components
 */

/**
 * @file CareerTable.tsx
 * @description Componente de tabla especializado para mostrar y gestionar carreras.
 * Implementa una interfaz de datos densa con funcionalidades de:
 * - Ordenamiento por múltiples columnas.
 * - Paginación configurable.
 * - Selección múltiple para acciones en bloque.
 * - Filtrado por tipo de práctica.
 * - Buscador integrado.
 * - Estados de carga y error visuales.
 */

import { useMemo, useState, useEffect } from "react";
import { useDbStatus } from "../../../context/db-status";
import { Table, TableBody, TableCell, TableHeader, TableRow, Pagination } from "../../../components/ui/table";
import { AsyncActionButton } from "../../../components/common/AsyncActionButton";
import { SelectionBar } from "../../../components/common/SelectionBar";
import { SearchInput } from "../../../components/common/SearchInput";
import { Tooltip } from "../../../components/ui/tooltip/Tooltip";
import Button from "../../../components/ui/button/Button";
import CustomSelect from "../../../components/form/CustomSelect";
import {
  EditIcon,
  TrashIcon,
  RefreshIcon,
  EyeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "../../../icons/actions";
import { CareerRowData } from "../types";
import { InternshipTypeOption } from "../../internship-types/types";
import { CrudStatus } from "../../../hooks/useCrud";
import { EmptyState } from "../../../components/ui/table/EmptyState";
import { toTitleCase } from "../../../utils/textFormat";
import Checkbox from "../../../components/form/input/Checkbox";
import Badge from "../../../components/ui/badge/Badge";
import CareerCards from "./CareerCards";

/**
 * Genera un color consistente basado en el nombre de la carrera para badges/iconos.
 * @param {string} careerName - Nombre de la carrera.
 * @returns {"primary" | "success" | "error" | "warning" | "info"} Variante de color.
 */
const getCareerColor = (careerName: string): "primary" | "success" | "error" | "warning" | "info" => {
  const colors: ("primary" | "success" | "error" | "warning" | "info")[] = ["primary", "success", "error", "warning", "info"];
  let hash = 0;
  for (let i = 0; i < careerName.length; i++) {
    hash = careerName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

/**
 * Propiedades del componente CareerTable.
 */
interface CareerTableProps {
  /** Datos de las carreras a mostrar */
  data: CareerRowData[];
  /** Estado de la carga de datos (idle, loading, error, success) */
  status: CrudStatus;
  /** Error capturado durante la carga */
  error: Error | null;
  /** Callback para iniciar la edición de una carrera */
  onEdit?: (career: CareerRowData) => void;
  /** Callback para eliminar (lógicamente) una carrera */
  onDelete?: (careerId: string | number) => void;
  /** Callback para activar/desactivar el estado de una carrera */
  onToggleStatus?: (careerId: string | number) => void;
  /** Callback para abrir la vista de detalles */
  onView?: (career: CareerRowData) => void;
  /** Callback para eliminación masiva de registros seleccionados */
  onBulkDelete?: (ids: (string | number)[]) => void;
  /** Callback para restauración masiva de registros seleccionados */
  onBulkRestore?: (ids: (string | number)[]) => void;
  /** Indica si se están mostrando datos del histórico (eliminados) */
  inactiveMode?: boolean;
  /** Pestaña activa en la que se encuentra la tabla */
  activeTab?: "Activas" | "Inactivas";
  /** Indica si hay una operación de acción (ej. guardado) en curso */
  loading?: boolean;
  /** Opciones de tipos de práctica para el filtro y visualización de badges */
  practiceOptions?: InternshipTypeOption[];
  /** Valor actual del buscador (proveniente del estado global del módulo) */
  searchTerm?: string;
  /** Función para notificar cambios en el buscador al componente padre */
  onSearchChange?: (term: string) => void;
  /** Callback que notifica si hay filas seleccionadas (para bloquear botonera externa) */
  onSelectionChange?: (selecting: boolean) => void;
}

/** Claves por las que se puede ordenar la tabla */
type SortKey = "careerCode" | "careerName" | "careerType" | "careerAbbreviation";
/** Dirección del ordenamiento */
type SortOrder = "asc" | "desc";

/**
 * Formatea un número a dos decimales.
 */
const formatDecimal = (n: number) => n.toFixed(2);

/**
 * Sub-componente interno para los botones de acción de cada fila.
 */
interface ActionButtonsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleStatus?: () => void;
  onView?: () => void;
  inactiveMode: boolean;
  activeTab: "Activas" | "Inactivas";
  isMobile?: boolean;
  isDisabled?: boolean;
  disabledTooltip?: string;
  disableAll?: boolean;
}

const ActionButtons = ({
  onEdit,
  onDelete,
  onToggleStatus,
  onView,
  inactiveMode,
  activeTab,
  isMobile = false,
  isDisabled = false,
  disabledTooltip = "",
  disableAll = false,
}: ActionButtonsProps) => {
  const containerClasses = isMobile 
    ? "flex flex-col gap-3 pt-2" 
    : "flex justify-end gap-3";

  return (
    <div className={containerClasses}>
      {onView && (
        <AsyncActionButton
          onClick={async (e) => { e.stopPropagation(); onView(); }}
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
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          icon={<EditIcon />}
          tooltip="Editar"
          label={isMobile ? "Editar Carrera" : undefined}
          variant="primary"
          fullWidth={isMobile}
          disabled={disableAll}
        />
      )}

      {onToggleStatus && (
        <AsyncActionButton
          onClick={(e) => { e.stopPropagation(); onToggleStatus(); }}
          icon={inactiveMode ? <RefreshIcon /> : <TrashIcon />}
          tooltip={isDisabled && !inactiveMode ? disabledTooltip : (inactiveMode ? "Restaurar" : "Eliminar")}
          label={isMobile ? (inactiveMode ? "Restaurar" : "Eliminar") : undefined}
          variant={inactiveMode ? "success" : "error"}
          fullWidth={isMobile}
          disabled={disableAll || (isDisabled && !inactiveMode)}
        />
      )}
      {onDelete && activeTab === "Activas" && !onToggleStatus && (
        <AsyncActionButton
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          icon={<TrashIcon />}
          tooltip={isDisabled ? disabledTooltip : "Eliminar Carrera"}
          label={isMobile ? "Eliminar Carrera" : undefined}
          variant="error"
          fullWidth={isMobile}
          disabled={disableAll || isDisabled}
        />
      )}
    </div>
  );
};

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
  searchTerm = "",
  onSearchChange,
  onSelectionChange,
}: CareerTableProps) {
  const [practiceTypeFilter, setPracticeTypeFilter] = useState<string>("");
  const [careerTypeFilter, setCareerTypeFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set());
  const { status: dbStatus } = useDbStatus();
const [inUseIds, setInUseIds] = useState<Set<string | number>>(new Set());

  useEffect(() => {
    const used = new Set<string | number>();
    data.forEach(c => {
      if (c.isInUse) used.add(c.careerId);
    });
    setInUseIds(used);
  }, [data]);

  // Estados para selección y ordenamiento
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: SortOrder }>({
    key: "careerName",
    order: "asc",
  });

  // Notificar a la página cuando hay selección activa (para bloquear botonera)
  useEffect(() => {
    onSelectionChange?.(selectedIds.length > 0);
  }, [selectedIds, onSelectionChange]);

  // Resetear selección cuando cambia la pestaña o los datos filtrados
  useEffect(() => {
    setSelectedIds([]);
  }, [activeTab]);

  const filteredData = useMemo(() => {
    const filtered = data.filter((c) => {
      // El filtrado por búsqueda y estado ya viene aplicado desde CareersPage/useCrud
      // Aquí solo filtramos por tipo de práctica si es necesario
      const matchesType =
        practiceTypeFilter === "" ||
        (Array.isArray(c.internshipTypeIds) &&
          c.internshipTypeIds
            .map((t) => String(t).toUpperCase())
            .includes(String(practiceTypeFilter).toUpperCase()));
      const matchesCareerType =
        careerTypeFilter === "" || c.careerType === careerTypeFilter;
      return matchesType && matchesCareerType;
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
  }, [data, practiceTypeFilter, careerTypeFilter, sortConfig]);

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
          {dbStatus === "disconnected" ? "La conexión con la base de datos se ha perdido" : "no hay conexión a la BD"}
        </p>
        <Button variant="error" onClick={() => window.location.reload()}>
          Reintentar conexión
        </Button>
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
      // Solo seleccionar IDs que no estén en uso
      const allIds = paged
        .filter((c) => !inUseIds.has(c.careerId))
        .map((c) => c.careerId)
        .filter(Boolean) as string[];
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string | number, checked: boolean) => {
    if (inUseIds.has(id)) return; // No permitir seleccionar si está en uso
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
    onSearchChange?.("");
    setPracticeTypeFilter("");
    setCareerTypeFilter("");
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
        {/* Toggle Vista */}
        <div className="flex items-center justify-between">
</div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SearchInput
            value={searchTerm}
            onChange={(v) => onSearchChange?.(v)}
            placeholder="Buscar por nombre o código de carrera"
            className="sm:!w-full"
          />
          <div className="relative">
            <CustomSelect
              options={[
                { value: "", label: "Todos los tipos" },
                ...practiceOptions.map((opt) => ({
                  value: String(opt.id),
                  label: opt.label,
                })),
              ]}
              value={practiceTypeFilter}
              onChange={setPracticeTypeFilter}
              placeholder="Tipos de Práctica"
              className="w-full h-11"
            />
          </div>
          <div className="relative">
            <CustomSelect
              options={[
                { value: "", label: "Todas" },
                { value: "CORTA", label: "Corta" },
                { value: "LARGA", label: "Larga" },
              ]}
              value={careerTypeFilter}
              onChange={setCareerTypeFilter}
              placeholder="Tipo de Carrera"
              className="w-full h-11"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border-light dark:border-border-dark">
          <div className="flex items-center gap-4">
            <div className="text-xs text-text-secondary dark:text-text-tertiary">
              Mostrando <span className="font-bold text-text-primary dark:text-text-emphasis">{filteredData.length}</span> resultados
            </div>
            {(searchTerm || practiceTypeFilter !== "" || careerTypeFilter !== "") && (
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
                {
                  label: "Eliminar",
                  variant: "error",
                  onClick: () => onBulkDelete?.(selectedIds),
                  disabled: selectedIds.some(id => inUseIds.has(id)),
                  tooltip: "Algunas de las carreras seleccionadas están en uso y no pueden ser eliminadas",
                },
              ] : [
                { label: "Restaurar", variant: "success", onClick: () => onBulkRestore?.(selectedIds) },
              ]}
            />
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
                  checked={
                    paged.length > 0 && 
                    paged.filter(c => !inUseIds.has(c.careerId)).length > 0 &&
                    paged.filter(c => !inUseIds.has(c.careerId)).every(c => selectedIds.includes(c.careerId))
                  }
                  onChange={handleSelectAll}
                  ariaLabel="Seleccionar todos los elementos de la página actual"
                />
              </TableCell>
              <TableCell
                isHeader
                className="table-header-cell cursor-pointer group"
                onClick={async () => handleSort("careerCode")}
              >
                <div className="flex items-center">
                  Código
                  <SortIndicator column="careerCode" />
                </div>
              </TableCell>
              <TableCell
                isHeader
                className="table-header-cell cursor-pointer group w-[180px]"
                onClick={async () => handleSort("careerName")}
              >
                <div className="flex items-center">
                  Carrera
                  <SortIndicator column="careerName" />
                </div>
              </TableCell>
              <TableCell
                isHeader
                className="table-header-cell cursor-pointer group"
                onClick={async () => handleSort("careerType")}
              >
                <div className="flex items-center">
                  Tipo Carrera
                  <SortIndicator column="careerType" />
                </div>
              </TableCell>
              <TableCell isHeader className="table-header-cell">Semestre</TableCell>
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
                    <Tooltip 
                      content={inUseIds.has(c.careerId) ? "Esta carrera está en uso y no puede ser seleccionada para eliminar" : ""}
                      isDisabled={!inUseIds.has(c.careerId)}
                    >
                      <div>
                        <Checkbox
                          checked={selectedIds.includes(c.careerId)}
                          onChange={(checked) => handleSelectRow(c.careerId, checked)}
                          disabled={inUseIds.has(c.careerId)}
                          ariaLabel={`Seleccionar carrera ${c.careerName}`}
                        />
                      </div>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="table-cell font-medium text-text-primary dark:text-text-emphasis">{c.careerCode}</TableCell>
                  <TableCell className="table-cell">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-text-primary dark:text-text-emphasis uppercase tracking-wide">{c.careerAbbreviation}</span>
                      <span className="text-[10px] text-text-tertiary truncate max-w-[140px]" title={toTitleCase(c.careerName)}>{toTitleCase(c.careerName)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="table-cell">
                    <Badge color={c.careerType === "CORTA" ? "warning" : "primary"} variant="light" size="sm">
                      {c.careerType === "CORTA" ? "Corta" : "Larga"}
                    </Badge>
                  </TableCell>
                  <TableCell className="table-cell">
                    <Badge color="primary" variant="light" size="sm">
                      {c.semester || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell className="table-cell">
                    <div className="flex flex-wrap gap-1">
                      {c.internshipTypeIds && c.internshipTypeIds.length > 0 ? (
                        c.internshipTypeIds.slice(0, 2).map((id, i) => {
                          const opt = practiceOptions.find(o => Number(o.id) === Number(id));
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
                    <ActionButtons
                      onView={onView ? () => onView(c) : undefined}
                      onEdit={onEdit ? () => onEdit(c) : undefined}
                      onToggleStatus={onToggleStatus ? () => onToggleStatus(c.careerId) : undefined}
                      onDelete={onDelete ? () => onDelete(c.careerId) : undefined}
                      inactiveMode={inactiveMode}
                      activeTab={activeTab}
                      isDisabled={inUseIds.has(c.careerId)}
                      disabledTooltip="Esta carrera está en uso y no puede ser eliminada"
                      disableAll={selectedIds.length > 0}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="table-cell py-24 text-center" colSpan={6}>
                  <EmptyState
                      title={
                        inactiveMode
                          ? "No hay carreras inactivas"
                          : searchTerm || practiceTypeFilter !== "" || careerTypeFilter !== ""
                          ? "No se encontraron carreras"
                          : "No hay carreras registradas"
                      }
                      description={
                        inactiveMode
                          ? "Las carreras inactivas aparecerán aquí después de ser desactivadas."
                          : searchTerm || practiceTypeFilter !== "" || careerTypeFilter !== ""
                          ? "Intenta ajustar los filtros para encontrar lo que buscas."
                          : "Comienza agregando una nueva."
                      }
                      action={
                        !inactiveMode && (searchTerm || practiceTypeFilter !== "" || careerTypeFilter !== "") ? (
                          <Button variant="ghost" onClick={() => { onSearchChange?.(""); setPracticeTypeFilter(""); setCareerTypeFilter(""); }}>
                            Ver todas las carreras
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
                      <div className="flex justify-center mb-2">
                        <Badge color={getCareerColor(c.careerName)} variant="light" size="sm" shape="rounded">
                          {c.careerAbbreviation}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold mb-0.5">{c.careerAbbreviation}</p>
                      <h3 className="text-sm font-bold text-text-primary dark:text-text-emphasis leading-tight truncate px-12">
                        {toTitleCase(c.careerName)}
                      </h3>
                      <div className="flex items-center justify-center gap-4 mt-2">
                        <div className="text-[11px] text-text-secondary dark:text-text-tertiary">
                          <span className="block font-medium uppercase tracking-wider opacity-60">Código</span>
                          {c.careerCode}
                        </div>
                        <div className="text-[11px] text-text-secondary dark:text-text-tertiary">
                          <span className="block font-medium uppercase tracking-wider opacity-60">Tipo</span>
                          {toTitleCase(c.careerType) || "-"}
                        </div>
                      </div>
                    </div>
                    <div className="absolute right-2 top-2">
                      <button
                        onClick={async () => toggleRowExpansion(rowId)}
                        className="p-2 text-text-tertiary hover:bg-bg-secondary dark:hover:bg-white/5 rounded-full min-h-12 min-w-12 flex items-center justify-center transition-transform duration-200"
                        style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                        aria-label={isExpanded ? "Contraer" : "Expandir"}
                      >
                        <ChevronDownIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-border-light dark:border-border-dark animate-fadeIn">
                    <div className="space-y-6">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-bg-secondary dark:bg-white/5 p-3 rounded-xl text-center">
                          <p className="text-[9px] text-text-tertiary uppercase font-bold mb-1">Tipo Carrera</p>
                          <Badge size="sm" color={c.careerType === "CORTA" ? "warning" : "primary"} variant="light">
                            {c.careerType === "CORTA" ? "Corta" : "Larga"}
                          </Badge>
                        </div>
                        <div className="bg-bg-secondary dark:bg-white/5 p-3 rounded-xl text-center">
                          <p className="text-[9px] text-text-tertiary uppercase font-bold mb-1">Semestre</p>
                          <p className="text-xs font-bold dark:text-text-tertiary">{c.semester || "-"}</p>
                        </div>
                        <div className="bg-bg-secondary dark:bg-white/5 p-3 rounded-xl text-center">
                          <p className="text-[9px] text-text-tertiary uppercase font-bold mb-1">Estado</p>
                          <Badge 
                            size="sm" 
                            color={c.status ? "success" : "error"} 
                            variant="light"
                          >
                            {c.status ? "Activa" : "Inactiva"}
                          </Badge>
                        </div>
                      </div>

                      <div className="bg-bg-secondary dark:bg-white/5 p-4 rounded-xl">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary dark:text-text-tertiary mb-3 text-center">Tipos de Prácticas</p>
                        <div className="flex flex-wrap justify-center gap-2">
                          {c.internshipTypeIds && c.internshipTypeIds.length > 0 ? (
                            c.internshipTypeIds.map((id, i) => {
                              const opt = practiceOptions.find(o => String(o.id) === String(id));
                              return (
                                <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-brand-50 text-brand-600 border border-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:border-brand-500/20 uppercase tracking-wide">
                                  {opt ? opt.label : id}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-[10px] text-text-tertiary italic">Ninguno</span>
                          )}
                        </div>
                      </div>

                      <ActionButtons
                        onView={onView ? () => onView(c) : undefined}
                        onEdit={onEdit ? () => onEdit(c) : undefined}
                        onToggleStatus={onToggleStatus ? () => onToggleStatus(c.careerId) : undefined}
                        onDelete={onDelete ? () => onDelete(c.careerId) : undefined}
                        inactiveMode={inactiveMode}
                        activeTab={activeTab}
                        isMobile={true}
                        isDisabled={inUseIds.has(c.careerId)}
                        disabledTooltip="Esta carrera está en uso y no puede ser eliminada"
                        disableAll={selectedIds.length > 0}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <EmptyState
              title={
                inactiveMode
                  ? "No hay carreras inactivas"
                  : searchTerm || practiceTypeFilter !== "" || careerTypeFilter !== ""
                  ? "No se encontraron carreras"
                  : "No hay carreras registradas"
              }
              description={
                inactiveMode
                  ? "Las carreras inactivas aparecerán aquí después de ser desactivadas."
                  : searchTerm || practiceTypeFilter !== "" || careerTypeFilter !== ""
                  ? "Intenta ajustar los filtros para encontrar lo que buscas."
                  : "Comienza agregando una nueva."
              }
              action={
                !inactiveMode && (searchTerm || practiceTypeFilter !== "" || careerTypeFilter !== "") ? (
                  <Button variant="ghost" onClick={() => { onSearchChange?.(""); setPracticeTypeFilter(""); setCareerTypeFilter(""); }}>
                    Ver todas las carreras
                  </Button>
                ) : undefined
              }
          />
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
