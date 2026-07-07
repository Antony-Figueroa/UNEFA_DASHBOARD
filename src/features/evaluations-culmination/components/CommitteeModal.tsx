/**
 * @file CommitteeModal.tsx
 * @description Modal para asignar/pre-asignar miembros del comité evaluador (3 miembros).
 * Carga asignaciones existentes, permite editar y guardar.
 */

import { useState, useEffect, useCallback } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../components/ui/modal';
import Button from '../../../components/ui/button/Button';
import { evaluationService } from '../../evaluations/services/evaluationService';
import type { CommitteeAssignment } from '../../evaluations/types';
import { isSafeInput } from '../../../utils/inputValidation';
import toast from 'react-hot-toast';

interface CommitteeModalProps {
  isOpen: boolean;
  onClose: () => void;
  practiceId: number;
  studentName: string;
  onSuccess: () => void;
}

interface MemberForm {
  evaluatorName: string;
  evaluatorCi: string;
}

const MEMBER_COUNT = 3;

export const CommitteeModal: React.FC<CommitteeModalProps> = ({
  isOpen,
  onClose,
  practiceId,
  studentName,
  onSuccess,
}) => {
  const [members, setMembers] = useState<Record<number, MemberForm>>({
    1: { evaluatorName: '', evaluatorCi: '' },
    2: { evaluatorName: '', evaluatorCi: '' },
    3: { evaluatorName: '', evaluatorCi: '' },
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);

  // Cargar asignaciones existentes al abrir
  useEffect(() => {
    if (!isOpen || !practiceId) return;

    const loadAssignments = async () => {
      setInitialLoading(true);
      try {
        const existing = await evaluationService.getCommitteeAssignments(practiceId);
        if (existing.length > 0) {
          const loaded: Record<number, MemberForm> = {
            1: { evaluatorName: '', evaluatorCi: '' },
            2: { evaluatorName: '', evaluatorCi: '' },
            3: { evaluatorName: '', evaluatorCi: '' },
          };
          existing.forEach((a: CommitteeAssignment) => {
            loaded[a.memberIndex] = {
              evaluatorName: a.evaluatorName,
              evaluatorCi: a.evaluatorCi || '',
            };
          });
          setMembers(loaded);
        }
      } catch {
        // Silenciar — simplemente muestra campos vacíos
      } finally {
        setInitialLoading(false);
      }
    };

    loadAssignments();
  }, [isOpen, practiceId]);

  // Reset al cerrar
  const handleClose = useCallback(() => {
    setMembers({
      1: { evaluatorName: '', evaluatorCi: '' },
      2: { evaluatorName: '', evaluatorCi: '' },
      3: { evaluatorName: '', evaluatorCi: '' },
    });
    onClose();
  }, [onClose]);

  const updateMember = (index: number, field: keyof MemberForm, value: string) => {
    setMembers(prev => ({
      ...prev,
      [index]: { ...prev[index], [field]: value },
    }));
  };

  const filledMembers = Object.entries(members)
    .filter(([, m]) => m.evaluatorName.trim().length >= 3)
    .map(([idx, m]) => ({
      memberIndex: parseInt(idx),
      evaluatorName: m.evaluatorName.trim(),
      evaluatorCi: m.evaluatorCi.trim() || undefined,
    }));

  const canSubmit = filledMembers.length >= 1 && filledMembers.every(m =>
    m.evaluatorName.length >= 3 && isSafeInput(m.evaluatorName)
  );

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      await evaluationService.upsertCommitteeAssignments(practiceId, filledMembers);
      toast.success(`Comité asignado para ${studentName}`);
      onSuccess();
      handleClose();
    } catch (error) {
      toast.error('Error al guardar comité');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalHeader>
        Asignar Comité Evaluador
      </ModalHeader>

      <ModalBody className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Asigne los miembros del comité evaluador para <strong>{studentName}</strong>.
          Se requiere mínimo 1 miembro (se recomiendan 3 para评分 completa).
        </p>

        {initialLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
          </div>
        ) : (
          <div className="space-y-3">
            {([1, 2, 3] as const).map(idx => (
              <div
                key={idx}
                className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Miembro #{idx} {idx === 3 && <span className="text-gray-400">(opcional)</span>}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={members[idx].evaluatorName}
                    onChange={(e) => updateMember(idx, 'evaluatorName', e.target.value)}
                    placeholder="Nombre completo"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-white"
                  />
                  <input
                    type="text"
                    value={members[idx].evaluatorCi}
                    onChange={(e) => updateMember(idx, 'evaluatorCi', e.target.value)}
                    placeholder="Cédula (opcional)"
                    maxLength={12}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-400">
          Los miembros pre-asignados aparecerán al momento de evaluar el comité.
        </p>
      </ModalBody>

      <ModalFooter>
        <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || loading}
          loading={loading}
          loadingText="Guardando..."
        >
          Guardar Comité
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default CommitteeModal;
