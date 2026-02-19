import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import adminRequestsService from "../../features/student/services/adminRequestsService";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../components/ui/modal";
import toast from "react-hot-toast";

interface AdminRequest {
  id: number;
  studentId: number;
  studentCi: string;
  studentName: string;
  studentEmail: string;
  typeId: number;
  typeName: string;
  subject: string;
  description: string;
  status: string;
  response: string | null;
  processedByName: string | null;
  createdAt: string;
  processedAt: string | null;
}

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

export default function AdminRequests() {
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, in_review: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<AdminRequest | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [response, setResponse] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = statusFilter !== "all" ? { status: statusFilter } : undefined;
      const result = await adminRequestsService.getAll(params);
      setRequests(result.data);
      setStats(result.stats);
    } catch (err) {
      console.error("[AdminRequests] Error:", err);
      toast.error("Error al cargar solicitudes");
    } finally {
      setLoading(false);
    }
  };

  const openRequestModal = (request: AdminRequest) => {
    setSelectedRequest(request);
    setNewStatus(request.status);
    setResponse(request.response || "");
  };

  const handleUpdate = async () => {
    if (!selectedRequest) return;

    try {
      setSaving(true);
      await adminRequestsService.updateStatus(selectedRequest.id.toString(), {
        status: newStatus,
        response: response || undefined
      });
      toast.success("Solicitud actualizada");
      setSelectedRequest(null);
      fetchRequests();
    } catch (err) {
      console.error("[AdminRequests] Error updating:", err);
      toast.error("Error al actualizar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Solicitudes | SIGP - UNEFA"
        description="Bandeja de solicitudes de estudiantes"
      />

      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-text-emphasis dark:text-text-emphasis">
            Bandeja de Solicitudes
          </h1>
          <p className="text-text-secondary dark:text-text-tertiary mt-1">
            Gestiona las solicitudes enviadas por los estudiantes
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div 
            className={`p-4 rounded-lg text-center cursor-pointer transition-colors ${statusFilter === 'all' ? 'bg-brand-50 dark:bg-brand-900/20 ring-2 ring-brand-500' : 'bg-gray-50 dark:bg-gray-800'}`}
            onClick={() => setStatusFilter('all')}
          >
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-text-secondary">Total</p>
          </div>
          <div 
            className={`p-4 rounded-lg text-center cursor-pointer transition-colors ${statusFilter === 'pending' ? 'bg-yellow-50 dark:bg-yellow-900/20 ring-2 ring-yellow-500' : 'bg-gray-50 dark:bg-gray-800'}`}
            onClick={() => setStatusFilter('pending')}
          >
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-sm text-text-secondary">Pendientes</p>
          </div>
          <div 
            className={`p-4 rounded-lg text-center cursor-pointer transition-colors ${statusFilter === 'in_review' ? 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500' : 'bg-gray-50 dark:bg-gray-800'}`}
            onClick={() => setStatusFilter('in_review')}
          >
            <p className="text-2xl font-bold text-blue-600">{stats.in_review}</p>
            <p className="text-sm text-text-secondary">En Revisión</p>
          </div>
          <div 
            className={`p-4 rounded-lg text-center cursor-pointer transition-colors ${statusFilter === 'approved' ? 'bg-green-50 dark:bg-green-900/20 ring-2 ring-green-500' : 'bg-gray-50 dark:bg-gray-800'}`}
            onClick={() => setStatusFilter('approved')}
          >
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            <p className="text-sm text-text-secondary">Aprobadas</p>
          </div>
          <div 
            className={`p-4 rounded-lg text-center cursor-pointer transition-colors ${statusFilter === 'rejected' ? 'bg-red-50 dark:bg-red-900/20 ring-2 ring-red-500' : 'bg-gray-50 dark:bg-gray-800'}`}
            onClick={() => setStatusFilter('rejected')}
          >
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            <p className="text-sm text-text-secondary">Rechazadas</p>
          </div>
        </div>

        <ComponentCard title={`Solicitudes (${requests.length})`}>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              No hay solicitudes con este filtro
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Estudiante</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Asunto</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                  {requests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium">{request.studentName}</p>
                          <p className="text-sm text-text-secondary">{request.studentCi}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-text-secondary">{request.typeName}</td>
                      <td className="px-4 py-4">
                        <p className="max-w-xs truncate">{request.subject}</p>
                      </td>
                      <td className="px-4 py-4 text-text-secondary text-sm">
                        {new Date(request.createdAt).toLocaleDateString('es-VE')}
                      </td>
                      <td className="px-4 py-4">
                        <Badge color={statusColors[request.status]} size="sm">
                          {statusLabels[request.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <Button size="sm" variant="outline" onClick={() => openRequestModal(request)}>
                          Atender
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ComponentCard>
      </div>

      <Modal isOpen={!!selectedRequest} onClose={() => setSelectedRequest(null)} size="lg">
        <ModalHeader>Atender Solicitud</ModalHeader>
        <ModalBody>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-text-secondary">Estudiante</p>
                  <p className="font-medium">{selectedRequest.studentName}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Cédula</p>
                  <p className="font-medium">{selectedRequest.studentCi}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Email</p>
                  <p className="font-medium">{selectedRequest.studentEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Tipo</p>
                  <p className="font-medium">{selectedRequest.typeName}</p>
                </div>
              </div>

              <div className="border-t border-border-light dark:border-border-dark pt-4">
                <p className="text-sm text-text-secondary mb-1">Asunto</p>
                <p className="font-medium">{selectedRequest.subject}</p>
              </div>

              <div>
                <p className="text-sm text-text-secondary mb-1">Descripción</p>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="whitespace-pre-wrap">{selectedRequest.description}</p>
                </div>
              </div>

              <div className="border-t border-border-light dark:border-border-dark pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Estado</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800"
                    >
                      <option value="pending">Pendiente</option>
                      <option value="in_review">En Revisión</option>
                      <option value="approved">Aprobada</option>
                      <option value="rejected">Rechazada</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Respuesta al Estudiante</label>
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800"
                  rows={4}
                  placeholder="Escribe la respuesta o comentarios..."
                />
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setSelectedRequest(null)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleUpdate} disabled={saving}>
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
