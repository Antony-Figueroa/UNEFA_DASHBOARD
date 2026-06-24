/**
 * @file tutors.tsx
 * @description Página principal para la gestión del módulo de Tutores.
 * Orquesta la visualización de datos en tablas, la gestión de estados (activos/inactivos),
 * y las operaciones CRUD (Crear, Leer, Actualizar, Eliminar) mediante modales y hooks especializados.
 */

import { useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import { Tabs } from "../../components/ui/tabs/Tabs";
import { useTabs } from "../../hooks/useTabs";
import UnifiedDialog from "../../components/ui/dialog/UnifiedDialog";
import { DialogVariant } from "../../components/ui/dialog/DialogConfig";
import Button from "../../components/ui/button/Button";
import { SkeletonLoader, TitleSkeleton, BreadcrumbSkeleton, TablePageSkeleton } from "../../components/ui/skeleton";
import { PlusCircleIcon } from "../../icons/actions";
import { FileText, Upload } from "lucide-react";

import TutorTable from "../../features/tutors/components/TutorTable";
import TutorModal from "../../features/tutors/components/TutorModal";
import TutorViewModal from "../../features/tutors/components/TutorViewModal";
import { PDFPreviewModal } from "../../components/ui/pdf/PDFPreviewModal";
import { TutorPDF } from "../../components/ui/pdf/templates/TutorPDF";
import { useTutors } from "../../features/tutors/hooks/useTutors";
import { Tutor, TutorRowData, CreateTutorPayload, UpdateTutorPayload } from "../../features/tutors/types";
import { formatDateTime } from "../../utils/date";
import { useLists } from "../../features/lists/hooks/useLists";
import { useCareers } from "../../features/careers/hooks/useCareers";
import { matchSearch } from "../../utils/searchNormalizer";
import { toTitleCase } from "../../utils/textFormat";
import ExportFormatModal, { ExportFormat } from "../../components/common/ExportFormatModal";
import { exportFullTutors } from "../../features/tutors/services/tutorsService";

/**
 * Transforma un objeto de tipo Tutor (dominio) a TutorRowData (vista).
 * Realiza el formateo de fechas y concatenación de nombres.
 * 
 * @param t - Objeto de tutor del dominio
 * @returns Objeto de tutor formateado para la tabla
 */
const formatTutorToRow = (t: Tutor): TutorRowData => ({
    ...t,
    registrationDate: formatDateTime(t.registrationDate),
});

/**
 * Página principal para la gestión de tutores.
 * Proporciona una interfaz para listar, crear, editar y cambiar el estado de los tutores.
 */
export default function TutorsPage() {
    const [pageLoading, setPageLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const { fetchMultipleLists } = useLists();
    const [dynamicLists, setDynamicLists] = useState<Record<string, { value: string; label: string }[]>>({});

    // Event listener for Command Palette - open create modal
    useEffect(() => {
        if (location.state?.openCreateModal) {
            setEditingTutor(null);
            setIsModalOpen(true);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate]);

    useEffect(() => {
        const loadDynamicLists = async () => {
            try {
                const listNames = ["Condición"];
                const data = await fetchMultipleLists(listNames);
                
                const mapped: Record<string, { value: string; label: string }[]> = {};
                
                // Fallbacks for critical lists
                const fallbacks: Record<string, { value: string; label: string }[]> = {
                    "Condición": [
                        { value: "ORDINARIO", label: "ORDINARIO" },
                        { value: "CONTRATADO", label: "CONTRATADO" },
                    ]
                };

                listNames.forEach(name => {
                    if (data[name] && data[name].length > 0) {
                mapped[name] = data[name].map(v => ({
                    value: v.name.toUpperCase(),
                    label: toTitleCase(v.name)
                }));
                    } else {
                        mapped[name] = fallbacks[name] || [];
                    }
                });

                setDynamicLists(mapped);
            } catch (error) {
                console.error("Error loading dynamic lists for tutors:", error);
            } finally {
                setPageLoading(false);
            }
        };
        loadDynamicLists();
    }, [fetchMultipleLists]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setPageLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    // Escuchar cuando una carrera es guardada (creada o editada)
    useEffect(() => {
        const handleCareerSaved = () => {
            // useCareers handles refresh automatically
        };
        window.addEventListener("career:saved", handleCareerSaved);
        return () => {
            window.removeEventListener("career:saved", handleCareerSaved);
        };
    }, []);

    const {
        tutors,
        status,
        loadingAction,
        error,
        addTutor,
        editTutor,
        toggleStatus,
        bulkRemoveTutors,
        bulkRestoreTutors,
    } = useTutors();

    const { careers } = useCareers();

    const careerOptions = useMemo(() =>
        careers.map(c => ({ value: String(c.careerId), label: toTitleCase(c.careerName) })),
        [careers]);

    const tabsState = useTabs({ defaultTab: 'Activas' });
    const [isSelecting, setIsSelecting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTutor, setEditingTutor] = useState<Tutor | null>(null);
    const [viewTutor, setViewTutor] = useState<TutorRowData | null>(null);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
    const [pdfSearchTerm, setPdfSearchTerm] = useState("");
    const [pdfCareerFilter, setPdfCareerFilter] = useState("");
    const [pdfConditionFilter, setPdfConditionFilter] = useState("");

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
        const byStatus = tutors.filter((t) => (tabsState.activeTab === "Activas" ? t.status : !t.status));
        return byStatus.map(formatTutorToRow);
    }, [tutors, tabsState.activeTab]);

    /**
     * Datos filtrados específicamente para el reporte PDF de Tutores.
     */
    const pdfFilteredData = useMemo(() => {
        const careerSearch = pdfCareerFilter.trim();
        const conditionSearch = pdfConditionFilter.trim().toLowerCase();

        return (Array.isArray(tutors) ? tutors : [])
            .filter((t) => {
                const fullName = `${t.firstName} ${t.middleName || ""} ${t.lastName} ${t.secondLastName || ""}`;
                const matchesSearch = !pdfSearchTerm.trim() || 
                    matchSearch(t.identificationNumber ?? '', pdfSearchTerm) || 
                    matchSearch(fullName, pdfSearchTerm);
                
                const matchesCareer = !careerSearch || (t.carreras || []).some(c => c === careerSearch);
                const matchesCondition = !conditionSearch || (t.condition || "").toLowerCase() === conditionSearch;
                const matchesStatus = t.status === true;

                return matchesSearch && matchesCareer && matchesCondition && matchesStatus;
            });
    }, [tutors, pdfSearchTerm, pdfCareerFilter, pdfConditionFilter]);

    const handleCreate = () => {
        setEditingTutor(null);
        setIsModalOpen(true);
    };

    const handleEdit = (row: TutorRowData) => {
        const original = tutors.find((t) => t.tutorId === row.tutorId) || null;
        setEditingTutor(original);
        setIsModalOpen(true);
    };

    // Maneja la transición de "crear nuevo" a "editar existente" cuando se detecta duplicado
    const handleEditFromExisting = (existingTutor: any) => {
        // Cerrar el modal inmediatamente
        setIsModalOpen(false);
        
        // Limpiar cualquier estado residual del modal de creación
        // Luego abrir en modo edición
        setTimeout(() => {
            setEditingTutor(existingTutor);
            setIsModalOpen(true);
        }, 200);
    };

    // Cleanup del existingTutor cuando se cierra el modal
    const handleCloseModal = () => {
        setIsModalOpen(false);
        // Delay para asegurar que el modal se cierre antes de limpiar
        setTimeout(() => {
            setEditingTutor(null);
        }, 100);
    };

    /**
     * Maneja el guardado (creación o edición) de un tutor.
     * 
     * @param payload - Datos del tutor a guardar
     */
    const handleSave = (payload: CreateTutorPayload | UpdateTutorPayload) => {
        const isEditing = !!editingTutor;
        setConfirmation({
            isOpen: true,
            title: isEditing ? "Confirmar Modificación" : "Confirmar Registro",
            message: `¿Estás seguro de que deseas ${isEditing ? "guardar los cambios de" : "registrar a"} este tutor?`,
            onConfirm: async () => {
                try {
                    if (isEditing && editingTutor) {
                        const updatePayload: UpdateTutorPayload = {
                            ...payload,
                            tutorId: editingTutor.tutorId,
                            status: editingTutor.status
                        };
                        await editTutor(updatePayload);
                    } else {
                        await addTutor(payload as CreateTutorPayload);
                    }
                    // Notificar que un tutor fue guardado (creado o editado)
                    const evt = new CustomEvent("tutor:saved");
                    window.dispatchEvent(evt);
                    setIsModalOpen(false);
                } catch (e) {
                    console.error("[TutorsPage] Error al guardar el tutor:", e);
                } finally {
                    setConfirmation(null);
                }
            },
            confirmText: isEditing ? "Guardar" : "Registrar",
            variant: "info",
        });
    };

    /**
     * Maneja el cambio de estado (activo/inactivo) de un tutor.
     * 
     * @param row - Datos del tutor cuyo estado se desea cambiar
     */
    const handleToggleStatus = (row: TutorRowData) => {
        const original = tutors.find((t) => t.tutorId === row.tutorId);
        if (!original) return;

        const isDeactivating = original.status;
        const actionVerb = isDeactivating ? "desactivar" : "activar";
        const confirmTitle = isDeactivating ? "Confirmar Desactivación" : "Confirmar Activación";
        const variant = isDeactivating ? "error" : "success";
        const confirmText = isDeactivating ? "Desactivar" : "Activar";

        setConfirmation({
            isOpen: true,
            title: confirmTitle,
            message: `¿Estás seguro de que deseas ${actionVerb} al tutor "${row.firstName} ${row.lastName}"?`,
            onConfirm: async () => {
                try {
                    await toggleStatus(original);
                } catch (error) {
                    console.error("Error toggling tutor status:", error);
                } finally {
                    setConfirmation(null);
                }
            },
            confirmText: confirmText,
            variant: variant as DialogVariant,
        });
    };

    /**
     * Maneja la eliminación masiva de tutores.
     * 
     * @param ids - IDs de los tutores a eliminar
     */
    const handleBulkDelete = (ids: string[]) => {
        setConfirmation({
            isOpen: true,
            title: "Confirmar Desactivación Múltiple",
            message: `¿Estás seguro de que deseas desactivar los ${ids.length} tutores seleccionados?`,
            onConfirm: async () => {
                try {
                    await bulkRemoveTutors(ids);
                } catch (error) {
                    console.error("Error in bulk tutor inactivation:", error);
                } finally {
                    setConfirmation(null);
                }
            },
            confirmText: "Desactivar",
            variant: "error",
        });
    };

    /**
     * Maneja la restauración masiva de tutores.
     * 
     * @param ids - IDs de los tutores a restaurar
     */
    const handleBulkRestore = (ids: string[]) => {
        setConfirmation({
            isOpen: true,
            title: "Confirmar Restauración Múltiple",
            message: `¿Estás seguro de que deseas restaurar los ${ids.length} tutores seleccionados?`,
            onConfirm: async () => {
                try {
                    await bulkRestoreTutors(ids);
                } catch (error) {
                    console.error("Error in bulk tutor restoration:", error);
                } finally {
                    setConfirmation(null);
                }
            },
            confirmText: "Restaurar",
            variant: "success",
        });
    };

    return (
        <>
            <PageMeta title="Gestión de Tutores" description="Administración de tutores" />

            <SkeletonLoader isLoading={pageLoading} skeleton={<BreadcrumbSkeleton />} id="tutors-breadcrumb">
                <PageBreadcrumb pageTitle="Tutores" />
            </SkeletonLoader>

            <div className="stagger-delay">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <SkeletonLoader isLoading={pageLoading} skeleton={<TitleSkeleton />} id="tutors-title">
                            <div className="flex items-center gap-2">
                                    <h2 className="text-2xl font-bold text-text-primary dark:text-text-emphasis">Listado de Tutores</h2>
                                </div>
                                <p className="mt-1 text-sm text-text-secondary dark:text-text-tertiary">Gestiona la información y estado académico de los tutores.</p>
                        </SkeletonLoader>
                    </div>

                    {!pageLoading && (
                        <div className="flex flex-wrap items-center gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setIsPDFModalOpen(true)}
                                startIcon={<FileText className="h-5 w-5" />}
                            >
                                Reporte
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setIsExportModalOpen(true)}
                                disabled={isSelecting}
                                startIcon={<Upload className="h-5 w-5" />}
                            >
                                Exportación
                            </Button>
                            <Button onClick={handleCreate} disabled={isSelecting} startIcon={<PlusCircleIcon className="h-5 w-5" />}>
                                Nuevo Tutor
                            </Button>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <ComponentCard title={tabsState.activeTab === "Activas" ? "Tutores Activos" : "Tutores Inactivos"}>
                        <Tabs
                            options={[
                                { id: 'Activas', label: 'Activos' },
                                { id: 'Inactivas', label: 'Inactivos' },
                            ]}
                            {...tabsState.tabProps}
                            variant="underline"
                            className="mb-6"
                        />

                        <SkeletonLoader isLoading={pageLoading || status === "loading"} skeleton={<TablePageSkeleton rows={5} />} id="tutors-table">
                            <TutorTable
                                data={filtered}
                                status={status}
                                error={error}
                                activeTab={tabsState.activeTab as "Activas" | "Inactivas"}
                                onEdit={handleEdit}
                                onToggleStatus={handleToggleStatus}
                                onView={setViewTutor}
                                onBulkDelete={handleBulkDelete}
                                onBulkRestore={handleBulkRestore}
                                inactiveMode={tabsState.activeTab === "Inactivas"}
                                careerOptions={careerOptions}
                                careers={careers}
                                conditionOptions={dynamicLists["Condición"] || []}
                                loading={loadingAction}
                                onSelectionChange={setIsSelecting}
                            />
                        </SkeletonLoader>
                    </ComponentCard>

                    <TutorModal
                        isOpen={isModalOpen}
                        onClose={handleCloseModal}
                        onSave={handleSave}
                        editingTutor={editingTutor}
                        isLoading={loadingAction}
                        tutors={tutors}
                        onEditExisting={handleEditFromExisting}
                    />

                    <TutorViewModal
                        isOpen={!!viewTutor}
                        onClose={() => setViewTutor(null)}
                        onEdit={handleEdit}
                        tutor={viewTutor}
                    />

                    <ExportFormatModal
                        isOpen={isExportModalOpen}
                        onClose={() => setIsExportModalOpen(false)}
                        onExport={(format: ExportFormat) => exportFullTutors(format)}
                        entityLabel="tutores"
                    />

                    <PDFPreviewModal
                        isOpen={isPDFModalOpen}
                        onClose={() => setIsPDFModalOpen(false)}
                        title="Reporte de Tutores Activos"
                        data={pdfFilteredData}
                        template={(data) => <TutorPDF data={data} careers={careers} />}
                        fileName={`reporte-tutores-activos-${new Date().toISOString().split('T')[0]}.pdf`}
                        searchTerm={pdfSearchTerm}
                        onSearchChange={setPdfSearchTerm}
                        renderFilters={() => (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest pl-1">
                                        Carrera
                                    </label>
                                    <select
                                        value={pdfCareerFilter}
                                        onChange={(e) => setPdfCareerFilter(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-bg-secondary/50 dark:bg-white/5 border border-border-light dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                                    >
                                        <option value="">Todas las Carreras</option>
                                        {careerOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest pl-1">
                                        Condición
                                    </label>
                                    <select
                                        value={pdfConditionFilter}
                                        onChange={(e) => setPdfConditionFilter(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-bg-secondary/50 dark:bg-white/5 border border-border-light dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                                    >
                                        <option value="">Todas las Condiciones</option>
                                        {(dynamicLists["Condición"] || []).map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                        columns={[
                            { header: "Cédula", accessor: (t) => `${t.identificationPrefix}-${t.identificationNumber}` },
                            { header: "Nombre Completo", accessor: (t) => `${toTitleCase(t.firstName)} ${toTitleCase(t.middleName) || ""} ${toTitleCase(t.lastName)} ${toTitleCase(t.secondLastName) || ""}`.trim() },
                            { 
                                header: "Contacto", 
                                accessor: (t) => `${t.email} / ${t.phone}` 
                            },
                            { 
                                header: "Título", 
                                accessor: (t) => t.carreras
                                    .map(id => toTitleCase(careers.find(c => String(c.careerId) === String(id))?.careerName || id))
                                    .join(" - ") 
                            },
                        ]}
                    />

                    <UnifiedDialog
                        isOpen={confirmation?.isOpen || false}
                        onClose={() => setConfirmation(null)}
                        title={confirmation?.title || ""}
                        message={confirmation?.message || ""}
                        confirmLabel={confirmation?.confirmText || "Confirmar"}
                        variant={confirmation?.variant || "info"}
                        onConfirm={confirmation?.onConfirm || (() => {})}
                        isLoading={loadingAction}
                    />
                </div>
            </div>
        </>
    );
}
