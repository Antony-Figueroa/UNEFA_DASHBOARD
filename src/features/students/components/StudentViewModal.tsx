/**
 * @file StudentViewModal.tsx
 * @description Componente de modal para visualizar los detalles completos de un estudiante.
 * Mantiene la consistencia visual con el estándar del sistema.
 */

import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import { StudentRowData } from "../types";

interface StudentViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEdit?: (student: StudentRowData) => void;
    student: StudentRowData | null;
}

export default function StudentViewModal({
    isOpen,
    onClose,
    onEdit,
    student,
}: StudentViewModalProps) {
    if (!student) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} isFullscreen={true} showCloseButton>
            <ModalHeader className="shrink-0 pt-8 px-6 sm:px-12">Detalles Completos del Estudiante</ModalHeader>
            <ModalBody className="overflow-y-auto custom-scrollbar grow px-6 sm:px-12 py-8">
                <div className="space-y-12 max-w-5xl mx-auto py-2">
                    {/* Sección Personal */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-gray-100 pb-2 dark:border-white/5">
                            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                            <h4 className="font-bold text-gray-800 dark:text-white/90 uppercase text-xs tracking-wider">Información Personal</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Primer Nombre</label>
                                <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{student.firstName}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Segundo Nombre</label>
                                <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{student.middleName || "-"}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Primer Apellido</label>
                                <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{student.lastName}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Segundo Apellido</label>
                                <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{student.secondLastName || "-"}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Cédula / ID</label>
                                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{student.identificationPrefix}-{student.identificationNumber}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Sexo</label>
                                <p className="text-sm text-gray-800 dark:text-white/90">{student.sex}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Estado Civil</label>
                                <p className="text-sm text-gray-800 dark:text-white/90">{student.civilStatus}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Fecha de Nacimiento</label>
                                <p className="text-sm text-gray-800 dark:text-white/90">{student.birthDate}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Teléfono</label>
                                <p className="text-sm text-gray-800 dark:text-white/90">{student.phone}</p>
                            </div>
                            <div className="sm:col-span-2 md:col-span-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Email</label>
                                <p className="text-sm text-gray-800 dark:text-white/90 break-all">{student.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Sección Académica */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-gray-100 pb-2 dark:border-white/5">
                            <div className="h-2 w-2 rounded-full bg-brand-500"></div>
                            <h4 className="font-bold text-gray-800 dark:text-white/90 uppercase text-xs tracking-wider">Datos Académicos</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                            <div className="sm:col-span-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Carrera</label>
                                <p className="text-sm font-bold text-gray-800 dark:text-white/90 uppercase">{student.careerName || "No asignada"}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Semestre / Sección</label>
                                <p className="text-sm font-bold text-gray-800 dark:text-white/90">{student.semester} - {student.section}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Régimen</label>
                                <p className="text-sm font-bold text-gray-800 dark:text-white/90">{student.regime}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Tipo / Rango</label>
                                <p className="text-sm font-bold text-gray-800 dark:text-white/90">{student.studentType} - {student.militaryRank}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">¿Trabaja?</label>
                                <p className="text-sm font-bold text-gray-800 dark:text-white/90">{student.works}</p>
                            </div>
                        </div>
                    </div>

                    {/* Estado y Fechas */}
                    <div className="rounded-xl bg-gray-50 dark:bg-white/3 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Estado en Sistema</label>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${student.status ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>
                                {student.status ? "Activo" : "En Papelera"}
                            </span>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Fecha Registro</label>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{student.enrollmentDate}</p>
                        </div>
                    </div>
                </div>
            </ModalBody>
            <ModalFooter className="shrink-0">
                <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
                    Cerrar
                </Button>
                {onEdit && (
                    <Button onClick={() => { onEdit(student); onClose(); }} className="flex-1 sm:flex-none">
                        Editar Información
                    </Button>
                )}
            </ModalFooter>
        </Modal>
    );
}
