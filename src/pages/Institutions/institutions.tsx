/**
 * @file institutions.tsx
 * @description Página principal para la gestión del módulo de Instituciones.
 * Orquesta la visualización de datos en tablas, la gestión de estados (activos/inactivos),
 * y las operaciones CRUD (Crear, Leer, Actualizar, Eliminar) mediante modales y hooks especializados.
 */

import { useMemo, useState, useEffect } from "react";
import { useTheme } from "../../context/theme";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import { FullScreenLoader } from "../../components/ui/loader";
import { SkeletonLoader, TitleSkeleton, BreadcrumbSkeleton, TablePageSkeleton } from "../../components/ui/skeleton";
import { PlusCircleIcon, XIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from "../../icons/actions";
import InstitutionTable from "../../features/institutions/components/InstitutionTable";
import InstitutionModal from "../../features/institutions/components/InstitutionModal";
import { useInstitutions } from "../../features/institutions/hooks/useInstitutions";
import { Institution, InstitutionRowData } from "../../features/institutions/types";
import { useCareers } from "../../features/careers/hooks/useCareers";
import { formatDateTime } from "../../utils/date";

const formatInstToRow = (i: Institution): InstitutionRowData => ({
  ...i,
  registrationDate: formatDateTime(i.registrationDate),
});

export default function InstitutionsPage() {
  const { colorMode } = useTheme();
  const [pageLoading, setPageLoading] = useState(true);
  const { careers } = useCareers();
  const careerOptions = useMemo(() => careers.map(c => ({ value: c.careerId, label: c.careerName })), [careers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const {
    institutions,
    status,
    loadingAction,
    addInstitution,
    editInstitution,
    toggleStatus,
    bulkRemoveInstitutions,
    bulkRestoreInstitutions,
  } = useInstitutions();

  const [activeTab, setActiveTab] = useState<"Activas" | "Inactivas">("Activas");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInst, setEditingInst] = useState<Institution | null>(null);
  const [viewInst, setViewInst] = useState<InstitutionRowData | null>(null);

  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText: string;
    variant: "success" | "error" | "warning" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    confirmText: "Confirmar",
    variant: "info",
  });

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

  const tableData = useMemo(() => {
    const byStatus = institutions.filter((i) => (activeTab === "Activas" ? i.status : !i.status));
    return byStatus.map(formatInstToRow);
  }, [institutions, activeTab]);

  const handleOpenAddModal = () => {
    setEditingInst(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (inst: InstitutionRowData) => {
    const original = institutions.find(i => i.institutionId === inst.institutionId);
    if (original) {
      setEditingInst(original);
      setIsModalOpen(true);
    }
  };

  const handleToggleStatus = (inst: InstitutionRowData) => {
    const original = institutions.find(i => i.institutionId === inst.institutionId);
    if (!original) return;

    setConfirmation({
      isOpen: true,
      title: original.status ? "Inactivar Institución" : "Restaurar Institución",
      message: `¿Está seguro que desea ${original.status ? 'inactivar' : 'restaurar'} la institución "${original.name}"?`,
      variant: original.status ? "warning" : "success",
      confirmText: original.status ? "Inactivar" : "Restaurar",
      onConfirm: () => toggleStatus(original),
    });
  };

  const handleBulkRemove = (ids: string[]) => {
    setConfirmation({
      isOpen: true,
      title: "Inactivación Masiva",
      message: `¿Está seguro que desea inactivar ${ids.length} instituciones seleccionadas?`,
      variant: "warning",
      confirmText: "Inactivar",
      onConfirm: () => bulkRemoveInstitutions(ids),
    });
  };

  const handleBulkRestore = (ids: string[]) => {
    setConfirmation({
      isOpen: true,
      title: "Restauración Masiva",
      message: `¿Está seguro que desea restaurar ${ids.length} instituciones seleccionadas?`,
      variant: "success",
      confirmText: "Restaurar",
      onConfirm: () => bulkRestoreInstitutions(ids),
    });
  };

  return (
    <>
      <PageMeta title="Gestión de Instituciones" description="Administración de instituciones aliadas" />

      <SkeletonLoader isLoading={pageLoading} skeleton={<BreadcrumbSkeleton />} id="institutions-breadcrumb">
        <PageBreadcrumb pageTitle="Instituciones" />
      </SkeletonLoader>

      {loadingAction && <FullScreenLoader label="Procesando..." />}

      <div className="stagger-delay">
        {/* Banner de Modo Demostración */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <SkeletonLoader isLoading={pageLoading} skeleton={<TitleSkeleton />} id="institutions-title">
                    <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Listado de Instituciones</h2>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Gestiona la información y estado de las instituciones aliadas.</p>
                </SkeletonLoader>
            </div>

            {!pageLoading && (
                <Button onClick={handleOpenAddModal} startIcon={<PlusCircleIcon className="h-5 w-5" />}>
                    Nueva Institución
                </Button>
            )}
        </div>

        {/* Contenido principal */}
        <div className="space-y-6">
          <ComponentCard title={activeTab === "Activas" ? "Instituciones Activas" : "Instituciones Inactivas"}>
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

            <SkeletonLoader isLoading={pageLoading || status === "loading"} skeleton={<TablePageSkeleton rows={5} />} id="institutions-table">
              <InstitutionTable
                data={tableData}
                status={status}
                activeTab={activeTab}
                careerOptions={careerOptions}
                onEdit={handleOpenEditModal}
                onView={setViewInst}
                onToggleStatus={handleToggleStatus}
                onBulkDelete={handleBulkRemove}
                onBulkRestore={handleBulkRestore}
              />
            </SkeletonLoader>
          </ComponentCard>
        </div>
      </div>

      <InstitutionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={async (data) => {
          if (editingInst) {
            await editInstitution({ ...editingInst, ...data });
          } else {
            await addInstitution(data);
          }
          setIsModalOpen(false);
        }}
        editingInst={editingInst}
        careerOptions={careerOptions}
        isLoading={loadingAction}
      />

      {/* Modal de Vista Detallada */}
      <Modal isOpen={!!viewInst} onClose={() => setViewInst(null)} isFullscreen={true} showCloseButton>
        <ModalHeader className="shrink-0 pt-8 px-6 sm:px-12">Detalles de Institución</ModalHeader>
        <ModalBody className="overflow-y-auto custom-scrollbar grow px-6 sm:px-12 py-8">
          {viewInst && (
            <div className="space-y-12 max-w-5xl mx-auto py-2">
                {/* Sección Información Principal */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2 dark:border-white/5">
                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        <h4 className="font-bold text-gray-800 dark:text-white/90 uppercase text-xs tracking-wider">Información Principal</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                        <div className="sm:col-span-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Nombre</label>
                            <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{viewInst.name}</p>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">RIF</label>
                            <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{viewInst.rif}</p>
                        </div>
                        <div className="sm:col-span-3">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Dirección Fiscal</label>
                            <p className="text-sm text-gray-800 dark:text-white/90">{viewInst.fiscalAddress}</p>
                        </div>
                    </div>
                </div>

                {/* Sección Detalles Operativos */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2 dark:border-white/5">
                        <div className="h-2 w-2 rounded-full bg-brand-500"></div>
                        <h4 className="font-bold text-gray-800 dark:text-white/90 uppercase text-xs tracking-wider">Detalles Operativos</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Teléfono</label>
                            <p className="text-sm font-bold text-gray-800 dark:text-white/90">{viewInst.phone}</p>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Carrera</label>
                            <p className="text-sm font-bold text-gray-800 dark:text-white/90 uppercase">{viewInst.careerName}</p>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Tipo de Práctica</label>
                            <p className="text-sm font-bold text-gray-800 dark:text-white/90">{viewInst.practiceType}</p>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Tipo de Institución</label>
                            <p className="text-sm font-bold text-gray-800 dark:text-white/90">{viewInst.institutionType}</p>
                        </div>
                    </div>
                </div>

                {/* Estado y Fechas */}
                <div className="rounded-xl bg-gray-50 dark:bg-white/3 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Estado</label>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${viewInst.status ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>
                            {viewInst.status ? "Activa" : "Inactiva"}
                        </span>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Fecha Registro</label>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{viewInst.registrationDate}</p>
                    </div>
                </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter className="shrink-0">
          <Button variant="outline" onClick={() => setViewInst(null)} className="flex-1 sm:flex-none">
            Cerrar
          </Button>
          <Button onClick={() => { handleOpenEditModal(viewInst!); setViewInst(null); }} className="flex-1 sm:flex-none">
            Editar Información
          </Button>
        </ModalFooter>
      </Modal>

      {/* Modal de Confirmación Genérico */}
      <Modal isOpen={confirmation.isOpen} onClose={() => setConfirmation(prev => ({ ...prev, isOpen: false }))} className={`max-w-md ${colorMode === "dark" ? "dark" : ""}`}>
        <ModalBody className="text-center pt-8">
            <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${confirmationStyles[confirmation.variant].iconBg}`}>
                {confirmationStyles[confirmation.variant].icon}
            </div>
            <h3 className="mb-2 text-lg font-bold text-gray-800 dark:text-white/90">{confirmation.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{confirmation.message}</p>
        </ModalBody>
        <ModalFooter className="justify-center border-t-0 pt-0 pb-8">
            <Button
                variant="outline"
                onClick={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
                disabled={loadingAction}
            >
                Cancelar
            </Button>
            <Button
                variant={confirmation.variant === "error" ? "error" : "primary"}
                onClick={() => { confirmation.onConfirm(); setConfirmation(prev => ({ ...prev, isOpen: false })); }}
                loading={loadingAction}
            >
                {confirmation.confirmText}
            </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
