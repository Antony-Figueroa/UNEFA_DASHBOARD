import { useState, useEffect } from "react";
import { useConfirmDialog } from "../../../../hooks/useConfirmDialog";
import PageMeta from "../../../../components/common/PageMeta";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import ComponentCard from "../../../../components/common/ComponentCard";
import Button from "../../../../components/ui/button/Button";
import Badge from "../../../../components/ui/badge/Badge";
import UnifiedDialog from "../../../../components/ui/dialog/UnifiedDialog";
import { useToast } from "../../../../context/toast";
import { TOAST } from "../../../../components/ui/dialog/DialogConfig";
import apiClient from "../../../../api/apiClient";
import evaluationService from "../../../../features/evaluations/services/evaluationService";
import ConfigLayout from "../../ConfigLayout";
import type { SystemEvaluationConfig, EvaluationCriteria } from "../../../../features/evaluations/types";

const WEIGHT_FIELDS = [
  { key: 'INSTITUCIONAL' as const, label: 'Institucional', description: 'Peso de la evaluación institucional en la nota final' },
  { key: 'ACADEMICO' as const, label: 'Académico', description: 'Peso de la evaluación académica en la nota final' },
  { key: 'COMITE' as const, label: 'Comité', description: 'Peso de la evaluación del comité en la nota final' },
];

export default function EvaluationConfigPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<SystemEvaluationConfig | null>(null);
  const [local, setLocal] = useState<SystemEvaluationConfig | null>(null);
  const { confirmDialog, showConfirm, hideConfirm } = useConfirmDialog();

  const hasChanges = local !== null && config !== null &&
    JSON.stringify(local) !== JSON.stringify(config);

  // ── Criteria editor state ────────────────────────────────────────────────
  const [criteriaList, setCriteriaList] = useState<EvaluationCriteria[]>([]);
  const [criteriaOriginal, setCriteriaOriginal] = useState<EvaluationCriteria[]>([]);
  const [criteriaSaving, setCriteriaSaving] = useState(false);
  const [expandedType, setExpandedType] = useState<string | null>(null);
  const [criteriaLoading, setCriteriaLoading] = useState(false);

  const criteriaDirty = criteriaList.some(
    (c, i) => c.description !== criteriaOriginal[i]?.description
  );

  const criteriaByType = (type: string) =>
    criteriaList.filter(c => c.evaluatorType === type).sort((a, b) => a.itemNumber - b.itemNumber);

  const updateCriteriaDesc = (criteriaId: number, description: string) => {
    setCriteriaList(prev => prev.map(c => c.criteriaId === criteriaId ? { ...c, description } : c));
  };

  const fetchCriteria = async () => {
    setCriteriaLoading(true);
    try {
      const data = await evaluationService.getCriteria();
      setCriteriaList(data);
      setCriteriaOriginal(JSON.parse(JSON.stringify(data)));
    } catch {
      addToast(TOAST.loadError());
    } finally {
      setCriteriaLoading(false);
    }
  };

  const handleSaveCriteria = async () => {
    const changed = criteriaList
      .filter((c, i) => c.description !== criteriaOriginal[i]?.description)
      .map(c => ({ criteriaId: c.criteriaId, description: c.description }));
    if (changed.length === 0) return;

    setCriteriaSaving(true);
    try {
      await evaluationService.updateCriteria(changed);
      setCriteriaOriginal(JSON.parse(JSON.stringify(criteriaList)));
      addToast({ variant: "success", title: "Criterios actualizados", message: `${changed.length} criterio${changed.length > 1 ? 's' : ''} actualizado${changed.length > 1 ? 's' : ''}.` });
    } catch {
      addToast(TOAST.updateError('criterios'));
    } finally {
      setCriteriaSaving(false);
    }
  };

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/evaluations/system-config');
      const data = res.data?.data ?? res.data as SystemEvaluationConfig;
      setConfig(data);
      setLocal({ ...data });
    } catch {
      addToast(TOAST.loadError());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchCriteria();
  }, []);

  const updateWeight = (key: string, value: number) => {
    if (!local) return;
    setLocal({
      ...local,
      weights: { ...local.weights, [key]: Math.max(0, Math.min(1, value)) },
    });
  };

  const updateScore = (key: string, value: number) => {
    if (!local) return;
    setLocal({
      ...local,
      score: { ...local.score, [key]: value },
    });
  };

  const updateField = (key: string, value: number) => {
    if (!local) return;
    setLocal({ ...local, [key]: value });
  };

  const weightsTotal = local
    ? (local.weights['INSTITUCIONAL'] ?? 0) +
      (local.weights['ACADEMICO'] ?? 0) +
      (local.weights['COMITE'] ?? 0)
    : 0;
  const weightsValid = Math.abs(weightsTotal - 1) <= 0.01;

  const handleSave = () => {
    showConfirm({
      title: "Guardar Configuración",
      message: "¿Estás seguro de guardar los cambios en la configuración de evaluación?",
      onConfirm: async () => {
        if (!local || !config) return;

        // Mandar solo lo que realmente cambió — evita 409 falsos
        const payload: Record<string, any> = {};
        if (JSON.stringify(local.weights) !== JSON.stringify(config.weights)) {
          payload.weights = local.weights;
        }
        if (JSON.stringify(local.score) !== JSON.stringify(config.score)) {
          payload.score = local.score;
        }
        if (local.committeeMinMembers !== config.committeeMinMembers) {
          payload.committeeMinMembers = local.committeeMinMembers;
        }
        if (Object.keys(payload).length === 0) {
          hideConfirm();
          return;
        }

        try {
          setSaving(true);
          const res = await apiClient.put('/evaluations/system-config', payload);
          const updated = res.data?.data ?? res.data as SystemEvaluationConfig;
          setConfig(updated);
          setLocal({ ...updated });
          addToast({ variant: "success", title: "Configuración guardada", message: "La configuración se guardó correctamente." });
        } catch (err: any) {
          const serverMsg = err?.response?.data?.message;
          addToast(serverMsg ? { ...TOAST.updateError('configuración'), message: serverMsg, duration: 6000 } : { ...TOAST.updateError('configuración'), duration: 6000 });
        } finally {
          setSaving(false);
          hideConfirm();
        }
      },
      variant: "info",
    });
  };

  const handleReset = () => {
    showConfirm({
      title: "Restaurar Valores",
      message: "¿Estás seguro de restaurar los valores? Los cambios no guardados se perderán.",
      onConfirm: () => {
        if (config) setLocal({ ...config });
        hideConfirm();
      },
      variant: "warning",
    });
  };

  if (loading) {
    return (
      <ConfigLayout>
        <PageMeta title="Configuración de Evaluación" description="Configuración del sistema de evaluación" />
        <PageBreadcrumb pageTitle="Configuración de Evaluación" />
        <div className="space-y-4 animate-fadeIn">
          <ComponentCard title="Cargando...">
            <div className="space-y-4 animate-pulse">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4 rounded-lg border border-border-light dark:border-white/10">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              ))}
            </div>
          </ComponentCard>
        </div>
      </ConfigLayout>
    );
  }

  if (!local) return null;

  return (
    <ConfigLayout>
      <PageMeta title="Configuración de Evaluación" description="Configuración del sistema de evaluación académica" />
      <PageBreadcrumb pageTitle="Configuración de Evaluación" />

      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary dark:text-text-emphasis">
              Evaluación
            </h1>
            <p className="mt-1 text-sm text-text-secondary dark:text-text-tertiary">
              Pesos, puntuación y reglas del sistema de evaluación de prácticas profesionales
            </p>
          </div>
          {hasChanges && (
            <div className="flex items-center gap-3">
              <Badge color="warning" variant="light" shape="rounded">
                Cambios sin guardar
              </Badge>
              <Button variant="outline" onClick={handleReset} disabled={saving}>
                Descartar
              </Button>
              <Button onClick={handleSave} disabled={saving || !weightsValid}>
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          )}
        </div>

        {/* Pesos */}
        <ComponentCard title="Ponderaciones">
          <p className="text-xs text-text-tertiary mb-4">
            Porcentaje que aporta cada evaluador a la nota final. Deben sumar 100%.
          </p>
          <div className="space-y-4">
            {WEIGHT_FIELDS.map(({ key, label, description }) => (
              <div
                key={key}
                className={`p-4 rounded-lg border transition-colors ${
                  local.weights[key] !== config?.weights[key]
                    ? 'border-brand-300 bg-brand-50/30 dark:bg-brand-500/5'
                    : 'border-border-light dark:border-white/10'
                }`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-text-primary dark:text-text-emphasis">
                        {label}
                      </label>
                      {local.weights[key] !== config?.weights[key] && (
                        <span className="text-[10px] font-medium text-brand-600 dark:text-brand-400">(modificado)</span>
                      )}
                    </div>
                    <p className="text-xs text-text-tertiary mt-0.5">{description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={Math.round(local.weights[key] * 100)}
                      onChange={(e) => updateWeight(key, parseInt(e.target.value) / 100)}
                      className="w-32 h-2 rounded-full appearance-none cursor-pointer accent-brand-500"
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="5"
                      value={Math.round(local.weights[key] * 100)}
                      onChange={(e) => updateWeight(key, (parseInt(e.target.value) || 0) / 100)}
                      className="w-20 px-2 py-1.5 text-sm text-center rounded-lg border border-border-light dark:border-white/10 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                    <span className="text-sm text-text-tertiary w-6">%</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Suma total */}
            <div className={`flex items-center justify-end gap-2 text-sm ${
              weightsValid ? 'text-green-600 dark:text-green-400' : 'text-red-500'
            }`}>
              <span>Total:</span>
              <span className="font-semibold">{(weightsTotal * 100).toFixed(0)}%</span>
              {!weightsValid && (
                <span className="text-xs">— debe sumar 100%</span>
              )}
            </div>
          </div>
        </ComponentCard>

        {/* Puntuación */}
        <ComponentCard title="Rango de Puntuación">
          <p className="text-xs text-text-tertiary mb-4">
            Valores mínimo y máximo para las evaluaciones, y escala de visualización de la nota final.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ScoreInput
              label="Puntaje mínimo"
              value={local.score.min}
              onChange={(v) => updateScore('min', v)}
              changed={local.score.min !== config?.score.min}
            />
            <ScoreInput
              label="Puntaje máximo"
              value={local.score.max}
              onChange={(v) => updateScore('max', v)}
              changed={local.score.max !== config?.score.max}
            />
            <ScoreInput
              label="Escala de visualización"
              description="La nota final se escala a este valor (ej: 20)"
              value={local.score.displayScale}
              onChange={(v) => updateScore('displayScale', v)}
              changed={local.score.displayScale !== config?.score.displayScale}
            />
          </div>
        </ComponentCard>

        {/* Comité */}
        <ComponentCard title="Comité Evaluador">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg border transition-colors ${
              local.committeeMinMembers !== config?.committeeMinMembers
                ? 'border-brand-300 bg-brand-50/30 dark:bg-brand-500/5'
                : 'border-border-light dark:border-white/10'
            }`}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-text-primary dark:text-text-emphasis">
                      Miembros mínimos del comité
                    </label>
                    {local.committeeMinMembers !== config?.committeeMinMembers && (
                      <span className="text-[10px] font-medium text-brand-600 dark:text-brand-400">(modificado)</span>
                    )}
                  </div>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    Cantidad de miembros necesarios para considerar completo el comité evaluador
                  </p>
                </div>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={local.committeeMinMembers ?? 3}
                  onChange={(e) => updateField('committeeMinMembers', parseInt(e.target.value) || 3)}
                  className="w-24 px-3 py-2 text-sm text-center rounded-lg border border-border-light dark:border-white/10 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>
          </div>
        </ComponentCard>

        {/* Criterios de Evaluación */}
        <ComponentCard title="Criterios de Evaluación">
          <p className="text-xs text-text-tertiary mb-4">
            Descripciones de cada criterio por tipo de evaluador. Los cambios se guardan en batch.
          </p>

          {criteriaLoading ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {(['INSTITUCIONAL', 'ACADEMICO', 'COMITE'] as const).map(type => {
                const items = criteriaByType(type);
                const isOpen = expandedType === type;
                const hasDirty = items.some(
                  c => c.description !== criteriaOriginal.find(o => o.criteriaId === c.criteriaId)?.description
                );
                return (
                  <div key={type} className="border border-border-light dark:border-white/10 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedType(isOpen ? null : type)}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-text-primary dark:text-text-emphasis hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span>{type === 'INSTITUCIONAL' ? 'Institucional' : type === 'ACADEMICO' ? 'Académico' : 'Comité'}</span>
                        <span className="text-xs text-text-tertiary">({items.length} criterios)</span>
                      </div>
                      {hasDirty && <Badge color="warning" variant="light" shape="rounded">modificado</Badge>}
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 space-y-3 border-t border-border-light dark:border-white/10 pt-3">
                        {items.map(c => {
                          const origDesc = criteriaOriginal.find(o => o.criteriaId === c.criteriaId)?.description;
                          const changed = c.description !== origDesc;
                          return (
                            <div key={c.criteriaId} className={`p-2 rounded border transition-colors ${changed ? 'border-brand-300 bg-brand-50/30 dark:bg-brand-500/5' : 'border-transparent'}`}>
                              <div className="flex items-start gap-2">
                                <span className="text-xs text-text-tertiary w-6 pt-2 shrink-0">{c.itemNumber}.</span>
                                <textarea
                                  rows={2}
                                  value={c.description}
                                  onChange={(e) => updateCriteriaDesc(c.criteriaId, e.target.value)}
                                  className="w-full px-2 py-1.5 text-sm rounded border border-border-light dark:border-white/10 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
                                />
                              </div>
                              {changed && <span className="text-[10px] text-brand-600 dark:text-brand-400 ml-8">modificado</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {criteriaDirty && (
                <div className="flex justify-end pt-2">
                  <Button onClick={handleSaveCriteria} disabled={criteriaSaving} size="sm">
                    {criteriaSaving ? 'Guardando...' : 'Guardar cambios en criterios'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </ComponentCard>

        {/* ⚠️ Nota sobre cambios que afectan evaluaciones existentes */}
        <div className="p-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
          <div className="flex gap-3">
            <svg className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Las ponderaciones, el rango de puntuación y la escala de visualización
                <strong> no se pueden modificar</strong> si ya existen evaluaciones registradas.
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                Los miembros mínimos del comité se pueden cambiar en cualquier momento.
                Si necesitás cambiar los pesos o puntajes, creá un nuevo período académico.
              </p>
            </div>
          </div>
        </div>
      </div>

      <UnifiedDialog
        isOpen={!!confirmDialog}
        onClose={hideConfirm}
        onConfirm={confirmDialog?.onConfirm || (() => {})}
        title={confirmDialog?.title || ""}
        message={confirmDialog?.message || ""}
        confirmLabel="Confirmar"
        variant={confirmDialog?.variant || "info"}
      />
    </ConfigLayout>
  );
}

// ── Sub-componente helper: fila de criterio editable ──────────────────────
function CriteriaRow({ criteria, onSave }: { criteria: EvaluationCriteria; onSave: (id: number, description: string) => Promise<void> }) {
  const [draft, setDraft] = useState(criteria.description);
  const [saving, setSaving] = useState(false);
  const changed = draft !== criteria.description;

  useEffect(() => { setDraft(criteria.description); }, [criteria.description]);

  const handleSave = async () => {
    setSaving(true);
    await onSave(criteria.criteriaId, draft);
    setSaving(false);
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <span className="w-8 text-xs font-semibold text-text-tertiary text-center shrink-0">
        #{criteria.itemNumber}
      </span>
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-border-light dark:border-white/10 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      />
      {changed && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="shrink-0 px-3 py-1.5 text-xs font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors"
        >
          {saving ? '...' : 'Guardar'}
        </button>
      )}
    </div>
  );
}

function ScoreInput({
  label,
  description,
  value,
  onChange,
  changed,
}: {
  label: string;
  description?: string;
  value: number;
  onChange: (v: number) => void;
  changed: boolean;
}) {
  return (
    <div className={`p-4 rounded-lg border transition-colors ${
      changed
        ? 'border-brand-300 bg-brand-50/30 dark:bg-brand-500/5'
        : 'border-border-light dark:border-white/10'
    }`}>
      <div className="flex items-center gap-2 mb-1">
        <label className="text-sm font-medium text-text-primary dark:text-text-emphasis">
          {label}
        </label>
        {changed && (
          <span className="text-[10px] font-medium text-brand-600 dark:text-brand-400">(modificado)</span>
        )}
      </div>
      {description && (
        <p className="text-xs text-text-tertiary mb-2">{description}</p>
      )}
      <input
        type="number"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className="w-full px-3 py-2 text-sm rounded-lg border border-border-light dark:border-white/10 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      />
    </div>
  );
}
