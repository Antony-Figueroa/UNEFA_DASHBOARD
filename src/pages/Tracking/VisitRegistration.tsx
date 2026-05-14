import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import { ArrowLeftIcon, EditIcon, TrashIcon, EyeIcon } from "../../icons/actions";
import { PlusIcon } from "../../icons";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { EmptyState } from "../../components/ui/table/EmptyState";
import { useVisits } from "../../features/visits/hooks/useVisits";
import { Visit, CreateVisitPayload, UpdateVisitPayload, VISIT_TYPES } from "../../features/visits/types";
import VisitModal from "../../features/visits/components/VisitModal";
import UnifiedDialog from "../../components/ui/dialog/UnifiedDialog";
import { getTrackingById, TrackingDetailDTO } from "../../features/tracking/services/trackingService";

export default function VisitRegistration() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const {
    visits,
    loading,
    stats,
    fetchVisitsByPractice,
    createVisit,
    updateVisit,
    deleteVisit,
    fetchStats
  } = useVisits();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; visitId: number | null }>({
    isOpen: false,
    visitId: null
  });
  const [viewDialog, setViewDialog] = useState<{ isOpen: boolean; visit: Visit | null }>({
    isOpen: false,
    visit: null
  });
  const [practiceInfo, setPracticeInfo] = useState<TrackingDetailDTO | null>(null);
  const [loadingPractice, setLoadingPractice] = useState(false);
  const [statsKey, setStatsKey] = useState(0);

  useEffect(() => {
    if (id) {
      const practiceId = parseInt(id);
      
      // Fetch tracking info immediately (independent of visits)
      setLoadingPractice(true);
      getTrackingById(id)
        .then(data => {
          setPracticeInfo(data);
        })
        .catch(err => {
          console.error('[VisitRegistration] Error fetching tracking info:', err);
        })
        .finally(() => {
          setLoadingPractice(false);
        });
      
      // Fetch visits and stats
      fetchVisitsByPractice(practiceId);
      fetchStats({ practiceId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    // Update stats key when stats change
    if (stats) {
      setStatsKey(prev => prev + 1);
    }
  }, [stats]);

  const handleOpenModal = (visit?: Visit) => {
    setSelectedVisit(visit || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedVisit(null);
  };

  const handleSubmit = async (data: CreateVisitPayload | UpdateVisitPayload): Promise<boolean> => {
    if (selectedVisit) {
      const result = await updateVisit(selectedVisit.visitId, data as UpdateVisitPayload);
      return result !== null;
    } else {
      const result = await createVisit({
        ...data as CreateVisitPayload,
        practiceId: parseInt(id!),
        tutorId: 1
      });
      return result !== null;
    }
  };

  const handleDelete = async () => {
    if (deleteDialog.visitId) {
      const success = await deleteVisit(deleteDialog.visitId);
      if (success) {
        setDeleteDialog({ isOpen: false, visitId: null });
      }
    }
  };

  const getVisitTypeBadge = (type: string) => {
    const variants: Record<string, 'primary' | 'success' | 'warning'> = {
      PRESENCIAL: 'success',
      VIRTUAL: 'primary',
      TELEFONICA: 'warning'
    };
    return variants[type] || 'primary';
  };

  const getVisitTypeLabel = (type: string) => {
    return VISIT_TYPES.find(t => t.value === type)?.label || type;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-VE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <PageMeta
        title="Registro de Visitas"
        description="Registro detallado de visitas de seguimiento"
      />
      <PageBreadcrumb pageTitle="Registro de Visitas" />

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Button 
          variant="outline" 
          onClick={() => navigate('/tracking')}
          className="flex items-center gap-2"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Volver al Seguimiento
        </Button>

        <Button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2"
          startIcon={<PlusIcon />}
        >
          Nueva Visita
        </Button>
      </div>

      {loadingPractice ? (
        <ComponentCard title="Información de la Práctica" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </ComponentCard>
      ) : practiceInfo ? (
        <ComponentCard title="Información de la Práctica" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-1">Estudiante</p>
              <p className="text-lg font-semibold text-text-primary dark:text-text-emphasis">{practiceInfo.studentName}</p>
              <p className="text-sm text-text-secondary">{practiceInfo.studentIdNumber}</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
              <p className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-1">Institución</p>
              <p className="text-lg font-semibold text-text-primary dark:text-text-emphasis">{practiceInfo.institutionName}</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
              <p className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-1">Tutor Académico</p>
              <p className="text-lg font-semibold text-text-primary dark:text-text-emphasis">{practiceInfo.tutorName}</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
              <p className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-1">Total Horas</p>
              <p className="text-lg font-semibold text-text-primary dark:text-text-emphasis">{stats?.totalHours || 0} hrs</p>
            </div>
          </div>
        </ComponentCard>
      ) : null}

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6" key={`stats-${statsKey}`}>
          <ComponentCard title="Total Visitas">
            <div className="text-center py-2">
              <p className="text-3xl font-bold text-brand-500">{stats.totalVisits}</p>
              <p className="text-sm text-text-secondary">Visitas realizadas</p>
            </div>
          </ComponentCard>
          <ComponentCard title="Horas Registradas">
            <div className="text-center py-2">
              <p className="text-3xl font-bold text-success-500">{stats.totalHours.toFixed(1)}</p>
              <p className="text-sm text-text-secondary">Horas acumuladas</p>
            </div>
          </ComponentCard>
          <ComponentCard title="Tipos de Visita">
            <div className="text-center py-2">
              <p className="text-3xl font-bold text-warning-500">{Object.keys(stats.visitsByType).length}</p>
              <p className="text-sm text-text-secondary">Modalidades usadas</p>
            </div>
          </ComponentCard>
        </div>
      )}

      <ComponentCard title="Historial de Visitas">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        ) : visits.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader>Fecha</TableCell>
                  <TableCell isHeader>Tipo</TableCell>
                  <TableCell isHeader>Horas</TableCell>
                  <TableCell isHeader>Actividades</TableCell>
                  <TableCell isHeader>Acciones</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visits.map((visit) => (
                  <TableRow key={visit.visitId}>
                    <TableCell className="whitespace-nowrap">
                      <span className="font-medium text-text-primary dark:text-text-emphasis">
                        {formatDate(visit.visitDate)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge color={getVisitTypeBadge(visit.visitType)} variant="light">
                        {getVisitTypeLabel(visit.visitType)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-brand-500">{visit.hoursWorked} hrs</span>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-text-secondary dark:text-text-tertiary max-w-xs truncate">
                        {visit.activitiesPerformed}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setViewDialog({ isOpen: true, visit })}
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenModal(visit)}
                        >
                          <EditIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeleteDialog({ isOpen: true, visitId: visit.visitId })}
                          className="text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            title="No hay visitas registradas"
            description="Comienza registrando la primera visita de seguimiento"
            action={<Button onClick={() => handleOpenModal()}>Registrar Visita</Button>}
          />
        )}
      </ComponentCard>

      <VisitModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        visit={selectedVisit}
        practiceId={parseInt(id || '0')}
        tutorId={1}
        loading={loading}
        mode="edit"
        periodStartDate={practiceInfo?.periodStartDate ? new Date(practiceInfo.periodStartDate) : undefined}
        periodEndDate={practiceInfo?.periodEndDate ? new Date(practiceInfo.periodEndDate) : undefined}
        studentName={practiceInfo?.studentName}
      />

      <UnifiedDialog
        isOpen={viewDialog.isOpen}
        onClose={() => setViewDialog({ isOpen: false, visit: null })}
        title="Detalle de la Visita"
        message={
          viewDialog.visit ? (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold uppercase text-text-tertiary">Fecha</p>
                  <p className="text-sm font-medium">{formatDate(viewDialog.visit.visitDate)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-text-tertiary">Tipo</p>
                  <Badge color={getVisitTypeBadge(viewDialog.visit.visitType)} variant="light">
                    {getVisitTypeLabel(viewDialog.visit.visitType)}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-text-tertiary">Horas Trabajadas</p>
                  <p className="text-sm font-medium">{viewDialog.visit.hoursWorked} horas</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-text-tertiary">Tutor</p>
                  <p className="text-sm font-medium">{viewDialog.visit.tutorName}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-text-tertiary mb-1">Actividades Realizadas</p>
                <p className="text-sm text-text-secondary">{viewDialog.visit.activitiesPerformed}</p>
              </div>
              {viewDialog.visit.observations && (
                <div>
                  <p className="text-xs font-bold uppercase text-text-tertiary mb-1">Observaciones</p>
                  <p className="text-sm text-text-secondary">{viewDialog.visit.observations}</p>
                </div>
              )}
              {viewDialog.visit.recommendations && (
                <div>
                  <p className="text-xs font-bold uppercase text-text-tertiary mb-1">Recomendaciones</p>
                  <p className="text-sm text-text-secondary">{viewDialog.visit.recommendations}</p>
                </div>
              )}
            </div>
          ) : null
        }
        confirmLabel="Cerrar"
        variant="info"
        onConfirm={() => setViewDialog({ isOpen: false, visit: null })}
      />

      <UnifiedDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, visitId: null })}
        title="Eliminar Visita"
        message="¿Está seguro de eliminar esta visita? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        variant="error"
        onConfirm={handleDelete}
      />
    </>
  );
}
