import React, { useState, useMemo } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../modal";
import { DownloadIcon, FileIcon, EyeIcon } from "../../../icons";
import { usePDF } from "../../../hooks/pdf/usePDF";

interface PDFPreviewModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: T[];
  template: React.ReactElement;
  fileName: string;
  columns: {
    header: string;
    accessor: keyof T | ((item: T) => React.ReactNode);
    className?: string;
  }[];
}

export const PDFPreviewModal = <T,>({
  isOpen,
  onClose,
  title,
  data,
  template,
  fileName,
  columns,
}: PDFPreviewModalProps<T>) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { generatePDF, previewPDF, isGenerating } = usePDF({ fileName });

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter((item) =>
      Object.values(item as object).some((val) =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  // Clonamos el template con los datos filtrados si es necesario
  const finalTemplate = React.cloneElement(template as React.ReactElement<{ data: T[] }>, { data: filteredData });

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-5xl">
      <ModalHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
            <FileIcon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text-primary dark:text-white">
              Vista Previa de Reporte
            </h3>
            <p className="text-sm font-medium text-text-tertiary">
              {title} • {filteredData.length} registros
            </p>
          </div>
        </div>
      </ModalHeader>

      <ModalBody>
        <div className="space-y-6">
          {/* Barra de Búsqueda / Filtro */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-bg-secondary/50 p-4 rounded-xl border border-border-light dark:border-white/5">
            <div className="relative w-full sm:max-w-xs">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-tertiary">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Buscar en el reporte..."
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-bg-primary border border-border-light dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="text-xs font-medium text-text-tertiary italic">
              * El PDF se generará exactamente con los datos visibles a continuación.
            </div>
          </div>

          {/* Tabla de Datos (Simulacro de estructura PDF) */}
          <div className="overflow-hidden rounded-xl border border-border-light dark:border-white/5">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-bg-secondary dark:bg-white/5 border-b border-border-light dark:border-white/5">
                    {columns.map((col, idx) => (
                      <th key={idx} className={`px-4 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider ${col.className || ""}`}>
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light dark:divide-white/5 bg-white dark:bg-transparent">
                  {filteredData.length > 0 ? (
                    filteredData.map((item, rowIdx) => (
                      <tr key={rowIdx} className="hover:bg-bg-secondary/30 dark:hover:bg-white/5 transition-colors">
                        {columns.map((col, colIdx) => (
                          <td key={colIdx} className={`px-4 py-3 text-sm text-text-primary dark:text-text-tertiary ${col.className || ""}`}>
                            {typeof col.accessor === "function" 
                              ? col.accessor(item) 
                              : (item[col.accessor] as React.ReactNode)}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={columns.length} className="px-4 py-10 text-center text-text-tertiary italic">
                        No se encontraron datos para el reporte.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <button
          onClick={onClose}
          className="px-5 py-2.5 text-sm font-bold text-text-secondary hover:text-text-primary transition-colors"
        >
          Cancelar
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => previewPDF(finalTemplate)}
            disabled={isGenerating || filteredData.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-bg-secondary hover:bg-border-light dark:bg-white/5 dark:hover:bg-white/10 text-text-primary dark:text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50"
          >
            <EyeIcon className="h-4 w-4" />
            Previsualizar PDF
          </button>
          <button
            onClick={() => generatePDF(finalTemplate)}
            disabled={isGenerating || filteredData.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-500/20 transition-all disabled:opacity-50"
          >
            <DownloadIcon className="h-4 w-4" />
            {isGenerating ? "Generando..." : "Descargar Reporte"}
          </button>
        </div>
      </ModalFooter>
    </Modal>
  );
};
