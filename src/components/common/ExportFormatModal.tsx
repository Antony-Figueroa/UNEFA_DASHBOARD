import { Modal, ModalHeader, ModalBody } from "../ui/modal";
import Button from "../ui/button/Button";
import { ArrowUpIcon } from "../../icons";
import { useState } from "react";

export type ExportFormat = 'json' | 'sql' | 'csv';

interface ExportFormatModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called when user selects a format. Returns true/false for loading state. */
  onExport: (format: ExportFormat) => Promise<void>;
  /** Label for the entity being exported (e.g. 'estudiantes') */
  entityLabel?: string;
}

const formatInfo: { value: ExportFormat; label: string; desc: string }[] = [
  { value: 'json', label: 'JSON', desc: 'Datos completos con todas las relaciones anidadas. Ideal para editar y recargar.' },
  { value: 'sql', label: 'SQL', desc: 'Sentencias INSERT por tabla. Listo para ejecutar directamente en la base de datos.' },
  { value: 'csv', label: 'CSV', desc: 'Datos planos en tabla. Compatible con Excel y hojas de cálculo.' },
];

export default function ExportFormatModal({ isOpen, onClose, onExport, entityLabel }: ExportFormatModalProps) {
  const [loadingFormat, setLoadingFormat] = useState<ExportFormat | null>(null);

  const handleSelect = async (format: ExportFormat) => {
    setLoadingFormat(format);
    try {
      await onExport(format);
      onClose();
    } catch {
      // error handled by caller
    } finally {
      setLoadingFormat(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader title={`Exportar ${entityLabel || 'datos'}`} onClose={onClose} />
      <ModalBody>
        <div className="space-y-3 py-2">
          {formatInfo.map(f => (
            <button
              key={f.value}
              onClick={() => handleSelect(f.value)}
              disabled={loadingFormat !== null}
              className="w-full flex items-start gap-4 p-4 rounded-xl border border-border-light dark:border-white/10 
                         hover:border-brand-500 hover:bg-brand-500/5 transition-all text-left
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500/10">
                <ArrowUpIcon className="h-5 w-5 text-brand-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary dark:text-white/90">
                  {f.label}
                  {loadingFormat === f.value && (
                    <span className="ml-2 text-xs text-text-tertiary">Exportando…</span>
                  )}
                </p>
                <p className="mt-1 text-xs text-text-tertiary leading-relaxed">{f.desc}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
        </div>
      </ModalBody>
    </Modal>
  );
}
