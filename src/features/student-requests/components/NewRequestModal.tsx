import { useState, useMemo } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../components/ui/modal';
import Button from '../../../components/ui/button/Button';
import ReassignmentFields from './ReassignmentFields';
import type { RequestType, ReassignmentOption } from '../types';

export interface NewRequestFormData {
  typeId: string;
  subject: string;
  description: string;
}

export interface ReassignmentFormData {
  newTutorId: string;
  newInstitutionId: string;
  newCareerId: string;
  reason: string;
}

interface NewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestTypes: RequestType[];
  tutors: ReassignmentOption[];
  institutions: ReassignmentOption[];
  careers: ReassignmentOption[];
  submitting: boolean;
  onSubmit: (data: NewRequestFormData, reassignmentData: ReassignmentFormData) => void;
}

const INITIAL_REQUEST: NewRequestFormData = { typeId: '', subject: '', description: '' };
const INITIAL_REASSIGNMENT: ReassignmentFormData = {
  newTutorId: '',
  newInstitutionId: '',
  newCareerId: '',
  reason: ''
};

export const NewRequestModal = ({
  isOpen,
  onClose,
  requestTypes,
  tutors,
  institutions,
  careers,
  submitting,
  onSubmit
}: NewRequestModalProps) => {
  const [newRequest, setNewRequest] = useState<NewRequestFormData>(INITIAL_REQUEST);
  const [reassignmentData, setReassignmentData] = useState<ReassignmentFormData>(INITIAL_REASSIGNMENT);

  const selectedType = useMemo(
    () => requestTypes.find(t => t.id === parseInt(newRequest.typeId)),
    [requestTypes, newRequest.typeId]
  );

  const isReassignment = selectedType?.isReassignment || selectedType?.category === 'REASSIGNMENT';
  const typeName = selectedType?.name || '';
  const canSubmit = newRequest.typeId && newRequest.subject && newRequest.description
    && (!isReassignment || reassignmentData.reason);

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(newRequest, reassignmentData);
  };

  const handleClose = () => {
    setNewRequest(INITIAL_REQUEST);
    setReassignmentData(INITIAL_REASSIGNMENT);
    onClose();
  };

  const handleReassignmentChange = (field: string, value: number | string | undefined) => {
    setReassignmentData(prev => ({
      ...prev,
      [field]: typeof value === 'number' ? String(value) : (value ?? '')
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalHeader>Nueva Solicitud</ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          {/* Tipo de Solicitud */}
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de Solicitud *</label>
            <select
              value={newRequest.typeId}
              onChange={(e) => setNewRequest(prev => ({ ...prev, typeId: e.target.value }))}
              className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800"
            >
              <option value="">Seleccionar...</option>
              {requestTypes.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Asunto */}
          <div>
            <label className="block text-sm font-medium mb-1">Asunto *</label>
            <input
              type="text"
              value={newRequest.subject}
              onChange={(e) => setNewRequest(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800"
              placeholder="Breve descripción del motivo"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium mb-1">Descripción *</label>
            <textarea
              value={newRequest.description}
              onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800"
              rows={4}
              placeholder="Detalla tu solicitud..."
            />
          </div>

          {/* Reasignación — usa el componente compartido */}
          {isReassignment && (
            <ReassignmentFields
              typeName={typeName}
              tutors={tutors}
              institutions={institutions}
              careers={careers}
              values={{
                newTutorId: reassignmentData.newTutorId || undefined,
                newInstitutionId: reassignmentData.newInstitutionId || undefined,
                newCareerId: reassignmentData.newCareerId || undefined
              }}
              reason={reassignmentData.reason}
              showReason={true}
              onChange={handleReassignmentChange}
              onReasonChange={(value) => setReassignmentData(prev => ({ ...prev, reason: value }))}
            />
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={handleClose}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
        >
          {submitting ? 'Enviando...' : 'Enviar Solicitud'}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default NewRequestModal;
