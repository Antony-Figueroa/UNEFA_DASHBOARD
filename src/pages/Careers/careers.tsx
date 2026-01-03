/**
 * @file careers.tsx
 * @description Página principal para la gestión del módulo de Carreras. 
 * Orquesta la visualización de datos en tablas, la gestión de estados (activos/inactivos),
 * y las operaciones CRUD (Crear, Leer, Actualizar, Eliminar) mediante modales y hooks especializados.
 * 
 * @module Pages/Careers
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

import CareerTable from "../../features/careers/components/CareerTable";
import CareerModal from "../../features/careers/components/CareerModal";
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
  const { colorMode } = useTheme();
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
    variant: "success" | "error" | "warning" | "info";
  };

  /**
   * Configuración visual (estilos e iconos) para los diferentes tipos de diálogos de confirmación.
   */
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
      title: isEditing ? "Confirmar Modificación" : "Confirmar Creación",
      message: `¿Estás seguro de que deseas ${isEditing ? "guardar los cambios en" : "crear"} esta carrera?`,
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
      confirmText: "Confirmar",
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
      title: goingInactive ? "Confirmar Envío a Inactivos" : "Confirmar Restauración",
      message: goingInactive
        ? `¿Deseas enviar la carrera "${original.careerName}" a Inactivos?`
        : `¿Deseas restaurar la carrera "${original.careerName}"?`,
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

  /**
   * Ejecuta la eliminación masiva de múltiples carreras seleccionadas.
   * @param {string[]} ids - Lista de IDs de carreras a eliminar.
   */
  const handleBulkDelete = (ids: string[]) => {
    setConfirmation({
      isOpen: true,
      title: "Confirmar Eliminación Masiva",
      message: `¿Estás seguro de que deseas enviar las ${ids.length} carreras seleccionadas a la Inactivo?`,
      onConfirm: async () => {
        try {
          await bulkRemoveCareers(ids);
        } catch (e) {
          console.error(e);
        } finally {
          setConfirmation(null);
        }
      },
      confirmText: "Eliminar seleccionadas",
      variant: "error",
    });
  };

  /**
   * Ejecuta la restauración masiva de múltiples carreras seleccionadas de la Inactivo.
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
      confirmText: "Restaurar seleccionadas",
      variant: "info",
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
        editingCareer={editingCareer ?? undefined}
        internshipOptions={internshipOptions}
      />

      {/* Modal Ver */}
      <Modal isOpen={!!viewCareer} onClose={() => setViewCareer(null)} className={`max-w-xl w-11.5/12 ${colorMode === "dark" ? "dark" : ""}`} showCloseButton>
        <div className="flex flex-col max-h-9/10">
          <ModalHeader className="shrink-0">Detalles de la Carrera</ModalHeader>
          <ModalBody className="overflow-y-auto custom-scrollbar grow">
            {viewCareer && (
              <div className="space-y-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                <p><span className="font-medium">Código:</span> {viewCareer.careerCode}</p>
                <p><span className="font-medium">Nombre:</span> {viewCareer.careerName}</p>
                <p><span className="font-medium">Nota mínima:</span> {viewCareer.minimumGrade.toFixed(2)}</p>
                <p><span className="font-medium">Abreviatura:</span> {viewCareer.careerAbbreviation}</p>
                <p><span className="font-medium">Estado:</span> {viewCareer.status ? "Activo" : "Inactivo"}</p>
                <p><span className="font-medium">Creación:</span> {viewCareer.creationDate}</p>
              </div>
            )}
          </ModalBody>
          <ModalFooter className="shrink-0">
            <Button variant="outline" onClick={() => setViewCareer(null)} className="flex-1 sm:flex-none">
              Cerrar
            </Button>
            <Button onClick={() => { handleEdit(viewCareer!); setViewCareer(null); }} className="flex-1 sm:flex-none">
              Editar Carrera
            </Button>
          </ModalFooter>
        </div>
      </Modal>

      {confirmation?.isOpen && (
        <Modal
          isOpen={confirmation.isOpen}
          onClose={() => setConfirmation(null)}
          className={`max-w-sm ${colorMode === "dark" ? "dark" : ""}`}
        >
          <ModalBody className="text-center pt-8">
            <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${confirmationStyles[confirmation.variant].iconBg}`}>
              {confirmationStyles[confirmation.variant].icon}
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-800 dark:text-white">{confirmation.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{confirmation.message}</p>
          </ModalBody>
          <ModalFooter className="justify-center border-t-0 pt-0 pb-8">
            <button
              onClick={() => setConfirmation(null)}
              className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/3 sm:w-auto"
            >
              Cancelar
            </button>
            <button
              onClick={confirmation.onConfirm}
              className={`flex w-full justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-white sm:w-auto ${confirmationStyles[confirmation.variant].button}`}
            >
              {confirmation.confirmText}
            </button>
          </ModalFooter>
        </Modal>
      )}
    </>
  );
}
