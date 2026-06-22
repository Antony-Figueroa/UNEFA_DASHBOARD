import { useEffect, useState } from 'react';
import { Shield, ShieldOff } from 'lucide-react';
import ComponentCard from '../../components/common/ComponentCard';
import AsyncButton from '../../components/ui/button/AsyncButton';
import Switch from '../../components/form/switch/Switch';
import { usePeriods } from '../../features/periods/hooks/usePeriods';
import { usePermissions } from '../../features/permissions/hooks/usePermissions';

export default function GraceDefaultsSection() {
  const { graceDefaults, loadGraceDefaults, updateGraceDefaults } = usePeriods();
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission('academic-config:edit');

  const [enrollmentDays, setEnrollmentDays] = useState(0);
  const [evaluationDays, setEvaluationDays] = useState(0);
  const [allowMultiple, setAllowMultiple] = useState(true);
  const [maxPerDay, setMaxPerDay] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded) {
      loadGraceDefaults();
      setLoaded(true);
    }
  }, [loadGraceDefaults, loaded]);

  useEffect(() => {
    if (graceDefaults) {
      setEnrollmentDays(graceDefaults.defaultEnrollmentGraceDays);
      setEvaluationDays(graceDefaults.defaultEvaluationGraceDays);
      setAllowMultiple(graceDefaults.allowMultipleVisitsPerDay);
      setMaxPerDay(graceDefaults.maxVisitsPerDay);
    }
  }, [graceDefaults]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateGraceDefaults({
        defaultEnrollmentGraceDays: enrollmentDays,
        defaultEvaluationGraceDays: evaluationDays,
        allowMultipleVisitsPerDay: allowMultiple,
        maxVisitsPerDay: maxPerDay,
      });
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    graceDefaults !== null &&
    (enrollmentDays !== graceDefaults.defaultEnrollmentGraceDays ||
      evaluationDays !== graceDefaults.defaultEvaluationGraceDays ||
      allowMultiple !== graceDefaults.allowMultipleVisitsPerDay ||
      maxPerDay !== graceDefaults.maxVisitsPerDay);

  return (
    <ComponentCard
      title="Configuración de Días de Gracia"
      desc="Establece los valores por defecto para los días de gracia en inscripción y evaluación"
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-white/90 mb-1.5">
              Días de gracia (inscripción)
            </label>
            <input
              type="number"
              min={0}
              max={365}
              value={enrollmentDays}
              onChange={(e) => setEnrollmentDays(Math.max(0, Math.min(365, parseInt(e.target.value) || 0)))}
              disabled={!canEdit}
              className={`w-full h-11 rounded-lg border px-4 py-2.5 text-sm transition-all duration-200
                ${!canEdit
                  ? 'bg-bg-secondary text-text-disabled border-border-light cursor-not-allowed opacity-60 dark:bg-white/5 dark:border-border-dark'
                  : 'bg-bg-main text-text-primary border-border-medium focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:border-border-dark dark:focus:border-brand-800'
                }
              `}
            />
            <p className="mt-1 text-[11px] text-text-tertiary">Mínimo 0, máximo 365 días</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-white/90 mb-1.5">
              Días de gracia (evaluación)
            </label>
            <input
              type="number"
              min={0}
              max={365}
              value={evaluationDays}
              onChange={(e) => setEvaluationDays(Math.max(0, Math.min(365, parseInt(e.target.value) || 0)))}
              disabled={!canEdit}
              className={`w-full h-11 rounded-lg border px-4 py-2.5 text-sm transition-all duration-200
                ${!canEdit
                  ? 'bg-bg-secondary text-text-disabled border-border-light cursor-not-allowed opacity-60 dark:bg-white/5 dark:border-border-dark'
                  : 'bg-bg-main text-text-primary border-border-medium focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:border-border-dark dark:focus:border-brand-800'
                }
              `}
            />
            <p className="mt-1 text-[11px] text-text-tertiary">Mínimo 0, máximo 365 días</p>
          </div>
        </div>

        {!canEdit && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-border-light dark:border-border-dark text-xs text-text-tertiary">
            <ShieldOff className="w-4 h-4" />
            No tienes permisos para modificar la configuración de días de gracia.
          </div>
        )}

        {canEdit && (
          <div className="flex items-center justify-end pt-2 border-t border-border-light dark:border-border-dark">
            <AsyncButton
              onClick={handleSave}
              loading={saving}
              disabled={!hasChanges || saving}
              variant="primary"
              startIcon={<Shield className="w-4 h-4" />}
            >
              Guardar configuración
            </AsyncButton>
          </div>
        )}
      </div>
    </ComponentCard>

    <ComponentCard title="Configuración de Visitas" desc="Controla las visitas de seguimiento por día">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-text-primary dark:text-white/90">
              Permitir múltiples visitas el mismo día
            </label>
            <p className="text-xs text-text-tertiary mt-0.5">
              Si se desactiva, solo se permite una visita por día para cada práctica
            </p>
          </div>
          <Switch
            label=""
            defaultChecked={allowMultiple}
            onChange={setAllowMultiple}
            disabled={!canEdit}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary dark:text-white/90 mb-1.5">
            Máximo de visitas por día
          </label>
          <input
            type="number"
            min={0}
            max={365}
            value={maxPerDay ?? ''}
            onChange={(e) => setMaxPerDay(e.target.value === '' ? null : Math.max(0, parseInt(e.target.value) || 0))}
            disabled={!canEdit || !allowMultiple}
            placeholder="Sin límite"
            className={`w-full h-11 rounded-lg border px-4 py-2.5 text-sm transition-all duration-200
              ${!canEdit || !allowMultiple
                ? 'bg-bg-secondary text-text-disabled border-border-light cursor-not-allowed opacity-60 dark:bg-white/5 dark:border-border-dark'
                : 'bg-bg-main text-text-primary border-border-medium focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:border-border-dark dark:focus:border-brand-800'
              }
            `}
          />
          <p className="mt-1 text-[11px] text-text-tertiary">
            Máximo de visitas permitidas por día para una misma práctica. Vacío = sin límite.
            {!allowMultiple && ' Deshabilitado porque no se permiten múltiples visitas.'}
          </p>
        </div>

        {!canEdit && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-border-light dark:border-border-dark text-xs text-text-tertiary">
            <ShieldOff className="w-4 h-4" />
            No tienes permisos para modificar la configuración de visitas.
          </div>
        )}
      </div>
    </ComponentCard>
  );
}
