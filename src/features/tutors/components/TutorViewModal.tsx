/**
 * @file TutorViewModal.tsx
 * @description Componente de modal para visualizar los detalles completos de un tutor.
 * Mantiene la consistencia visual con el estándar del sistema.
 */

import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import { TutorRowData } from "../types";

interface TutorViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEdit?: (tutor: TutorRowData) => void;
    tutor: TutorRowData | null;
}

export default function TutorViewModal({
    isOpen,
    onClose,
    onEdit,
    tutor,
}: TutorViewModalProps) {
    if (!tutor) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} isFullscreen={true} showCloseButton>
            <ModalHeader className="shrink-0 pt-8 px-6 sm:px-12">Detalles Completos del Tutor</ModalHeader>
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
                                <p className="text-sm font-semibold text-text-primary dark:text-white/90">{tutor.firstName}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Segundo Nombre</label>
                                <p className="text-sm font-semibold text-text-primary dark:text-white/90">{tutor.middleName || "-"}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Primer Apellido</label>
                                <p className="text-sm font-semibold text-text-primary dark:text-white/90">{tutor.lastName}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Segundo Apellido</label>
                                <p className="text-sm font-semibold text-text-primary dark:text-white/90">{tutor.secondLastName || "-"}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Cédula / ID</label>
                                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{tutor.identificationPrefix}-{tutor.identificationNumber}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Sexo</label>
                                <p className="text-sm text-text-primary dark:text-white/90">{tutor.sex}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Teléfono</label>
                                <p className="text-sm text-text-primary dark:text-white/90">{tutor.phone}</p>
                            </div>
                            <div className="sm:col-span-2 md:col-span-1">
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Email</label>
                                <p className="text-sm text-text-primary dark:text-white/90 break-all">{tutor.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Sección Profesional */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-border-light pb-2 dark:border-white/5">
                            <div className="h-2 w-2 rounded-full bg-brand-500"></div>
                            <h4 className="font-bold text-text-primary dark:text-white/90 uppercase text-xs tracking-wider">Datos Profesionales</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Profesión</label>
                                <p className="text-sm font-bold text-text-primary dark:text-white/90 uppercase">{tutor.profession}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Condición</label>
                                <p className="text-sm font-bold text-text-primary dark:text-white/90">{tutor.condition}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Dedicación</label>
                                <p className="text-sm font-bold text-text-primary dark:text-white/90">{tutor.dedication}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Categoría</label>
                                <p className="text-sm font-bold text-text-primary dark:text-white/90">{tutor.category}</p>
                            </div>
                        </div>
                    </div>

                    {/* Estado y Fechas */}
                    <div className="rounded-xl bg-bg-secondary dark:bg-white/3 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Estado en Sistema</label>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${tutor.status ? "bg-blue-100 text-blue-700" : "bg-bg-secondary text-text-secondary"}`}>
                                {tutor.status ? "Activo" : "En Papelera"}
                            </span>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Fecha Registro</label>
                            <p className="text-[11px] text-text-secondary dark:text-text-tertiary font-medium">{tutor.registrationDate}</p>
                        </div>
                    </div>
                </div>
            </ModalBody>
            <ModalFooter className="shrink-0">
                <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
                    Cerrar
                </Button>
                {onEdit && (
                    <Button onClick={() => { onEdit(tutor); onClose(); }} className="flex-1 sm:flex-none">
                        Editar Información
                    </Button>
                )}
            </ModalFooter>
        </Modal>
    );
}
