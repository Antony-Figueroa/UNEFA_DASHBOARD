import { useEffect, useState, useMemo } from "react";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import toast from "react-hot-toast";
import { getTutors } from "../../features/tutors/services/tutorsService";
import { getInstitutions } from "../../features/institutions/services/institutionsService";
import { getCareers } from "../../features/careers/services/careersService";

import { useStudentRequests } from "../../features/student-requests/hooks/useStudentRequests";
import RequestsStatsCards from "../../features/student-requests/components/RequestsStatsCards";
import StudentRequestsList from "../../features/student-requests/components/StudentRequestsList";
import RequestDetailModal from "../../features/student-requests/components/RequestDetailModal";
import NewRequestModal from "../../features/student-requests/components/NewRequestModal";
import type {
  StudentRequest,
  ReassignmentOption,
  CreateRequestPayload
} from "../../features/student-requests/types";
import type { NewRequestFormData, ReassignmentFormData } from "../../features/student-requests/components/NewRequestModal";

export default function StudentRequests() {
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
  const [submitting, setSubmitting] = useState(false);

  const stats = useMemo(() => ({
    pending: requests.filter(r => r.status === 'pending').length,
    in_review: requests.filter(r => r.status === 'in_review').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length
  }), [requests]);

  useEffect(() => {
    fetchRequests();
    fetchRequestTypes();
    loadOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      const instList = (institutionsData as any)?.data || (institutionsData as any[]) || [];
      setInstitutions(instList.map((i: any) => ({
        value: String(i.institutionId),
        label: i.institutionName
      })));

      const careerList = (careersData as any)?.data || (careersData as any[]) || [];
      setCareers(careerList.map((c: any) => ({
        value: String(c.careerId),
        label: c.careerName
      })));
    } catch (err) {
      console.error("[StudentRequests] Error loading options:", err);
      toast.error("Error al cargar opciones");
    }
  };

  const handleSubmit = async (form: NewRequestFormData, reassignment: ReassignmentFormData) => {
    if (!form.typeId || !form.subject || !form.description) {
      toast.error("Todos los campos son requeridos");
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

        <RequestsStatsCards stats={stats} />

        <ComponentCard title={`Historial (${requests.length})`}>
          <StudentRequestsList
            requests={requests}
            loading={loading}
            onSelect={setSelectedRequest}
          />
        </ComponentCard>
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
