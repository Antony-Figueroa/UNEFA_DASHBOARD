/**
 * @file InternshipTypeTable.tsx
 * @description Componente de tabla para visualizar y gestionar tipos de pasantía.
 * Soporta filtrado, ordenamiento, paginación y acciones masivas.
 * 
 * @module features/internship-types/components
 */

import { useMemo, useState, useEffect } from "react";
import { useDbStatus } from "../../../context/db-status";
import { Table, TableBody, TableCell, TableHeader, TableRow, Pagination } from "../../../components/ui/table";
import { AsyncActionButton } from "../../../components/common/AsyncActionButton";
import { EditIcon, TrashIcon, RefreshIcon, EyeIcon } from "../../../icons/actions";
import { InternshipType } from "../types";
import { Career } from "../../careers/types";
import Checkbox from "../../../components/form/input/Checkbox";
import Badge from "../../../components/ui/badge/Badge";
import { Tooltip } from "../../../components/ui/tooltip/Tooltip";

interface InternshipTypeTableProps {
  /** Lista de tipos de pasantía a mostrar */
  data: InternshipType[];
  /** Lista de carreras para verificar vinculaciones */
  careers?: Career[];
  /** Estado de carga de los datos */
  status: "loading" | "success" | "error";
  /** Error en caso de falla en la carga */
  error: Error | null;
  /** Callback al editar un elemento */
  onEdit?: (item: InternshipType) => void;
  /** Callback al cambiar el estado de un elemento (eliminar/restaurar) */
  onToggleStatus?: (id: number) => void;
  /** Callback al ver detalles de un elemento */
  onView?: (item: InternshipType) => void;
  /** Callback para eliminación masiva */
  onBulkDelete?: (ids: number[]) => void;
  /** Callback para restauración masiva */
  onBulkRestore?: (ids: number[]) => void;
  /** Indica si se está mostrando la vista de elementos inactivos */
  inactiveMode?: boolean;
  /** Pestaña activa actual */
  activeTab?: "Activas" | "Inactivas";
  /** Estado de carga general */
  loading?: boolean;
}

/** Claves por las que se puede ordenar la tabla */
type SortKey = keyof Pick<InternshipType, "name" | "priority">;
/** Dirección del ordenamiento */
type SortOrder = "asc" | "desc";

/**
 * Componente de presentación para la tabla de Tipos de Pasantía.
 */
export default function InternshipTypeTable({
  data = [],
  careers = [],
  status,
  onEdit,
  onToggleStatus,
  onView,
  onBulkDelete,
  onBulkRestore,
  inactiveMode = false,
  activeTab = "Activas",
}: InternshipTypeTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const { status: dbStatus } = useDbStatus();

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: SortOrder }>({
    key: "name",
    order: "asc",
  });

  /**
   * Verifica si un tipo de pasantía está vinculado a alguna carrera.
   * @param {number} typeId - ID del tipo de pasantía.
   * @returns {boolean} True si está vinculado.
   */
  const hasLinkedCareers = (typeId: number) => {
    return careers.some(c => c.internshipTypeIds?.includes(String(typeId)));
  };

  // Limpiar selección al cambiar de pestaña
  useEffect(() => {
    setSelectedIds([]);
  }, [activeTab]);

  /**
   * Datos filtrados y ordenados basados en el estado actual.
   */
  const filteredData = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    const filtered = data.filter((item) => {
      const name = String(item.name ?? "").toLowerCase();
      const matchesSearch = name.includes(search);
      const matchesTab = activeTab === "Activas" ? item.status : !item.status;
      return matchesSearch && matchesTab;
    });

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
  }, [data, searchTerm, activeTab, sortConfig]);

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
          {dbStatus === "disconnected" ? "La conexión con la base de datos se ha perdido" : "No hay conexión a la base de datos"}
        </p>
        <button 
          onClick={async () => window.location.reload()}
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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paged.map((i) => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  };

  const toggleSort = (key: SortKey) => {
    setSortConfig(prev => ({
      key,
      order: prev.key === key && prev.order === "asc" ? "desc" : "asc"
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Buscar tipo de práctica..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-border-light bg-white py-2 pl-4 pr-10 text-sm outline-none transition-all focus:border-brand-500 dark:border-white/10 dark:bg-bg-dark dark:text-white"
          />
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 animate-fadeIn">
            <span className="text-sm text-text-secondary dark:text-text-tertiary">
              {selectedIds.length} seleccionados
            </span>
            <button
              onClick={async () => inactiveMode ? onBulkRestore?.(selectedIds) : onBulkDelete?.(selectedIds)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                inactiveMode 
                  ? "bg-success-50 text-success-600 hover:bg-success-100 dark:bg-success-900/20 dark:text-success-400" 
                  : "bg-error-50 text-error-600 hover:bg-error-100 dark:bg-error-900/20 dark:text-error-400"
              }`}
            >
              {inactiveMode ? <RefreshIcon className="h-4 w-4" /> : <TrashIcon className="h-4 w-4" />}
              {inactiveMode ? "Restaurar" : "Eliminar"}
            </button>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-border-light bg-white dark:border-white/5 dark:bg-bg-dark">
        <div className="max-w-full overflow-x-auto table-scrollbar">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell className="w-10">
                  <Checkbox
                    checked={paged.length > 0 && selectedIds.length === paged.length}
                    onChange={(checked) => handleSelectAll(checked)}
                  />
                </TableCell>
                <TableCell className="cursor-pointer" onClick={async () => toggleSort("name")}>
                  Nombre {sortConfig.key === "name" && (sortConfig.order === "asc" ? "↑" : "↓")}
                </TableCell>
                <TableCell className="cursor-pointer" onClick={async () => toggleSort("priority")}>
                  Prioridad {sortConfig.key === "priority" && (sortConfig.order === "asc" ? "↑" : "↓")}
                </TableCell>
                <TableCell>Estado</TableCell>
                <TableCell className="text-right"> </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-text-secondary dark:text-text-tertiary">
                    No se encontraron resultados
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(item.id)}
                        onChange={(checked) => handleSelectRow(item.id, checked)}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-text-primary dark:text-white">
                      {item.name}
                    </TableCell>
                    <TableCell>
                      <Badge color="info">{item.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge color={item.status ? "success" : "error"}>
                        {item.status ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <AsyncActionButton
                          onClick={async () => onView?.(item)}
                          icon={<EyeIcon />}
                          tooltip="Ver Detalles"
                          variant="primary"
                        />
                        {activeTab === "Activas" && (
                          <AsyncActionButton
                            onClick={async () => onEdit?.(item)}
                            icon={<EditIcon />}
                            tooltip="Editar"
                            variant="primary"
                          />
                        )}
                        {hasLinkedCareers(item.id) && !inactiveMode ? (
                          <Tooltip content="No se puede eliminar porque tiene carreras afiliadas">
                            <div className="cursor-not-allowed opacity-50">
                              <AsyncActionButton
                                disabled
                                onClick={async () => {}}
                                icon={<TrashIcon />}
                                tooltip="No se puede eliminar porque tiene carreras afiliadas"
                                variant="danger"
                              />
                            </div>
                          </Tooltip>
                        ) : (
                          <AsyncActionButton
                            onClick={async () => onToggleStatus?.(item.id)}
                            icon={inactiveMode ? <RefreshIcon /> : <TrashIcon />}
                            tooltip={inactiveMode ? "Restaurar" : "Eliminar"}
                            variant={inactiveMode ? "success" : "danger"}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        <div className="border-t border-border-light p-4 dark:border-white/5">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
            totalItems={filteredData.length}
          />
        </div>
      </div>
    </div>
  );
}
