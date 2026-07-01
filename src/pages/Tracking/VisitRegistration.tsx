import { useState, useEffect, useMemo, useCallback } from 'react';
import { Tabs } from "../../components/ui/tabs/Tabs";
import { useTabs } from "../../hooks/useTabs";
import { useParams, useNavigate } from 'react-router';
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import { AsyncActionButton } from "../../components/common/AsyncActionButton";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import { EditIcon, TrashIcon, EyeIcon, RefreshIcon, PlusCircleIcon } from "../../icons/actions";
import { Table, TableBody, TableCell, TableHeader, TableRow, Pagination } from "../../components/ui/table";
import { EmptyState } from "../../components/ui/table/EmptyState";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../components/ui/modal";
import UnifiedDialog from "../../components/ui/dialog/UnifiedDialog";
import { useVisits } from "../../features/visits/hooks/useVisits";
import { Visit, CreateVisitPayload, UpdateVisitPayload, VISIT_TYPES, LEGACY_VISIT_CASES } from "../../features/visits/types";
import VisitModal from "../../features/visits/components/VisitModal";
import { getTrackingById, TrackingDetailDTO } from "../../features/tracking/services/trackingService";
import { useLists } from "../../features/lists/hooks/useLists";

/** Parsea una fecha YYYY-MM-DD de la API como fecha LOCAL (no UTC) */
const parseApiDate = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split('T')[0].split('-').map(Number);
  return new Date(y, m - 1, d);
};

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
    restoreVisit,
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
  const [practiceError, setPracticeError] = useState<string | null>(null);
  const tabsState = useTabs({ defaultTab: 'active' });
  const [statsKey, setStatsKey] = useState(0);
  const [restoreDialog, setRestoreDialog] = useState<{ isOpen: boolean; visitId: number | null }>({
    isOpen: false,
    visitId: null
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { fetchMultipleLists } = useLists();
  const [visitTypeLabelMap, setVisitTypeLabelMap] = useState<Record<string, string>>({});
  const [visitCaseLabelMap, setVisitCaseLabelMap] = useState<Record<string, string>>({});

  // Filtrar visitas según la pestaña activa (mismo patrón que Periods)
  const tableData = useMemo(() => visits
    .filter(v => v.status === (tabsState.activeTab === 'active')),
  [visits, tabsState.activeTab]);

  // Paginación cliente-side
  const totalPages = useMemo(() => Math.max(1, Math.ceil(tableData.length / itemsPerPage)), [tableData.length, itemsPerPage]);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return tableData.slice(start, start + itemsPerPage);
  }, [tableData, currentPage, itemsPerPage]);

  // Resetear a página 1 cuando cambia el tab
  useEffect(() => {
    setCurrentPage(1);
  }, [tabsState.activeTab]);

  const fetchPracticeInfo = useCallback(async () => {
    if (!id) return;
    setLoadingPractice(true);
    setPracticeError(null);
    try {
      const data = await getTrackingById(id);
      setPracticeInfo(data);
      setPracticeError(null);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Error al cargar información de la práctica';
      console.error('[VisitRegistration] Error fetching tracking info:', err);
      setPracticeError(msg);
    } finally {
      setLoadingPractice(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      const practiceId = parseInt(id);
      const tag = `[VisitReg:${id}]`;
      console.log(tag, '=== PAGE MOUNT === practiceId=', practiceId);

      // Envolver fetchVisitsByPractice con logs sin modificar el hook
      const loggedFetchVisits = async () => {
        console.log(tag, 'fetchVisitsByPractice START');
        const start = performance.now();
        try {
          await fetchVisitsByPractice(practiceId, true);
          console.log(tag, `fetchVisitsByPractice OK (${Math.round(performance.now() - start)}ms)`);
        } catch (e: any) {
          console.error(tag, 'fetchVisitsByPractice FAIL', e?.message || e);
        }
      };

      const loggedFetchStats = async () => {
        console.log(tag, 'fetchStats START');
        const start = performance.now();
        try {
          await fetchStats({ practiceId });
          console.log(tag, `fetchStats OK (${Math.round(performance.now() - start)}ms)`);
        } catch (e: any) {
          console.error(tag, 'fetchStats FAIL', e?.message || e);
        }
      };

      fetchPracticeInfo();
      loggedFetchVisits();
      loggedFetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    // Update stats key when stats change
    if (stats) {
      setStatsKey(prev => prev + 1);
    }
  }, [stats]);

  // Cargar listas dinámicas para resolver IDs a nombres (VISIT_TYPE, VISIT_CASE)
  useEffect(() => {
    fetchMultipleLists(['VISIT_TYPE', 'VISIT_CASE']).then(lists => {
      const typeMap: Record<string, string> = {};
      const caseMap: Record<string, string> = {};
      (lists.VISIT_TYPE || []).forEach(v => { typeMap[v.id] = v.name; });
      (lists.VISIT_CASE || []).forEach(v => { caseMap[v.id] = v.name; });
      setVisitTypeLabelMap(typeMap);
      setVisitCaseLabelMap(caseMap);
    }).catch(() => {
      // Fallback: no hacer nada, los labels legacy ya están cargados
    });
  }, [fetchMultipleLists]);

  const handleOpenModal = (visit?: Visit) => {
    setSelectedVisit(visit || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedVisit(null);
  };

  const refreshStats = () => {
    if (id) fetchStats({ practiceId: parseInt(id) });
  };

  const handleSubmit = async (data: CreateVisitPayload | UpdateVisitPayload): Promise<boolean> => {
    let success = false;
    if (selectedVisit) {
      const result = await updateVisit(selectedVisit.visitId, data as UpdateVisitPayload);
      success = result !== null;
    } else {
      const result = await createVisit({
        ...data as CreateVisitPayload,
        practiceId: parseInt(id!),
      });
      success = result !== null;
    }
    if (success) refreshStats();
    return success;
  };

  const handleDelete = async () => {
    if (deleteDialog.visitId) {
      const success = await deleteVisit(deleteDialog.visitId);
      if (success) {
        setDeleteDialog({ isOpen: false, visitId: null });
        refreshStats();
      }
    }
  };

  const handleRestoreConfirm = async () => {
    if (restoreDialog.visitId) {
      const success = await restoreVisit(restoreDialog.visitId);
      if (success) {
        setRestoreDialog({ isOpen: false, visitId: null });
        refreshStats();
      }
    }
  };

  const getVisitTypeLabel = (type: string) => {
    return VISIT_TYPES.find(t => t.value === type)?.label || visitTypeLabelMap[type] || type;
  };

  const getVisitCaseLabel = (visitCase: string) => {
    return LEGACY_VISIT_CASES.find(c => c.value === visitCase)?.label || visitCaseLabelMap[visitCase] || visitCase;
  };

  const getVisitTypeBadge = (type: string) => {
    const label = getVisitTypeLabel(type).toUpperCase();
    const variants: Record<string, 'primary' | 'success' | 'warning'> = {
      PRESENCIAL: 'success',
      VIRTUAL: 'primary',
      TELEFONICA: 'warning'
    };
    // Normalizar: si el label resuelto contiene palabras clave
    if (label.includes('PRESENCIAL')) return 'success';
    if (label.includes('VIRTUAL')) return 'primary';
    if (label.includes('TEL') || label.includes('LLAMADA')) return 'warning';
    return variants[type] || 'primary';
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
        title={practiceInfo ? `${practiceInfo.studentName} - Visitas` : "Registro de Visitas"}
        description={practiceInfo ? `Visitas de seguimiento - ${practiceInfo.studentName}` : "Registro detallado de visitas de seguimiento"}
      />
      <PageBreadcrumb pageTitle={practiceInfo ? practiceInfo.studentName : "Registro de Visitas"} />

      <div className="mb-6 flex justify-end">
        <Button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2"
          startIcon={<PlusCircleIcon className="h-5 w-5" />}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
              <p className="text-lg font-semibold text-text-primary dark:text-text-emphasis">{practiceInfo.tutorName || 'No asignado'}</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
              <p className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-1">Tutor Metodológico</p>
              <p className="text-lg font-semibold text-text-primary dark:text-text-emphasis">{practiceInfo.tutorMethodologicalName || 'No asignado'}</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
              <p className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-1">Total Horas</p>
              <p className="text-lg font-semibold text-text-primary dark:text-text-emphasis">{stats?.totalHours || 0} hrs</p>
            </div>
          </div>
        </ComponentCard>
      ) : (
        <ComponentCard title="Información de la Práctica" className="mb-6">
          <div className="p-6 text-center">
            <p className="text-sm text-error-500 mb-3">
              {practiceError || 'No se pudieron cargar los datos de la práctica. Verifica la conexión.'}
            </p>
            <Button
              variant="outline"
              onClick={() => fetchPracticeInfo()}
            >
              Reintentar
            </Button>
          </div>
        </ComponentCard>
      )}

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

      <ComponentCard title={tabsState.activeTab === 'active' ? "Historial de Visitas" : "Visitas Inactivas"}>
        <Tabs
          options={[
            { id: 'active', label: 'Activas' },
            { id: 'inactive', label: 'Inactivas' },
          ]}
          {...tabsState.tabProps}
          variant="underline"
          className="mb-6"
        />

        {loading ? (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        ) : tableData.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader>Fecha</TableCell>
                  <TableCell isHeader>Tutor</TableCell>
                  <TableCell isHeader>Tipo</TableCell>
                  <TableCell isHeader>Horas</TableCell>
                  <TableCell isHeader>Actividades</TableCell>
                  <TableCell isHeader>{' '}</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((visit) => (
                  <TableRow key={visit.visitId}>
                    <TableCell className="whitespace-nowrap">
                      <span className="font-medium text-text-primary dark:text-text-emphasis">
                        {formatDate(visit.visitDate)}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="text-sm text-text-secondary dark:text-text-tertiary">
                        {visit.tutorName || '—'}
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
                      <div className="flex justify-end gap-3">
                        {/* Botón siempre disponible: Ver Detalles */}
                        <AsyncActionButton
                          onClick={async () => setViewDialog({ isOpen: true, visit })}
                          icon={<EyeIcon />}
                          tooltip="Ver Detalles"
                          variant="primary"
                        />

                        {tabsState.activeTab === 'inactive' ? (
                          /* SI está inactivo: solo botón Restaurar */
                          <AsyncActionButton
                            onClick={async () => setRestoreDialog({ isOpen: true, visitId: visit.visitId })}
                            icon={<RefreshIcon />}
                            tooltip="Restaurar"
                            variant="success"
                          />
                        ) : (
                          /* SI está activo: botonera normal */
                          <>
                            <AsyncActionButton
                              onClick={async () => handleOpenModal(visit)}
                              icon={<EditIcon />}
                              tooltip="Editar"
                              variant="primary"
                            />
                            <AsyncActionButton
                              onClick={async () => setDeleteDialog({ isOpen: true, visitId: visit.visitId })}
                              icon={<TrashIcon />}
                              tooltip="Eliminar"
                              variant="error"
                            />
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={tableData.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(v) => { setItemsPerPage(v); setCurrentPage(1); }}
            />
          </div>
        ) : (
          <EmptyState
            title={tabsState.activeTab === 'active' ? "No hay visitas activas" : "No hay visitas inactivas"}
            description={tabsState.activeTab === 'active' ? "Comienza registrando la primera visita de seguimiento" : "Las visitas inactivas aparecerán aquí"}
            action={tabsState.activeTab === 'active' ? <Button onClick={() => handleOpenModal()}>Registrar Visita</Button> : undefined}
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
        periodStartDate={practiceInfo?.periodStartDate ? parseApiDate(practiceInfo.periodStartDate) : undefined}
        periodEndDate={practiceInfo?.periodEndDate ? parseApiDate(practiceInfo.periodEndDate) : undefined}
        studentName={practiceInfo?.studentName}
        studentCi={practiceInfo?.studentIdNumber}
        careerName={practiceInfo?.careerName}
        institutionName={practiceInfo?.institutionName}
        assignedTutors={practiceInfo?.assignedTutors || []}
        tutorVisitCounts={visits.reduce<{ tutorId: number; visitCount: number }[]>((acc, v) => {
          const existing = acc.find(c => c.tutorId === v.tutorId);
          if (existing) {
            existing.visitCount++;
          } else {
            acc.push({ tutorId: v.tutorId, visitCount: 1 });
          }
          return acc;
        }, [])}
        hoursAccumulated={visits.reduce((sum, v) => sum + (v.hoursWorked || 0), 0)}
      />

      <Modal
        isOpen={viewDialog.isOpen}
        onClose={() => setViewDialog({ isOpen: false, visit: null })}
        size="5xl"
        showCloseButton
      >
        <ModalHeader className="shrink-0 pt-8 px-6 sm:px-12">Detalle de la Visita</ModalHeader>
        <ModalBody className="overflow-y-auto custom-scrollbar grow px-6 sm:px-12 py-8">
          {viewDialog.visit && (
            <div className="space-y-10 max-w-5xl mx-auto py-2">
              {/* Sección: Información de la Visita */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border-light dark:border-white/5 pb-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <h4 className="font-bold text-text-primary dark:text-white/90 uppercase text-xs tracking-wider">Información de la Visita</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Fecha</label>
                    <p className="text-sm font-semibold text-text-primary dark:text-white/90">{formatDate(viewDialog.visit.visitDate)}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Tipo</label>
                    <Badge color={getVisitTypeBadge(viewDialog.visit.visitType)} variant="solid" size="sm">
                      {getVisitTypeLabel(viewDialog.visit.visitType)}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Horas Trabajadas</label>
                    <p className="text-sm font-bold text-brand-600 dark:text-brand-400">
                      {viewDialog.visit.hoursWorked} <span className="text-xs font-normal text-text-tertiary">horas</span>
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Caso de Visita</label>
                    <p className="text-sm font-semibold text-text-primary dark:text-white/90">
                      {getVisitCaseLabel(viewDialog.visit.visitCase || '') || 'Seguimiento Regular'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sección: Tutor Asignado */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border-light dark:border-white/5 pb-2">
                  <div className="h-2 w-2 rounded-full bg-brand-500"></div>
                  <h4 className="font-bold text-text-primary dark:text-white/90 uppercase text-xs tracking-wider">Tutor Asignado</h4>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-white/5">
                  <div className="size-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {viewDialog.visit.tutorName?.split(' ').map(n => n[0]).join('').slice(0, 2) || '??'}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-0.5">Nombre</p>
                    <p className="text-sm font-semibold text-text-primary dark:text-white/90">
                      {viewDialog.visit.tutorName || 'No especificado'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sección: Actividades Realizadas */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border-light dark:border-white/5 pb-2">
                  <div className="h-2 w-2 rounded-full bg-success-500"></div>
                  <h4 className="font-bold text-text-primary dark:text-white/90 uppercase text-xs tracking-wider">Actividades Realizadas</h4>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                  <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                    {viewDialog.visit.activitiesPerformed || 'Sin actividades registradas'}
                  </p>
                </div>
              </div>

              {/* Observaciones (si existen) */}
              {viewDialog.visit.observations && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-border-light dark:border-white/5 pb-2">
                    <div className="h-2 w-2 rounded-full bg-warning-500"></div>
                    <h4 className="font-bold text-text-primary dark:text-white/90 uppercase text-xs tracking-wider">Observaciones</h4>
                  </div>
                  <div className="p-4 rounded-lg bg-warning-50 dark:bg-warning-500/10 border border-warning-100 dark:border-warning-500/20">
                    <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                      {viewDialog.visit.observations}
                    </p>
                  </div>
                </div>
              )}

              {/* Recomendaciones (si existen) */}
              {viewDialog.visit.recommendations && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-border-light dark:border-white/5 pb-2">
                    <div className="h-2 w-2 rounded-full bg-info-500"></div>
                    <h4 className="font-bold text-text-primary dark:text-white/90 uppercase text-xs tracking-wider">Recomendaciones</h4>
                  </div>
                  <div className="p-4 rounded-lg bg-info-50 dark:bg-info-500/10 border border-info-100 dark:border-info-500/20">
                    <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                      {viewDialog.visit.recommendations}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </ModalBody>
        <ModalFooter className="shrink-0">
          <Button
            variant="outline"
            onClick={() => setViewDialog({ isOpen: false, visit: null })}
            className="flex-1 sm:flex-none"
          >
            Cerrar
          </Button>
        </ModalFooter>
      </Modal>

      <UnifiedDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, visitId: null })}
        title="Confirmar Desactivación"
        message="¿Estás seguro de que deseas desactivar esta visita? Podrás restaurarla desde la pestaña de inactivas."
        confirmLabel="Desactivar"
        variant="error"
        onConfirm={handleDelete}
      />

      <UnifiedDialog
        isOpen={restoreDialog.isOpen}
        onClose={() => setRestoreDialog({ isOpen: false, visitId: null })}
        title="Confirmar Restauración"
        message="¿Estás seguro de que deseas restaurar esta visita? Volverá a aparecer en la pestaña de activos."
        confirmLabel="Restaurar"
        variant="success"
        onConfirm={handleRestoreConfirm}
      />
    </>
  );
}
