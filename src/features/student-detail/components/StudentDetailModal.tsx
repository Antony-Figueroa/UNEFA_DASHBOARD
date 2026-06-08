/**
 * @file Modal de Detalle del Estudiante
 * @description Muestra información completa del estudiante con pestañas - Mejorado con sistema de diseño
 */

import { useState, useEffect } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../components/ui/modal';
import Badge from '../../../components/ui/badge/Badge';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '../../../components/ui/table';
import Button from '../../../components/ui/button/Button';
import Checkbox from '../../../components/form/input/Checkbox';
import { 
  FileIcon, 
  DownloadIcon, 
  UserIcon, 
  CheckCircleIcon, 
  AlertIcon, 
  TimeIcon, 
  CalenderIcon, 
  DocsIcon
} from '../../../icons';
import toast from 'react-hot-toast';
import { TOAST_SUCCESS, TOAST_ERROR } from '@/components/ui/dialog/DialogConfig';
import {
  StudentDetail,
  ReportOptions,
  DEFAULT_REPORT_OPTIONS,
  EVALUATION_TYPE_LABELS,
  VISIT_TYPE_LABELS,
  DOCUMENT_STATUS_LABELS
} from '../types';
import { studentDetailService } from '../services/studentDetailService';

const resourceName = 'Reporte';

type DetailTab = 'general' | 'evaluations' | 'visits' | 'documents';

// Configuración de tabs
const TABS = [
  { id: 'general' as const, label: 'Datos Generales' },
  { id: 'evaluations' as const, label: 'Evaluaciones' },
  { id: 'visits' as const, label: 'Visitas' },
  { id: 'documents' as const, label: 'Documentos' }
];

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  practiceId: number;
  studentName: string;
}

/**
 * Componente de información en tarjeta
 */
const InfoCard = ({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) => (
  <div className={`bg-bg-surface dark:bg-bg-dark-surface rounded-xl border border-border-light dark:border-border-dark p-4 ${className}`}>
    <h4 className="font-semibold text-text-primary dark:text-text-emphasis mb-3">{title}</h4>
    {children}
  </div>
);

/**
 * Línea de información con label y valor
 */
const InfoRow = ({ label, value, highlight = false }: { label: string; value: React.ReactNode; highlight?: boolean }) => (
  <div className="flex justify-between items-center py-1.5 border-b border-border-light/50 dark:border-border-dark/50 last:border-0">
    <span className="text-sm text-text-tertiary dark:text-text-tertiary">{label}</span>
    <span className={`text-sm ${highlight ? 'font-semibold text-brand-500' : 'text-text-primary dark:text-text-emphasis'}`}>
      {value}
    </span>
  </div>
);

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  isOpen,
  onClose,
  practiceId,
  studentName
}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('general');
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<StudentDetail | null>(null);
  
  // Estado para opciones de reporte
  const [showReportOptions, setShowReportOptions] = useState(false);
  const [reportOptions, setReportOptions] = useState<ReportOptions>(DEFAULT_REPORT_OPTIONS);
  const [generatingReport, setGeneratingReport] = useState(false);

  // Cargar detalle
  useEffect(() => {
    if (isOpen && practiceId) {
      loadDetail();
    }
  }, [isOpen, practiceId]);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const response = await studentDetailService.getDetail(practiceId);
      if (response.success) {
        setDetail(response.data);
      }
    } catch (error) {
      console.error('[StudentDetail] Error loading:', error);
      toast.error(TOAST_ERROR.load(resourceName));
    } finally {
      setLoading(false);
    }
  };

  // Generar reporte PDF
  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      toast.loading('Generando reporte...', { id: 'report' });
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(TOAST_SUCCESS.created(resourceName), { id: 'report' });
      setShowReportOptions(false);
    } catch (error) {
      console.error('[StudentDetail] Error generating report:', error);
      toast.error(TOAST_ERROR.create(resourceName), { id: 'report' });
    } finally {
      setGeneratingReport(false);
    }
  };

  // Formatear fecha
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-VE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Renderizar contenido según tab
  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin mb-3" />
          <span className="text-sm text-text-secondary">Cargando información...</span>
        </div>
      );
    }

    if (!detail) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
          <UserIcon className="w-12 h-12 mb-3 opacity-50" />
          <span className="text-sm">No hay datos disponibles</span>
        </div>
      );
    }

    switch (activeTab) {
      case 'general':
        return renderGeneralTab();
      case 'evaluations':
        return renderEvaluationsTab();
      case 'visits':
        return renderVisitsTab();
      case 'documents':
        return renderDocumentsTab();
      default:
        return null;
    }
  };

  // Tab: Datos Generales - Mejorado con mejor layout y jerarquía
  const renderGeneralTab = () => {
    if (!detail) return null;
    
    return (
      <div className="space-y-4">
        {/* Header con info clave del estudiante */}
        <div className="bg-brand-50 dark:bg-brand-500/10 rounded-xl p-5 border border-brand-100 dark:border-brand-500/20">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-xl bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-brand-600 dark:text-brand-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-text-primary dark:text-text-emphasis">{detail.student.studentName}</h3>
              <p className="text-base text-text-secondary">C.I: {detail.student.studentCi}</p>
            </div>
            <div className="text-right">
              <Badge color="success" variant="light" className="text-sm px-4 py-2">
                {detail.student.careerName}
              </Badge>
            </div>
          </div>
        </div>

        {/* Grid de información en 2 columnas */}
        <div className="grid grid-cols-2 gap-4">
          {/* Información de la práctica */}
          <InfoCard title="Datos de la Práctica">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <InfoRow label="Período Académico" value={detail.practice.periodName} />
              <InfoRow label="Tipo de Práctica" value={detail.practice.practiceTypeName} />
              <InfoRow label="Institución" value={detail.practice.institutionName} />
              <InfoRow label="Fecha de Inicio" value={formatDate(detail.practice.startDate)} />
              <InfoRow label="Horas Totales" value={`${detail.practice.totalHours}h`} highlight />
              <InfoRow 
                label="Estado" 
                value={
                  <Badge color={detail.practice.practicesStatus === 2 ? 'success' : 'warning'} variant="light">
                    {detail.practice.practicesStatusLabel}
                  </Badge>
                } 
              />
            </div>
          </InfoCard>

          {/* Culminación */}
          <InfoCard title="Estado de Culminación">
            <div className="flex flex-col h-full justify-between">
              <div className="flex items-center gap-3">
                <Badge 
                  color={
                    detail.culmination.status === 'certified' ? 'primary' : 
                    detail.culmination.status === 'approved' ? 'success' : 'warning'
                  } 
                  variant="light"
                  className="text-base px-4 py-2"
                >
                  {detail.culmination.status === 'certified' ? '✓ Certificado' : 
                   detail.culmination.status === 'approved' ? '✓ Aprobado' : '○ Pendiente'}
                </Badge>
              </div>
              {detail.culmination.certificateNumber && (
                <div className="mt-4 pt-4 border-t border-border-light dark:border-border-dark">
                  <p className="text-xs text-text-tertiary">Certificado N°</p>
                  <p className="text-lg font-mono text-brand-500">{detail.culmination.certificateNumber}</p>
                </div>
              )}
            </div>
          </InfoCard>
        </div>
      </div>
    );
  };

  // Tab: Evaluaciones - Mejorado con mejor visualización de scores
  const renderEvaluationsTab = () => {
    if (!detail) return null;
    
    const { evaluations } = detail;
    
    const evalTypes = [
      { key: 'institucional', label: EVALUATION_TYPE_LABELS.INSTITUCIONAL, weight: '40%', color: 'bg-blue-100 dark:bg-blue-500/20', border: 'border-blue-200 dark:border-blue-500/30' },
      { key: 'academico', label: EVALUATION_TYPE_LABELS.ACADEMICO, weight: '30%', color: 'bg-green-100 dark:bg-green-500/20', border: 'border-green-200 dark:border-green-500/30' },
      { key: 'comite', label: EVALUATION_TYPE_LABELS.COMITE, weight: '30%', color: 'bg-purple-100 dark:bg-purple-500/20', border: 'border-purple-200 dark:border-purple-500/30' }
    ] as const;

    return (
      <div className="space-y-4">
        {/* Resumen de estado */}
        <div className="flex items-center justify-between bg-bg-surface dark:bg-bg-dark-surface rounded-lg p-4 border border-border-light dark:border-border-dark">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${evaluations.status === 'completed' ? 'bg-success-500' : evaluations.status === 'partial' ? 'bg-warning-500' : 'bg-gray-300'}`} />
            <div>
              <span className="text-sm font-medium text-text-primary">Estado de Evaluaciones</span>
              <Badge 
                color={evaluations.status === 'completed' ? 'success' : evaluations.status === 'partial' ? 'warning' : 'light'} 
                variant="light" 
                className="ml-2"
              >
                {evaluations.status === 'completed' ? 'Completo' : evaluations.status === 'partial' ? 'Parcial' : 'Pendiente'}
              </Badge>
            </div>
          </div>
          {evaluations.finalGrade !== null && (
            <div className="text-right">
              <span className="text-xs text-text-tertiary block">Nota Final Ponderada</span>
              <span className="text-2xl font-bold text-brand-500">{evaluations.finalGrade.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Cards de evaluaciones */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {evalTypes.map(({ key, label, weight, color, border }) => {
            const evalData = evaluations[key as keyof typeof evaluations] as { completed: boolean; score: number | null } | undefined;
            if (!evalData || typeof evalData === 'string') return null;
            
            return (
              <div key={key} className={`${color} rounded-xl p-4 border ${border}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-text-primary dark:text-text-emphasis">{label}</span>
                  <span className="text-xs bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded text-text-secondary">{weight}</span>
                </div>
                <div className="flex items-center justify-between">
                  {evalData.completed ? (
                    <>
                      <div className="flex items-center gap-1 text-success-600 dark:text-success-400">
                        <CheckCircleIcon className="w-4 h-4" />
                        <span className="text-xs font-medium">Completada</span>
                      </div>
                      <span className="text-xl font-bold text-text-primary dark:text-text-emphasis">
                        {evalData.score?.toFixed(1) || '-'}
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1 text-text-tertiary">
                        <AlertIcon className="w-4 h-4" />
                        <span className="text-xs">Pendiente</span>
                      </div>
                      <span className="text-xl font-bold text-text-tertiary">-</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Leyenda */}
        <div className="text-xs text-text-tertiary bg-bg-subtle dark:bg-bg-dark-subtle rounded-lg p-3">
          <span className="font-medium">Cálculo de nota final:</span> Nota Institucional × 0.40 + Nota Académica × 0.30 + Nota Comité × 0.30
        </div>
      </div>
    );
  };

  // Tab: Visitas - Mejorado con mejor diseño
  const renderVisitsTab = () => {
    if (!detail) return null;
    
    if (detail.visits.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
          <CalenderIcon className="w-12 h-12 mb-3 opacity-50" />
          <span className="text-sm">No hay visitas registradas</span>
          <span className="text-xs text-text-tertiary mt-1">Las visitas de seguimiento aparecerán aquí</span>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {detail.visits.map((visit) => (
          <div key={visit.visitId} className="bg-bg-surface dark:bg-bg-dark-surface rounded-lg p-4 border border-border-light dark:border-border-dark hover:border-brand-200 dark:hover:border-brand-500/30 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center">
                  <CalenderIcon className="w-5 h-5 text-brand-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-primary dark:text-text-emphasis">{formatDate(visit.visitDate)}</span>
                    <Badge color="light" variant="light" className="text-xs">
                      {VISIT_TYPE_LABELS[visit.visitType]}
                    </Badge>
                  </div>
                  {visit.visitCase && (
                    <p className="text-sm text-text-secondary mt-0.5">{visit.visitCase}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-text-secondary">
                  <TimeIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">{visit.hoursWorked}h</span>
                </div>
              </div>
            </div>
            {visit.activitiesPerformed && (
              <div className="mt-3 pt-3 border-t border-border-light dark:border-border-dark">
                <p className="text-xs text-text-tertiary mb-1">Actividades realizadas:</p>
                <p className="text-sm text-text-secondary">{visit.activitiesPerformed}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Tab: Documentos - Mejorado con mejor diseño
  const renderDocumentsTab = () => {
    if (!detail) return null;
    
    if (detail.documents.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
          <DocsIcon className="w-12 h-12 mb-3 opacity-50" />
          <span className="text-sm">No hay documentos subidos</span>
          <span className="text-xs text-text-tertiary mt-1">Los documentos del estudiante aparecerán aquí</span>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {detail.documents.map(doc => (
          <div key={doc.documentId} className="flex items-center justify-between bg-bg-surface dark:bg-bg-dark-surface rounded-lg p-3 border border-border-light dark:border-border-dark hover:border-brand-200 dark:hover:border-brand-500/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <DocsIcon className="w-5 h-5 text-text-secondary" />
              </div>
              <div>
                <p className="font-medium text-text-primary dark:text-text-emphasis text-sm">{doc.documentType}</p>
                <p className="text-xs text-text-tertiary">{doc.fileName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-tertiary">{formatDate(doc.uploadedAt)}</span>
              <Badge 
                color={doc.status === 'APPROVED' ? 'success' : doc.status === 'REJECTED' ? 'error' : 'warning'} 
                variant="light"
                className="text-xs"
              >
                {DOCUMENT_STATUS_LABELS[doc.status]}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Renderizar opciones de reporte
  const renderReportOptions = () => (
    <div className="bg-bg-subtle dark:bg-bg-dark-subtle rounded-xl p-5 border border-border-light dark:border-border-dark">
      <div className="flex items-center gap-2 mb-4">
        <FileIcon className="w-5 h-5 text-brand-500" />
        <h4 className="font-semibold text-text-primary dark:text-text-emphasis">Generar Reporte PDF</h4>
      </div>
      <p className="text-sm text-text-secondary mb-4">Seleccione las secciones que desea incluir en el reporte:</p>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <Checkbox
          label="Datos del Estudiante"
          checked={reportOptions.includePersonalInfo}
          onChange={(checked) => setReportOptions({ ...reportOptions, includePersonalInfo: checked })}
        />
        <Checkbox
          label="Datos de la Práctica"
          checked={reportOptions.includePractice}
          onChange={(checked) => setReportOptions({ ...reportOptions, includePractice: checked })}
        />
        <Checkbox
          label="Evaluaciones"
          checked={reportOptions.includeEvaluations}
          onChange={(checked) => setReportOptions({ ...reportOptions, includeEvaluations: checked })}
        />
        <Checkbox
          label="Visitas de Seguimiento"
          checked={reportOptions.includeVisits}
          onChange={(checked) => setReportOptions({ ...reportOptions, includeVisits: checked })}
        />
        <Checkbox
          label="Documentos"
          checked={reportOptions.includeDocuments}
          onChange={(checked) => setReportOptions({ ...reportOptions, includeDocuments: checked })}
        />
      </div>
      <div className="flex gap-3 pt-3 border-t border-border-light dark:border-border-dark">
        <Button onClick={handleGenerateReport} disabled={generatingReport} className="flex-1">
          <DownloadIcon className="w-4 h-4 mr-2" />
          {generatingReport ? 'Generando...' : 'Descargar PDF'}
        </Button>
        <Button variant="outline" onClick={() => setShowReportOptions(false)}>
          Cancelar
        </Button>
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="5xl" showCloseButton>
      <ModalHeader className="shrink-0 pt-6 px-6 sm:px-10">Detalles del Estudiante: {studentName}</ModalHeader>
      <ModalBody className="overflow-y-auto custom-scrollbar grow px-6 sm:px-10 py-6">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Tabs mejorados */}
          <div className="border-b border-border-default dark:border-border-dark">
            <nav className="-mb-px flex space-x-4">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-all
                    ${activeTab === tab.id
                      ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                      : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-300 dark:hover:text-white'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Contenido del tab */}
          <div className="min-h-[280px] py-2">
            {showReportOptions ? renderReportOptions() : renderTabContent()}
          </div>

          {/* Botón de reporte */}
          {!showReportOptions && (
            <div className="flex justify-end pt-3 border-t border-border-default dark:border-border-dark">
              <Button variant="outline" onClick={() => setShowReportOptions(true)} size="sm">
                <FileIcon className="w-4 h-4 mr-2" />
                Generar Reporte
              </Button>
            </div>
          )}
        </div>
      </ModalBody>
    </Modal>
  );
};

export default StudentDetailModal;