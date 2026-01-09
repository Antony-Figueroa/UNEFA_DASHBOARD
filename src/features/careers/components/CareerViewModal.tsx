/**
 * @file CareerViewModal.tsx
 * @description Modal para visualizar los detalles de una carrera académica, 
 * con diseño consistente al de la vista de institución.
 */

import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import { CareerRowData } from "../types";

interface CareerViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (career: CareerRowData) => void;
  career: CareerRowData | null;
}

export default function CareerViewModal({
  isOpen,
  onClose,
  onEdit,
  career,
}: CareerViewModalProps) {
  if (!career) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} isFullscreen={true} showCloseButton>
      <ModalHeader className="shrink-0 pt-8 px-6 sm:px-12">Detalles de la Carrera</ModalHeader>
      
      <ModalBody className="overflow-y-auto custom-scrollbar grow px-6 sm:px-12 py-8">
        <div className="space-y-12 max-w-5xl mx-auto py-2">
          {/* Sección Información Principal */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border-light pb-2 dark:border-white/5">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              <h4 className="font-bold text-text-primary dark:text-white/90 uppercase text-xs tracking-wider">Información Académica</h4>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Nombre de la Carrera</label>
                <p className="text-sm font-semibold text-text-primary dark:text-white/90 uppercase">
                  {career.careerName}
                </p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Código</label>
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {career.careerCode}
                </p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Abreviatura</label>
                <p className="text-sm font-bold text-text-primary dark:text-white/90">
                  {career.careerAbbreviation}
                </p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Nota Mínima Aprobatoria</label>
                <p className="text-sm font-bold text-text-primary dark:text-white/90">
                  {career.minimumGrade.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Sección de Configuración */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border-light pb-2 dark:border-white/5">
              <div className="h-2 w-2 rounded-full bg-brand-500"></div>
              <h4 className="font-bold text-text-primary dark:text-white/90 uppercase text-xs tracking-wider">Configuración de Prácticas</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Tipos de Prácticas Permitidas</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {career.internshipTypeIds && career.internshipTypeIds.length > 0 ? (
                    career.internshipTypeIds.map((type, index) => (
                      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400 border border-brand-100 dark:border-brand-500/20">
                        {type}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-text-secondary italic">No hay tipos configurados</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Estado y Fechas */}
          <div className="rounded-xl bg-bg-secondary dark:bg-white/3 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Estado</label>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${career.status ? "bg-emerald-100 text-emerald-700" : "bg-bg-secondary text-text-secondary"}`}>
                {career.status ? "Activa" : "Inactiva"}
              </span>
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Fecha Registro</label>
              <p className="text-[11px] text-text-secondary dark:text-text-tertiary font-medium">{career.creationDate}</p>
            </div>
          </div>
        </div>
      </ModalBody>

      <ModalFooter className="shrink-0">
        <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
          Cerrar
        </Button>
        {onEdit && (
          <Button onClick={() => { onEdit(career); onClose(); }} className="flex-1 sm:flex-none">
            Editar Carrera
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}
