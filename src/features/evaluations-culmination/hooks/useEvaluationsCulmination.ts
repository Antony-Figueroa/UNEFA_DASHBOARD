/**
 * @file useEvaluationsCulmination.ts
 * @description Hook principal del módulo de Evaluaciones y Culminación.
 * Centraliza fetching, filtros, paginación, estadísticas y acciones.
 * Incluye acciones de administrador (retiro, extensión, congelar, etc.).
 * Refactored to compose sub-hooks for grouped culmination view (PR 2b).
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
  StudentCulminationRowData,
} from '../types';
import type { EvaluatorType } from '../../evaluations/types';
import { evaluationsCulminationService } from '../services/evaluationsCulminationService';
import { evaluationService, type AuditEntry } from '../../evaluations/services/evaluationService';
import { withdrawPractice, reclassifyWithdrawal } from '../../enrollment/services/enrollmentService';
import { useAuth } from '../../../context/auth';
import { matchSearch } from '../../../utils/searchNormalizer';
import { generateCertificatePDF } from '../../../components/ui/pdf/templates/CertificatePDF';
// Sub-hooks for grouped culmination view
import { useCulminationData } from './useCulminationData';
import { useCulminationFilters } from './useCulminationFilters';
import { useCulminationUI } from './useCulminationUI';
import { useCulminationActions } from './useCulminationActions';

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
  /** Navega al siguiente paso en el flujo secuencial de evaluaciones */
  handleNavigateToNext: (nextType: EvaluatorType, nextMemberIndex?: number) => Promise<void>;

  /** Modal de detalle */
  detailModalOpen: boolean;
  selectedEvaluationId: number | null;
  selectedDetailStudentName: string;
  selectedDetailStudentCi: string;
  handleViewEvaluationDetails: (evaluationId: number, studentName?: string, studentCi?: string) => void;
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

  /** Estado de solo lectura (asistente) */
  isReadOnly: boolean;

  /** Retiro */
  withdrawDialogOpen: boolean;
  withdrawTarget: { practiceId: number; studentName: string } | null;
  withdrawType: 'justified' | 'unjustified';
  setWithdrawType: (type: 'justified' | 'unjustified') => void;
  withdrawReason: string;
  setWithdrawReason: (reason: string) => void;
  handleWithdraw: (practiceId: number, studentName: string) => void;
  handleConfirmWithdraw: () => void;
  setWithdrawDialogOpen: (open: boolean) => void;
  handleReclassifyWithdrawal: (practiceId: number, studentName: string) => void;
  /** Descongelar */
  handleUnfreeze: (practiceId: number) => void;
  unfreezeTarget: { practiceId: number } | null;
  unfreezeReason: string;
  setUnfreezeReason: (reason: string) => void;
  handleConfirmUnfreeze: () => void;
  setUnfreezeTarget: (target: { practiceId: number } | null) => void;

  /** Extensión individual */
  extensionDialogOpen: boolean;
  extensionTarget: { practiceId: number; studentName: string } | null;
  extensionReason: string;
  setExtensionReason: (reason: string) => void;
  handleGrantExtension: (practiceId: number, studentName: string) => void;
  handleConfirmExtension: () => void;
  setExtensionDialogOpen: (open: boolean) => void;
  handleRevokeExtension: (practiceId: number) => void;

  /** Extensión masiva */
  bulkExtensionOpen: boolean;
  setBulkExtensionOpen: (open: boolean) => void;
  bulkExtensionSelectedIds: number[];
  setBulkExtensionSelectedIds: (ids: number[]) => void;
  bulkExtensionReason: string;
  setBulkExtensionReason: (reason: string) => void;
  handleBulkExtension: () => void;
  handleConfirmBulkExtension: () => void;

  /** Cierre de actas */
  handleFreezeAll: () => void;

  /** Comité */
  committeeDialogOpen: boolean;
  committeeTarget: { practiceId: number; studentName: string } | null;
  handleOpenCommittee: (practiceId: number, studentName: string) => void;
  setCommitteeDialogOpen: (open: boolean) => void;

  /** Exportar Excel */
  handleExportExcel: () => void;

  /** Auditoría */
  auditHistoryOpen: boolean;
  setAuditHistoryOpen: (open: boolean) => void;
  auditHistoryData: AuditEntry[];
  auditHistoryLoading: boolean;
  handleViewAudit: (practiceId: number) => void;

  /** Override de horas */
  overrideTarget: { practice: PracticeWithEvaluations; reason: string } | null;
  setOverrideTarget: (target: { practice: PracticeWithEvaluations; reason: string } | null) => void;
  setOverrideReason: (reason: string) => void;
  handleConfirmOverride: () => void;

  // ── Grouped Culmination View (PR 2b sub-hooks) ──────────

  /** Datos agrupados de culminación (useCulminationData) */
  culminationGroups: StudentCulminationRowData[];
  culminationGroupsLoading: boolean;
  culminationGroupsError: string | null;
  culminationGroupStats: CulminationStats;
  culminationGroupsMeta: { total: number; completed: number; inProgress: number };
  refetchCulminationGroups: () => Promise<void>;

  /** Filtros de culminación agrupada (useCulminationFilters) */
  culminationPeriodId: number | undefined;
  culminationSearch: string;
  culminationCareerId: number | undefined;
  culminationPhaseFilter: 'all' | 'hospitalaria' | 'comunitaria';
  setCulminationPeriodId: (id: number | undefined) => void;
  setCulminationSearch: (search: string) => void;
  setCulminationCareerId: (id: number | undefined) => void;
  setCulminationPhaseFilter: (filter: 'all' | 'hospitalaria' | 'comunitaria') => void;
  resetCulminationFilters: () => void;

  /** UI de culminación agrupada (useCulminationUI) */
  culminationExpandedStudentCi: string | null;
  culminationActiveTab: 'evaluations' | 'culmination' | 'certification';
  isCulminationModalOpen: boolean;
  culminationModalType: string | null;
  culminationSelectedPracticeId: number | null;
  toggleCulminationRow: (studentCi: string) => void;
  setCulminationActiveTab: (tab: 'evaluations' | 'culmination' | 'certification') => void;
  openCulminationModal: (type: string, practiceId?: number) => void;
  closeCulminationModal: () => void;

  /** Acciones de culminación agrupada (useCulminationActions) */
  approveCulminationGrouped: (practiceId: number) => Promise<boolean>;
  certifyPracticeGrouped: (practiceId: number) => Promise<boolean>;
  reverseCulminationGrouped: (practiceId: number, reason: string, resolutionNumber: string) => Promise<boolean>;
  bulkExtendGrouped: (practiceIds: number[], days: number) => Promise<boolean>;
  actionApproving: boolean;
  actionCertifying: boolean;
  actionReversing: boolean;
  actionBulkExtending: boolean;
  actionError: string | null;
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
  const [selectedDetailStudentName, setSelectedDetailStudentName] = useState('');
  const [selectedDetailStudentCi, setSelectedDetailStudentCi] = useState('');

  const [studentDetailOpen, setStudentDetailOpen] = useState(false);
  const [selectedStudentPracticeId, setSelectedStudentPracticeId] = useState<number | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState('');

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // ─── Admin State ───────────────────────────────────────
  const { user } = useAuth();
  const isReadOnly = user?.role === 2; // role 2 = assistant (read-only)

  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [withdrawTarget, setWithdrawTarget] = useState<{ practiceId: number; studentName: string } | null>(null);
  const [withdrawType, setWithdrawType] = useState<'justified' | 'unjustified'>('justified');
  const [withdrawReason, setWithdrawReason] = useState('');

  const [extensionDialogOpen, setExtensionDialogOpen] = useState(false);
  const [extensionTarget, setExtensionTarget] = useState<{ practiceId: number; studentName: string } | null>(null);
  const [extensionReason, setExtensionReason] = useState('');

  const [committeeDialogOpen, setCommitteeDialogOpen] = useState(false);
  const [committeeTarget, setCommitteeTarget] = useState<{ practiceId: number; studentName: string } | null>(null);

  const [bulkExtensionOpen, setBulkExtensionOpen] = useState(false);
  const [bulkExtensionSelectedIds, setBulkExtensionSelectedIds] = useState<number[]>([]);
  const [bulkExtensionReason, setBulkExtensionReason] = useState('');

  const [unfreezeTarget, setUnfreezeTarget] = useState<{ practiceId: number } | null>(null);
  const [unfreezeReason, setUnfreezeReason] = useState('');

  const [auditHistoryOpen, setAuditHistoryOpen] = useState(false);
  const [auditHistoryData, setAuditHistoryData] = useState<AuditEntry[]>([]);
  const [auditHistoryLoading, setAuditHistoryLoading] = useState(false);

  const [overrideTarget, setOverrideTarget] = useState<{
    practice: PracticeWithEvaluations;
    reason: string;
  } | null>(null);

  const setOverrideReason = useCallback((reason: string) => {
    setOverrideTarget(prev => prev ? { ...prev, reason } : null);
  }, []);

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
    return list.filter(p => {
      // Search filter
      if (searchTerm) {
        const matchesSearch =
          matchSearch(p.studentName, searchTerm) ||
          matchSearch(p.studentCi, searchTerm) ||
          matchSearch(p.institutionName, searchTerm);
        if (!matchesSearch) return false;
      }
      // Period filter
      if (filters.periodId && p.periodId !== filters.periodId) return false;
      // Career filter
      if (filters.careerId && p.careerId !== filters.careerId) return false;
      // Practice type filter
      if (filters.practiceTypeId && p.practiceTypeId !== filters.practiceTypeId) return false;
      // Culmination status filter
      if (filters.culminationStatus && p.culminationStatus !== filters.culminationStatus) return false;
      // Evaluation status filter
      if (filters.evaluationStatus && p.evaluationStatus !== filters.evaluationStatus) return false;
      // Result filter
      if (filters.result && p.result !== filters.result) return false;
      return true;
    });
  }, [practices, searchTerm, filters]);

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
    const hasEnoughHours = practice.totalHours >= (practice.hoursRequired ?? 360);

    if (hasEnoughHours) {
      // Normal flow — direct confirmation
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
    } else {
      // Hours deficit — show override dialog
      setOverrideTarget({ practice, reason: '' });
    }
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
    fetchPractices();
  }, [fetchPractices]);

  const handleEvaluationSuccess = useCallback(() => {
    setEvalModalOpen(false);
    setSelectedPracticeForEval(null);
    setEditingEvaluationId(undefined);
    fetchPractices();
  }, [fetchPractices]);

  /**
   * Navega al siguiente paso en el flujo secuencial de evaluaciones.
   * Cierra el modal, refresca las prácticas, actualiza la referencia de la práctica
   * (para que existingComiteMembers esté fresco), y reabre con el nuevo evaluatorType.
   */
  const handleNavigateToNext = useCallback(
    async (nextType: EvaluatorType, _nextMemberIndex?: number) => {
      // 1. Capture current practice ID before closing
      const practiceId = selectedPracticeForEval?.practiceId;

      // 2. Close current modal
      setEvalModalOpen(false);

      // 3. Refresh practices to get latest evaluation status and members
      try {
        const response = await evaluationsCulminationService.getPractices({
          ...filters,
          search: searchTerm || undefined,
        });

        if (response.success) {
          setPractices(response.data);
          setMeta(response.meta || { total: 0, periods: [], careers: [], practiceTypes: [] });

          // 4. Find updated practice by ID and update the reference
          if (practiceId) {
            const updatedPractice = response.data.find(
              (p: PracticeWithEvaluations) => p.practiceId === practiceId
            );
            if (updatedPractice) {
              setSelectedPracticeForEval(updatedPractice);
            }
          }
        }
      } catch (error) {
        console.error('[useEvaluationsCulmination] Error refreshing for navigation:', error);
      }

      // 5. Switch evaluator type and reopen
      setSelectedEvaluatorType(nextType);
      setEditingEvaluationId(undefined);
      setEvalModalOpen(true);
    },
    [selectedPracticeForEval, filters, searchTerm]
  );

  // ─── Detail Modal Handlers ──────────────────────────────
  const handleViewEvaluationDetails = useCallback((evaluationId: number, studentName?: string, studentCi?: string) => {
    setSelectedEvaluationId(evaluationId);
    setSelectedDetailStudentName(studentName || '');
    setSelectedDetailStudentCi(studentCi || '');
    setDetailModalOpen(true);
  }, []);

  const handleCloseDetailModal = useCallback(() => {
    setDetailModalOpen(false);
    setSelectedEvaluationId(null);
    setSelectedDetailStudentName('');
    setSelectedDetailStudentCi('');
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

  // ─── Admin Actions ──────────────────────────────────────

  const handleWithdraw = useCallback((practiceId: number, studentName: string) => {
    setWithdrawTarget({ practiceId, studentName });
    setWithdrawType('justified');
    setWithdrawReason('');
    setWithdrawDialogOpen(true);
  }, []);

  const handleConfirmWithdraw = useCallback(async () => {
    if (!withdrawTarget) return;
    try {
      await withdrawPractice(
        String(withdrawTarget.practiceId),
        withdrawType as 'justified' | 'unjustified',
        withdrawReason
      );
      addToast({ ...TOAST.updated('Retiro'), message: `Retiro ${withdrawType === 'justified' ? 'justificado' : 'injustificado'} registrado para ${withdrawTarget.studentName}` });
      fetchPractices();
    } catch (error) {
      addToast(TOAST.updateError('Retiro'));
    } finally {
      setWithdrawDialogOpen(false);
      setWithdrawTarget(null);
    }
  }, [withdrawTarget, withdrawType, withdrawReason, fetchPractices]);

  const handleReclassifyWithdrawal = useCallback((practiceId: number, studentName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Reclasificar Retiro',
      message: `¿Desea reclasificar el retiro injustificado de ${studentName} a justificado? Ingrese el motivo en el siguiente paso.`,
      onConfirm: async () => {
        try {
          // Pedir motivo al usuario — usamos un prompt temporal
          const reason = window.prompt('Motivo de la reclasificación (mínimo 10 caracteres):');
          if (!reason || reason.trim().length < 10) {
            toast.error('Debe proporcionar un motivo de al menos 10 caracteres');
            return;
          }
          await reclassifyWithdrawal(String(practiceId), reason.trim());
          addToast({ ...TOAST.updated('Reclasificación'), message: `Retiro reclasificado exitosamente para ${studentName}` });
          fetchPractices();
        } catch (error) {
          addToast(TOAST.updateError('Reclasificación'));
        } finally {
          setConfirmDialog(null);
        }
      },
    });
  }, [fetchPractices]);

  const handleUnfreeze = useCallback((practiceId: number) => {
    setUnfreezeTarget({ practiceId });
    setUnfreezeReason('');
  }, []);

  const handleConfirmUnfreeze = useCallback(async () => {
    if (!unfreezeTarget || !unfreezeReason.trim()) return;
    if (unfreezeReason.trim().length < 10) {
      toast.error('El motivo debe tener al menos 10 caracteres');
      return;
    }
    try {
      await evaluationService.unfreezePractice(unfreezeTarget.practiceId, unfreezeReason.trim());
      addToast({ ...TOAST.updated('Descongelar'), message: 'Evaluación descongelada exitosamente' });
      fetchPractices();
    } catch (error: any) {
      addToast({ ...TOAST.updateError('Descongelar'), message: error.message || 'Error al descongelar' });
    } finally {
      setUnfreezeTarget(null);
      setUnfreezeReason('');
    }
  }, [unfreezeTarget, unfreezeReason, fetchPractices]);

  const handleGrantExtension = useCallback((practiceId: number, studentName: string) => {
    setExtensionTarget({ practiceId, studentName });
    setExtensionReason('');
    setExtensionDialogOpen(true);
  }, []);

  const handleConfirmExtension = useCallback(async () => {
    if (!extensionTarget || !extensionReason.trim()) return;
    try {
      await evaluationService.grantExtension(extensionTarget.practiceId, extensionReason);
      addToast({ ...TOAST.updated('Extensión'), message: `Extensión otorgada a ${extensionTarget.studentName}` });
      fetchPractices();
    } catch (error) {
      addToast(TOAST.updateError('Extensión'));
    } finally {
      setExtensionDialogOpen(false);
      setExtensionTarget(null);
    }
  }, [extensionTarget, fetchPractices]);

  const handleRevokeExtension = useCallback((practiceId: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Revocar Extensión',
      message: '¿Desea revocar la extensión de esta práctica?',
      onConfirm: async () => {
        try {
          await evaluationService.revokeExtension(practiceId, 'Revocación administrativa');
          addToast({ ...TOAST.updated('Extensión'), message: 'Extensión revocada exitosamente' });
          fetchPractices();
        } catch (error) {
          addToast(TOAST.updateError('Extensión'));
        } finally {
          setConfirmDialog(null);
        }
      },
    });
  }, [fetchPractices]);

  const handleBulkExtension = useCallback(() => {
    setBulkExtensionSelectedIds([]);
    setBulkExtensionReason('');
    setBulkExtensionOpen(true);
  }, []);

  const handleConfirmBulkExtension = useCallback(async () => {
    if (bulkExtensionSelectedIds.length === 0 || !bulkExtensionReason.trim()) return;
    try {
      const result = await evaluationService.bulkGrantExtension({
        practiceIds: bulkExtensionSelectedIds,
        reason: bulkExtensionReason,
      });
      addToast({ ...TOAST.updated('Extensión Masiva'), message: `${result.grantedCount} extensiones otorgadas` });
      fetchPractices();
    } catch (error) {
      addToast(TOAST.updateError('Extensión Masiva'));
    } finally {
      setBulkExtensionOpen(false);
    }
  }, [bulkExtensionSelectedIds, bulkExtensionReason, fetchPractices]);

  const handleFreezeAll = useCallback(() => {
    const completedIds = (Array.isArray(practices) ? practices : [])
      .filter(p => p.evaluationStatus === 'completed')
      .map(p => p.practiceId);

    if (completedIds.length === 0) {
      toast.error('No hay evaluaciones completas para congelar');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Cerrar Actas',
      message: `¿Desea congelar ${completedIds.length} evaluaciones completas? Esta acción cerrará las actas de evaluación.`,
      onConfirm: async () => {
        try {
          const result = await evaluationService.freezeBatch(completedIds);
          addToast({ ...TOAST.updated('Cierre de Actas'), message: `${result.frozenCount} evaluaciones congeladas` });
          fetchPractices();
        } catch (error: any) {
          addToast({ ...TOAST.updateError('Cierre de Actas'), message: error.message || 'Error al congelar' });
        } finally {
          setConfirmDialog(null);
        }
      },
    });
  }, [practices, fetchPractices]);

  const handleOpenCommittee = useCallback((practiceId: number, studentName: string) => {
    setCommitteeTarget({ practiceId, studentName });
    setCommitteeDialogOpen(true);
  }, []);

  const handleExportExcel = useCallback(async () => {
    const periodId = filters.periodId || 'all';
    try {
      toast.loading('Exportando evaluaciones...', { id: 'export-excel' });
      const blob = await evaluationService.exportEvaluationsExcel(periodId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = periodId === 'all' ? 'Evaluaciones_todos.xlsx' : `Evaluaciones_${periodId}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Evaluaciones exportadas exitosamente', { id: 'export-excel' });
    } catch (error) {
      toast.error('Error al exportar evaluaciones', { id: 'export-excel' });
    }
  }, [filters.periodId]);

  const handleViewAudit = useCallback(async (practiceId: number) => {
    setAuditHistoryOpen(true);
    setAuditHistoryLoading(true);
    try {
      const data = await evaluationService.getAuditHistory(practiceId);
      setAuditHistoryData(data);
    } catch (error) {
      toast.error('Error al cargar historial de auditoría');
      setAuditHistoryData([]);
    } finally {
      setAuditHistoryLoading(false);
    }
  }, []);

  // ─── Confirm Dialog ─────────────────────────────────────
  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog(null);
  }, []);

  // ─── Hours Override ─────────────────────────────────────
  const handleConfirmOverride = useCallback(async () => {
    if (!overrideTarget || !overrideTarget.reason.trim()) return;
    try {
      await evaluationsCulminationService.approveCulmination(overrideTarget.practice.practiceId, {
        overrideHours: true,
        overrideReason: overrideTarget.reason.trim(),
      });
      addToast(TOAST.updated(resourceName));
      fetchPractices();
    } catch (error) {
      addToast(TOAST.updateError(resourceName));
    } finally {
      setOverrideTarget(null);
    }
  }, [overrideTarget, fetchPractices]);

  // ─── Grouped Culmination Sub-Hooks (PR 2b) ──────────────
  const culminationFilters = useCulminationFilters();
  const culminationUI = useCulminationUI();
  const culminationData = useCulminationData({
    periodId: culminationFilters.periodId,
    search: culminationFilters.search,
    careerId: culminationFilters.careerId,
  });
  const culminationActions = useCulminationActions(fetchPractices);

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
    handleNavigateToNext,
    detailModalOpen,
    selectedEvaluationId,
    selectedDetailStudentName,
    selectedDetailStudentCi,
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
    // Admin state
    isReadOnly,
    // Withdraw
    withdrawDialogOpen,
    withdrawTarget,
    withdrawType,
    setWithdrawType,
    withdrawReason,
    setWithdrawReason,
    handleWithdraw,
    handleConfirmWithdraw,
    setWithdrawDialogOpen,
    handleReclassifyWithdrawal,
    // Unfreeze
    handleUnfreeze,
    unfreezeTarget,
    unfreezeReason,
    setUnfreezeReason,
    handleConfirmUnfreeze,
    setUnfreezeTarget,
    // Extension
    extensionDialogOpen,
    extensionTarget,
    extensionReason,
    setExtensionReason,
    handleGrantExtension,
    handleConfirmExtension,
    setExtensionDialogOpen,
    handleRevokeExtension,
    // Bulk extension
    bulkExtensionOpen,
    setBulkExtensionOpen,
    bulkExtensionSelectedIds,
    setBulkExtensionSelectedIds,
    bulkExtensionReason,
    setBulkExtensionReason,
    handleBulkExtension,
    handleConfirmBulkExtension,
    // Freeze all
    handleFreezeAll,
    // Committee
    committeeDialogOpen,
    committeeTarget,
    handleOpenCommittee,
    setCommitteeDialogOpen,
    // Export
    handleExportExcel,
    // Audit
    auditHistoryOpen,
    setAuditHistoryOpen,
    auditHistoryData,
    auditHistoryLoading,
    handleViewAudit,
    // Override
    overrideTarget,
    setOverrideTarget,
    setOverrideReason,
    handleConfirmOverride,
    // ── Grouped Culmination View (PR 2b sub-hooks) ──────
    // Data (useCulminationData)
    culminationGroups: culminationData.groups,
    culminationGroupsLoading: culminationData.loading,
    culminationGroupsError: culminationData.error,
    culminationGroupStats: culminationData.stats,
    culminationGroupsMeta: culminationData.meta,
    refetchCulminationGroups: culminationData.refetch,
    // Filters (useCulminationFilters)
    culminationPeriodId: culminationFilters.periodId,
    culminationSearch: culminationFilters.search,
    culminationCareerId: culminationFilters.careerId,
    culminationPhaseFilter: culminationFilters.phaseFilter,
    setCulminationPeriodId: culminationFilters.setPeriodId,
    setCulminationSearch: culminationFilters.setSearch,
    setCulminationCareerId: culminationFilters.setCareerId,
    setCulminationPhaseFilter: culminationFilters.setPhaseFilter,
    resetCulminationFilters: culminationFilters.resetFilters,
    // UI (useCulminationUI)
    culminationExpandedStudentCi: culminationUI.expandedStudentCi,
    culminationActiveTab: culminationUI.activeTab,
    isCulminationModalOpen: culminationUI.isModalOpen,
    culminationModalType: culminationUI.modalType,
    culminationSelectedPracticeId: culminationUI.selectedPracticeId,
    toggleCulminationRow: culminationUI.toggleRow,
    setCulminationActiveTab: culminationUI.setActiveTab,
    openCulminationModal: culminationUI.openModal,
    closeCulminationModal: culminationUI.closeModal,
    // Actions (useCulminationActions)
    approveCulminationGrouped: culminationActions.approveCulmination,
    certifyPracticeGrouped: culminationActions.certifyPractice,
    reverseCulminationGrouped: culminationActions.reverseCulmination,
    bulkExtendGrouped: culminationActions.bulkExtend,
    actionApproving: culminationActions.approving,
    actionCertifying: culminationActions.certifying,
    actionReversing: culminationActions.reversing,
    actionBulkExtending: culminationActions.bulkExtending,
    actionError: culminationActions.error,
  };
};

export default useEvaluationsCulmination;
