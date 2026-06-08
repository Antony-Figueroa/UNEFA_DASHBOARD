/**
 * @file TutorViewModal.tsx
 * @description Componente de modal para visualizar los detalles completos de un tutor.
 * Mantiene la consistencia visual con el estándar del sistema.
 */

import { useState, useEffect } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import AsyncButton from "../../../components/ui/button/AsyncButton";
import Badge from "../../../components/ui/badge/Badge";
import { TutorRowData } from "../types";
import { getCareers } from "../../careers/services/careersService";
import { unwrapData } from "../../../api/crudServiceFactory";
import { Career } from "../../careers/types";
import { SingleReportModal } from "../../../components/ui/pdf/SingleReportModal";
import { TutorIndividualPDF, TutorCertificatePDF } from "../../../components/ui/pdf/templates/individual";
import InputField from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import FlatpickrDatePicker from "../../../components/form/FlatpickrDatePicker";

/**
 * Props for the TutorViewModal component.
 */
interface TutorViewModalProps {
    /** Whether the modal is open */
    isOpen: boolean;
    /** Function to call when closing the modal */
    onClose: () => void;
    /** Function to call when editing the tutor */
    onEdit?: (tutor: TutorRowData) => void;
    /** The tutor object to display */
    tutor: TutorRowData | null;
}

const getProfessionColor = (profession: string): "primary" | "success" | "error" | "warning" | "info" => {
    const colors: ("primary" | "success" | "error" | "warning" | "info")[] = ["primary", "success", "error", "warning", "info"];
    let hash = 0;
    for (let i = 0; i < (profession || "").length; i++) {
        hash = (profession || "").charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

/**
 * Modal component for viewing complete tutor details.
 * 
 * @param props - Component props.
 * @returns The TutorViewModal component.
 */
export default function TutorViewModal({
    isOpen,
    onClose,
    onEdit,
    tutor,
}: TutorViewModalProps) {
    const [careers, setCareers] = useState<Career[]>([]);
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [constancyModalOpen, setConstancyModalOpen] = useState(false);

    // Estados para campos editables de la constancia
    const [decanaName, setDecanaName] = useState("MARBELYS DEL VALLE RIVERO");
    const [decanaTitle, setDecanaTitle] = useState("DECANA");
    const [academicHours, setAcademicHours] = useState("480");
    const [period, setPeriod] = useState("2-2022");
    const [startDate, setStartDate] = useState("2022-09-26");
    const [endDate, setEndDate] = useState("2023-02-13");

    // Función auxiliar para formatear fecha de YYYY-MM-DD a DD/MM/YYYY para el PDF
    const formatDateForPDF = (dateStr: string) => {
        if (!dateStr) return "";
        const [year, month, day] = dateStr.split("-");
        return `${day}/${month}/${year}`;
    };

    useEffect(() => {
        if (isOpen) {
            getCareers().then(data => setCareers(unwrapData(data))).catch(console.error);
        }
    }, [isOpen]);

    if (!tutor) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="5xl" showCloseButton>
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
                                <p className="text-sm font-semibold text-text-primary dark:text-white/90 uppercase">{tutor.firstName}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Segundo Nombre</label>
                                <p className="text-sm font-semibold text-text-primary dark:text-white/90 uppercase">{tutor.middleName || "-"}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Primer Apellido</label>
                                <p className="text-sm font-semibold text-text-primary dark:text-white/90 uppercase">{tutor.lastName}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Segundo Apellido</label>
                                <p className="text-sm font-semibold text-text-primary dark:text-white/90 uppercase">{tutor.secondLastName || "-"}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Cédula / ID</label>
                                <p className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase">{tutor.identificationPrefix}-{tutor.identificationNumber}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Sexo</label>
                                <p className="text-sm text-text-primary dark:text-white/90 uppercase">{tutor.sex}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Teléfono</label>
                                <p className="text-sm text-text-primary dark:text-white/90">{tutor.phone}</p>
                            </div>
                            <div className="sm:col-span-2 md:col-span-1">
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Email</label>
                                <p className="text-sm text-text-primary dark:text-white/90 break-all uppercase">{tutor.email}</p>
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
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Título</label>
                                <p className="text-sm font-bold text-text-primary dark:text-white/90 uppercase">{tutor.profession}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Grado de Instrucción</label>
                                <p className="text-sm font-bold text-text-primary dark:text-white/90 uppercase">{tutor.titulo}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Condición</label>
                                <p className="text-sm font-bold text-text-primary dark:text-white/90 uppercase">{tutor.condition}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Dedicación</label>
                                <p className="text-sm font-bold text-text-primary dark:text-white/90 uppercase">{tutor.dedication}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Categoría</label>
                                <p className="text-sm font-bold text-text-primary dark:text-white/90 uppercase">{tutor.category}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Tipo de Práctica</label>
                                <div className="flex flex-wrap gap-1">
                                    {tutor.practiceTypes && tutor.practiceTypes.length > 0 ? (
                                        tutor.practiceTypes.map((pt, i) => (
                                            <Badge key={i} color={getProfessionColor(pt)} variant="light" size="sm" className="uppercase">
                                                {pt}
                                            </Badge>
                                        ))
                                    ) : (
                                        <span className="text-xs text-text-tertiary font-medium">N/A</span>
                                    )}
                                </div>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-2">Carreras que Atiende</label>
                                <div className="flex flex-col gap-2 max-w-md">
                                    {tutor.carreras && tutor.carreras.length > 0 ? (
                                        tutor.carreras.map((id, i) => {
                                            const career = careers.find(c => String(c.careerId) === String(id));
                                            return (
                                                <Badge 
                                                    key={i} 
                                                    color="info" 
                                                    variant="light" 
                                                    size="md" 
                                                    className="uppercase w-full justify-start py-2 px-4 h-auto text-left"
                                                >
                                                    {career ? career.careerName : `ID: ${id}`}
                                                </Badge>
                                            );
                                        })
                                    ) : (
                                        <span className="text-xs text-text-tertiary font-medium italic">No hay carreras asignadas</span>
                                    )}
                                </div>
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
                    Reporte
                </Button>
                <Button
                    variant="outline"
                    onClick={() => setConstancyModalOpen(true)}
                    className="flex-1 sm:flex-none"
                    startIcon={
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    }
                >
                    Constancia
                </Button>
                {onEdit && (
                    <AsyncButton onClick={async () => { onEdit(tutor); onClose(); }} className="flex-1 sm:flex-none">
                        Editar Información
                    </AsyncButton>
                )}
            </ModalFooter>

            <SingleReportModal
                isOpen={reportModalOpen}
                onClose={() => setReportModalOpen(false)}
                title="Ficha de Tutor Académico"
                subtitle={`${tutor.firstName} ${tutor.lastName} - ${tutor.identificationPrefix}-${tutor.identificationNumber}`}
                data={tutor}
                template={(data) => <TutorIndividualPDF data={data} />}
                fileName={`tutor_${tutor.identificationNumber}`}
            />
            <SingleReportModal
                isOpen={constancyModalOpen}
                onClose={() => setConstancyModalOpen(false)}
                title="Constancia de Tutor Académico"
                subtitle={`${tutor.firstName} ${tutor.lastName}`}
                data={tutor}
                template={(data) => (
                    <TutorCertificatePDF 
                        data={data} 
                        decanaName={decanaName}
                        decanaTitle={decanaTitle}
                        academicHours={academicHours}
                        period={period}
                        startDate={formatDateForPDF(startDate)}
                        endDate={formatDateForPDF(endDate)}
                    />
                )}
                fileName={`constancia_tutor_${tutor.identificationNumber}`}
                extraSidebarContent={
                    <div className="space-y-4">
                        <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 mb-4">
                            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-1">Personalización</p>
                            <p className="text-[11px] text-blue-600/70 leading-relaxed italic">
                                Ajuste los datos de la autoridad y del periodo antes de generar el documento final.
                            </p>
                        </div>
                        
                        <div className="space-y-3">
                            <div>
                                <Label className="text-[10px]! mb-1!">Nombre de Autoridad (Quien Suscribe)</Label>
                                <InputField 
                                    value={decanaName}
                                    onChange={(e) => setDecanaName(e.target.value)}
                                    placeholder="Nombre completo"
                                    className="h-9! text-xs!"
                                />
                            </div>

                            <div>
                                <Label className="text-[10px]! mb-1!">Cargo/Título</Label>
                                <InputField 
                                    value={decanaTitle}
                                    onChange={(e) => setDecanaTitle(e.target.value)}
                                    placeholder="Ej: DECANA"
                                    className="h-9! text-xs!"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-[10px]! mb-1!">Horas Académicas</Label>
                                    <InputField 
                                        value={academicHours}
                                        onChange={(e) => setAcademicHours(e.target.value)}
                                        placeholder="480"
                                        className="h-9! text-xs!"
                                    />
                                </div>
                                <div>
                                    <Label className="text-[10px]! mb-1!">Periodo</Label>
                                    <InputField 
                                        value={period}
                                        onChange={(e) => setPeriod(e.target.value)}
                                        placeholder="2-2022"
                                        className="h-9! text-xs!"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-[10px]! mb-1!">F. Inicio</Label>
                                    <FlatpickrDatePicker 
                                        value={startDate}
                                        onChange={(date) => setStartDate(date)}
                                        placeholder="Inicio"
                                        className="h-9! text-xs!"
                                    />
                                </div>
                                <div>
                                    <Label className="text-[10px]! mb-1!">F. Fin</Label>
                                    <FlatpickrDatePicker 
                                        value={endDate}
                                        onChange={(date) => setEndDate(date)}
                                        placeholder="Fin"
                                        className="h-9! text-xs!"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                }
            />
        </Modal>
    );
}
