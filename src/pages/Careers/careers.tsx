/**
 * @file Página para la gestión de Carreras.
 * @description Orquesta tabla, modales y alertas siguiendo el patrón de Periodos.
 */

import { useMemo, useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Alert from "../../components/ui/alert/Alert";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import { PlusCircleIcon, XIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from "../../icons/actions";

import CareerTable from "../../features/careers/components/CareerTable";
import CareerModal from "../../features/careers/components/CareerModal";
import { useCareers } from "../../features/careers/hooks/useCareers";
import { Career, CareerRowData } from "../../features/careers/types";
import { formatDateTime } from "../../utils/date";

// Opciones de tipos de prácticas (mock). Sustituir si existe catálogo en backend.
const internshipOptions = [
  { value: "HOSPITALARIA", text: "Hospitalaria" },
  { value: "COMUNITARIA", text: "Comunitaria" },
  { value: "ORDINARIA", text: "Ordinaria" },
];

const formatCareerToRow = (c: Career): CareerRowData => ({
  ...c,
  creationDate: formatDateTime(c.creationDate),
});

export default function CareersPage() {
  const { colorMode } = useTheme();
  const {
    careers,
    status,
    error,
    pageAlert,
    setPageAlert,
    addCareer,
    editCareer,
    removeCareer,
    toggleStatus,
  } = useCareers();

  // Tabs: Activas / Inactivas (controladas por CareerTable)
  const [activeTab, setActiveTab] = useState<"Activas" | "Inactivas">("Activas");

  // Modal de creación/edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCareer, setEditingCareer] = useState<Career | null>(null);

  // Modal de vista (Ver)
  const [viewCareer, setViewCareer] = useState<CareerRowData | null>(null);

  // Confirmación
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
    const byStatus = careers.filter((c) => (activeTab === "Activas" ? c.status : !c.status));
    return byStatus.map(formatCareerToRow);
  }, [careers, activeTab]);

  const handleCreate = () => {
    setEditingCareer(null);
    setIsModalOpen(true);
  };

  const handleEdit = (row: CareerRowData) => {
    const original = careers.find((c) => c.careerId === row.careerId) || null;
    setEditingCareer(original);
    setIsModalOpen(true);
  };

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

  const handleDelete = (careerId: string) => {
    const original = careers.find((c) => c.careerId === careerId);
    if (!original) return;
    setConfirmation({
      isOpen: true,
      title: "Confirmar Eliminación",
      message: `¿Estás seguro de que deseas enviar la carrera "${original.careerName}" a la papelera?`,
      onConfirm: async () => {
        try {
          await removeCareer(original);
        } catch (e) { console.error(e); }
        finally { setConfirmation(null); }
      },
      confirmText: "Eliminar",
      variant: "error",
    });
  };

  const handleToggleStatus = (careerId: string) => {
    const original = careers.find((c) => c.careerId === careerId);
    if (!original) return;
    const goingInactive = original.status === true;
    setConfirmation({
      isOpen: true,
      title: goingInactive ? "Confirmar Envío a Papelera" : "Confirmar Restauración",
      message: goingInactive
        ? `¿Deseas enviar la carrera "${original.careerName}" a la papelera?`
        : `¿Deseas restaurar la carrera "${original.careerName}"?`,
      onConfirm: async () => {
        try {
          await toggleStatus(original);
        } catch (e) { console.error(e); }
        finally { setConfirmation(null); }
      },
      confirmText: goingInactive ? "Enviar a Papelera" : "Restaurar",
      variant: goingInactive ? "warning" : "info",
    });
  };

  return (
    <>
      <PageMeta title="Gestión de Carreras" description="Administración de carreras académicas" />

      <div className="flex items-center justify-between mb-6">
        <PageBreadcrumb pageTitle="Gestión de Carreras" />
        <Button onClick={handleCreate} className="sm:w-auto">
          <PlusCircleIcon className="w-5 h-5" />
          <span className="ml-2">Nueva Carrera</span>
        </Button>
      </div>

      {pageAlert && (
        <div className="relative mb-6">
          <Alert
            variant={pageAlert.variant}
            title={pageAlert.title}
            message={pageAlert.message}
            showLink={false}
          />
          <button
            onClick={() => setPageAlert(null)}
            className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Contenedor principal: pestañas integradas en la tabla */}
      <ComponentCard title="Listado de Carreras">
        <div className="border-b border-gray-200 dark:border-white/10">
          <nav aria-label="Tabs" className="-mb-px flex space-x-8">
            <button
              type="button"
              className={`whitespace-nowrap border-b-2 py-4 px-3 text-sm font-medium transition-colors duration-200 ${activeTab === "Activas"
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300"
                }`}
              onClick={() => setActiveTab("Activas")}
            >
              Activas
            </button>
            <button
              type="button"
              className={`whitespace-nowrap border-b-2 py-4 px-3 text-sm font-medium transition-colors duration-200 ${activeTab === "Inactivas"
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300"
                }`}
              onClick={() => setActiveTab("Inactivas")}
            >
              Inactivas (Papelera)
            </button>
          </nav>
        </div>

        <div className="pt-6 animate-fadeIn">
          <CareerTable
            key={activeTab}
            data={filtered}
            status={status}
            error={error}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
            onView={(row) => setViewCareer(row)}
            inactiveMode={activeTab === "Inactivas"}
            activeTab={activeTab}
          />
        </div>
      </ComponentCard>

      {/* Modal Crear/Editar */}
      <CareerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editingCareer={editingCareer ?? undefined}
        internshipOptions={internshipOptions}
      />

      {/* Modal Ver */}
      <Modal isOpen={!!viewCareer} onClose={() => setViewCareer(null)} className="max-w-xl" showCloseButton>
        {viewCareer && (
          <>
            <ModalHeader>Detalles de la Carrera</ModalHeader>
            <ModalBody>
              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <p><span className="font-medium">Código:</span> {viewCareer.careerCode}</p>
                <p><span className="font-medium">Nombre:</span> {viewCareer.careerName}</p>
                <p><span className="font-medium">Nota mínima:</span> {viewCareer.minimumGrade.toFixed(2)}</p>
                <p><span className="font-medium">Abreviatura:</span> {viewCareer.careerAbbreviation}</p>
                <p><span className="font-medium">Estado:</span> {viewCareer.status ? "Activo" : "Inactivo"}</p>
                <p><span className="font-medium">Creación:</span> {viewCareer.creationDate}</p>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="outline" onClick={() => setViewCareer(null)}>Cerrar</Button>
            </ModalFooter>
          </>
        )}
      </Modal>

      {confirmation?.isOpen && (
        <Modal
          isOpen={confirmation.isOpen}
          onClose={() => setConfirmation(null)}
          className={`max-w-sm p-6 ${colorMode === "dark" ? "dark" : ""}`}
        >
          <div className="text-center">
            <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${confirmationStyles[confirmation.variant].iconBg}`}>
              {confirmationStyles[confirmation.variant].icon}
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-800 dark:text-white">{confirmation.title}</h3>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">{confirmation.message}</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setConfirmation(null)}
                className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
              >
                Cancelar
              </button>
              <button
                onClick={confirmation.onConfirm}
                className={`flex w-full justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-white sm:w-auto ${confirmationStyles[confirmation.variant].button}`}
              >
                {confirmation.confirmText}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
