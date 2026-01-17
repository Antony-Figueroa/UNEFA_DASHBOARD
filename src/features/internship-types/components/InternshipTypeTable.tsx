import { useMemo, useState, useEffect } from "react";
import { useDbStatus } from "../../../context/db-status";
import { Table, TableBody, TableCell, TableHeader, TableRow, Pagination } from "../../../components/ui/table";
import { ActionButton } from "../../../components/common/ActionButton";
import { EditIcon, TrashIcon, RefreshIcon, EyeIcon } from "../../../icons/actions";
import { InternshipType } from "../types";
import { Career } from "../../careers/types";
import Checkbox from "../../../components/form/input/Checkbox";
import Badge from "../../../components/ui/badge/Badge";
import { Tooltip } from "../../../components/ui/tooltip/Tooltip";

interface InternshipTypeTableProps {
  data: InternshipType[];
  careers?: Career[];
  status: "loading" | "success" | "error";
  error: Error | null;
  onEdit?: (item: InternshipType) => void;
  onDelete?: (id: number) => void;
  onToggleStatus?: (id: number) => void;
  onView?: (item: InternshipType) => void;
  onBulkDelete?: (ids: number[]) => void;
  onBulkRestore?: (ids: number[]) => void;
  inactiveMode?: boolean;
  activeTab?: "Activas" | "Inactivas";
  loading?: boolean;
}

type SortKey = "NAME" | "PRIORITY";
type SortOrder = "asc" | "desc";

export default function InternshipTypeTable({
  data = [],
  careers = [],
  status,
  onEdit,
  // onDelete, // Eliminado porque no se usa
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
    key: "NAME",
    order: "asc",
  });

  // Función para verificar si un tipo de práctica está vinculado a alguna carrera
  const hasLinkedCareers = (typeId: number) => {
    return careers.some(c => c.internshipTypeIds?.includes(String(typeId)));
  };

  useEffect(() => {
    setSelectedIds([]);
  }, [activeTab]);

  const filteredData = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    const filtered = data.filter((item) => {
      const name = String(item.NAME ?? "").toLowerCase();
      const matchesSearch = name.includes(search);
      const matchesTab = activeTab === "Activas" 
        ? (item.STATUS === 1) 
        : (item.STATUS === 0);
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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paged.map((i) => i.INTERNSHIP_TYPE_ID));
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
              onClick={() => inactiveMode ? onBulkRestore?.(selectedIds) : onBulkDelete?.(selectedIds)}
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
                <TableCell className="cursor-pointer" onClick={() => setSortConfig({ key: "NAME", order: sortConfig.key === "NAME" && sortConfig.order === "asc" ? "desc" : "asc" })}>
                  Nombre {sortConfig.key === "NAME" && (sortConfig.order === "asc" ? "↑" : "↓")}
                </TableCell>
                <TableCell className="cursor-pointer" onClick={() => setSortConfig({ key: "PRIORITY", order: sortConfig.key === "PRIORITY" && sortConfig.order === "asc" ? "desc" : "asc" })}>
                  Prioridad {sortConfig.key === "PRIORITY" && (sortConfig.order === "asc" ? "↑" : "↓")}
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
                  <TableRow key={item.INTERNSHIP_TYPE_ID}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(item.INTERNSHIP_TYPE_ID)}
                        onChange={(checked) => handleSelectRow(item.INTERNSHIP_TYPE_ID, checked)}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-text-primary dark:text-white">
                      {item.NAME}
                    </TableCell>
                    <TableCell>
                      <Badge color="info">{item.PRIORITY}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge color={item.STATUS === 1 ? "success" : "error"}>
                        {item.STATUS === 1 ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <ActionButton
                          onClick={() => onView?.(item)}
                          icon={<EyeIcon />}
                          tooltip="Ver Detalles"
                          variant="primary"
                        />
                        {activeTab === "Activas" && (
                          <ActionButton
                            onClick={() => onEdit?.(item)}
                            icon={<EditIcon />}
                            tooltip="Editar"
                            variant="primary"
                          />
                        )}
                        {hasLinkedCareers(item.INTERNSHIP_TYPE_ID) && !inactiveMode ? (
                          <Tooltip content="No se puede eliminar porque tiene carreras afiliadas">
                            <div className="cursor-not-allowed opacity-50">
                              <ActionButton
                                disabled
                                onClick={() => {}}
                                icon={<TrashIcon />}
                                tooltip="No se puede eliminar porque tiene carreras afiliadas"
                                variant="danger"
                              />
                            </div>
                          </Tooltip>
                        ) : (
                          <ActionButton
                            onClick={() => onToggleStatus?.(item.INTERNSHIP_TYPE_ID)}
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
