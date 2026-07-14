/**
 * @file StudentViewModal.tsx
 * @description Componente de modal para visualizar los detalles completos de un estudiante.
 * Mantiene la consistencia visual con el estándar del sistema.
 */

import { useState, useEffect } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";

import { StudentRowData } from "../types";
import { SingleReportModal } from "../../../components/ui/pdf/SingleReportModal";
import { StudentIndividualPDF } from "../../../components/ui/pdf/templates/individual";
import { toTitleCase } from "../../../utils/textFormat";
import AddressList from "../../address/components/AddressList";
import { addressService } from "../../address/services/addressService";
import type { GeoOptionsItem } from "../../address/types";

/**
 * Propiedades del componente StudentViewModal.
 */
interface StudentViewModalProps {
    /** Indica si el modal está abierto */
    isOpen: boolean;
    /** Función para cerrar el modal */
    onClose: () => void;
    /** Función opcional para abrir el modal de edición desde la vista de detalles */
    onEdit?: (student: StudentRowData) => void;
    /** Datos del estudiante a visualizar */
    student: StudentRowData | null;
}

/**
 * Componente de modal para visualizar los detalles completos de un estudiante.
 * Muestra información personal, académica y de contacto en un formato organizado.
 * 
 * @example
 * ```tsx
 * <StudentViewModal 
 *   isOpen={isOpen} 
 *   onClose={() => setIsOpen(false)} 
 *   student={selectedStudent} 
 * />
 * ```
 */
export default function StudentViewModal({
    isOpen,
    onClose,
    onEdit,
    student,
}: StudentViewModalProps) {
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [geoOptions, setGeoOptions] = useState<GeoOptionsItem[]>([]);

    useEffect(() => {
        if (isOpen) {
            addressService.getGeoOptions().then(res => setGeoOptions(res.data)).catch(console.error);
        }
    }, [isOpen]);

    if (!student) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="5xl" showCloseButton>
            <ModalHeader className="shrink-0 pt-8 px-6 sm:px-12">Detalles Completos del Estudiante</ModalHeader>
            <ModalBody className="overflow-y-auto custom-scrollbar grow px-6 sm:px-12 py-8">
                <div className="space-y-12 max-w-5xl mx-auto py-2">
                    {/* Sección Personal */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-border-light pb-2 dark:border-white/5">
                            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                            <h4 className="font-bold text-text-primary dark:text-white/90 uppercase text-xs tracking-wider">Información Personal</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Primer Nombre</label>
                                <p className="text-sm font-semibold text-text-primary dark:text-white/90">{toTitleCase(student.firstName)}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Segundo Nombre</label>
                                <p className="text-sm font-semibold text-text-primary dark:text-white/90">{toTitleCase(student.middleName) || "-"}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Primer Apellido</label>
                                <p className="text-sm font-semibold text-text-primary dark:text-white/90">{toTitleCase(student.lastName)}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Segundo Apellido</label>
                                <p className="text-sm font-semibold text-text-primary dark:text-white/90">{toTitleCase(student.secondLastName) || "-"}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Cédula / ID</label>
                                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{student.identificationPrefix}-{student.identificationNumber}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Sexo</label>
                                <p className="text-sm text-text-primary dark:text-white/90">{toTitleCase(student.sex)}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Estado Civil</label>
                                <p className="text-sm text-text-primary dark:text-white/90">{toTitleCase(student.civilStatus)}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Fecha de Nacimiento</label>
                                <p className="text-sm text-text-primary dark:text-white/90">{student.birthDate}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Teléfono</label>
                                <p className="text-sm text-text-primary dark:text-white/90">{student.phone}</p>
                            </div>
                            <div className="sm:col-span-2 md:col-span-1">
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Email</label>
                                <p className="text-sm text-text-primary dark:text-white/90 break-all">{student.email}</p>
                            </div>
                            <div className="col-span-full">
                                <AddressList 
                                    entityType="person"
                                    entityId={Number(student.personId)}
                                    geoOptions={geoOptions}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sección Académica */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-border-light pb-2 dark:border-white/5">
                            <div className="h-2 w-2 rounded-full bg-brand-500"></div>
                            <h4 className="font-bold text-text-primary dark:text-white/90 uppercase text-xs tracking-wider">Datos Académicos</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Tipo / Rango</label>
                                <p className="text-sm font-bold text-text-primary dark:text-white/90">{toTitleCase(student.studentType)} - {toTitleCase(student.militaryRank)}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">¿Trabaja?</label>
                                <p className="text-sm font-bold text-text-primary dark:text-white/90">{toTitleCase(student.works)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Estado y Fechas */}
                    <div className="rounded-xl bg-bg-secondary dark:bg-white/3 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Estado en Sistema</label>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${student.status ? "bg-blue-100 text-blue-700" : "bg-bg-secondary text-text-secondary"}`}>
                                {student.status ? "Activo" : "En Papelera"}
                            </span>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Fecha Registro</label>
                            <p className="text-[11px] text-text-secondary dark:text-text-tertiary font-medium">{student.enrollmentDate}</p>
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
                    <Button onClick={() => { onEdit(student); onClose(); }} className="flex-1 sm:flex-none">
                        Editar Información
                    </Button>
                )}
            </ModalFooter>

            <SingleReportModal
                isOpen={reportModalOpen}
                onClose={() => setReportModalOpen(false)}
                title="Ficha de Estudiante"
                subtitle={`${toTitleCase(student.firstName)} ${toTitleCase(student.lastName)} - ${student.identificationPrefix}-${student.identificationNumber}`}
                data={student}
                template={(data, verificationHash) => <StudentIndividualPDF data={data} verificationHash={verificationHash} />}
                fileName={`estudiante_${student.identificationNumber}`}
                verificationConfig={{
                  docType: 'ficha-estudiante',
                  metadata: { studentId: student.studentId },
                }}
            />
        </Modal>
    );
}
