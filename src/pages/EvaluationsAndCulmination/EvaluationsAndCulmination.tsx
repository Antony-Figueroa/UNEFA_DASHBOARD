/**
 * @file Página principal del módulo de Evaluaciones y Culminación
 * @description Página unificada con pestañas para evaluar, ver resultados y gestionar culminación
 */

import { useState, useEffect, useMemo } from 'react';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import Button from '../../components/ui/button/Button';
import Badge from '../../components/ui/badge/Badge';
import { Table, TableBody, TableCell, TableHeader, TableRow, Pagination } from '../../components/ui/table';
import { EmptyState } from '../../components/ui/table/EmptyState';
import { TableSkeleton } from '../../components/ui/skeleton';
import InputField from '../../components/form/input/InputField';
import CustomSelect from '../../components/form/CustomSelect';
import UnifiedDialog from '../../components/ui/dialog/UnifiedDialog';
import { DownloadIcon, CheckCircleIcon, TimeIcon, AlertIcon, EyeIcon } from '../../icons';
import toast from 'react-hot-toast';
import {
  PracticeWithEvaluations,
  PracticeFilters,
  EvaluationStats,
  CulminationStats,
  calculateFinalGrade,
  getPracticeResult,
  getResultLabel,
  RESULT_OPTIONS,
  CULMINATION_STATUS_OPTIONS,
  EVALUATION_STATUS_OPTIONS,
  STATUS_COLORS
} from '../../features/evaluations-culmination/types';
import { evaluationsCulminationService } from '../../features/evaluations-culmination/services/evaluationsCulminationService';
import { matchSearch } from '../../utils/searchNormalizer';
import { generateCertificatePDF } from '../../components/ui/pdf/templates/CertificatePDF';
import { EvaluationModal } from '../../features/evaluations/components/EvaluationModal';
import EvaluationDetailModal from '../../features/evaluations/components/EvaluationDetailModal';
import { EvaluatorType } from '../../features/evaluations/types';
import { StudentDetailModal } from '../../features/student-detail/components/StudentDetailModal';

// Pestañas del módulo
type TabType = 'evaluations' | 'results' | 'culmination';

// Configuración de tabs
const TABS = [
  { id: 'evaluations' as const, label: 'Evaluaciones' },
  { id: 'results' as const, label: 'Resultados' },
  { id: 'culmination' as const, label: 'Culminación' }
];

// Componente para las tarjetas de estadísticas
const StatCard = ({ 
  title, 
  value, 
  color = 'default',
  subtitle 
}: { 
  title: string; 
  value: number | string; 
  color?: 'default' | 'warning' | 'success' | 'primary';
  subtitle?: string 
}) => {
  const colorClasses = {
    default: 'bg-bg-surface dark:bg-bg-dark-surface',
    warning: 'bg-warning-50 dark:bg-warning-500/10',
    success: 'bg-success-50 dark:bg-success-500/10',
    primary: 'bg-brand-50 dark:bg-brand-500/10'
  };
  
  const iconColorClasses = {
    default: 'text-text-secondary',
    warning: 'text-warning-600',
    success: 'text-success-600',
    primary: 'text-brand-600'
  };

  return (
    <div className={`rounded-xl border border-border-default dark:border-border-dark p-5 ${colorClasses[color]}`}>
      <div className="flex items-center gap-3">
        <div className={`flex items-center justify-center w-10 h-10 rounded-lg bg-white dark:bg-gray-800 ${color !== 'default' ? `bg-${color}-100 dark:bg-${color}-900/20` : ''}`}>
          <span className={`text-xl font-bold ${iconColorClasses[color]}`}>{value}</span>
        </div>
        <div>
          <p className="text-xs text-text-tertiary">{title}</p>
          {subtitle && <p className="text-xs text-text-tertiary">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
};

export default function EvaluationsAndCulminationPage() {
  // Estado de la página
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('evaluations');
  
  // Datos
  const [practices, setPractices] = useState<PracticeWithEvaluations[]>([]);
  const [meta, setMeta] = useState<{
    total: number;
    periods: { id: number; name: string }[];
    careers: { id: number; name: string }[];
    practiceTypes: { id: number; name: string }[];
  }>({ total: 0, periods: [], careers: [], practiceTypes: [] });
  
  // Filtros
  const [filters, setFilters] = useState<PracticeFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Diálogos
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Modal de evaluación
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [selectedPracticeForEval, setSelectedPracticeForEval] = useState<PracticeWithEvaluations | null>(null);
  const [selectedEvaluatorType, setSelectedEvaluatorType] = useState<EvaluatorType>('INSTITUCIONAL');

  // Modal de detalles de evaluación
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<number | null>(null);

  // Modal de detalle del estudiante
  const [studentDetailOpen, setStudentDetailOpen] = useState(false);
  const [selectedStudentPracticeId, setSelectedStudentPracticeId] = useState<number | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState('');

  // Cargar datos
  const fetchPractices = async () => {
    setLoading(true);
    try {
      const response = await evaluationsCulminationService.getPractices({
        ...filters,
        search: searchTerm || undefined
      });
      
      if (response.success) {
        setPractices(response.data);
        setMeta(response.meta || { total: 0, periods: [], careers: [], practiceTypes: [] });
      }
    } catch (error) {
      console.error('[EvaluationsCulmination] Error fetching practices:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPractices();
  }, [filters]);

  // Opciones para los filtros
  const periodOptions = useMemo(() => {
    const periods = Array.isArray(meta.periods) ? meta.periods : [];
    return [
      { value: '', label: 'Todos los períodos' },
      ...periods.map(p => ({ value: String(p.id), label: p.name }))
    ];
  }, [meta.periods]);

  const careerOptions = useMemo(() => {
    const careers = Array.isArray(meta.careers) ? meta.careers : [];
    return [
      { value: '', label: 'Todas las carreras' },
      ...careers.map(c => ({ value: String(c.id), label: c.name }))
    ];
  }, [meta.careers]);

  const practiceTypeOptions = useMemo(() => {
    const types = Array.isArray(meta.practiceTypes) ? meta.practiceTypes : [];
    return [
      { value: '', label: 'Todos los tipos' },
      ...types.map(t => ({ value: String(t.id), label: t.name }))
    ];
  }, [meta.practiceTypes]);

  // Calcular datos paginados
  const getPaginatedData = (data: PracticeWithEvaluations[]) => {
    const list = Array.isArray(data) ? data : [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    return list.slice(startIndex, startIndex + itemsPerPage);
  };
  const filteredPractices = useMemo(() => {
    const list = Array.isArray(practices) ? practices : [];
    if (!searchTerm) return list;
    return list.filter(p =>
      matchSearch(p.studentName, searchTerm) ||
      matchSearch(p.studentCi, searchTerm) ||
      matchSearch(p.institutionName, searchTerm)
    );
  }, [practices, searchTerm]);

  // Calcular estadísticas
  const evaluationStats = useMemo((): EvaluationStats => {
    const list = Array.isArray(practices) ? practices : [];
    const total = list.length;
    const completed = list.filter(p => p.evaluationStatus === 'completed').length;
    const partial = list.filter(p => p.evaluationStatus === 'partial').length;
    const pending = list.filter(p => p.evaluationStatus === 'pending').length;
    const approved = list.filter(p => p.result === 'approved').length;
    const failed = list.filter(p => p.result === 'failed').length;
    return { total, completed, partial, pending, approved, failed };
  }, [practices]);

  const culminationStats = useMemo((): CulminationStats => {
    const list = Array.isArray(practices) ? practices : [];
    const total = list.length;
    const pending = list.filter(p => p.culminationStatus === 'pending').length;
    const approved = list.filter(p => p.culminationStatus === 'approved').length;
    const certified = list.filter(p => p.culminationStatus === 'certified').length;
    return { total, pending, approved, certified };
  }, [practices]);

  // Handlers de acciones
  const handleApprove = async (practice: PracticeWithEvaluations) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Aprobar Culminación',
      message: `¿Está seguro de aprobar la culminación de prácticas de ${practice.studentName}?`,
      onConfirm: async () => {
        try {
          await evaluationsCulminationService.approveCulmination(practice.practiceId);
          toast.success('Culminación aprobada exitosamente');
          fetchPractices();
        } catch (error) {
          toast.error('Error al aprobar culminación');
        } finally {
          setConfirmDialog(null);
        }
      }
    });
  };

  const handleGenerateCertificate = async (practice: PracticeWithEvaluations) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Generar Certificado',
      message: `¿Desea generar el certificado de prácticas para ${practice.studentName}?`,
      onConfirm: async () => {
        try {
          const response = await evaluationsCulminationService.generateCertificate(practice.practiceId);
          if (response.success) {
            toast.success(`Certificado generado: ${response.certificate.number}`);
            fetchPractices();
          }
        } catch (error) {
          toast.error('Error al generar certificado');
        } finally {
          setConfirmDialog(null);
        }
      }
    });
  };

  const handleDownloadPdf = async (practice: PracticeWithEvaluations) => {
    try {
      toast.loading('Generando PDF...', { id: 'pdf-download' });
      
      const blob = await generateCertificatePDF(
        {
          id: String(practice.practiceId),
          studentCi: practice.studentCi,
          studentName: practice.studentName,
          careerId: practice.careerId,
          careerName: practice.careerName,
          institutionId: practice.institutionId,
          institutionName: practice.institutionName,
          period: practice.periodName,
          practiceType: practice.practiceTypeName,
          startDate: practice.startDate,
          endDate: practice.endDate,
          totalHours: practice.totalHours,
          status: practice.culminationStatus,
          certificateNumber: practice.certificateNumber,
          certifiedAt: practice.certifiedAt
        },
        practice.certificateNumber || 'N/A'
      );
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Certificado_${practice.studentName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('PDF descargado exitosamente', { id: 'pdf-download' });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Error al descargar el PDF', { id: 'pdf-download' });
    }
  };

  // Limpiar filtros
  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Actualizar filtro
  const updateFilter = (key: keyof PracticeFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value || undefined }));
    setCurrentPage(1); // Reset page when filter changes
  };

  // Abrir modal de evaluación
  const handleOpenEvaluation = (practice: PracticeWithEvaluations, type: 'INSTITUCIONAL' | 'ACADEMICO' | 'COMITE') => {
    setSelectedPracticeForEval(practice);
    setSelectedEvaluatorType(type);
    setEvalModalOpen(true);
  };

  // Ver detalles de evaluación
  const handleViewEvaluationDetails = (evaluationId: number) => {
    setSelectedEvaluationId(evaluationId);
    setDetailModalOpen(true);
  };

  // Callback cuando se guarda una evaluación
  const handleEvaluationSuccess = () => {
    setEvalModalOpen(false);
    setSelectedPracticeForEval(null);
    fetchPractices(); // Recargar datos
    toast.success('Evaluación guardada exitosamente');
  };

  // Renderizar contenido según pestaña activa
  const renderTabContent = () => {
    if (loading) {
      return <TableSkeleton columns={activeTab === 'evaluations' ? 9 : activeTab === 'results' ? 6 : 7} rows={10} />;
    }

    if (filteredPractices.length === 0) {
      return (
        <EmptyState 
          title="No hay registros" 
          description="No se encontraron prácticas con los filtros aplicados." 
        />
      );
    }

    switch (activeTab) {
      case 'evaluations':
        return renderEvaluationsTab();
      case 'results':
        return renderResultsTab();
      case 'culmination':
        return renderCulminationTab();
      default:
        return null;
    }
  };

  // Pestaña 1: Evaluaciones
  const renderEvaluationsTab = () => (
    <>
      <div className="overflow-hidden rounded-lg border border-border-default dark:border-border-dark">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell isHeader>Estudiante</TableCell>
              <TableCell isHeader>Período</TableCell>
              <TableCell isHeader>Carrera</TableCell>
              <TableCell isHeader>Tipo de Práctica</TableCell>
              <TableCell isHeader>Institucional (40%)</TableCell>
              <TableCell isHeader>Académica (30%)</TableCell>
              <TableCell isHeader>Comité (30%)</TableCell>
              <TableCell isHeader>Nota Final</TableCell>
              <TableCell isHeader>Estado</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPractices
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map(practice => (
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
                  {renderEvaluationCell(practice, 'INSTITUCIONAL')}
                </TableCell>
                <TableCell className="text-center">
                  {renderEvaluationCell(practice, 'ACADEMICO')}
                </TableCell>
                <TableCell className="text-center">
                  {renderEvaluationCell(practice, 'COMITE')}
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-lg font-bold text-brand-500">
                    {practice.finalGrade?.toFixed(2) || '-'}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                    <Badge color="light" variant="light">
                      Pendiente
                    </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {filteredPractices.length > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredPractices.length / itemsPerPage)}
          totalItems={filteredPractices.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(items) => { setItemsPerPage(items); setCurrentPage(1); }}
          itemsPerPageOptions={[10, 25, 50]}
        />
      )}
    </>
  );

  // Celda de evaluación
  const renderEvaluationCell = (practice: PracticeWithEvaluations, type: 'INSTITUCIONAL' | 'ACADEMICO' | 'COMITE') => {
    const evalData = practice.evaluations[type];
    
    if (evalData.completed) {
      return (
        <div className="flex items-center gap-1">
          <button
            onClick={() => evalData.evaluationId && handleViewEvaluationDetails(evalData.evaluationId)}
            className="flex items-center gap-1 px-2 py-1.5 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 transition-colors"
            title="Ver detalles"
          >
            <EyeIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenEvaluation(practice, type)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 transition-colors"
            title={`Evaluador: ${evalData.evaluatorName}`}
          >
            <CheckCircleIcon className="w-4 h-4" />
            <span>{evalData.score.toFixed(1)}</span>
          </button>
        </div>
      );
    }
    
    return (
      <button
        onClick={() => handleOpenEvaluation(practice, type)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-brand-100 hover:text-brand-600 transition-colors"
      >
        <TimeIcon className="w-4 h-4" />
        <span>Pendiente</span>
      </button>
    );
  };

  // Badge de estado de evaluación
  const renderEvaluationStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge color="success" variant="light">
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

  // Pestaña 2: Resultados
  const renderResultsTab = () => {
    const resultsFiltered = Array.isArray(filteredPractices) 
      ? filteredPractices.filter(p => filters.result ? p.result === filters.result : true)
      : [];

    return (
      <>
        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard 
            title="Total" 
            value={evaluationStats.total} 
            subtitle="100%"
          />
          <StatCard 
            title="Aprobados" 
            value={evaluationStats.approved} 
            color="success"
            subtitle={`${evaluationStats.total > 0 ? ((evaluationStats.approved / evaluationStats.total) * 100).toFixed(1) : 0}%`}
          />
          <StatCard 
            title="Reprobados" 
            value={evaluationStats.failed} 
            color="warning"
            subtitle={`${evaluationStats.total > 0 ? ((evaluationStats.failed / evaluationStats.total) * 100).toFixed(1) : 0}%`}
          />
        </div>

        {/* Filtro de resultado */}
        <div className="flex flex-wrap gap-4 mb-4">
          <CustomSelect
            options={RESULT_OPTIONS}
            value={filters.result || ''}
            onChange={(v) => updateFilter('result', v as string)}
            className="w-40"
          />
        </div>

        {/* Tabla */}
        <div className="overflow-hidden rounded-lg border border-border-default dark:border-border-dark">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader>Estudiante</TableCell>
                <TableCell isHeader>Período</TableCell>
                <TableCell isHeader>Carrera</TableCell>
                <TableCell isHeader>Tipo de Práctica</TableCell>
                <TableCell isHeader>Nota Final</TableCell>
                <TableCell isHeader>Resultado</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resultsFiltered
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map(practice => (
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
                        {practice.finalGrade?.toFixed(2) || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        color={practice.result === 'approved' ? 'success' : practice.result === 'failed' ? 'error' : 'light'} 
                        variant="light"
                      >
                        {getResultLabel(practice.result)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
        {resultsFiltered.length > itemsPerPage && (
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(resultsFiltered.length / itemsPerPage)}
            totalItems={resultsFiltered.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(items) => { setItemsPerPage(items); setCurrentPage(1); }}
            itemsPerPageOptions={[10, 25, 50]}
          />
        )}
      </>
    );
  };
  const renderCulminationTab = () => {
    // Filtrar localmente por búsqueda
    const culminFiltered = Array.isArray(filteredPractices) 
      ? filteredPractices.filter(p => filters.culminationStatus ? p.culminationStatus === filters.culminationStatus : true)
      : [];

    return (
      <>
        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <StatCard 
            title="Total" 
            value={culminationStats.total} 
          />
          <StatCard 
            title="Pendientes" 
            value={culminationStats.pending} 
            color="warning"
          />
          <StatCard 
            title="Aprobados" 
            value={culminationStats.approved} 
            color="success"
          />
          <StatCard 
            title="Certificados" 
            value={culminationStats.certified} 
            color="primary"
          />
        </div>

        {/* Filtros */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-6">
          <div className="w-full sm:w-64">
            <InputField
              type="text"
              placeholder="Buscar estudiante, cédula, institución..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <CustomSelect
            options={CULMINATION_STATUS_OPTIONS}
            value={filters.culminationStatus || ''}
            onChange={(v) => updateFilter('culminationStatus', v as string)}
            className="w-full sm:w-44"
          />
          <CustomSelect
            options={periodOptions}
            value={String(filters.periodId || '')}
            onChange={(v) => updateFilter('periodId', v as string)}
            className="w-full sm:w-40"
          />
        </div>

        {/* Tabla - Desktop */}
        <div className="hidden md:block overflow-hidden rounded-lg border border-border-default dark:border-border-dark">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader>Estudiante</TableCell>
                <TableCell isHeader>Carrera</TableCell>
                <TableCell isHeader>Institución</TableCell>
                <TableCell isHeader>Período</TableCell>
                <TableCell isHeader>Horas</TableCell>
                <TableCell isHeader>Estado</TableCell>
                <TableCell isHeader>Acciones</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {culminFiltered.map(practice => (
                <TableRow key={practice.practiceId} className="hover:bg-bg-subtle/50 dark:hover:bg-bg-dark-subtle/50">
                  <TableCell>
                    <div className="font-medium text-text-primary dark:text-text-emphasis">
                      {practice.studentName}
                    </div>
                    <div className="text-xs text-text-tertiary">{practice.studentCi}</div>
                  </TableCell>
                  <TableCell className="text-text-secondary dark:text-text-tertiary text-sm">
                    {practice.careerName}
                  </TableCell>
                  <TableCell className="text-text-secondary dark:text-text-tertiary text-sm">
                    {practice.institutionName}
                  </TableCell>
                  <TableCell className="text-text-secondary dark:text-text-tertiary text-sm">
                    {practice.periodName}
                  </TableCell>
                  <TableCell className="text-text-secondary dark:text-text-tertiary text-sm tabular-nums">
                    {practice.totalHours}h
                  </TableCell>
                  <TableCell>
                    <Badge 
                      color={practice.culminationStatus === 'approved' ? 'success' : practice.culminationStatus === 'certified' ? 'primary' : 'warning'} 
                      variant="light"
                      shape="rounded"
                    >
                      {practice.culminationStatus === 'approved' ? 'Aprobado' : practice.culminationStatus === 'certified' ? 'Certificado' : 'Pendiente'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          setSelectedStudentPracticeId(practice.practiceId);
                          setSelectedStudentName(practice.studentName);
                          setStudentDetailOpen(true);
                        }}
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                      {/* Solo mostrar Aprobar si tiene resultado de evaluaciones (aprobado) */}
                      {practice.culminationStatus === 'pending' && practice.result === 'approved' && (
                        <Button size="sm" variant="outline" onClick={() => handleApprove(practice)}>
                          Aprobar
                        </Button>
                      )}
                      {practice.culminationStatus === 'approved' && (
                        <Button size="sm" onClick={() => handleGenerateCertificate(practice)}>
                          Certificar
                        </Button>
                      )}
                      {practice.culminationStatus === 'certified' && (
                        <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(practice)} startIcon={<DownloadIcon className="w-4 h-4" />}>
                          PDF
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Cards - Mobile */}
        <div className="md:hidden flex flex-col gap-4">
          {culminFiltered.map(practice => (
            <div key={practice.practiceId} className="bg-bg-surface dark:bg-bg-dark-surface rounded-lg border border-border-default dark:border-border-dark p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-medium text-text-primary dark:text-text-emphasis">{practice.studentName}</p>
                  <p className="text-xs text-text-tertiary">{practice.studentCi}</p>
                </div>
                <Badge 
                  color={practice.culminationStatus === 'approved' ? 'success' : practice.culminationStatus === 'certified' ? 'primary' : 'warning'} 
                  variant="light"
                  shape="rounded"
                >
                  {practice.culminationStatus === 'approved' ? 'Aprobado' : practice.culminationStatus === 'certified' ? 'Certificado' : 'Pendiente'}
                </Badge>
              </div>
              <div className="space-y-1 text-xs text-text-secondary dark:text-text-tertiary mb-3">
                <p><span className="font-medium">Carrera:</span> {practice.careerName}</p>
                <p><span className="font-medium">Institución:</span> {practice.institutionName}</p>
                <p><span className="font-medium">Horas:</span> {practice.totalHours}h</p>
              </div>
              {practice.certificateNumber && (
                <p className="text-xs text-brand-600 dark:text-brand-400 mb-3">
                  Certificado: {practice.certificateNumber}
                </p>
              )}
              <div className="pt-3 border-t border-border-default dark:border-border-dark">
                {/* Solo mostrar Aprobar si tiene resultado de evaluaciones (aprobado) */}
                {practice.culminationStatus === 'pending' && practice.result === 'approved' && (
                  <Button size="sm" variant="outline" onClick={() => handleApprove(practice)}>Aprobar</Button>
                )}
                {practice.culminationStatus === 'approved' && (
                  <Button size="sm" onClick={() => handleGenerateCertificate(practice)}>Generar Certificado</Button>
                )}
                {practice.culminationStatus === 'certified' && (
                  <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(practice)} startIcon={<DownloadIcon className="w-4 h-4" />}>Descargar PDF</Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Paginación */}
        {culminFiltered.length > itemsPerPage && (
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(culminFiltered.length / itemsPerPage)}
            totalItems={culminFiltered.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(items) => { setItemsPerPage(items); setCurrentPage(1); }}
            itemsPerPageOptions={[10, 25, 50]}
          />
        )}
      </>
    );
  };

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
          <Button variant="outline" onClick={fetchPractices}>
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

        {/* Filtros y Tabla */}
        <ComponentCard title="Listado de Prácticas">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-6">
            <div className="w-full sm:w-64">
              <InputField
                type="text"
                placeholder="Buscar estudiante, cédula, institución..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <CustomSelect
              options={periodOptions}
              value={String(filters.periodId || '')}
              onChange={(v) => updateFilter('periodId', v as string)}
              className="w-full sm:w-44"
            />
            <CustomSelect
              options={careerOptions}
              value={String(filters.careerId || '')}
              onChange={(v) => updateFilter('careerId', v as string)}
              className="w-full sm:w-48"
            />
            <CustomSelect
              options={practiceTypeOptions}
              value={String(filters.practiceTypeId || '')}
              onChange={(v) => updateFilter('practiceTypeId', v as string)}
              className="w-full sm:w-44"
            />
            {Object.keys(filters).length > 0 && (
              <Button variant="ghost" onClick={clearFilters}>
                Limpiar
              </Button>
            )}
          </div>

          {/* Contenido de la pestaña */}
          {renderTabContent()}
        </ComponentCard>
      </div>

      {/* Diálogo de confirmación */}
      <UnifiedDialog
        isOpen={!!confirmDialog}
        onClose={() => setConfirmDialog(null)}
        onConfirm={confirmDialog?.onConfirm || (() => {})}
        title={confirmDialog?.title || ''}
        message={confirmDialog?.message || ''}
        confirmLabel="Confirmar"
        variant="info"
      />

      {/* Modal de Evaluación */}
      {selectedPracticeForEval && (
        <EvaluationModal
          isOpen={evalModalOpen}
          onClose={() => {
            setEvalModalOpen(false);
            setSelectedPracticeForEval(null);
          }}
          practiceId={selectedPracticeForEval.practiceId}
          evaluatorType={selectedEvaluatorType}
          onSuccess={handleEvaluationSuccess}
        />
      )}

      {/* Modal de Detalles de Evaluación */}
      <EvaluationDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedEvaluationId(null);
        }}
        evaluationId={selectedEvaluationId}
      />

      {/* Modal de Detalle del Estudiante */}
      <StudentDetailModal
        isOpen={studentDetailOpen}
        onClose={() => {
          setStudentDetailOpen(false);
          setSelectedStudentPracticeId(null);
          setSelectedStudentName('');
        }}
        practiceId={selectedStudentPracticeId || 0}
        studentName={selectedStudentName}
      />
    </>
  );
}