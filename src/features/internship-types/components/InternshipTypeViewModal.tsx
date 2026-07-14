/**
 * @file InternshipTypeViewModal.tsx
 * @description Modal de solo lectura para visualizar los detalles de un Tipo de Pasantía.
 * 
 * @module features/internship-types/components
 */

import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import { InternshipType } from "../types";
import Badge from "../../../components/ui/badge/Badge";

interface InternshipTypeViewModalProps {
  /** Indica si el modal está visible */
  isOpen: boolean;
  /** Callback para cerrar el modal */
  onClose: () => void;
  /** Callback opcional para iniciar la edición desde la vista de detalles */
  onEdit?: (item: InternshipType) => void;
  /** El elemento a visualizar */
  item: InternshipType | null;
}

/**
 * Componente Modal para la visualización detallada de un Tipo de Pasantía.
 */
export default function InternshipTypeViewModal({
  isOpen,
  onClose,
  onEdit,
  item,
}: InternshipTypeViewModalProps) {
  if (!item) return null;

  /**
   * Mapea el valor numérico de prioridad a su etiqueta descriptiva.
   */
  const getPriorityLabel = (priority: number) => {
    if (priority === 0) return "Único (sin secuencia)";
    return `#${priority}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="5xl" showCloseButton>
      <ModalHeader className="shrink-0 pt-8 px-6 sm:px-12">Detalles del Tipo de Práctica</ModalHeader>
      
      <ModalBody className="overflow-y-auto custom-scrollbar grow px-6 sm:px-12 py-8">
        <div className="space-y-12 max-w-5xl mx-auto py-2">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border-light pb-2 dark:border-white/5">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              <h4 className="font-bold text-text-primary dark:text-white/90 uppercase text-xs tracking-wider">Información General</h4>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Nombre</label>
                <p className="text-sm font-semibold text-text-primary dark:text-white/90 uppercase">
                  {item.name}
                </p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Prioridad</label>
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {getPriorityLabel(item.priority)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-bg-secondary dark:bg-white/3 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Estado</label>
              <Badge color={item.status ? "success" : "error"}>
                {item.status ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Fecha Registro</label>
              <p className="text-[11px] text-text-secondary dark:text-text-tertiary font-medium">
                {item.creationDate instanceof Date ? item.creationDate.toLocaleDateString() : String(item.creationDate)}
              </p>
            </div>
          </div>
        </div>
      </ModalBody>

      <ModalFooter className="shrink-0">
        <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
          Cerrar
        </Button>
        {onEdit && (
          <Button onClick={() => { onEdit(item); onClose(); }} className="flex-1 sm:flex-none">
            Editar Tipo
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}
