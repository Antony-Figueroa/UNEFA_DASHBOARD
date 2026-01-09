/**
 * @file InstitutionViewModal.tsx
 * @description Componente de modal para visualizar los detalles completos de una institución.
 * Mantiene la consistencia visual con el estándar del sistema.
 */

import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import { InstitutionRowData } from "../types";

interface InstitutionViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEdit?: (inst: InstitutionRowData) => void;
    institution: InstitutionRowData | null;
}

export default function InstitutionViewModal({
    isOpen,
    onClose,
    onEdit,
    institution,
}: InstitutionViewModalProps) {
    if (!institution) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} isFullscreen={true} showCloseButton>
            <ModalHeader className="shrink-0 pt-8 px-6 sm:px-12">Detalles de Institución</ModalHeader>
            <ModalBody className="overflow-y-auto custom-scrollbar grow px-6 sm:px-12 py-8">
                <div className="space-y-12 max-w-5xl mx-auto py-2">
                    {/* Sección Información Principal */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-border-light pb-2 dark:border-white/5">
                            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                            <h4 className="font-bold text-text-primary dark:text-white/90 uppercase text-xs tracking-wider">Información Principal</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                            <div className="sm:col-span-2">
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Nombre</label>
                                <p className="text-sm font-semibold text-text-primary dark:text-white/90">{institution.name}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">RIF</label>
                                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{institution.rif}</p>
                            </div>
                            <div className="sm:col-span-3">
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Dirección Fiscal</label>
                                <p className="text-sm text-text-primary dark:text-white/90">{institution.fiscalAddress}</p>
                            </div>
                        </div>
                    </div>

                    {/* Sección Detalles Operativos */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-border-light pb-2 dark:border-white/5">
                            <div className="h-2 w-2 rounded-full bg-brand-500"></div>
                            <h4 className="font-bold text-text-primary dark:text-white/90 uppercase text-xs tracking-wider">Detalles Operativos</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Teléfono</label>
                                <p className="text-sm font-bold text-text-primary dark:text-white/90">{institution.phone}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Carrera</label>
                                <p className="text-sm font-bold text-text-primary dark:text-white/90 uppercase">{institution.careerName}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Tipo de Práctica</label>
                                <p className="text-sm font-bold text-text-primary dark:text-white/90">{institution.practiceType}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Tipo de Institución</label>
                                <p className="text-sm font-bold text-text-primary dark:text-white/90">{institution.institutionType}</p>
                            </div>
                        </div>
                    </div>

                    {/* Estado y Fechas */}
                    <div className="rounded-xl bg-bg-secondary dark:bg-white/3 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Estado</label>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${institution.status ? "bg-blue-100 text-blue-700" : "bg-bg-secondary text-text-secondary"}`}>
                                {institution.status ? "Activa" : "Inactiva"}
                            </span>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Fecha Registro</label>
                            <p className="text-[11px] text-text-secondary dark:text-text-tertiary font-medium">{institution.registrationDate}</p>
                        </div>
                    </div>
                </div>
            </ModalBody>
            <ModalFooter className="shrink-0">
                <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
                    Cerrar
                </Button>
                {onEdit && (
                    <Button onClick={() => { onEdit(institution); onClose(); }} className="flex-1 sm:flex-none">
                        Editar Información
                    </Button>
                )}
            </ModalFooter>
        </Modal>
    );
}
