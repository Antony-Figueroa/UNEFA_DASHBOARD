import { useEffect, useState } from 'react';
import { Shield, ShieldOff } from 'lucide-react';
import ComponentCard from '../../../components/common/ComponentCard';
import AsyncButton from '../../../components/ui/button/AsyncButton';
import Switch from '../../../components/form/switch/Switch';
import { usePeriods } from '../../periods/hooks/usePeriods';
import { usePermissions } from '../../permissions/hooks/usePermissions';

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

  return (
    <ComponentCard
      title="Configuración de Días de Gracia"
      headerAction={
        <div className="flex items-center gap-2">
          {canEdit && (
            <AsyncButton onClick={handleSave} loading={saving}>
              Guardar
            </AsyncButton>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-text-primary dark:text-text-emphasis">
              Días de gracia para inscripciones
            </label>
            <input
              type="number"
              min={0}
              max={30}
              value={enrollmentDays}
              onChange={(e) => setEnrollmentDays(parseInt(e.target.value) || 0)}
              disabled={!canEdit}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border-light dark:border-white/10 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-text-primary dark:text-text-emphasis">
              Días de gracia para evaluaciones
            </label>
            <input
              type="number"
              min={0}
              max={30}
              value={evaluationDays}
              onChange={(e) => setEvaluationDays(parseInt(e.target.value) || 0)}
              disabled={!canEdit}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border-light dark:border-white/10 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50"
            />
          </div>
        </div>

        <hr className="border-border-light dark:border-white/10" />

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-text-primary dark:text-text-emphasis">
            Configuración de Visitas
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {allowMultiple ? (
                <Shield className="w-4 h-4 text-brand-500" />
              ) : (
                <ShieldOff className="w-4 h-4 text-text-tertiary" />
              )}
              <div>
                <p className="text-sm font-medium text-text-primary dark:text-text-emphasis">
                  Permitir múltiples visitas por día
                </p>
                <p className="text-xs text-text-tertiary">
                  Si se activa, un tutor puede registrar más de una visita al mismo estudiante en un mismo día
                </p>
              </div>
            </div>
            <Switch
              checked={allowMultiple}
              onChange={setAllowMultiple}
              disabled={!canEdit}
            />
          </div>

          {allowMultiple && (
            <div className="pl-6">
              <label className="block text-sm font-medium mb-1.5 text-text-primary dark:text-text-emphasis">
                Máximo de visitas por día
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={maxPerDay ?? ''}
                onChange={(e) => setMaxPerDay(parseInt(e.target.value) || null)}
                disabled={!canEdit}
                className="w-full max-w-[200px] px-3 py-2 text-sm rounded-lg border border-border-light dark:border-white/10 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50"
              />
            </div>
          )}
        </div>
      </div>
    </ComponentCard>
  );
}
