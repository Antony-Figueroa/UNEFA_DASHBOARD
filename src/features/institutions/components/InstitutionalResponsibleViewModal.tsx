/**
 * @file InstitutionalResponsibleViewModal.tsx
 * @description Modal para visualizar los detalles de un responsable institucional, 
 * con diseño consistente al de la vista de institución.
 */

import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import { InstitutionalResponsibleRowData } from "../types";

interface InstitutionalResponsibleViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (resp: InstitutionalResponsibleRowData) => void;
  responsible: InstitutionalResponsibleRowData | null;
}

export default function InstitutionalResponsibleViewModal({
  isOpen,
  onClose,
  onEdit,
  responsible,
}: InstitutionalResponsibleViewModalProps) {
  if (!responsible) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} isFullscreen={true} showCloseButton>
      <ModalHeader className="shrink-0 pt-8 px-6 sm:px-12">Detalles del Responsable</ModalHeader>
      
      <ModalBody className="overflow-y-auto custom-scrollbar grow px-6 sm:px-12 py-8">
        <div className="space-y-12 max-w-5xl mx-auto py-2">
          {/* Sección Información Personal */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border-light pb-2 dark:border-white/5">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              <h4 className="font-bold text-text-primary dark:text-white/90 uppercase text-xs tracking-wider">Información Personal</h4>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Nombres Completos</label>
                <p className="text-sm font-semibold text-text-primary dark:text-white/90">
                  {responsible.firstName} {responsible.middleName} {responsible.lastName} {responsible.secondLastName}
                </p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Identificación</label>
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {responsible.identificationPrefix}{responsible.identificationNumber}
                </p>
              </div>
            </div>
          </div>

          {/* Sección Contacto e Institución */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border-light pb-2 dark:border-white/5">
              <div className="h-2 w-2 rounded-full bg-brand-500"></div>
              <h4 className="font-bold text-text-primary dark:text-white/90 uppercase text-xs tracking-wider">Contacto e Institución</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Correo Electrónico</label>
                <p className="text-sm font-bold text-text-primary dark:text-white/90 break-all">
                  {responsible.email}
                </p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Teléfono</label>
                <p className="text-sm font-bold text-text-primary dark:text-white/90">
                  {responsible.phone}
                </p>
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Institución</label>
                <p className="text-sm font-bold text-text-primary dark:text-white/90 uppercase">
                  {responsible.institutionName}
                </p>
              </div>
            </div>
          </div>

          {/* Estado y Fechas */}
          <div className="rounded-xl bg-bg-secondary dark:bg-white/3 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Estado</label>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${responsible.status ? "bg-emerald-100 text-emerald-700" : "bg-bg-secondary text-text-secondary"}`}>
                {responsible.status ? "Activo" : "Inactivo"}
              </span>
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Fecha Registro</label>
              <p className="text-[11px] text-text-secondary dark:text-text-tertiary font-medium">{responsible.registrationDate}</p>
            </div>
          </div>
        </div>
      </ModalBody>

      <ModalFooter className="shrink-0">
        <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
          Cerrar
        </Button>
        {onEdit && (
          <Button onClick={() => { onEdit(responsible); onClose(); }} className="flex-1 sm:flex-none">
            Editar Información
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}
