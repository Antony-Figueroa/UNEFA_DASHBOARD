import React, { useMemo, useState } from "react";
import { Modal } from "../modal";
import { DownloadIcon, FileIcon, EyeIcon, ListIcon } from "../../../icons";
import { XIcon } from "../../../icons/actions";
import { matchSearch } from "../../../utils/searchNormalizer";

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface TablePreviewModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  data: T[];
  columns: Column<T>[];
  fileName: string;
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  renderFilters?: () => React.ReactNode;
  exportToExcel?: (data: T[], fileName: string) => void;
  pagination?: {
    page: number;
    totalPages: number;
    totalRecords: number;
    onPageChange: (page: number) => void;
  };
}

export function TablePreviewModal<T>({
  isOpen,
  onClose,
  title,
  subtitle,
  data,
  columns,
  fileName,
  searchTerm = "",
  onSearchChange,
  renderFilters,
  exportToExcel,
  pagination,
}: TablePreviewModalProps<T>) {
  const [activeTab, setActiveTab] = useState<"preview" | "filters">("preview");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!exportToExcel) return;
    
    setIsExporting(true);
    try {
      await exportToExcel(data, fileName);
    } finally {
      setIsExporting(false);
    }
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter((item) =>
      columns.some((col) => {
        const value = typeof col.accessor === "function" 
          ? col.accessor(item) 
          : item[col.accessor as keyof T];
        return matchSearch(String(value ?? ""), searchTerm);
      })
    );
  }, [data, searchTerm, columns]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isFullscreen={true}
      showCloseButton={false}
      className="p-0! rounded-none!"
    >
      <div className="flex flex-col h-screen bg-bg-secondary dark:bg-bg-dark overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-white dark:bg-bg-primary border-b border-border-light dark:border-white/5 shadow-sm z-20">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-brand-500/10 text-brand-500">
              <FileIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h3 className="text-sm sm:text-lg font-bold text-text-primary dark:text-white leading-tight line-clamp-1">
                {title}
              </h3>
              <p className="text-[10px] sm:text-xs font-medium text-text-tertiary">
                {pagination
                  ? `Página ${pagination.page + 1} de ${pagination.totalPages} — ${pagination.totalRecords} registros`
                  : subtitle || `${filteredData.length} registros encontrados`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-bg-secondary dark:hover:bg-white/5 rounded-full transition-colors"
          >
            <XIcon className="h-5 w-5 sm:h-6 sm:w-6 text-text-tertiary" />
          </button>
        </div>

        <div className="flex sm:hidden bg-white dark:bg-bg-primary border-b border-border-light dark:border-white/5 z-10">
          <button
            onClick={() => setActiveTab("preview")}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === "preview"
                ? "border-brand-500 text-brand-500 bg-brand-500/5"
                : "border-transparent text-text-tertiary"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <EyeIcon className="h-3.5 w-3.5" />
              Vista Previa
            </div>
          </button>
          <button
            onClick={() => setActiveTab("filters")}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === "filters"
                ? "border-brand-500 text-brand-500 bg-brand-500/5"
                : "border-transparent text-text-tertiary"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <ListIcon className="h-3.5 w-3.5" />
              Filtros
            </div>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden relative">
          <div className={`flex-1 bg-gray-500/10 dark:bg-black/20 overflow-hidden flex flex-col ${
            activeTab === "preview" ? "flex" : "hidden sm:flex"
          }`}>
            <div className="flex-1 overflow-auto p-2 sm:p-4">
              <div className="min-w-full bg-white dark:bg-bg-primary shadow-xl rounded-lg overflow-hidden border border-border-light dark:border-white/10">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead className="bg-bg-secondary dark:bg-white/5 sticky top-0 z-10">
                      <tr>
                        {columns.map((col, idx) => (
                          <th
                            key={idx}
                            className={`px-3 sm:px-4 py-2.5 sm:py-3 text-left font-bold uppercase tracking-wider text-text-tertiary whitespace-nowrap ${col.className || ""}`}
                          >
                            {col.header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light dark:divide-white/5">
                      {filteredData.length > 0 ? (
                        filteredData.map((row, rowIdx) => (
                          <tr
                            key={rowIdx}
                            className="hover:bg-bg-secondary/50 dark:hover:bg-white/5 transition-colors"
                          >
                            {columns.map((col, colIdx) => (
                              <td
                                key={colIdx}
                                className={`px-3 sm:px-4 py-2 sm:py-3 text-text-primary dark:text-text-emphasis uppercase ${col.className || ""}`}
                              >
                                {typeof col.accessor === "function"
                                  ? col.accessor(row)
                                  : String(row[col.accessor as keyof T] ?? "")}
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={columns.length}
                            className="px-4 py-12 text-center text-text-tertiary"
                          >
                            <div className="flex flex-col items-center gap-2">
                              <svg className="w-12 h-12 text-text-tertiary/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="font-medium">No hay datos para mostrar</span>
                              <span className="text-xs">Intenta ajustar los filtros de búsqueda</span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {filteredData.length > 0 && (
                  <div className="px-4 py-3 bg-bg-secondary/50 dark:bg-white/5 border-t border-border-light dark:border-white/5 flex items-center justify-between text-xs text-text-tertiary">
                    <span>Mostrando {filteredData.length} de {data.length} registros</span>
                    {pagination && pagination.totalPages > 1 && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => pagination.onPageChange(pagination.page - 1)}
                          disabled={pagination.page === 0}
                          className="px-2 py-1 rounded hover:bg-brand-500 hover:text-white dark:hover:bg-brand-500 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-bold"
                        >
                          ← Anterior
                        </button>
                        <span className="px-2 font-bold text-text-emphasis">
                          {pagination.page + 1} / {pagination.totalPages}
                        </span>
                        <button
                          onClick={() => pagination.onPageChange(pagination.page + 1)}
                          disabled={pagination.page >= pagination.totalPages - 1}
                          className="px-2 py-1 rounded hover:bg-brand-500 hover:text-white dark:hover:bg-brand-500 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-bold"
                        >
                          Siguiente →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {isExporting && (
              <div className="absolute inset-0 bg-white/50 dark:bg-bg-primary/50 backdrop-blur-[2px] flex flex-col items-center justify-center z-30">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-10 w-10 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                  <p className="text-sm font-bold text-brand-500 animate-pulse uppercase tracking-widest">
                    Exportando...
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className={`w-full sm:max-w-sm bg-white dark:bg-bg-primary border-l border-border-light dark:border-white/5 flex flex-col shadow-xl z-10 ${
            activeTab === "filters" ? "flex" : "hidden sm:flex"
          }`}>
            <div className="p-4 sm:p-6 flex-1 overflow-y-auto custom-scrollbar">
              <div className="flex items-center gap-2 text-brand-500 mb-6">
                <ListIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                <h4 className="font-bold uppercase tracking-wider text-[10px] sm:text-xs">Filtros de Reporte</h4>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-[10px] sm:text-xs font-bold text-text-tertiary uppercase tracking-widest pl-1">
                    Búsqueda General
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-tertiary">
                      <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="Buscar en el reporte..."
                      className="w-full pl-9 pr-4 py-2 sm:py-2.5 bg-bg-secondary/50 dark:bg-white/5 border border-border-light dark:border-white/10 rounded-lg sm:rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                      value={searchTerm}
                      onChange={(e) => onSearchChange?.(e.target.value)}
                    />
                  </div>
                </div>

                {renderFilters && (
                  <div className="pt-4 border-t border-border-light dark:border-white/5">
                    {renderFilters()}
                  </div>
                )}

                <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-brand-500/5 border border-brand-500/10 mt-4 sm:mt-8">
                  <p className="text-[10px] sm:text-[11px] text-brand-600 dark:text-brand-400 leading-relaxed italic">
                    * El reporte se exportará con los datos filtrados. Utiliza los filtros para refinar los resultados.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-bg-secondary/30 dark:bg-white/5 border-t border-border-light dark:border-white/5 space-y-2 sm:space-y-3">
              <button
                onClick={handleExport}
                disabled={isExporting || filteredData.length === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50"
              >
                <DownloadIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {isExporting ? "Exportando..." : "Exportar a Excel"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
