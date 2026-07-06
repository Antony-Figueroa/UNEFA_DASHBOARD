import { useState, useEffect, useCallback } from "react";
import { inputClass, labelClass } from "@/features/config/components/sharedClasses";
import ComponentCard from "@/components/common/ComponentCard";
import { SkeletonLoader } from "@/components/ui/skeleton";
import Button from "@/components/ui/button/Button";
import apiClient from "@/api/apiClient";
import { useToast } from "@/context/toast";
import { TOAST } from "@/components/ui/dialog/DialogConfig";
import { EditIcon } from "@/icons/actions";
import * as listsService from "@/features/lists/services/listsService";
import type { ListValue } from "@/features/lists/types";
import UnifiedDialog from "@/components/ui/dialog/UnifiedDialog";

interface InstitutionData {
  legal_name: string;
  commercial_name: string;
  acronym: string;
  rif: string;
  phone: string;
  email: string;
  website: string;
  resolution_number: string;
  region: string;
  nucleus: string;
  extension: string;
}

const DEFAULT_FORM: InstitutionData = {
  legal_name: "",
  commercial_name: "",
  acronym: "",
  rif: "",
  phone: "",
  email: "",
  website: "",
  resolution_number: "",
  region: "",
  nucleus: "",
  extension: "",
};

const LIST_NAMES = { region: "REGION", nucleus: "NUCLEO", extension: "EXTENSIÓN" } as const;

export default function InstitutionConfig() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<InstitutionData>(DEFAULT_FORM);
  const [hasChanges, setHasChanges] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [listOptions, setListOptions] = useState<Record<string, ListValue[]>>({});

  // Add-value inline
  const [addValueOpen, setAddValueOpen] = useState(false);
  const [addValueListName, setAddValueListName] = useState("");
  const [addValueField, setAddValueField] = useState<keyof InstitutionData>("region");
  const [addValueInput, setAddValueInput] = useState("");
  const [savingNewValue, setSavingNewValue] = useState(false);

  const openAddValue = (listName: string, field: keyof InstitutionData) => {
    setAddValueListName(listName);
    setAddValueField(field);
    setAddValueInput("");
    setAddValueOpen(true);
  };

  const handleAddNewValue = async () => {
    const raw = addValueInput.trim().toUpperCase();
    if (!raw) return;
    setSavingNewValue(true);
    try {
      let list: any = null;
      try {
        list = await listsService.getListByName(addValueListName);
      } catch { /* fallback */ }
      if (!list) {
        const allLists = await listsService.getAllLists();
        list = allLists.find(l => l.name === addValueListName);
      }
      if (!list) {
        list = await listsService.createList(addValueListName);
      }
      const created = await listsService.createValue(list.id, raw);
      const opt: ListValue = {
        ...created,
        name: raw,
        status: true,
      };
      setListOptions(prev => ({
        ...prev,
        [addValueListName]: [...(prev[addValueListName] || []), opt],
      }));
      updateField(addValueField, raw);
      setAddValueOpen(false);
      setAddValueInput("");
    } catch {
      addToast({ variant: "error", title: "Error", message: "Error al crear el valor" });
    } finally {
      setSavingNewValue(false);
    }
  };

  const fetchLists = useCallback(async () => {
    try {
      const [regionList, nucleusList, extensionList] = await Promise.all([
        listsService.getListByName(LIST_NAMES.region),
        listsService.getListByName(LIST_NAMES.nucleus),
        listsService.getListByName(LIST_NAMES.extension),
      ]);
      setListOptions({
        [LIST_NAMES.region]: regionList.values.filter(v => v.status),
        [LIST_NAMES.nucleus]: nucleusList.values.filter(v => v.status),
        [LIST_NAMES.extension]: extensionList.values.filter(v => v.status),
      });
    } catch { /* las listas se crean desde /configure/lists */ }
  }, []);

  const fetchInstitution = useCallback(async () => {
    setLoading(true);
    try {
      const [res] = await Promise.all([
        apiClient.get("/system-institution"),
        fetchLists(),
      ]);
      const data = res.data;
      if (data) {
        setForm({
          legal_name: data.legal_name || "",
          commercial_name: data.commercial_name || "",
          acronym: data.acronym || "",
          rif: data.rif || "",
          phone: data.phone || "",
          email: data.email || "",
          website: data.website || "",
          resolution_number: data.resolution_number || "",
          region: data.region || "",
          nucleus: data.nucleus || "",
          extension: data.extension || "",
        });
        setHasData(true);
      }
    } catch (error: any) {
      if (error?.response?.status !== 404) {
        addToast(TOAST.loadError());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInstitution();
  }, [fetchInstitution]);

  const updateField = (field: keyof InstitutionData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSelectChange = (field: keyof InstitutionData, listName: string, value: string) => {
    if (value === "__new__") {
      openAddValue(listName, field);
    } else {
      updateField(field, value);
    }
  };

  const handleSave = async () => {
    if (!form.legal_name.trim() || !form.commercial_name.trim() || !form.acronym.trim()) {
      addToast({ variant: "error", title: "Campos requeridos", message: "Los campos Razón Social, Nombre Comercial y Siglas son requeridos" });
      return;
    }
    setSaving(true);
    try {
      await apiClient.put("/system-institution", form);
      setHasChanges(false);
      addToast(TOAST.updated("Institución"));
      await fetchInstitution();
    } catch (error: any) {
      addToast(error?.response?.data?.message ? { variant: "error", title: "Error al guardar", message: error.response.data.message } : { variant: "error", title: "Error al guardar", message: "Error al guardar los datos" });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm(DEFAULT_FORM);
    setHasChanges(false);
    fetchInstitution();
  };

  return (
    <>
      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary dark:text-text-emphasis">
              Configuración Institucional
            </h1>
            <p className="mt-1 text-sm text-text-secondary dark:text-text-tertiary">
              Administra los datos generales de la institución
            </p>
          </div>
          {hasChanges && (
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleReset}>
                Descartar
              </Button>
              <Button onClick={handleSave} loading={saving}>
                Guardar Cambios
              </Button>
            </div>
          )}
        </div>

        <SkeletonLoader isLoading={loading} skeleton={
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 rounded-lg border border-border-light dark:border-white/10">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2" />
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        } id="institution-skeleton">
          <>
            {/* Información General */}
            <ComponentCard title="Información General">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    Razón Social <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.legal_name}
                    onChange={(e) => updateField("legal_name", e.target.value)}
                    className={inputClass}
                    placeholder="Ej: UNIVERSIDAD NACIONAL EXPERIMENTAL..."
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    Nombre Comercial <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.commercial_name}
                    onChange={(e) => updateField("commercial_name", e.target.value)}
                    className={inputClass}
                    placeholder="Ej: UNEFA"
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    Siglas <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.acronym}
                    onChange={(e) => updateField("acronym", e.target.value)}
                    className={inputClass}
                    placeholder="Ej: UNEFA"
                  />
                </div>
                <div>
                  <label className={labelClass}>RIF</label>
                  <input
                    type="text"
                    value={form.rif}
                    onChange={(e) => updateField("rif", e.target.value)}
                    className={inputClass}
                    placeholder="Ej: G-20004520-0"
                  />
                </div>
                <div>
                  <label className={labelClass}>Número de Resolución</label>
                  <input
                    type="text"
                    value={form.resolution_number}
                    onChange={(e) => updateField("resolution_number", e.target.value)}
                    className={inputClass}
                    placeholder="Ej: Resolución N° XYZ"
                  />
                </div>
              </div>
            </ComponentCard>

            {/* Ubicación */}
            <ComponentCard title="Ubicación">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div>
                  <label className={labelClass}>Región</label>
                  <select
                    value={form.region}
                    onChange={(e) => handleSelectChange("region", LIST_NAMES.region, e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Seleccionar región...</option>
                    <option value="__new__">+ Nuevo</option>
                    {(listOptions[LIST_NAMES.region] || []).map((opt) => (
                      <option key={opt.id} value={opt.name}>{opt.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Núcleo</label>
                  <select
                    value={form.nucleus}
                    onChange={(e) => handleSelectChange("nucleus", LIST_NAMES.nucleus, e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Seleccionar núcleo...</option>
                    <option value="__new__">+ Nuevo</option>
                    {(listOptions[LIST_NAMES.nucleus] || []).map((opt) => (
                      <option key={opt.id} value={opt.name}>{opt.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Extensión</label>
                  <select
                    value={form.extension}
                    onChange={(e) => handleSelectChange("extension", LIST_NAMES.extension, e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Seleccionar extensión...</option>
                    <option value="__new__">+ Nuevo</option>
                    {(listOptions[LIST_NAMES.extension] || []).map((opt) => (
                      <option key={opt.id} value={opt.name}>{opt.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </ComponentCard>

            {/* Contacto */}
            <ComponentCard title="Contacto">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Teléfono</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className={inputClass}
                    placeholder="Ej: +58 212-5555555"
                  />
                </div>
                <div>
                  <label className={labelClass}>Correo Electrónico</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className={inputClass}
                    placeholder="Ej: info@unefa.edu.ve"
                  />
                </div>
                <div>
                  <label className={labelClass}>Sitio Web</label>
                  <input
                    type="url"
                    value={form.website}
                    onChange={(e) => updateField("website", e.target.value)}
                    className={inputClass}
                    placeholder="Ej: https://www.unefa.edu.ve"
                  />
                </div>
              </div>
            </ComponentCard>

            {/* Acción guardar si no hay cambios detectados */}
            {!hasChanges && hasData && (
              <div className="flex justify-end">
                <Button
                  onClick={() => setHasChanges(true)}
                  variant="outline"
                  startIcon={<EditIcon className="h-4 w-4" />}
                >
                  Editar
                </Button>
              </div>
            )}
          </>
        </SkeletonLoader>
      </div>

      {/* Modal para agregar nuevo valor a lista */}
      <UnifiedDialog
        isOpen={addValueOpen}
        onClose={() => setAddValueOpen(false)}
        title="Agregar nuevo valor"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary dark:text-text-tertiary">
            Ingrese el nombre del nuevo valor para <strong>{addValueListName}</strong>:
          </p>
          <input
            type="text"
            value={addValueInput}
            onChange={(e) => setAddValueInput(e.target.value)}
            placeholder="Nombre del valor..."
            className={inputClass}
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleAddNewValue()}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setAddValueOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddNewValue} loading={savingNewValue}>
              Agregar
            </Button>
          </div>
        </div>
      </UnifiedDialog>
    </>
  );
}
