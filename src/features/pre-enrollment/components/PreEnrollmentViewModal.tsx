/**
 * @file PreEnrollmentViewModal.tsx
 * @description Componente de modal para visualizar los detalles completos de una pre-inscripción.
 */

import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import { PreEnrollmentRowData } from "../types";

interface PreEnrollmentViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEdit?: (item: PreEnrollmentRowData) => void;
    item: PreEnrollmentRowData | null;
}

export default function PreEnrollmentViewModal({
    isOpen,
    onClose,
    onEdit,
    item,
}: PreEnrollmentViewModalProps) {
    if (!item) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} isFullscreen={true} showCloseButton>
            <ModalHeader className="shrink-0 pt-8 px-6 sm:px-12">Detalles de Pre-Inscripción</ModalHeader>
            <ModalBody className="overflow-y-auto custom-scrollbar grow px-6 sm:px-12 py-8">
                <div className="space-y-12 max-w-5xl mx-auto py-2">
                    {/* Sección Estudiante */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-gray-100 pb-2 dark:border-white/5">
                            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                            <h4 className="font-bold text-gray-800 dark:text-white/90 uppercase text-xs tracking-wider">Información del Estudiante</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Nombre Completo</label>
                                <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{item.studentName}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Cédula / ID</label>
                                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{item.identificationPrefix}-{item.identificationNumber}</p>
                            </div>
                        </div>
                    </div>

                    {/* Sección Pre-Inscripción */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-gray-100 pb-2 dark:border-white/5">
                            <div className="h-2 w-2 rounded-full bg-brand-500"></div>
                            <h4 className="font-bold text-gray-800 dark:text-white/90 uppercase text-xs tracking-wider">Datos de la Pre-Inscripción</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Período Académico</label>
                                <p className="text-sm font-bold text-gray-800 dark:text-white/90">{item.period}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Tipo de Práctica</label>
                                <p className="text-sm font-bold text-gray-800 dark:text-white/90">{item.practiceType}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Código de Matrícula</label>
                                <p className="text-sm font-bold text-brand-500">{item.enrollmentCode}</p>
                            </div>
                        </div>
                    </div>

                    {/* Estado y Fechas */}
                    <div className="rounded-xl bg-gray-50 dark:bg-white/3 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Estado de Pre-Inscripción</label>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.status ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                {item.status ? "Activa" : "Inactiva"}
                            </span>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Fecha de Registro</label>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{item.preEnrollmentDate}</p>
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
