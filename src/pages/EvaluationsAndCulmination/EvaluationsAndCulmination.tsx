/**
 * @file EvaluationsAndCulmination.tsx
 * @description Página principal del módulo de Evaluaciones y Culminación.
 * Orquestra los componentes del feature, delegando toda la lógica al hook.
 * Incluye acciones de administrador (retiro, extensión, congelar, auditoría).
 */

import { useMemo } from 'react';
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
import { ThreeDotsIcon } from '../../icons/actions';
import { StudentDetailModal } from '../../features/student-detail/components/StudentDetailModal';
import { EvaluationModal } from '../../features/evaluations/components/EvaluationModal';
import EvaluationDetailModal from '../../features/evaluations/components/EvaluationDetailModal';
import { EvaluationCell } from '../../features/evaluations-culmination/components/EvaluationCell';
import { useSystemEvaluationConfig } from '../../features/evaluations/hooks/useSystemEvaluationConfig';
import { StatsCardsGrid } from '../../features/evaluations-culmination/components/StatsCards';
import { EvaluationFilters } from '../../features/evaluations-culmination/components/EvaluationFilters';
import { EvaluationActions } from '../../features/evaluations-culmination/components/EvaluationActions';
import { BulkExtensionModal } from '../../features/evaluations-culmination/components/BulkExtensionModal';
import { AuditHistoryModal } from '../../features/evaluations-culmination/components/AuditHistoryModal';
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

  // Paginación computada
  const totalPages = Math.ceil(hook.filteredPractices.length / hook.itemsPerPage);
  const paginatedData = hook.filteredPractices.slice(
    (hook.currentPage - 1) * hook.itemsPerPage,
    hook.currentPage * hook.itemsPerPage
  );

  // Estado de filtros activos
  const hasActiveFilters = Object.keys(hook.filters).length > 0;

  // ─── Render: Evaluations tab ────────────────────────────
  const renderEvaluationsTab = () => (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-visible rounded-lg border border-border-default dark:border-border-dark">
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
            {paginatedData.map(practice => (
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
                    onViewDetails={(id) => hook.handleViewEvaluationDetails(id)}
                    displayScale={evalConfig.score.displayScale}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <EvaluationCell
                    evaluation={practice.evaluations.ACADEMICO}
                    evaluatorType="ACADEMICO"
                    onEvaluate={(type, evalId) => hook.handleOpenEvaluation(practice, type, evalId)}
                    onViewDetails={(id) => hook.handleViewEvaluationDetails(id)}
                    displayScale={evalConfig.score.displayScale}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <EvaluationCell
                    evaluation={practice.evaluations.COMITE}
                    evaluatorType="COMITE"
                    onEvaluate={(type, evalId) => hook.handleOpenEvaluation(practice, type, evalId)}
                    onViewDetails={(id) => hook.handleViewEvaluationDetails(id)}
                    displayScale={evalConfig.score.displayScale}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-lg font-bold text-brand-500">
                    {practice.finalGrade != null ? `${Math.round((practice.finalGrade / evalConfig.score.displayScale) * 100)}%` : '-'}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  {getStatusBadge(practice.evaluationStatus)}
                </TableCell>
                {!hook.isReadOnly && (
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center">
                      <div className="relative group">
                        <button className="p-1.5 rounded-lg hover:bg-bg-subtle dark:hover:bg-gray-700 transition-colors">
                           <ThreeDotsIcon className="w-4 h-4 text-text-tertiary" />
                        </button>
                        {/* Dropdown menu */}
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-border-default dark:border-border-dark rounded-lg shadow-lg z-10 hidden group-hover:block">
                          <div className="py-1">
                            <button
                              onClick={() => hook.handleWithdraw(practice.practiceId, practice.studentName)}
                              className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-bg-subtle dark:hover:bg-gray-700"
                            >
                              Retirar
                            </button>
                            <button
                              onClick={() => hook.handleReclassifyWithdrawal(practice.practiceId, practice.studentName)}
                              className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-bg-subtle dark:hover:bg-gray-700"
                            >
                              Reclasificar Retiro
                            </button>
                            <button
                              onClick={() => hook.handleMarkFailed(practice.practiceId, practice.studentName)}
                              className="w-full text-left px-4 py-2 text-sm text-error-600 dark:text-error-400 hover:bg-bg-subtle dark:hover:bg-gray-700"
                            >
                              Marcar Reprobado
                            </button>
                            <button
                              onClick={() => hook.handleUnfreeze(practice.practiceId)}
                              className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-bg-subtle dark:hover:bg-gray-700"
                            >
                              Descongelar
                            </button>
                            <button
                              onClick={() => hook.handleGrantExtension(practice.practiceId, practice.studentName)}
                              className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-bg-subtle dark:hover:bg-gray-700"
                            >
                              Otorgar Extensión
                            </button>
                            <button
                              onClick={() => hook.handleRevokeExtension(practice.practiceId)}
                              className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-bg-subtle dark:hover:bg-gray-700"
                            >
                              Revocar Extensión
                            </button>
                            <button
                              onClick={() => hook.handleOpenCommittee(practice.practiceId, practice.studentName)}
                              className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-bg-subtle dark:hover:bg-gray-700"
                            >
                              Gestionar Comité
                            </button>
                            <div className="border-t border-border-default dark:border-border-dark" />
                            <button
                              onClick={() => hook.handleViewAudit(practice.practiceId)}
                              className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-bg-subtle dark:hover:bg-gray-700"
                            >
                              Ver Auditoría
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden flex flex-col gap-4">
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
              <p><span className="font-medium">Período:</span> {practice.periodName}</p>
              <p><span className="font-medium">Carrera:</span> {practice.careerName}</p>
              <p><span className="font-medium">Tipo:</span> {practice.practiceTypeName}</p>
            </div>
            {/* Evaluation scores */}
            <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
              <div className="text-center p-2 rounded bg-bg-subtle dark:bg-gray-700">
                <p className="text-text-tertiary">Inst.</p>
                <p className="font-bold text-text-primary">
                  {practice.evaluations.INSTITUCIONAL?.grade != null ? `${practice.evaluations.INSTITUCIONAL.grade}` : '-'}
                </p>
              </div>
              <div className="text-center p-2 rounded bg-bg-subtle dark:bg-gray-700">
                <p className="text-text-tertiary">Acad.</p>
                <p className="font-bold text-text-primary">
                  {practice.evaluations.ACADEMICO?.grade != null ? `${practice.evaluations.ACADEMICO.grade}` : '-'}
                </p>
              </div>
              <div className="text-center p-2 rounded bg-bg-subtle dark:bg-gray-700">
                <p className="text-text-tertiary">Comité</p>
                <p className="font-bold text-text-primary">
                  {practice.evaluations.COMITE?.grade != null ? `${practice.evaluations.COMITE.grade}` : '-'}
                </p>
              </div>
            </div>
            <div className="flex justify-between items-center text-sm mb-3">
              <span className="text-text-secondary">Nota Final:</span>
              <span className="font-bold text-brand-500">
                {practice.finalGrade != null ? `${Math.round((practice.finalGrade / evalConfig.score.displayScale) * 100)}%` : '-'}
              </span>
            </div>
            {/* Mobile actions */}
            {!hook.isReadOnly && (
              <div className="pt-3 border-t border-border-default dark:border-border-dark flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => hook.handleOpenEvaluation(practice, 'INSTITUCIONAL')}>
                  Evaluar
                </Button>
                <Button size="sm" variant="outline" onClick={() => hook.handleViewStudentDetail(practice)}>
                  <EyeIcon className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={hook.currentPage}
          totalPages={totalPages}
          totalItems={hook.filteredPractices.length}
          itemsPerPage={hook.itemsPerPage}
          onPageChange={hook.setCurrentPage}
          onItemsPerPageChange={(items) => { hook.setItemsPerPage(items); hook.setCurrentPage(1); }}
          itemsPerPageOptions={[10, 25, 50]}
        />
      )}
    </>
  );

  // ─── Render: Culmination tab ────────────────────────────
  const renderCulminationTab = () => (
    <>
      <StatsCardsGrid
        columns={4}
        stats={[
          { title: 'Total', value: hook.culminationStats.total },
          { title: 'Pendientes', value: hook.culminationStats.pending, color: 'warning' },
          { title: 'Aprobados', value: hook.culminationStats.approved, color: 'success' },
          { title: 'Certificados', value: hook.culminationStats.certified, color: 'primary' },
        ]}
      />

      {/* Desktop table */}
      <div className="hidden md:block overflow-hidden rounded-lg border border-border-default dark:border-border-dark">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell isHeader>Estudiante</TableCell>
              <TableCell isHeader>Carrera</TableCell>
              <TableCell isHeader>Institución</TableCell>
              <TableCell isHeader>Período</TableCell>
              <TableCell isHeader className="text-center">Horas</TableCell>
              <TableCell isHeader className="text-center">Estado</TableCell>
              <TableCell isHeader className="text-center">Acciones</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map(practice => (
              <TableRow key={practice.practiceId} className="hover:bg-bg-subtle/50">
                <TableCell>
                  <div className="font-medium text-text-primary dark:text-text-emphasis">
                    {practice.studentName}
                  </div>
                  <div className="text-xs text-text-tertiary">{practice.studentCi}</div>
                </TableCell>
                <TableCell className="text-sm text-text-secondary">{practice.careerName}</TableCell>
                <TableCell className="text-sm text-text-secondary">{practice.institutionName}</TableCell>
                <TableCell className="text-sm text-text-secondary">{practice.periodName}</TableCell>
                <TableCell className="text-center text-sm tabular-nums">{practice.totalHours}h</TableCell>
                <TableCell className="text-center">{getCulminationBadge(practice.culminationStatus)}</TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center flex-wrap gap-1">
                    <Button size="sm" variant="outline" onClick={() => hook.handleViewStudentDetail(practice)}>
                      <EyeIcon className="w-4 h-4" />
                    </Button>
                    {practice.culminationStatus === 'pending' && practice.result === 'approved' && (
                      <Button size="sm" variant="outline" onClick={() => hook.handleApprove(practice)}>
                        Aprobar
                      </Button>
                    )}
                    {practice.culminationStatus === 'approved' && (
                      <Button size="sm" onClick={() => hook.handleGenerateCertificate(practice)}>
                        Certificar
                      </Button>
                    )}
                    {practice.culminationStatus === 'certified' && (
                      <Button size="sm" variant="outline" onClick={() => hook.handleDownloadPdf(practice)}>
                        <DownloadIcon className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden flex flex-col gap-4">
        {paginatedData.map(practice => (
          <div key={practice.practiceId} className="bg-white dark:bg-gray-800 rounded-lg border border-border-default dark:border-border-dark p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="min-w-0">
                <p className="font-medium text-text-primary dark:text-text-emphasis truncate">{practice.studentName}</p>
                <p className="text-xs text-text-tertiary">{practice.studentCi}</p>
              </div>
              {getCulminationBadge(practice.culminationStatus)}
            </div>
            <div className="space-y-1 text-xs text-text-secondary mb-3">
              <p><span className="font-medium">Carrera:</span> {practice.careerName}</p>
              <p><span className="font-medium">Institución:</span> {practice.institutionName}</p>
              <p><span className="font-medium">Horas:</span> {practice.totalHours}h</p>
            </div>
            {practice.certificateNumber && (
              <p className="text-xs text-brand-600 dark:text-brand-400 mb-3">
                Certificado: {practice.certificateNumber}
              </p>
            )}
            <div className="pt-3 border-t border-border-default dark:border-border-dark flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => hook.handleViewStudentDetail(practice)}>
                <EyeIcon className="w-4 h-4" />
              </Button>
              {practice.culminationStatus === 'pending' && practice.result === 'approved' && (
                <Button size="sm" variant="outline" onClick={() => hook.handleApprove(practice)}>Aprobar</Button>
              )}
              {practice.culminationStatus === 'approved' && (
                <Button size="sm" onClick={() => hook.handleGenerateCertificate(practice)}>Certificar</Button>
              )}
              {practice.culminationStatus === 'certified' && (
                <Button size="sm" variant="outline" onClick={() => hook.handleDownloadPdf(practice)}>
                  <DownloadIcon className="w-4 h-4" /> PDF
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={hook.currentPage}
          totalPages={totalPages}
          totalItems={hook.filteredPractices.length}
          itemsPerPage={hook.itemsPerPage}
          onPageChange={hook.setCurrentPage}
          onItemsPerPageChange={(items) => { hook.setItemsPerPage(items); hook.setCurrentPage(1); }}
          itemsPerPageOptions={[10, 25, 50]}
        />
      )}
    </>
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
              tabsState.activeTab === 'culmination' ? (
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

      {hook.selectedPracticeForEval && (
        <EvaluationModal
          isOpen={hook.evalModalOpen}
          onClose={hook.handleCloseEvaluationModal}
          practiceId={hook.selectedPracticeForEval.practiceId}
          evaluatorType={hook.selectedEvaluatorType}
          evaluationId={hook.editingEvaluationId}
          onSuccess={hook.handleEvaluationSuccess}
        />
      )}

      <EvaluationDetailModal
        isOpen={hook.detailModalOpen}
        onClose={hook.handleCloseDetailModal}
        evaluationId={hook.selectedEvaluationId}
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
    </>
  );
}
