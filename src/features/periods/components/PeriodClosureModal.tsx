/**
 * @file Modal de cierre de período con decisiones individuales.
 * @description Muestra las prácticas pendientes y permite al admin decidir qué hacer
 * con cada una antes de cerrar el período.
 */

import { useState, useEffect, useCallback } from "react";
import { Modal, ModalBody, ModalFooter } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import { Loader2, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "../../../utils/cn";
import {
  PendingPractice,
  PracticeDecision,
  ClosureDecision,
} from "../types";
import * as periodService from "../services/periodService";
import toast from "react-hot-toast";

interface PeriodClosureModalProps {
  isOpen: boolean;
  onClose: () => void;
  periodId: string;
  periodDescription: string;
  onClosed: () => void;
}

const DECISION_OPTIONS: { value: ClosureDecision; label: string; description: string }[] = [
  { value: "extend", label: "Extender plazo", description: "Agregar 7 días de gracia para evaluación" },
  { value: "enroll", label: "Inscribir y evaluar", description: "Convertir a INSCRITO para evaluar" },
  { value: "retiro_justificado", label: "Retiro justificado", description: "Marcar como retiro justificado" },
  { value: "abandono", label: "Abandono", description: "Marcar como reprobado por abandono" },
];

export default function PeriodClosureModal({
  isOpen,
  onClose,
  periodId,
  periodDescription,
  onClosed,
}: PeriodClosureModalProps) {
  const [pendingPractices, setPendingPractices] = useState<PendingPractice[]>([]);
  const [totalPractices, setTotalPractices] = useState(0);
  const [decisions, setDecisions] = useState<Record<number, ClosureDecision>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch pending practices when modal opens
  useEffect(() => {
    if (!isOpen || !periodId) return;

    const fetchPending = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await periodService.getPendingPractices(periodId);
        setPendingPractices(response.pendingPractices);
        setTotalPractices(response.totalPractices);

        // Default decision: extend for all
        const defaults: Record<number, ClosureDecision> = {};
        for (const p of response.pendingPractices) {
          defaults[p.practiceId] = "extend";
        }
        setDecisions(defaults);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error al cargar prácticas pendientes";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPending();
  }, [isOpen, periodId]);

  const handleDecisionChange = useCallback((practiceId: number, decision: ClosureDecision) => {
    setDecisions((prev) => ({ ...prev, [practiceId]: decision }));
  }, []);

  const handleClose = useCallback(async () => {
    setIsClosing(true);
    try {
      // Build decisions array from current state
      const decisionsArray: PracticeDecision[] = pendingPractices.map((p) => ({
        practiceId: p.practiceId,
        decision: decisions[p.practiceId] || "extend",
      }));

      const result = await periodService.closePeriodWithDecisions(
        periodId,
        decisionsArray.length > 0 ? decisionsArray : undefined
      );

      if (result.success) {
        const summary = result.data?.summary as Record<string, number> | undefined;
        const parts: string[] = [];
        if (summary?.extended) parts.push(`${summary.extended} extendida(s)`);
        if (summary?.enrolled) parts.push(`${summary.enrolled} inscrita(s)`);
        if (summary?.retired) parts.push(`${summary.retired} retirada(s)`);
        if (summary?.abandoned) parts.push(`${summary.abandoned} abandonada(s)`);

        toast.success(
          parts.length > 0
            ? `Período cerrado. Decisiones: ${parts.join(", ")}`
            : "Período cerrado exitosamente"
        );
        onClosed();
        onClose();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al cerrar el período";
      toast.error(message);
    } finally {
      setIsClosing(false);
    }
  }, [pendingPractices, decisions, periodId, onClosed, onClose]);

  const getDecisionBadge = (practice: PendingPractice) => {
    const decision = decisions[practice.practiceId];
    if (!decision) return null;

    const colors: Record<ClosureDecision, string> = {
      extend: "bg-blue-light-100 text-blue-light-700 dark:bg-blue-light-500/20 dark:text-blue-light-400",
      enroll: "bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-400",
      retiro_justificado: "bg-warning-100 text-warning-700 dark:bg-warning-500/20 dark:text-warning-400",
      abandono: "bg-error-100 text-error-700 dark:bg-error-500/20 dark:text-error-400",
    };

    const label = DECISION_OPTIONS.find((o) => o.value === decision)?.label || decision;

    return (
      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", colors[decision])}>
        {label}
      </span>
    );
  };

  const hasNoPractices = !isLoading && pendingPractices.length === 0 && !error;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-4xl"
      size="xl"
      showCloseButton={!isClosing}
      modalId="period-closure-modal"
    >
      <ModalBody className="px-6 pt-6 pb-4">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0 p-3 rounded-full bg-warning-100 dark:bg-warning-500/20">
            <AlertTriangle className="w-6 h-6 text-warning-600 dark:text-warning-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary dark:text-white/90">
              Cerrar Período
            </h3>
            <p className="text-sm text-text-secondary dark:text-text-tertiary mt-1">
              Revisa las prácticas pendientes en <span className="font-medium">{periodDescription}</span> y decide qué hacer con cada una antes de cerrar.
            </p>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            <p className="text-sm text-text-secondary">Cargando prácticas pendientes...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-12 h-12 rounded-full bg-error-100 dark:bg-error-500/20 flex items-center justify-center">
              <span className="text-error-600 dark:text-error-400 text-xl">!</span>
            </div>
            <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
            <Button variant="outline" onClick={onClose} className="mt-2">
              Cerrar
            </Button>
          </div>
        ) : hasNoPractices ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-12 h-12 rounded-full bg-success-100 dark:bg-success-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
            <p className="text-sm font-medium text-success-700 dark:text-success-400">
              No hay prácticas pendientes
            </p>
            <p className="text-xs text-text-tertiary">
              Todas las {totalPractices} práctica(s) están en estado correcto. Puedes cerrar el período de forma segura.
            </p>
          </div>
        ) : (
          <>
            {/* Summary bar */}
            <div className="flex items-center gap-2 px-4 py-2.5 mb-4 rounded-lg bg-info-50 dark:bg-info-500/10 border border-info-200 dark:border-info-500/20">
              <Info className="w-4 h-4 text-info-600 dark:text-info-400 flex-shrink-0" />
              <p className="text-xs text-info-700 dark:text-info-300">
                {pendingPractices.length} práctica(s) pendiente(s) de {totalPractices} total(es). Selecciona una decisión para cada una.
              </p>
            </div>

            {/* Practices table */}
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto border border-border-light dark:border-border-dark rounded-lg">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-bg-secondary dark:bg-bg-elevated z-10">
                  <tr className="border-b border-border-light dark:border-border-dark">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      Estudiante
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      CI
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      Carrera
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      Estado Actual
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      Problema
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      Decisión
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                  {pendingPractices.map((practice) => (
                    <tr
                      key={practice.practiceId}
                      className="hover:bg-bg-secondary/50 dark:hover:bg-bg-elevated/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium text-text-primary dark:text-white/90">
                          {practice.studentName}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-secondary dark:text-text-tertiary">
                        {practice.studentCi || "—"}
                      </td>
                      <td className="px-4 py-3 text-text-secondary dark:text-text-tertiary">
                        {practice.careerName || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-bg-tertiary dark:bg-bg-secondary text-text-secondary dark:text-text-tertiary">
                          {practice.statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-text-secondary dark:text-text-tertiary">
                          {practice.pendingIssue}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={decisions[practice.practiceId] || "extend"}
                          onChange={(e) =>
                            handleDecisionChange(practice.practiceId, e.target.value as ClosureDecision)
                          }
                          disabled={isClosing}
                          className={cn(
                            "w-full px-2 py-1.5 rounded-lg border text-sm",
                            "bg-bg-primary dark:bg-bg-secondary",
                            "border-border-light dark:border-border-dark",
                            "text-text-primary dark:text-white/90",
                            "focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                          )}
                        >
                          {DECISION_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Decision summary */}
            {Object.keys(decisions).length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {DECISION_OPTIONS.map((opt) => {
                  const count = Object.values(decisions).filter((d) => d === opt.value).length;
                  if (count === 0) return null;
                  return (
                    <span
                      key={opt.value}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-bg-tertiary dark:bg-bg-secondary text-text-secondary"
                    >
                      {opt.label}: {count}
                    </span>
                  );
                })}
              </div>
            )}
          </>
        )}
      </ModalBody>

      <ModalFooter className="border-none px-6 pb-6 pt-2">
        <div className="flex flex-col-reverse sm:flex-row w-full gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isClosing}
            className="flex-1 h-12 rounded-xl border-border-light text-text-primary font-semibold hover:bg-bg-secondary transition-all"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleClose}
            disabled={isLoading || isClosing || !!error}
            loading={isClosing}
            loadingText="Cerrando..."
            className={cn(
              "flex-1 h-12 rounded-xl border-none text-white font-semibold shadow-lg shadow-current/10 transition-all active:scale-95",
              hasNoPractices
                ? "bg-success-600 hover:bg-success-700"
                : "bg-primary-600 hover:bg-primary-700"
            )}
          >
            {hasNoPractices ? "Cerrar Período" : "Aplicar Decisiones y Cerrar"}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}
