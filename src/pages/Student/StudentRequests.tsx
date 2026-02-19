import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import studentService, { StudentRequest, RequestType } from "../../features/student/services/studentService";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../components/ui/modal";
import toast from "react-hot-toast";

const statusColors: Record<string, "success" | "warning" | "info" | "error" | "light"> = {
  pending: "warning",
  in_review: "info",
  approved: "success",
  rejected: "error"
};

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  in_review: "En Revisión",
  approved: "Aprobada",
  rejected: "Rechazada"
};

export default function StudentRequests() {
  const [requests, setRequests] = useState<StudentRequest[]>([]);
  const [types, setTypes] = useState<RequestType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<StudentRequest | null>(null);
  const [newRequest, setNewRequest] = useState({
    typeId: "",
    subject: "",
    description: ""
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [requestsData, typesData] = await Promise.all([
        studentService.getRequests(),
        studentService.getRequestTypes()
      ]);
      setRequests(requestsData);
      setTypes(typesData);
    } catch (err) {
      console.error("[StudentRequests] Error:", err);
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newRequest.typeId || !newRequest.subject || !newRequest.description) {
      toast.error("Todos los campos son requeridos");
      return;
    }

    try {
      setSubmitting(true);
      await studentService.createRequest({
        typeId: parseInt(newRequest.typeId),
        subject: newRequest.subject,
        description: newRequest.description
      });
      toast.success("Solicitud enviada exitosamente");
      setShowModal(false);
      setNewRequest({ typeId: "", subject: "", description: "" });
      fetchData();
    } catch (err) {
      console.error("[StudentRequests] Error creating:", err);
      toast.error("Error al enviar solicitud");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Mis Solicitudes | SIGP - UNEFA"
        description="Gestión de solicitudes del estudiante"
      />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-text-emphasis dark:text-text-emphasis">
              Mis Solicitudes
            </h1>
            <p className="text-text-secondary dark:text-text-tertiary mt-1">
              Gestiona tus solicitudes a coordinación
            </p>
          </div>
          <Button variant="primary" onClick={() => setShowModal(true)}>
            Nueva Solicitud
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {requests.filter(r => r.status === 'pending').length}
            </p>
            <p className="text-sm text-yellow-700">Pendientes</p>
          </div>
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-600">
              {requests.filter(r => r.status === 'in_review').length}
            </p>
            <p className="text-sm text-blue-700">En Revisión</p>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-600">
              {requests.filter(r => r.status === 'approved').length}
            </p>
            <p className="text-sm text-green-700">Aprobadas</p>
          </div>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
            <p className="text-2xl font-bold text-red-600">
              {requests.filter(r => r.status === 'rejected').length}
            </p>
            <p className="text-sm text-red-700">Rechazadas</p>
          </div>
        </div>

        <ComponentCard title={`Historial (${requests.length})`}>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              No tienes solicitudes registradas
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 border border-border-light dark:border-border-dark rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                  onClick={() => setSelectedRequest(request)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <p className="font-medium">{request.subject}</p>
                      <p className="text-sm text-text-secondary">{request.typeName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge color={statusColors[request.status]} size="sm">
                        {statusLabels[request.status]}
                      </Badge>
                      <span className="text-xs text-text-secondary">
                        {new Date(request.createdAt).toLocaleDateString('es-VE')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ComponentCard>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="md">
        <ModalHeader>Nueva Solicitud</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tipo de Solicitud *</label>
              <select
                value={newRequest.typeId}
                onChange={(e) => setNewRequest({ ...newRequest, typeId: e.target.value })}
                className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800"
              >
                <option value="">Seleccionar...</option>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Asunto *</label>
              <input
                type="text"
                value={newRequest.subject}
                onChange={(e) => setNewRequest({ ...newRequest, subject: e.target.value })}
                className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800"
                placeholder="Breve descripción del motivo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Descripción *</label>
              <textarea
                value={newRequest.description}
                onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800"
                rows={4}
                placeholder="Detalla tu solicitud..."
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Enviando..." : "Enviar Solicitud"}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={!!selectedRequest} onClose={() => setSelectedRequest(null)} size="md">
        <ModalHeader>Detalle de Solicitud</ModalHeader>
        <ModalBody>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge color={statusColors[selectedRequest.status]}>
                  {statusLabels[selectedRequest.status]}
                </Badge>
                <span className="text-sm text-text-secondary">
                  {new Date(selectedRequest.createdAt).toLocaleDateString('es-VE')}
                </span>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Tipo</p>
                <p className="font-medium">{selectedRequest.typeName}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Asunto</p>
                <p className="font-medium">{selectedRequest.subject}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Descripción</p>
                <p className="whitespace-pre-wrap">{selectedRequest.description}</p>
              </div>
              {selectedRequest.response && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm font-medium text-text-secondary mb-1">Respuesta de Coordinación</p>
                  <p className="whitespace-pre-wrap">{selectedRequest.response}</p>
                  {selectedRequest.processedAt && (
                    <p className="text-xs text-text-secondary mt-2">
                      Respondido el {new Date(selectedRequest.processedAt).toLocaleDateString('es-VE')}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setSelectedRequest(null)}>
            Cerrar
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
