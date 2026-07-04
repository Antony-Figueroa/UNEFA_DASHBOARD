/**
 * @file useEvaluationsCulmination.ts
 * @description Hook principal del módulo de Evaluaciones y Culminación.
 * Centraliza fetching, filtros, paginación, estadísticas y acciones.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useToast } from '@/context/toast';
import { TOAST } from '@/components/ui/dialog/DialogConfig';
import {
  PracticeWithEvaluations,
  PracticeFilters,
  EvaluationStats,
  CulminationStats,
} from '../types';
import type { EvaluatorType } from '../../evaluations/types';
import { evaluationsCulminationService } from '../services/evaluationsCulminationService';
import { matchSearch } from '../../../utils/searchNormalizer';
import { generateCertificatePDF } from '../../../components/ui/pdf/templates/CertificatePDF';

const resourceName = 'Culminación';

export interface UseEvaluationsCulminationReturn {
  /** Datos */
  practices: PracticeWithEvaluations[];
  meta: {
    total: number;
    periods: { id: number; name: string }[];
    careers: { id: number; name: string }[];
    practiceTypes: { id: number; name: string }[];
  };

  /** Estado de carga */
  loading: boolean;

  /** Filtros */
  filters: PracticeFilters;
  searchTerm: string;
  updateFilter: (key: keyof PracticeFilters, value: string) => void;
  setSearchTerm: (value: string) => void;
  clearFilters: () => void;

  /** Paginación */
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  setItemsPerPage: (items: number) => void;

  /** Datos computados */
  filteredPractices: PracticeWithEvaluations[];
  evaluationStats: EvaluationStats;
  culminationStats: CulminationStats;

  /** Acciones de culminación */
  handleApprove: (practice: PracticeWithEvaluations) => void;
  handleGenerateCertificate: (practice: PracticeWithEvaluations) => void;
  handleDownloadPdf: (practice: PracticeWithEvaluations) => Promise<void>;

  /** Modal de evaluación */
  evalModalOpen: boolean;
  selectedPracticeForEval: PracticeWithEvaluations | null;
  selectedEvaluatorType: EvaluatorType;
  editingEvaluationId: number | undefined;
  handleOpenEvaluation: (practice: PracticeWithEvaluations, type: EvaluatorType, existingEvalId?: number) => void;
  handleCloseEvaluationModal: () => void;
  handleEvaluationSuccess: () => void;

  /** Modal de detalle */
  detailModalOpen: boolean;
  selectedEvaluationId: number | null;
  handleViewEvaluationDetails: (evaluationId: number) => void;
  handleCloseDetailModal: () => void;

  /** Modal de detalle de estudiante */
  studentDetailOpen: boolean;
  selectedStudentPracticeId: number | null;
  selectedStudentName: string;
  handleViewStudentDetail: (practice: PracticeWithEvaluations) => void;
  handleCloseStudentDetail: () => void;

  /** Diálogo de confirmación */
  confirmDialog: {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null;
  closeConfirmDialog: () => void;

  /** Recargar datos */
  refresh: () => void;
}

export const useEvaluationsCulmination = (): UseEvaluationsCulminationReturn => {
  const { addToast } = useToast();
  // ─── Data ───────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [practices, setPractices] = useState<PracticeWithEvaluations[]>([]);
  const [meta, setMeta] = useState({
    total: 0,
    periods: [] as { id: number; name: string }[],
    careers: [] as { id: number; name: string }[],
    practiceTypes: [] as { id: number; name: string }[],
  });

  // ─── Filters & Search ──────────────────────────────────
  const [filters, setFilters] = useState<PracticeFilters>({});
  const [searchTerm, setSearchTerm] = useState('');

  // ─── Pagination ─────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ─── Modals ─────────────────────────────────────────────
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [selectedPracticeForEval, setSelectedPracticeForEval] = useState<PracticeWithEvaluations | null>(null);
  const [selectedEvaluatorType, setSelectedEvaluatorType] = useState<EvaluatorType>('INSTITUCIONAL');
  const [editingEvaluationId, setEditingEvaluationId] = useState<number | undefined>(undefined);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<number | null>(null);

  const [studentDetailOpen, setStudentDetailOpen] = useState(false);
  const [selectedStudentPracticeId, setSelectedStudentPracticeId] = useState<number | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState('');

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // ─── Data Fetching ──────────────────────────────────────
  const fetchPractices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await evaluationsCulminationService.getPractices({
        ...filters,
        search: searchTerm || undefined,
      });

      if (response.success) {
        setPractices(response.data);
        setMeta(response.meta || { total: 0, periods: [], careers: [], practiceTypes: [] });
      }
    } catch (error) {
      console.error('[useEvaluationsCulmination] Error fetching practices:', error);
      addToast({ ...TOAST.loadError(), message: `Error al cargar ${resourceName.toLowerCase()}. Intentá de nuevo.` });
    } finally {
      setLoading(false);
    }
  }, [filters, searchTerm]);

  useEffect(() => {
    fetchPractices();
  }, [fetchPractices]);

  // ─── Filter Options ────────────────────────────────────
  const periodOptions = useMemo(() => {
    const periods = Array.isArray(meta.periods) ? meta.periods : [];
    return [
      { value: '', label: 'Todos los períodos' },
      ...periods.map(p => ({ value: String(p.id), label: p.name })),
    ];
  }, [meta.periods]);

  const careerOptions = useMemo(() => {
    const careers = Array.isArray(meta.careers) ? meta.careers : [];
    return [
      { value: '', label: 'Todas las carreras' },
      ...careers.map(c => ({ value: String(c.id), label: c.name })),
    ];
  }, [meta.careers]);

  const practiceTypeOptions = useMemo(() => {
    const types = Array.isArray(meta.practiceTypes) ? meta.practiceTypes : [];
    return [
      { value: '', label: 'Todos los tipos' },
      ...types.map(t => ({ value: String(t.id), label: t.name })),
    ];
  }, [meta.practiceTypes]);

  // ─── Filtered Data ─────────────────────────────────────
  const filteredPractices = useMemo(() => {
    const list = Array.isArray(practices) ? practices : [];
    if (!searchTerm) return list;
    return list.filter(p =>
      matchSearch(p.studentName, searchTerm) ||
      matchSearch(p.studentCi, searchTerm) ||
      matchSearch(p.institutionName, searchTerm)
    );
  }, [practices, searchTerm]);

  // ─── Stats ──────────────────────────────────────────────
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

  // ─── Filter Actions ────────────────────────────────────
  const updateFilter = useCallback((key: keyof PracticeFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value || undefined }));
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchTerm('');
    setCurrentPage(1);
  }, []);

  // ─── Culmination Actions ────────────────────────────────
  const handleApprove = useCallback((practice: PracticeWithEvaluations) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Aprobar Culminación',
      message: `¿Está seguro de aprobar la culminación de prácticas de ${practice.studentName}?`,
      onConfirm: async () => {
        try {
          await evaluationsCulminationService.approveCulmination(practice.practiceId);
          addToast(TOAST.updated(resourceName));
          fetchPractices();
        } catch (error) {
          addToast(TOAST.updateError(resourceName));
        } finally {
          setConfirmDialog(null);
        }
      },
    });
  }, [fetchPractices]);

  const handleGenerateCertificate = useCallback((practice: PracticeWithEvaluations) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Generar Certificado',
      message: `¿Desea generar el certificado de prácticas para ${practice.studentName}?`,
      onConfirm: async () => {
        try {
          const response = await evaluationsCulminationService.generateCertificate(practice.practiceId);
          if (response.success) {
            addToast({ ...TOAST.created('Certificado'), message: `Certificado creado exitosamente: ${response.certificate.number}` });
            fetchPractices();
          }
        } catch (error) {
          addToast(TOAST.createError('Certificado'));
        } finally {
          setConfirmDialog(null);
        }
      },
    });
  }, [fetchPractices]);

  const handleDownloadPdf = useCallback(async (practice: PracticeWithEvaluations) => {
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
          certifiedAt: practice.certifiedAt,
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

      addToast({ variant: "success", title: "PDF descargado", message: "PDF descargado exitosamente" });
    } catch (error) {
      console.error('[useEvaluationsCulmination] Error downloading PDF:', error);
      addToast({ variant: "error", title: "Error al descargar", message: "Error al descargar el PDF" });
    }
  }, []);

  // ─── Evaluation Modal Handlers ──────────────────────────
  const handleOpenEvaluation = useCallback(
    (practice: PracticeWithEvaluations, type: EvaluatorType, existingEvalId?: number) => {
      setSelectedPracticeForEval(practice);
      setSelectedEvaluatorType(type);
      setEditingEvaluationId(existingEvalId);
      setEvalModalOpen(true);
    },
    []
  );

  const handleCloseEvaluationModal = useCallback(() => {
    setEvalModalOpen(false);
    setSelectedPracticeForEval(null);
    setEditingEvaluationId(undefined);
  }, []);

  const handleEvaluationSuccess = useCallback(() => {
    setEvalModalOpen(false);
    setSelectedPracticeForEval(null);
    setEditingEvaluationId(undefined);
    fetchPractices();
  }, [fetchPractices]);

  // ─── Detail Modal Handlers ──────────────────────────────
  const handleViewEvaluationDetails = useCallback((evaluationId: number) => {
    setSelectedEvaluationId(evaluationId);
    setDetailModalOpen(true);
  }, []);

  const handleCloseDetailModal = useCallback(() => {
    setDetailModalOpen(false);
    setSelectedEvaluationId(null);
  }, []);

  // ─── Student Detail Modal Handlers ──────────────────────
  const handleViewStudentDetail = useCallback((practice: PracticeWithEvaluations) => {
    setSelectedStudentPracticeId(practice.practiceId);
    setSelectedStudentName(practice.studentName);
    setStudentDetailOpen(true);
  }, []);

  const handleCloseStudentDetail = useCallback(() => {
    setStudentDetailOpen(false);
    setSelectedStudentPracticeId(null);
    setSelectedStudentName('');
  }, []);

  // ─── Confirm Dialog ─────────────────────────────────────
  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog(null);
  }, []);

  return {
    practices,
    meta,
    loading,
    filters,
    searchTerm,
    updateFilter,
    setSearchTerm,
    clearFilters,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    filteredPractices,
    evaluationStats,
    culminationStats,
    handleApprove,
    handleGenerateCertificate,
    handleDownloadPdf,
    evalModalOpen,
    selectedPracticeForEval,
    selectedEvaluatorType,
    editingEvaluationId,
    handleOpenEvaluation,
    handleCloseEvaluationModal,
    handleEvaluationSuccess,
    detailModalOpen,
    selectedEvaluationId,
    handleViewEvaluationDetails,
    handleCloseDetailModal,
    studentDetailOpen,
    selectedStudentPracticeId,
    selectedStudentName,
    handleViewStudentDetail,
    handleCloseStudentDetail,
    confirmDialog,
    closeConfirmDialog,
    refresh: fetchPractices,
    // Exponemos periodOptions, careerOptions, practiceTypeOptions para componentes
    // (se acceden desde meta)
  };
};

export default useEvaluationsCulmination;
