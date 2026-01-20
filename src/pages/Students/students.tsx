/**
 * @file students.tsx
 * @description Página principal para la gestión del módulo de Estudiantes.
 * Orquesta la visualización de datos en tablas, la gestión de estados (activos/inactivos),
 * y las operaciones CRUD (Crear, Leer, Actualizar, Eliminar) mediante modales y hooks especializados.
 */

import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import UnifiedDialog from "../../components/ui/dialog/UnifiedDialog";
import { DialogVariant } from "../../components/ui/dialog/DialogConfig";
import Button from "../../components/ui/button/Button";
import { FullScreenLoader } from "../../components/ui/loader";
import { SkeletonLoader, TitleSkeleton, BreadcrumbSkeleton, TablePageSkeleton } from "../../components/ui/skeleton";
import { PlusCircleIcon } from "../../icons/actions";
import { DownloadIcon } from "../../icons";
import StudentTable from "../../features/students/components/StudentTable";
import StudentModal from "../../features/students/components/StudentModal";
import StudentViewModal from "../../features/students/components/StudentViewModal";
import { PDFPreviewModal } from "../../components/ui/pdf/PDFPreviewModal";
import { StudentPDF } from "../../components/ui/pdf/templates/StudentPDF";
import { useStudents } from "../../features/students/hooks/useStudents";
import { Student, StudentRowData } from "../../features/students/types";
import { useCareers } from "../../features/careers/hooks/useCareers";
import { useLists } from "../../features/lists/hooks/useLists";
import { ListValue } from "../../features/lists/types";
import { formatDateTime } from "../../utils/date";

/**
 * Transforma un objeto de tipo Student (dominio) a StudentRowData (vista).
 * Realiza el formateo de fechas y concatenación de nombres.
 */
const formatStudentToRow = (s: Student): StudentRowData => ({
    ...s,
    enrollmentDate: formatDateTime(s.enrollmentDate),
    fullNames: `${s.firstName} ${s.middleName ? s.middleName + " " : ""}${s.lastName} ${s.secondLastName ? s.secondLastName : ""}`.trim(),
});

export default function StudentsPage() {
    const [pageLoading, setPageLoading] = useState(true);
    const navigate = useNavigate();
    const { fetchMultipleLists } = useLists();
    const [dynamicLists, setDynamicLists] = useState<Record<string, ListValue[]>>({});

    useEffect(() => {
        const loadLists = async () => {
            try {
                const lists = await fetchMultipleLists([
                    "Sexo",
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
    } = useStudents();

    const { careers } = useCareers();

    const careerOptions = useMemo(() =>
        careers.map(c => ({ value: c.careerId, label: c.careerName.toUpperCase() })),
        [careers]);

    const [activeTab, setActiveTab] = useState<"Activas" | "Inactivas">("Activas");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [viewStudent, setViewStudent] = useState<StudentRowData | null>(null);
    const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);

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
        const byStatus = students.filter((s) => (activeTab === "Activas" ? s.status : !s.status));
        return byStatus.map(formatStudentToRow);
    }, [students, activeTab]);

    const handleCreate = () => {
        setEditingStudent(null);
        setIsModalOpen(true);
    };

    const handleEdit = (row: StudentRowData) => {
        const original = Array.isArray(students) ? students.find((s) => s.studentId === row.studentId) : null;
        setEditingStudent(original || null);
        setIsModalOpen(true);
    };

    const handleSave = (payload: Omit<Student, "studentId" | "enrollmentDate">) => {
        const isEditing = !!editingStudent;
        setConfirmation({
            isOpen: true,
            title: isEditing ? "Confirmar Modificación" : "Confirmar Registro",
            message: `¿Estás seguro de que deseas ${isEditing ? "guardar los cambios de" : "registrar a"} este estudiante?`,
            onConfirm: async () => {
                try {
                    if (isEditing && editingStudent) {
                        await editStudent({ ...editingStudent, ...payload });
                    } else {
                        await addStudent(payload);
                    }
                    setIsModalOpen(false);
                } catch (e) {
                    console.error(e);
                } finally {
                    setConfirmation(null);
                }
            },
            confirmText: isEditing ? "Guardar" : "Registrar",
            variant: "info",
        });
    };

    const handleToggleStatus = (studentId: string) => {
        const original = Array.isArray(students) ? students.find((s) => s.studentId === studentId) : null;
        if (!original) return;
        const goingInactive = original.status === true;
        setConfirmation({
            isOpen: true,
            title: goingInactive ? "Confirmar Envío a Inactivos" : "Confirmar Restauración",
            message: goingInactive 
                ? `¿Estás seguro de que deseas enviar al estudiante "${original.firstName} ${original.lastName}" a Inactivos?`
                : `¿Estás seguro de que deseas restaurar al estudiante "${original.firstName} ${original.lastName}"?`,
            onConfirm: async () => {
                try {
                    await toggleStatus(original);
                } catch (e) { console.error(e); }
                finally { setConfirmation(null); }
            },
            confirmText: goingInactive ? "Confirmar" : "Restaurar",
            variant: goingInactive ? "error" : "success",
        });
    };

    const handleBulkDelete = (ids: string[]) => {
        setConfirmation({
            isOpen: true,
            title: "Confirmar Envío a Inactivos (Masivo)",
            message: `¿Estás seguro de que deseas enviar los ${ids.length} estudiantes seleccionados a Inactivos?`,
            onConfirm: async () => {
                try {
                    await bulkRemoveStudents(ids);
                    setSelectedIds([]);
                } catch (e) {
                    console.error(e);
                    setSelectedIds([]); // Ocultar botón incluso en caso de error según requisito 2
                }
                finally { setConfirmation(null); }
            },
            confirmText: "Confirmar",
            variant: "error",
        });
    };

    const handleBulkRestore = (ids: string[]) => {
        setConfirmation({
            isOpen: true,
            title: "Confirmar Restauración Masiva",
            message: `¿Estás seguro de que deseas restaurar los ${ids.length} estudiantes seleccionados?`,
            onConfirm: async () => {
                try {
                    await bulkRestoreStudents(ids);
                    setSelectedIds([]);
                } catch (e) {
                    console.error(e);
                    setSelectedIds([]); // Ocultar botón incluso en caso de error según requisito 2
                }
                finally { setConfirmation(null); }
            },
            confirmText: "Restaurar",
            variant: "success",
        });
    };

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

            {loadingAction && <FullScreenLoader label="Procesando..." />}

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
                                startIcon={<DownloadIcon className="h-5 w-5" />}
                            >
                                Reporte
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
                                careerOptions={careerOptions}
                                regimeOptions={dynamicLists["Regimen/Turno"]?.map(v => ({ value: v.name.toUpperCase(), label: v.name.toUpperCase() })) || [
                                    { value: "DIURNO", label: "DIURNO" },
                                    { value: "NOCTURNO", label: "NOCTURNO" }
                                ]}
                                loading={loadingAction}
                            />
                        </SkeletonLoader>
                    </ComponentCard>

                    <StudentModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onSave={handleSave}
                        editingStudent={editingStudent}
                careerOptions={careerOptions}
                dynamicLists={dynamicLists}
                isLoading={loadingAction}
            />

                    <StudentViewModal
                        isOpen={!!viewStudent}
                        onClose={() => setViewStudent(null)}
                        onEdit={handleEdit}
                        student={viewStudent}
                    />

                    {/* Modal de Previsualización PDF */}
                    <PDFPreviewModal
                        isOpen={isPDFModalOpen}
                        onClose={() => setIsPDFModalOpen(false)}
                        title="Listado de Estudiantes"
                        data={(Array.isArray(students) ? students : []).filter(s => activeTab === "Activas" ? s.status : !s.status)}
                        template={<StudentPDF data={[]} />}
                        fileName={`estudiantes-${activeTab.toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`}
                        columns={[
                            { 
                                header: "Cédula", 
                                accessor: (s) => `${s.identificationPrefix}-${s.identificationNumber}` 
                            },
                            { 
                                header: "Nombre Completo", 
                                accessor: (s) => `${s.firstName} ${s.lastName}` 
                            },
                            { 
                                header: "Carrera", 
                                accessor: "careerName" 
                            },
                            { 
                                header: "Sem/Sec", 
                                accessor: (s) => `${s.semester}° - ${s.section}` 
                            },
                            { 
                                header: "Estado", 
                                accessor: (s) => s.status ? "ACTIVO" : "INACTIVO" 
                            },
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
