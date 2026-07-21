/**
 * @file PracticeSequenceSection.tsx
 * @description Toggle for enforcing sequential practice order.
 * When OFF, students can enroll in any uncompleted practice type freely.
 * Toggle change requires password confirmation.
 */

import { useState, useEffect } from 'react';
import { ListOrdered, ListChecks } from 'lucide-react';
import ComponentCard from '../../../components/common/ComponentCard';
import Switch from '../../../components/form/switch/Switch';
import Button from '../../../components/ui/button/Button';
import UnifiedDialog from '../../../components/ui/dialog/UnifiedDialog';
import { useToast } from '../../../context/toast';
import { usePermissions } from '../../permissions/hooks/usePermissions';
import { useAcademicConfig } from '../hooks/useAcademicConfig';
import apiClient from '../../../api/apiClient';

export default function PracticeSequenceSection() {
  const { config, loading: configLoading } = useAcademicConfig();
  const { hasPermission } = usePermissions();
  const { addToast } = useToast();
  const canEdit = hasPermission('academic-config:edit');

  const [enabled, setEnabled] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  // Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingValue, setPendingValue] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (config && !loaded) {
      setEnabled(config.enforceSequentialOrder);
      setLoaded(true);
    }
  }, [config, loaded]);

  const handleToggle = (checked: boolean) => {
    setPendingValue(checked);
    setShowPasswordModal(true);
    setPassword('');
  };

  const handleConfirmToggle = async () => {
    if (!password.trim() || pendingValue === null) return;

    setSaving(true);
    try {
      await apiClient.put('/academic-config/enforce-sequential', {
        enforceSequentialOrder: pendingValue,
        password,
      });
      setEnabled(pendingValue);
      setShowPasswordModal(false);
      setPendingValue(null);
      setPassword('');
      addToast({
        variant: 'success',
        title: pendingValue ? 'Orden secuencial habilitado' : 'Orden secuencial deshabilitado',
        message: pendingValue
          ? 'Los estudiantes deben seguir el orden secuencial de prácticas.'
          : 'Los estudiantes pueden inscribirse en cualquier tipo de práctica libremente.',
      });
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string; code?: string } } };
      const serverMsg = axiosError?.response?.data?.message;
      const serverCode = axiosError?.response?.data?.code;
      if (serverCode === 'INVALID_PASSWORD') {
        addToast({
          variant: 'error',
          title: 'Contraseña incorrecta',
          message: 'Intente de nuevo.',
        });
      } else {
        addToast({
          variant: 'error',
          title: 'Error al actualizar configuración',
          message: serverMsg || 'No se pudo cambiar el estado del orden secuencial.',
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancelToggle = () => {
    setShowPasswordModal(false);
    setPendingValue(null);
    setPassword('');
  };

  return (
    <>
      <ComponentCard
        title="Orden Secuencial de Prácticas"
        desc="Controla si los estudiantes deben seguir un orden obligatorio al inscribirse en prácticas."
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {enabled ? (
                <ListOrdered className="w-5 h-5 text-brand-500" />
              ) : (
                <ListChecks className="w-5 h-5 text-text-tertiary" />
              )}
              <div>
                <p className="text-sm font-medium text-text-primary dark:text-text-emphasis">
                  Exigir orden secuencial
                </p>
                <p className="text-xs text-text-tertiary">
                  {enabled
                    ? 'Los estudiantes deben completar cada tipo de práctica en orden antes de avanzar al siguiente.'
                    : 'Los estudiantes pueden inscribirse en cualquier tipo de práctica sin restricción de orden.'}
                </p>
              </div>
            </div>
            <Switch
              checked={enabled}
              onChange={handleToggle}
              disabled={!canEdit || configLoading || saving}
            />
          </div>

          {!canEdit && (
            <p className="text-xs text-text-tertiary italic">
              No tiene permisos para modificar esta configuración.
            </p>
          )}
        </div>
      </ComponentCard>

      <UnifiedDialog
        isOpen={showPasswordModal}
        onClose={handleCancelToggle}
        onConfirm={handleConfirmToggle}
        title="Confirmar cambio de orden secuencial"
        variant="warning"
        confirmLabel={saving ? 'Guardando...' : 'Confirmar'}
        isLoading={saving}
        size="sm"
      >
        <div className="space-y-4 text-left">
          <p className="text-sm text-text-secondary">
            Ingrese su contraseña para {pendingValue ? 'habilitar' : 'deshabilitar'} el orden secuencial de prácticas.
          </p>
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && password.trim()) handleConfirmToggle();
            }}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border-light dark:border-white/10 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            autoFocus
          />
        </div>
      </UnifiedDialog>
    </>
  );
}
