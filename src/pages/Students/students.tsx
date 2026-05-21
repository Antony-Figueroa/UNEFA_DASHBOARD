/**
 * @file students.tsx
 * @description Página principal para la gestión del módulo de Estudiantes.
 * Orquesta la visualización de datos en tablas, la gestión de estados (activos/inactivos),
 * y las operaciones CRUD (Crear, Leer, Actualizar, Eliminar) mediante modales y hooks especializados.
 */

import { useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import UnifiedDialog from "../../components/ui/dialog/UnifiedDialog";
import { DialogVariant } from "../../components/ui/dialog/DialogConfig";
import Button from "../../components/ui/button/Button";
import { SkeletonLoader, TitleSkeleton, BreadcrumbSkeleton, TablePageSkeleton } from "../../components/ui/skeleton";
import { PlusCircleIcon, FileText, Download } from "lucide-react";
import { DownloadIcon } from "../../icons";
import StudentTable from "../../features/students/components/StudentTable";
import StudentModal from "../../features/students/components/StudentModal";
import StudentViewModal from "../../features/students/components/StudentViewModal";
import ImportStudentsModal from "../../features/students/components/ImportStudentsModal";
import { PDFPreviewModal } from "../../components/ui/pdf/PDFPreviewModal";
import { StudentPDF } from "../../components/ui/pdf/templates/StudentPDF";
import UnifiedReportModal from "../../components/common/UnifiedReportModal";
import { useStudents } from "../../features/students/hooks/useStudents";
import {
    Student,
    StudentRowData,
    CreateStudentPayload,
    UpdateStudentPayload
} from "../../features/students/types";
import { useCareers } from "../../features/careers/hooks/useCareers";
import { useInternshipTypes } from "../../features/internship-types/hooks/useInternshipTypes";
import CareerModal from "../../features/careers/components/CareerModal";
import { useLists } from "../../features/lists/hooks/useLists";
import { ListValue } from "../../features/lists/types";
import { formatDateTime } from "../../utils/date";
import { exportToExcel, ExportColumn } from "../../utils/excel";
import { matchSearch } from "../../utils/searchNormalizer";

/**
 * Transforma un objeto de tipo Student (dominio) a StudentRowData (vista).
 * Realiza el formateo de fechas y concatenación de nombres.
 * 
 * @param s - Estudiante en formato de dominio.
 * @returns Estudiante en formato de fila para la tabla.
 */
const formatStudentToRow = (s: Student): StudentRowData => ({
    ...s,
    enrollmentDate: formatDateTime(s.enrollmentDate),
    fullNames: `${s.firstName} ${s.middleName ? s.middleName + " " : ""}${s.lastName} ${s.secondLastName ? s.secondLastName : ""}`.trim(),
});

/**
 * Página principal del módulo de Estudiantes.
 * Gestiona el listado, creación, edición y visualización de estudiantes.
 */
export default function StudentsPage() {
    const [pageLoading, setPageLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const { fetchMultipleLists } = useLists();
    const [dynamicLists, setDynamicLists] = useState<Record<string, ListValue[]>>({});

    // Event listener for Command Palette - open create modal
    useEffect(() => {
        if (location.state?.openCreateModal) {
            setEditingStudent(null);
            setIsModalOpen(true);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate]);

    useEffect(() => {
        const loadLists = async () => {
            try {
                const lists = await fetchMultipleLists([
                    "Nacionalidad",
                    "Sexo",
                    "PREFIJO",
                    "Registro Civil",
                    "Regimen/Turno",
                    "Tipo de estudiante",
                    "Trabajo",
                    "Rango Militar"
                ]);
                setDynamicLists(lists);
            } catch (error) {
                console.error("Error loading dynamic lists:", error);
            } finally {
                setPageLoading(false);
            }
        };
        loadLists();
    }, [fetchMultipleLists]);

    const {
        students,
        status,
        loadingAction,
        error,
        addStudent,
        editStudent,
        toggleStatus,
        bulkRemoveStudents,
        bulkRestoreStudents,
        refreshStudents,
    } = useStudents();

    // Event listener for opening edit modal from StudentModal
    useEffect(() => {
        const handleOpenEditStudent = (e: Event) => {
            const customEvent = e as CustomEvent;
            const studentId = customEvent.detail;
            const student = Array.isArray(students) ? students.find((s) => s.studentId === studentId) : null;
            if (student) {
                setEditingStudent(student);
                setIsModalOpen(true);
            }
        };

        window.addEventListener('open-edit-student', handleOpenEditStudent);
        return () => {
            window.removeEventListener('open-edit-student', handleOpenEditStudent);
        };
    }, [students]);

    const { careers, addCareer } = useCareers();
    const { activeOptions: activeInternshipOptions, fetchAll: fetchInternshipTypes } = useInternshipTypes();

    const [activeTab, setActiveTab] = useState<"Activas" | "Inactivas">("Activas");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [viewStudent, setViewStudent] = useState<StudentRowData | null>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
    const [pdfSearchTerm, setPdfSearchTerm] = useState("");
    const [isCareerModalOpen, setIsCareerModalOpen] = useState(false);
    const [dateRangeFilter] = useState<{ start: string; end: string } | null>(null);

    type ConfirmationInfo = {
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        confirmText: string;
        variant: DialogVariant;
    };

    const [confirmation, setConfirmation] = useState<ConfirmationInfo | null>(null);

    const filtered = useMemo(() => {
        if (!Array.isArray(students)) return [];

        let result = students.filter((s) => (activeTab === "Activas" ? !!s.status : !s.status));

        if (dateRangeFilter && dateRangeFilter.start && dateRangeFilter.end) {
            const startDate = new Date(dateRangeFilter.start);
            const endDate = new Date(dateRangeFilter.end);

            if (startDate <= endDate) {
                result = result.filter((s) => {
                    if (!s.enrollmentDate) return false;
                    const enrollDate = new Date(s.enrollmentDate);
                    return enrollDate >= startDate && enrollDate <= endDate;
                });
            }
        }

        return result.map(formatStudentToRow);
    }, [students, activeTab, dateRangeFilter]);

    /**
     * Datos filtrados específicamente para el reporte PDF de Estudiantes.
     */
    const pdfFilteredData = useMemo(() => {
        return (Array.isArray(students) ? students : [])
            .filter((s) => {
                const fullName = `${s.firstName} ${s.middleName || ""} ${s.lastName} ${s.secondLastName || ""}`;
                const matchesSearch = !pdfSearchTerm.trim() ||
                    matchSearch(s.identificationNumber ?? '', pdfSearchTerm) ||
                    matchSearch(fullName, pdfSearchTerm);

                const matchesStatus = !!s.status;

                return matchesSearch && matchesStatus;
            });
    }, [students, pdfSearchTerm]);

    /**
     * Inicia el flujo de creación de un nuevo estudiante.
     */
    const handleCreate = () => {
        setEditingStudent(null);
        setIsModalOpen(true);
    };

    // Maneja la transición de "crear nuevo" a "editar existente" cuando se detecta duplicado
    const handleEditFromExisting = (existingStudent: any) => {
        // Cerrar el modal inmediatamente
        setIsModalOpen(false);
        // Delay para asegurar que el modal se cierre antes de limpiar
        setTimeout(() => {
            setEditingStudent(existingStudent);
            setIsModalOpen(true);
        }, 200);
    };

    // Cleanup del existingStudent cuando se cierra el modal
    const handleCloseModal = () => {
        setIsModalOpen(false);
        // Delay para asegurar que el modal se cierre antes de limpiar
        setTimeout(() => {
            setEditingStudent(null);
        }, 100);
    };

    const handleExportExcel = () => {
        const columns: ExportColumn<Record<string, unknown>>[] = [
            { key: 'identificationNumber', label: 'Cédula' },
            { key: 'fullNames', label: 'Nombre Completo' },
            { key: 'email', label: 'Correo' },
            { key: 'phone', label: 'Teléfono' },
            { key: 'careerName', label: 'Carrera' },
            { key: 'regime', label: 'Régimen' },
            { key: 'semester', label: 'Semestre' },
            { key: 'enrollmentDate', label: 'Fecha de Inscripción' },
        ];
        exportToExcel(filtered as unknown as Record<string, unknown>[], columns, 'estudiantes', 'Estudiantes');
    };

    useEffect(() => {
        const handleAddCareer = () => setIsCareerModalOpen(true);
        window.addEventListener("students:addCareer", handleAddCareer);
        
        // Escuchar cuando una carrera es creada o editada para recargar la lista
        const handleCareerSaved = () => {
            // useCareers automatically refreshes, but we can trigger a refresh if needed
        };
        window.addEventListener("career:saved", handleCareerSaved);
        
        return () => {
            window.removeEventListener("students:addCareer", handleAddCareer);
            window.removeEventListener("career:saved", handleCareerSaved);
        };
    }, []);

    useEffect(() => {
        fetchInternshipTypes();
    }, [fetchInternshipTypes]);
    /**
     * Inicia el flujo de edición para un estudiante seleccionado.
     * 
     * @param row - Datos del estudiante en formato de fila.
     */
    const handleEdit = (row: StudentRowData) => {
        const original = Array.isArray(students) ? students.find((s) => s.studentId === row.studentId) : null;
        setEditingStudent(original || null);
        setIsModalOpen(true);
    };

    /**
     * Maneja el guardado (creación o actualización) de un estudiante.
     * 
     * @param payload - Datos del estudiante a guardar.
     */
    const handleSave = async (payload: CreateStudentPayload | UpdateStudentPayload) => {
        const isEditing = !!editingStudent;
        try {
            if (isEditing && editingStudent) {
                await editStudent({
                    ...payload,
                    studentId: editingStudent.studentId
                } as UpdateStudentPayload);
            } else {
                await addStudent(payload as CreateStudentPayload);
            }
            setIsModalOpen(false);
        } catch (e) {
            console.error("[StudentsPage] Error al guardar:", e);
        }
    };

    /**
     * Maneja el cambio de estado (activar/inactivar) de un estudiante.
     * 
     * @param student - Estudiante al que se le cambiará el estado.
     */
    const handleToggleStatus = (student: StudentRowData) => {
        const original = Array.isArray(students) ? students.find((s) => s.studentId === student.studentId) : null;
        if (!original) return;

        const isDeactivating = original.status;
        const actionVerb = isDeactivating ? "desactivar" : "activar";
        const confirmTitle = isDeactivating ? "Confirmar Desactivación" : "Confirmar Activación";
        const variant = isDeactivating ? "error" : "success";
        const confirmText = isDeactivating ? "Desactivar" : "Activar";

        setConfirmation({
            isOpen: true,
            title: confirmTitle,
            message: `¿Estás seguro de que deseas ${actionVerb} al estudiante "${student.fullNames}"?`,
            onConfirm: async () => {
                try {
                    await toggleStatus(original);
                } catch (error) {
                    console.error("[StudentsPage] Error toggling status:", error);
                } finally {
                    setConfirmation(null);
                }
            },
            confirmText: confirmText,
            variant: variant as DialogVariant,
        });
    };

    /**
     * Maneja la eliminación masiva de estudiantes seleccionados.
     * 
     * @param ids - Listado de IDs de estudiantes a inactivar.
     */
    const handleBulkDelete = (ids: string[]) => {
        setConfirmation({
            isOpen: true,
            title: "Confirmar Eliminación Masiva",
            message: `¿Estás seguro de que deseas desactivar ${ids.length} estudiantes seleccionados?`,
            onConfirm: async () => {
                try {
                    await bulkRemoveStudents(ids);
                    setSelectedIds([]);
                } catch (e) {
                    console.error("[StudentsPage] Error en eliminación masiva:", e);
                } finally {
                    setConfirmation(null);
                }
            },
            confirmText: "Desactivar Todos",
            variant: "error",
        });
    };

    /**
     * Maneja la restauración masiva de estudiantes seleccionados.
     * 
     * @param ids - Listado de IDs de estudiantes a restaurar.
     */
    const handleBulkRestore = (ids: string[]) => {
        setConfirmation({
            isOpen: true,
            title: "Confirmar Restauración Masiva",
            message: `¿Estás seguro de que deseas restaurar ${ids.length} estudiantes seleccionados?`,
            onConfirm: async () => {
                try {
                    await bulkRestoreStudents(ids);
                    setSelectedIds([]);
                } catch (e) {
                    console.error("[StudentsPage] Error en restauración masiva:", e);
                } finally {
                    setConfirmation(null);
                }
            },
            confirmText: "Restaurar Todos",
            variant: "info",
        });
    };

    /**
     * Maneja la exportación de un estudiante al módulo de Pre-Inscripción.
     * 
     * @param student - Estudiante a exportar.
     */
    const handleExportToPreEnrollment = (student: StudentRowData) => {
        setConfirmation({
            isOpen: true,
            title: "Exportar a Pre-Inscripción",
            message: `¿Desea llevar los datos de ${student.fullNames} a la ventana de Pre-Inscripción?`,
            confirmText: "Exportar",
            variant: "info",
            onConfirm: () => {
                setConfirmation(null);
                // Navegar a la página de pre-inscripción pasando la cédula en el estado
                navigate("/pre-enrollment", {
                    state: { exportStudentCi: student.identificationNumber }
                });
            }
        });
    };

    return (
        <>
            <PageMeta title="Gestión de Estudiantes" description="Administración de estudiantes" />

            <SkeletonLoader isLoading={pageLoading} skeleton={<BreadcrumbSkeleton />} id="students-breadcrumb">
                <PageBreadcrumb pageTitle="Estudiantes" />
            </SkeletonLoader>

            <div className="stagger-delay">


                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <SkeletonLoader isLoading={pageLoading} skeleton={<TitleSkeleton />} id="students-title">
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-bold text-text-primary dark:text-text-emphasis">Listado de Estudiantes</h2>
                            </div>
                            <p className="mt-1 text-sm text-text-secondary dark:text-text-tertiary">Gestiona la información y estado académico de los estudiantes.</p>
                        </SkeletonLoader>
                    </div>

                    {!pageLoading && (
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setIsPDFModalOpen(true)}
                                startIcon={<FileText className="h-5 w-5" />}
                            >
                                Reporte
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setIsImportModalOpen(true)}
                                startIcon={<Download className="h-5 w-5" />}
                            >
                                Importar
                            </Button>
                            <Button onClick={handleCreate} startIcon={<PlusCircleIcon className="h-5 w-5" />}>
                                Nuevo Estudiante
                            </Button>
                        </div>
                    )}
                </div>
                {/* Contenido principal */}
                <div className="space-y-6">
                    {/* Tabla de Estudiantes */}
                    <ComponentCard title={activeTab === "Activas" ? "Estudiantes Activos" : "Estudiantes Inactivos"}>
                        <div className="mb-6 flex border-b border-border-light dark:border-border-dark">
                            <button
                                onClick={() => setActiveTab("Activas")}
                                className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === "Activas" ? "text-brand-500" : "text-text-secondary hover:text-text-emphasis"
                                    }`}
                            >
                                Activos
                                {activeTab === "Activas" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-500 animate-slideInLeft" />}
                            </button>
                            <button
                                onClick={() => setActiveTab("Inactivas")}
                                className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === "Inactivas" ? "text-brand-500" : "text-text-secondary hover:text-text-emphasis"
                                    }`}
                            >
                                Inactivos
                                {activeTab === "Inactivas" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-500 animate-slideInLeft" />}
                            </button>
                        </div>


                        <SkeletonLoader isLoading={pageLoading || status === "loading"} skeleton={<TablePageSkeleton rows={5} />} id="students-table">
                            <StudentTable
                                data={filtered}
                                status={status}
                                error={error}
                                activeTab={activeTab}
                                onEdit={handleEdit}
                                onToggleStatus={handleToggleStatus}
                                onExportToPreEnrollment={handleExportToPreEnrollment}
                                onView={setViewStudent}
                                onBulkDelete={handleBulkDelete}
                                onBulkRestore={handleBulkRestore}
                                selectedIds={selectedIds}
                                onSelectionChange={setSelectedIds}
                                inactiveMode={activeTab === "Inactivas"}
                                loading={loadingAction}
                            />
                        </SkeletonLoader>
                    </ComponentCard>

                    <StudentModal
                        isOpen={isModalOpen}
                        onClose={handleCloseModal}
                        onSave={handleSave}
                        editingStudent={editingStudent}
                        dynamicLists={dynamicLists}
                        isLoading={loadingAction}
                        onEditExisting={handleEditFromExisting}
                    />
                    <CareerModal
                        isOpen={isCareerModalOpen}
                        onClose={() => setIsCareerModalOpen(false)}
                        onSave={async (payload) => {
                            try {
                                const created = await addCareer(payload);
                                if (created?.careerId !== undefined) {
                                    const evt = new CustomEvent("students:setCareerId", { detail: String(created.careerId) });
                                    window.dispatchEvent(evt);
                                }
                                setIsCareerModalOpen(false);
                            } catch (e) {
                                console.error("[StudentsPage] Error creando carrera:", e);
                            }
                        }}
                        editingCareer={null}
                        internshipOptions={activeInternshipOptions}
                        isLoading={loadingAction}
                        hasPendingEvaluations={false}
                        isInUse={false}
                        existingCareers={careers}
                        onAddInternshipType={() => { }}
                        lastCreatedInternshipTypeId={null}
                        onConsumeLastCreatedInternshipType={() => { }}
                    />

                    <StudentViewModal
                        isOpen={!!viewStudent}
                        onClose={() => setViewStudent(null)}
                        onEdit={handleEdit}
                        student={viewStudent}
                    />

                    <ImportStudentsModal
                        isOpen={isImportModalOpen}
                        onClose={() => setIsImportModalOpen(false)}
                        onImportComplete={(created, updated) => {
                            // Refresh students after import
                            refreshStudents();
                        }}
                    />

                    <UnifiedReportModal
                        isOpen={isPDFModalOpen}
                        onClose={() => setIsPDFModalOpen(false)}
                        onExportExcel={handleExportExcel}
                    />

                    {/* Modal de Previsualización PDF */}
                    <PDFPreviewModal
                        isOpen={isPDFModalOpen}
                        onClose={() => setIsPDFModalOpen(false)}
                        title="Reporte de Estudiantes Activos"
                        data={pdfFilteredData}
                        template={(data) => <StudentPDF data={data} />}
                        fileName={`estudiantes-activos-${new Date().toISOString().split('T')[0]}.pdf`}
                        searchTerm={pdfSearchTerm}
                        onSearchChange={setPdfSearchTerm}
                        renderFilters={() => (
                            <div className="space-y-4">
                                <p className="text-sm text-text-tertiary">Filtre por nombre o cédula usando el campo de búsqueda.</p>
                            </div>
                        )}
                        columns={[
                            { header: "Cédula", accessor: (s) => `${s.identificationPrefix}-${s.identificationNumber}` },
                            { header: "Estudiante", accessor: (s) => `${s.firstName} ${s.lastName}` },
                        ]}
                    />

                    {/* Modal de Confirmación Global */}
                    <UnifiedDialog
                        isOpen={!!confirmation}
                        onClose={() => !loadingAction && setConfirmation(null)}
                        onConfirm={confirmation?.onConfirm || (() => { })}
                        title={confirmation?.title || ""}
                        message={confirmation?.message || ""}
                        confirmLabel={confirmation?.confirmText || "Confirmar"}
                        variant={confirmation?.variant || "info"}
                        isLoading={loadingAction}
                    />
                </div>
            </div>
        </>
    );
}
