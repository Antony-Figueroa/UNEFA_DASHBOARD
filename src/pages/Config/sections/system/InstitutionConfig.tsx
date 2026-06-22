import { useState, useEffect, useCallback } from "react";
import PageMeta from "../../../../components/common/PageMeta";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import ComponentCard from "../../../../components/common/ComponentCard";
import Button from "../../../../components/ui/button/Button";
import apiClient from "../../../../api/apiClient";
import toast from "react-hot-toast";
import { EditIcon } from "../../../../icons/actions";

interface InstitutionData {
  legal_name: string;
  commercial_name: string;
  acronym: string;
  rif: string;
  phone: string;
  email: string;
  website: string;
  resolution_number: string;
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
};

export default function InstitutionConfig() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<InstitutionData>(DEFAULT_FORM);
  const [hasChanges, setHasChanges] = useState(false);
  const [hasData, setHasData] = useState(false);

  const fetchInstitution = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/system-institution");
      const data = res.data?.data;
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
        });
        setHasData(true);
      }
    } catch (error: any) {
      if (error?.response?.status !== 404) {
        toast.error("Error al cargar los datos de la institución");
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

  const handleSave = async () => {
    if (!form.legal_name.trim() || !form.commercial_name.trim() || !form.acronym.trim()) {
      toast.error("Los campos Razón Social, Nombre Comercial y Siglas son requeridos");
      return;
    }
    setSaving(true);
    try {
      await apiClient.put("/system-institution", form);
      setHasChanges(false);
      toast.success("Institución actualizada exitosamente");
      await fetchInstitution();
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Error al guardar los datos";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm(DEFAULT_FORM);
    setHasChanges(false);
    fetchInstitution();
  };

  const inputClass =
    "w-full px-3 py-2 text-sm rounded-lg border border-border-light dark:border-white/10 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors";

  const labelClass = "block text-sm font-medium text-text-primary dark:text-text-emphasis mb-1.5";

  return (
    <>
      <PageMeta title="Configuración Institucional" description="Datos de la institución" />
      <PageBreadcrumb pageTitle="Configuración Institucional" />

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

        {loading ? (
          <div className="space-y-4 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 rounded-lg border border-border-light dark:border-white/10">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2" />
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        ) : (
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
        )}
      </div>
    </>
  );
}
