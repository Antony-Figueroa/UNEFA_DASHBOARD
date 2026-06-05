/**
 * @file InternshipTypeTable.tsx
 * @description Componente de tabla especializado para mostrar y gestionar tipos de práctica profesional.
 * Implementa una interfaz de datos densa con funcionalidades de:
 * - Ordenamiento por nombre y prioridad.
 * - Paginación configurable.
 * - Selección múltiple para acciones en bloque (eliminación/restauración).
 * - Verificación de integridad referencial (no permite eliminar tipos vinculados a carreras).
 * - Buscador integrado.
 * - Estados de error de conexión a DB.
 * 
 * @module features/internship-types/components
 */

import { useMemo, useState, useEffect } from "react";
import { useDbStatus } from "../../../context/db-status";
import { Table, TableBody, TableCell, TableHeader, TableRow, Pagination } from "../../../components/ui/table";
import { AsyncActionButton } from "../../../components/common/AsyncActionButton";
import Button from "../../../components/ui/button/Button";
import AsyncButton from "../../../components/ui/button/AsyncButton";
import { EditIcon, TrashIcon, RefreshIcon, EyeIcon } from "../../../icons/actions";
import { InternshipType } from "../types";
import { Career } from "../../careers/types";
import Checkbox from "../../../components/form/input/Checkbox";
import Badge from "../../../components/ui/badge/Badge";
import { Tooltip } from "../../../components/ui/tooltip/Tooltip";
import { matchSearch } from "../../../utils/searchNormalizer";

/**
 * Propiedades del componente InternshipTypeTable.
 */
interface InternshipTypeTableProps {
  /** Datos de los tipos de práctica a mostrar */
  data: InternshipType[];
  /** Lista de carreras para validar si un tipo puede ser eliminado */
  careers?: Career[];
  /** Estado de la petición de datos (loading, success, error) */
  status: "loading" | "success" | "error";
  /** Error capturado durante la petición, si existe */
  error: Error | null;
  /** Callback para iniciar la edición de un registro */
  onEdit?: (item: InternshipType) => void;
  /** Callback para cambiar el estado de activo a inactivo y viceversa */
  onToggleStatus?: (id: number) => void;
  /** Callback para abrir la vista de detalles */
  onView?: (item: InternshipType) => void;
  /** Callback para eliminar múltiples registros seleccionados */
  onBulkDelete?: (ids: number[]) => void;
  /** Callback para restaurar múltiples registros seleccionados */
  onBulkRestore?: (ids: number[]) => void;
  /** Indica si la tabla está en modo visualización de inactivos */
  inactiveMode?: boolean;
  /** Nombre de la pestaña activa para control de lógica interna */
  activeTab?: "Activas" | "Inactivas";
  /** Estado global de carga */
  loading?: boolean;
}

/** Claves permitidas para el ordenamiento de la tabla */
type SortKey = keyof Pick<InternshipType, "name" | "priority">;
/** Dirección del ordenamiento */
type SortOrder = "asc" | "desc";

/**
 * Componente InternshipTypeTable.
 * 
 * Renderiza una tabla interactiva con todas las operaciones de gestión para los tipos de práctica.
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
   * Mapea el valor numérico de prioridad a su etiqueta descriptiva.
   */
  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 0: return "Único";
      case 1: return "Hospitalaria";
      case 2: return "Comunitaria";
      default: return String(priority);
    }
  };

  /**
   * Verifica si un tipo de práctica está vinculado a alguna carrera activa.
   * Se usa para bloquear la eliminación y mantener la integridad de la base de datos.
   */
  const hasLinkedCareers = (typeId: number) => {
    return careers.some(c => c.internshipTypeIds?.includes(String(typeId)));
  };

  /**
   * Limpia la selección de filas al cambiar entre las pestañas de Activas/Inactivas.
   */
  useEffect(() => {
    setSelectedIds([]);
  }, [activeTab]);

  /**
   * Procesa los datos aplicando filtros de búsqueda, estado y ordenamiento.
   */
  const filteredData = useMemo(() => {
    const filtered = data.filter((item) => {
      const matchesSearch = matchSearch(String(item.name ?? ""), searchTerm);
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

  /**
   * Renderiza un estado de error amigable si falla la conexión con la DB.
   */
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
      {/* Barra de herramientas: Búsqueda y Acciones en bloque */}
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
            {inactiveMode ? (
              <AsyncButton variant="success" size="sm" onClick={() => onBulkRestore?.(selectedIds)}>
                Restaurar
              </AsyncButton>
            ) : (
              <Button variant="error" size="sm" onClick={() => onBulkDelete?.(selectedIds)}>
                Eliminar
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-border-light bg-white dark:border-white/5 dark:bg-bg-dark shadow-sm">
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
                <TableCell className="cursor-pointer hover:text-brand-500 transition-colors" onClick={() => toggleSort("name")}>
                  <div className="flex items-center gap-1">
                    Nombre {sortConfig.key === "name" && (sortConfig.order === "asc" ? "↑" : "↓")}
                  </div>
                </TableCell>
                <TableCell className="cursor-pointer hover:text-brand-500 transition-colors" onClick={() => toggleSort("priority")}>
                  <div className="flex items-center gap-1">
                    Prioridad {sortConfig.key === "priority" && (sortConfig.order === "asc" ? "↑" : "↓")}
                  </div>
                </TableCell>
                <TableCell>Estado</TableCell>
                <TableCell className="text-right">Acciones</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-text-secondary dark:text-text-tertiary">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <svg className="w-8 h-8 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      No se encontraron tipos de práctica profesional
                    </div>
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
                      <Badge color="info" variant="light" className="font-bold">
                        {item.priority} - {getPriorityLabel(item.priority)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge color={item.status ? "success" : "error"}>
                        {item.status ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <AsyncActionButton
                          onClick={() => onView?.(item)}
                          icon={<EyeIcon />}
                          tooltip="Ver Detalles"
                          variant="primary"
                        />
                        {activeTab === "Activas" && (
                          <AsyncActionButton
                            onClick={() => onEdit?.(item)}
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
                                onClick={() => {}}
                                icon={<TrashIcon />}
                                tooltip="Bloqueado: Uso en carreras"
                                variant="error"
                              />
                            </div>
                          </Tooltip>
                        ) : (
                          <AsyncActionButton
                            onClick={() => onToggleStatus?.(item.id)}
                            icon={inactiveMode ? <RefreshIcon /> : <TrashIcon />}
                            tooltip={inactiveMode ? "Restaurar" : "Eliminar"}
                            variant={inactiveMode ? "success" : "error"}
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
        
        <div className="border-t border-border-light p-4 dark:border-white/5 bg-bg-secondary/10">
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
