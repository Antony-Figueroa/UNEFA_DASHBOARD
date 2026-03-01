import { useState } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../ui/modal";
import Button from "../ui/button/Button";

interface UnifiedReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportExcel: () => void;
  onExportPDF?: () => void;
}

export default function UnifiedReportModal({
  isOpen,
  onClose,
  onExportExcel,
  onExportPDF,
}: UnifiedReportModalProps) {
  const [format, setFormat] = useState<"excel" | "pdf">("excel");

  const handleExport = () => {
    if (format === "excel") {
      onExportExcel();
    } else if (onExportPDF) {
      onExportPDF();
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader>
        <div className="w-full">
          <span className="font-semibold text-text-primary modal-title text-theme-xl dark:text-white/90">
            Generar Reporte
          </span>
          <p className="text-sm text-text-secondary dark:text-text-tertiary font-normal mt-1">
            Seleccione el formato de exportación
          </p>
        </div>
      </ModalHeader>
      <ModalBody>
        <div className="space-y-3">
          <label className="text-sm font-medium text-text-primary mb-2 block">
            Formato del reporte
          </label>
          
          <div className="space-y-2">
            <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${format === "excel" ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10" : "hover:bg-gray-50 dark:hover:bg-white/5"}`}>
              <input
                type="radio"
                name="format"
                value="excel"
                checked={format === "excel"}
                onChange={() => setFormat("excel")}
                className="w-4 h-4 text-brand-500"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-text-primary">Excel (.xlsx)</span>
                <p className="text-xs text-text-tertiary">Visualización en tabla con todos los datos</p>
              </div>
            </label>
            
            {onExportPDF && (
              <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${format === "pdf" ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10" : "hover:bg-gray-50 dark:hover:bg-white/5"}`}>
                <input
                  type="radio"
                  name="format"
                  value="pdf"
                  checked={format === "pdf"}
                  onChange={() => setFormat("pdf")}
                  className="w-4 h-4 text-brand-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-text-primary">PDF</span>
                  <p className="text-xs text-text-tertiary">Documento en formato PDF para impresión</p>
                </div>
              </label>
            )}
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          Cancelar
        </button>
        <Button onClick={handleExport}>
          Generar Reporte
        </Button>
      </ModalFooter>
    </Modal>
  );
}
