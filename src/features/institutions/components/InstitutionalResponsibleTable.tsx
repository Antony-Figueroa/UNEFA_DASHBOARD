/**
 * @file InstitutionalResponsibleTable.tsx
 * @description Tabla para listar responsables institucionales con filtros y acciones.
 */

import React, { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  Pagination,
} from "../../../components/ui/table";
import { EmptyState } from "../../../components/ui/table/EmptyState";
import { TableSkeleton } from "../../../components/ui/table/TableSkeleton";
import {
  ChevronDownIcon,
  EditIcon,
  TrashIcon,
  RefreshIcon,
  ThreeDotsIcon,
  EyeIcon,
} from "../../../icons/actions";
import { InstitutionalResponsibleRowData } from "../types";
import Badge from "../../../components/ui/badge/Badge";
import { DropdownPortal } from "../../../components/ui/dropdown/DropdownPortal";
import { DropdownItem } from "../../../components/ui/dropdown/DropdownItem";
import Button from "../../../components/ui/button/Button";
import { useDebounce } from "../../../hooks/useDebounce";
import Checkbox from "../../../components/form/input/Checkbox";

interface InstitutionalResponsibleTableProps {
  data: InstitutionalResponsibleRowData[];
  activeTab: "Activas" | "Inactivas";
  onEdit?: (resp: InstitutionalResponsibleRowData) => void;
  onView?: (resp: InstitutionalResponsibleRowData) => void;
  onToggleStatus?: (resp: InstitutionalResponsibleRowData) => void;
  onBulkAction?: (ids: string[], action: "inactivate" | "restore") => void;
  isLoading?: boolean;
}

export default function InstitutionalResponsibleTable({
  data,
  activeTab,
  onEdit,
  onView,
  onToggleStatus,
  onBulkAction,
  isLoading = false,
}: InstitutionalResponsibleTableProps) {
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Limpiar selección al cambiar de pestaña
  useEffect(() => {
    setSelectedIds(new Set());
  }, [activeTab]);

  // Filtros
  const [filters, setFilters] = useState({
    search: "",
    institution: "all",
  });

  const debouncedSearch = useDebounce(filters.search, 300);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesTab = activeTab === "Activas" ? item.status : !item.status;
      const matchesSearch =
        debouncedSearch === "" ||
        `${item.identificationPrefix}${item.identificationNumber}`.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        `${item.firstName} ${item.lastName}`.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        item.email.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesInstitution = filters.institution === "all" || item.institutionId === filters.institution;

      return matchesTab && matchesSearch && matchesInstitution;
    });
  }, [data, activeTab, debouncedSearch, filters.institution]);

  const institutionOptions = useMemo(() => {
    const uniqueInstitutions = Array.from(new Set(data.map(i => i.institutionId)))
      .map(id => {
        const inst = data.find(item => item.institutionId === id);
        return { value: id, label: inst?.institutionName || "Desconocida" };
      });
    return [{ value: "all", label: "Todas las Instituciones" }, ...uniqueInstitutions];
  }, [data]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedRows(newExpanded);
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(currentData.map((i) => i.responsibleId)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) newSelected.add(id);
    else newSelected.delete(id);
    setSelectedIds(newSelected);
  };

  const handleActionClick = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget as HTMLElement);
    setOpenRowId(id);
  };

  if (isLoading) {
    return <TableSkeleton rows={5} columns={7} />;
  }

  return (
    <div className="table-container">
      <div className="p-4 border-b border-gray-100 dark:border-white/5 space-y-4">
        {/* Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Cédula, nombre o correo..."
              defaultValue={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              className="w-full h-11 rounded-lg border border-gray-300 bg-transparent pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </span>
          </div>
          <div className="relative">
            <select
              value={filters.institution}
              onChange={(e) => setFilters((prev) => ({ ...prev, institution: e.target.value }))}
              className="w-full h-11 rounded-lg border border-gray-300 bg-transparent pl-3 pr-10 text-sm text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white appearance-none"
            >
              {institutionOptions.map((opt) => (
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
          
          {/* Espaciadores para mantener el grid de 4 columnas si es necesario, 
              o podemos poner el botón de limpiar aquí */}
          <div className="flex items-center">
            {(filters.search || filters.institution !== "all") && (
              <button
                onClick={() => setFilters({ search: "", institution: "all" })}
                className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1 transition-colors"
              >
                <RefreshIcon className="icon-xs" />
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="flex items-center justify-end">
            {selectedIds.size > 0 && onBulkAction && (
              <div className="flex items-center gap-2 animate-fadeIn">
                <span className="hidden sm:inline text-xs font-medium text-gray-600 dark:text-gray-400 mr-2">
                  {selectedIds.size} seleccionados
                </span>
                <Button
                  variant={activeTab === "Activas" ? "outline" : "primary"}
                  size="sm"
                  className="min-h-12"
                  onClick={() => {
                    onBulkAction(Array.from(selectedIds), activeTab === "Activas" ? "inactivate" : "restore");
                    setSelectedIds(new Set());
                  }}
                >
                  {activeTab === "Activas" ? (
                    <span className="flex items-center gap-2">
                      <TrashIcon className="icon-sm" /> Eliminar
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <RefreshIcon className="icon-sm" /> Restaurar
                    </span>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-white/5">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Mostrando <span className="font-bold text-gray-700 dark:text-white">{filteredData.length}</span> resultados
          </div>
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block max-w-full overflow-x-auto table-scrollbar">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell isHeader className="w-10">
                <Checkbox
                  checked={selectedIds.size === currentData.length && currentData.length > 0}
                  onChange={toggleSelectAll}
                  ariaLabel="Seleccionar todos"
                />
              </TableCell>
              <TableCell isHeader>CÉDULA</TableCell>
              <TableCell isHeader>NOMBRES</TableCell>
              <TableCell isHeader>APELLIDOS</TableCell>
              <TableCell isHeader>TELÉFONO</TableCell>
              <TableCell isHeader>CORREO</TableCell>
              <TableCell isHeader className="text-center">INSTITUCIÓN</TableCell>
              <TableCell isHeader className="text-right">ACCIONES</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.length > 0 ? (
              currentData.map((item, index) => (
                <TableRow
                  key={item.responsibleId}
                  className={`${index % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-gray-50/50 dark:bg-white/2"} ${selectedIds.has(item.responsibleId) ? "bg-brand-50/30 dark:bg-brand-500/5" : ""}`}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(item.responsibleId)}
                      onChange={(checked) => toggleSelectOne(item.responsibleId, checked)}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-gray-800 dark:text-white/90">
                    {item.identificationPrefix}{item.identificationNumber}
                  </TableCell>
                  <TableCell className="text-gray-600 dark:text-gray-400 font-semibold">
                    {item.firstName} {item.middleName}
                  </TableCell>
                  <TableCell className="text-gray-600 dark:text-gray-400 font-semibold">
                    {item.lastName} {item.secondLastName}
                  </TableCell>
                  <TableCell className="text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {item.phone}
                  </TableCell>
                  <TableCell className="text-gray-500 dark:text-gray-400">
                    {item.email}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge color="primary" variant="light" size="sm" shape="rounded">
                      {item.institutionName}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right relative">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="dropdown-toggle inline-flex items-center rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 min-h-12 min-w-12 justify-center"
                        aria-label="Acciones"
                        onClick={(e) => handleActionClick(e, item.responsibleId)}
                      >
                        <ThreeDotsIcon className="icon-sm" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="p-0">
                  <EmptyState
                    title="No se encontraron responsables"
                    description={filters.search || filters.institution !== "all"
                      ? "Intenta ajustar los filtros para encontrar lo que buscas."
                      : "Aún no hay responsables registrados en esta categoría."}
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden divide-y divide-gray-100 dark:divide-white/5">
        {currentData.length > 0 ? (
          currentData.map((item) => {
            const rowId = item.responsibleId;
            const isExpanded = expandedRows.has(rowId);

            return (
              <div
                key={rowId}
                className="relative p-4 bg-white dark:bg-transparent transition-colors overflow-hidden"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex-1 text-center">
                      <h3 className="text-sm font-bold text-gray-800 dark:text-white/90 leading-tight truncate px-8">
                        {item.firstName} {item.lastName}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {item.identificationPrefix}{item.identificationNumber}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleRow(rowId)}
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
                      <div className="col-span-2 flex flex-col items-center">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 mb-1.5">
                          Institución
                        </p>
                        <div className="flex justify-center w-full">
                          <Badge color="primary" variant="light" size="sm">
                            {item.institutionName}
                          </Badge>
                        </div>
                      </div>
                      <div className="col-span-2 flex flex-col items-center">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 mb-1.5">
                          Correo
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium truncate w-full max-w-62.5">
                          {item.email}
                        </p>
                      </div>
                      <div className="col-span-2 flex flex-col items-center">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 mb-1.5">
                          Teléfono
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                          {item.phone}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                      {onView && (
                        <button
                          onClick={() => onView(item)}
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-xl min-h-12 active:scale-95 transition-all border border-transparent hover:border-gray-200 dark:hover:border-white/10"
                        >
                          <EyeIcon className="w-4 h-4" /> Ver Detalles
                        </button>
                      )}
                      {onEdit && activeTab === "Activas" && (
                        <button
                          onClick={() => onEdit(item)}
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-xl min-h-12 active:scale-95 transition-all border border-transparent hover:border-gray-200 dark:hover:border-white/10"
                        >
                          <EditIcon className="w-4 h-4" /> Editar
                        </button>
                      )}
                      {onToggleStatus && (
                        <button
                          onClick={() => onToggleStatus(item)}
                          className={`w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold rounded-xl min-h-12 active:scale-95 transition-all border border-transparent ${
                            activeTab === "Inactivas"
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
            title="No se encontraron responsables"
            description={filters.search || filters.institution !== "all"
              ? "Intenta ajustar los filtros para encontrar lo que buscas."
              : "Aún no hay responsables registrados en esta categoría."}
          />
        )}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={(newItems) => {
          setItemsPerPage(newItems);
          setCurrentPage(1); // Reset to first page when changing items per page
        }}
        totalItems={filteredData.length}
      />

      {/* Dropdown Actions */}
      <DropdownPortal
        isOpen={!!openRowId}
        onClose={() => setOpenRowId(null)}
        anchorRef={{ current: anchorEl as HTMLElement }}
        className="min-w-44"
      >
        {onView && (
          <DropdownItem
            onClick={() => {
              const item = data.find((i) => i.responsibleId === openRowId);
              if (item) onView(item);
              setOpenRowId(null);
            }}
            className="flex items-center gap-2 text-gray-700 hover:bg-gray-50 dark:text-gray-300"
          >
            <EyeIcon className="icon-sm" /> Ver Detalles
          </DropdownItem>
        )}
        {onEdit && activeTab === "Activas" && (
          <DropdownItem
            onClick={() => {
              const item = data.find((i) => i.responsibleId === openRowId);
              if (item) onEdit(item);
              setOpenRowId(null);
            }}
            className="flex items-center gap-2 text-gray-700 hover:bg-gray-50 dark:text-gray-300"
          >
            <EditIcon className="icon-sm" /> Editar
          </DropdownItem>
        )}
        {onToggleStatus && (
          <DropdownItem
            onClick={() => {
              const item = data.find((i) => i.responsibleId === openRowId);
              if (item) onToggleStatus(item);
              setOpenRowId(null);
            }}
            className={`flex items-center gap-2 ${
              activeTab === "Inactivas"
                ? "text-brand-600 hover:bg-brand-50 dark:text-brand-400"
                : "text-red-600 hover:bg-red-50 dark:text-red-400"
            }`}
          >
            {activeTab === "Inactivas" ? (
              <>
                <RefreshIcon className="icon-sm" /> Restaurar
              </>
            ) : (
              <>
                <TrashIcon className="icon-sm" /> Eliminar
              </>
            )}
          </DropdownItem>
        )}
      </DropdownPortal>
    </div>
  );
}
