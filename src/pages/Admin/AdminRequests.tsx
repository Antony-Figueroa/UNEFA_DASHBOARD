import { useEffect, useState, useCallback } from "react";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import { Pagination } from "../../components/ui/table/Pagination";
import toast from "react-hot-toast";
import { getTutors } from "../../features/tutors/services/tutorsService";
import { getInstitutions } from "../../features/institutions/services/institutionsService";
import { getCareers } from "../../features/careers/services/careersService";
import { connectToNotificationStream } from "../../features/notifications/services/notificationService";

import { useAdminRequests } from "../../features/student-requests/hooks/useAdminRequests";
import RequestsStatsCards from "../../features/student-requests/components/RequestsStatsCards";
import AdminRequestsTable from "../../features/student-requests/components/AdminRequestsTable";
import RequestAttentionModal from "../../features/student-requests/components/RequestAttentionModal";
import { adminRequestsService } from "../../features/student-requests/services/adminRequestsService";
import type {
  AdminRequest,
  RequestType,
  ReassignmentOption,
  RequestStatus,
  UpdateStatusPayload
} from "../../features/student-requests/types";
import type { AttentionFormData } from "../../features/student-requests/components/RequestAttentionModal";

const ITEMS_PER_PAGE = 20;

export default function AdminRequests() {
  const {
    requests,
    stats,
    loading,
    saving,
    pagination,
    fetchRequests,
    updateRequestStatus
  } = useAdminRequests();

  const [tutors, setTutors] = useState<ReassignmentOption[]>([]);
  const [institutions, setInstitutions] = useState<ReassignmentOption[]>([]);
  const [careers, setCareers] = useState<ReassignmentOption[]>([]);
  const [requestTypes, setRequestTypes] = useState<RequestType[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<AdminRequest | null>(null);

  const buildFilters = useCallback((p?: number) => ({
    ...(statusFilter !== "all" ? { status: statusFilter as RequestStatus } : {}),
    ...(typeFilter ? { typeId: typeFilter } : {}),
    page: p ?? page,
    limit: ITEMS_PER_PAGE
  }), [statusFilter, typeFilter, page]);

  const refreshWithFilter = useCallback(() => {
    fetchRequests(buildFilters());
  }, [fetchRequests, buildFilters]);

  useEffect(() => {
    loadOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    refreshWithFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter, page]);

  // SSE auto-refresh — vuelve a la página actual
  useEffect(() => {
    const disconnect = connectToNotificationStream(() => {
      fetchRequests(buildFilters());
    });
    return disconnect;
  }, [fetchRequests, buildFilters]);

  // Refrescar al volver a la página
  useEffect(() => {
    const handleFocus = () => fetchRequests(buildFilters());
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchRequests, buildFilters]);

  const loadOptions = async () => {
    try {
      const [tutorsData, institutionsData, careersData, typesData] = await Promise.all([
        getTutors(),
        getInstitutions(),
        getCareers(),
        adminRequestsService.getTypes()
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

      setRequestTypes(typesData);
    } catch (err) {
      console.error("[AdminRequests] Error loading options:", err);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleUpdate = async (data: AttentionFormData) => {
    if (!selectedRequest) return;

    try {
      const payload: UpdateStatusPayload = {
        status: data.newStatus,
        response: data.response || undefined
      };

      const isReassignment = selectedRequest.isReassignment === true ||
        selectedRequest.typeName.includes('Tutor') ||
        selectedRequest.typeName.includes('Empresa') ||
        selectedRequest.typeName.includes('Carrera');

      if (isReassignment && data.newStatus === 'approved') {
        const merged = {
          ...(selectedRequest.reassignmentData || {}),
          ...data.reassignmentOverride
        };

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
        refreshWithFilter();
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

        {/* ── Filtros ── */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-text-primary"
            aria-label="Filtrar por tipo"
          >
            <option value="">Todos los tipos</option>
            {requestTypes.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          {pagination.total > 0 && (
            <span className="text-xs text-text-secondary">
              {pagination.total} solicitud{pagination.total !== 1 ? 'es' : ''}
            </span>
          )}
        </div>

        <ComponentCard title={`Solicitudes`}>
          <AdminRequestsTable
            requests={requests}
            loading={loading}
            onAttend={setSelectedRequest}
          />
          {!loading && pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={handlePageChange}
            />
          )}
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
