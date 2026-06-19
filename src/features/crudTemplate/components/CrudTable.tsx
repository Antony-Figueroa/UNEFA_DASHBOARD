import { useMemo, useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow, Pagination } from "../../../components/ui/table";
import Checkbox from "../../../components/form/input/Checkbox";
import { AsyncActionButton } from "../../../components/common/AsyncActionButton";
import { SelectionBar } from "../../../components/common/SelectionBar";
import { SearchInput } from "../../../components/common/SearchInput";
import type { CrudColumn, CrudFilterConfig, CrudFilterState, CrudActionConfig, CrudRowAction } from "../types";
import { TrashIcon, RefreshIcon, EditIcon, EyeIcon } from "../../../icons/actions";
import { matchSearch } from "../../../utils/searchNormalizer";

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
  const [itemsPerPage, setItemsPerPage] = useState(initialPageSize);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

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
          return columns.some((col) => {
            const cell = col.accessor(item);
            return matchSearch(String(cell ?? ""), String(value));
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
      <div className="flex flex-col gap-4 border-b border-border-light p-4 dark:border-border-dark sm:flex-row sm:items-center sm:justify-between">
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
                    className="w-full rounded-lg border border-border-medium bg-transparent py-2 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:border-brand-500 focus:outline-none dark:border-border-dark dark:bg-bg-dark dark:text-text-emphasis dark:placeholder:text-text-tertiary"
                    aria-label={filter.label}
                  />
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
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
                    className="w-full h-11 rounded-lg border border-border-medium bg-transparent pl-3 pr-10 text-sm text-text-primary focus:border-brand-500 focus:outline-none dark:border-border-dark dark:bg-bg-dark dark:text-text-emphasis appearance-none"
                  >
                    <option value="">{filter.placeholder ?? "Seleccione..."}</option>
                    {filter.options?.map((opt) => (
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
                  className="w-full rounded-lg border border-border-medium bg-transparent py-2 px-4 text-sm text-text-primary focus:border-brand-500 focus:outline-none dark:border-border-dark dark:bg-bg-dark dark:text-text-emphasis sm:max-w-xs"
                >
                  {filter.options?.map((opt) => (
                    <option key={opt.value} value={opt.value} className="dark:bg-bg-dark">
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
          <SelectionBar
            count={selectedIds.length}
            hideCountOnMobile={false}
            actions={actions.map((action) => ({
              label: action.label,
              variant: action.variant === "danger" ? "error" : action.variant === "primary" ? "primary" : "warning",
              onClick: () => action.onAction(items.filter((i) => selectedIds.includes(i.id))),
            }))}
          />
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
                      className={`flex h-full w-full items-center px-4 py-3 text-left font-semibold group focus:outline-none focus:bg-bg-secondary dark:focus:bg-white/5 ${column.alignRight ? "justify-end" : ""
                        }`}
                      onClick={async () => handleSort(column.id)}
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
                  &nbsp;
                </TableCell>
              )}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border-light dark:divide-border-dark">
            {loading ? (
              <TableRow>
                <TableCell
                  className="table-cell py-6 text-center text-text-secondary dark:text-text-tertiary"
                  colSpan={columns.length + 1}
                >
                  Cargando...
                </TableCell>
              </TableRow>
            ) : pageItems.length === 0 ? (
              <TableRow>
                <TableCell
                  className="table-cell py-6 text-center text-text-secondary dark:text-text-tertiary"
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
                    <TableCell className="table-cell text-right">
                      <div className="flex justify-end gap-3">
                        {rowActions.map((action) => {
                          if (action.show && !action.show(item)) return null;

                          const icon =
                            action.icon === "edit" ? (
                              <EditIcon />
                            ) : action.icon === "delete" ? (
                              <TrashIcon />
                            ) : action.icon === "view" ? (
                              <EyeIcon />
                            ) : action.icon === "restore" ? (
                              <RefreshIcon />
                            ) : typeof action.icon === "string" ? null : (
                              action.icon
                            );

                          const variant =
                            action.icon === "edit" ? "primary" :
                              action.icon === "delete" ? "error" :
                                action.icon === "view" ? "primary" :
                                  action.icon === "restore" ? "success" : "primary";

                          return (
                            <AsyncActionButton
                              key={action.id}
                              onClick={async () => action.onClick(item)}
                              icon={icon}
                              tooltip={action.label}
                              variant={variant}
                            />
                          );
                        })}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {sortedItems.length > 0 && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={sortedItems.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={(items) => { setItemsPerPage(items); setCurrentPage(1); }}
          itemsPerPageOptions={pageSizeOptions}
        />
      )}
    </div>
  );
}
