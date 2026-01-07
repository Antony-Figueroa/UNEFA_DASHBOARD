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
import { Modal, ModalBody, ModalFooter } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import { FullScreenLoader } from "../../components/ui/loader";
import { SkeletonLoader, TitleSkeleton, BreadcrumbSkeleton, TablePageSkeleton } from "../../components/ui/skeleton";
import { Tabs } from "../../components/ui/tabs/Tabs";
import { PlusCircleIcon, XIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from "../../icons/actions";
import InstitutionTable from "../../features/institutions/components/InstitutionTable";
import InstitutionModal from "../../features/institutions/components/InstitutionModal";
import InstitutionViewModal from "../../features/institutions/components/InstitutionViewModal";
import InstitutionalResponsibleTable from "../../features/institutions/components/InstitutionalResponsibleTable";
import InstitutionalResponsibleModal from "../../features/institutions/components/InstitutionalResponsibleModal";
import InstitutionalResponsibleViewModal from "../../features/institutions/components/InstitutionalResponsibleViewModal";
import { useInstitutions } from "../../features/institutions/hooks/useInstitutions";
import { useInstitutionalResponsibles } from "../../features/institutions/hooks/useInstitutionalResponsibles";
import { Institution, InstitutionRowData, InstitutionalResponsible, InstitutionalResponsibleRowData } from "../../features/institutions/types";
import { useCareers } from "../../features/careers/hooks/useCareers";
import { formatDateTime } from "../../utils/date";

const formatInstToRow = (i: Institution): InstitutionRowData => ({
  ...i,
  registrationDate: formatDateTime(i.registrationDate),
});

const formatRespToRow = (r: InstitutionalResponsible): InstitutionalResponsibleRowData => ({
  ...r,
  registrationDate: formatDateTime(r.registrationDate),
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
    status: instStatus,
    loadingAction: instLoadingAction,
    addInstitution,
    editInstitution,
    toggleStatus: toggleInstStatus,
    bulkRemoveInstitutions,
    bulkRestoreInstitutions,
  } = useInstitutions();

  const {
    responsibles,
    status: respStatus,
    loadingAction: respLoadingAction,
    addResponsible,
    editResponsible,
    toggleStatus: toggleRespStatus,
    bulkRemoveResponsibles,
    bulkRestoreResponsibles,
  } = useInstitutionalResponsibles();

  const [mainTab, setMainTab] = useState<"Instituciones" | "Responsables">("Instituciones");
  const [activeTab, setActiveTab] = useState<"Activas" | "Inactivas">("Activas");
  
  // Estados para Instituciones
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInst, setEditingInst] = useState<Institution | null>(null);
  const [viewInst, setViewInst] = useState<InstitutionRowData | null>(null);

  // Estados para Responsables
  const [isRespModalOpen, setIsRespModalOpen] = useState(false);
  const [editingResp, setEditingResp] = useState<InstitutionalResponsible | null>(null);
  const [viewResp, setViewResp] = useState<InstitutionalResponsibleRowData | null>(null);

  const institutionOptions = useMemo(() => 
    institutions.filter(i => i.status).map(i => ({ value: i.institutionId, label: i.name })),
  [institutions]);

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

  const loadingAction = instLoadingAction || respLoadingAction;

  const confirmationStyles = {
    error: {
      iconBg: "bg-red-100 dark:bg-red-900/30",
      icon: <XIcon className="h-6 w-6 text-red-600 dark:text-red-500" />,
      button: "bg-red-600 hover:bg-red-700 dark:hover:bg-red-500",
    },
    success: {
      iconBg: "bg-green-100 dark:bg-green-900/30",
      icon: <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-500" />,
      button: "bg-green-500 hover:bg-green-600 dark:hover:bg-green-400",
    },
    warning: {
      iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
      icon: <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500 dark:text-yellow-400" />,
      button: "bg-yellow-500 hover:bg-yellow-600 dark:hover:bg-yellow-400",
    },
    info: {
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      icon: <InformationCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-500" />,
      button: "bg-blue-500 hover:bg-blue-600 dark:hover:bg-blue-400",
    },
  };

  const instTableData = useMemo(() => {
    return institutions.map(formatInstToRow);
  }, [institutions]);

  const respTableData = useMemo(() => {
    return responsibles.map(formatRespToRow);
  }, [responsibles]);

  const handleOpenAddModal = () => {
    if (mainTab === "Instituciones") {
      setEditingInst(null);
      setIsModalOpen(true);
    } else {
      setEditingResp(null);
      setIsRespModalOpen(true);
    }
  };

  const handleOpenEditModal = (inst: InstitutionRowData) => {
    const original = institutions.find(i => i.institutionId === inst.institutionId);
    if (original) {
      setEditingInst(original);
      setIsModalOpen(true);
    }
  };

  const handleOpenEditRespModal = (resp: InstitutionalResponsibleRowData) => {
    const original = responsibles.find(r => r.responsibleId === resp.responsibleId);
    if (original) {
      setEditingResp(original);
      setIsRespModalOpen(true);
    }
  };

  const handleToggleInstStatus = (inst: InstitutionRowData) => {
    const original = institutions.find(i => i.institutionId === inst.institutionId);
    if (!original) return;

    setConfirmation({
      isOpen: true,
      title: original.status ? "Eliminar Institución" : "Restaurar Institución",
      message: `¿Está seguro que desea ${original.status ? 'Eliminar' : 'restaurar'} la institución "${original.name}"?`,
      variant: original.status ? "warning" : "success",
      confirmText: original.status ? "Eliminar" : "Restaurar",
      onConfirm: () => toggleInstStatus(original),
    });
  };

  const handleToggleRespStatus = (resp: InstitutionalResponsibleRowData) => {
    const original = responsibles.find(r => r.responsibleId === resp.responsibleId);
    if (!original) return;

    setConfirmation({
      isOpen: true,
      title: original.status ? "Eliminar Responsable" : "Restaurar Responsable",
      message: `¿Está seguro que desea ${original.status ? 'Eliminar' : 'restaurar'} al responsable "${original.firstName} ${original.lastName}"?`,
      variant: original.status ? "warning" : "success",
      confirmText: original.status ? "Eliminar" : "Restaurar",
      onConfirm: () => toggleRespStatus(original),
    });
  };

  const handleBulkInstAction = (ids: string[], action: "inactivate" | "restore") => {
    setConfirmation({
      isOpen: true,
      title: action === "inactivate" ? "Eliminación Masiva" : "Restauración Masiva",
      message: `¿Está seguro que desea ${action === "inactivate" ? 'Eliminar' : 'restaurar'} ${ids.length} instituciones seleccionadas?`,
      variant: action === "inactivate" ? "warning" : "success",
      confirmText: action === "inactivate" ? "Eliminar" : "Restaurar",
      onConfirm: () => action === "inactivate" ? bulkRemoveInstitutions(ids) : bulkRestoreInstitutions(ids),
    });
  };

  const handleBulkRespAction = (ids: string[], action: "inactivate" | "restore") => {
    setConfirmation({
      isOpen: true,
      title: action === "inactivate" ? "Eliminación Masiva" : "Restauración Masiva",
      message: `¿Está seguro que desea ${action === "inactivate" ? 'Eliminar' : 'restaurar'} ${ids.length} responsables seleccionados?`,
      variant: action === "inactivate" ? "warning" : "success",
      confirmText: action === "inactivate" ? "Eliminar" : "Restaurar",
      onConfirm: () => action === "inactivate" ? bulkRemoveResponsibles(ids) : bulkRestoreResponsibles(ids),
    });
  };

  return (
    <>
      <PageMeta title="Gestión de Instituciones" description="Administración de instituciones aliadas y responsables" />

      <SkeletonLoader isLoading={pageLoading} skeleton={<BreadcrumbSkeleton />} id="institutions-breadcrumb">
        <PageBreadcrumb pageTitle="Instituciones" />
      </SkeletonLoader>

      {loadingAction && <FullScreenLoader label="Procesando..." />}

      <div className="stagger-delay">
        {/* Banner de Título */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <SkeletonLoader isLoading={pageLoading} skeleton={<TitleSkeleton />} id="institutions-title">
                    <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
                          {mainTab === "Instituciones" ? "Listado de Instituciones" : "Responsables Institucionales"}
                        </h2>
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                            Demo
                        </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {mainTab === "Instituciones" 
                        ? "Gestiona la información y estado de las instituciones aliadas." 
                        : "Gestiona los representantes y responsables de cada institución."}
                    </p>
                </SkeletonLoader>
            </div>

            {!pageLoading && (
                <Button onClick={handleOpenAddModal} startIcon={<PlusCircleIcon className="h-5 w-5" />}>
                    {mainTab === "Instituciones" ? "Nueva Institución" : "Nuevo Responsable"}
                </Button>
            )}
        </div>

        {/* Pestañas Principales */}
        <Tabs
          variant="pills"
          options={[
            { id: "Instituciones", label: "Instituciones" },
            { id: "Responsables", label: "Responsables" },
          ]}
          activeTab={mainTab}
          onTabChange={(id) => setMainTab(id as "Instituciones" | "Responsables")}
          className="mb-6"
        />

        {/* Contenido principal */}
        <div className="space-y-6">
          <ComponentCard title={mainTab === "Instituciones" ? "Gestión de Instituciones" : "Gestión de Responsables"}>
            <Tabs
              variant="underline"
              options={[
                { id: "Activas", label: mainTab === "Instituciones" ? "Instituciones Activas" : "Responsables Activos" },
                { id: "Inactivas", label: mainTab === "Instituciones" ? "Instituciones Inactivas" : "Responsables Inactivos" },
              ]}
              activeTab={activeTab}
              onTabChange={(id) => setActiveTab(id as "Activas" | "Inactivas")}
              className="mb-6"
            />

            <SkeletonLoader 
              isLoading={pageLoading || instStatus === "loading" || respStatus === "loading"} 
              skeleton={<TablePageSkeleton rows={5} />} 
              id="institutions-table-skeleton"
            >
              {mainTab === "Instituciones" ? (
                <InstitutionTable
                  data={instTableData}
                  status={instStatus}
                  activeTab={activeTab}
                  careerOptions={careerOptions}
                  onEdit={handleOpenEditModal}
                  onView={setViewInst}
                  onToggleStatus={handleToggleInstStatus}
                  onBulkDelete={(ids) => handleBulkInstAction(ids, "inactivate")}
                  onBulkRestore={(ids) => handleBulkInstAction(ids, "restore")}
                />
              ) : (
                <InstitutionalResponsibleTable
                  data={respTableData}
                  activeTab={activeTab}
                  onEdit={handleOpenEditRespModal}
                  onView={setViewResp}
                  onToggleStatus={handleToggleRespStatus}
                  onBulkAction={handleBulkRespAction}
                  isLoading={respStatus === "loading"}
                />
              )}
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

      <InstitutionalResponsibleModal
        isOpen={isRespModalOpen}
        onClose={() => setIsRespModalOpen(false)}
        onSave={async (data) => {
          if (editingResp) {
            await editResponsible({ ...editingResp, ...data } as InstitutionalResponsible);
          } else {
            await addResponsible(data as Omit<InstitutionalResponsible, "responsibleId" | "registrationDate">);
          }
          setIsRespModalOpen(false);
        }}
        editingResp={editingResp}
        institutionOptions={institutionOptions}
        isLoading={loadingAction}
      />

      <InstitutionViewModal
        isOpen={!!viewInst}
        onClose={() => setViewInst(null)}
        onEdit={handleOpenEditModal}
        institution={viewInst}
      />

      <InstitutionalResponsibleViewModal
        isOpen={!!viewResp}
        onClose={() => setViewResp(null)}
        onEdit={handleOpenEditRespModal}
        responsible={viewResp}
      />

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
