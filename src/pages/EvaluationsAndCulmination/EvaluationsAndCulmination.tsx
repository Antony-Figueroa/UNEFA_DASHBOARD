/**
 * @file EvaluationsAndCulmination.tsx
 * @description Página principal del módulo de Evaluaciones y Culminación.
 * Orquestra los componentes del feature, delegando toda la lógica al hook.
 */

import { useState, useMemo } from 'react';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import Button from '../../components/ui/button/Button';
import Badge from '../../components/ui/badge/Badge';
import { Table, TableBody, TableCell, TableHeader, TableRow, Pagination } from '../../components/ui/table';
import { EmptyState } from '../../components/ui/table/EmptyState';
import { TableSkeleton } from '../../components/ui/skeleton';
import UnifiedDialog from '../../components/ui/dialog/UnifiedDialog';
import { DownloadIcon, CheckCircleIcon, EyeIcon } from '../../icons';
import { StudentDetailModal } from '../../features/student-detail/components/StudentDetailModal';
import { EvaluationModal } from '../../features/evaluations/components/EvaluationModal';
import EvaluationDetailModal from '../../features/evaluations/components/EvaluationDetailModal';
import { EvaluationCell } from '../../features/evaluations-culmination/components/EvaluationCell';
import { StatsCardsGrid } from '../../features/evaluations-culmination/components/StatsCards';
import { EvaluationFilters } from '../../features/evaluations-culmination/components/EvaluationFilters';
import { useEvaluationsCulmination } from '../../features/evaluations-culmination/hooks/useEvaluationsCulmination';
import type { EvaluatorType } from '../../features/evaluations/types';
import type { PracticeWithEvaluations } from '../../features/evaluations-culmination/types';
import {
  getResultLabel,
  RESULT_OPTIONS,
  CULMINATION_STATUS_OPTIONS,
} from '../../features/evaluations-culmination/types';

// ─── Tabs ─────────────────────────────────────────────────
type TabType = 'evaluations' | 'results' | 'culmination';
const TABS: { id: TabType; label: string }[] = [
  { id: 'evaluations', label: 'Evaluaciones' },
  { id: 'results', label: 'Resultados' },
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
  const [activeTab, setActiveTab] = useState<TabType>('evaluations');

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
                  />
                </TableCell>
                <TableCell className="text-center">
                  <EvaluationCell
                    evaluation={practice.evaluations.ACADEMICO}
                    evaluatorType="ACADEMICO"
                    onEvaluate={(type, evalId) => hook.handleOpenEvaluation(practice, type, evalId)}
                    onViewDetails={(id) => hook.handleViewEvaluationDetails(id)}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <EvaluationCell
                    evaluation={practice.evaluations.COMITE}
                    evaluatorType="COMITE"
                    onEvaluate={(type, evalId) => hook.handleOpenEvaluation(practice, type, evalId)}
                    onViewDetails={(id) => hook.handleViewEvaluationDetails(id)}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-lg font-bold text-brand-500">
                    {practice.finalGrade?.toFixed(1) ?? '-'}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  {getStatusBadge(practice.evaluationStatus)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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

  // ─── Render: Results tab ────────────────────────────────
  const renderResultsTab = () => {
    const resultsFiltered = hook.filteredPractices.filter(p =>
      hook.filters.result ? p.result === hook.filters.result : true
    );
    const resultsPaginated = resultsFiltered.slice(
      (hook.currentPage - 1) * hook.itemsPerPage,
      hook.currentPage * hook.itemsPerPage
    );
    const resultsTotalPages = Math.ceil(resultsFiltered.length / hook.itemsPerPage);

    return (
      <>
        <StatsCardsGrid
          stats={[
            { title: 'Total', value: hook.evaluationStats.total },
            { title: 'Aprobados', value: hook.evaluationStats.approved, color: 'success',
              subtitle: `${hook.evaluationStats.total > 0 ? ((hook.evaluationStats.approved / hook.evaluationStats.total) * 100).toFixed(1) : 0}%` },
            { title: 'Reprobados', value: hook.evaluationStats.failed, color: 'warning',
              subtitle: `${hook.evaluationStats.total > 0 ? ((hook.evaluationStats.failed / hook.evaluationStats.total) * 100).toFixed(1) : 0}%` },
          ]}
        />

        <div className="flex flex-wrap gap-4 mb-4">
          <select
            value={hook.filters.result || ''}
            onChange={(e) => hook.updateFilter('result', e.target.value)}
            className="w-40 px-3 py-2 border border-border-default dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-sm"
          >
            {RESULT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-lg border border-border-default dark:border-border-dark">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader>Estudiante</TableCell>
                <TableCell isHeader>Período</TableCell>
                <TableCell isHeader>Carrera</TableCell>
                <TableCell isHeader>Tipo</TableCell>
                <TableCell isHeader className="text-center">Nota Final</TableCell>
                <TableCell isHeader className="text-center">Resultado</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resultsPaginated.map(practice => (
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
                    <span className="text-lg font-bold text-brand-500">
                      {practice.finalGrade?.toFixed(1) ?? '-'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {getResultBadge(practice.result)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {resultsTotalPages > 1 && (
          <Pagination
            currentPage={hook.currentPage}
            totalPages={resultsTotalPages}
            totalItems={resultsFiltered.length}
            itemsPerPage={hook.itemsPerPage}
            onPageChange={hook.setCurrentPage}
            onItemsPerPageChange={(items) => { hook.setItemsPerPage(items); hook.setCurrentPage(1); }}
            itemsPerPageOptions={[10, 25, 50]}
          />
        )}
      </>
    );
  };

  // ─── Render: Culmination tab ────────────────────────────
  const renderCulminationTab = () => {
    const culminFiltered = hook.filteredPractices.filter(p =>
      hook.filters.culminationStatus ? p.culminationStatus === hook.filters.culminationStatus : true
    );
    const culminPaginated = culminFiltered.slice(
      (hook.currentPage - 1) * hook.itemsPerPage,
      hook.currentPage * hook.itemsPerPage
    );
    const culminTotalPages = Math.ceil(culminFiltered.length / hook.itemsPerPage);

    return (
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

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-6">
          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Buscar estudiante, cédula, institución..."
              value={hook.searchTerm}
              onChange={(e) => { hook.setSearchTerm(e.target.value); hook.setCurrentPage(1); }}
              className="w-full px-4 py-2 border border-border-default dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <select
            value={hook.filters.culminationStatus || ''}
            onChange={(e) => hook.updateFilter('culminationStatus', e.target.value)}
            className="w-full sm:w-44 px-3 py-2 border border-border-default dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-sm"
          >
            {CULMINATION_STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={String(hook.filters.periodId || '')}
            onChange={(e) => hook.updateFilter('periodId', e.target.value)}
            className="w-full sm:w-40 px-3 py-2 border border-border-default dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-sm"
          >
            {periodOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

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
              {culminPaginated.map(practice => (
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
                    <div className="flex items-center justify-center gap-2">
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
          {culminPaginated.map(practice => (
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
              <div className="pt-3 border-t border-border-default dark:border-border-dark flex gap-2">
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

        {culminTotalPages > 1 && (
          <Pagination
            currentPage={hook.currentPage}
            totalPages={culminTotalPages}
            totalItems={culminFiltered.length}
            itemsPerPage={hook.itemsPerPage}
            onPageChange={hook.setCurrentPage}
            onItemsPerPageChange={(items) => { hook.setItemsPerPage(items); hook.setCurrentPage(1); }}
            itemsPerPageOptions={[10, 25, 50]}
          />
        )}
      </>
    );
  };

  // ─── Tab content switch ─────────────────────────────────
  const renderTabContent = () => {
    if (hook.loading) {
      return <TableSkeleton columns={activeTab === 'evaluations' ? 9 : activeTab === 'results' ? 6 : 7} rows={10} />;
    }

    if (hook.filteredPractices.length === 0) {
      return (
        <EmptyState
          title="No hay registros"
          description="No se encontraron prácticas con los filtros aplicados."
        />
      );
    }

    switch (activeTab) {
      case 'evaluations': return renderEvaluationsTab();
      case 'results': return renderResultsTab();
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
        <div className="border-b border-border-default dark:border-border-dark">
          <nav className="-mb-px flex space-x-8">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-300 dark:text-text-tertiary dark:hover:text-white'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Filtros y contenido */}
        <ComponentCard title="Listado de Prácticas">
          {activeTab !== 'culmination' && (
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
            />
          )}

          {renderTabContent()}
        </ComponentCard>
      </div>

      {/* Modales */}
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
    </>
  );
}
