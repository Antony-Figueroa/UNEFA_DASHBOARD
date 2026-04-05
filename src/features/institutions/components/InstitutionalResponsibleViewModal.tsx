/**
 * @file InstitutionalResponsibleViewModal.tsx
 * @description Modal para visualizar los detalles de un responsable institucional, 
 * con diseño consistente al de la vista de institución.
 */

import { useState } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import AsyncButton from "../../../components/ui/button/AsyncButton";
import { InstitutionalResponsible } from "../types";
import { SingleReportModal } from "../../../components/ui/pdf/SingleReportModal";
import { InstitutionalResponsiblePDF } from "../../../components/ui/pdf/templates/individual";

/**
 * Props for the InstitutionalResponsibleViewModal component.
 */
interface InstitutionalResponsibleViewModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Optional callback fired when the edit button is clicked */
  onEdit?: (resp: InstitutionalResponsible) => void;
  /** The responsible record to display */
  responsible: InstitutionalResponsible | null;
}

/**
 * Component for viewing the full details of an institutional responsible.
 * Presents information in a structured, read-only format.
 * 
 * @example
 * ```tsx
 * <InstitutionalResponsibleViewModal
 *   isOpen={isViewOpen}
 *   onClose={() => setViewOpen(false)}
 *   responsible={selectedResponsible}
 * />
 * ```
 */
export default function InstitutionalResponsibleViewModal({
  isOpen,
  onClose,
  onEdit,
  responsible,
}: InstitutionalResponsibleViewModalProps) {
  const [reportModalOpen, setReportModalOpen] = useState(false);

  if (!responsible) return null;

  const formattedDate = new Date(responsible.registrationDate).toLocaleDateString('es-VE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="5xl" showCloseButton>
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
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Instituciones</label>
                {responsible.institutions && responsible.institutions.length > 0 ? (
                  <div className="space-y-2 mt-2">
                    {responsible.institutions.map((inst, index) => (
                      <div key={inst.institutionId || index} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex-1">
                          <p className="text-sm font-bold text-text-primary dark:text-white/90">
                            {inst.institutionName || "Institución sin nombre"}
                          </p>
                          {inst.cargo && (
                            <p className="text-xs text-text-secondary dark:text-text-tertiary mt-1">
                              <span className="font-semibold">Cargo:</span> {inst.cargo}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-bold text-text-primary dark:text-white/90 uppercase">
                    Sin institución
                  </p>
                )}
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
              <p className="text-[11px] text-text-secondary dark:text-text-tertiary font-medium">{formattedDate}</p>
            </div>
          </div>
        </div>
      </ModalBody>

      <ModalFooter className="shrink-0">
        <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
          Cerrar
        </Button>
        <Button
          variant="outline"
          onClick={() => setReportModalOpen(true)}
          className="flex-1 sm:flex-none"
          startIcon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        >
          Generar Reporte
        </Button>
        {onEdit && (
          <AsyncButton onClick={async () => { onEdit(responsible); onClose(); }} className="flex-1 sm:flex-none">
            Editar Información
          </AsyncButton>
        )}
      </ModalFooter>

      <SingleReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title="Ficha de Responsable Institucional"
        subtitle={`${responsible.firstName} ${responsible.lastName} - ${responsible.identificationPrefix}-${responsible.identificationNumber}`}
        data={responsible}
        template={(data) => <InstitutionalResponsiblePDF data={data} />}
        fileName={`responsable_${responsible.identificationNumber}`}
      />
    </Modal>
  );
}
