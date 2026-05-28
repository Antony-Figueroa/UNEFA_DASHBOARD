import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import toast from "react-hot-toast";
import { getTutors } from "../../features/tutors/services/tutorsService";
import { getInstitutions } from "../../features/institutions/services/institutionsService";
import { getCareers } from "../../features/careers/services/careersService";

import { useAdminRequests } from "../../features/student-requests/hooks/useAdminRequests";
import RequestsStatsCards from "../../features/student-requests/components/RequestsStatsCards";
import AdminRequestsTable from "../../features/student-requests/components/AdminRequestsTable";
import RequestAttentionModal from "../../features/student-requests/components/RequestAttentionModal";
import type {
  AdminRequest,
  ReassignmentOption,
  RequestStatus,
  UpdateStatusPayload
} from "../../features/student-requests/types";
import type { AttentionFormData } from "../../features/student-requests/components/RequestAttentionModal";

export default function AdminRequests() {
  const {
    requests,
    stats,
    loading,
    saving,
    fetchRequests,
    updateRequestStatus
  } = useAdminRequests();

  const [tutors, setTutors] = useState<ReassignmentOption[]>([]);
  const [institutions, setInstitutions] = useState<ReassignmentOption[]>([]);
  const [careers, setCareers] = useState<ReassignmentOption[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<AdminRequest | null>(null);

  useEffect(() => {
    loadOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const params = statusFilter !== "all" ? { status: statusFilter as RequestStatus } : undefined;
    fetchRequests(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const loadOptions = async () => {
    try {
      const [tutorsData, institutionsData, careersData] = await Promise.all([
        getTutors(),
        getInstitutions(),
        getCareers()
      ]);

      setTutors((tutorsData as any[] || []).map(t => ({
        value: String(t.tutorId),
        label: `${t.name} ${t.surname}`
      })));

      const instList: any[] = (institutionsData as any)?.data || (institutionsData as any[]) || [];
      setInstitutions(instList.map((i: any) => ({
        value: String(i.institutionId),
        label: i.institutionName
      })));

      const careerList: any[] = (careersData as any)?.data || (careersData as any[]) || [];
      setCareers(careerList.map((c: any) => ({
        value: String(c.careerId),
        label: c.careerName
      })));
    } catch (err) {
      console.error("[AdminRequests] Error loading options:", err);
    }
  };

  const handleUpdate = async (data: AttentionFormData) => {
    if (!selectedRequest) return;

    try {
      const payload: UpdateStatusPayload = {
        status: data.newStatus,
        response: data.response || undefined
      };

      // Determinar si es reasignación
      const isReassignment = selectedRequest.isReassignment === true ||
        selectedRequest.typeName.includes('Tutor') ||
        selectedRequest.typeName.includes('Empresa') ||
        selectedRequest.typeName.includes('Carrera');

      // Si se aprueba una reasignación, incluir los datos
      if (isReassignment && data.newStatus === 'approved') {
        // Merge: datos originales + override del admin
        const merged = {
          ...(selectedRequest.reassignmentData || {}),
          ...data.reassignmentOverride
        };

        // Filtrar undefineds y dejar solo lo que tenga valor
        const cleanData: Record<string, number | string> = {};
        Object.entries(merged).forEach(([key, val]) => {
          if (val !== undefined && val !== null) {
            cleanData[key] = val;
          }
        });

        if (Object.keys(cleanData).length > 0) {
          payload.reassignmentData = cleanData as UpdateStatusPayload['reassignmentData'];
        }
      }

      const success = await updateRequestStatus(String(selectedRequest.id), payload);
      if (success) {
        setSelectedRequest(null);
      }
    } catch (err) {
      console.error("[AdminRequests] Error updating:", err);
      toast.error("Error al actualizar la solicitud");
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

        <RequestsStatsCards
          stats={{ ...stats }}
          showTotal
          activeFilter={statusFilter}
          onFilterChange={setStatusFilter}
        />

        <ComponentCard title={`Solicitudes (${requests.length})`}>
          <AdminRequestsTable
            requests={requests}
            loading={loading}
            onAttend={setSelectedRequest}
          />
        </ComponentCard>
      </div>

      <RequestAttentionModal
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        tutors={tutors}
        institutions={institutions}
        careers={careers}
        saving={saving}
        onSubmit={handleUpdate}
      />
    </>
  );
}
