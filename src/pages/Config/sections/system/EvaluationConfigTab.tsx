import { useState, useEffect } from "react";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { SkeletonLoader } from "@/components/ui/skeleton";
import UnifiedDialog from "@/components/ui/dialog/UnifiedDialog";
import { useToast } from "@/context/toast";
import { TOAST } from "@/components/ui/dialog/DialogConfig";
import apiClient from "@/api/apiClient";
import evaluationService from "@/features/evaluations/services/evaluationService";
import type { SystemEvaluationConfig, EvaluationCriteria } from "@/features/evaluations/types";

const WEIGHT_FIELDS = [
  { key: 'INSTITUCIONAL' as const, label: 'Institucional', description: 'Peso de la evaluación institucional en la nota final' },
  { key: 'ACADEMICO' as const, label: 'Académico', description: 'Peso de la evaluación académica en la nota final' },
  { key: 'COMITE' as const, label: 'Comité', description: 'Peso de la evaluación del comité en la nota final' },
];

export default function EvaluationConfigTab() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<SystemEvaluationConfig | null>(null);
  const [local, setLocal] = useState<SystemEvaluationConfig | null>(null);
  const { confirmDialog, showConfirm, hideConfirm } = useConfirmDialog();

  const hasChanges = local !== null && config !== null && (
    local.committeeMinMembers !== config.committeeMinMembers ||
    JSON.stringify(local.weights) !== JSON.stringify(config.weights) ||
    JSON.stringify(local.score) !== JSON.stringify(config.score)
  );

  // ── Criteria editor state ────────────────────────────────────────────────
  const [criteriaList, setCriteriaList] = useState<EvaluationCriteria[]>([]);
  const [criteriaOriginal, setCriteriaOriginal] = useState<EvaluationCriteria[]>([]);
  const [criteriaSaving, setCriteriaSaving] = useState(false);
  const [expandedType, setExpandedType] = useState<string | null>(null);
  const [criteriaLoading, setCriteriaLoading] = useState(false);
  const [creatingForType, setCreatingForType] = useState<string | null>(null);
  const [newDescription, setNewDescription] = useState('');

  const criteriaDirty = criteriaList.some(
    (c, i) => c.description !== criteriaOriginal[i]?.description
  );

  const criteriaByType = (type: string) =>
    criteriaList.filter(c => c.evaluatorType === type).sort((a, b) => a.itemNumber - b.itemNumber);

  const updateCriteriaDesc = (criteriaId: number, description: string) => {
    setCriteriaList(prev => prev.map(c => c.criteriaId === criteriaId ? { ...c, description } : c));
  };

  const handleCreateCriteria = async (evaluatorType: string) => {
    if (!newDescription.trim()) return;
    setCriteriaSaving(true);
    try {
      await evaluationService.createCriteria({ description: newDescription.trim(), evaluatorType });
      setNewDescription('');
      setCreatingForType(null);
      await fetchCriteria();
      addToast({ variant: "success", title: "Criterio creado", message: "Se agregó el nuevo criterio de evaluación." });
    } catch {
      addToast(TOAST.createError('criterio'));
    } finally {
      setCriteriaSaving(false);
    }
  };

  const handleDeleteCriteria = (criteriaId: number, description: string) => {
    showConfirm({
      title: "Eliminar criterio",
      message: `¿Eliminar el criterio "${description}"? Los criterios usados en evaluaciones existentes no se verán afectados.`,
      confirmLabel: "Eliminar",
      variant: "error",
      onConfirm: async () => {
        try {
          await evaluationService.deleteCriteria(criteriaId);
          await fetchCriteria();
          addToast({ variant: "success", title: "Criterio eliminado" });
        } catch {
          addToast(TOAST.deleteError('criterio'));
        }
        hideConfirm();
      },
    });
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
      <div className="space-y-4 animate-fadeIn">
        <ComponentCard title="Cargando...">
          <SkeletonLoader isLoading={true} skeleton={
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4 rounded-lg border border-border-light dark:border-white/10">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              ))}
            </div>
          } id="evaluation-tab-skeleton">
            <div />
          </SkeletonLoader>
        </ComponentCard>
      </div>
    );
  }

  if (!local) return null;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-text-secondary dark:text-text-tertiary">
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

        <SkeletonLoader isLoading={criteriaLoading} skeleton={
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        } id="criteria-tab-skeleton">
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
                          <div key={c.criteriaId} className={`p-2 rounded border transition-colors ${changed ? 'border-brand-300 bg-brand-50/30 dark:bg-brand-500/5' : 'border-border-light dark:border-white/10'}`}>
                            <div className="flex items-start gap-2">
                              <span className="text-xs text-text-tertiary w-6 pt-2 shrink-0">{c.itemNumber}.</span>
                              <textarea
                                rows={2}
                                value={c.description}
                                onChange={(e) => updateCriteriaDesc(c.criteriaId, e.target.value)}
                                className="w-full px-2 py-1.5 text-sm rounded border border-border-light dark:border-white/10 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
                              />
                              <button
                                onClick={() => handleDeleteCriteria(c.criteriaId, c.description)}
                                className="p-1.5 mt-1 shrink-0 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-text-tertiary hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                title="Eliminar criterio"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                            {changed && <span className="text-[10px] text-brand-600 dark:text-brand-400 ml-8">modificado</span>}
                          </div>
                        );
                      })}

                      {/* ── Crear criterio inline ── */}
                      {creatingForType === type ? (
                        <div className="p-3 rounded-lg border border-brand-300 bg-brand-50/30 dark:bg-brand-500/5">
                          <div className="flex items-start gap-2">
                            <span className="text-xs text-text-tertiary w-6 pt-2 shrink-0">{items.length + 1}.</span>
                            <textarea
                              rows={2}
                              value={newDescription}
                              onChange={(e) => setNewDescription(e.target.value)}
                              placeholder="Descripción del nuevo criterio..."
                              className="w-full px-2 py-1.5 text-sm rounded border border-border-light dark:border-white/10 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
                              autoFocus
                            />
                          </div>
                          <div className="flex justify-end gap-2 mt-2">
                            <button
                              onClick={() => { setCreatingForType(null); setNewDescription(''); }}
                              className="px-3 py-1 text-xs rounded-lg border border-border-light dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => handleCreateCriteria(type)}
                              disabled={criteriaSaving || !newDescription.trim()}
                              className="px-3 py-1 text-xs rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
                            >
                              {criteriaSaving ? 'Guardando...' : 'Guardar'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setCreatingForType(type); setNewDescription(''); }}
                          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-text-tertiary hover:text-brand-600 dark:hover:text-brand-400 border border-dashed border-border-light dark:border-white/10 rounded-lg hover:border-brand-300 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Agregar criterio
                        </button>
                      )}
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
        </SkeletonLoader>
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

      <UnifiedDialog
        isOpen={!!confirmDialog}
        onClose={hideConfirm}
        onConfirm={confirmDialog?.onConfirm || (() => {})}
        title={confirmDialog?.title || ""}
        message={confirmDialog?.message || ""}
        confirmLabel="Confirmar"
        variant={confirmDialog?.variant || "info"}
      />
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
