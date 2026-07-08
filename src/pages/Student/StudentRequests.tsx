import { useEffect, useState, useMemo, useCallback } from "react";
import Button from "../../components/ui/button/Button";
import { useToast } from "../../context/toast";
import { TOAST } from "../../components/ui/dialog/DialogConfig";
import apiClient from "../../api/apiClient";
import { useStudentRequests } from "../../features/student-requests/hooks/useStudentRequests";
import { connectToNotificationStream } from "../../features/notifications/services/notificationService";
import RequestsStatsCards from "../../features/student-requests/components/RequestsStatsCards";
import StudentRequestsList from "../../features/student-requests/components/StudentRequestsList";
import RequestDetailModal from "../../features/student-requests/components/RequestDetailModal";
import NewRequestModal from "../../features/student-requests/components/NewRequestModal";
import RequestTimeline from "../../features/student-requests/components/RequestTimeline";
import type {
  StudentRequest,
  ReassignmentOption,
  CreateRequestPayload
} from "../../features/student-requests/types";
import type { NewRequestFormData, ReassignmentFormData } from "../../features/student-requests/components/NewRequestModal";
import { STATUS_COLORS, STATUS_LABELS } from "../../features/student-requests/utils/requestUtils";
import Badge from "../../components/ui/badge/Badge";
import { AnimatePresence, motion } from "framer-motion";
import { Pagination } from "../../components/ui/table/Pagination";
import { ChevronDown, ChevronUp, X } from "lucide-react";

const ITEMS_PER_PAGE = 15;

export default function StudentRequests() {
  const { addToast } = useToast();
  const {
    requests,
    requestTypes,
    loading,
    fetchRequests,
    fetchRequestTypes,
    createRequest
  } = useStudentRequests();

  const [tutors, setTutors] = useState<ReassignmentOption[]>([]);
  const [institutions, setInstitutions] = useState<ReassignmentOption[]>([]);
  const [careers, setCareers] = useState<ReassignmentOption[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<StudentRequest | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);

  // ── Filters state ──────────────────────────────────────────────
  const [filterType, setFilterType] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const stats = useMemo(() => ({
    pending: requests.filter(r => r.status === 'pending').length,
    in_review: requests.filter(r => r.status === 'in_review').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length
  }), [requests]);

  // ── Client-side filters ────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = requests;
    if (filterType) result = result.filter(r => r.typeId === parseInt(filterType));
    if (filterStatus) result = result.filter(r => r.status === filterStatus);
    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter(r => new Date(r.createdAt) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999); // end of day
      result = result.filter(r => new Date(r.createdAt) <= to);
    }
    return result;
  }, [requests, filterType, filterStatus, dateFrom, dateTo]);

  const hasActiveFilters = filterType !== "" || filterStatus !== "" || dateFrom !== "" || dateTo !== "";

  // ── Client-side pagination ─────────────────────────────────────
  const totalFilteredPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginatedData = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, page]);

  // Resetear página cuando cambian los filtros
  useEffect(() => { setPage(1); }, [filterType, filterStatus, dateFrom, dateTo]);

  // ── Inline expand toggle ───────────────────────────────────────
  const handleToggleExpand = useCallback((id: number) => {
    setExpandedId(prev => prev === id ? null : id);
  }, []);

  useEffect(() => {
    fetchRequests();
    fetchRequestTypes();
    loadOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refrescar al volver a la página (si el admin cambió el estado mientras tanto)
  useEffect(() => {
    const handleFocus = () => fetchRequests();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchRequests]);

  // Auto-refresh en tiempo real via SSE
  useEffect(() => {
    const disconnect = connectToNotificationStream(() => {
      fetchRequests();
    });
    return disconnect;
  }, [fetchRequests]);

  const loadOptions = async () => {
    try {
      const res = await apiClient.get("/student/available-options");
      const { tutors, institutions, careers } = res.data?.data || {};

      setTutors((tutors || []).map((t: any) => ({
        value: String(t.tutorId),
        label: `${t.name} ${t.surname}`
      })));

      setInstitutions((institutions || []).map((i: any) => ({
        value: String(i.institutionId),
        label: i.institutionName
      })));

      setCareers((careers || []).map((c: any) => ({
        value: String(c.careerId),
        label: c.careerName
      })));
    } catch (err) {
      console.error("[StudentRequests] Error loading options:", err);
      addToast(TOAST.loadError());
    }
  };

  const handleSubmit = async (form: NewRequestFormData, reassignment: ReassignmentFormData) => {
    if (!form.typeId || !form.subject || !form.description) {
      addToast({ variant: "error", title: "Campos requeridos", message: "Todos los campos son obligatorios." });
      return;
    }

    try {
      setSubmitting(true);

      const payload: CreateRequestPayload = {
        typeId: parseInt(form.typeId),
        subject: form.subject,
        description: form.description
      };

      const selectedType = requestTypes.find(t => t.id === parseInt(form.typeId));
      const hasReassignment = selectedType?.isReassignment || selectedType?.category === 'REASSIGNMENT';

      if (hasReassignment) {
        payload.reassignmentData = {
          reason: reassignment.reason,
          ...(reassignment.newTutorId && { newTutorId: parseInt(reassignment.newTutorId) }),
          ...(reassignment.newInstitutionId && { newInstitutionId: parseInt(reassignment.newInstitutionId) }),
          ...(reassignment.newCareerId && { newCareerId: parseInt(reassignment.newCareerId) })
        };
      }

      const success = await createRequest(payload);
      if (success) {
        setShowModal(false);
      }
    } catch (err) {
      console.error("[StudentRequests] Error creating:", err);
      addToast(TOAST.createError('solicitud'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <RequestsStatsCards stats={stats} />

        {/* ── Filters ──────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-text-primary"
            aria-label="Filtrar por tipo"
          >
            <option value="">Todos los tipos</option>
            {requestTypes.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-text-primary"
            aria-label="Filtrar por estado"
          >
            <option value="">Todos los estados</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-text-primary"
            aria-label="Desde fecha"
            title="Desde"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-text-primary"
            aria-label="Hasta fecha"
            title="Hasta"
          />

          {hasActiveFilters && (
            <button
              onClick={() => { setFilterType(""); setFilterStatus(""); setDateFrom(""); setDateTo(""); }}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              <X className="w-4 h-4" />
              Limpiar filtros
            </button>
          )}

          <span className="text-xs text-text-secondary ml-auto">
            {filtered.length}/{requests.length} solicitudes
          </span>
        </div>

        {/* ── Request List with inline expand ──────────────────── */}
        <div className="space-y-2">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse h-20 bg-gray-200 dark:bg-gray-700 rounded" />
              ))}
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              {hasActiveFilters ? "No hay solicitudes que coincidan con los filtros" : "No tienes solicitudes registradas"}
            </div>
          ) : (
            paginatedData.map((request) => {
              const isExpanded = expandedId === request.id;
              return (
                <div key={request.id} className="border border-border-light dark:border-border-dark rounded-lg overflow-hidden">
                  {/* Row header — clickable */}
                  <button
                    onClick={() => handleToggleExpand(request.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
                      <p className="font-medium truncate">{request.subject}</p>
                      <p className="text-sm text-text-secondary shrink-0">{request.typeName}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <Badge color={STATUS_COLORS[request.status]} size="sm">
                        {STATUS_LABELS[request.status]}
                      </Badge>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-text-secondary" /> : <ChevronDown className="w-4 h-4 text-text-secondary" />}
                    </div>
                  </button>

                  {/* Expanded content */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        key="expanded"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 border-t border-border-light/50 dark:border-white/5">
                          <div className="pt-4 space-y-3">
                            <p className="text-sm text-text-secondary whitespace-pre-wrap">
                              {request.description || "Sin descripción"}
                            </p>

                            {request.response && (
                              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <p className="text-xs font-medium text-text-secondary mb-1">
                                  Respuesta de Coordinación
                                </p>
                                <p className="text-sm whitespace-pre-wrap">{request.response}</p>
                              </div>
                            )}

                            {/* Timeline */}
                            <RequestTimeline request={request} />

                            <div className="flex justify-end">
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedRequest(request); }}
                                className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400"
                              >
                                Ver detalle completo
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>

        {/* ── Pagination ──────────────────────────────────────────── */}
        {filtered.length > ITEMS_PER_PAGE && (
          <Pagination
            currentPage={page}
            totalPages={totalFilteredPages}
            totalItems={filtered.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setPage}
          />
        )}

        {/* New request button */}
        <div className="flex justify-end">
          <Button variant="primary" onClick={() => setShowModal(true)}>
            Nueva Solicitud
          </Button>
        </div>
      </div>

      <NewRequestModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        requestTypes={requestTypes}
        tutors={tutors}
        institutions={institutions}
        careers={careers}
        submitting={submitting}
        onSubmit={handleSubmit}
      />

      <RequestDetailModal
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
      />
    </>
  );
}
