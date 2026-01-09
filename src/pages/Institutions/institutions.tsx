/**
 * @file institutions.tsx
 * @description Página principal para la gestión del módulo de Instituciones.
 * Orquesta la visualización de datos en tablas, la gestión de estados (activos/inactivos),
 * y las operaciones CRUD (Crear, Leer, Actualizar, Eliminar) mediante modales y hooks especializados.
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
import { Tabs } from "../../components/ui/tabs/Tabs";
import { PlusCircleIcon } from "../../icons/actions";
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
    variant: DialogVariant;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    confirmText: "Confirmar",
    variant: "info",
  });

  const loadingAction = instLoadingAction || respLoadingAction;

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
      title: original.status ? "Confirmar Envío a Inactivos" : "Confirmar Restauración",
      message: original.status 
        ? `¿Estás seguro de que deseas enviar la institución "${original.name}" a Inactivos?`
        : `¿Estás seguro de que deseas restaurar la institución "${original.name}"?`,
      variant: original.status ? "error" : "success",
      confirmText: original.status ? "Confirmar" : "Restaurar",
      onConfirm: () => toggleInstStatus(original),
    });
  };

  const handleToggleRespStatus = (resp: InstitutionalResponsibleRowData) => {
    const original = responsibles.find(r => r.responsibleId === resp.responsibleId);
    if (!original) return;

    setConfirmation({
      isOpen: true,
      title: original.status ? "Confirmar Envío a Inactivos" : "Confirmar Restauración",
      message: original.status 
        ? `¿Estás seguro de que deseas enviar al responsable "${original.firstName} ${original.lastName}" a Inactivos?`
        : `¿Estás seguro de que deseas restaurar al responsable "${original.firstName} ${original.lastName}"?`,
      variant: original.status ? "error" : "success",
      confirmText: original.status ? "Confirmar" : "Restaurar",
      onConfirm: () => toggleRespStatus(original),
    });
  };

  const handleBulkInstAction = (ids: string[], action: "inactivate" | "restore") => {
    setConfirmation({
      isOpen: true,
      title: action === "inactivate" ? "Confirmar Envío a Inactivos (Masivo)" : "Confirmar Restauración Masiva",
      message: action === "inactivate" 
        ? `¿Estás seguro de que deseas enviar las ${ids.length} instituciones seleccionadas a Inactivos?`
        : `¿Estás seguro de que deseas restaurar ${ids.length} instituciones seleccionadas?`,
      variant: action === "inactivate" ? "error" : "success",
      confirmText: action === "inactivate" ? "Confirmar" : "Restaurar",
      onConfirm: () => action === "inactivate" ? bulkRemoveInstitutions(ids) : bulkRestoreInstitutions(ids),
    });
  };

  const handleBulkRespAction = (ids: string[], action: "inactivate" | "restore") => {
    setConfirmation({
      isOpen: true,
      title: action === "inactivate" ? "Confirmar Envío a Inactivos (Masivo)" : "Confirmar Restauración Masiva",
      message: action === "inactivate" 
        ? `¿Estás seguro de que deseas enviar los ${ids.length} responsables seleccionados a Inactivos?`
        : `¿Estás seguro de que deseas restaurar ${ids.length} responsables seleccionados?`,
      variant: action === "inactivate" ? "error" : "success",
      confirmText: action === "inactivate" ? "Confirmar" : "Restaurar",
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
                        <h2 className="text-2xl font-bold text-text-primary dark:text-white/90">
                          {mainTab === "Instituciones" ? "Listado de Instituciones" : "Responsables Institucionales"}
                        </h2>
                        <span className="inline-flex items-center rounded-full bg-bg-secondary px-2.5 py-0.5 text-xs font-medium text-text-primary dark:bg-bg-dark dark:text-text-tertiary border border-border-light dark:border-border-dark">
                            Demo
                        </span>
                    </div>
                    <p className="mt-1 text-sm text-text-secondary dark:text-text-tertiary">
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
      <UnifiedDialog
         isOpen={confirmation.isOpen}
         onClose={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
         onConfirm={() => {
           confirmation.onConfirm();
           setConfirmation(prev => ({ ...prev, isOpen: false }));
         }}
         title={confirmation.title}
         message={confirmation.message}
         confirmLabel={confirmation.confirmText}
         variant={confirmation.variant}
         isLoading={loadingAction}
       />
    </>
  );
}
