import { useState, useEffect } from "react";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import ComponentCard from "../../../components/common/ComponentCard";
import Button from "../../../components/ui/button/Button";
import Badge from "../../../components/ui/badge/Badge";
import UnifiedDialog from "../../../components/ui/dialog/UnifiedDialog";
import { useToast } from "../../../context/toast";
import { TOAST } from "../../../components/ui/dialog/DialogConfig";
import apiClient from "../../../api/apiClient";
import evaluationService from "../../evaluations/services/evaluationService";
import type { SystemEvaluationConfig, EvaluationCriteria } from "../../evaluations/types";

const WEIGHT_FIELDS = [
  { key: 'INSTITUCIONAL' as const, label: 'Institucional' },
  { key: 'ACADEMICO' as const, label: 'Académico' },
  { key: 'COMITE' as const, label: 'Comité' },
];

const TYPE_LABELS = { INSTITUCIONAL: 'Institucional', ACADEMICO: 'Académico', COMITE: 'Comité' } as const;

export default function EvaluationConfigSection() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<SystemEvaluationConfig | null>(null);
  const [local, setLocal] = useState<SystemEvaluationConfig | null>(null);
  const { confirmDialog, showConfirm, hideConfirm } = useConfirmDialog();

  const [criteriaList, setCriteriaList] = useState<EvaluationCriteria[]>([]);
  const [criteriaOriginal, setCriteriaOriginal] = useState<EvaluationCriteria[]>([]);
  const [criteriaSaving, setCriteriaSaving] = useState(false);
  const [expandedType, setExpandedType] = useState<string | null>(null);
  const [criteriaLoading, setCriteriaLoading] = useState(false);

  const hasChanges = local !== null && config !== null &&
    JSON.stringify(local) !== JSON.stringify(config);

  const criteriaByType = (type: string) =>
    criteriaList.filter(c => c.evaluatorType === type).sort((a, b) => a.itemNumber - b.itemNumber);

  const criteriaDirty = criteriaList.some(
    (c, i) => c.description !== criteriaOriginal[i]?.description
  );

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
      addToast({ variant: "success", title: "Criterios actualizados", message: `${changed.length} criterio${changed.length > 1 ? 's' : ''} guardado${changed.length > 1 ? 's' : ''}.` });
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
    setLocal({ ...local, weights: { ...local.weights, [key]: Math.max(0, Math.min(1, value)) } });
  };

  const updateScore = (key: string, value: number) => {
    if (!local) return;
    setLocal({ ...local, score: { ...local.score, [key]: value } });
  };

  const updateField = (key: string, value: number) => {
    if (!local) return;
    setLocal({ ...local, [key]: value });
  };

  const weightsTotal = local
    ? (local.weights['INSTITUCIONAL'] ?? 0) + (local.weights['ACADEMICO'] ?? 0) + (local.weights['COMITE'] ?? 0)
    : 0;
  const weightsValid = Math.abs(weightsTotal - 1) <= 0.01;

  const handleSave = () => {
    showConfirm({
      title: "Guardar Configuración",
      message: "¿Estás seguro de guardar los cambios en la configuración de evaluación?",
      onConfirm: async () => {
        if (!local || !config) return;
        const payload: Record<string, any> = {};
        if (JSON.stringify(local.weights) !== JSON.stringify(config.weights)) payload.weights = local.weights;
        if (JSON.stringify(local.score) !== JSON.stringify(config.score)) payload.score = local.score;
        if (local.committeeMinMembers !== config.committeeMinMembers) payload.committeeMinMembers = local.committeeMinMembers;
        if (Object.keys(payload).length === 0) { hideConfirm(); return; }

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
      onConfirm: () => { if (config) setLocal({ ...config }); hideConfirm(); },
      variant: "warning",
    });
  };

  if (loading) return <ComponentCard title="Configuración de Evaluación"><div className="space-y-4 animate-pulse">{Array.from({ length: 4 }).map((_, i) => (<div key={i} className="p-4 rounded-lg border border-border-light dark:border-white/10"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div><div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div></div>))}</div></ComponentCard>;
  if (!local) return null;

  return (
    <>
      <ComponentCard title="Configuración de Evaluación">
        <div className="space-y-6">
          {/* Pesos */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-text-primary dark:text-text-emphasis">Ponderaciones</h3>
                <p className="text-sm text-text-tertiary">Porcentaje que aporta cada evaluador a la nota final. Deben sumar 100%.</p>
              </div>
            </div>
            <div className="space-y-3">
              {WEIGHT_FIELDS.map(({ key, label }) => {
                const changed = local.weights[key] !== config?.weights[key];
                return (
                  <div key={key} className={`p-4 rounded-lg border transition-colors flex items-center justify-between gap-4 ${changed ? 'border-brand-300 bg-brand-50/30 dark:bg-brand-500/5' : 'border-border-light dark:border-white/10'}`}>
                    <div className="flex-1">
                      <label className="text-sm font-medium text-text-primary dark:text-text-emphasis flex items-center gap-2">
                        {label}
                        {changed && <span className="text-[10px] font-medium text-brand-600 dark:text-brand-400">(modificado)</span>}
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="range" min="0" max="100" value={Math.round(local.weights[key] * 100)} onChange={(e) => updateWeight(key, parseInt(e.target.value) / 100)} className="w-32 h-2 rounded-full appearance-none cursor-pointer accent-brand-500" />
                      <input type="number" min="0" max="100" step="5" value={Math.round(local.weights[key] * 100)} onChange={(e) => updateWeight(key, (parseInt(e.target.value) || 0) / 100)} className="w-20 px-2 py-1.5 text-sm text-center rounded-lg border border-border-light dark:border-white/10 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
                      <span className="text-sm text-text-tertiary w-6">%</span>
                    </div>
                  </div>
                );
              })}
              <div className={`flex items-center justify-end gap-2 text-sm ${weightsValid ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                <span>Total:</span>
                <span className="font-semibold">{(weightsTotal * 100).toFixed(0)}%</span>
                {!weightsValid && <span className="text-xs">— debe sumar 100%</span>}
              </div>
            </div>
          </section>

          {/* Puntuación */}
          <section className="pt-4 border-t border-border-light dark:border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-text-primary dark:text-text-emphasis">Rango de Puntuación</h3>
                <p className="text-sm text-text-tertiary">Valores mínimo y máximo para las evaluaciones, y escala de visualización de la nota final.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { key: 'min' as const, label: 'Puntaje mínimo' },
                { key: 'max' as const, label: 'Puntaje máximo' },
                { key: 'displayScale' as const, label: 'Escala de visualización', desc: 'La nota final se escala a este valor (ej: 20)' },
              ].map(({ key, label, desc }) => {
                const changed = local.score[key] !== config?.score[key];
                return (
                  <div key={key} className={`p-4 rounded-lg border transition-colors ${changed ? 'border-brand-300 bg-brand-50/30 dark:bg-brand-500/5' : 'border-border-light dark:border-white/10'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <label className="text-sm font-medium text-text-primary dark:text-text-emphasis">{label}</label>
                      {changed && <span className="text-[10px] font-medium text-brand-600 dark:text-brand-400">(modificado)</span>}
                    </div>
                    {desc && <p className="text-xs text-text-tertiary mb-2">{desc}</p>}
                    <input type="number" min="0" max="100" value={local.score[key]} onChange={(e) => updateScore(key, parseInt(e.target.value) || 0)} className="w-full px-3 py-2 text-sm rounded-lg border border-border-light dark:border-white/10 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
                  </div>
                );
              })}
            </div>
          </section>

          {/* Comité */}
          <section className="pt-4 border-t border-border-light dark:border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-text-primary dark:text-text-emphasis">Comité Evaluador</h3>
              </div>
            </div>
            <div className={`p-4 rounded-lg border transition-colors ${local.committeeMinMembers !== config?.committeeMinMembers ? 'border-brand-300 bg-brand-50/30 dark:bg-brand-500/5' : 'border-border-light dark:border-white/10'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-text-primary dark:text-text-emphasis flex items-center gap-2">
                    Miembros mínimos del comité
                    {local.committeeMinMembers !== config?.committeeMinMembers && <span className="text-[10px] font-medium text-brand-600 dark:text-brand-400">(modificado)</span>}
                  </label>
                  <p className="text-xs text-text-tertiary mt-0.5">Cantidad de miembros necesarios para considerar completo el comité evaluador</p>
                </div>
                <input type="number" min="1" max="10" value={local.committeeMinMembers ?? 3} onChange={(e) => updateField('committeeMinMembers', parseInt(e.target.value) || 3)} className="w-24 px-3 py-2 text-sm text-center rounded-lg border border-border-light dark:border-white/10 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
              </div>
            </div>
          </section>

          {/* Criterios */}
          <section className="pt-4 border-t border-border-light dark:border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-text-primary dark:text-text-emphasis">Criterios de Evaluación</h3>
                <p className="text-sm text-text-tertiary">Descripciones de cada criterio por tipo de evaluador. Los cambios se guardan en batch.</p>
              </div>
            </div>

            {criteriaLoading ? (
              <div className="space-y-3 animate-pulse">{Array.from({ length: 3 }).map((_, i) => (<div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />))}</div>
            ) : (
              <div className="space-y-3">
                {(['INSTITUCIONAL', 'ACADEMICO', 'COMITE'] as const).map(type => {
                  const items = criteriaByType(type);
                  const isOpen = expandedType === type;
                  const hasDirty = items.some(c => c.description !== criteriaOriginal.find(o => o.criteriaId === c.criteriaId)?.description);
                  return (
                    <div key={type} className="border border-border-light dark:border-white/10 rounded-lg overflow-hidden">
                      <button onClick={() => setExpandedType(isOpen ? null : type)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-text-primary dark:text-text-emphasis hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-2">
                          <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                          <span>{TYPE_LABELS[type]}</span>
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
                                  <textarea rows={2} value={c.description} onChange={(e) => updateCriteriaDesc(c.criteriaId, e.target.value)} className="w-full px-2 py-1.5 text-sm rounded border border-border-light dark:border-white/10 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none" />
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
                {criteriaDirty && <div className="flex justify-end pt-2"><Button onClick={handleSaveCriteria} disabled={criteriaSaving} size="sm">{criteriaSaving ? 'Guardando...' : 'Guardar cambios en criterios'}</Button></div>}
              </div>
            )}
          </section>

          {/* Nota */}
          <div className="p-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
            <div className="flex gap-3">
              <svg className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Las ponderaciones, el rango de puntuación y la escala de visualización <strong>no se pueden modificar</strong> si ya existen evaluaciones registradas.</p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">Los miembros mínimos del comité se pueden cambiar en cualquier momento. Si necesitás cambiar los pesos o puntajes, creá un nuevo período académico.</p>
              </div>
            </div>
          </div>

          {/* Acciones */}
          {hasChanges && (
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-light dark:border-white/10">
              <Badge color="warning" variant="light" shape="rounded">Cambios sin guardar</Badge>
              <Button variant="outline" onClick={handleReset} disabled={saving}>Descartar</Button>
              <Button onClick={handleSave} disabled={saving || !weightsValid}>{saving ? 'Guardando...' : 'Guardar'}</Button>
            </div>
          )}
        </div>
      </ComponentCard>

      <UnifiedDialog isOpen={!!confirmDialog} onClose={hideConfirm} onConfirm={confirmDialog?.onConfirm || (() => {})} title={confirmDialog?.title || ""} message={confirmDialog?.message || ""} confirmLabel="Confirmar" variant={confirmDialog?.variant || "info"} />
    </>
  );
}