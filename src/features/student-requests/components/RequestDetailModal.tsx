import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../components/ui/modal';
import Badge from '../../../components/ui/badge/Badge';
import Button from '../../../components/ui/button/Button';
import { STATUS_COLORS, STATUS_LABELS, formatRequestDate } from '../utils/requestUtils';
import type { StudentRequest } from '../types';

interface RequestDetailModalProps {
  request: StudentRequest | null;
  onClose: () => void;
}

export const RequestDetailModal = ({ request, onClose }: RequestDetailModalProps) => {
  if (!request) return null;

  return (
    <Modal isOpen={!!request} onClose={onClose} size="md">
      <ModalHeader>Detalle de Solicitud</ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge color={STATUS_COLORS[request.status]}>
              {STATUS_LABELS[request.status]}
            </Badge>
            <span className="text-sm text-text-secondary">
              {formatRequestDate(request.createdAt)}
            </span>
          </div>

          <div>
            <p className="text-sm text-text-secondary">Tipo</p>
            <p className="font-medium">{request.typeName}</p>
          </div>

          <div>
            <p className="text-sm text-text-secondary">Asunto</p>
            <p className="font-medium">{request.subject}</p>
          </div>

          <div>
            <p className="text-sm text-text-secondary">Descripción</p>
            <p className="whitespace-pre-wrap">{request.description}</p>
          </div>

          {request.response && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm font-medium text-text-secondary mb-1">
                Respuesta de Coordinación
              </p>
              <p className="whitespace-pre-wrap">{request.response}</p>
              {request.processedAt && (
                <p className="text-xs text-text-secondary mt-2">
                  Respondido el {formatRequestDate(request.processedAt)}
                </p>
              )}
            </div>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default RequestDetailModal;
