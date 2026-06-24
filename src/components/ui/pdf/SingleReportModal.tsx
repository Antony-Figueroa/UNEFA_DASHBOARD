import React, { useMemo, useState } from "react";
import { Modal } from "../modal";
import { DownloadIcon, FileIcon, EyeIcon, UserIcon } from "../../../icons";
import { XIcon, ListIcon } from "../../../icons/actions";
import { useSingleReport } from "../../../hooks/pdf/useSingleReport";
import { PDFViewer, DocumentProps } from "@react-pdf/renderer";

interface SingleReportModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  data: T;
  template: (data: T) => React.ReactElement<DocumentProps>;
  fileName: string;
  recordInfo?: {
    label: string;
    value: string;
  };
  extraSidebarContent?: React.ReactNode;
}

export const SingleReportModal = <T,>({
  isOpen,
  onClose,
  title,
  subtitle,
  data,
  template,
  fileName,
  recordInfo,
  extraSidebarContent,
}: SingleReportModalProps<T>) => {
  const { generatePDF, previewPDF, isGenerating } = useSingleReport({ fileName });
  const [activeTab, setActiveTab] = useState<"preview" | "info">("preview");

  const finalTemplate = useMemo(() => template(data), [template, data]);

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
                {title}
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
            onClick={() => setActiveTab("info")}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === "info" 
                ? "border-brand-500 text-brand-500 bg-brand-500/5" 
                : "border-transparent text-text-tertiary"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <ListIcon className="h-3.5 w-3.5" />
              Información
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

          {/* Right Side: Info & Actions */}
          <div className={`w-full sm:max-w-sm bg-white dark:bg-bg-primary border-l border-border-light dark:border-white/5 flex flex-col shadow-xl z-10 ${
            activeTab === "info" ? "flex" : "hidden sm:flex"
          }`}>
            <div className="p-4 sm:p-6 flex-1 overflow-y-auto custom-scrollbar">
              <div className="flex items-center gap-2 text-brand-500 mb-6">
                <UserIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                <h4 className="font-bold uppercase tracking-wider text-[10px] sm:text-xs">Información del Registro</h4>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {subtitle && (
                  <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-bg-secondary/50 dark:bg-white/5 border border-border-light dark:border-white/10">
                    <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">
                      Tipo de Documento
                    </label>
                    <p className="text-xs sm:text-sm font-semibold text-text-primary dark:text-white/90">
                      {subtitle}
                    </p>
                  </div>
                )}

                {recordInfo && (
                  <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-bg-secondary/50 dark:bg-white/5 border border-border-light dark:border-white/10">
                    <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">
                      {recordInfo.label}
                    </label>
                    <p className="text-xs sm:text-sm font-semibold text-text-primary dark:text-white/90">
                      {recordInfo.value}
                    </p>
                  </div>
                )}

                <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-brand-500/5 border border-brand-500/10">
                  <p className="text-[10px] sm:text-[11px] text-brand-600 dark:text-brand-400 leading-relaxed italic">
                    Este documento contiene la información detallada del registro seleccionado. El reporte es generado de forma automática y puede ser validado digitalmente.
                  </p>
                </div>

                <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-warning-500/5 border border-warning-500/10">
                  <p className="text-[10px] sm:text-[11px] text-warning-600 dark:text-warning-400 leading-relaxed">
                    <span className="font-bold">Nota:</span> Para una mejor visualización, utilice la opción "Abrir en Nueva Pestaña" que permite usar las herramientas de zoom del navegador.
                  </p>
                </div>

                {extraSidebarContent && (
                  <div className="pt-4 sm:pt-6 border-t border-border-light dark:border-white/5 space-y-3 sm:space-y-4">
                    {extraSidebarContent}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 sm:p-6 bg-bg-secondary/30 dark:bg-white/5 border-t border-border-light dark:border-white/5 space-y-2 sm:space-y-3">
              <button
                onClick={() => previewPDF(finalTemplate)}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 bg-white dark:bg-bg-primary hover:bg-bg-secondary dark:hover:bg-white/5 text-text-primary dark:text-white border border-border-light dark:border-white/10 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm disabled:opacity-50"
              >
                <EyeIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Abrir en Nueva Pestaña
              </button>
              
              <button
                onClick={() => generatePDF(finalTemplate)}
                disabled={isGenerating}
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
