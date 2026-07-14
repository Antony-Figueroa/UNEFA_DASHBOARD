/**
 * @file InstitutionViewModal.tsx
 * @description Componente de modal para visualizar los detalles completos de una institución.
 * Mantiene la consistencia visual con el estándar del sistema.
 */

import { useState, useRef, useEffect } from "react";

import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";

import { Institution, InstitutionalResponsible } from "../types";
import { SingleReportModal } from "../../../components/ui/pdf/SingleReportModal";
import { InstitutionIndividualPDF } from "../../../components/ui/pdf/templates/individual";
import { PlusCircle, User, AlertCircle, UserPlus, Search, ChevronDown } from "lucide-react";
import { Dropdown } from "../../../components/ui/dropdown/Dropdown";
import { DropdownItem } from "../../../components/ui/dropdown/DropdownItem";
import { toTitleCase } from "../../../utils/textFormat";

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
    /** List of responsibles for this institution */
    responsibles?: InstitutionalResponsible[];
    /** Callback to register a NEW responsible */
    onAddResponsible?: () => void;
    /** Callback to search and link an EXISTING responsible */
    onSearchResponsible?: () => void;
}

/**
 * Component for viewing the full details of an institution.
 * Presents information in a structured, read-only format.
 */
export default function InstitutionViewModal({
    isOpen,
    onClose,
    onEdit,
    institution,
    responsibles = [],
    onAddResponsible,
    onSearchResponsible,
}: InstitutionViewModalProps) {
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    // Cerrar dropdown al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!institution) return null;

    // Formateo de fecha seguro - maneja múltiples formatos
    const formatDate = (dateValue: string | Date | unknown): string => {
        if (!dateValue) return 'Fecha no disponible';
        
        try {
            let date: Date;
            
            if (dateValue instanceof Date) {
                date = dateValue;
            } else if (typeof dateValue === 'string') {
                // El valor puede venir en diferentes formatos:
                // 1. ISO completo: "2026-03-24T21:52:34.535Z"
                // 2. PostgreSQL: "2026-03-24 21:52:34.535"
                // 3. Formato corto: "24/03/2026 21:52"
                
                // Primero intentamos con el string original
                date = new Date(dateValue);
                
                // Si falla, intentamos normalizar el formato PostgreSQL
                if (isNaN(date.getTime())) {
                    // Reemplazar espacio con T
                    date = new Date(dateValue.replace(' ', 'T'));
                }
                
                // Si sigue fallando, intentamos con formato corto DD/MM/YYYY
                if (isNaN(date.getTime())) {
                    const parts = (dateValue as string).split(/[\/\-\s]/);
                    if (parts.length >= 2) {
                        // Asumir formato DD/MM/YYYY
                        const day = parseInt(String(parts[0]));
                        const month = parseInt(String(parts[1])) - 1; // Mes es 0-indexed
                        const year = parseInt(String(parts[2]));
                        const timeParts = parts.length > 3 ? String(parts[3]).split(':') : ['0', '0'];
                        date = new Date(year, month, day, parseInt(timeParts[0]) || 0, parseInt(timeParts[1]) || 0);
                    }
                }
            } else {
                return 'Fecha no disponible';
            }
            
            if (isNaN(date.getTime())) {
                return 'Fecha no disponible';
            }
            
            return date.toLocaleDateString('es-VE', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'Fecha no disponible';
        }
    };

    const formattedDate = formatDate(institution.registrationDate);

    const canAddResponsible = !!(onAddResponsible || onSearchResponsible);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="5xl" showCloseButton>
            <ModalHeader className="shrink-0 pt-8 px-6 sm:px-12">Detalles de Empresa o Institución</ModalHeader>
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
                                <p className="text-sm font-semibold text-text-primary dark:text-white/90">{toTitleCase(institution.name)}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">RIF</label>
                                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{institution.rif}</p>
                            </div>
                            <div className="sm:col-span-3">
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Dirección Fiscal</label>
                                <p className="text-sm font-bold text-text-primary dark:text-white/90">{institution.fiscalAddress || "Sin dirección"}</p>
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
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Tipo de Empresa o Institución</label>
                                <p className="text-sm font-bold text-text-primary dark:text-white/90">{toTitleCase(institution.institutionType)}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Tipos de Práctica</label>
                                <p className="text-sm font-bold text-text-primary dark:text-white/90">{toTitleCase(institution.practiceTypes?.join(", ")) || "Sin asignar"}</p>
                            </div>


                            {/* Sección: Responsable Asignado */}
                            <div className="sm:col-span-2">
                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Responsable Asignado</label>
                                <div className="flex items-center gap-2 mt-1">
                                    {responsibles && responsibles.length > 0 ? (
                                        <div className="flex flex-col gap-2">
                                            {responsibles.map((resp) => (
                                                <div key={resp.responsibleId} className="flex items-center gap-2">
                                                    <div className="size-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                                        <User className="size-3 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <p className="text-sm font-semibold text-text-primary dark:text-white/90">
                                                        {toTitleCase(`${resp.firstName} ${resp.lastName}`)}
                                                        <span className="text-[10px] font-medium text-text-tertiary ml-2 italic">
                                                            ({resp.institutions?.find(inst => inst.institutionId === institution?.institutionId)?.cargo || 'Sin cargo'})
                                                        </span>
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning-50 dark:bg-warning-500/10 border border-warning-200 dark:border-warning-500/20">
                                                <AlertCircle className="size-3.5 text-warning-600 dark:text-warning-400" />
                                                <span className="text-xs font-semibold text-warning-700 dark:text-warning-300 uppercase tracking-wider">No tiene responsable</span>
                                            </div>

                                            {/* Botón + con Dropdown de opciones */}
                                            {canAddResponsible && (
                                                <div className="relative">
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                                    className="dropdown-toggle"
                                                    endIcon={<ChevronDown className="w-4 h-4 ml-1 opacity-50" />}
                                                  >
                                                    <PlusCircle className="w-4 h-4 mr-1" />
                                                    Agregar
                                                  </Button>
                                                  
                                                  <Dropdown 
                                                    isOpen={dropdownOpen} 
                                                    onClose={() => setDropdownOpen(false)}
                                                    align="right"
                                                    className="w-56"
                                                  >
                                                    {onSearchResponsible && (
                                                        <DropdownItem
                                                          onClick={() => {
                                                            setDropdownOpen(false);
                                                            onSearchResponsible();
                                                          }}
                                                          icon={<Search className="w-4 h-4" />}
                                                        >
                                                          Buscar Existente
                                                        </DropdownItem>
                                                    )}
                                                    {onAddResponsible && (
                                                        <DropdownItem
                                                          onClick={() => {
                                                            setDropdownOpen(false);
                                                            onAddResponsible();
                                                          }}
                                                          icon={<UserPlus className="w-4 h-4" />}
                                                        >
                                                          Registrar Nuevo
                                                        </DropdownItem>
                                                    )}
                                                  </Dropdown>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
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
                    <Button onClick={() => { onEdit(institution); onClose(); }} className="flex-1 sm:flex-none">
                        Editar Información
                    </Button>
                )}
            </ModalFooter>

            <SingleReportModal
                isOpen={reportModalOpen}
                onClose={() => setReportModalOpen(false)}
                title="Ficha de Empresa o Institución"
                subtitle={`${toTitleCase(institution.name)} - ${institution.rif}`}
                data={institution}
                template={(data, verificationHash) => <InstitutionIndividualPDF data={data} verificationHash={verificationHash} />}
                fileName={`institucion_${institution.rif?.replace(/-/g, '') || institution.institutionId}`}
                verificationConfig={{
                  docType: 'ficha-institucion',
                  metadata: { institutionId: institution.institutionId },
                }}
            />
        </Modal>
    );
}
