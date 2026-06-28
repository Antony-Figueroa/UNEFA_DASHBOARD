/**
 * @file EnrollmentViewModal.tsx
 * @description Modal component for displaying complete enrollment details.
 */

import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";

import { EnrollmentRowData } from "../types";

/**
 * Props for the EnrollmentViewModal component.
 */
interface EnrollmentViewModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Optional callback to edit the enrollment from the view modal */
  onEdit?: (item: EnrollmentRowData) => void;
  /** The enrollment item to display */
  item: EnrollmentRowData | null;
}

/**
 * Modal component that provides a read-only detailed view of an enrollment record.
 * 
 * Organizes information into sections: Student, Enrollment, Tutors, and Institution.
 * 
 * @param props - The component props.
 * @returns The EnrollmentViewModal component or null if no item is provided.
 */
export default function EnrollmentViewModal({
  isOpen,
  onClose,
  onEdit,
  item,
}: EnrollmentViewModalProps) {
  if (!item) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="5xl" showCloseButton>
      <ModalHeader className="shrink-0 pt-8 px-6 sm:px-12">Detalles de Inscripción</ModalHeader>
      <ModalBody className="overflow-y-auto custom-scrollbar grow px-6 sm:px-12 py-8">
        <div className="space-y-12 max-w-5xl mx-auto py-2">
          {/* Student Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border-light pb-2 dark:border-white/5">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              <h4 className="font-bold text-text-primary dark:text-white/90 uppercase text-xs tracking-wider">Información del Estudiante</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
              <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Nombre Completo</label>
                <p className="text-sm font-semibold text-text-primary dark:text-white/90">{item.studentName}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Cédula / ID</label>
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{item.identificationPrefix}-{item.identificationNumber}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Carrera</label>
                <p className="text-sm font-bold text-text-primary dark:text-white/90">{item.careerName || "No asignada"}</p>
              </div>
            </div>
          </div>

          {/* Enrollment Data Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border-light pb-2 dark:border-white/5">
              <div className="h-2 w-2 rounded-full bg-brand-500"></div>
              <h4 className="font-bold text-text-primary dark:text-white/90 uppercase text-xs tracking-wider">Datos de la Inscripción</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
              <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Período Académico</label>
                <p className="text-sm font-bold text-text-primary dark:text-white/90">{item.period}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Tipo de Práctica</label>
                <p className="text-sm font-bold text-text-primary dark:text-white/90">{item.practiceType}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Código de Matrícula</label>
                <p className="text-sm font-bold text-brand-500">{item.enrollmentCode || "—"}</p>
              </div>
            </div>
          </div>

          {/* Tutors Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border-light pb-2 dark:border-white/5">
              <div className="h-2 w-2 rounded-full bg-purple-500"></div>
              <h4 className="font-bold text-text-primary dark:text-white/90 uppercase text-xs tracking-wider">Tutores Asignados</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
              <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Tutor Académico</label>
                <p className="text-sm font-bold text-text-primary dark:text-white/90">{item.academicTutorName || "No asignado"}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Tutor Metodológico</label>
                <p className="text-sm font-bold text-text-primary dark:text-white/90">{item.methodologicalTutorName || "No asignado"}</p>
              </div>
            </div>
          </div>

          {/* Institution Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border-light pb-2 dark:border-white/5">
              <div className="h-2 w-2 rounded-full bg-orange-500"></div>
              <h4 className="font-bold text-text-primary dark:text-white/90 uppercase text-xs tracking-wider">Información Institucional</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
              <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Institución</label>
                <p className="text-sm font-bold text-text-primary dark:text-white/90">{item.institutionName || "No asignada"}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Responsable Institucional</label>
                <p className="text-sm font-bold text-text-primary dark:text-white/90">{item.institutionResponsibleName || "No asignado"}</p>
              </div>
            </div>
          </div>

          {/* Status and Dates */}
          <div className="rounded-xl bg-bg-secondary dark:bg-white/3 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Estado de Inscripción</label>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.status ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {item.status ? "Activa" : "Inactiva"}
              </span>
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Fecha de Registro</label>
              <p className="text-[11px] text-text-secondary dark:text-text-tertiary font-medium">{item.enrollmentDate}</p>
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
            Editar Información
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}
