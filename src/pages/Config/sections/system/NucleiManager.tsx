import { useState, useEffect, useCallback } from "react";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { inputClass, labelClass } from "@/features/config/components/sharedClasses";
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import UnifiedDialog from "@/components/ui/dialog/UnifiedDialog";
import { CONFIRM_MESSAGES, MODAL_CONFIG } from "@/components/ui/dialog/DialogConfig";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal";
import MultiSelect from "@/components/form/MultiSelect";
import apiClient from "@/api/apiClient";
import { useToast } from "@/context/toast";
import { TOAST } from "@/components/ui/dialog/DialogConfig";
import { EditIcon, TrashIcon, PlusCircleIcon, EyeIcon } from "@/icons/actions";
import AsyncActionButton from "@/components/common/AsyncActionButton";
import CustomSelect from "@/components/form/CustomSelect";
import type { MultiSelectOption } from "@/components/form/MultiSelect";
import { getCareers } from "@/features/careers/services/careersService";
import { unwrapData } from "@/api/crudServiceFactory";
import * as listsService from "@/features/lists/services/listsService";
import type { ListValue } from "@/features/lists/types";

/* ─── Types ─── */

interface Nucleus {
  nucleus_id: number;
  code: string;
  name: string;
  region: string;
  nucleus_type: "NÚCLEO" | "EXTENSIÓN";
  phone: string;
  email: string;
  is_main: boolean;
  status: number;
}

interface NucleusFormData {
  code: string;
  name: string;
  region: string;
  nucleus_type: "NÚCLEO" | "EXTENSIÓN";
  phone: string;
  email: string;
  is_main: boolean;
}

const EMPTY_FORM: NucleusFormData = {
  code: "",
  name: "",
  region: "",
  nucleus_type: "NÚCLEO",
  phone: "",
  email: "",
  is_main: false,
};

interface CareerOption {
  careerId: string | number;
  careerName: string;
}

/* ─── Component ─── */

export default function NucleiManager() {
  const { addToast } = useToast();
  const [nuclei, setNuclei] = useState<Nucleus[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNucleus, setEditingNucleus] = useState<Nucleus | null>(null);
  const [form, setForm] = useState<NucleusFormData>(EMPTY_FORM);
  const [careerOptions, setCareerOptions] = useState<MultiSelectOption[]>([]);
  const [selectedCareers, setSelectedCareers] = useState<string[]>([]);
  const [regionOptions, setRegionOptions] = useState<ListValue[]>([]);

  // Add-value inline for region
  const [addValueOpen, setAddValueOpen] = useState(false);
  const [addValueInput, setAddValueInput] = useState("");
  const [savingNewValue, setSavingNewValue] = useState(false);

  const { confirmDialog, showConfirm, hideConfirm } = useConfirmDialog();

  /* ─── Data Fetching ─── */

  const fetchNuclei = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/system-nucleus");
      setNuclei(res.data || []);
    } catch {
      addToast(TOAST.loadError());
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCareerOptions = useCallback(async () => {
    try {
      const data = await getCareers();
      const list: CareerOption[] = unwrapData(data as any);
      setCareerOptions(
        list.map((c) => ({
          value: String(c.careerId),
          text: c.careerName,
        }))
      );
    } catch {
      console.error("Error loading careers for selector");
    }
  }, []);

  const fetchRegionOptions = useCallback(async () => {
    try {
      const list = await listsService.getListByName("REGION");
      setRegionOptions(list.values.filter((v: ListValue) => v.status));
    } catch { /* la lista se crea desde /configure/lists */ }
  }, []);

  const fetchAssignedCareers = useCallback(async (nucleusId: number) => {
    try {
      const res = await apiClient.get(`/system-nucleus/${nucleusId}/careers`);
      const items = res.data || [];
      setSelectedCareers(items.map((c: any) => String(c.t_career?.CAREER_ID ?? c.careerId ?? "")).filter(Boolean));
    } catch {
      setSelectedCareers([]);
    }
  }, []);

  useEffect(() => {
    fetchNuclei();
    fetchCareerOptions();
    fetchRegionOptions();
  }, [fetchNuclei, fetchCareerOptions, fetchRegionOptions]);

  /* ─── Modal Handlers ─── */

  const openCreateModal = () => {
    setEditingNucleus(null);
    setForm(EMPTY_FORM);
    setSelectedCareers([]);
    setModalOpen(true);
  };

  const openEditModal = async (nucleus: Nucleus) => {
    setEditingNucleus(nucleus);
    setForm({
      code: nucleus.code,
      name: nucleus.name,
      region: nucleus.region,
      nucleus_type: nucleus.nucleus_type,
      phone: nucleus.phone || "",
      email: nucleus.email || "",
      is_main: nucleus.is_main,
    });
    setSelectedCareers([]);
    setModalOpen(true);
    await fetchAssignedCareers(nucleus.nucleus_id);
  };

  const closeModal = () => {
    setModalOpen(false);
    setTimeout(() => {
      setEditingNucleus(null);
    }, 300);
  };

  const updateFormField = (field: keyof NucleusFormData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddNewRegion = async () => {
    const raw = addValueInput.trim();
    if (!raw) return;
    setSavingNewValue(true);
    try {
      let list: any = null;
      try { list = await listsService.getListByName("REGION"); } catch { /* fallback */ }
      if (!list) {
        const allLists = await listsService.getAllLists();
        list = allLists.find(l => l.name === "REGION");
      }
      if (!list) list = await listsService.createList("REGION");
      const created = await listsService.createValue(list.id, raw);
      const opt: ListValue = { ...created, name: raw, status: true };
      setRegionOptions(prev => [...prev, opt]);
      updateFormField("region", raw);
      setAddValueOpen(false);
      setAddValueInput("");
    } catch {
      addToast({ variant: "error", title: "Error", message: "Error al crear la región" });
    } finally {
      setSavingNewValue(false);
    }
  };

  /* ─── CRUD Actions ─── */

  const handleSave = async () => {
    // Validate required
    if (!form.code.trim() || !form.name.trim() || !form.region.trim()) {
      addToast({ variant: "error", title: "Campos requeridos", message: "Los campos Código, Nombre y Región son requeridos" });
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        code: form.code,
        name: form.name,
        region: form.region,
        nucleus_type: form.nucleus_type,
        phone: form.phone || null,
        email: form.email || null,
        is_main: form.is_main,
      };

      let nucleusId: number;

      if (editingNucleus) {
        // Update
        await apiClient.put(`/system-nucleus/${editingNucleus.nucleus_id}`, payload);
        nucleusId = editingNucleus.nucleus_id;
        addToast(TOAST.updated("Núcleo"));
      } else {
        // Create
        const res = await apiClient.post("/system-nucleus", payload);
        nucleusId = res.data?.nucleus_id || res.data?.data?.nucleus_id;
        addToast(TOAST.created("Núcleo"));
      }

      // Save careers
      if (nucleusId) {
        await apiClient.put(`/system-nucleus/${nucleusId}/careers`, {
          career_ids: selectedCareers.map(Number),
        });
      }

      closeModal();
      await fetchNuclei();
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Error al guardar el núcleo";
      addToast({ variant: "error", title: "Error al guardar", message: msg });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = (nucleus: Nucleus) => {
    const goingInactive = nucleus.status === 1;
    const config = goingInactive
      ? CONFIRM_MESSAGES.deactivate('el núcleo')
      : CONFIRM_MESSAGES.activate('el núcleo');
    showConfirm({
      title: config.title,
      message: `¿Estás seguro de que deseas ${goingInactive ? "desactivar" : "activar"} el núcleo "${nucleus.name}"?`,
      variant: (config.variant ?? 'warning') as 'info' | 'error' | 'warning' | 'success',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await apiClient.patch(`/system-nucleus/${nucleus.nucleus_id}/toggle-status`);
          addToast({ variant: "success", title: goingInactive ? "Desactivado" : "Activado", message: `Núcleo ${goingInactive ? "desactivado" : "activado"} exitosamente` });
          await fetchNuclei();
        } catch (error: any) {
          const msg = error?.response?.data?.message || "Error al cambiar estado";
          addToast({ variant: "error", title: "Error", message: msg });
        } finally {
          setActionLoading(false);
          hideConfirm();
        }
      },
    });
  };

  const handleDelete = (nucleus: Nucleus) => {
    showConfirm({
      title: "Eliminar Núcleo",
      message: `¿Estás seguro de que deseas eliminar permanentemente el núcleo "${nucleus.name}"? Esta acción no se puede deshacer.`,
      variant: "error",
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await apiClient.delete(`/system-nucleus/${nucleus.nucleus_id}`);
          addToast(TOAST.deleted("Núcleo"));
          await fetchNuclei();
        } catch (error: any) {
          const msg = error?.response?.data?.message || "Error al eliminar el núcleo";
          addToast({ variant: "error", title: "Error al eliminar", message: msg });
        } finally {
          setActionLoading(false);
          hideConfirm();
        }
      },
    });
  };

  /* ─── UI Helper ─── */

  const getStatusBadge = (status: number) => {
    return status === 1 ? (
      <Badge color="success" variant="light" size="sm">Activo</Badge>
    ) : (
      <Badge color="error" variant="light" size="sm">Inactivo</Badge>
    );
  };

  const getMainBadge = (isMain: boolean) => {
    return isMain ? (
      <Badge color="primary" variant="solid" size="sm">Principal</Badge>
    ) : (
      <span className="text-xs text-text-tertiary">—</span>
    );
  };

  /* ─── Render ─── */

  return (
    <>
      <PageMeta title="Gestión de Núcleos" description="Administración de núcleos y sedes" />
      <PageBreadcrumb pageTitle="Gestión de Núcleos" />

      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary dark:text-text-emphasis">
              Gestión de Núcleos
            </h1>
            <p className="mt-1 text-sm text-text-secondary dark:text-text-tertiary">
              Administra los núcleos, sedes y extensiones de la institución
            </p>
          </div>
          <Button onClick={openCreateModal} startIcon={<PlusCircleIcon className="h-5 w-5" />}>
            Nuevo Núcleo
          </Button>
        </div>

        {/* Table */}
        <ComponentCard title="Núcleos Registrados">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
              ))}
            </div>
          ) : nuclei.length === 0 ? (
            <div className="text-center py-8 text-text-tertiary">
              No hay núcleos registrados. Haz clic en "Nuevo Núcleo" para crear el primero.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-light dark:border-white/10">
                    <th className="text-left py-3 px-4 font-medium text-text-secondary dark:text-text-tertiary">Código</th>
                    <th className="text-left py-3 px-4 font-medium text-text-secondary dark:text-text-tertiary">Nombre</th>
                    <th className="text-left py-3 px-4 font-medium text-text-secondary dark:text-text-tertiary">Región</th>
                    <th className="text-left py-3 px-4 font-medium text-text-secondary dark:text-text-tertiary">Tipo</th>
                    <th className="text-center py-3 px-4 font-medium text-text-secondary dark:text-text-tertiary">Principal</th>
                    <th className="text-center py-3 px-4 font-medium text-text-secondary dark:text-text-tertiary">Estado</th>
                    <th className="text-right py-3 px-4 font-medium text-text-secondary dark:text-text-tertiary">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {nuclei.map((n, idx) => (
                    <tr
                      key={n.nucleus_id}
                      className={`border-b border-border-light/50 dark:border-white/5 hover:bg-gray-50/50 dark:hover:bg-white/3 transition-colors ${
                        idx % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-gray-50/30 dark:bg-white/[0.01]"
                      }`}
                    >
                      <td className="py-3 px-4 font-mono text-xs font-medium text-text-primary dark:text-text-emphasis">
                        {n.code}
                      </td>
                      <td className="py-3 px-4 text-text-primary dark:text-text-emphasis">{n.name}</td>
                      <td className="py-3 px-4 text-text-secondary">{n.region}</td>
                      <td className="py-3 px-4">
                        <Badge
                          color={n.nucleus_type === "NÚCLEO" ? "info" : "warning"}
                          variant="light"
                          size="sm"
                        >
                          {n.nucleus_type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">{getMainBadge(n.is_main)}</td>
                      <td className="py-3 px-4 text-center">{getStatusBadge(n.status)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-3">
                          <AsyncActionButton
                            onClick={() => openEditModal(n)}
                            icon={<EditIcon />}
                            tooltip="Editar"
                            variant="primary"
                          />
                          <AsyncActionButton
                            onClick={() => handleToggleStatus(n)}
                            icon={n.status === 1 ? (
                              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            ) : (
                              <EyeIcon />
                            )}
                            tooltip={n.status === 1 ? "Desactivar" : "Activar"}
                            variant={n.status === 1 ? "warning" : "success"}
                          />
                          <AsyncActionButton
                            onClick={() => handleDelete(n)}
                            icon={<TrashIcon />}
                            tooltip="Eliminar"
                            variant="error"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ComponentCard>
      </div>

      {/* Confirmation Dialog */}
      <UnifiedDialog
        isOpen={!!confirmDialog}
        onClose={hideConfirm}
        title={confirmDialog?.title || ""}
        message={confirmDialog?.message || ""}
        variant={confirmDialog?.variant || "info"}
        confirmLabel="Confirmar"
        onConfirm={confirmDialog?.onConfirm || (() => {})}
        isLoading={actionLoading}
      />

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} size="2xl" modalId="nucleus-modal">
        <ModalHeader>
          {MODAL_CONFIG.titleByMode(!!editingNucleus, 'Núcleo')}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            {/* Información General */}
            <div>
              <h4 className="text-sm font-semibold text-text-primary dark:text-text-emphasis mb-4">
                Información General
              </h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    Código <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => updateFormField("code", e.target.value)}
                    className={inputClass}
                    placeholder="Ej: NUC-PTG"
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    Nombre <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateFormField("name", e.target.value)}
                    className={inputClass}
                    placeholder="Ej: PORTUGUESA"
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    Región <span className="text-error-500">*</span>
                  </label>
                  <CustomSelect
                    options={regionOptions.map(o => ({ value: o.name, label: o.name }))}
                    placeholder="Seleccionar región..."
                    value={form.region}
                    onChange={(val) => updateFormField("region", val)}
                    onAddNew={() => { setAddValueInput(""); setAddValueOpen(true); }}
                    addNewLabel="Nueva región"
                  />
                </div>
                <div>
                  <label className={labelClass}>Tipo</label>
                  <select
                    value={form.nucleus_type}
                    onChange={(e) => updateFormField("nucleus_type", e.target.value)}
                    className={inputClass}
                  >
                    <option value="NÚCLEO">NÚCLEO</option>
                    <option value="EXTENSIÓN">EXTENSIÓN</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Contacto */}
            <div>
              <h4 className="text-sm font-semibold text-text-primary dark:text-text-emphasis mb-4">
                Contacto
              </h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Teléfono</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => updateFormField("phone", e.target.value)}
                    className={inputClass}
                    placeholder="Ej: +58 255-5555555"
                  />
                </div>
                <div>
                  <label className={labelClass}>Correo Electrónico</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateFormField("email", e.target.value)}
                    className={inputClass}
                    placeholder="Ej: nucleo@unefa.edu.ve"
                  />
                </div>
              </div>
            </div>

            {/* Opciones */}
            <div>
              <h4 className="text-sm font-semibold text-text-primary dark:text-text-emphasis mb-4">
                Opciones
              </h4>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_main}
                    onChange={(e) => updateFormField("is_main", e.target.checked)}
                    className="w-4 h-4 rounded border-border-light text-brand-500 focus:ring-brand-500/20"
                  />
                  <span className="text-sm text-text-primary dark:text-text-emphasis">
                    Núcleo Principal
                  </span>
                </label>

                <MultiSelect
                  label="Carreras Asignadas"
                  options={careerOptions}
                  value={selectedCareers}
                  onChange={setSelectedCareers}
                  placeholder="Seleccionar carreras..."
                />
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={closeModal}>
            Cancelar
          </Button>
          <Button onClick={handleSave} loading={actionLoading}>
            {MODAL_CONFIG.buttonByMode(!!editingNucleus)}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Modal para agregar región nueva */}
      <Modal isOpen={addValueOpen} onClose={() => setAddValueOpen(false)} size="sm">
        <ModalHeader>{MODAL_CONFIG.titleByMode(false, 'Región')}</ModalHeader>
        <ModalBody>
          <p className="text-sm text-text-secondary dark:text-text-tertiary mb-3">
            Ingrese el nombre de la nueva región:
          </p>
          <input
            type="text"
            value={addValueInput}
            onChange={(e) => setAddValueInput(e.target.value)}
            placeholder="Nombre de la región..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-border-light dark:border-white/10 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleAddNewRegion()}
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setAddValueOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleAddNewRegion} loading={savingNewValue}>
            Agregar
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
