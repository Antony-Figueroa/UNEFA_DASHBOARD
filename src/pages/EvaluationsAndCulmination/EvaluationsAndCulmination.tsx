/**
 * @file EvaluationsAndCulmination.tsx
 * @description Página principal del módulo de Evaluaciones y Culminación.
 * Orquestra los componentes del feature, delegando toda la lógica al hook.
 * Incluye acciones de administrador (retiro, extensión, congelar, auditoría).
 */

import { useMemo, useEffect } from 'react';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import Button from '../../components/ui/button/Button';
import Badge from '../../components/ui/badge/Badge';
import CustomSelect from '../../components/form/CustomSelect';
import { Table, TableBody, TableCell, TableHeader, TableRow, Pagination } from '../../components/ui/table';
import { EmptyState } from '../../components/ui/table/EmptyState';
import { TableSkeleton } from '../../components/ui/skeleton';
import UnifiedDialog from '../../components/ui/dialog/UnifiedDialog';
import { DownloadIcon, CheckCircleIcon, EyeIcon } from '../../icons';
import { ActionDropdown, type ActionItem } from '../../features/evaluations-culmination/components/ActionDropdown';
import { StudentDetailModal } from '../../features/student-detail/components/StudentDetailModal';
import { EvaluationModal } from '../../features/evaluations/components/EvaluationModal';
import EvaluationDetailModal from '../../features/evaluations/components/EvaluationDetailModal';
import { EvaluationCell } from '../../features/evaluations-culmination/components/EvaluationCell';
import { useSystemEvaluationConfig } from '../../features/evaluations/hooks/useSystemEvaluationConfig';
import { StatsCardsGrid } from '../../features/evaluations-culmination/components/StatsCards';
import { EvaluationFilters } from '../../features/evaluations-culmination/components/EvaluationFilters';
import { StudentCulminationRow } from '../../features/evaluations-culmination/components/StudentCulminationRow';
import { CertificationView } from '../../features/evaluations-culmination/components/CertificationView';
import { PhaseStatusBadge } from '../../features/evaluations-culmination/components/PhaseStatusBadge';
import { EvaluationActions } from '../../features/evaluations-culmination/components/EvaluationActions';
import { BulkExtensionModal } from '../../features/evaluations-culmination/components/BulkExtensionModal';
import { AuditHistoryModal } from '../../features/evaluations-culmination/components/AuditHistoryModal';
import { CommitteeModal } from '../../features/evaluations-culmination/components/CommitteeModal';
import { useEvaluationsCulmination } from '../../features/evaluations-culmination/hooks/useEvaluationsCulmination';
import { Tabs } from '../../components/ui/tabs/Tabs';
import { useTabs } from '../../hooks/useTabs';
import type { EvaluatorType } from '../../features/evaluations/types';
import type { PracticeWithEvaluations } from '../../features/evaluations-culmination/types';
import {
  getResultLabel,
  RESULT_OPTIONS,
  CULMINATION_STATUS_OPTIONS,
} from '../../features/evaluations-culmination/types';

// ─── Tabs ─────────────────────────────────────────────────
const EVAL_TABS = [
  { id: 'evaluations', label: 'Evaluaciones' },
  { id: 'culmination', label: 'Culminación' },
  { id: 'certification', label: 'Certificación' },
];

// ─── Helpers ──────────────────────────────────────────────
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'completed':
      return (
        <Badge color="success" variant="light">
          <CheckCircleIcon className="w-4 h-4 mr-1" />
          Completo
        </Badge>
      );
    case 'partial':
      return (
        <Badge color="warning" variant="light">
          Parcial
        </Badge>
      );
    default:
      return (
        <Badge color="light" variant="light">
          Pendiente
        </Badge>
      );
  }
};

const getResultBadge = (result: string) => {
  const color = result === 'approved' ? 'success' : result === 'failed' ? 'error' : 'light';
  return (
    <Badge color={color} variant="light">
      {getResultLabel(result as any)}
    </Badge>
  );
};

const getCulminationBadge = (status: string) => {
  const color = status === 'certified' ? 'primary' : status === 'approved' ? 'success' : 'warning';
  const label = status === 'certified' ? 'Certificado' : status === 'approved' ? 'Aprobado' : 'Pendiente';
  return (
    <Badge color={color} variant="light" shape="rounded">
      {label}
    </Badge>
  );
};

// ─── Page Component ───────────────────────────────────────
export default function EvaluationsAndCulminationPage() {
  const hook = useEvaluationsCulmination();
  const tabsState = useTabs({ defaultTab: 'evaluations' });
  const { config: evalConfig } = useSystemEvaluationConfig();

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

  /** Returns Tailwind text color class based on grade value (1-10 scale) */
  const getGradeColor = (grade: number | null | undefined): string => {
    if (grade == null) return 'text-text-tertiary';
    if (grade >= 9) return 'text-success-600 dark:text-success-400';
    if (grade >= 7) return 'text-text-primary dark:text-text-emphasis';
    if (grade >= 6) return 'text-warning-600 dark:text-warning-400';
    return 'text-error-600 dark:text-error-400';
  };

  // ─── Render: Evaluations tab ────────────────────────────
  const renderEvaluationsTab = () => (
    <>
      <div className="overflow-hidden rounded-lg border border-border-default dark:border-border-dark">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell isHeader>Estudiante</TableCell>
              <TableCell isHeader>Período</TableCell>
              <TableCell isHeader>Carrera</TableCell>
              <TableCell isHeader>Tipo</TableCell>
              <TableCell isHeader className="text-center">Institucional (40%)</TableCell>
              <TableCell isHeader className="text-center">Académica (30%)</TableCell>
              <TableCell isHeader className="text-center">Comité (30%)</TableCell>
              <TableCell isHeader className="text-center">Nota Final</TableCell>
              <TableCell isHeader className="text-center">Estado</TableCell>
              {!hook.isReadOnly && <TableCell isHeader className="text-center">Acciones</TableCell>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map(practice => {
              const isTerminal = practice.practicesStatusCode === 'CULMINADO' || practice.practicesStatusCode === 'REPROBADO';
              return (
              <TableRow key={practice.practiceId} className="hover:bg-bg-subtle/50">
                <TableCell>
                  <div className="font-medium text-text-primary dark:text-text-emphasis">
                    {practice.studentName}
                  </div>
                  <div className="text-xs text-text-tertiary">{practice.studentCi}</div>
                </TableCell>
                <TableCell className="text-text-secondary">{practice.periodName}</TableCell>
                <TableCell className="text-text-secondary">{practice.careerName}</TableCell>
                <TableCell className="text-text-secondary">{practice.practiceTypeName}</TableCell>
                <TableCell className="text-center">
                  <EvaluationCell
                    evaluation={practice.evaluations.INSTITUCIONAL}
                    evaluatorType="INSTITUCIONAL"
                    onEvaluate={(type, evalId) => hook.handleOpenEvaluation(practice, type, evalId)}
                    onViewDetails={(id) => hook.handleViewEvaluationDetails(id, practice.studentName, practice.studentCi)}
                    displayScale={evalConfig.score.displayScale}
                    isFrozen={practice.isFrozen}
                    readOnly={isTerminal}
                    practiceStatusCode={practice.practicesStatusCode}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <EvaluationCell
                    evaluation={practice.evaluations.ACADEMICO}
                    evaluatorType="ACADEMICO"
                    onEvaluate={(type, evalId) => hook.handleOpenEvaluation(practice, type, evalId)}
                    onViewDetails={(id) => hook.handleViewEvaluationDetails(id, practice.studentName, practice.studentCi)}
                    displayScale={evalConfig.score.displayScale}
                    isFrozen={practice.isFrozen}
                    readOnly={isTerminal}
                    practiceStatusCode={practice.practicesStatusCode}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <EvaluationCell
                    evaluation={practice.evaluations.COMITE}
                    evaluatorType="COMITE"
                    onEvaluate={(type, evalId) => hook.handleOpenEvaluation(practice, type, evalId)}
                    onViewDetails={(id) => hook.handleViewEvaluationDetails(id, practice.studentName, practice.studentCi)}
                    displayScale={evalConfig.score.displayScale}
                    isFrozen={practice.isFrozen}
                    readOnly={isTerminal}
                    practiceStatusCode={practice.practicesStatusCode}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-lg font-bold text-brand-500">
                    {practice.finalGrade != null ? `${((practice.finalGrade / evalConfig.score.displayScale) * 100).toFixed(1)}%` : '-'}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  {getStatusBadge(practice.evaluationStatus)}
                </TableCell>
                {!hook.isReadOnly && (
                  <TableCell className="text-center">
                    <ActionDropdown actions={[
                      // Culminar — solo si evaluaciones completas, aprobado, y pendiente de culminar
                      ...(practice.evaluationStatus === 'completed' && practice.result === 'approved' && practice.culminationStatus === 'pending'
                        ? [{ label: 'Culminar', onClick: () => hook.handleApprove(practice), className: 'text-success-600 dark:text-success-400' }]
                        : []),
                      // Gestionar Comité — oculto si culminada
                      ...(practice.practicesStatusCode !== 'CULMINADO'
                        ? [{ label: 'Gestionar Comité', onClick: () => hook.handleOpenCommittee(practice.practiceId, practice.studentName) }]
                        : []),
                      // Otorgar Extensión — solo si no tiene extensión y no está culminada
                      ...(!practice.extensionGranted && practice.practicesStatusCode !== 'CULMINADO'
                        ? [{ label: 'Otorgar Extensión', onClick: () => hook.handleGrantExtension(practice.practiceId, practice.studentName) }]
                        : []),
                      // Revocar Extensión — solo si tiene extensión y no está culminada
                      ...(practice.extensionGranted && practice.practicesStatusCode !== 'CULMINADO'
                        ? [{ label: 'Revocar Extensión', onClick: () => hook.handleRevokeExtension(practice.practiceId) }]
                        : []),
                      // Ver Auditoría — siempre visible
                      { label: 'Ver Auditoría', onClick: () => hook.handleViewAudit(practice.practiceId) },
                      // Descongelar — si está congelado O si es reprobado (para permitir nueva evaluación)
                      ...(practice.isFrozen || practice.practicesStatusCode === 'REPROBADO'
                        ? [{ label: 'Descongelar', onClick: () => hook.handleUnfreeze(practice.practiceId) }]
                        : []),
                    ]} />
                  </TableCell>
                )}
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {/* Mobile cards */}
      <div className="md:hidden flex flex-col gap-4 mb-4">
        {paginatedData.map(practice => (
          <div key={practice.practiceId} className="bg-white dark:bg-gray-800 rounded-lg border border-border-default dark:border-border-dark p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="min-w-0">
                <p className="font-medium text-text-primary dark:text-text-emphasis truncate">{practice.studentName}</p>
                <p className="text-xs text-text-tertiary">{practice.studentCi}</p>
              </div>
              {getStatusBadge(practice.evaluationStatus)}
            </div>
            <div className="space-y-1 text-xs text-text-secondary mb-3">
              <p><span className="font-medium">Carrera:</span> {practice.careerName}</p>
              <p><span className="font-medium">Período:</span> {practice.periodName}</p>
              <p><span className="font-medium">Tipo:</span> {practice.practiceTypeName}</p>
            </div>
            <div className="flex justify-between items-center mb-2 text-sm">
              <span className="text-text-secondary">Institucional:</span>
              <span className={`font-medium ${getGradeColor(practice.evaluations.INSTITUCIONAL.score)}`}>{practice.evaluations.INSTITUCIONAL.score != null ? practice.evaluations.INSTITUCIONAL.score.toFixed(1) : '—'}</span>
            </div>
            <div className="flex justify-between items-center mb-2 text-sm">
              <span className="text-text-secondary">Académica:</span>
              <span className={`font-medium ${getGradeColor(practice.evaluations.ACADEMICO.score)}`}>{practice.evaluations.ACADEMICO.score != null ? practice.evaluations.ACADEMICO.score.toFixed(1) : '—'}</span>
            </div>
            <div className="flex justify-between items-center mb-2 text-sm">
              <span className="text-text-secondary">Comité:</span>
              <span className={`font-medium ${getGradeColor(practice.evaluations.COMITE.score)}`}>{practice.evaluations.COMITE.score != null ? practice.evaluations.COMITE.score.toFixed(1) : '—'}</span>
            </div>
            <div className="flex justify-between items-center mb-3 text-sm">
              <span className="text-text-secondary font-medium">Promedio:</span>
              <span className={`font-semibold ${getGradeColor(practice.finalGrade)}`}>{practice.finalGrade != null ? practice.finalGrade.toFixed(1) : '—'}</span>
            </div>
            <div className="pt-3 border-t border-border-default dark:border-border-dark flex gap-2">
              <Button size="sm" variant="outline" onClick={() => hook.handleViewStudentDetail(practice)} className="flex-1">
                <EyeIcon className="w-4 h-4" /> Ver
              </Button>
              {!hook.isReadOnly && (
                <ActionDropdown actions={[
                  ...(practice.evaluationStatus === 'completed' && practice.result === 'approved' && practice.culminationStatus === 'pending'
                    ? [{ label: 'Culminar', onClick: () => hook.handleApprove(practice), className: 'text-success-600 dark:text-success-400' }]
                    : []),
                  { label: 'Gestionar Comité', onClick: () => hook.handleOpenCommittee(practice.practiceId, practice.studentName) },
                  ...(!practice.extensionGranted
                    ? [{ label: 'Otorgar Extensión', onClick: () => hook.handleGrantExtension(practice.practiceId, practice.studentName) }]
                    : []),
                  ...(practice.extensionGranted
                    ? [{ label: 'Revocar Extensión', onClick: () => hook.handleRevokeExtension(practice.practiceId) }]
                    : []),
                  { label: 'Ver Auditoría', onClick: () => hook.handleViewAudit(practice.practiceId) },
                  ...(practice.isFrozen || practice.practicesStatusCode === 'REPROBADO'
                    ? [{ label: 'Descongelar', onClick: () => hook.handleUnfreeze(practice.practiceId) }]
                    : []),
                ]} />
              )}
            </div>
          </div>
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
            />
          ))}
        </div>
      </>
    );
  };

  // ─── Render: Certification tab ──────────────────────────
  const renderCertificationTab = () => (
    <CertificationView
      groups={hook.culminationGroups}
      loading={hook.culminationGroupsLoading}
    />
  );

  // ─── Tab content switch ─────────────────────────────────
  const renderTabContent = () => {
    if (hook.loading) {
      return <TableSkeleton columns={tabsState.activeTab === 'evaluations' ? (hook.isReadOnly ? 9 : 10) : 7} rows={10} />;
    }

    if (hook.filteredPractices.length === 0) {
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
                onBulkExtension={hook.handleBulkExtension}
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
        <EvaluationModal
          isOpen={hook.evalModalOpen}
          onClose={hook.handleCloseEvaluationModal}
          practiceId={hook.selectedPracticeForEval.practiceId}
          evaluatorType={hook.selectedEvaluatorType}
          evaluationId={hook.editingEvaluationId}
          onSuccess={hook.handleEvaluationSuccess}
          isFrozen={hook.selectedPracticeForEval.isFrozen}
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
      )}

      <EvaluationDetailModal
        isOpen={hook.detailModalOpen}
        onClose={hook.handleCloseDetailModal}
        evaluationId={hook.selectedEvaluationId}
        studentName={hook.selectedDetailStudentName}
        studentCi={hook.selectedDetailStudentCi}
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

      {/* Bulk extension modal */}
      <BulkExtensionModal
        isOpen={hook.bulkExtensionOpen}
        onClose={() => hook.setBulkExtensionOpen(false)}
        onConfirm={hook.handleConfirmBulkExtension}
        practices={hook.practices}
        selectedIds={hook.bulkExtensionSelectedIds}
        onSelectedIdsChange={hook.setBulkExtensionSelectedIds}
        reason={hook.bulkExtensionReason}
        onReasonChange={hook.setBulkExtensionReason}
      />

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
    </>
  );
}
