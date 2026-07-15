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
import { CONFIRM_MESSAGES, MODAL_CONFIG, DialogVariant } from "../../components/ui/dialog/DialogConfig";
import Button from "../../components/ui/button/Button";
import { SkeletonLoader, TitleSkeleton, BreadcrumbSkeleton, TablePageSkeleton } from "../../components/ui/skeleton";
import { Tabs } from "../../components/ui/tabs/Tabs";
import { PlusCircleIcon } from "../../icons/actions";
import { FileText, Upload } from "lucide-react";
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
import { matchSearch } from "../../utils/searchNormalizer";

import { useLists } from "../../features/lists/hooks/useLists";
import ExportFormatModal, { ExportFormat } from "../../components/common/ExportFormatModal";
import { exportFullInstitutions } from "../../features/institutions/services/institutionsService";

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

  const { careers, refreshCareers } = useCareers({ autoLoad: true });

  const { activeOptions: internshipTypeOptions } = useInternshipTypes({ autoLoad: true });

  const careerOptions = useMemo(() =>
    careers.filter(c => c.status).map(c => ({
      value: String(c.careerId),
      text: c.careerName,
      internshipTypeIds: c.internshipTypeIds || []
    })),
  [careers]);

  const [mainTab, setMainTab] = useState<"Instituciones" | "Responsables">("Instituciones");
  const [activeTab, setActiveTab] = useState<"Activas" | "Inactivas">("Activas");

  // Estados para Instituciones
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInst, setEditingInst] = useState<Institution | null>(null);
  const [isEditingLoading, setIsEditingLoading] = useState(false);
  const [viewInst, setViewInst] = useState<InstitutionRowData | null>(null);

  // Estados para Responsables
  const [isRespModalOpen, setIsRespModalOpen] = useState(false);
  const [isSelectRespModalOpen, setIsSelectRespModalOpen] = useState(false);
  const [editingResp, setEditingResp] = useState<InstitutionalResponsible | null>(null);
  const [viewResp, setViewResp] = useState<InstitutionalResponsibleRowData | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isInstPDFModalOpen, setIsInstPDFModalOpen] = useState(false);
  const [isRespPDFModalOpen, setIsRespPDFModalOpen] = useState(false);

  // Estado interno para rastrear la institución desde la cual se inicia el add de responsable
  const [pendingResponsibleForInstitution, setPendingResponsibleForInstitution] = useState<{ id: string; name: string } | null>(null);

  // Estados para flujo post-creación de institución
  const [newlyCreatedInstitution, setNewlyCreatedInstitution] = useState<{ id: string; name: string } | null>(null);
  const [isAddingMultipleResponsibles, setIsAddingMultipleResponsibles] = useState(false);

  // Estados para búsqueda en los PDF
  const [instPdfSearchTerm, setInstPdfSearchTerm] = useState("");
  const [instPdfTypeFilter, setInstPdfTypeFilter] = useState("");
  const [instPdfCareerFilter, setInstPdfCareerFilter] = useState("");
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

  const careerNameMap = useMemo(() => {
    const map = new Map<string, string>();
    careers.filter(c => c.status).forEach(c => map.set(String(c.careerId), c.careerName));
    return map;
  }, [careers]);

  const instPdfFilteredData = useMemo(() => {
    return (Array.isArray(institutions) ? institutions : [])
      .filter(i => i.status === true)
      .filter(i => !instPdfSearchTerm.trim() ||
        matchSearch(i.rif, instPdfSearchTerm) ||
        matchSearch(i.name, instPdfSearchTerm) ||
        matchSearch(i.institutionType, instPdfSearchTerm)
      )
      .filter(i => !instPdfTypeFilter || i.institutionType === instPdfTypeFilter)
      .filter(i => !instPdfCareerFilter || (i.careerIds || []).includes(instPdfCareerFilter))
      .map(i => ({
        ...i,
        careerNames: (i.careerIds || []).map(id => careerNameMap.get(id)).filter(Boolean) as string[],
      }));
  }, [institutions, instPdfSearchTerm, instPdfTypeFilter, instPdfCareerFilter, careerNameMap]);

  const respPdfFilteredData = useMemo(() => {
    return (Array.isArray(responsibles) ? responsibles : [])
      .filter(r => r.status === true)
      .filter(r => {
        const fullName = `${r.firstName} ${r.lastName}`;
        const instNames = r.institutions?.map(i => i.institutionName).join(" ") || "";
        return !respPdfSearchTerm.trim() ||
          matchSearch(r.identificationNumber, respPdfSearchTerm) ||
          matchSearch(fullName, respPdfSearchTerm) ||
          matchSearch(instNames, respPdfSearchTerm);
      });
  }, [responsibles, respPdfSearchTerm]);

   const handleOpenAddModal = () => {
     if (mainTab === "Instituciones") {
       setEditingInst(null);
       refreshCareers();
       setIsModalOpen(true);
     } else {
       setEditingResp(null);
       setIsRespModalOpen(true);
     }
   };

   // Maneja la transición de "crear nuevo" a "editar existente" cuando se detecta duplicado
   const handleEditFromExisting = (existingResponsible: any) => {
     // Cerrar el modal inmediatamente
     setIsRespModalOpen(false);
     // Delay para asegurar que el modal se cierre antes de limpiar
     setTimeout(() => {
       setEditingResp(existingResponsible);
       setIsRespModalOpen(true);
     }, 200);
   };

  const handleOpenEditModal = async (inst: InstitutionRowData) => {
    const original = institutions.find(i => i.institutionId === inst.institutionId);
    if (original) {
      // Mostrar el modal inmediatamente con datos locales
      setEditingInst(original);
      setIsModalOpen(true);
      setIsEditingLoading(true);

      // Cargar carreras si no están cargadas (careerOptions para el MultiSelect)
      const careerPromise = careers.length === 0 ? refreshCareers() : Promise.resolve();

      // Fetch en background para datos frescos (internshipTypeIds, careerIds, etc.)
      try {
        const { getInstitutionById } = await import("../../features/institutions/services/institutionsService");
        const [freshData] = await Promise.all([
          getInstitutionById(inst.institutionId),
          careerPromise,
        ]);
        if (freshData) {
          setEditingInst(freshData);
        }
      } catch (error) {
        console.warn("[handleOpenEditModal] Falló fetch fresco, usando datos locales:", error);
      } finally {
        setIsEditingLoading(false);
      }
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
    const config = isDeactivating
      ? CONFIRM_MESSAGES.deactivate('la empresa o institución')
      : CONFIRM_MESSAGES.activate('la empresa o institución');

    setConfirmation({
      isOpen: true,
      title: config.title,
      message: `¿Estás seguro de que deseas ${isDeactivating ? 'desactivar' : 'restaurar'} la empresa o institución "${inst.name}"?`,
      onConfirm: async () => {
        try {
          await toggleInstStatus(original);
        } catch (error) {
          console.error("Error toggling institution status:", error);
        } finally {
          setConfirmation(prev => ({ ...prev, isOpen: false }));
        }
      },
      confirmText: config.confirmLabel,
      variant: config.variant as DialogVariant,
    });
  };

  const handleToggleRespStatus = (resp: InstitutionalResponsibleRowData) => {
    const original = responsibles.find(r => r.responsibleId === resp.responsibleId);
    if (!original) return;

    const isDeactivating = original.status;
    const config = isDeactivating
      ? CONFIRM_MESSAGES.deactivate('al responsable')
      : CONFIRM_MESSAGES.activate('al responsable');

    setConfirmation({
      isOpen: true,
      title: config.title,
      message: `¿Estás seguro de que deseas ${isDeactivating ? 'desactivar' : 'restaurar'} al responsable "${resp.firstName} ${resp.lastName}"?`,
      onConfirm: async () => {
        try {
          await toggleRespStatus(original);
        } catch (error) {
          console.error("Error toggling responsible status:", error);
        } finally {
          setConfirmation(prev => ({ ...prev, isOpen: false }));
        }
      },
      confirmText: config.confirmLabel,
      variant: config.variant as DialogVariant,
    });
  };

  const handleBulkInstAction = (ids: string[], action: "inactivate" | "restore") => {
    const isInactivating = action === "inactivate";
    const config = isInactivating
      ? CONFIRM_MESSAGES.deactivate('las empresas o instituciones')
      : CONFIRM_MESSAGES.activate('las empresas o instituciones');

    setConfirmation({
      isOpen: true,
      title: isInactivating ? 'Confirmar desactivación masiva' : 'Confirmar restauración masiva',
      message: `¿Estás seguro de que deseas ${isInactivating ? 'desactivar' : 'restaurar'} las ${ids.length} empresas o instituciones seleccionadas?`,
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
      confirmText: isInactivating ? 'Desactivar Todos' : 'Restaurar Todos',
      variant: config.variant as DialogVariant,
    });
  };

  const handleBulkRespAction = (ids: string[], action: "inactivate" | "restore") => {
    const isInactivating = action === "inactivate";
    const config = isInactivating
      ? CONFIRM_MESSAGES.deactivate('los responsables')
      : CONFIRM_MESSAGES.activate('los responsables');

    setConfirmation({
      isOpen: true,
      title: isInactivating ? 'Confirmar desactivación masiva' : 'Confirmar restauración masiva',
      message: `¿Estás seguro de que deseas ${isInactivating ? 'desactivar' : 'restaurar'} los ${ids.length} responsables seleccionados?`,
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
      confirmText: isInactivating ? 'Desactivar Todos' : 'Restaurar Todos',
      variant: config.variant as DialogVariant,
    });
  };

  return (
    <>
      <PageMeta title="Gestión de Empresas o Instituciones" description="Administración de empresas o instituciones aliadas y responsables" />

      <SkeletonLoader isLoading={pageLoading} skeleton={<BreadcrumbSkeleton />} id="institutions-breadcrumb">
        <PageBreadcrumb pageTitle="Empresas o Instituciones" />
      </SkeletonLoader>

      <div className="stagger-delay">
        {/* Banner de Título */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <SkeletonLoader isLoading={pageLoading} skeleton={<TitleSkeleton />} id="institutions-title">
                    <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold text-text-primary dark:text-white/90">
                          {mainTab === "Instituciones" ? "Listado de Empresas o Instituciones" : "Responsables Institucionales"}
                        </h2>
                    </div>
                    <p className="mt-1 text-sm text-text-secondary dark:text-text-tertiary">
                      {mainTab === "Instituciones"
                        ? "Gestiona la información y estado de las empresas o instituciones aliadas."
                        : "Gestiona los representantes y responsables de cada institución."}
                    </p>
                </SkeletonLoader>
            </div>

            {!pageLoading && (
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (mainTab === "Instituciones") setIsInstPDFModalOpen(true);
                      else setIsRespPDFModalOpen(true);
                    }}
                    startIcon={<FileText className="h-5 w-5" />}
                  >
                    Reporte
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsExportModalOpen(true)}
                    startIcon={<Upload className="h-5 w-5" />}
                  >
                    Exportación
                  </Button>
                  <Button onClick={handleOpenAddModal} startIcon={<PlusCircleIcon className="h-5 w-5" />}>
                    {MODAL_CONFIG.createTitle(mainTab === "Instituciones" ? 'Empresa o Institución' : 'Responsable')}
                  </Button>
                </div>
            )}
        </div>

        {/* Pestañas Principales */}
        <Tabs
          variant="pills"
          options={[
            { id: "Instituciones", label: "Empresas o Instituciones" },
            { id: "Responsables", label: "Responsables" },
          ]}
          activeTab={mainTab}
          onTabChange={(id) => setMainTab(id as "Instituciones" | "Responsables")}
          className="mb-6"
        />

        {/* Contenido principal */}
        <div className="space-y-6">
          <ComponentCard title={mainTab === "Instituciones" ? "Gestión de Empresas o Instituciones" : "Gestión de Responsables"}>
            <Tabs
              variant="underline"
              options={[
                { id: "Activas", label: mainTab === "Instituciones" ? "Empresas o Instituciones Activas" : "Responsables Activos" },
                { id: "Inactivas", label: mainTab === "Instituciones" ? "Empresas o Instituciones Inactivas" : "Responsables Inactivos" },
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
              // Notificar que una institución fue editada
              const evt = new CustomEvent("institution:saved");
              window.dispatchEvent(evt);
              setIsModalOpen(false);
            } else {
              const newInst = await addInstitution(data as CreateInstitutionPayload);

              if (newInst) {
                // Notificar que una nueva institución fue creada
                const evt = new CustomEvent("institution:saved");
                window.dispatchEvent(evt);
                // Cerrar modal de creación y abrir modal de responsables
                setIsModalOpen(false);
                setNewlyCreatedInstitution({ id: newInst.institutionId, name: newInst.name });
                setIsRespModalOpen(true);
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
                      message: "¿Desea agregar otro responsable para la misma empresa o institución?",
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
         onEditExisting={handleEditFromExisting}
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

      <ExportFormatModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={(format: ExportFormat) => exportFullInstitutions(format)}
        entityLabel="instituciones"
      />

      <PDFPreviewModal
        isOpen={isInstPDFModalOpen}
        onClose={() => setIsInstPDFModalOpen(false)}
        title="Reporte de Instituciones"
        data={instPdfFilteredData}
        template={(data) => <InstitutionPDF data={data} />}
        fileName={`reporte-instituciones-${new Date().toISOString().split('T')[0]}.pdf`}
        searchTerm={instPdfSearchTerm}
        onSearchChange={setInstPdfSearchTerm}
        columns={[
          { header: "RIF", accessor: "rif" },
          { header: "Nombre", accessor: "name" },
          { header: "Tipo", accessor: "institutionType" },
        ]}
        renderFilters={() => (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest pl-1">
                Tipo de Empresa o Institución
              </label>
              <select
                value={instPdfTypeFilter}
                onChange={(e) => setInstPdfTypeFilter(e.target.value)}
                className="w-full h-10 rounded-lg border border-border-medium bg-transparent px-3 text-xs text-text-primary focus:border-brand-500 focus:outline-none dark:border-border-dark dark:bg-bg-dark dark:text-white/90 appearance-none"
              >
                <option value="">Todos los Tipos</option>
                {institutionTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest pl-1">
                Carrera
              </label>
              <select
                value={instPdfCareerFilter}
                onChange={(e) => setInstPdfCareerFilter(e.target.value)}
                className="w-full h-10 rounded-lg border border-border-medium bg-transparent px-3 text-xs text-text-primary focus:border-brand-500 focus:outline-none dark:border-border-dark dark:bg-bg-dark dark:text-white/90 appearance-none"
              >
                <option value="">Todas las Carreras</option>
                {careers.filter(c => c.status).map(c => (
                  <option key={c.careerId} value={String(c.careerId)}>{c.careerName}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      />

      <PDFPreviewModal
        isOpen={isRespPDFModalOpen}
        onClose={() => setIsRespPDFModalOpen(false)}
        title="Reporte de Responsables Empresariales e Institucionales"
        data={respPdfFilteredData}
        template={(data) => <InstitutionalResponsiblePDF data={data} />}
        fileName={`reporte-responsables-activos-${new Date().toISOString().split('T')[0]}.pdf`}
        searchTerm={respPdfSearchTerm}
        onSearchChange={setRespPdfSearchTerm}
        columns={[
          { header: "Cédula", accessor: (r) => `${(r.identificationPrefix || 'V').replace(/-/g, '')}-${String(r.identificationNumber).replace(/-/g, '')}` },
          { header: "Nombre Completo", accessor: (r) => [r.firstName, r.middleName, r.lastName, r.secondLastName].filter(Boolean).join(' ') },
          { header: "Empresa o Institución", accessor: (r) => r.institutions?.map(i => i.institutionName).join(", ") || "-" },
          { header: "Contacto", accessor: (r) => `${r.email} / ${r.phone}` },
          { header: "Fecha de Registro", accessor: (r) => new Date(r.registrationDate).toLocaleDateString("es-VE", { year: "numeric", month: "2-digit", day: "2-digit" }) },
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
        isLoading={loadingAction || isEditingLoading}
        />
    </>
  );
}
