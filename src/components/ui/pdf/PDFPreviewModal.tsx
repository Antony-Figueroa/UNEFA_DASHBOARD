import React, { useMemo, useState } from "react";
import { Modal } from "../modal";
import { DownloadIcon, FileIcon, EyeIcon, ListIcon } from "../../../icons";
import { XIcon, SortIcon } from "../../../icons/actions";
import { usePDF } from "../../../hooks/pdf/usePDF";
import { PDFViewer, DocumentProps } from "@react-pdf/renderer";

interface PDFPreviewModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: T[];
  template: (data: T[]) => React.ReactElement<DocumentProps>;
  fileName: string;
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  renderFilters?: () => React.ReactNode;
  defaultInverted?: boolean;
  columns?: Array<{
    header: string;
    accessor: keyof T | ((item: T) => React.ReactNode);
  }>;
}

export const PDFPreviewModal = <T,>({
  isOpen,
  onClose,
  title,
  data,
  template,
  fileName,
  searchTerm = "",
  onSearchChange,
  renderFilters,
  defaultInverted = false,
}: PDFPreviewModalProps<T>) => {
  const [isInverted, setIsInverted] = useState(defaultInverted);
  const [activeTab, setActiveTab] = useState<"preview" | "filters">("preview");
  const { generatePDF, previewPDF, isGenerating } = usePDF({ fileName });

  const sortedData = useMemo(() => {
    return isInverted ? [...data].reverse() : data;
  }, [data, isInverted]);

  const finalTemplate = useMemo(() => template(sortedData), [template, sortedData]);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      isFullscreen={true}
      showCloseButton={false}
      className="p-0! rounded-none!"
    >
      <div className="flex flex-col h-screen bg-bg-secondary dark:bg-bg-dark overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-white dark:bg-bg-primary border-b border-border-light dark:border-white/5 shadow-sm z-20">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-brand-500/10 text-brand-500">
              <FileIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h3 className="text-sm sm:text-lg font-bold text-text-primary dark:text-white leading-tight line-clamp-1">
                Generador de Reportes
              </h3>
              <p className="text-[10px] sm:text-xs font-medium text-text-tertiary">
                {title} • {data.length} registros
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

        {/* Mobile Tab Selector */}
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

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Left Side: Preview */}
          <div className={`flex-1 bg-gray-500/10 dark:bg-black/20 p-2 sm:p-8 overflow-hidden flex flex-col items-center justify-center ${
            activeTab === "preview" ? "flex" : "hidden sm:flex"
          }`}>
            <div className="w-full h-full max-w-5xl bg-white dark:bg-bg-primary shadow-2xl rounded-lg overflow-hidden border border-border-light dark:border-white/10 relative">
              <PDFViewer 
                key={`${isInverted}-${data.length}`}
                width="100%" 
                height="100%" 
                showToolbar={true} 
                className="border-none w-full h-full"
              >
                {finalTemplate}
              </PDFViewer>
              
              {isGenerating && (
                <div className="absolute inset-0 bg-white/50 dark:bg-bg-primary/50 backdrop-blur-[2px] flex flex-col items-center justify-center z-30">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                    <p className="text-sm font-bold text-brand-500 animate-pulse uppercase tracking-widest">
                      Procesando Reporte...
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Filters & Actions */}
          <div className={`w-full sm:max-w-sm bg-white dark:bg-bg-primary border-l border-border-light dark:border-white/5 flex flex-col shadow-xl z-10 ${
            activeTab === "filters" ? "flex" : "hidden sm:flex"
          }`}>
            <div className="p-4 sm:p-6 flex-1 overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-brand-500">
                  <ListIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <h4 className="font-bold uppercase tracking-wider text-[10px] sm:text-xs">Filtros de Reporte</h4>
                </div>
                
                <button
                  onClick={() => setIsInverted(!isInverted)}
                  className={`flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-all border ${
                    isInverted 
                      ? "bg-brand-500 text-white border-brand-500 shadow-sm" 
                      : "bg-transparent text-text-tertiary border-border-light dark:border-white/10 hover:bg-bg-secondary dark:hover:bg-white/5"
                  }`}
                >
                  <SortIcon className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${isInverted ? "rotate-180" : ""} transition-transform`} />
                  {isInverted ? "Invertido" : "Invertir"}
                </button>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {/* Búsqueda General */}
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
                      placeholder="Buscar en todo el reporte..."
                      className="w-full pl-9 pr-4 py-2 sm:py-2.5 bg-bg-secondary/50 dark:bg-white/5 border border-border-light dark:border-white/10 rounded-lg sm:rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                      value={searchTerm}
                      onChange={(e) => onSearchChange?.(e.target.value)}
                    />
                  </div>
                </div>

                {/* Filtros Personalizados */}
                {renderFilters && (
                  <div className="pt-4 border-t border-border-light dark:border-white/5">
                    {renderFilters()}
                  </div>
                )}

                <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-brand-500/5 border border-brand-500/10 mt-4 sm:mt-8">
                  <p className="text-[10px] sm:text-[11px] text-brand-600 dark:text-brand-400 leading-relaxed italic">
                    * La previsualización se actualiza automáticamente. El documento final contendrá solo los datos filtrados.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 sm:p-6 bg-bg-secondary/30 dark:bg-white/5 border-t border-border-light dark:border-white/5 space-y-2 sm:space-y-3">
              <button
                onClick={() => previewPDF(finalTemplate)}
                disabled={isGenerating || data.length === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 bg-white dark:bg-bg-primary hover:bg-bg-secondary dark:hover:bg-white/5 text-text-primary dark:text-white border border-border-light dark:border-white/10 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm disabled:opacity-50"
              >
                <EyeIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Abrir en Nueva Pestaña
              </button>
              
              <button
                onClick={() => generatePDF(finalTemplate)}
                disabled={isGenerating || data.length === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50"
              >
                <DownloadIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {isGenerating ? "Generando..." : "Descargar PDF"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
