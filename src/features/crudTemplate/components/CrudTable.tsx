import { useMemo, useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../../components/ui/table";
import Checkbox from "../../../components/form/input/Checkbox";
import { DropdownPortal } from "../../../components/ui/dropdown/DropdownPortal";
import { DropdownItem } from "../../../components/ui/dropdown/DropdownItem";
import type { CrudColumn, CrudFilterConfig, CrudFilterState, CrudActionConfig, CrudRowAction } from "../types";
import { TrashIcon, RefreshIcon, EditIcon, EyeIcon, ThreeDotsIcon } from "../../../icons/actions";

export interface CrudTableProps<TItem extends { id: string }> {
  items: TItem[];
  columns: CrudColumn<TItem>[];
  filters?: CrudFilterConfig[];
  filterState?: CrudFilterState;
  onFilterChange?: (next: CrudFilterState) => void;
  actions?: CrudActionConfig<TItem>[];
  rowActions?: CrudRowAction<TItem>[];
  pageSizeOptions?: number[];
  initialPageSize?: number;
  loading?: boolean;
  errorMessage?: string | null;
  onSelectionChange?: (selected: TItem[]) => void;
}

/**
 * Tabla genérica para vistas de gestión CRUD.
 *
 * Incluye paginación, ordenamiento accesible, filtros dinámicos y
 * selección múltiple con acciones masivas opcionales.
 *
 * @template TItem Tipo de entidad con propiedad `id` de tipo string.
 * @param props Configuración de columnas, datos, filtros y acciones.
 */
export function CrudTable<TItem extends { id: string }>({
  items,
  columns,
  filters,
  filterState,
  onFilterChange,
  actions = [],
  rowActions = [],
  pageSizeOptions = [5, 10, 20, 50],
  initialPageSize = 10,
  loading = false,
  errorMessage = null,
  onSelectionChange,
}: CrudTableProps<TItem>) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialPageSize);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  // Reset selection when items change (e.g. filter or tab change)
  useEffect(() => {
    setSelectedIds([]);
  }, [items]);

  const handleSort = (columnId: string) => {
    setSortKey((prevKey) => {
      if (prevKey === columnId) {
        setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
        return prevKey;
      }
      setSortOrder("asc");
      return columnId;
    });
  };

  const handleSelectAll = (checked: boolean, pageItems: TItem[]) => {
    if (checked) {
      const pageIds = pageItems.map((i) => i.id);
      const merged = Array.from(new Set([...selectedIds, ...pageIds]));
      setSelectedIds(merged);
      if (onSelectionChange) {
        onSelectionChange(items.filter((i) => merged.includes(i.id)));
      }
    } else {
      const pageIds = new Set(pageItems.map((i) => i.id));
      const remaining = selectedIds.filter((id) => !pageIds.has(id));
      setSelectedIds(remaining);
      if (onSelectionChange) {
        onSelectionChange(items.filter((i) => remaining.includes(i.id)));
      }
    }
  };

  const handleSelectRow = (item: TItem, checked: boolean) => {
    if (checked) {
      const next = Array.from(new Set([...selectedIds, item.id]));
      setSelectedIds(next);
      if (onSelectionChange) {
        onSelectionChange(items.filter((i) => next.includes(i.id)));
      }
    } else {
      const next = selectedIds.filter((id) => id !== item.id);
      setSelectedIds(next);
      if (onSelectionChange) {
        onSelectionChange(items.filter((i) => next.includes(i.id)));
      }
    }
  };

  const effectiveFilterState: CrudFilterState = useMemo(
    () => filterState ?? {},
    [filterState],
  );

  const filteredItems = useMemo(() => {
    if (!filters || filters.length === 0) return items;

    return items.filter((item) => {
      return filters.every((filter) => {
        const value = effectiveFilterState[filter.id];
        if (!value || (Array.isArray(value) && value.length === 0)) {
          return true;
        }

        if (filter.type === "search") {
          const query = String(value).toLowerCase();
          return columns.some((col) => {
            const cell = col.accessor(item);
            return String(cell ?? "").toLowerCase().includes(query);
          });
        }

        if (filter.type === "select") {
          const query = String(value);
          return columns.some((col) => String(col.accessor(item) ?? "") === query);
        }

        if (filter.type === "multi-select" && Array.isArray(value)) {
          const querySet = new Set(value.map((v) => String(v)));
          return columns.some((col) => {
            const cellValue = col.accessor(item);
            if (Array.isArray(cellValue)) {
              return cellValue.some((v) => querySet.has(String(v)));
            }
            return querySet.has(String(cellValue ?? ""));
          });
        }

        return true;
      });
    });
  }, [items, filters, effectiveFilterState, columns]);

  const sortedItems = useMemo(() => {
    if (!sortKey) return filteredItems;

    const column = columns.find((col) => col.id === sortKey);
    if (!column) return filteredItems;

    const list = [...filteredItems];

    list.sort((a, b) => {
      const valueA = column.accessor(a);
      const valueB = column.accessor(b);

      if (typeof valueA === "number" && typeof valueB === "number") {
        return sortOrder === "asc" ? valueA - valueB : valueB - valueA;
      }

      const strA = String(valueA ?? "").toLowerCase();
      const strB = String(valueB ?? "").toLowerCase();

      if (strA < strB) return sortOrder === "asc" ? -1 : 1;
      if (strA > strB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [filteredItems, columns, sortKey, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pageItems = sortedItems.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const headerSelectedState =
    pageItems.length > 0 &&
    pageItems.every((item) => selectedIds.includes(item.id));

  const anySelected = selectedIds.length > 0;

  const handleFilterChange = (id: string, value: string | string[]) => {
    if (!onFilterChange) return;
    onFilterChange({
      ...effectiveFilterState,
      [id]: value,
    });
  };

  const SortIndicator = ({ columnId }: { columnId: string }) => {
    if (sortKey !== columnId) {
      return (
        <svg
          className="ml-1 icon-xs text-brand-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      );
    }
    return sortOrder === "asc" ? (
      <svg className="ml-1 icon-xs text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="ml-1 icon-xs text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (errorMessage) {
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-center">
        <p className="font-medium text-red-600">{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <div className="flex flex-col gap-4 border-b border-gray-100 p-4 dark:border-white/5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {filters?.map((filter) => {
            if (filter.type === "search") {
              const value = (effectiveFilterState[filter.id] as string) ?? "";
              return (
                <div key={filter.id} className="relative max-w-xs w-full">
                  <input
                    type="search"
                    value={value}
                    onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                    placeholder={filter.placeholder ?? "Buscar..."}
                    className="w-full rounded-lg border border-gray-300 bg-transparent py-2 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
                    aria-label={filter.label}
                  />
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                      />
                    </svg>
                  </span>
                </div>
              );
            }

            if (filter.type === "select") {
              const value = (effectiveFilterState[filter.id] as string) ?? "";
              return (
                <div key={filter.id} className="relative w-full sm:max-w-xs">
                  <select
                    aria-label={filter.label}
                    value={value}
                    onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                    className="w-full h-11 rounded-lg border border-gray-300 bg-transparent pl-3 pr-10 text-sm text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white appearance-none"
                  >
                    <option value="">{filter.placeholder ?? "Seleccione..."}</option>
                    {filter.options?.map((opt) => (
                      <option key={opt.value} value={opt.value} className="dark:bg-gray-800">
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
              );
            }

            if (filter.type === "multi-select") {
              const value = (effectiveFilterState[filter.id] as string[]) ?? [];
              return (
                <select
                  key={filter.id}
                  aria-label={filter.label}
                  multiple
                  value={value}
                  onChange={(e) => {
                    const selectedValues = Array.from(
                      e.target.selectedOptions,
                      (opt) => opt.value,
                    );
                    handleFilterChange(filter.id, selectedValues);
                  }}
                  className="w-full rounded-lg border border-gray-300 bg-transparent py-2 px-4 text-sm text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:max-w-xs"
                >
                  {filter.options?.map((opt) => (
                    <option key={opt.value} value={opt.value} className="dark:bg-gray-800">
                      {opt.label}
                    </option>
                  ))}
                </select>
              );
            }

            return null;
          })}
        </div>

        {anySelected && actions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <span className="flex flex-wrap
             mr-2 text-sm font-medium text-gray-600 dark:text-gray-400">
              {selectedIds.length}  seleccionados
            </span>
            {actions.map((action) => {
              const isDanger = action.variant === "danger";
              const isPrimary = action.variant === "primary";
              const icon =
                action.id.toLowerCase().includes("delete") ||
                  action.label.toLowerCase().includes("eliminar") ? (
                  <TrashIcon className="h-4 w-4" />
                ) : action.id.toLowerCase().includes("restore") ||
                  action.label.toLowerCase().includes("restaurar") ? (
                  <RefreshIcon className="h-4 w-4" />
                ) : null;

              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => action.onAction(items.filter((i) => selectedIds.includes(i.id)))}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isDanger
                    ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-400/10 dark:text-red-400 dark:hover:bg-red-400/20"
                    : isPrimary
                      ? "bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-400/10 dark:text-brand-400 dark:hover:bg-brand-400/20"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200"
                    }`}
                >
                  {icon}
                  {action.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="max-w-full overflow-x-auto table-scrollbar">
        <Table className="table-root">
          <TableHeader className="table-header-row">
            <TableRow>
              <TableCell isHeader className="table-header-cell w-10">
                <Checkbox
                  checked={headerSelectedState}
                  onChange={(checked) => handleSelectAll(checked, pageItems)}
                  ariaLabel="Seleccionar todos los elementos de la página actual"
                />
              </TableCell>
              {columns.map((column) => {
                const isSorted = sortKey === column.id;
                const ariaSort =
                  isSorted && column.sortable
                    ? sortOrder === "asc"
                      ? "ascending"
                      : "descending"
                    : "none";

                if (!column.sortable) {
                  return (
                    <TableCell
                      key={column.id}
                      isHeader
                      className={`table-header-cell ${column.widthClassName ?? ""} ${column.alignRight ? "text-right" : ""
                        }`}
                    >
                      {column.header}
                    </TableCell>
                  );
                }

                return (
                  <TableCell
                    key={column.id}
                    isHeader
                    className={`table-header-cell p-0 ${column.widthClassName ?? ""}`}
                  >
                    <button
                      type="button"
                      className={`flex h-full w-full items-center px-4 py-3 text-left font-semibold group focus:outline-none focus:bg-gray-50 dark:focus:bg-white/5 ${column.alignRight ? "justify-end" : ""
                        }`}
                      onClick={() => handleSort(column.id)}
                      aria-sort={ariaSort as "none" | "ascending" | "descending"}
                    >
                      <span>{column.header}</span>
                      <SortIndicator columnId={column.id} />
                    </button>
                  </TableCell>
                );
              })}
              {rowActions.length > 0 && (
                <TableCell isHeader className="table-header-cell text-right">
                  Acciones
                </TableCell>
              )}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
            {loading ? (
              <TableRow>
                <TableCell
                  className="table-cell py-6 text-center text-gray-500 dark:text-gray-400"
                  colSpan={columns.length + 1}
                >
                  Cargando...
                </TableCell>
              </TableRow>
            ) : pageItems.length === 0 ? (
              <TableRow>
                <TableCell
                  className="table-cell py-6 text-center text-gray-500 dark:text-gray-400"
                  colSpan={columns.length + 1}
                >
                  No hay datos para mostrar.
                </TableCell>
              </TableRow>
            ) : (
              pageItems.map((item) => (
                <TableRow
                  key={item.id}
                  className={`table-row-hover ${selectedIds.includes(item.id)
                    ? "bg-brand-50/40 dark:bg-brand-500/5"
                    : ""
                    }`}
                >
                  <TableCell className="table-cell">
                    <Checkbox
                      checked={selectedIds.includes(item.id)}
                      onChange={(checked) => handleSelectRow(item, checked)}
                      ariaLabel="Seleccionar fila"
                    />
                  </TableCell>
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      className={`table-cell ${column.alignRight ? "text-right" : ""
                        }`}
                    >
                      {column.render
                        ? column.render(item)
                        : String(column.accessor(item) ?? "—")}
                    </TableCell>
                  ))}
                  {rowActions.length > 0 && (
                    <TableCell className="table-cell text-right relative">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          className="dropdown-toggle inline-flex items-center rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5"
                          aria-label="Acciones"
                          onClick={(e) => {
                            setAnchorEl(e.currentTarget as HTMLElement);
                            setOpenRowId((prev) => (prev === item.id ? null : item.id));
                          }}
                          aria-expanded={openRowId === item.id}
                        >
                          <ThreeDotsIcon className="h-5 w-5" />
                        </button>

                        <DropdownPortal
                          isOpen={openRowId === item.id}
                          onClose={() => setOpenRowId(null)}
                          anchorRef={{ current: anchorEl as HTMLElement }}
                          className="min-w-44"
                        >
                          {rowActions.map((action) => {
                            if (action.show && !action.show(item)) return null;

                            const icon =
                              action.icon === "edit" ? (
                                <EditIcon className="h-4 w-4" />
                              ) : action.icon === "delete" ? (
                                <TrashIcon className="h-4 w-4" />
                              ) : action.icon === "view" ? (
                                <EyeIcon className="h-4 w-4" />
                              ) : action.icon === "restore" ? (
                                <RefreshIcon className="h-4 w-4" />
                              ) : typeof action.icon === "string" ? null : (
                                action.icon
                              );

                            const variantClasses =
                              action.variant === "danger"
                                ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-400/10"
                                : action.variant === "brand"
                                  ? "text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-400/10"
                                  : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5";

                            return (
                              <DropdownItem
                                key={action.id}
                                onItemClick={() => {
                                  action.onClick(item);
                                  setOpenRowId(null);
                                }}
                                className={`flex items-center gap-2 ${variantClasses}`}
                              >
                                {icon}
                                {action.label}
                              </DropdownItem>
                            );
                          })}
                        </DropdownPortal>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {sortedItems.length > 0 && (
        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-sm text-gray-700 dark:border-white/5 dark:text-gray-300 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              Siguiente
            </button>
          </div>

          <div className="hidden w-full items-center justify-between gap-4 sm:flex">
            <div className="flex items-center gap-3">
              <p>
                Mostrando{" "}
                <span className="font-medium">
                  {startIndex + 1}
                </span>{" "}
                a{" "}
                <span className="font-medium">
                  {Math.min(startIndex + itemsPerPage, sortedItems.length)}
                </span>{" "}
                de{" "}
                <span className="font-medium">
                  {sortedItems.length}
                </span>{" "}
                resultados
              </p>
              <div className="flex items-center gap-2">
                <span>Por página</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    setItemsPerPage(next);
                    setCurrentPage(1);
                  }}
                  className="rounded border border-gray-300 bg-transparent py-1 px-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  {pageSizeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <nav
              className="isolate inline-flex -space-x-px rounded-md shadow-sm"
              aria-label="Paginación"
            >
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 dark:ring-gray-700 dark:hover:bg-white/5"
              >
                <span className="sr-only">Anterior</span>
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 dark:text-gray-300 dark:ring-gray-700">
                Página {currentPage} de {totalPages}
              </span>
              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 dark:ring-gray-700 dark:hover:bg-white/5"
              >
                <span className="sr-only">Siguiente</span>
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
