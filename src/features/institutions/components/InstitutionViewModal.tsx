/**
 * @file InstitutionViewModal.tsx
 * @description Componente de modal para visualizar los detalles completos de una institución.
 * Mantiene la consistencia visual con el estándar del sistema.
 */

import { useState } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import AsyncButton from "../../../components/ui/button/AsyncButton";
import { Institution } from "../types";
import { SingleReportModal } from "../../../components/ui/pdf/SingleReportModal";
import { InstitutionIndividualPDF } from "../../../components/ui/pdf/templates/individual";

/**
 * Props for the InstitutionViewModal component.
 */
interface InstitutionViewModalProps {
    /** Whether the modal is visible */
    isOpen: boolean;
    /** Callback to close the modal */
    onClose: () => void;
    /** Optional callback fired when the edit button is clicked */
    onEdit?: (inst: Institution) => void;
    /** The institution record to display */
    institution: Institution | null;
}

/**
 * Component for viewing the full details of an institution.
 * Presents information in a structured, read-only format.
 * 
 * @example
 * ```tsx
 * <InstitutionViewModal
 *   isOpen={isViewOpen}
 *   onClose={() => setViewOpen(false)}
 *   institution={selectedInstitution}
 * />
 * ```
 */
export default function InstitutionViewModal({
    isOpen,
    onClose,
    onEdit,
    institution,
}: InstitutionViewModalProps) {
    const [reportModalOpen, setReportModalOpen] = useState(false);

    if (!institution) return null;

    const formattedDate = new Date(institution.registrationDate).toLocaleDateString('es-VE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="5xl" showCloseButton>
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
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Tipo de Institución</label>
                                <p className="text-sm font-bold text-text-primary dark:text-white/90">{institution.institutionType}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Tipos de Práctica</label>
                                <p className="text-sm font-bold text-text-primary dark:text-white/90">{institution.practiceTypes?.join(", ") || "Sin asignar"}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Región</label>
                                <p className="text-sm font-bold text-text-primary dark:text-white/90">{institution.region || '-'}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Núcleo</label>
                                <p className="text-sm font-bold text-text-primary dark:text-white/90">{institution.nucleus || '-'}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Extensión</label>
                                <p className="text-sm font-bold text-text-primary dark:text-white/90">{institution.extension || '-'}</p>
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
                    <AsyncButton onClick={async () => { onEdit(institution); onClose(); }} className="flex-1 sm:flex-none">
                        Editar Información
                    </AsyncButton>
                )}
            </ModalFooter>

            <SingleReportModal
                isOpen={reportModalOpen}
                onClose={() => setReportModalOpen(false)}
                title="Ficha de Institución"
                subtitle={`${institution.name} - ${institution.rif}`}
                data={institution}
                template={(data) => <InstitutionIndividualPDF data={data} />}
                fileName={`institucion_${institution.rif?.replace(/-/g, '') || institution.institutionId}`}
            />
        </Modal>
    );
}
