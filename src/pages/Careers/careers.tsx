/**
 * @file careers.tsx
 * @description Página principal para la gestión del módulo de Carreras. 
 * Orquesta la visualización de datos en tablas, la gestión de estados (activos/inactivos),
 * y las operaciones CRUD (Crear, Leer, Actualizar, Eliminar) mediante modales y hooks especializados.
 * 
 * @module Pages/Careers
 */

import { useMemo, useState, useEffect } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import UnifiedDialog from "../../components/ui/dialog/UnifiedDialog";
import { DialogVariant } from "../../components/ui/dialog/DialogConfig";
import Button from "../../components/ui/button/Button";
import { FullScreenLoader } from "../../components/ui/loader";
import { SkeletonLoader, TitleSkeleton, BreadcrumbSkeleton, TablePageSkeleton } from "../../components/ui/skeleton";
import { PlusCircleIcon, InformationCircleIcon } from "../../icons/actions";

import CareerTable from "../../features/careers/components/CareerTable";
import CareerModal from "../../features/careers/components/CareerModal";
import CareerViewModal from "../../features/careers/components/CareerViewModal";
import { useCareers } from "../../features/careers/hooks/useCareers";
import { Career, CareerRowData } from "../../features/careers/types";
import { formatDateTime } from "../../utils/date";

/**
 * Opciones estáticas para los tipos de prácticas.
 * @constant {Array<{value: string, text: string}>}
 */
const internshipOptions = [
  { value: "HOSPITALARIA", text: "Hospitalaria" },
  { value: "COMUNITARIA", text: "Comunitaria" },
  { value: "ORDINARIA", text: "Ordinaria" },
];

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  /**
   * Hook personalizado que encapsula la lógica de negocio y peticiones al servidor.
   * Proporciona los datos, estados de carga y funciones de mutación.
   */
  const {
    careers,
    status,
    loadingAction,
    error,
    addCareer,
    editCareer,
    removeCareer,
    toggleStatus,
    bulkRemoveCareers,
    bulkRestoreCareers,
  } = useCareers();

  /** @state {('Activas'|'Inactivas')} activeTab - Controla qué conjunto de datos se muestra en la tabla. */
  const [activeTab, setActiveTab] = useState<"Activas" | "Inactivas">("Activas");

  /** @state {boolean} isModalOpen - Controla la visibilidad del modal de creación/edición. */
  const [isModalOpen, setIsModalOpen] = useState(false);

  /** @state {Career|null} editingCareer - Almacena la carrera que se está editando actualmente. */
  const [editingCareer, setEditingCareer] = useState<Career | null>(null);

  /** @state {CareerRowData|null} viewCareer - Almacena los datos de la carrera para el modal de vista rápida. */
  const [viewCareer, setViewCareer] = useState<CareerRowData | null>(null);

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
   * Se recalcula solo cuando cambian las carreras o la pestaña activa.
   */
  const filtered = useMemo(() => {
    const byStatus = careers.filter((c) => (activeTab === "Activas" ? c.status : !c.status));
    return byStatus.map(formatCareerToRow);
  }, [careers, activeTab]);

  /**
   * Prepara el estado para crear una nueva carrera y abre el modal.
   */
  const handleCreate = () => {
    setEditingCareer(null);
    setIsModalOpen(true);
  };

  /**
   * Prepara el estado para editar una carrera existente.
   * @param {CareerRowData} row - Los datos de la fila seleccionada.
   */
  const handleEdit = (row: CareerRowData) => {
    const original = careers.find((c) => c.careerId === row.careerId) || null;
    setEditingCareer(original);
    setIsModalOpen(true);
  };

  /**
   * Procesa el guardado (Crear o Actualizar) de una carrera con confirmación previa.
   * 
   * @param {Omit<Career, "careerId" | "creationDate">} payload - Datos validados del formulario.
   * @warning Esta función es asíncrona y maneja estados globales de confirmación.
   */
  const handleSave = (
    payload: Omit<Career, "careerId" | "creationDate">
  ) => {
    const isEditing = !!editingCareer;
    setConfirmation({
      isOpen: true,
      title: isEditing ? "Confirmar Modificación" : "Confirmar Registro",
      message: `¿Estás seguro de que deseas ${isEditing ? "guardar los cambios en" : "registrar"} esta carrera?`,
      onConfirm: async () => {
        try {
          if (isEditing && editingCareer) {
            await editCareer({ ...editingCareer, ...payload });
          } else {
            await addCareer(payload);
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

  /**
   * Alterna el estado de una carrera entre Activo e Inactivo.
   * @param {string} careerId - ID único de la carrera.
   */
  const handleToggleStatus = (careerId: string) => {
    const original = careers.find((c) => c.careerId === careerId);
    if (!original) return;
    const goingInactive = original.status === true;
    setConfirmation({
      isOpen: true,
      title: goingInactive ? "Confirmar Eliminación" : "Confirmar Restauración",
      message: `¿Estás seguro de que deseas ${goingInactive ? "eliminar" : "restaurar"} la carrera "${original.careerName}"?`,
      onConfirm: async () => {
        try {
          await toggleStatus(original);
        } catch (e) { console.error(e); }
        finally { setConfirmation(null); }
      },
      confirmText: goingInactive ? "Eliminar" : "Restaurar",
      variant: goingInactive ? "error" : "success",
    });
  };

  /**
   * Maneja la eliminación de una carrera.
   * @param {string} careerId - ID único de la carrera.
   */
  const handleDelete = (careerId: string) => {
    const original = careers.find((c) => c.careerId === careerId);
    if (!original) return;

    setConfirmation({
      isOpen: true,
      title: "Confirmar Eliminación",
      message: `¿Estás seguro de que deseas eliminar la carrera "${original.careerName}"?`,
      onConfirm: async () => {
        try {
          await removeCareer(original);
        } catch (e) {
          console.error(e);
        } finally {
          setConfirmation(null);
        }
      },
      confirmText: "Eliminar",
      variant: "error",
    });
  };

  /**
   * Ejecuta la eliminación masiva de múltiples carreras seleccionadas.
   * @param {string[]} ids - Lista de IDs de carreras a eliminar.
   */
  const handleBulkDelete = (ids: string[]) => {
    setConfirmation({
      isOpen: true,
      title: "Confirmar Eliminación Masiva",
      message: `¿Estás seguro de que deseas eliminar las ${ids.length} carreras seleccionadas?`,
      onConfirm: async () => {
        try {
          await bulkRemoveCareers(ids);
        } catch (e) {
          console.error(e);
        } finally {
          setConfirmation(null);
        }
      },
      confirmText: "Eliminar",
      variant: "error",
    });
  };

  /**
   * Ejecuta la restauración masiva de múltiples carreras seleccionadas.
   * @param {string[]} ids - Lista de IDs de carreras a restaurar.
   */
  const handleBulkRestore = (ids: string[]) => {
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
   * Renderizado del componente.
   * Estructura:
   * 1. Meta información y Breadcrumbs.
   * 2. Encabezado con título y acción primaria (Nueva Carrera).
   * 3. Alertas de página (éxito/error).
   * 4. Card principal con navegación por pestañas (Activas/Inactivas).
   * 5. Tabla de datos (CareerTable).
   * 6. Modales secundarios (Edición, Vista, Confirmación).
   */
  return (
    <>
      <PageMeta title="Gestión de Carreras" description="Administración de carreras académicas" />

      <SkeletonLoader isLoading={pageLoading} skeleton={<BreadcrumbSkeleton />} id="careers-breadcrumb">
        <PageBreadcrumb pageTitle="Carreras" />
      </SkeletonLoader>

      {loadingAction && <FullScreenLoader label="Procesando..." />}

      <div className="stagger-delay">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <SkeletonLoader isLoading={pageLoading} skeleton={<TitleSkeleton />} id="careers-title">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Gestión de Carreras</h2>
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                  MockAPI
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Configura las ofertas académicas y parámetros de aprobación.</p>
            </SkeletonLoader>
          </div>
          {!pageLoading && (
            <Button onClick={handleCreate} startIcon={<PlusCircleIcon className="h-5 w-5" />}>
              Nueva Carrera
            </Button>
          )}
        </div>

        {/* Banner Informativo */}
        {!pageLoading && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-700 dark:border-blue-900/30 dark:bg-blue-500/10 dark:text-blue-400">
            <InformationCircleIcon className="h-5 w-5 shrink-0" />
            <div className="text-sm">
              <span className="font-bold">Información de API:</span> Las carreras se gestionan mediante MockAPI para simular un entorno real. Los cambios persisten durante la sesión.
            </div>
          </div>
        )}

        {/* Contenido principal */}
        <div className="space-y-6">
          <ComponentCard title={activeTab === "Activas" ? "Carreras Activas" : "Carreras Inactivas"}>
            <div className="mb-6 flex border-b border-gray-200 dark:border-white/5">
              <button
                onClick={() => setActiveTab("Activas")}
                className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === "Activas" ? "text-brand-500" : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                Activas
                {activeTab === "Activas" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-500 animate-slideInLeft" />}
              </button>
              <button
                onClick={() => setActiveTab("Inactivas")}
                className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === "Inactivas" ? "text-brand-500" : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                Inactivas
                {activeTab === "Inactivas" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-500 animate-slideInLeft" />}
              </button>
            </div>

            <SkeletonLoader isLoading={pageLoading || status === "loading"} skeleton={<TablePageSkeleton rows={5} />} id="careers-table">
              <CareerTable
                data={filtered}
                status={status}
                error={error}
                activeTab={activeTab}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
                onView={setViewCareer}
                onBulkDelete={handleBulkDelete}
                onBulkRestore={handleBulkRestore}
                inactiveMode={activeTab === "Inactivas"}
                loading={loadingAction}
              />
            </SkeletonLoader>
          </ComponentCard>
        </div>
      </div>

      {/* Modal Crear/Editar */}
      <CareerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editingCareer={editingCareer}
        internshipOptions={internshipOptions}
        isLoading={loadingAction}
      />

      {/* Modal Ver */}
      <CareerViewModal
        isOpen={!!viewCareer}
        onClose={() => setViewCareer(null)}
        onEdit={handleEdit}
        career={viewCareer}
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
