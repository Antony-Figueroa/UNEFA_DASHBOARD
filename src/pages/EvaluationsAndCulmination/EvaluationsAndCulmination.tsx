/**
 * @file EvaluationsAndCulmination.tsx
 * @description Página principal del módulo de Evaluaciones y Culminación.
 * Orquestra los componentes del feature, delegando toda la lógica al hook.
 * Incluye acciones de administrador (retiro, extensión, congelar, auditoría).
 */

import { useMemo, useEffect, useState, useCallback } from 'react';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import Button from '../../components/ui/button/Button';
import CustomSelect from '../../components/form/CustomSelect';
import { Pagination } from '../../components/ui/table';
import { EmptyState } from '../../components/ui/table/EmptyState';
import { TableSkeleton } from '../../components/ui/skeleton';
import UnifiedDialog from '../../components/ui/dialog/UnifiedDialog';
import { DownloadIcon } from '../../icons';
import { StudentDetailModal } from '../../features/student-detail/components/StudentDetailModal';
import { EvaluationModal } from '../../features/evaluations/components/EvaluationModal';
import EvaluationDetailModal from '../../features/evaluations/components/EvaluationDetailModal';
import { EvaluationCard } from '../../features/evaluations-culmination/components/EvaluationCard';
import { useSystemEvaluationConfig } from '../../features/evaluations/hooks/useSystemEvaluationConfig';
import { StatsCardsGrid } from '../../features/evaluations-culmination/components/StatsCards';
import { EvaluationFilters } from '../../features/evaluations-culmination/components/EvaluationFilters';
import { StudentCulminationRow } from '../../features/evaluations-culmination/components/StudentCulminationRow';
import { EvaluationActions } from '../../features/evaluations-culmination/components/EvaluationActions';
import { AuditHistoryModal } from '../../features/evaluations-culmination/components/AuditHistoryModal';
import { CommitteeModal } from '../../features/evaluations-culmination/components/CommitteeModal';
import { CloseActasModal } from '../../features/evaluations-culmination/components/CloseActasModal';
import { CloseActasResultsModal } from '../../features/evaluations-culmination/components/CloseActasResultsModal';
import { AllEvaluationsDetailModal } from '../../features/evaluations-culmination/components/AllEvaluationsDetailModal';

import { useEvaluationsCulmination } from '../../features/evaluations-culmination/hooks/useEvaluationsCulmination';
import { Tabs } from '../../components/ui/tabs/Tabs';
import { useTabs } from '../../hooks/useTabs';
import type { EvaluatorType } from '../../features/evaluations/types';
import type { PracticeWithEvaluations } from '../../features/evaluations-culmination/types';
import {
  RESULT_OPTIONS,
  CULMINATION_STATUS_OPTIONS,
} from '../../features/evaluations-culmination/types';
import { groupByStudentCareer } from '../../features/evaluations-culmination/utils/groupByStudentCareer';

// ─── Tabs ─────────────────────────────────────────────────
const EVAL_TABS = [
  { id: 'evaluations', label: 'Evaluaciones' },
  { id: 'culmination', label: 'Culminación' },
  { id: 'certification', label: 'Certificación' },
];

// ─── Helpers ──────────────────────────────────────────────

// ─── Page Component ───────────────────────────────────────
export default function EvaluationsAndCulminationPage() {
  const hook = useEvaluationsCulmination();
  const tabsState = useTabs({ defaultTab: 'evaluations' });
  const { config: evalConfig } = useSystemEvaluationConfig();
  const [certificationExpandedCi, setCertificationExpandedCi] = useState<string | null>(null);
  const [allEvalsModalOpen, setAllEvalsModalOpen] = useState(false);
  const [allEvalsPracticeId, setAllEvalsPracticeId] = useState<number | null>(null);
  const [allEvalsStudentName, setAllEvalsStudentName] = useState('');
  const [allEvalsStudentCi, setAllEvalsStudentCi] = useState('');

  const toggleCertificationRow = useCallback((studentCi: string) => {
    setCertificationExpandedCi(prev => (prev === studentCi ? null : studentCi));
  }, []);

  // Refrescar datos al volver a la pestaña de Evaluaciones
  useEffect(() => {
    if (tabsState.activeTab === 'evaluations') {
      hook.refresh();
    }
  }, [tabsState.activeTab]);

  // Opciones para filtros (derivadas del meta del hook)
  const periodOptions = useMemo(() => [
    { value: '', label: 'Todos los períodos' },
    ...(Array.isArray(hook.meta.periods) ? hook.meta.periods : []).map(p => ({
      value: String(p.id), label: p.name,
    })),
  ], [hook.meta.periods]);

  const careerOptions = useMemo(() => [
    { value: '', label: 'Todas las carreras' },
    ...(Array.isArray(hook.meta.careers) ? hook.meta.careers : []).map(c => ({
      value: String(c.id), label: c.name,
    })),
  ], [hook.meta.careers]);

  const practiceTypeOptions = useMemo(() => [
    { value: '', label: 'Todos los tipos' },
    ...(Array.isArray(hook.meta.practiceTypes) ? hook.meta.practiceTypes : []).map(t => ({
      value: String(t.id), label: t.name,
    })),
  ], [hook.meta.practiceTypes]);

  // Lista activa según pestaña seleccionada
  const activeList = useMemo(() => hook.filteredPractices, [hook.filteredPractices]);

  // Paginación computada (sobre activeList para paginación correcta por tab)
  const totalPages = Math.ceil(activeList.length / hook.itemsPerPage);
  const paginatedData = activeList.slice(
    (hook.currentPage - 1) * hook.itemsPerPage,
    hook.currentPage * hook.itemsPerPage
  );

  // Estado de filtros activos
  const hasActiveFilters = Object.keys(hook.filters).length > 0;

  // ─── Render: Evaluations tab (agrupado por estudiante+carrera) ──
  const renderEvaluationsTab = () => {
    // Agrupar prácticas paginadas por studentCi + careerId
    const groups = groupByStudentCareer(paginatedData);

    return (
      <>
        <div className="space-y-2">
          {groups.map(group => (
            <EvaluationCard
              key={`${group.studentCi}-${group.careerId}`}
              group={group}
              displayScale={evalConfig.score.displayScale}
              onEvaluate={(p, type, evalId) => hook.handleOpenEvaluation(p, type, evalId)}
              onViewDetails={(id) => hook.handleViewEvaluationDetails(id, '', '')}
              onApprove={hook.handleApprove}
              onOpenCommittee={hook.handleOpenCommittee}
              onGrantExtension={hook.handleGrantExtension}
              onRevokeExtension={hook.handleRevokeExtension}
              onViewAudit={hook.handleViewAudit}
              onUnfreeze={hook.handleUnfreeze}
              isReadOnly={hook.isReadOnly}
            />
          ))}
        </div>

        {totalPages > 1 && (
          <Pagination
            currentPage={hook.currentPage}
            totalPages={totalPages}
            totalItems={activeList.length}
            itemsPerPage={hook.itemsPerPage}
            onPageChange={hook.setCurrentPage}
            onItemsPerPageChange={(items) => { hook.setItemsPerPage(items); hook.setCurrentPage(1); }}
            itemsPerPageOptions={[10, 25, 50]}
          />
        )}
      </>
    );
  };

  // ─── Render: Culmination tab (redesign: grouped rows) ───
  const renderCulminationTab = () => {
    const groups = hook.culminationGroups;
    const expandedCi = hook.culminationExpandedStudentCi;
    const toggleRow = hook.toggleCulminationRow;

    if (hook.culminationGroupsLoading) {
      return <TableSkeleton columns={1} rows={8} />;
    }

    if (!groups || groups.length === 0) {
      return (
        <EmptyState
          title="No se encontraron estudiantes"
          description="No hay datos de culminación para los filtros seleccionados."
        />
      );
    }

    return (
      <>
        <StatsCardsGrid
          meta={hook.culminationGroupsMeta}
        />

        <div className="space-y-2">
          {groups.map((row) => (
            <StudentCulminationRow
              key={row.studentCi}
              row={row}
              isExpanded={expandedCi === row.studentCi}
              onToggle={() => toggleRow(row.studentCi)}
              onCertify={hook.certifyPracticeGrouped}
              onReverse={hook.reverseCulminationGrouped}
              certifying={hook.actionCertifying}
              isWithinGracePeriod={row.isWithinGracePeriod}
              onViewEvaluationDetails={(practiceId) => {
                setAllEvalsPracticeId(practiceId);
                setAllEvalsStudentName(row.studentName);
                setAllEvalsStudentCi(row.studentCi);
                setAllEvalsModalOpen(true);
              }}
              onViewAudit={(practiceId) => hook.handleViewAudit(practiceId)}
            />
          ))}
        </div>
      </>
    );
  };

  // ─── Render: Certification tab ──────────────────────────
  const renderCertificationTab = () => {
    // Filtrar solo estudiantes certificados
    const certifiedGroups = hook.culminationGroups.filter(
      (group) => group.certificateNumber != null
    );

    if (hook.culminationGroupsLoading) {
      return <TableSkeleton columns={1} rows={4} />;
    }

    if (certifiedGroups.length === 0) {
      return (
        <EmptyState
          title="No hay registros de certificación"
          description="Los registros certificados aparecerán aquí."
        />
      );
    }

    return (
      <div className="space-y-2">
        {certifiedGroups.map((row) => (
          <StudentCulminationRow
            key={row.studentCi}
            row={row}
            isExpanded={certificationExpandedCi === row.studentCi}
            onToggle={() => toggleCertificationRow(row.studentCi)}
            onCertify={hook.certifyPracticeGrouped}
            onReverse={hook.reverseCulminationGrouped}
            onDownloadPdf={hook.handleDownloadPdf}
            certifying={hook.actionCertifying}
            readOnly={true}
          />
        ))}
      </div>
    );
  };

  // ─── Tab content switch ─────────────────────────────────
  const renderTabContent = () => {
    if (hook.loading) {
      return <TableSkeleton columns={tabsState.activeTab === 'evaluations' ? (hook.isReadOnly ? 9 : 10) : 7} rows={10} />;
    }

    // Para la pestaña de certificación, no mostrar el empty state general
    // porque usa culminationGroups, no filteredPractices
    if (tabsState.activeTab !== 'certification' && hook.filteredPractices.length === 0) {
      return (
        <EmptyState
          title="No se encontraron prácticas"
          description="Intenta ajustar los filtros para encontrar lo que buscas."
        />
      );
    }

    switch (tabsState.activeTab) {
      case 'evaluations': return renderEvaluationsTab();
      case 'culmination': return renderCulminationTab();
      case 'certification': return renderCertificationTab();
      default: return null;
    }
  };

  // ─── Main Render ────────────────────────────────────────
  return (
    <>
      <PageMeta
        title="Evaluaciones y Culminación"
        description="Gestión de evaluaciones y culminación de prácticas profesionales"
      />
      <PageBreadcrumb pageTitle="Evaluaciones y Culminación" />

      <div className="space-y-6 animate-fadeIn">
        {/* Read-only banner */}
        {hook.isReadOnly && (
          <div className="bg-warning-50 dark:bg-warning-500/10 border border-warning-300 dark:border-warning-700 rounded-lg px-4 py-3">
            <p className="text-sm text-warning-700 dark:text-warning-400 font-medium">
              Modo de solo lectura — Los permisos de asistente no permiten realizar cambios.
            </p>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-text-secondary dark:text-text-tertiary">
              Gestiona las evaluaciones, resultados y culminación de prácticas profesionales
            </p>
          </div>
          <Button variant="outline" onClick={hook.refresh}>
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualizar
          </Button>
        </div>

        {/* Tabs */}
        <Tabs options={EVAL_TABS} {...tabsState.tabProps} variant="underline" className="mb-6" />

        {/* Filtros y contenido */}
        <ComponentCard title="Listado de Prácticas">
          {/* Admin actions header */}
          {tabsState.activeTab === 'evaluations' && (
            <div className="mb-4">
              <EvaluationActions
                isReadOnly={hook.isReadOnly}
                onFreezeAll={hook.handleFreezeAll}
                onExportExcel={hook.handleExportExcel}
              />
            </div>
          )}

          {/* Filtros unificados para ambos tabs */}
          <EvaluationFilters
            searchTerm={hook.searchTerm}
            onSearchChange={(v) => { hook.setSearchTerm(v); hook.setCurrentPage(1); }}
            filters={hook.filters}
            onFilterChange={hook.updateFilter}
            onClear={hook.clearFilters}
            periodOptions={periodOptions}
            careerOptions={careerOptions}
            practiceTypeOptions={practiceTypeOptions}
            hasActiveFilters={hasActiveFilters}
            extraFilters={
              tabsState.activeTab === 'evaluations' ? (
                <CustomSelect
                  options={RESULT_OPTIONS.filter(o => o.value !== 'all')}
                  value={String(hook.filters.result || '')}
                  onChange={(v) => hook.updateFilter('result', v as string)}
                  placeholder="Resultado"
                  className="w-full"
                />
              ) : tabsState.activeTab === 'culmination' ? (
                <CustomSelect
                  options={CULMINATION_STATUS_OPTIONS.filter(o => o.value !== 'all').map(o => ({ value: o.value, label: o.label }))}
                  value={String(hook.filters.culminationStatus || '')}
                  onChange={(v) => hook.updateFilter('culminationStatus', v as string)}
                  className="w-full"
                />
              ) : undefined
            }
          />

          {renderTabContent()}
        </ComponentCard>
      </div>

      {/* Modales existentes */}
      <UnifiedDialog
        isOpen={!!hook.confirmDialog}
        onClose={hook.closeConfirmDialog}
        onConfirm={hook.confirmDialog?.onConfirm || (() => {})}
        title={hook.confirmDialog?.title || ''}
        message={hook.confirmDialog?.message || ''}
        confirmLabel="Confirmar"
        variant="info"
      />

      {/* Diálogo de override (déficit de horas) */}
      <UnifiedDialog
        isOpen={!!hook.overrideTarget}
        onClose={() => hook.setOverrideTarget(null)}
        onConfirm={hook.handleConfirmOverride}
        title="Aprobar Culminación con Déficit de Horas"
        message={`${hook.overrideTarget?.practice?.studentName || ''} tiene ${hook.overrideTarget?.practice?.totalHours || 0}h de ${hook.overrideTarget?.practice?.hoursRequired || 360}h requeridas. ¿Desea aprobar con déficit?`}
        confirmLabel="Aprobar con Déficit"
        variant="warning"
      >
        <div className="space-y-4 mt-2">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Motivo del déficit *
            </label>
            <textarea
              className="w-full rounded-lg border border-border-default dark:border-border-dark bg-bg-subtle dark:bg-bg-dark p-2 text-sm text-text-primary"
              rows={3}
              value={hook.overrideTarget?.reason || ''}
              onChange={(e) => hook.setOverrideReason(e.target.value)}
              placeholder="Describa el motivo del déficit de horas"
            />
          </div>
        </div>
      </UnifiedDialog>

      {hook.selectedPracticeForEval && (
        <>
        <EvaluationModal
          isOpen={hook.evalModalOpen}
          onClose={hook.handleCloseEvaluationModal}
          practiceId={hook.selectedPracticeForEval.practiceId}
          evaluatorType={hook.selectedEvaluatorType}
          evaluationId={hook.editingEvaluationId}
          onSuccess={hook.handleEvaluationSuccess}
          isFrozen={hook.selectedPracticeForEval.isFrozen}
          onNavigateToNext={hook.handleNavigateToNext}
          existingComiteMembers={
            hook.selectedPracticeForEval.evaluations.COMITE?.members?.map(m => ({
              memberIndex: m.memberIndex,
              evaluatorName: m.evaluatorName,
              score: m.score,
              evaluationId: m.evaluationId,
            })) || []
          }
          committeeAssignments={
            hook.selectedPracticeForEval.evaluations.COMITE?.members?.map(m => ({
              memberIndex: m.memberIndex,
              evaluatorName: m.evaluatorName,
            })) || []
          }
        />
        </>
      )}

      <EvaluationDetailModal
        isOpen={hook.detailModalOpen}
        onClose={hook.handleCloseDetailModal}
        evaluationId={hook.selectedEvaluationId}
        studentName={hook.selectedDetailStudentName}
        studentCi={hook.selectedDetailStudentCi}
      />

      <AllEvaluationsDetailModal
        isOpen={allEvalsModalOpen}
        onClose={() => { setAllEvalsModalOpen(false); setAllEvalsPracticeId(null); }}
        practiceId={allEvalsPracticeId}
        studentName={allEvalsStudentName}
        studentCi={allEvalsStudentCi}
      />

      <StudentDetailModal
        isOpen={hook.studentDetailOpen}
        onClose={hook.handleCloseStudentDetail}
        practiceId={hook.selectedStudentPracticeId || 0}
        studentName={hook.selectedStudentName}
      />

      {/* Admin modals */}
      {/* Withdraw dialog */}
      <UnifiedDialog
        isOpen={hook.withdrawDialogOpen}
        onClose={() => hook.setWithdrawDialogOpen(false)}
        onConfirm={hook.handleConfirmWithdraw}
        title={`Retiro ${hook.withdrawType === 'justified' ? 'Justificado' : 'Injustificado'}`}
        message={`Registrar retiro ${hook.withdrawType === 'justified' ? 'justificado' : 'injustificado'} para ${hook.withdrawTarget?.studentName || ''}`}
        confirmLabel="Confirmar Retiro"
        variant="info"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-text-emphasis mb-2">
              Tipo de retiro
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="justified"
                  checked={hook.withdrawType === 'justified'}
                  onChange={() => hook.setWithdrawType('justified')}
                  className="text-brand-500 focus:ring-brand-500"
                />
                <span className="text-sm text-text-secondary">Justificado</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="unjustified"
                  checked={hook.withdrawType === 'unjustified'}
                  onChange={() => hook.setWithdrawType('unjustified')}
                  className="text-brand-500 focus:ring-brand-500"
                />
                <span className="text-sm text-text-secondary">Injustificado</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-text-emphasis mb-1">
              Motivo del retiro *
            </label>
            <textarea
              value={hook.withdrawReason}
              onChange={(e) => hook.setWithdrawReason(e.target.value)}
              placeholder="Ingrese el motivo del retiro..."
              rows={3}
              className="w-full px-3 py-2 border border-border-default dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </UnifiedDialog>

      {/* Extension dialog */}
      <UnifiedDialog
        isOpen={hook.extensionDialogOpen}
        onClose={() => hook.setExtensionDialogOpen(false)}
        onConfirm={hook.handleConfirmExtension}
        title="Otorgar Extensión"
        message={`Otorgar extensión a ${hook.extensionTarget?.studentName || ''}`}
        confirmLabel="Otorgar Extensión"
        variant="info"
      >
        <div>
          <label className="block text-sm font-medium text-text-primary dark:text-text-emphasis mb-1">
            Motivo de la extensión *
          </label>
          <textarea
            value={hook.extensionReason}
            onChange={(e) => hook.setExtensionReason(e.target.value)}
            placeholder="Ingrese el motivo de la extensión..."
            rows={3}
            className="w-full px-3 py-2 border border-border-default dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </UnifiedDialog>

      {/* Unfreeze dialog */}
      <UnifiedDialog
        isOpen={!!hook.unfreezeTarget}
        onClose={() => hook.setUnfreezeTarget(null)}
        onConfirm={hook.handleConfirmUnfreeze}
        title="Descongelar Evaluaciones"
        message="Las celdas de evaluación volverán a ser editables."
        confirmLabel="Descongelar"
        variant="warning"
      >
        <div>
          <label className="block text-sm font-medium text-text-primary dark:text-text-emphasis mb-1">
            Motivo de la corrección *
          </label>
          <textarea
            value={hook.unfreezeReason}
            onChange={(e) => hook.setUnfreezeReason(e.target.value)}
            placeholder="Ingrese el motivo de la corrección (mínimo 10 caracteres)..."
            rows={3}
            className="w-full px-3 py-2 border border-border-default dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-brand-500"
          />
          {hook.unfreezeReason.trim().length > 0 && hook.unfreezeReason.trim().length < 10 && (
            <p className="text-xs text-warning-600 dark:text-warning-400 mt-1">
              Mínimo 10 caracteres requeridos
            </p>
          )}
        </div>
      </UnifiedDialog>

      {/* Audit history modal */}
      <AuditHistoryModal
        isOpen={hook.auditHistoryOpen}
        onClose={() => hook.setAuditHistoryOpen(false)}
        data={hook.auditHistoryData}
        loading={hook.auditHistoryLoading}
      />

      {/* Committee assignment modal */}
      {hook.committeeTarget && (
        <CommitteeModal
          isOpen={hook.committeeDialogOpen}
          onClose={() => hook.setCommitteeDialogOpen(false)}
          practiceId={hook.committeeTarget.practiceId}
          studentName={hook.committeeTarget.studentName}
          onSuccess={hook.refresh}
        />
      )}

      {/* Close Actas — Confirmation preview modal */}
      <CloseActasModal
        isOpen={hook.closeActasModalOpen}
        onClose={() => hook.setCloseActasModalOpen(false)}
        practiceIds={hook.selectedPracticeIdsForCloseActas}
        onConfirm={hook.closeActasFromPreview}
      />

      {/* Close Actas — Results modal (shows auto-preinscription) */}
      <CloseActasResultsModal
        isOpen={hook.closeActasResultsModalOpen}
        onClose={() => hook.setCloseActasResultsModalOpen(false)}
        results={hook.closeActasResults}
      />
    </>
  );
}
