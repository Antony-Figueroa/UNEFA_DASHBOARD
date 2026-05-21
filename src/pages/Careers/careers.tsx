/**
 * @file careers.tsx
 * @description Página principal para la gestión del módulo de Carreras. 
 * Orquesta la visualización de datos en tablas, la gestión de estados (activos/inactivos),
 * y las operaciones CRUD (Crear, Leer, Actualizar, Eliminar) mediante modales y hooks especializados.
 * 
 * @module Pages/Careers
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
import { Tabs } from "../../components/ui/tabs/Tabs";
import { PlusCircleIcon } from "../../icons/actions";
import { DownloadIcon } from "../../icons";

import CareerTable from "../../features/careers/components/CareerTable";
import CareerModal from "../../features/careers/components/CareerModal";
import CareerViewModal from "../../features/careers/components/CareerViewModal";
import { PDFPreviewModal } from "../../components/ui/pdf/PDFPreviewModal";
import { CarreraPDF } from "../../components/ui/pdf/templates/CarreraPDF";
import InternshipTypeTable from "../../features/internship-types/components/InternshipTypeTable";
import InternshipTypeModal from "../../features/internship-types/components/InternshipTypeModal";
import InternshipTypeViewModal from "../../features/internship-types/components/InternshipTypeViewModal";
import { useCareers } from "../../features/careers/hooks/useCareers";
import { Career, CareerRowData, CreateCareerPayload, UpdateCareerPayload } from "../../features/careers/types";
import { formatDateTime } from "../../utils/date";
import { useInternshipTypes } from "../../features/internship-types/hooks/useInternshipTypes";
import { InternshipType, CreateInternshipTypePayload } from "../../features/internship-types/types";
import { matchSearch } from "../../utils/searchNormalizer";

/**
 * Transforma un objeto de tipo Career (dominio) a CareerRowData (vista).
 * Realiza el formateo de fechas para su visualización en la tabla.
 * 
 * @function formatCareerToRow
 * @param {Career} c - Objeto de carrera proveniente de la API o estado.
 * @returns {CareerRowData} Objeto transformado con fechas formateadas.
 */
const formatCareerToRow = (c: Career): CareerRowData => ({
  ...c,
  creationDate: formatDateTime(c.creationDate),
});

/**
 * Componente principal de la página de Carreras.
 * 
 * Maneja el ciclo de vida de la vista, incluyendo:
 * - Carga y filtrado de datos mediante `useCareers`.
 * - Control de pestañas (Activas vs Inactivos).
 * - Gestión de modales para CRUD y visualización.
 * - Sistema de confirmación para acciones críticas.
 * 
 * @component CareersPage
 * @returns {JSX.Element} El layout completo de la página de gestión de carreras.
 */
export default function CareersPage() {
  const [pageLoading, setPageLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    internshipTypes,
    options: internshipOptions,
    activeOptions: activeInternshipOptions,
    fetchAll: fetchInternshipTypes, 
    isLoading: loadingTypes,
    loadingAction: loadingTypeAction,
    addInternshipType,
    editInternshipType,
    toggleStatus: toggleTypeStatus,
    bulkRemove: bulkRemoveTypes,
    bulkRestore: bulkRestoreTypes,
    // error: typeError // Eliminado porque no se usa
  } = useInternshipTypes();

  // Event listener for Command Palette - open create modal
  useEffect(() => {
    if (location.state?.openCreateModal) {
      setEditingCareer(null);
      setIsModalOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  useEffect(() => {
    const init = async () => {
      await fetchInternshipTypes();
      setPageLoading(false);
    };
    init();
  }, [fetchInternshipTypes]);

  /**
   * Hook personalizado que encapsula la lógica de negocio y peticiones al servidor.
   * Proporciona los datos, estados de carga y funciones de mutación.
   */
  const {
    careers,
    filteredCareers,
    status,
    loadingAction: loadingCareerAction,
    error,
    searchTerm,
    setSearchTerm,
    addCareer,
    editCareer,
    removeCareer,
    toggleCareerStatus: toggleStatus,
    bulkRemoveCareers,
    bulkRestoreCareers,
  } = useCareers();

  const loadingAction = loadingCareerAction || loadingTypeAction;

  /** @state {('Carreras'|'Tipos de Prácticas')} mainTab - Controla qué sección se muestra. */
  const [mainTab, setMainTab] = useState<"Carreras" | "Tipos de Prácticas">("Carreras");

  /** @state {('Activas'|'Inactivas')} activeTab - Controla qué conjunto de datos se muestra en la tabla. */
  const [activeTab, setActiveTab] = useState<"Activas" | "Inactivas">("Activas");

  // Estados para Carreras
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCareer, setEditingCareer] = useState<Career | null>(null);
  const [viewCareer, setViewCareer] = useState<CareerRowData | null>(null);
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [pdfSearchTerm, setPdfSearchTerm] = useState("");

  // Estados para Tipos de Prácticas
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<InternshipType | null>(null);
  const [viewType, setViewType] = useState<InternshipType | null>(null);
  const [lastCreatedInternshipTypeId, setLastCreatedInternshipTypeId] = useState<string | number | null>(null);

  /**
   * Determina si un tipo de práctica está en uso (asignado a una carrera activa).
   */
  const isTypeInUse = (typeId: number) => {
    return careers.some((c) => c.internshipTypeIds?.includes(String(typeId)));
  };

  /**
   * Definición de tipos para el estado de confirmación.
   */
  type ConfirmationInfo = {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  confirmText: string;
  variant: DialogVariant;
};

  /** @state {ConfirmationInfo|null} confirmation - Estado que orquesta el diálogo de confirmación global. */
  const [confirmation, setConfirmation] = useState<ConfirmationInfo | null>(null);

  /**
   * Datos filtrados y formateados para su presentación.
   * Se recalcula solo cuando cambian las carreras filtradas por búsqueda o la pestaña activa.
   */
  const filtered = useMemo(() => {
    const byStatus = filteredCareers.filter((c) => (activeTab === "Activas" ? c.status : !c.status));
    return byStatus.map(formatCareerToRow);
  }, [filteredCareers, activeTab]);

  /**
   * Datos filtrados específicamente para el reporte PDF.
   * Permite búsquedas independientes en el modal de previsualización.
   */
  const pdfFilteredData = useMemo(() => {
    const byStatus = careers.filter((c) => c.status === true);
    
    return byStatus
      .filter(c => {
        if (!pdfSearchTerm.trim()) return true;
        return (
          matchSearch(c.careerCode, pdfSearchTerm) ||
          matchSearch(c.careerName, pdfSearchTerm)
        );
      })
      .map(formatCareerToRow);
  }, [careers, pdfSearchTerm]);

  /**
   * Prepara el estado para crear una nueva carrera o tipo de práctica y abre el modal.
   */
  const handleCreate = () => {
    if (mainTab === "Carreras") {
      setEditingCareer(null);
      setIsModalOpen(true);
    } else {
      setEditingType(null);
      setIsTypeModalOpen(true);
    }
  };

  /**
   * Cierra el modal de carrera y limpia el estado de edición.
   */
  const handleCloseCareerModal = () => {
    setIsModalOpen(false);
    // Pequeño delay para permitir que la animación de cierre termine antes de limpiar el estado
    setTimeout(() => {
      setEditingCareer(null);
    }, 300);
  };

  // Maneja la transición de "crear nuevo" a "editar existente" cuando se detecta duplicado
  const handleEditExisting = (existingCareer: Career) => {
    // Cerrar el modal inmediatamente
    setIsModalOpen(false);
    // Delay para asegurar que el modal se cierre antes de limpiar
    setTimeout(() => {
      setEditingCareer(existingCareer);
      setIsModalOpen(true);
    }, 200);
  };

  /**
   * Cierra el modal de tipo de práctica y limpia el estado de edición.
   */
  const handleCloseTypeModal = () => {
    setIsTypeModalOpen(false);
    setTimeout(() => {
      setEditingType(null);
    }, 300);
  };

  /**
   * Prepara el estado para editar una carrera existente.
   * @param {CareerRowData} row - Los datos de la fila seleccionada.
   */
  const handleEdit = (row: CareerRowData) => {
    const original = careers.find((c) => String(c.careerId) === String(row.careerId)) || null;
    setEditingCareer(original);
    setIsModalOpen(true);
  };

  /**
   * Prepara el estado para editar un tipo de práctica.
   */
  const handleEditType = (item: InternshipType) => {
    setEditingType(item);
    setIsTypeModalOpen(true);
  };

  /**
   * Procesa el guardado (Crear o Actualizar) de una carrera.
   * La confirmación es manejada internamente por el modal.
   * 
   * @param {Omit<Career, "careerId" | "creationDate">} payload - Datos validados del formulario.
   */
  const handleSave = async (
    payload: Omit<Career, "careerId" | "creationDate">
  ) => {
    const isEditing = !!editingCareer;
    try {
      if (isEditing && editingCareer) {
        await editCareer({ ...editingCareer, ...payload } as UpdateCareerPayload);
      } else {
        await addCareer(payload as CreateCareerPayload);
      }
      // Notificar a otros componentes que una carrera fue guardada (creada o editada)
      const evt = new CustomEvent("career:saved");
      window.dispatchEvent(evt);
      setIsModalOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  /**
   * Procesa el guardado de un tipo de práctica.
   * La confirmación es manejada internamente por el modal.
   */
  const handleSaveType = async (payload: CreateInternshipTypePayload) => {
    const isEditing = !!editingType;
    try {
      let result;
      if (isEditing && editingType) {
        result = await editInternshipType({ ...payload, id: editingType.id });
      } else {
        result = await addInternshipType(payload);
      }

      if (!isEditing && result) {
        setLastCreatedInternshipTypeId(result.id);
      }

      setIsTypeModalOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  /**
   * Alterna el estado de una carrera entre Activo e Inactivo.
   * @param {string | number} careerId - ID único de la carrera.
   */
  const handleToggleStatus = (careerId: string | number) => {
    const original = careers.find((c) => String(c.careerId) === String(careerId));
    if (!original) return;
    const goingInactive = original.status === true || original.status === 1;

    if (goingInactive) {
      setConfirmation({
        isOpen: true,
        title: "Confirmar Desactivación",
        message: `¿Estás seguro de que deseas desactivar la carrera "${original.careerName}"?`,
        onConfirm: async () => {
          try {
            await toggleStatus(careerId, false);
          } catch (e) {
            console.error(e);
          } finally {
            setConfirmation(null);
          }
        },
        confirmText: "Desactivar",
        variant: "error",
      });
    } else {
      setConfirmation({
        isOpen: true,
        title: "Confirmar Activación",
        message: `¿Estás seguro de que deseas activar la carrera "${original.careerName}"?`,
        onConfirm: async () => {
          try {
            await toggleStatus(careerId, true);
          } catch (e) {
            console.error(e);
          } finally {
            setConfirmation(null);
          }
        },
        confirmText: "Activar",
        variant: "success",
      });
    }
  };

  /**
   * Alterna el estado de un tipo de práctica.
   */
  const handleToggleTypeStatus = (id: number) => {
    const original = internshipTypes.find((t) => t.id === id);
    if (!original) return;
    const goingInactive = original.status;

    if (goingInactive) {
      setConfirmation({
        isOpen: true,
        title: "Confirmar Desactivación",
        message: `¿Estás seguro de que deseas desactivar el tipo de práctica "${original.name}"?`,
        onConfirm: async () => {
          try {
            await toggleTypeStatus(id, false);
          } catch (e) {
            console.error(e);
          } finally {
            setConfirmation(null);
          }
        },
        confirmText: "Desactivar",
        variant: "error",
      });
    } else {
      setConfirmation({
        isOpen: true,
        title: "Confirmar Activación",
        message: `¿Estás seguro de que deseas activar el tipo de práctica "${original.name}"?`,
        onConfirm: async () => {
          try {
            await toggleTypeStatus(id, true);
          } catch (e) {
            console.error(e);
          } finally {
            setConfirmation(null);
          }
        },
        confirmText: "Activar",
        variant: "success",
      });
    }
  };

  /**
   * Maneja la eliminación de una carrera.
   * @param {string | number} careerId - ID único de la carrera.
   */
  const handleDelete = (careerId: string | number) => {
    const original = careers.find((c) => String(c.careerId) === String(careerId));
    if (!original) return;

    setConfirmation({
      isOpen: true,
      title: "Eliminar Carrera Permanentemente",
      message: `¿Estás seguro de que deseas eliminar permanentemente la carrera "${original.careerName}"? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        try {
          await removeCareer(careerId);
        } catch (e) {
          console.error(e);
        } finally {
          setConfirmation(null);
        }
      },
      confirmText: "Confirmar",
      variant: "error",
    });
  };

  /**
   * Ejecuta la eliminación masiva de múltiples carreras seleccionadas.
   * @param {(string | number)[]} ids - Lista de IDs de carreras a eliminar.
   */
  const handleBulkDelete = (ids: (string | number)[]) => {
    setConfirmation({
      isOpen: true,
      title: "Confirmar Envío a Inactivos (Masivo)",
      message: `¿Estás seguro de que deseas enviar las ${ids.length} carreras seleccionadas a Inactivos?`,
      onConfirm: async () => {
        try {
          await bulkRemoveCareers(ids);
        } catch (e) {
          console.error(e);
        } finally {
          setConfirmation(null);
        }
      },
      confirmText: "Confirmar",
      variant: "error",
    });
  };

  /**
   * Ejecuta la eliminación masiva de tipos de prácticas.
   */
  const handleBulkDeleteTypes = (ids: number[]) => {
    setConfirmation({
      isOpen: true,
      title: "Confirmar Envío a Inactivos (Masivo)",
      message: `¿Estás seguro de que deseas enviar los ${ids.length} tipos de prácticas seleccionados a Inactivos?`,
      onConfirm: async () => {
        try {
          await bulkRemoveTypes(ids);
        } catch (e) {
          console.error(e);
        } finally {
          setConfirmation(null);
        }
      },
      confirmText: "Confirmar",
      variant: "error",
    });
  };

  /**
   * Ejecuta la restauración masiva de múltiples carreras seleccionadas.
   * @param {(string | number)[]} ids - Lista de IDs de carreras a restaurar.
   */
  const handleBulkRestore = (ids: (string | number)[]) => {
    setConfirmation({
      isOpen: true,
      title: "Confirmar Restauración Masiva",
      message: `¿Estás seguro de que deseas restaurar las ${ids.length} carreras seleccionadas?`,
      onConfirm: async () => {
        try {
          await bulkRestoreCareers(ids);
        } catch (e) {
          console.error(e);
        } finally {
          setConfirmation(null);
        }
      },
      confirmText: "Restaurar",
      variant: "success",
    });
  };

  /**
   * Ejecuta la restauración masiva de tipos de prácticas.
   */
  const handleBulkRestoreTypes = (ids: number[]) => {
    setConfirmation({
      isOpen: true,
      title: "Confirmar Restauración Masiva",
      message: `¿Estás seguro de que deseas restaurar los ${ids.length} tipos de prácticas seleccionados?`,
      onConfirm: async () => {
        try {
          await bulkRestoreTypes(ids);
        } catch (e) {
          console.error(e);
        } finally {
          setConfirmation(null);
        }
      },
      confirmText: "Restaurar",
      variant: "success",
    });
  };

  /**
   * Renderizado del componente.
   * Estructura:
   * 1. Meta información y Breadcrumbs.
   * 2. Encabezado con título y acción primaria (Nueva Carrera/Tipo de Práctica).
   * 3. Alertas de página (éxito/error).
   * 4. Pestañas principales (Carreras/Tipos de Prácticas).
   * 5. Card principal con navegación por pestañas secundarias (Activas/Inactivas).
   * 6. Tabla de datos (CareerTable o InternshipTypeTable).
   * 7. Modales secundarios (Edición, Vista, Confirmación).
   */
  return (
    <>
      <PageMeta 
        title={mainTab === "Carreras" ? "Gestión de Carreras" : "Tipos de Prácticas"} 
        description="Administración de carreras y tipos de prácticas académicas" 
      />

      <SkeletonLoader isLoading={pageLoading} skeleton={<BreadcrumbSkeleton />} id="careers-breadcrumb">
        <PageBreadcrumb pageTitle={mainTab} />
      </SkeletonLoader>

      <div className="stagger-delay">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <SkeletonLoader isLoading={pageLoading} skeleton={<TitleSkeleton />} id="careers-title">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-text-primary dark:text-text-emphasis">
                  {mainTab === "Carreras" ? "Gestión de Carreras" : "Tipos de Prácticas"}
                </h2>
              </div>
              <p className="mt-1 text-sm text-text-secondary dark:text-text-tertiary">
                {mainTab === "Carreras" 
                  ? "Configura las ofertas académicas y parámetros de aprobación." 
                  : "Administra los diferentes tipos de prácticas profesionales disponibles."}
              </p>
            </SkeletonLoader>
          </div>
          {!pageLoading && (
            <div className="flex items-center gap-3">
              {mainTab === "Carreras" && (
                <Button
                  variant="outline"
                  onClick={() => setIsPDFModalOpen(true)}
                  startIcon={<DownloadIcon className="h-5 w-5" />}
                >
                  Reporte
                </Button>
              )}
              <Button onClick={handleCreate} startIcon={<PlusCircleIcon className="h-5 w-5" />}>
                {mainTab === "Carreras" ? "Nueva Carrera" : "Nuevo Tipo"}
              </Button>
            </div>
          )}
        </div>

        {/* Pestañas Principales */}
        <div className="mb-6">
          <Tabs
            options={[
              { id: "Carreras", label: "Carreras" },
              { id: "Tipos de Prácticas", label: "Tipos de Prácticas" }
            ]}
            activeTab={mainTab}
            onTabChange={(id) => setMainTab(id as "Carreras" | "Tipos de Prácticas")}
            variant="pills"
          />
        </div>

        {/* Contenido principal */}
        <div className="space-y-6">
          <ComponentCard title={activeTab === "Activas" ? `${mainTab} Activos` : `${mainTab} Inactivos`}>
            <div className="mb-6 flex border-b border-border-light dark:border-white/5">
              <button
                onClick={() => setActiveTab("Activas")}
                className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === "Activas" ? "text-brand-500" : "text-text-secondary hover:text-text-primary"
                  }`}
              >
                Activos
                {activeTab === "Activas" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-500 animate-slideInLeft" />}
              </button>
              <button
                onClick={() => setActiveTab("Inactivas")}
                className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === "Inactivas" ? "text-brand-500" : "text-text-secondary hover:text-text-primary"
                  }`}
              >
                Inactivos
                {activeTab === "Inactivas" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-500 animate-slideInLeft" />}
              </button>
            </div>

            <SkeletonLoader isLoading={pageLoading || (mainTab === "Carreras" ? status === "loading" : loadingTypes)} skeleton={<TablePageSkeleton rows={5} />} id="careers-table">
                {mainTab === "Carreras" ? (
                  <CareerTable
                    data={filtered}
                    status={status}
                    error={error}
                    activeTab={activeTab}
                    practiceOptions={activeInternshipOptions}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleStatus={handleToggleStatus}
                    onView={setViewCareer}
                    onBulkDelete={handleBulkDelete}
                    onBulkRestore={handleBulkRestore}
                    inactiveMode={activeTab === "Inactivas"}
                    loading={loadingAction}
                  />
                ) : (
                <InternshipTypeTable
                  data={internshipTypes}
                  careers={careers}
                  status={loadingTypes ? "loading" : "success"}
                  error={null}
                  activeTab={activeTab}
                  onEdit={handleEditType}
                  onToggleStatus={handleToggleTypeStatus}
                  onView={setViewType}
                  onBulkDelete={handleBulkDeleteTypes}
                  onBulkRestore={handleBulkRestoreTypes}
                  inactiveMode={activeTab === "Inactivas"}
                />
              )}
            </SkeletonLoader>
          </ComponentCard>
        </div>
      </div>

      {/* Modales de Carreras */}
      <CareerModal
        isOpen={isModalOpen}
        onClose={handleCloseCareerModal}
        onSave={handleSave}
        editingCareer={editingCareer}
        internshipOptions={activeInternshipOptions}
        isLoading={loadingAction}
        hasPendingEvaluations={editingCareer?.hasPendingEvaluations}
        isInUse={editingCareer?.isInUse}
        existingCareers={careers}
        onAddInternshipType={() => {
          setEditingType(null);
          setIsTypeModalOpen(true);
        }}
        lastCreatedInternshipTypeId={lastCreatedInternshipTypeId}
        onConsumeLastCreatedInternshipType={() => setLastCreatedInternshipTypeId(null)}
        onEditExisting={handleEditExisting}
      />

      <CareerViewModal
        isOpen={!!viewCareer}
        onClose={() => setViewCareer(null)}
        onEdit={handleEdit}
        career={viewCareer}
        internshipOptions={internshipOptions}
      />

      <PDFPreviewModal
        isOpen={isPDFModalOpen}
        onClose={() => setIsPDFModalOpen(false)}
        title="Reporte de Carreras Activas"
        data={pdfFilteredData}
        template={(data) => <CarreraPDF data={data} />}
        fileName={`reporte-carreras-activas-${new Date().toISOString().split('T')[0]}.pdf`}
        searchTerm={pdfSearchTerm}
        onSearchChange={setPdfSearchTerm}
        columns={[
          { header: "Código", accessor: "careerCode" },
          { header: "Carrera", accessor: "careerName" },
          { header: "Acrónimo", accessor: "careerAbbreviation" },
          { header: "Tipo", accessor: "careerType" },
        ]}
      />

      {/* Modales de Tipos de Prácticas */}
      <InternshipTypeModal
        isOpen={isTypeModalOpen}
        onClose={handleCloseTypeModal}
        onSave={handleSaveType}
        editingItem={editingType}
        existingTypes={internshipTypes}
        isInUse={editingType ? isTypeInUse(editingType.id) : false}
        isLoading={loadingAction}
      />

      <InternshipTypeViewModal
        isOpen={!!viewType}
        onClose={() => setViewType(null)}
        onEdit={handleEditType}
        item={viewType}
      />

      <UnifiedDialog
        isOpen={confirmation?.isOpen || false}
        onClose={() => !loadingAction && setConfirmation(null)}
        title={confirmation?.title || ""}
        message={confirmation?.message || ""}
        variant={confirmation?.variant || "info"}
        confirmLabel={confirmation?.confirmText || "Confirmar"}
        onConfirm={() => confirmation?.onConfirm()}
        isLoading={loadingAction}
      />
    </>
  );
}
