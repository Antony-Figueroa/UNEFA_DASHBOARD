/**
 * @file students.tsx
 * @description Página principal para la gestión del módulo de Estudiantes.
 * Orquesta la visualización de datos en tablas, la gestión de estados (activos/inactivos),
 * y las operaciones CRUD (Crear, Leer, Actualizar, Eliminar) mediante modales y hooks especializados.
 */

import { useMemo, useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import { FullScreenLoader } from "../../components/ui/loader";
import { SkeletonLoader, TitleSkeleton, BreadcrumbSkeleton, TablePageSkeleton } from "../../components/ui/skeleton";
import { PlusCircleIcon, XIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from "../../icons/actions";
import { InfoIcon } from "../../icons";

import StudentTable from "../../features/students/components/StudentTable";
import StudentModal from "../../features/students/components/StudentModal";
import { useStudents } from "../../features/students/hooks/useStudents";
import { Student, StudentRowData } from "../../features/students/types";
import { useCareers } from "../../features/careers/hooks/useCareers";
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
    const { colorMode } = useTheme();
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setPageLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

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
        careers.map(c => ({ value: c.careerId, label: c.careerName })),
        [careers]);

    const [activeTab, setActiveTab] = useState<"Activas" | "Inactivas">("Activas");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [viewStudent, setViewStudent] = useState<StudentRowData | null>(null);

    type ConfirmationInfo = {
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        confirmText: string;
        variant: "success" | "error" | "warning" | "info";
    };

    const confirmationStyles = {
        error: {
            iconBg: "bg-red-100 dark:bg-red-900/30",
            icon: <XIcon className="h-6 w-6 text-red-600 dark:text-red-500" />,
            button: "bg-red-600 hover:bg-red-700",
        },
        success: {
            iconBg: "bg-green-100 dark:bg-green-900/30",
            icon: <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-500" />,
            button: "bg-green-500 hover:bg-green-600",
        },
        warning: {
            iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
            icon: <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500 dark:text-yellow-400" />,
            button: "bg-yellow-500 hover:bg-yellow-600",
        },
        info: {
            iconBg: "bg-blue-100 dark:bg-blue-900/30",
            icon: <InformationCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-500" />,
            button: "bg-blue-500 hover:bg-blue-600",
        },
    };

    const [confirmation, setConfirmation] = useState<ConfirmationInfo | null>(null);

    const filtered = useMemo(() => {
        const byStatus = students.filter((s) => (activeTab === "Activas" ? s.status : !s.status));
        return byStatus.map(formatStudentToRow);
    }, [students, activeTab]);

    const handleCreate = () => {
        setEditingStudent(null);
        setIsModalOpen(true);
    };

    const handleEdit = (row: StudentRowData) => {
        const original = students.find((s) => s.studentId === row.studentId) || null;
        setEditingStudent(original);
        setIsModalOpen(true);
    };

    const handleSave = (payload: Omit<Student, "studentId" | "enrollmentDate">) => {
        const isEditing = !!editingStudent;
        setConfirmation({
            isOpen: true,
            title: isEditing ? "Confirmar Modificación" : "Confirmar Registro",
            message: `¿Deseas ${isEditing ? "guardar los cambios de" : "registrar a"} este estudiante?`,
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
            confirmText: "Confirmar",
            variant: "info",
        });
    };

    const handleToggleStatus = (studentId: string) => {
        const original = students.find((s) => s.studentId === studentId);
        if (!original) return;
        const goingInactive = original.status === true;
        setConfirmation({
            isOpen: true,
            title: goingInactive ? "Enviar a Inactivo" : "Restaurar Estudiante",
            message: goingInactive
                ? `¿Deseas enviar a "${original.firstName} ${original.lastName}" a la Inactivo?`
                : `¿Deseas restaurar al estudiante "${original.firstName} ${original.lastName}"?`,
            onConfirm: async () => {
                try {
                    await toggleStatus(original);
                } catch (e) { console.error(e); }
                finally { setConfirmation(null); }
            },
            confirmText: goingInactive ? "Enviar a Inactivo" : "Restaurar",
            variant: goingInactive ? "warning" : "info",
        });
    };

    const handleBulkDelete = (ids: string[]) => {
        setConfirmation({
            isOpen: true,
            title: "Eliminación Masiva",
            message: `¿Estás seguro de enviar ${ids.length} estudiantes a la Inactivo?`,
            onConfirm: async () => {
                try {
                    await bulkRemoveStudents(ids);
                } catch (e) { console.error(e); }
                finally { setConfirmation(null); }
            },
            confirmText: "Eliminar seleccionados",
            variant: "error",
        });
    };

    const handleBulkRestore = (ids: string[]) => {
        setConfirmation({
            isOpen: true,
            title: "Restauración Masiva",
            message: `¿Deseas restaurar ${ids.length} estudiantes seleccionados?`,
            onConfirm: async () => {
                try {
                    await bulkRestoreStudents(ids);
                } catch (e) { console.error(e); }
                finally { setConfirmation(null); }
            },
            confirmText: "Restaurar seleccionados",
            variant: "info",
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
                {/* Banner de Modo Demostración */}

                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <SkeletonLoader isLoading={pageLoading} skeleton={<TitleSkeleton />} id="students-title">
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Listado de Estudiantes</h2>
                                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                                    Demo
                                </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Gestiona la información y estado académico de los estudiantes.</p>
                        </SkeletonLoader>
                    </div>

                    {!pageLoading && (
                        <Button onClick={handleCreate} startIcon={<PlusCircleIcon className="h-5 w-5" />}>
                            Nuevo Estudiante
                        </Button>
                    )}
                </div>
                {!pageLoading && (
                    <div className="mb-6 flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-700 dark:border-blue-900/30 dark:bg-blue-500/10 dark:text-blue-400">
                        <InfoIcon className="h-5 w-5 shrink-0" />
                        <div className="text-sm">
                            <span className="font-bold">Modo Demostración Activo:</span> Esta vista utiliza datos estáticos locales. No se realizan conexiones a servicios externos.
                        </div>
                    </div>
                )}
                {/* Contenido principal */}
                <div className="space-y-6">
                    {/* Tabla de Estudiantes */}
                    <ComponentCard title={activeTab === "Activas" ? "Estudiantes Activos" : "Estudiantes Inactivos"}>
                        <div className="mb-6 flex border-b border-gray-200 dark:border-white/5">
                            <button
                                onClick={() => setActiveTab("Activas")}
                                className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === "Activas" ? "text-brand-500" : "text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                Activos
                                {activeTab === "Activas" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-500 animate-slideInLeft" />}
                            </button>
                            <button
                                onClick={() => setActiveTab("Inactivas")}
                                className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === "Inactivas" ? "text-brand-500" : "text-gray-500 hover:text-gray-700"
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
                                onView={setViewStudent}
                                onBulkDelete={handleBulkDelete}
                                onBulkRestore={handleBulkRestore}
                                inactiveMode={activeTab === "Inactivas"}
                                careerOptions={careerOptions}
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
                    />

                    <Modal isOpen={!!viewStudent} onClose={() => setViewStudent(null)} isFullscreen={true} showCloseButton>
                        <ModalHeader className="shrink-0 pt-8 px-6 sm:px-12">Detalles Completos del Estudiante</ModalHeader>
                        <ModalBody className="overflow-y-auto custom-scrollbar grow px-6 sm:px-12 py-8">
                            {viewStudent && (
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
                                                <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{viewStudent.firstName}</p>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Segundo Nombre</label>
                                                <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{viewStudent.middleName || "-"}</p>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Primer Apellido</label>
                                                <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{viewStudent.lastName}</p>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Segundo Apellido</label>
                                                <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{viewStudent.secondLastName || "-"}</p>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Cédula / ID</label>
                                                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{viewStudent.identificationPrefix}-{viewStudent.identificationNumber}</p>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Sexo</label>
                                                <p className="text-sm text-gray-800 dark:text-white/90">{viewStudent.sex}</p>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Estado Civil</label>
                                                <p className="text-sm text-gray-800 dark:text-white/90">{viewStudent.civilStatus}</p>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Fecha de Nacimiento</label>
                                                <p className="text-sm text-gray-800 dark:text-white/90">{viewStudent.birthDate}</p>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Teléfono</label>
                                                <p className="text-sm text-gray-800 dark:text-white/90">{viewStudent.phone}</p>
                                            </div>
                                            <div className="sm:col-span-2 md:col-span-1">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Email</label>
                                                <p className="text-sm text-gray-800 dark:text-white/90 break-all">{viewStudent.email}</p>
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
                                                <p className="text-sm font-bold text-gray-800 dark:text-white/90 uppercase">{viewStudent.careerName || "No asignada"}</p>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Semestre / Sección</label>
                                                <p className="text-sm font-bold text-gray-800 dark:text-white/90">{viewStudent.semester} - {viewStudent.section}</p>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Régimen</label>
                                                <p className="text-sm font-bold text-gray-800 dark:text-white/90">{viewStudent.regime}</p>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Tipo / Rango</label>
                                                <p className="text-sm font-bold text-gray-800 dark:text-white/90">{viewStudent.studentType} - {viewStudent.militaryRank}</p>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">¿Trabaja?</label>
                                                <p className="text-sm font-bold text-gray-800 dark:text-white/90">{viewStudent.works}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Estado y Fechas */}
                                    <div className="rounded-xl bg-gray-50 dark:bg-white/3 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Estado en Sistema</label>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${viewStudent.status ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>
                                                {viewStudent.status ? "Activo" : "En Papelera"}
                                            </span>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Fecha Registro</label>
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{viewStudent.enrollmentDate}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </ModalBody>
                        <ModalFooter className="shrink-0">
                            <Button variant="outline" onClick={() => setViewStudent(null)} className="flex-1 sm:flex-none">
                                Cerrar
                            </Button>
                            <Button onClick={() => { handleEdit(viewStudent!); setViewStudent(null); }} className="flex-1 sm:flex-none">
                                Editar Información
                            </Button>
                        </ModalFooter>
                    </Modal>

                    {/* Modal de Confirmación Global */}
                    <Modal isOpen={!!confirmation} onClose={() => setConfirmation(null)} className={`max-w-md ${colorMode === "dark" ? "dark" : ""}`}>
                        {confirmation && (
                            <>
                                <ModalBody className="text-center pt-8">
                                    <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${confirmationStyles[confirmation.variant].iconBg}`}>
                                        {confirmationStyles[confirmation.variant].icon}
                                    </div>
                                    <h3 className="mb-2 text-lg font-bold text-gray-800 dark:text-white/90">{confirmation.title}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{confirmation.message}</p>
                                </ModalBody>
                                <ModalFooter className="justify-center border-t-0 pt-0 pb-8">
                                    <Button variant="outline" onClick={() => setConfirmation(null)}>Cancelar</Button>
                                    <Button className={confirmationStyles[confirmation.variant].button} onClick={confirmation.onConfirm}>
                                        {confirmation.confirmText}
                                    </Button>
                                </ModalFooter>
                            </>
                        )}
                    </Modal>
                </div>
            </div>
        </>
    );
}
