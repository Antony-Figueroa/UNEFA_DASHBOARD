import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import PageMeta from '../../components/common/PageMeta';
import Button from '../../components/ui/button/Button';
import { SkeletonLoader, TitleSkeleton, BreadcrumbSkeleton } from '../../components/ui/skeleton';
import { useEvaluations } from '../../features/evaluations/hooks/useEvaluations';
import { EvaluationModal } from '../../features/evaluations/components/EvaluationModal';
import EvaluationDetailModal from '../../features/evaluations/components/EvaluationDetailModal';
import { EvaluatorType, EvaluationStatus } from '../../features/evaluations/types';
import { useSystemEvaluationConfig } from '../../features/evaluations/hooks/useSystemEvaluationConfig';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/ui/modal';
import { CheckCircleIcon, TimeIcon, AlertIcon, EyeIcon, LockIcon, CloseLineIcon, CheckIcon, DownloadIcon, EditIcon } from '../../icons';
import apiClient from '../../api/apiClient';
import toast from 'react-hot-toast';
import { useToast } from '../../context/toast';
import { TOAST } from '../../components/ui/dialog/DialogConfig';
import { matchSearch } from '../../utils/searchNormalizer';
import { useAuth } from '../../context/auth';
import evaluationService from '../../features/evaluations/services/evaluationService';
import { Tabs } from '../../components/ui/tabs/Tabs';
import { useTabs } from '../../hooks/useTabs';
import UnifiedDialog from '../../components/ui/dialog/UnifiedDialog';
import { culminationService } from '../../features/culmination/services/culminationService';

interface PracticeWithStudent {
  professionalPracticeId: number;
  studentCi: string;
  studentName: string;
  institutionName: string;
  evaluationStatus: string;
  grade: number | null;
  practicesStatus?: number;
  withdrawalType?: string | null;
  result?: 'approved' | 'failed' | 'pending';
  practiceType?: string;
  practiceTypeId?: number;
  careerId?: number;
}

interface ApiPracticeResponse {
  success: boolean;
  data: PracticeWithStudent[];
}

export default function EvaluationsPage() {
  const { addToast } = useToast();
  const { config: evalConfig } = useSystemEvaluationConfig();
  const { user } = useAuth();
  const isReadOnly = user?.role === 2; // ASISTENTE = solo lectura

  const [pageLoading, setPageLoading] = useState(true);
  const [practices, setPractices] = useState<PracticeWithStudent[]>([]);
  const [practicesLoading, setPracticesLoading] = useState(true);
  const [selectedPractice, setSelectedPractice] = useState<PracticeWithStudent | null>(null);
  const [selectedEvaluatorType, setSelectedEvaluatorType] = useState<EvaluatorType | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [practiceStatuses, setPracticeStatuses] = useState<Record<number, EvaluationStatus>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<number | null>(null);
  const [editEvaluationId, setEditEvaluationId] = useState<number | null>(null);
  const [committeeAssignments, setCommitteeAssignments] = useState<{ memberIndex: number; evaluatorName: string; evaluatorCi?: string }[]>([]);

  const navigate = useNavigate();

  const { getPracticeStatus, getBatchStatus } = useEvaluations();
  const [batchStatusLoading, setBatchStatusLoading] = useState(true);

  // ponytail: single confirm dialog state, reused for mark-failed, culminate
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'info' | 'warning' | 'error';
  } | null>(null);

  // Withdraw dialog state (con tipo de retiro + motivo)
  const [withdrawDialog, setWithdrawDialog] = useState<{
    practiceId: number;
    studentName: string;
  } | null>(null);
  const [withdrawType, setWithdrawType] = useState<'justified' | 'unjustified'>('unjustified');
  const [withdrawReason, setWithdrawReason] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  // Reclassify dialog state
  const [reclassifyDialog, setReclassifyDialog] = useState<{
    practiceId: number;
    studentName: string;
  } | null>(null);
  const [reclassifyReason, setReclassifyReason] = useState('');
  const [reclassifyLoading, setReclassifyLoading] = useState(false);

  // Unfreeze dialog state
  const [unfreezeDialog, setUnfreezeDialog] = useState<{
    practiceId: number;
    studentName: string;
  } | null>(null);
  const [unfreezeReason, setUnfreezeReason] = useState('');
  const [unfreezeLoading, setUnfreezeLoading] = useState(false);

  // Extension dialog state (carga extemporánea)
  const [extensionDialog, setExtensionDialog] = useState<{
    practiceId: number;
    studentName: string;
  } | null>(null);
  const [extensionReason, setExtensionReason] = useState('');
  const [extensionLoading, setExtensionLoading] = useState(false);

  // Committee assignment dialog state (Mejora 2)
  const [committeeDialog, setCommitteeDialog] = useState<{ practiceId: number; studentName: string } | null>(null);
  const [committeeMembers, setCommitteeMembers] = useState<{ memberIndex: number; evaluatorName: string; evaluatorCi: string }[]>([
    { memberIndex: 1, evaluatorName: '', evaluatorCi: '' },
    { memberIndex: 2, evaluatorName: '', evaluatorCi: '' },
    { memberIndex: 3, evaluatorName: '', evaluatorCi: '' },
  ]);
  const [committeeLoading, setCommitteeLoading] = useState(false);
  const [committeeSaving, setCommitteeSaving] = useState(false);

  const tabsState = useTabs({ defaultTab: 'institucional' });

  // Contadores por tipo de evaluador
  const tabCounts = useMemo(() => {
    const committeeMin = evalConfig.committeeMinMembers ?? 3;
    const counts = { INSTITUCIONAL: { completed: 0, partial: 0, pending: 0 }, ACADEMICO: { completed: 0, partial: 0, pending: 0 }, COMITE: { completed: 0, partial: 0, pending: 0 } };
    Object.values(practiceStatuses).forEach(s => {
      if (!s?.evaluations) return;
      (['INSTITUCIONAL', 'ACADEMICO', 'COMITE'] as const).forEach(type => {
        const e = s.evaluations[type];
        if (!e) counts[type].pending++;
        else if (type === 'COMITE') {
          const m = (e as any).members?.length || 0;
          if (m >= committeeMin) counts[type].completed++;
          else if (m > 0) counts[type].partial++;
          else counts[type].pending++;
        } else if (e.completed) counts[type].completed++;
        else counts[type].pending++;
      });
    });
    return {
      institucional: counts.INSTITUCIONAL,
      academica: counts.ACADEMICO,
      comite: counts.COMITE,
    };
  }, [practiceStatuses, evalConfig.committeeMinMembers]);

  const EVAL_LIST_TABS = [
    { id: 'institucional', label: `Institucional (${tabCounts.institucional.completed}/${tabCounts.institucional.completed + tabCounts.institucional.partial + tabCounts.institucional.pending || 1})` },
    { id: 'academica', label: `Académica (${tabCounts.academica.completed}/${tabCounts.academica.completed + tabCounts.academica.partial + tabCounts.academica.pending || 1})` },
    { id: 'comite', label: `Comité (${tabCounts.comite.completed}/${tabCounts.comite.completed + tabCounts.comite.partial + tabCounts.comite.pending || 1})` },
  ];

  const activeEvaluatorType: EvaluatorType = tabsState.activeTab === 'institucional' ? 'INSTITUCIONAL'
    : tabsState.activeTab === 'academica' ? 'ACADEMICO'
    : 'COMITE';

  const fetchPractices = async () => {
    try {
      setPracticesLoading(true);
      const response = await apiClient.get<ApiPracticeResponse>('/enrollments/practices');
      if (response.data.success) {
        setPractices(response.data.data);
      }
    } catch (error) {
      console.error('[EvaluationsPage] Error fetching practices:', error);
      addToast(TOAST.loadError());
    } finally {
      setPracticesLoading(false);
    }
  };

  useEffect(() => {
    fetchPractices();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (practices.length > 0) {
      setBatchStatusLoading(true);
      getBatchStatus(practices.map(p => p.professionalPracticeId)).then(statuses => {
        if (Object.keys(statuses).length > 0) {
          setPracticeStatuses(prev => ({ ...prev, ...statuses }));
        }
        setBatchStatusLoading(false);
      });
    } else {
      setBatchStatusLoading(false);
    }
  }, [practices, getBatchStatus]);

  const filteredPractices = useMemo(() => {
    if (!searchTerm) return practices;
    return practices.filter(p =>
      matchSearch(p.studentName, searchTerm) ||
      matchSearch(p.studentCi, searchTerm) ||
      matchSearch(p.institutionName, searchTerm)
    );
  }, [practices, searchTerm]);

  const handleOpenEvaluation = (practice: PracticeWithStudent, type: EvaluatorType) => {
    setSelectedPractice(practice);
    setSelectedEvaluatorType(type);
    setEditEvaluationId(null);
    setModalOpen(true);
    if (type === 'COMITE') {
      evaluationService.getCommitteeAssignments(practice.professionalPracticeId)
        .then(assignments => setCommitteeAssignments(assignments))
        .catch(() => setCommitteeAssignments([]));
    }
  };

  // Miembros existentes del comité para la práctica seleccionada
  const existingComiteMembers = useMemo(() => {
    if (!selectedPractice) return [];
    const status = practiceStatuses[selectedPractice.professionalPracticeId];
    const comite = (status?.evaluations as any)?.['COMITE'];
    return comite?.members || [];
  }, [selectedPractice, practiceStatuses]);

  const handleViewDetails = (evaluationId: number) => {
    setSelectedEvaluationId(evaluationId);
    setDetailModalOpen(true);
  };

  const handleMarkFailed = (practiceId: number, studentName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Marcar como Reprobado',
      message: `¿Estás seguro de marcar como REPROBADO a ${studentName}? El estudiante deberá reinscribir la práctica en un próximo período. Esta acción no se puede deshacer.`,
      variant: 'error',
      onConfirm: async () => {
        try {
          await apiClient.post(`/evaluations/${practiceId}/mark-failed`);
          setPractices(prev => prev.filter(p => p.professionalPracticeId !== practiceId));
          addToast({ variant: "success", title: "Reprobado", message: "Práctica marcada como Reprobada" });
        } catch (error: any) {
          const message = error.response?.data?.message || 'Error al marcar como reprobado';
          addToast({ variant: "error", title: "Error", message });
        } finally {
          setConfirmDialog(null);
        }
      },
    });
  };

  const handleWithdraw = (practiceId: number, studentName: string) => {
    setWithdrawDialog({ practiceId, studentName });
    setWithdrawType('unjustified');
    setWithdrawReason('');
  };

  const handleWithdrawConfirm = async () => {
    if (!withdrawDialog) return;
    const { practiceId, studentName } = withdrawDialog;

    if (withdrawType === 'justified' && withdrawReason.trim().length < 10) {
      addToast({ variant: "error", title: "Dato inválido", message: "El motivo debe tener al menos 10 caracteres" });
      return;
    }

    setWithdrawLoading(true);
    try {
      await apiClient.patch(`/enrollments/${practiceId}/withdraw`, {
        withdrawalType: withdrawType,
        justificationReason: withdrawType === 'justified' ? withdrawReason.trim() : undefined,
      });
      setPractices(prev => prev.filter(p => p.professionalPracticeId !== practiceId));
      setPracticeStatuses(prev => {
        const next = { ...prev };
        delete next[practiceId];
        return next;
      });
      addToast(
        withdrawType === 'justified'
          ? { variant: "success", title: "Retirado", message: `Práctica de ${studentName} retirada con justificativo` }
          : { variant: "success", title: "Retirado", message: `Práctica de ${studentName} retirada sin justificativo` }
      );
      setWithdrawDialog(null);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al retirar práctica';
      addToast({ variant: "error", title: "Error al retirar", message: msg });
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleReclassifyWithdrawal = (practiceId: number, studentName: string) => {
    setReclassifyDialog({ practiceId, studentName });
    setReclassifyReason('');
  };

  const handleReclassifyConfirm = async () => {
    if (!reclassifyDialog) return;
    if (reclassifyReason.trim().length < 10) {
      addToast({ variant: "error", title: "Dato inválido", message: "El motivo debe tener al menos 10 caracteres" });
      return;
    }
    setReclassifyLoading(true);
    try {
      await apiClient.patch(`/enrollments/${reclassifyDialog.practiceId}/reclassify-withdrawal`, {
        justificationReason: reclassifyReason.trim(),
      });
      addToast({ variant: "success", title: "Reclasificado", message: `Retiro de ${reclassifyDialog.studentName} reclasificado a con justificativo` });
      setReclassifyDialog(null);
      // Refresh: la práctica ya no debería mostrar el badge de pendiente
      fetchPractices();
    } catch (error: any) {
      addToast({ variant: "error", title: "Error al reclasificar", message: error.response?.data?.message || 'Error al reclasificar retiro' });
    } finally {
      setReclassifyLoading(false);
    }
  };

  const handleCulminate = (practiceId: number, studentName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Culminar Práctica',
      message: `¿Estás seguro de culminar la práctica de ${studentName}? Se aprobará la culminación si todas las evaluaciones están completas y cumple los requisitos.`,
      variant: 'info',
      onConfirm: async () => {
        try {
          await culminationService.approve(String(practiceId));
          addToast({ variant: "success", title: "Culminado", message: `Práctica de ${studentName} culminada exitosamente` });
          // Refresh status
          getPracticeStatus(practiceId).then(status => {
            if (status) {
              setPracticeStatuses(prev => ({ ...prev, [practiceId]: status }));
            }
          });
        } catch (error: any) {
          const msg = error.response?.data?.message || 'Error al culminar práctica';
          addToast({ variant: "error", title: "Error al culminar", message: msg });
        } finally {
          setConfirmDialog(null);
        }
      },
    });
  };

  const handleUnfreeze = (practiceId: number) => {
    setUnfreezeDialog({ practiceId, studentName: practices.find(p => p.professionalPracticeId === practiceId)?.studentName || '' });
    setUnfreezeReason('');
  };

  const handleUnfreezeConfirm = async () => {
    if (!unfreezeDialog) return;
    if (unfreezeReason.trim().length < 10) {
      addToast({ variant: "error", title: "Dato inválido", message: "El motivo debe tener al menos 10 caracteres" });
      return;
    }
    setUnfreezeLoading(true);
    try {
      await evaluationService.unfreezePractice(unfreezeDialog.practiceId, unfreezeReason.trim());
      addToast({ variant: "success", title: "Descongelado", message: "Evaluaciones descongeladas para corrección" });
      setUnfreezeDialog(null);
      setUnfreezeReason('');
      const statuses = await evaluationService.getBatchPracticeStatus(practices.map(p => p.professionalPracticeId));
      setPracticeStatuses(statuses);
    } catch (error: any) {
      addToast({ variant: "error", title: "Error al descongelar", message: error.response?.data?.message || 'Error al descongelar evaluaciones' });
    } finally {
      setUnfreezeLoading(false);
    }
  };

  const handleGrantExtension = async () => {
    if (!extensionDialog) return;
    if (extensionReason.trim().length < 10) {
      addToast({ variant: "error", title: "Dato inválido", message: "El motivo debe tener al menos 10 caracteres" });
      return;
    }
    setExtensionLoading(true);
    try {
      await evaluationService.grantExtension(extensionDialog.practiceId, extensionReason.trim());
      addToast({ variant: "success", title: "Extensión habilitada", message: "Carga extemporánea habilitada. Ya podés registrar evaluaciones." });
      setExtensionDialog(null);
      setExtensionReason('');
      const statuses = await evaluationService.getBatchPracticeStatus(practices.map(p => p.professionalPracticeId));
      setPracticeStatuses(statuses);
    } catch (error: any) {
      addToast({ variant: "error", title: "Error al habilitar extensión", message: error.response?.data?.message || 'Error al habilitar carga extemporánea' });
    } finally {
      setExtensionLoading(false);
    }
  };

  const handleRevokeExtension = async (practiceId: number) => {
    const practice = practices.find(p => p.professionalPracticeId === practiceId);
    setConfirmDialog({
      isOpen: true,
      title: 'Revocar Carga Extemporánea',
      message: `¿Estás seguro de revocar la carga extemporánea para ${practice?.studentName || 'este estudiante'}? Las validaciones de período volverán a aplicarse.`,
      variant: 'warning',
      onConfirm: async () => {
        try {
          await evaluationService.revokeExtension(practiceId, 'Revocado por el administrador');
          addToast({ variant: "success", title: "Extensión revocada", message: "Carga extemporánea revocada" });
          const statuses = await evaluationService.getBatchPracticeStatus(practices.map(p => p.professionalPracticeId));
          setPracticeStatuses(statuses);
        } catch (error: any) {
          addToast({ variant: "error", title: "Error al revocar", message: error.response?.data?.message || 'Error al revocar extensión' });
        }
      },
    });
  };

  // Committee assignment handlers (Mejora 2)
  const handleOpenCommittee = async (practiceId: number, studentName: string) => {
    setCommitteeDialog({ practiceId, studentName });
    setCommitteeLoading(true);
    try {
      const existing = await evaluationService.getCommitteeAssignments(practiceId);
      const members = [1, 2, 3].map(idx => {
        const found = existing.find(m => m.memberIndex === idx);
        return { memberIndex: idx, evaluatorName: found?.evaluatorName || '', evaluatorCi: found?.evaluatorCi || '' };
      });
      setCommitteeMembers(members);
    } catch {
      setCommitteeMembers([1, 2, 3].map(i => ({ memberIndex: i, evaluatorName: '', evaluatorCi: '' })));
    } finally {
      setCommitteeLoading(false);
    }
  };

  const handleCommitteeSave = async () => {
    if (!committeeDialog) return;
    const filled = committeeMembers.filter(m => m.evaluatorName.trim().length > 0);
    if (filled.length === 0) { addToast({ variant: "error", title: "Dato requerido", message: "Asigná al menos un miembro" }); return; }
    setCommitteeSaving(true);
    try {
      await evaluationService.upsertCommitteeAssignments(committeeDialog.practiceId, filled);
      addToast({ variant: "success", title: "Comité asignado", message: "Comité asignado exitosamente" });
      setCommitteeDialog(null);
    } catch (error: any) {
      addToast({ variant: "error", title: "Error al asignar comité", message: error.response?.data?.message || 'Error al asignar comité' });
    } finally {
      setCommitteeSaving(false);
    }
  };

  const handleFreezeAll = () => {
    const completedIds = practices
      .filter(p => practiceStatuses[p.professionalPracticeId]?.evaluationStatus === 'completed')
      .map(p => p.professionalPracticeId);

    if (completedIds.length === 0) {
      addToast({ variant: "error", title: "Sin datos", message: "No hay prácticas con evaluaciones completas para congelar" });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Cierre de Actas',
      message: `¿Estás seguro de querer cerrar las actas de ${completedIds.length} prácticas? Una vez congeladas, no se podrán modificar las evaluaciones sin autorización del coordinador.`,
      variant: 'warning',
      onConfirm: async () => {
        try {
          await evaluationService.freezeBatch(completedIds);
          addToast({ variant: "success", title: "Actas cerradas", message: `${completedIds.length} prácticas congeladas exitosamente` });
          // Refrescar statuses para actualizar la UI
          const statuses = await evaluationService.getBatchPracticeStatus(practices.map(p => p.professionalPracticeId));
          setPracticeStatuses(statuses);
        } catch (error: any) {
          addToast({ variant: "error", title: "Error al congelar", message: error.response?.data?.message || 'Error al congelar evaluaciones' });
        } finally {
          setConfirmDialog(null);
        }
      },
    });
  };

  const handleEvaluationSuccess = () => {
    if (selectedPractice) {
      getPracticeStatus(selectedPractice.professionalPracticeId).then(status => {
        if (status) {
          setPracticeStatuses(prev => ({
            ...prev,
            [selectedPractice.professionalPracticeId]: status
          }));
          // Si completó la última evaluación, sugerir culminar
          const allDone = status.evaluationStatus === 'completed' && status.practicesStatus !== 3;
          if (allDone) {
            toast(
              (t) => (
                <div className="flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium">¡Evaluaciones completas!</p>
                    <p className="text-sm text-gray-500">Podés culminar la práctica desde la columna Acciones.</p>
                  </div>
                  <button
                    onClick={() => {
                      toast.dismiss(t.id);
                      handleCulminate(selectedPractice.professionalPracticeId, selectedPractice.studentName);
                    }}
                    className="px-3 py-1.5 text-sm font-medium bg-brand-500 text-white rounded-lg hover:bg-brand-600"
                  >
                    Culminar
                  </button>
                </div>
              ),
              { duration: 8000 }
            );
          }
        }
      });
    }
  };

  const getEvaluationButton = (practice: PracticeWithStudent, type: EvaluatorType) => {
    const status = practiceStatuses[practice.professionalPracticeId];
    const evaluation = status?.evaluations[type];
    const canEvaluate = status?.canEvaluate !== false;
    const isComite = type === 'COMITE';

    // Si ya está completa o el periodo está cerrado, no permitir crear
    const canCreate = canEvaluate && (evaluation?.completed ? false : true);
    const isPeriodBlocked = !canEvaluate && !evaluation?.completed;

    // COMITE: mostrar progreso de miembros
    if (isComite) {
      const comite = status?.evaluations['COMITE'] as any;
      const memberCount = comite?.members?.length || 0;
      const committeeMin = evalConfig.committeeMinMembers ?? 3;
      const completedCount = `${memberCount}/${committeeMin}`;
      const isFullComite = memberCount >= committeeMin;
      const allMembers = comite?.members || [];

      if (isFullComite) {
        return (
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1">
              <button
                onClick={() => allMembers[0]?.evaluationId && handleViewDetails(allMembers[0].evaluationId)}
                className="flex items-center gap-1 px-2 py-1.5 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                title="Ver detalles"
              >
                <EyeIcon className="w-4 h-4" />
              </button>
              {isReadOnly ? (
                <span className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 rounded-lg cursor-not-allowed">
                  <LockIcon className="w-4 h-4" />
                  <span>{comite.score.toFixed(1)}</span>
                </span>
              ) : (
                <button
                  onClick={() => {
                    setSelectedPractice(practice);
                    setSelectedEvaluatorType(type);
                    setEditEvaluationId(allMembers[0]?.evaluationId || null);
                    setModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                  title="Editar miembros del comité"
                >
                  <EditIcon className="w-4 h-4" />
                  <span>{comite.score.toFixed(1)}</span>
                </button>
              )}
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {completedCount}
            </span>
          </div>
        );
      }

      if (memberCount > 0) {
        const blockReason = status?.sequentialBlocked
          ? status.periodMessage
          : isPeriodBlocked
            ? status?.periodMessage || 'Periodo cerrado'
            : '';
        const isBlocked = status?.sequentialBlocked || isPeriodBlocked || status?.practicesStatus === 3;
        return (
          <div className="flex flex-col items-center gap-1">
            {isReadOnly || isBlocked ? (
              <span
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg cursor-not-allowed border ${
                  status?.sequentialBlocked
                    ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800/30'
                    : status?.practicesStatus === 3
                      ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800/30'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700'
                }`}
                title={blockReason}
              >
                {status?.sequentialBlocked ? <AlertIcon className="w-4 h-4" /> : status?.practicesStatus === 3 ? <CheckCircleIcon className="w-4 h-4" /> : <TimeIcon className="w-4 h-4" />}
                <span>{status?.sequentialBlocked ? 'Secuencial' : status?.practicesStatus === 3 ? 'Culminado' : completedCount}</span>
              </span>
            ) : (
              <button
                onClick={() => {
                  setSelectedPractice(practice);
                  setSelectedEvaluatorType(type);
                  setEditEvaluationId(null);
                  setModalOpen(true);
                }}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors border border-amber-200 dark:border-amber-800/30"
                title="Añadir miembro del comité"
              >
                <EditIcon className="w-4 h-4" />
                <span>{completedCount}</span>
              </button>
            )}
            <div className="flex gap-1">
              {allMembers.map((m: any) => (
                <button
                  key={m.memberIndex}
                  onClick={() => {
                    setSelectedPractice(practice);
                    setSelectedEvaluatorType('COMITE');
                    setEditEvaluationId(m.evaluationId);
                    setModalOpen(true);
                  }}
                  className="w-5 h-5 flex items-center justify-center text-[10px] font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50"
                  title={`Editar miembro #${m.memberIndex}: ${m.evaluatorName} — ${m.score.toFixed(1)}pts`}
                >
                  {m.memberIndex}
                </button>
              ))}
          </div>
        </div>
        );
      }

      // Comité sin miembros: mostrar bloqueado/secuencial/culminado/pendiente
      if (status?.sequentialBlocked) {
        return (
          <span className="flex items-center gap-2 px-3 py-1.5 text-sm bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg cursor-not-allowed border border-orange-200 dark:border-orange-800/30" title={status?.periodMessage || ''}>
            <AlertIcon className="w-4 h-4" />
            <span>Secuencial</span>
          </span>
        );
      }

      if (status?.practicesStatus === 3) {
        return (
          <span className="flex items-center gap-2 px-3 py-1.5 text-sm bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 rounded-lg cursor-default border border-teal-200 dark:border-teal-800/30">
            <CheckCircleIcon className="w-4 h-4" />
            <span>Culminado</span>
          </span>
        );
      }

      if (isReadOnly) {
        return (
          <span className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 rounded-lg cursor-not-allowed">
            <LockIcon className="w-4 h-4" />
            <span>Pendiente</span>
          </span>
        );
      }

      if (isPeriodBlocked) {
        return (
          <span
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 rounded-lg cursor-not-allowed"
            title={status?.periodMessage || 'Periodo cerrado'}
          >
            <CloseLineIcon className="w-4 h-4" />
            <span>Cerrado</span>
          </span>
        );
      }

      return (
        <button
          onClick={() => handleOpenEvaluation(practice, type)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/30 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
          title="Haz clic para crear la evaluación"
        >
          <EditIcon className="w-4 h-4" />
          <span>Pendiente</span>
        </button>
      );
    }
    // INSTITUCIONAL / ACADEMICO
    // ponytail: reached only if eval incomplete, not blocked, not culminated, not read-only, period open
    if (evaluation?.completed) {
      return (
        <div className="flex items-center gap-1">
          <button
            onClick={() => (evaluation as any).evaluationId && handleViewDetails((evaluation as any).evaluationId)}
            className="flex items-center gap-1 px-2 py-1.5 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
            title="Ver detalles"
          >
            <EyeIcon className="w-4 h-4" />
          </button>
          {isReadOnly ? (
            <span className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 rounded-lg cursor-not-allowed" title="Solo lectura: no puedes editar evaluaciones">
              <LockIcon className="w-4 h-4" />
              <span>{evaluation.score.toFixed(1)}</span>
            </span>
          ) : (
            <button
              onClick={() => {
                setSelectedPractice(practice);
                setSelectedEvaluatorType(type);
                setEditEvaluationId((evaluation as any).evaluationId);
                setModalOpen(true);
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
              title="Editar evaluación"
            >
              <EditIcon className="w-4 h-4" />
              <span>{evaluation.score.toFixed(1)}</span>
            </button>
          )}
        </div>
      );
    }

    // Bloqueado por prerrequisito secuencial
    if (status?.sequentialBlocked) {
      const msg = status?.periodMessage || 'Requiere aprobar práctica de mayor prioridad primero';
      if (isReadOnly) {
        return (
          <span className="flex items-center gap-2 px-3 py-1.5 text-sm bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg cursor-not-allowed border border-orange-200 dark:border-orange-800/30" title={msg}>
            <AlertIcon className="w-4 h-4" />
            <span>Secuencial</span>
          </span>
        );
      }
      return (
        <span
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg cursor-not-allowed border border-orange-200 dark:border-orange-800/30"
          title={msg}
        >
          <AlertIcon className="w-4 h-4" />
          <span>Secuencial</span>
        </span>
      );
    }

    // Práctica culminada
    if (status?.practicesStatus === 3) {
      return (
        <span className="flex items-center gap-2 px-3 py-1.5 text-sm bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 rounded-lg cursor-default border border-teal-200 dark:border-teal-800/30"
          title="Práctica culminada — no se pueden registrar más evaluaciones"
        >
          <CheckCircleIcon className="w-4 h-4" />
          <span>Culminado</span>
        </span>
      );
    }

    if (isReadOnly) {
      return (
        <span className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 rounded-lg cursor-not-allowed" title="Solo lectura: no puedes crear evaluaciones">
          <LockIcon className="w-4 h-4" />
          <span>Pendiente</span>
        </span>
      );
    }

    if (isPeriodBlocked) {
      return (
        <span
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 rounded-lg cursor-not-allowed"
          title={status?.periodMessage || 'El período académico está cerrado, no se pueden registrar evaluaciones'}
        >
          <CloseLineIcon className="w-4 h-4" />
          <span>Cerrado</span>
        </span>
      );
    }

    return (
      <button
        onClick={() => handleOpenEvaluation(practice, type)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/30 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
        title="Haz clic para crear la evaluación"
      >
        <EditIcon className="w-4 h-4" />
        <span>Pendiente</span>
      </button>
    );
  };

  const getStatusBadge = (status: string, practice?: PracticeWithStudent) => {
    // Si la práctica está reprobada, mostrar badge rojo
    if (practice?.result === 'failed' || practice?.practicesStatus === 4) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
          <CloseLineIcon className="w-3 h-3" />
          Reprobado
        </span>
      );
    }

    // Descriptive messages for each practice
    const practiceId = practice?.professionalPracticeId;
    const pStatus = practiceId ? practiceStatuses[practiceId] : null;
    if (pStatus?.evaluations && status !== 'completed') {
      const missingTypes: string[] = [];
      const evals = pStatus.evaluations;
      if (!evals.INSTITUCIONAL?.completed) missingTypes.push('Institucional');
      if (!evals.ACADEMICO?.completed) missingTypes.push('Académica');
      if (!evals.COMITE?.completed) {
        const mCount = evals.COMITE?.members?.length || 0;
        const min = evalConfig.committeeMinMembers ?? 3;
        missingTypes.push(mCount > 0 ? `Comité (${mCount}/${min})` : 'Comité');
      }

      if (missingTypes.length > 0) {
        const message = `Falta: ${missingTypes.join(', ')}`;
        return (
          <span
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full cursor-default"
            title={message}
          >
            <TimeIcon className="w-3 h-3" />
            {message}
          </span>
        );
      }
    }

    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
            <CheckCircleIcon className="w-3 h-3" />
            Completo
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full">
            <TimeIcon className="w-3 h-3" />
            Parcial
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
            <AlertIcon className="w-3 h-3" />
            Pendiente
          </span>
        );
    }
  };

  return (
    <ErrorBoundary
      fallback={
        <div className="p-6 rounded-xl border border-error-200 bg-error-50 dark:bg-error-500/10 dark:border-error-500/20">
          <div className="flex flex-col items-center justify-center text-center p-8">
            <h3 className="text-lg font-semibold text-error-900 dark:text-error-400 mb-2">
              Error en la página de Evaluaciones
            </h3>
            <p className="text-error-700 dark:text-error-500/80">
              Intenta recargar la página.
            </p>
          </div>
        </div>
      }
    >
      <>
        <PageMeta
          title="Evaluaciones"
          description="Gestión de evaluaciones de prácticas profesionales"
        />
        <SkeletonLoader isLoading={pageLoading} skeleton={<BreadcrumbSkeleton />}>
          <PageBreadcrumb pageTitle="Evaluaciones" />
        </SkeletonLoader>

        <div className="stagger-delay">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <SkeletonLoader isLoading={pageLoading} skeleton={<TitleSkeleton />}>
                <h2 className="text-2xl font-bold text-text-primary dark:text-white/90">
                  Gestión de Evaluaciones
                </h2>
                <p className="mt-1 text-sm text-text-secondary dark:text-text-tertiary">
                  Registra y consulta evaluaciones de prácticas profesionales.
                </p>
              </SkeletonLoader>
            </div>
            {!isReadOnly && (
              <button
                onClick={handleFreezeAll}
                className="px-4 py-2 text-sm font-medium bg-gray-800 dark:bg-white text-white dark:text-gray-800 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors shrink-0"
                title="Congelar todas las evaluaciones completas"
              >
                Cierre de Actas
              </button>
            )}
          </div>

          {isReadOnly && (
            <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40">
              <div className="flex items-start gap-2">
                <LockIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  Modo solo lectura: tu rol de ASISTENTE no permite crear o editar evaluaciones.
                </p>
              </div>
            </div>
          )}

          <ComponentCard title="Prácticas Profesionales">
            <Tabs options={EVAL_LIST_TABS} {...tabsState.tabProps} variant="underline" className="mb-6" />

            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar por estudiante, cédula o institución..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Estudiante
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Institución
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {tabsState.activeTab === 'institucional' && `Institucional (${(evalConfig.weights['INSTITUCIONAL'] * 100).toFixed(0)}%)`}
                      {tabsState.activeTab === 'academica' && `Académico (${(evalConfig.weights['ACADEMICO'] * 100).toFixed(0)}%)`}
                      {tabsState.activeTab === 'comite' && `Comité (${(evalConfig.weights['COMITE'] * 100).toFixed(0)}%)`}
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Nota Final
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {practicesLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        Cargando prácticas...
                      </td>
                    </tr>
                  ) : filteredPractices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No se encontraron prácticas
                      </td>
                    </tr>
                  ) : (
                    filteredPractices.map((practice) => {
                      const status = practiceStatuses[practice.professionalPracticeId];
                      return (
                        <tr
                          key={practice.professionalPracticeId}
                          className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {practice.studentName}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {practice.studentCi}
                                </p>
                              </div>
                              {practice.practicesStatus === 0 && practice.withdrawalType === 'unjustified' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full shrink-0" title="Pendiente de justificativo">
                                  ⏳ Pendiente justificativo
                                </span>
                              )}
                              {status?.extensionGranted && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full shrink-0" title="Carga extemporánea habilitada">
                                  Carga Ext.
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                              {practice.practiceType?.substring(0, 4).toUpperCase() || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {practice.institutionName}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {getEvaluationButton(practice, activeEvaluatorType)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-lg font-bold text-brand-500">
                              {status?.finalGrade || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {getStatusBadge(status?.evaluationStatus || 'pending', practice)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {!isReadOnly && (
                                <button
                                  onClick={() => handleOpenCommittee(practice.professionalPracticeId, practice.studentName)}
                                  className="p-1.5 text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                                  title="Pre-asignar miembros del comité evaluador"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-6-5.354M12 7a2 2 0 100-4 2 2 0 000 4z" /></svg>
                                </button>
                              )}
                              {!isReadOnly && status?.canEvaluate === false && status?.practicesStatus === 2 && !status?.extensionGranted && (
                                <button
                                  onClick={() => setExtensionDialog({ practiceId: practice.professionalPracticeId, studentName: practice.studentName })}
                                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                                  title="Habilitar carga extemporánea"
                                >
                                  <TimeIcon className="w-3.5 h-3.5" />
                                  Carga Ext.
                                </button>
                              )}
                              {!isReadOnly && status?.extensionGranted && (
                                <button
                                  onClick={() => handleRevokeExtension(practice.professionalPracticeId)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                  title="Revocar carga extemporánea"
                                >
                                  <CloseLineIcon className="w-3.5 h-3.5" />
                                  Revocar
                                </button>
                              )}
                              {status?.evaluationStatus === 'completed' && status?.practicesStatus !== 3 && !isReadOnly && (
                                <button
                                  onClick={() => handleCulminate(practice.professionalPracticeId, practice.studentName)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                  title="Todas las evaluaciones completas. Aprobar culminación de la práctica."
                                >
                                  <CheckIcon className="w-3.5 h-3.5" />
                                  Culminar
                                </button>
                              )}
                              {!isReadOnly && status?.evaluationStatus === 'completed' && (
                                <button
                                  onClick={() => handleUnfreeze(practice.professionalPracticeId)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors"
                                  title="Descongelar evaluaciones para corrección post-cierre"
                                >
                                  <TimeIcon className="w-3.5 h-3.5" />
                                  Descongelar
                                </button>
                              )}
                              {practice.practicesStatus === 0 && practice.withdrawalType === 'unjustified' ? (
                                !isReadOnly && (
                                  <button
                                    onClick={() => handleReclassifyWithdrawal(practice.professionalPracticeId, practice.studentName)}
                                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                    title="El estudiante trajo el justificativo — reclasificar retiro"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Presentó justificativo
                                  </button>
                                )
                              ) : (
                                <>
                              {!isReadOnly && practice.practicesStatus !== 4 && (
                                <button
                                  onClick={() => handleMarkFailed(practice.professionalPracticeId, practice.studentName)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                  title="Marcar como Reprobado — el estudiante deberá reinscribir en otro período"
                                >
                                  <CloseLineIcon className="w-4 h-4" />
                                </button>
                              )}
                              {!isReadOnly && (
                                <button
                                  onClick={() => handleWithdraw(practice.professionalPracticeId, practice.studentName)}
                                  className="p-1.5 text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                                  title="Retirar práctica — el estudiante abandonó la práctica"
                                >
                                  <TimeIcon className="w-4 h-4" />
                                </button>
                              )}
                              </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </ComponentCard>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <ComponentCard title="Evaluación Institucional" className="bg-blue-50 dark:bg-blue-900/20">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Realizada por el tutor de la institución donde el estudiante realiza su pasantía.
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {(evalConfig.weights['INSTITUCIONAL'] * 100).toFixed(0)}%
              </p>
            </ComponentCard>

            <ComponentCard title="Evaluación Académica" className="bg-purple-50 dark:bg-purple-900/20">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Realizada por el tutor académico asignado por la universidad.
              </p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {(evalConfig.weights['ACADEMICO'] * 100).toFixed(0)}%
              </p>
            </ComponentCard>

            <ComponentCard title="Evaluación Comité" className="bg-green-50 dark:bg-green-900/20">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Realizada por el comité evaluador durante la defensa oral.
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {(evalConfig.weights['COMITE'] * 100).toFixed(0)}%
              </p>
            </ComponentCard>
          </div>
        </div>

        {selectedPractice && selectedEvaluatorType && (
          <EvaluationModal
            isOpen={modalOpen}
            onClose={() => {
              setModalOpen(false);
              setSelectedPractice(null);
              setSelectedEvaluatorType(null);
              setEditEvaluationId(null);
            }}
            practiceId={selectedPractice.professionalPracticeId}
            evaluatorType={selectedEvaluatorType}
            evaluationId={editEvaluationId}
            existingComiteMembers={existingComiteMembers}
            committeeAssignments={committeeAssignments}
            onSuccess={handleEvaluationSuccess}
          />
        )}

        <EvaluationDetailModal
          isOpen={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedEvaluationId(null);
          }}
          evaluationId={selectedEvaluationId}
        />

        {/* Confirm dialog para Reprobado, Retirar y Culminar */}
        <UnifiedDialog
          isOpen={!!confirmDialog}
          onClose={() => setConfirmDialog(null)}
          onConfirm={confirmDialog?.onConfirm || (() => {})}
          title={confirmDialog?.title || ''}
          message={confirmDialog?.message || ''}
          confirmLabel="Confirmar"
          variant={confirmDialog?.variant || 'info'}
        />

        {/* Modal de descongelar */}
        <Modal
          isOpen={!!unfreezeDialog}
          onClose={() => { setUnfreezeDialog(null); setUnfreezeReason(''); }}
          size="lg"
        >
          <ModalHeader>Descongelar Evaluaciones</ModalHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleUnfreezeConfirm(); }}>
            <ModalBody className="space-y-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Vas a descongelar las evaluaciones de <strong>{unfreezeDialog?.studentName}</strong>.
                Esto permitirá modificar las notas. La operación queda registrada en auditoría.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Motivo de la corrección *
                </label>
                <textarea
                  value={unfreezeReason}
                  onChange={(e) => setUnfreezeReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Explica por qué se necesita corregir la nota..."
                />
                {unfreezeReason.length > 0 && unfreezeReason.trim().length < 10 && (
                  <p className="mt-1 text-sm text-red-500">Mínimo 10 caracteres</p>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setUnfreezeDialog(null); setUnfreezeReason(''); }}
                disabled={unfreezeLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={unfreezeReason.trim().length < 10}
                loading={unfreezeLoading}
                loadingText="Descongelando..."
              >
                Descongelar
              </Button>
            </ModalFooter>
          </form>
        </Modal>

        {/* Modal de carga extemporánea */}
        <Modal
          isOpen={!!extensionDialog}
          onClose={() => { setExtensionDialog(null); setExtensionReason(''); }}
          size="lg"
        >
          <ModalHeader>Habilitar Carga Extemporánea</ModalHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleGrantExtension(); }}>
            <ModalBody className="space-y-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Vas a habilitar la carga de evaluaciones para <strong>{extensionDialog?.studentName || ''}</strong>
                fuera del periodo académico activo. Las validaciones de periodo y fecha se omitirán para esta práctica.
                La operación queda registrada en auditoría.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Motivo de la extensión *
                </label>
                <textarea
                  value={extensionReason}
                  onChange={(e) => setExtensionReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Explica por qué se necesita la carga extemporánea..."
                />
                {extensionReason.length > 0 && extensionReason.trim().length < 10 && (
                  <p className="mt-1 text-sm text-red-500">Mínimo 10 caracteres</p>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setExtensionDialog(null); setExtensionReason(''); }}
                disabled={extensionLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={extensionReason.trim().length < 10}
                loading={extensionLoading}
                loadingText="Habilitando..."
              >
                Habilitar
              </Button>
            </ModalFooter>
          </form>
        </Modal>

        {/* Modal de retiro con tipo de justificativo */}
        <Modal
          isOpen={!!withdrawDialog}
          onClose={() => { setWithdrawDialog(null); setWithdrawReason(''); }}
          size="lg"
        >
          <ModalHeader>Retirar Práctica — {withdrawDialog?.studentName || ''}</ModalHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleWithdrawConfirm(); }}>
            <ModalBody className="space-y-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                El estudiante abandonó la práctica. Indicá el tipo de retiro:
              </p>

              {/* Tipo de retiro */}
              <div className="space-y-3">
                <label className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                  withdrawType === 'unjustified'
                    ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="withdrawType"
                    value="unjustified"
                    checked={withdrawType === 'unjustified'}
                    onChange={() => setWithdrawType('unjustified')}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Sin justificativo</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      El estudiante abandonó sin justificación válida. Queda como reprobado.
                      Si es una práctica secuencial, las prácticas previas aprobadas también se retiran.
                      Deberá reinscribir ambas en el próximo período.
                    </p>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                  withdrawType === 'justified'
                    ? 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="withdrawType"
                    value="justified"
                    checked={withdrawType === 'justified'}
                    onChange={() => setWithdrawType('justified')}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Con justificativo</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      El estudiante tiene un justificativo válido. Puede reinscribirse en la práctica que falta
                      sin necesidad de repetir las ya aprobadas.
                    </p>
                  </div>
                </label>
              </div>

              {/* Motivo (solo para justificado) */}
              {withdrawType === 'justified' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Motivo del justificativo *
                  </label>
                  <textarea
                    value={withdrawReason}
                    onChange={(e) => setWithdrawReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Describí el motivo del abandono con justificativo..."
                  />
                  {withdrawReason.length > 0 && withdrawReason.trim().length < 10 && (
                    <p className="mt-1 text-sm text-red-500">Mínimo 10 caracteres</p>
                  )}
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setWithdrawDialog(null); setWithdrawReason(''); }}
                disabled={withdrawLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant={withdrawType === 'unjustified' ? 'error' : 'warning'}
                disabled={withdrawType === 'justified' && withdrawReason.trim().length < 10}
                loading={withdrawLoading}
                loadingText="Retirando..."
              >
                {withdrawType === 'unjustified' ? 'Retirar sin justificativo' : 'Retirar con justificativo'}
              </Button>
            </ModalFooter>
          </form>
        </Modal>

        {/* Modal de reclasificar retiro */}
        <Modal
          isOpen={!!reclassifyDialog}
          onClose={() => { setReclassifyDialog(null); setReclassifyReason(''); }}
          size="lg"
        >
          <ModalHeader>Presentó Justificativo — {reclassifyDialog?.studentName || ''}</ModalHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleReclassifyConfirm(); }}>
            <ModalBody className="space-y-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                El estudiante trajo el justificativo. Esto reclasifica el retiro de "sin justificativo" a "con justificativo".
              </p>
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  <strong>Importante:</strong> Si el retiro original arrastró prácticas previas (cascade),
                  esas prácticas serán restauradas a su estado anterior (CULMINADO).
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Motivo del justificativo *
                </label>
                <textarea
                  value={reclassifyReason}
                  onChange={(e) => setReclassifyReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Describí el motivo del justificativo que presentó el estudiante..."
                />
                {reclassifyReason.length > 0 && reclassifyReason.trim().length < 10 && (
                  <p className="mt-1 text-sm text-red-500">Mínimo 10 caracteres</p>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setReclassifyDialog(null); setReclassifyReason(''); }}
                disabled={reclassifyLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={reclassifyReason.trim().length < 10}
                loading={reclassifyLoading}
                loadingText="Reclasificando..."
              >
                Reclasificar a con justificativo
              </Button>
            </ModalFooter>
          </form>
        </Modal>

        {/* Modal de pre-asignación del comité (Mejora 2) */}
        <Modal
          isOpen={!!committeeDialog}
          onClose={() => { setCommitteeDialog(null); }}
          size="lg"
        >
          <ModalHeader>
            Pre-asignar Comité Evaluador — {committeeDialog?.studentName || ''}
          </ModalHeader>
          <ModalBody className="space-y-4">
            {committeeLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
              </div>
            ) : (
              [1, 2, 3].map(idx => {
                const member = committeeMembers.find(m => m.memberIndex === idx) || { memberIndex: idx, evaluatorName: '', evaluatorCi: '' };
                return (
                  <div key={idx} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Miembro #{idx}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nombre *</label>
                        <input
                          type="text"
                          value={member.evaluatorName}
                          onChange={(e) => {
                            setCommitteeMembers(prev => prev.map(m =>
                              m.memberIndex === idx ? { ...m, evaluatorName: e.target.value } : m
                            ));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-white text-sm"
                          placeholder="Nombre completo"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Cédula</label>
                        <input
                          type="text"
                          value={member.evaluatorCi}
                          onChange={(e) => {
                            setCommitteeMembers(prev => prev.map(m =>
                              m.memberIndex === idx ? { ...m, evaluatorCi: e.target.value } : m
                            ));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-white text-sm"
                          placeholder="V00.000.000"
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCommitteeDialog(null)}
              disabled={committeeSaving}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleCommitteeSave}
              disabled={committeeLoading || committeeSaving}
              loading={committeeSaving}
              loadingText="Guardando..."
            >
              Guardar
            </Button>
          </ModalFooter>
        </Modal>
      </>
    </ErrorBoundary>
  );
}
