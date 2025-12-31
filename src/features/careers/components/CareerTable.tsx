import { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../../components/ui/table";
import { DropdownPortal } from "../../../components/ui/dropdown/DropdownPortal";
import { DropdownItem } from "../../../components/ui/dropdown/DropdownItem";
import { EditIcon, TrashIcon, RefreshIcon, EyeIcon, ThreeDotsIcon } from "../../../icons/actions";
import { CareerRowData } from "../types";

interface CareerTableProps {
  data: CareerRowData[];
  status: "loading" | "success" | "error";
  error: Error | null;
  onEdit?: (career: CareerRowData) => void;
  onDelete?: (careerId: string) => void;
  onToggleStatus?: (careerId: string) => void;
  onView?: (career: CareerRowData) => void;
  inactiveMode?: boolean;
  activeTab?: "Activas" | "Inactivas";
  onTabChange?: (tab: "Activas" | "Inactivas") => void;
}

const formatDecimal = (n: number) => n.toFixed(2);

export default function CareerTable({
  data = [],
  status,
  error,
  onEdit,
  onDelete,
  onToggleStatus,
  onView,
  inactiveMode = false,
  activeTab = "Activas",
  onTabChange,
}: CareerTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [practiceTypeFilter, setPracticeTypeFilter] = useState<string>("Todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [openRowId, setOpenRowId] = useState<string | number | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);


  const filteredData = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return data.filter((c) => {
      // Normalizamos a string para evitar TypeError si llegan números u otros tipos
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
  }, [data, searchTerm, practiceTypeFilter, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paged = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  if (status === "error" && error) {
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-center">
        <p className="font-medium text-red-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      {/* Cabecera reorganizada: filtros y búsqueda */}
      <div className="p-4 border-b border-gray-100 dark:border-white/5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
          {/* Mantener solo el filtro por tipo de práctica */}
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

      {/* Tabla */}
      <div className="max-w-full overflow-x-auto">
        <Table className="table-root">
          <TableHeader className="table-header-row">
            <TableRow>
              <TableCell isHeader className="table-header-cell">Código</TableCell>
              <TableCell isHeader className="table-header-cell">Carrera</TableCell>
              <TableCell isHeader className="table-header-cell">Nota mínima</TableCell>
              <TableCell isHeader className="table-header-cell">Abreviatura</TableCell>
              <TableCell isHeader className="table-header-cell text-right">Acciones</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
            {status === "loading" ? (
              <TableRow>
                <TableCell className="table-cell py-6 text-center text-gray-500 dark:text-gray-400" colSpan={5}>Cargando...</TableCell>
              </TableRow>
            ) : paged.length > 0 ? (
              paged.map((c, idx) => (
                <TableRow
                  key={c.careerId ?? `${c.careerCode}-${c.careerAbbreviation}-${idx}`}
                  className="table-row-hover"
                >
                  <TableCell className="table-cell font-medium text-gray-800 dark:text-white/90">{c.careerCode}</TableCell>
                  <TableCell className="table-cell text-gray-500 dark:text-gray-400">{c.careerName}</TableCell>
                  <TableCell className="table-cell text-gray-500 dark:text-gray-400">{formatDecimal(Number(c.minimumGrade))}</TableCell>
                  <TableCell className="table-cell text-gray-500 dark:text-gray-400">{c.careerAbbreviation}</TableCell>
                  <TableCell className="table-cell text-right relative">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="dropdown-toggle inline-flex items-center rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5"
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
                <TableCell className="table-cell py-6 text-center" colSpan={6}>
                  {searchTerm || practiceTypeFilter !== "Todos"
                    ? "No se encontraron carreras con los filtros aplicados"
                    : "No hay carreras para mostrar."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Controles de paginación (estilo Periodos) */}
      {filteredData.length > 0 && (
        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 dark:border-white/5 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              Anterior
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              Siguiente
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-400">
                  Mostrando <span className="font-medium">{startIndex + 1}</span> a <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredData.length)}</span> de <span className="font-medium">{filteredData.length}</span> resultados
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="rounded border border-gray-300 bg-transparent py-1 px-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 dark:ring-gray-700 dark:hover:bg-white/5"
                >
                  <span className="sr-only">Anterior</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 dark:ring-gray-700 dark:hover:bg-white/5"
                >
                  <span className="sr-only">Siguiente</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}