/**
 * @file institutions.tsx
 * @description Página principal para la gestión del módulo de Instituciones.
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
import { Tabs } from "../../components/ui/tabs/Tabs";
import { PlusCircleIcon } from "../../icons/actions";
import { DownloadIcon } from "../../icons";
import InstitutionTable from "../../features/institutions/components/InstitutionTable";
import InstitutionModal from "../../features/institutions/components/InstitutionModal";
import InstitutionViewModal from "../../features/institutions/components/InstitutionViewModal";
import InstitutionalResponsibleTable from "../../features/institutions/components/InstitutionalResponsibleTable";
import InstitutionalResponsibleModal from "../../features/institutions/components/InstitutionalResponsibleModal";
import InstitutionalResponsibleViewModal from "../../features/institutions/components/InstitutionalResponsibleViewModal";
import InstitutionalResponsibleSelectModal from "../../features/institutions/components/InstitutionalResponsibleSelectModal";
import { PDFPreviewModal } from "../../components/ui/pdf/PDFPreviewModal";
import { InstitutionPDF } from "../../components/ui/pdf/templates/InstitutionPDF";
import { InstitutionalResponsiblePDF } from "../../components/ui/pdf/templates/InstitutionalResponsiblePDF";
import { useInstitutions } from "../../features/institutions/hooks/useInstitutions";
import { useInstitutionalResponsibles } from "../../features/institutions/hooks/useInstitutionalResponsibles";
import { useCareers } from "../../features/careers/hooks/useCareers";
import { useInternshipTypes } from "../../features/internship-types/hooks/useInternshipTypes";
import {
  Institution,
  InstitutionRowData,
  InstitutionalResponsible,
  InstitutionalResponsibleRowData,
  CreateInstitutionPayload,
  UpdateInstitutionPayload,
  CreateInstitutionalResponsiblePayload,
  UpdateInstitutionalResponsiblePayload
} from "../../features/institutions/types";
import { formatDateTime } from "../../utils/date";

import { useLists } from "../../features/lists/hooks/useLists";

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
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchMultipleLists } = useLists();
  const [listOptions, setListOptions] = useState<Record<string, { value: string; label: string }[]>>({});

  // Event listener for Command Palette - open create modal
  useEffect(() => {
    if (location.state?.openCreateModal) {
      setEditingInst(null);
      setEditingResp(null);
      setIsModalOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  useEffect(() => {
    const loadDynamicOptions = async () => {
      try {
        const listNames = [
          "Rif",
          "Tipo de empresa"
        ];
        const data = await fetchMultipleLists(listNames);
        const mappedOptions: Record<string, { value: string; label: string }[]> = {};

        Object.entries(data).forEach(([key, values]) => {
          mappedOptions[key] = values.map(v => ({
            value: v.abbreviation || v.name,
            label: v.abbreviation || v.name
          }));
        });

        setListOptions(mappedOptions);
      } catch (error) {
        console.error("Error loading dynamic options for institutions:", error);
      } finally {
        setPageLoading(false);
      }
    };

    loadDynamicOptions();
  }, [fetchMultipleLists]);

  const institutionTypeOptions = useMemo(() => (listOptions["Tipo de empresa"] || []).sort((a, b) => a.label.localeCompare(b.label)), [listOptions]);

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
    refreshResponsibles,
    bulkRemoveResponsibles,
    bulkRestoreResponsibles,
  } = useInstitutionalResponsibles();

  const { careers, refreshCareers } = useCareers();

  const { activeOptions: internshipTypeOptions } = useInternshipTypes();

  const careerOptions = useMemo(() =>
    careers.filter(c => c.status).map(c => ({
      value: String(c.careerId),
      text: c.careerName,
      internshipPriorities: c.internshipTypeIds || []
    })),
  [careers]);

  const [mainTab, setMainTab] = useState<"Instituciones" | "Responsables">("Instituciones");
  const [activeTab, setActiveTab] = useState<"Activas" | "Inactivas">("Activas");

  // Estados para Instituciones
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInst, setEditingInst] = useState<Institution | null>(null);
  const [viewInst, setViewInst] = useState<InstitutionRowData | null>(null);

  // Estados para Responsables
  const [isRespModalOpen, setIsRespModalOpen] = useState(false);
  const [isSelectRespModalOpen, setIsSelectRespModalOpen] = useState(false);
  const [editingResp, setEditingResp] = useState<InstitutionalResponsible | null>(null);
  const [viewResp, setViewResp] = useState<InstitutionalResponsibleRowData | null>(null);
  const [isInstPDFModalOpen, setIsInstPDFModalOpen] = useState(false);
  const [isRespPDFModalOpen, setIsRespPDFModalOpen] = useState(false);

  // Estado interno para rastrear la institución desde la cual se inicia el add de responsable
  const [pendingResponsibleForInstitution, setPendingResponsibleForInstitution] = useState<{ id: string; name: string } | null>(null);

  // Estados para flujo post-creación de institución
  const [newlyCreatedInstitution, setNewlyCreatedInstitution] = useState<{ id: string; name: string } | null>(null);
  const [isAddingMultipleResponsibles, setIsAddingMultipleResponsibles] = useState(false);

  // Estados para búsqueda en los PDF
  const [instPdfSearchTerm, setInstPdfSearchTerm] = useState("");
  const [respPdfSearchTerm, setRespPdfSearchTerm] = useState("");

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

  const instPdfFilteredData = useMemo(() => {
    const search = instPdfSearchTerm.trim().toLowerCase();
    return (Array.isArray(institutions) ? institutions : [])
      .filter(i => i.status === true)
      .filter(i => !search ||
        i.rif.toLowerCase().includes(search) ||
        i.name.toLowerCase().includes(search) ||
        i.institutionType.toLowerCase().includes(search)
      );
  }, [institutions, instPdfSearchTerm]);

  const respPdfFilteredData = useMemo(() => {
    const search = respPdfSearchTerm.trim().toLowerCase();
    return (Array.isArray(responsibles) ? responsibles : [])
      .filter(r => r.status === true)
      .filter(r => {
        const fullName = `${r.firstName} ${r.lastName}`.toLowerCase();
        const instNames = r.institutions?.map(i => i.institutionName).join(" ").toLowerCase() || "";
        return !search ||
          r.identificationNumber.toLowerCase().includes(search) ||
          fullName.includes(search) ||
          instNames.includes(search);
      });
  }, [responsibles, respPdfSearchTerm]);

  const handleOpenAddModal = () => {
    if (mainTab === "Instituciones") {
      setEditingInst(null);
      setIsModalOpen(true);
    } else {
      setEditingResp(null);
      setIsRespModalOpen(true);
    }
  };

  const handleOpenEditModal = async (inst: InstitutionRowData) => {
    const original = institutions.find(i => i.institutionId === inst.institutionId);
    if (original) {
      // Refrescar datos de responsables para obtener los cargos específicos por institución
      await refreshResponsibles();
      
      // Obtener datos frescos del servidor para asegurar tener internshipTypeIds
      try {
        const { getInstitutionById } = await import("../../features/institutions/services/institutionsService");
        const freshData = await getInstitutionById(inst.institutionId);
        if (freshData) {
          setEditingInst(freshData);
        } else {
          setEditingInst(original);
        }
      } catch (error) {
        console.error("Error fetching fresh institution data:", error);
        setEditingInst(original);
      }
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

    const isDeactivating = original.status;
    const actionVerb = isDeactivating ? "desactivar" : "activar";
    const confirmTitle = isDeactivating ? "Confirmar Desactivación" : "Confirmar Activación";
    const variant = isDeactivating ? "error" : "success";
    const confirmText = isDeactivating ? "Desactivar" : "Activar";

    setConfirmation({
      isOpen: true,
      title: confirmTitle,
      message: `¿Estás seguro de que deseas ${actionVerb} la institución "${inst.name}"?`,
      onConfirm: async () => {
        try {
          await toggleInstStatus(original);
        } catch (error) {
          console.error("Error toggling institution status:", error);
        } finally {
          setConfirmation(prev => ({ ...prev, isOpen: false }));
        }
      },
      confirmText: confirmText,
      variant: variant as any,
    });
  };

  const handleToggleRespStatus = (resp: InstitutionalResponsibleRowData) => {
    const original = responsibles.find(r => r.responsibleId === resp.responsibleId);
    if (!original) return;

    const isDeactivating = original.status;
    const actionVerb = isDeactivating ? "desactivar" : "activar";
    const confirmTitle = isDeactivating ? "Confirmar Desactivación" : "Confirmar Activación";
    const variant = isDeactivating ? "error" : "success";
    const confirmText = isDeactivating ? "Desactivar" : "Activar";

    setConfirmation({
      isOpen: true,
      title: confirmTitle,
      message: `¿Estás seguro de que deseas ${actionVerb} al responsable "${resp.firstName} ${resp.lastName}"?`,
      onConfirm: async () => {
        try {
          await toggleRespStatus(original);
        } catch (error) {
          console.error("Error toggling responsible status:", error);
        } finally {
          setConfirmation(prev => ({ ...prev, isOpen: false }));
        }
      },
      confirmText: confirmText,
      variant: variant as any,
    });
  };

  const handleBulkInstAction = (ids: string[], action: "inactivate" | "restore") => {
    const isInactivating = action === "inactivate";
    const actionVerb = isInactivating ? "desactivar" : "restaurar";
    const confirmTitle = isInactivating ? "Confirmar Desactivación Múltiple" : "Confirmar Restauración Múltiple";
    const variant = isInactivating ? "error" : "success";
    const confirmText = isInactivating ? "Desactivar" : "Restaurar";

    setConfirmation({
      isOpen: true,
      title: confirmTitle,
      message: `¿Estás seguro de que deseas ${actionVerb} las ${ids.length} instituciones seleccionadas?`,
      onConfirm: async () => {
        try {
          if (isInactivating) {
            await bulkRemoveInstitutions(ids);
          } else {
            await bulkRestoreInstitutions(ids);
          }
        } catch (error) {
          console.error(`Error in bulk institution ${action}:`, error);
        } finally {
          setConfirmation(prev => ({ ...prev, isOpen: false }));
        }
      },
      confirmText: confirmText,
      variant: variant as any,
    });
  };

  const handleBulkRespAction = (ids: string[], action: "inactivate" | "restore") => {
    const isInactivating = action === "inactivate";
    const actionVerb = isInactivating ? "desactivar" : "restaurar";
    const confirmTitle = isInactivating ? "Confirmar Desactivación Múltiple" : "Confirmar Restauración Múltiple";
    const variant = isInactivating ? "error" : "success";
    const confirmText = isInactivating ? "Desactivar" : "Restaurar";

    setConfirmation({
      isOpen: true,
      title: confirmTitle,
      message: `¿Estás seguro de que deseas ${actionVerb} los ${ids.length} responsables seleccionados?`,
      onConfirm: async () => {
        try {
          if (isInactivating) {
            await bulkRemoveResponsibles(ids);
          } else {
            await bulkRestoreResponsibles(ids);
          }
        } catch (error) {
          console.error(`Error in bulk responsible ${action}:`, error);
        } finally {
          setConfirmation(prev => ({ ...prev, isOpen: false }));
        }
      },
      confirmText: confirmText,
      variant: variant as any,
    });
  };

  return (
    <>
      <PageMeta title="Gestión de Instituciones" description="Administración de instituciones aliadas y responsables" />

      <SkeletonLoader isLoading={pageLoading} skeleton={<BreadcrumbSkeleton />} id="institutions-breadcrumb">
        <PageBreadcrumb pageTitle="Instituciones" />
      </SkeletonLoader>

      <div className="stagger-delay">
        {/* Banner de Título */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <SkeletonLoader isLoading={pageLoading} skeleton={<TitleSkeleton />} id="institutions-title">
                    <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold text-text-primary dark:text-white/90">
                          {mainTab === "Instituciones" ? "Listado de Instituciones" : "Responsables Institucionales"}
                        </h2>
                    </div>
                    <p className="mt-1 text-sm text-text-secondary dark:text-text-tertiary">
                      {mainTab === "Instituciones"
                        ? "Gestiona la información y estado de las instituciones aliadas."
                        : "Gestiona los representantes y responsables de cada institución."}
                    </p>
                </SkeletonLoader>
            </div>

            {!pageLoading && (
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (mainTab === "Instituciones") setIsInstPDFModalOpen(true);
                      else setIsRespPDFModalOpen(true);
                    }}
                    startIcon={<DownloadIcon className="h-5 w-5" />}
                  >
                    Reporte
                  </Button>
                  <Button onClick={handleOpenAddModal} startIcon={<PlusCircleIcon className="h-5 w-5" />}>
                    {mainTab === "Instituciones" ? "Nueva Institución" : "Nuevo Responsable"}
                  </Button>
                </div>
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
                  status={instStatus === "idle" ? "success" : instStatus}
                  activeTab={activeTab}
                  onEdit={handleOpenEditModal}
                  onView={setViewInst}
                  onToggleStatus={handleToggleInstStatus}
                  onBulkDelete={(ids) => handleBulkInstAction(ids, "inactivate")}
                  onBulkRestore={(ids) => handleBulkInstAction(ids, "restore")}
                  institutionTypeOptions={institutionTypeOptions}
                />
              ) : (
                <InstitutionalResponsibleTable
                  data={respTableData}
                  status={respStatus === "idle" ? "success" : respStatus}
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
        onClose={() => {
          setIsModalOpen(false);
          setIsAddingMultipleResponsibles(false);
          setNewlyCreatedInstitution(null);
        }}
        onSave={async (data) => {
          try {
            if (editingInst) {
              await editInstitution({ ...editingInst, ...data } as UpdateInstitutionPayload);
              setIsModalOpen(false);
            } else {
              const newInst = await addInstitution(data as CreateInstitutionPayload);

              if (newInst) {
                return { institutionId: newInst.institutionId, name: newInst.name };
              }
            }
          } catch (error) {
            console.error("Error saving institution:", error);
            throw error;
          }
        }}
        editingInst={editingInst}
        isLoading={loadingAction}
        existingInstitutions={institutions}
        responsibles={editingInst ? responsibles.filter(r => r.institutions?.some(inst => inst.institutionId === editingInst.institutionId) && r.status) : []}
        responsibleHistory={editingInst ? responsibles.filter(r => r.institutions?.some(inst => inst.institutionId === editingInst.institutionId) && !r.status) : []}
        onAddResponsible={addResponsible}
        onEditResponsible={editResponsible}
        institutionOptions={institutionOptions}
        careerOptions={careerOptions}
        internshipTypeOptions={internshipTypeOptions}
        onCareerCreated={() => refreshCareers()}
      />

      <InstitutionalResponsibleModal
        isOpen={isRespModalOpen}
        onClose={() => {
          setIsRespModalOpen(false);
          setPendingResponsibleForInstitution(null);
          if (isAddingMultipleResponsibles) {
            setIsAddingMultipleResponsibles(false);
            setNewlyCreatedInstitution(null);
          }
        }}
        onSave={async (data) => {
          try {
            if (editingResp) {
              await editResponsible({ ...editingResp, ...data } as UpdateInstitutionalResponsiblePayload);
              setIsRespModalOpen(false);
            } else {
              await addResponsible(data as CreateInstitutionalResponsiblePayload);

              if (isAddingMultipleResponsibles && newlyCreatedInstitution) {
                setConfirmation({
                  isOpen: true,
                  title: "Responsable Registrado",
                  message: "¿Desea agregar otro responsable para la misma institución?",
                  onConfirm: () => {
                    setIsRespModalOpen(false);
                    setTimeout(() => {
                      setIsRespModalOpen(true);
                    }, 100);
                  },
                  confirmText: "Agregar otro",
                  variant: "info",
                });
              } else {
                setIsRespModalOpen(false);
                setIsAddingMultipleResponsibles(false);
                setNewlyCreatedInstitution(null);
                setPendingResponsibleForInstitution(null);
              }
            }
          } catch (error) {
            console.error("Error saving responsible:", error);
          }
        }}
        editingResp={editingResp}
        institutionOptions={institutionOptions}
        isLoading={loadingAction}
        preselectedInstitutionId={
          pendingResponsibleForInstitution?.id ||
          (isAddingMultipleResponsibles ? newlyCreatedInstitution?.id : undefined)
        }
        preselectedInstitutionName={
          pendingResponsibleForInstitution?.name ||
          (isAddingMultipleResponsibles ? newlyCreatedInstitution?.name : undefined)
        }
      />

      {/* Modal de visualización de institución — con responsables conectados */}
      <InstitutionViewModal
        isOpen={!!viewInst}
        onClose={() => setViewInst(null)}
        onEdit={handleOpenEditModal}
        institution={viewInst}
        responsibles={
          viewInst
            ? responsibles.filter(
                (r) => r.institutions?.some(inst => inst.institutionId === viewInst.institutionId) && r.status
              )
            : []
        }
        onAddResponsible={() => {
          // Guarda la institución actual para pre-seleccionarla en el modal de responsable
          if (viewInst) {
            setPendingResponsibleForInstitution({
              id: viewInst.institutionId,
              name: viewInst.name,
            });
          }
          setViewInst(null);
          setEditingResp(null);
          setTimeout(() => setIsRespModalOpen(true), 150);
        }}
        onSearchResponsible={() => {
          if (viewInst) {
            setPendingResponsibleForInstitution({
              id: viewInst.institutionId,
              name: viewInst.name,
            });
          }
          setViewInst(null);
          setTimeout(() => setIsSelectRespModalOpen(true), 150);
        }}
      />

      <InstitutionalResponsibleViewModal
        isOpen={!!viewResp}
        onClose={() => setViewResp(null)}
        onEdit={handleOpenEditRespModal}
        responsible={viewResp}
      />

      {/* Modal para seleccionar responsable existente desde detalles */}
      <InstitutionalResponsibleSelectModal
        isOpen={isSelectRespModalOpen}
        onClose={() => {
          setIsSelectRespModalOpen(false);
          setPendingResponsibleForInstitution(null);
        }}
        currentInstitutionId={pendingResponsibleForInstitution?.id}
        onSelect={async (resp) => {
          try {
            await editResponsible({
              responsibleId: resp.responsibleId,
              institutionId: pendingResponsibleForInstitution?.id || "",
              status: true 
            } as UpdateInstitutionalResponsiblePayload);
            setIsSelectRespModalOpen(false);
            setPendingResponsibleForInstitution(null);
          } catch (error) {
            console.error("Error linking existing responsible:", error);
          }
        }}
      />

      <PDFPreviewModal
        isOpen={isInstPDFModalOpen}
        onClose={() => setIsInstPDFModalOpen(false)}
        title="Reporte de Instituciones Activas"
        data={instPdfFilteredData}
        template={(data) => <InstitutionPDF data={data} />}
        fileName={`reporte-instituciones-activas-${new Date().toISOString().split('T')[0]}.pdf`}
        searchTerm={instPdfSearchTerm}
        onSearchChange={setInstPdfSearchTerm}
        columns={[
          { header: "RIF", accessor: "rif" },
          { header: "Nombre", accessor: "name" },
          { header: "Tipo", accessor: "institutionType" },
        ]}
      />

      <PDFPreviewModal
        isOpen={isRespPDFModalOpen}
        onClose={() => setIsRespPDFModalOpen(false)}
        title="Reporte de Responsables Institucionales Activos"
        data={respPdfFilteredData}
        template={(data) => <InstitutionalResponsiblePDF data={data} />}
        fileName={`reporte-responsables-activos-${new Date().toISOString().split('T')[0]}.pdf`}
        searchTerm={respPdfSearchTerm}
        onSearchChange={setRespPdfSearchTerm}
        columns={[
          { header: "Cédula", accessor: (r) => `${r.identificationPrefix}-${r.identificationNumber}` },
          { header: "Nombre", accessor: (r) => `${r.firstName} ${r.lastName}` },
          { header: "Institución", accessor: (r) => r.institutions?.map(i => i.institutionName).join(", ") || "-" },
          { header: "Correo", accessor: "email" },
          { header: "Teléfono", accessor: "phone" },
        ]}
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
