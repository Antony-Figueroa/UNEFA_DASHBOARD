import { useState, useEffect, useMemo } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../components/ui/modal';
import Button from '../../../components/ui/button/Button';
import AsyncButton from '../../../components/ui/button/AsyncButton';
import { STATUS_OPTIONS } from '../utils/requestUtils';
import ReassignmentFields from './ReassignmentFields';
import type { AdminRequest, ReassignmentOption } from '../types';

export interface AttentionFormData {
  newStatus: string;
  response: string;
  reassignmentOverride: {
    newTutorId?: number;
    newInstitutionId?: number;
    newCareerId?: number;
  };
}

interface RequestAttentionModalProps {
  request: AdminRequest | null;
  onClose: () => void;
  tutors: ReassignmentOption[];
  institutions: ReassignmentOption[];
  careers: ReassignmentOption[];
  saving: boolean;
  onSubmit: (data: AttentionFormData) => void;
}

export const RequestAttentionModal = ({
  request,
  onClose,
  tutors,
  institutions,
  careers,
  saving,
  onSubmit
}: RequestAttentionModalProps) => {
  const [formData, setFormData] = useState<AttentionFormData>({
    newStatus: '',
    response: '',
    reassignmentOverride: {}
  });

  const typeName = request?.typeName || '';
  const reassignmentData = request?.reassignmentData;

  const isReassignmentType = useMemo(
    () => request?.isReassignment === true ||
      typeName.includes('Tutor') ||
      typeName.includes('Empresa') ||
      typeName.includes('Carrera'),
    [request, typeName]
  );

  // Initialize form when request changes
  useEffect(() => {
    if (request) {
      setFormData({
        newStatus: request.status,
        response: request.response || '',
        reassignmentOverride: {
          newTutorId: request.reassignmentData?.newTutorId,
          newInstitutionId: request.reassignmentData?.newInstitutionId,
          newCareerId: request.reassignmentData?.newCareerId
        }
      });
    }
  }, [request]);

  const handleReassignmentChange = (field: string, value: number | string | undefined) => {
    setFormData(prev => ({
      ...prev,
      reassignmentOverride: {
        ...prev.reassignmentOverride,
        [field]: value as number | undefined
      }
    }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  if (!request) return null;

  return (
    <Modal isOpen={!!request} onClose={onClose} size="lg">
      <ModalHeader>Atender Solicitud</ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          {/* Datos del Estudiante */}
          <div className="grid grid-cols-2 gap-4">
            <div className="min-w-0">
              <p className="text-sm text-text-secondary">Estudiante</p>
              <p className="font-medium break-words" title={request.studentName}>
                {request.studentName}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Cédula</p>
              <p className="font-medium">{request.studentCi}</p>
            </div>
            <div className="min-w-0">
              <p className="text-sm text-text-secondary">Correo electrónico</p>
              <p className="font-medium break-words" title={request.studentEmail}>
                {request.studentEmail}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-sm text-text-secondary">Tipo</p>
              <p className="font-medium break-words" title={request.typeName}>
                {request.typeName}
              </p>
            </div>
          </div>

          {/* Asunto */}
          <div className="border-t border-border-light dark:border-border-dark pt-4">
            <p className="text-sm text-text-secondary mb-1">Asunto</p>
            <p className="font-medium break-words" title={request.subject}>
              {request.subject}
            </p>
          </div>

          {/* Descripción */}
          <div>
            <p className="text-sm text-text-secondary mb-1">Descripción</p>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg max-h-40 overflow-y-auto">
              <p className="whitespace-pre-wrap break-words">{request.description}</p>
            </div>
          </div>

          {/* Reasignación */}
          {isReassignmentType && reassignmentData && (
            <div className="border-t border-border-light dark:border-border-dark pt-4">
              <p className="text-sm font-medium mb-3 flex items-center gap-2">
                <span className="text-yellow-600">⚠️</span>
                Datos de Reasignación (puede modificar antes de aprobar)
              </p>

              {reassignmentData.reason && (
                <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg max-h-32 overflow-y-auto">
                  <p className="text-sm text-text-secondary">Motivo del estudiante:</p>
                  <p className="text-sm break-words whitespace-pre-wrap">{reassignmentData.reason}</p>
                </div>
              )}

              <ReassignmentFields
                typeName={typeName}
                tutors={tutors}
                institutions={institutions}
                careers={careers}
                values={formData.reassignmentOverride}
                showReason={false}
                onChange={handleReassignmentChange}
              />
            </div>
          )}

          {/* Cambio de Estado */}
          <div className="border-t border-border-light dark:border-border-dark pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Estado</label>
                <select
                  value={formData.newStatus}
                  onChange={(e) => setFormData(prev => ({ ...prev, newStatus: e.target.value }))}
                  className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800"
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Respuesta */}
          <div>
            <label className="block text-sm font-medium mb-1">Respuesta al Estudiante</label>
            <textarea
              value={formData.response}
              onChange={(e) => setFormData(prev => ({ ...prev, response: e.target.value }))}
              className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800"
              rows={4}
              placeholder="Escribe la respuesta o comentarios..."
            />
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <AsyncButton variant="primary" onClick={handleSubmit} loading={saving}>
          Guardar Cambios
        </AsyncButton>
      </ModalFooter>
    </Modal>
  );
};

export default RequestAttentionModal;
