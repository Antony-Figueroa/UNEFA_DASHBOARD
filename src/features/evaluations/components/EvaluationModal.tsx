import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../components/ui/modal';
import Button from '../../../components/ui/button/Button';
import {
  EvaluatorType,
  EVALUATOR_TYPE_LABELS,
  SystemEvaluationConfig,
  EvaluationCriteria,
  EvaluationStatus,
  EvaluationWithDetails,
} from '../types';
import { useEvaluations } from '../hooks/useEvaluations';
import { useSystemEvaluationConfig } from '../hooks/useSystemEvaluationConfig';
import { evaluationService } from '../services/evaluationService';
import { evaluationsCulminationService } from '../../evaluations-culmination/services/evaluationsCulminationService';
import { CloseActasResultsModal } from '../../evaluations-culmination/components/CloseActasResultsModal';
import { isSafeInput } from '../../../utils/inputValidation';
import { searchPersons } from '../../persons/services/personService';
import apiClient from '../../../api/apiClient';
import { SearchIcon } from '../../../icons';
import UnifiedDialog from '../../../components/ui/dialog/UnifiedDialog';
import { EvaluationFlowModal } from './EvaluationFlowModal';

const schema = z.object({
  evaluatorName: z.string()
    .min(3, 'Nombre del evaluador requerido')
    .max(100, "El nombre es demasiado largo")
    .refine(val => isSafeInput(val), { message: "Caracteres no permitidos" }),
  evaluatorCi: z.string().optional(),
  observations: z.string()
    .max(1000, "Las observaciones son demasiado largas")
    .refine(val => isSafeInput(val), { message: "Caracteres no permitidos" })
    .optional()
    .default('')
});

type FormData = z.infer<typeof schema>;

interface ComiteMemberInfo {
  memberIndex: number;
  evaluatorName: string;
  score: number;
  evaluationId: number;
}

interface EvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  practiceId: number;
  evaluatorType: EvaluatorType;
  evaluationId?: number | null;
  existingComiteMembers?: ComiteMemberInfo[];
  committeeAssignments?: { memberIndex: number; evaluatorName: string; evaluatorCi?: string }[];
  onSuccess: () => void;
  /** Si es true, la evaluación está congelada (actas cerradas) — solo lectura */
  isFrozen?: boolean;
  /**
   * Callback para navegar al siguiente paso en el flujo secuencial.
   * Se invoca después de guardar cuando hay más evaluaciones pendientes
   * y el paso actual no completa todas las evaluaciones.
   */
  onNavigateToNext?: (type: EvaluatorType, memberIndex?: number) => void;
  /** Información del estudiante para identificación en el modal */
  studentName?: string;
  studentCi?: string;
  careerName?: string;
  practiceTypeName?: string;
}

interface ComiteMemberData {
  evaluationId?: number;
  evaluatorName: string;
  evaluatorCi: string;
  observations: string;
  scores: Record<number, number>;
}

export const EvaluationModal: React.FC<EvaluationModalProps> = ({
  isOpen,
  onClose,
  practiceId,
  evaluatorType,
  evaluationId,
  existingComiteMembers = [],
  committeeAssignments = [],
  onSuccess,
  isFrozen = false,
  onNavigateToNext,
  studentName,
  studentCi,
  careerName,
  practiceTypeName,
}) => {
  const { criteria, fetchCriteria, createEvaluation, updateEvaluation, loading, error: submitError } = useEvaluations();
  const { config } = useSystemEvaluationConfig();
  const scoreRange = { min: config.score.min, max: config.score.max };
  const midpoint = scoreRange.min + Math.floor((scoreRange.max - scoreRange.min) / 2);
  const scoreStep = 0.5;
  const [itemScores, setItemScores] = useState<Record<number, number>>({});
  const [comiteData, setComiteData] = useState<Record<number, ComiteMemberData>>({});
  const [activeMember, setActiveMember] = useState<1 | 2 | 3>(1);
  const [criteriaLoaded, setCriteriaLoaded] = useState<EvaluationCriteria[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [existingData, setExistingData] = useState<EvaluationWithDetails | null>(null);
  const [initialLoading, setInitialLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  // Tracks whether the user has already dismissed the completion dialog ("Continuar Editando")
  // so it does not reappear on every subsequent save during the same editing session.
  const [completionDismissed, setCompletionDismissed] = useState(false);
  // Tracks the evaluation ID returned by the backend after the first save.
  // Needed so subsequent saves use update instead of create (prevents duplicates).
  const [savedEvaluationId, setSavedEvaluationId] = useState<number | undefined>(undefined);
  const isComiteMode = evaluatorType === 'COMITE';
  const isEditing = !isComiteMode && (!!(savedEvaluationId) || !!evaluationId);
  const isTutorEvaluator = evaluatorType !== 'COMITE';

  // Buscar reemplazo de evaluador
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ personId: number; firstName: string; lastName: string; ci: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionReason, setCompletionReason] = useState<'committee' | 'all'>('committee');

  // Flow modal state — shows after save when more evaluations are pending
  const [showFlowModal, setShowFlowModal] = useState(false);
  const [flowNextStep, setFlowNextStep] = useState<{ type: EvaluatorType; memberIndex?: number } | null>(null);

  // Close actas results modal state
  const [showCloseActasResults, setShowCloseActasResults] = useState(false);
  const [closeActasResults, setCloseActasResults] = useState<{
    results: any[];
    summary: { total: number; culminated: number; failed: number; skipped: number };
    autoPreEnrollResults: any[];
  } | null>(null);

  const navigate = useNavigate();

  const handleSearchInput = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const results = await searchPersons(q);
      setSearchResults(results);
    } catch { /* silent fail */ }
    setSearching(false);
  };

  const handleSelectPerson = (p: { firstName: string; lastName: string; ci: string }) => {
    setValue('evaluatorName', [p.firstName, p.lastName].filter(Boolean).join(' ').trim());
    setValue('evaluatorCi', p.ci || '');
    // Persist in comiteData
    if (isComiteMode) {
      setComiteData(prev => ({
        ...prev,
        [activeMember]: { ...prev[activeMember], evaluatorName: p.firstName + ' ' + p.lastName, evaluatorCi: p.ci || '' }
      }));
    }
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors }
  } = useForm<FormData>({
    // Safe: schema validates at runtime, resolver type mismatch is a known @hookform/resolvers × Zod quirk
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      evaluatorName: '',
      evaluatorCi: '',
      observations: ''
    }
  });

  // ── Inicializar comiteData al abrir el modal ──
  useEffect(() => {
    if (!isOpen || !isComiteMode || practiceId <= 0) return;

    let cancelled = false;
    const init = async () => {
      // Obtener pre-asignaciones desde t_committee_assignment
      let fetchedAssignments: { memberIndex: number; evaluatorName: string; evaluatorCi?: string }[] = [];
      try {
        fetchedAssignments = await evaluationService.getCommitteeAssignments(practiceId);
      } catch {
        // silencio
      }

      if (cancelled) return;

      const initData: Record<number, ComiteMemberData> = {};
      for (const idx of [1, 2, 3] as const) {
        const existing = existingComiteMembers.find(m => m.memberIndex === idx);
        const assignment = committeeAssignments.find(a => a.memberIndex === idx);
        const fetched = fetchedAssignments.find(a => a.memberIndex === idx);
        const preFill = fetched || assignment; // API assignment gana sobre prop
        initData[idx] = {
          evaluationId: existing?.evaluationId,
          evaluatorName: existing?.evaluatorName || preFill?.evaluatorName || '',
          evaluatorCi: preFill?.evaluatorCi || '',
          observations: '',
          scores: {},
        };
      }
      setComiteData(initData);
      // Auto-seleccionar primer miembro vacío, o el 1 si todos están llenos
      const used = new Set(existingComiteMembers.map(m => m.memberIndex));
      const firstEmpty = ([1, 2, 3] as const).find(idx => !used.has(idx));
      setActiveMember(firstEmpty || 1);
    };

    init();
    return () => { cancelled = true; };
  }, [isOpen, existingComiteMembers, committeeAssignments, practiceId]); // solo al abrir

  // ── Cuando cambia activeMember, cargar sus datos en el form ──
  useEffect(() => {
    if (!isOpen || !isComiteMode) return;
    const member = comiteData[activeMember];
    if (!member) return;

    // Si tiene evaluationId pero scores vacíos, cargar desde API
    if (member.evaluationId && Object.keys(member.scores).length === 0) {
      loadMemberEvaluation(activeMember, member.evaluationId);
      return;
    }

    // Sincronizar form con los datos del miembro
    setValue('evaluatorName', member.evaluatorName);
    setValue('evaluatorCi', member.evaluatorCi);
    setValue('observations', member.observations);
    setItemScores(member.scores);
    // NO hacer setDataLoaded(true) aquí — dejamos que el effect de criteria
    // inicialice los scores con midpoint si están vacíos
  }, [isOpen, isComiteMode, activeMember, comiteData]);

  const loadMemberEvaluation = async (memberIdx: number, evalId: number) => {
    setInitialLoading(true);
    try {
      const data = await evaluationService.getEvaluationById(evalId);
      const scores: Record<number, number> = {};
      if (data.items) {
        data.items.forEach(item => { scores[item.criteriaId] = item.score; });
      }

      setComiteData(prev => ({
        ...prev,
        [memberIdx]: {
          ...prev[memberIdx],
          evaluatorName: data.evaluatorName || '',
          evaluatorCi: data.evaluatorCi || '',
          observations: data.observations || '',
          scores,
        }
      }));

      setValue('evaluatorName', data.evaluatorName || '');
      setValue('evaluatorCi', data.evaluatorCi || '');
      setValue('observations', data.observations || '');
      setItemScores(scores);
      setDataLoaded(true);
    } catch (error) {
      console.error('[EvaluationModal] Error loading member evaluation:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  // Cargar criterios cuando se abre
  useEffect(() => {
    if (isOpen && evaluatorType) {
      setDataLoaded(false);
      setExistingData(null);
      setInitialLoading(false);
      setConfirmed(false);
      fetchCriteria(evaluatorType);
      // Reset session states when modal opens fresh
      setCompletionDismissed(false);
      setSavedEvaluationId(undefined);
    }
  }, [isOpen, evaluatorType, fetchCriteria]);

  // Auto-cargar datos del evaluador (tutor institucional/académico)
  useEffect(() => {
    if (!isOpen || isComiteMode || isEditing || practiceId <= 0) return;

    let cancelled = false;
    const loadTutorInfo = async () => {
      try {
        const data = await evaluationService.getPracticeTutorInfo(practiceId, evaluatorType);
        if (data && !cancelled) {
          setValue('evaluatorName', data.name);
          setValue('evaluatorCi', data.ci || '');
        }
      } catch {
        // Ya hay console.error en el service
      }
    };

    loadTutorInfo();
    return () => { cancelled = true; };
  }, [isOpen, isComiteMode, isEditing, practiceId, evaluatorType, setValue]);

  // Cargar evaluación existente (no comité)
  useEffect(() => {
    if (isOpen && evaluationId && criteria.length > 0 && !dataLoaded && !isComiteMode) {
      loadExistingEvaluation(evaluationId);
    }
  }, [isOpen, evaluationId, criteria, dataLoaded, isComiteMode]);

  // Inicializar scores para el miembro activo en comité, o para creación normal
  useEffect(() => {
    if (criteria.length === 0) return;
    setCriteriaLoaded(criteria);

    if (isComiteMode) {
      const member = comiteData[activeMember];
      // Si el miembro no tiene datos, recién inicializar con midpoint
      if (!member || Object.keys(member.scores).length === 0) {
        if (!dataLoaded) {
          const initial: Record<number, number> = {};
          criteria.forEach(c => { initial[c.criteriaId] = midpoint; });
          setItemScores(initial);
        }
        setDataLoaded(true);
        return;
      }
      // Ya tiene scores — marcar como listo sin sobrescribir
      setDataLoaded(true);
      return;
    }

    if (dataLoaded) return;

    // Crear scores iniciales con midpoint (modo no comité)
    const initial: Record<number, number> = {};
    criteria.forEach(c => { initial[c.criteriaId] = midpoint; });
    setItemScores(initial);
    setDataLoaded(true);
  }, [criteria, dataLoaded, evaluationId, isComiteMode, activeMember, comiteData]);

  const loadExistingEvaluation = async (id: number) => {
    setInitialLoading(true);
    try {
      const data = await evaluationService.getEvaluationById(id);
      setExistingData(data);

      setValue('evaluatorName', data.evaluatorName || '');
      setValue('evaluatorCi', data.evaluatorCi || '');
      setValue('observations', data.observations || '');

      if (data.items && data.items.length > 0) {
        const scores: Record<number, number> = {};
        data.items.forEach(item => { scores[item.criteriaId] = item.score; });
        setItemScores(scores);
        setCriteriaLoaded(criteria);
      } else {
        setCriteriaLoaded(criteria);
      }
      setDataLoaded(true);
      setConfirmed(true); // ya fue confirmada al guardarla antes
    } catch (error) {
      console.error('[EvaluationModal] Error loading evaluation:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const comiteMembers = [1, 2, 3] as const;

  const handleScoreChange = (criteriaId: number, score: number) => {
    const rounded = Math.round(score * 10) / 10;
    if (rounded >= scoreRange.min && rounded <= scoreRange.max) {
      setItemScores(prev => ({
        ...prev,
        [criteriaId]: rounded
      }));
      // Persistir en comiteData si es modo comité
      if (isComiteMode) {
        setComiteData(prev => ({
          ...prev,
          [activeMember]: { ...prev[activeMember], scores: { ...prev[activeMember]?.scores, [criteriaId]: rounded } }
        }));
      }
    }
  };

  const switchMember = (idx: 1 | 2 | 3) => {
    if (idx === activeMember) return;
    // Guardar datos del miembro actual antes de cambiar
    if (isComiteMode) {
      const current = getValues();
      setComiteData(prev => {
        const updated = {
          ...prev,
          [activeMember]: {
            ...prev[activeMember],
            evaluatorName: current.evaluatorName,
            evaluatorCi: current.evaluatorCi || '',
            observations: current.observations || '',
            scores: { ...itemScores },
          }
        };
        // Usar callback para ejecutar el cambio de miembro DESPUÉS de actualizar comiteData
        return updated;
      });
    }
    setConfirmed(false);
    setDataLoaded(false);
    // Forzar reconstrucción del estado interno: primero actualizar comiteData,
    // luego cambiar activeMember para que el effect de sync lo procese
    setActiveMember(idx);
  };

  /**
   * Cierra el modal actual y delega la navegación al padre via onNavigateToNext.
   * El padre se encarga de refrescar datos y reabrir un nuevo EvaluationModal
   * con el evaluatorType/memberIndex adecuado.
   */
  const performNavigateToNext = (
    nextType: EvaluatorType,
    nextMemberIndex?: number
  ) => {
    reset();
    setExistingData(null);
    setDataLoaded(false);
    setItemScores({});
    setCriteriaLoaded([]);
    setConfirmed(false);
    setComiteData({});
    setActiveMember(1);
    // Do NOT call onClose() here — the hook's handleNavigateToNext manages
    // modal lifecycle (close → refresh → reopen with new type)
    if (onNavigateToNext) {
      onNavigateToNext(nextType, nextMemberIndex);
    }
  };

  const onSubmit = async (formData: FormData) => {
    const items = criteriaLoaded.map(c => ({
      criteriaId: c.criteriaId,
      itemNumber: c.itemNumber,
      score: itemScores[c.criteriaId] ?? midpoint
    }));

    const payload: any = {
      professionalPracticeId: practiceId,
      evaluatorType,
      evaluatorName: formData.evaluatorName,
      evaluatorCi: formData.evaluatorCi || undefined,
      observations: formData.observations || undefined,
      items
    };

    if (isComiteMode) {
      payload.comiteMemberIndex = activeMember;
    }

    let result;
    const targetEvalId = isComiteMode
      ? comiteData[activeMember]?.evaluationId
      : (savedEvaluationId || evaluationId);
    if (targetEvalId) {
      result = await updateEvaluation(targetEvalId, payload);
    } else {
      result = await createEvaluation(payload);
    }

    if (result) {
      if (isComiteMode) {
        const savedEvalId = (result && typeof result !== 'boolean' ? result.evaluationId : undefined) || comiteData[activeMember]?.evaluationId;

        setComiteData(prev => ({
          ...prev,
          [activeMember]: {
            ...prev[activeMember],
            evaluationId: savedEvalId,
            evaluatorName: formData.evaluatorName,
            evaluatorCi: formData.evaluatorCi || '',
            observations: formData.observations || '',
            scores: itemScores,
          }
        }));

        setConfirmed(false);

        // Check if there are more committee members to evaluate
        const nextIdx = ([1, 2, 3] as const).find(
          idx => idx !== activeMember && !comiteData[idx]?.evaluationId
        );

        if (nextIdx) {
          // More committee members to evaluate — show flow modal or fall back
          if (onNavigateToNext) {
            setFlowNextStep({ type: 'COMITE', memberIndex: nextIdx });
            setShowFlowModal(true);
            return;
          }
          onSuccess();
          return;
        }
        // All 3 committee members done — fall through to completion check below
      } else {
        // Non-committee: store the returned evaluation ID so subsequent saves
        // use update instead of create (prevents duplicates after "Continuar Editando")
        const returnedId = (result && typeof result !== 'boolean')
          ? (result.evaluationId || (result as any).id)
          : undefined;
        if (returnedId) {
          setSavedEvaluationId(returnedId);
        }
      }

      // After any save (all committee members done OR non-committee create/edit),
      // check if ALL evaluation types are now complete
      try {
        const status = await evaluationService.getDetailedPracticeStatus(practiceId);
        if (status.evaluationStatus === 'completed' && !completionDismissed) {
          setCompletionReason(isComiteMode ? 'committee' : 'all');
          setShowCompletionModal(true);
        } else if (onNavigateToNext) {
          // Not all evaluations complete — show flow modal for user choice
          const nextStep = calculateNextStep(status);
          if (nextStep) {
            setFlowNextStep(nextStep);
            setShowFlowModal(true);
          } else {
            // No next step determined (probably a bug) — fallback
            reset();
            setConfirmed(false);
            onClose();
          }
        } else {
          // Either all complete but user already dismissed the dialog,
          // or evaluations not yet complete — just close and refresh
          reset();
          setConfirmed(false);
          onClose();
        }
      } catch {
        if (onNavigateToNext) {
          // On error with flow support, just close parent will handle refresh
          reset();
          setConfirmed(false);
          onClose();
        } else {
          // On error, just close and refresh
          reset();
          setConfirmed(false);
          onClose();
        }
      }
    }
  };

  /**
   * Determina el siguiente paso pendiente en la secuencia de evaluaciones
   * INSTITUCIONAL → ACADEMICO → COMITE(1-3).
   * Retorna {type, memberIndex} del primer evaluador que falta,
   * o null si todos están completos.
   */
  const calculateNextStep = (
    status: EvaluationStatus
  ): { type: EvaluatorType; memberIndex?: number } | null => {
    const { evaluations } = status;

    if (!evaluations.INSTITUCIONAL.completed) {
      return { type: 'INSTITUCIONAL' };
    }

    if (!evaluations.ACADEMICO.completed) {
      return { type: 'ACADEMICO' };
    }

    if (evaluations.COMITE.completed) {
      return null;
    }

    // COMITE — find first missing member index
    const existingMembers = evaluations.COMITE.members || [];
    const existingMemberIndices = new Set(existingMembers.map(m => m.memberIndex));
    const missingMember = [1, 2, 3].find(i => !existingMemberIndices.has(i));
    if (missingMember) {
      return { type: 'COMITE', memberIndex: missingMember };
    }

    // All members evaluated but COMITE not marked completed — edge case
    return null;
  };

  const handleClose = () => {
    reset();
    setExistingData(null);
    setDataLoaded(false);
    setItemScores({});
    setCriteriaLoaded([]);
    setConfirmed(false);
    setComiteData({});
    setActiveMember(1);
    onClose();
  };

  const rawAverage = criteriaLoaded.length > 0
    ? (criteriaLoaded.reduce((sum, c) => sum + (itemScores[c.criteriaId] ?? midpoint), 0) / criteriaLoaded.length)
    : 0;
  const calculatedAverage = ((rawAverage / scoreRange.max) * 100).toFixed(0);

  const getScoreInputClass = (criteriaId: number) => {
    const score = itemScores[criteriaId] ?? midpoint;
    const { min, max } = scoreRange;
    const range = max - min;
    const lowThreshold = min + Math.floor(range * 0.4);
    const highThreshold = min + Math.ceil(range * 0.8);
    if (score <= lowThreshold) return 'border-red-400 focus:border-red-500';
    if (score >= highThreshold) return 'border-green-400 focus:border-green-500';
    return 'border-yellow-400 focus:border-yellow-500';
  };

  const committeeMin = config.committeeMinMembers ?? 3;

  const modalTitle = isComiteMode
    ? `Miembro #${activeMember} - Comité Evaluador`
    : isEditing
      ? `Editar ${EVALUATOR_TYPE_LABELS[evaluatorType]}`
      : `Nueva ${EVALUATOR_TYPE_LABELS[evaluatorType]}`;

  const submitLabel = isComiteMode
    ? comiteData[activeMember]?.evaluationId ? 'Actualizar Miembro' : 'Guardar Miembro'
    : isEditing ? 'Guardar Cambios' : 'Guardar Evaluación';

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="4xl"
      showCloseButton
    >
      <ModalHeader>
        {modalTitle}
      </ModalHeader>

      {isFrozen && (
        <div className="mx-4 mt-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-6V9a4 4 0 00-8 0v2" />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Actas Cerradas — Evaluación congelada
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                Las evaluaciones están cerradas. Solo puede visualizar los datos.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Student identification header */}
      {(studentName || studentCi || careerName || practiceTypeName) && (
        <div className="mx-4 mt-3 p-4 bg-brand-50 dark:bg-brand-500/10 rounded-lg border border-brand-200 dark:border-brand-500/20">
          <p className="text-xs font-bold uppercase text-brand-600 dark:text-brand-400 mb-2">Estudiante Evaluado</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
            {studentName && (
              <div>
                <span className="text-xs text-text-tertiary">Nombre</span>
                <p className="text-sm font-semibold text-text-primary dark:text-text-emphasis">{studentName}</p>
              </div>
            )}
            {studentCi && (
              <div>
                <span className="text-xs text-text-tertiary">Cédula</span>
                <p className="text-sm font-medium text-text-primary dark:text-text-emphasis">{studentCi}</p>
              </div>
            )}
            {careerName && (
              <div>
                <span className="text-xs text-text-tertiary">Carrera</span>
                <p className="text-sm font-medium text-text-primary dark:text-text-emphasis">{careerName}</p>
              </div>
            )}
            {practiceTypeName && (
              <div>
                <span className="text-xs text-text-tertiary">Tipo de Práctica</span>
                <p className="text-sm font-medium text-text-primary dark:text-text-emphasis">{practiceTypeName}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {initialLoading ? (
        <ModalBody>
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          </div>
        </ModalBody>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody className="space-y-6">
            {submitError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">
                      Error al guardar
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-400 mt-0.5">
                      {submitError}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isComiteMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Miembro del Comité *
                </label>
                {existingComiteMembers.length > 0 && (
                  <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-1">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Ya evaluados</p>
                    {existingComiteMembers.map(m => (
                      <div key={m.memberIndex} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          <span className="font-mono text-xs text-gray-400 mr-1">#{m.memberIndex}</span>
                          {m.evaluatorName}
                        </span>
                        <span className="font-semibold text-green-600 dark:text-green-400">{Math.round((m.score / config.score.displayScale) * 100)}%</span>
                      </div>
                    ))}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-1 mt-1">
                      <p className="text-xs text-brand-600 dark:text-brand-400">
                        {existingComiteMembers.length < committeeMin
                          ? `Falta${committeeMin - existingComiteMembers.length === 1 ? ' el miembro' : 'n los miembros'} #${[1,2,3].filter(i => !existingComiteMembers.find(m => m.memberIndex === i)).join(', #')}`
                          : 'Comité completo'}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  {comiteMembers.map((idx) => {
                    const existing = existingComiteMembers.find(m => m.memberIndex === idx);
                    const isUsed = !!existing;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => switchMember(idx)}
                        disabled={isFrozen}
                        className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                          activeMember === idx
                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 shadow-sm'
                            : isUsed
                              ? 'border-green-200 dark:border-green-800/40 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-800/30 cursor-pointer'
                              : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500 cursor-pointer'
                        }`}
                        title={isUsed ? `Editar evaluación de ${existing.evaluatorName}` : `Cargar miembro #${idx}`}
                      >
                        {isUsed ? `✅ Miembro #${idx}` : `Miembro #${idx}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre del Evaluador *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    {...register('evaluatorName', {
                      onChange: (e) => {
                        if (isComiteMode) {
                          setComiteData(prev => ({
                            ...prev,
                            [activeMember]: { ...prev[activeMember], evaluatorName: e.target.value }
                          }));
                        }
                      }
                    })}
                    disabled={isFrozen}
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-white border-gray-300 dark:border-gray-600 disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="Nombre del evaluador"
                  />
                  <button
                    type="button"
                    onClick={() => setSearchOpen(true)}
                    disabled={isFrozen}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    title="Buscar reemplazo"
                  >
                    <SearchIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
                {errors.evaluatorName && (
                  <p className="mt-1 text-sm text-red-500">{errors.evaluatorName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cédula del Evaluador
                </label>
                <input
                  type="text"
                  {...register('evaluatorCi')}
                  disabled={isFrozen}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-white border-gray-300 dark:border-gray-600 disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="V00.000.000"
                  maxLength={12}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Observaciones
              </label>
              <textarea
                {...register('observations')}
                rows={2}
                disabled={isFrozen}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                placeholder="Observaciones adicionales..."
              />
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Criterios de Evaluación
                </h4>
                <div className="text-right">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Promedio: </span>
                  <span className="text-lg font-bold text-brand-500">{rawAverage.toFixed(1)}/{scoreRange.max} ({calculatedAverage}%)</span>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
                {criteriaLoaded.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Cargando criterios...
                  </div>
                ) : (
                  criteriaLoaded.map((criterion) => (
                    <div
                      key={criterion.criteriaId}
                      className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mr-2">
                            {criterion.itemNumber}.
                          </span>
                          <span className="text-sm text-gray-800 dark:text-gray-200">
                            {criterion.description}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min={scoreRange.min}
                            max={scoreRange.max}
                            step={scoreStep}
                            value={itemScores[criterion.criteriaId] ?? midpoint}
                            onChange={(e) => handleScoreChange(criterion.criteriaId, parseFloat(e.target.value))}
                            disabled={isFrozen}
                            className="flex-1 sm:w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                          <input
                            type="number"
                            min={scoreRange.min}
                            max={scoreRange.max}
                            step={0.1}
                            value={itemScores[criterion.criteriaId] ?? midpoint}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '') {
                                handleScoreChange(criterion.criteriaId, 0);
                              } else {
                                handleScoreChange(criterion.criteriaId, parseFloat(val) || 0);
                              }
                            }}
                            disabled={isFrozen}
                            className={`w-14 px-2 py-1 text-center border rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${getScoreInputClass(criterion.criteriaId)}`}
                          />
                          <span className="text-xs text-gray-400">/{scoreRange.max}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </ModalBody>

          <ModalFooter className="flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Firma de responsabilidad — visible siempre, fuera del scroll */}
            <div className="flex-1 min-w-0">
              <label className={`flex items-start gap-2 ${isFrozen ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  disabled={isFrozen}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-brand-600 focus:ring-brand-500 disabled:opacity-60 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 leading-tight">
                    Confirmo que las calificaciones ingresadas coinciden con el acta física firmada
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                    Esta acción quedará registrada en la auditoría del sistema
                  </p>
                </div>
              </label>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                size="sm"
              >
                {isFrozen ? 'Cerrar' : 'Cancelar'}
              </Button>
              {!isFrozen && (
                <Button
                  type="submit"
                  disabled={loading || criteriaLoaded.length === 0 || !confirmed}
                  loading={loading}
                  loadingText="Guardando..."
                  size="sm"
                >
                  {submitLabel}
                </Button>
              )}
            </div>
          </ModalFooter>
        </form>
      )}
    </Modal>

    {/* Search dialog for evaluator replacement */}
    <Modal isOpen={searchOpen} onClose={() => { setSearchOpen(false); setSearchQuery(''); setSearchResults([]); }}>
      <ModalHeader>
        Buscar evaluador
      </ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <input
            type="text"
            value={searchQuery}
            onChange={e => handleSearchInput(e.target.value)}
            placeholder="Buscar por nombre o cédula..."
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-white border-gray-300 dark:border-gray-600"
            autoFocus
          />
          {searching && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">Buscando...</p>
          )}
          {!searching && searchResults.length === 0 && searchQuery.length >= 2 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">Sin resultados</p>
          )}
          {searchResults.length > 0 && (
            <ul className="max-h-60 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700 border rounded-lg dark:border-gray-700">
              {searchResults.map(p => (
                <li key={p.personId}>
                  <button
                    type="button"
                    onClick={() => handleSelectPerson(p)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {[p.firstName, p.lastName].filter(Boolean).join(' ').trim()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{p.ci}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </ModalBody>
    </Modal>

    {/* Flow modal — guide user to next evaluation step */}
    <EvaluationFlowModal
      isOpen={showFlowModal}
      onClose={() => {
        // "Cerrar" — return to list
        setShowFlowModal(false);
        setFlowNextStep(null);
        handleClose();
      }}
      onContinue={() => {
        // "Continuar" — navigate to next evaluation
        setShowFlowModal(false);
        const step = flowNextStep;
        setFlowNextStep(null);
        if (step) {
          performNavigateToNext(step.type, step.memberIndex);
        }
      }}
      nextType={flowNextStep?.type ?? 'INSTITUCIONAL'}
      nextMemberIndex={flowNextStep?.memberIndex}
      studentName={studentName}
    />

    {/* Completion modal — all evaluation types complete */}
    <UnifiedDialog
      isOpen={showCompletionModal}
      onClose={() => {
        // "Continuar Editando" — mark as dismissed so it does not reappear
        // on the next save during this editing session; keep modal open
        setCompletionDismissed(true);
        setShowCompletionModal(false);
      }}
      onConfirm={async () => {
        // "Finalizar y Congelar" — close actas via closeActas endpoint (includes auto pre-enrollment)
        setShowCompletionModal(false);
        try {
          const closeResult = await evaluationsCulminationService.closeActas([practiceId]);
          if (closeResult?.data?.autoPreEnrollResults?.length > 0) {
            setCloseActasResults(closeResult.data);
            setShowCloseActasResults(true);
          } else {
            handleClose();
          }
        } catch {
          handleClose();
        }
      }}
      title={completionReason === 'committee' ? 'Comité Evaluador — Completo' : 'Evaluaciones — Completas'}
      message={
        completionReason === 'committee'
          ? 'Los 3 miembros del comité han sido evaluados y todas las evaluaciones están completas. ¿Desea finalizar (congelar actas) o continuar editando?'
          : 'Todas las evaluaciones han sido completadas. ¿Desea finalizar (congelar actas) o continuar editando?'
      }
      confirmLabel="Finalizar y Congelar"
      cancelLabel="Continuar Editando"
      variant="success"
    />

    {/* Close actas results — shows auto pre-enrollment info */}
    <CloseActasResultsModal
      isOpen={showCloseActasResults}
      onClose={() => {
        setShowCloseActasResults(false);
        setCloseActasResults(null);
        handleClose();
      }}
      results={closeActasResults}
    />
    </>
  );
};

export default EvaluationModal;
