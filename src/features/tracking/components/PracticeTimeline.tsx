/**
 * @file PracticeTimeline.tsx
 * @description Línea de tiempo visual del ciclo de vida de una práctica profesional.
 * Muestra el progreso desde pre-inscripción hasta culminación con fechas y conteos.
 */

import { useEffect, useState } from "react";
import { getPracticeTimeline, type TimelineStage, type PracticeTimelineData } from "../services/trackingService";
import { MapPin, ClipboardCheck, FileText, Activity, ClipboardList, Award, Loader2, AlertTriangle } from "lucide-react";

const ICON_MAP: Record<string, typeof FileText> = {
  FileText,
  ClipboardCheck,
  Activity,
  MapPin,
  ClipboardList,
  Award,
};

function StageIcon({ icon, completed, current }: { icon: string; completed: boolean; current: boolean }) {
  const Icon = ICON_MAP[icon] || FileText;
  const color = completed ? "text-success-500" : current ? "text-brand-500" : "text-text-tertiary";
  return <Icon className={`h-4 w-4 ${color}`} />;
}

function formatDate(d: string | null | undefined): string {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("es-VE", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return d;
  }
}

function TimelineConnector({ completed }: { completed: boolean }) {
  return (
    <div
      className={`ml-[15px] h-5 w-0.5 ${completed ? "bg-success-500" : "bg-border-light dark:bg-border-dark"}`}
    />
  );
}

function TimelineNode({ stage, isLast }: { stage: TimelineStage; isLast: boolean }) {
  const { completed, current, label, date, count, metadata } = stage;

  const dotColor = completed
    ? "bg-success-500 ring-success-200"
    : current
      ? "bg-brand-500 ring-brand-200"
      : "bg-border-light dark:bg-border-dark ring-transparent";

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`h-3.5 w-3.5 shrink-0 rounded-full ring-4 ${dotColor} transition-colors`} />
        {!isLast && <TimelineConnector completed={completed} />}
      </div>
      <div className={`mb-2 min-w-0 flex-1 pb-3 ${isLast ? "" : ""}`}>
        <div className="flex items-center gap-1.5">
          <StageIcon icon={stage.icon} completed={completed} current={current} />
          <span
            className={`text-xs font-medium ${
              completed
                ? "text-success-700 dark:text-success-400"
                : current
                  ? "text-brand-700 dark:text-brand-400"
                  : "text-text-tertiary"
            }`}
          >
            {label}
          </span>
          {completed && !current && (
            <span className="text-[10px] text-text-tertiary ml-auto">{formatDate(date)}</span>
          )}
          {current && (
            <span className="ml-auto text-[10px] font-semibold text-brand-500">Actual</span>
          )}
        </div>

        {/* Count badge for visits/evaluations */}
        {count !== undefined && (
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="text-[11px] text-text-secondary">
              {count} {count === 1 ? "completada" : "completadas"}
            </span>
          </div>
        )}

        {/* Culmination metadata */}
        {metadata && (
          <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-text-secondary">
            {metadata.status && <span>Estado: {metadata.status}</span>}
            {metadata.certificateNumber && <span>Cert: {metadata.certificateNumber}</span>
            }
          </div>
        )}
      </div>
    </div>
  );
}

interface PracticeTimelineProps {
  /** ID de la práctica profesional */
  practiceId: string | number;
}

export function PracticeTimeline({ practiceId }: PracticeTimelineProps) {
  const [data, setData] = useState<PracticeTimelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!practiceId) return;

    let mounted = true;
    setLoading(true);
    setError(null);

    getPracticeTimeline(String(practiceId))
      .then((res) => {
        if (mounted) setData(res);
      })
      .catch((err: any) => {
        if (mounted) setError(err?.response?.data?.error || "Error al cargar timeline");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [practiceId]);

  if (!practiceId) return null;
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-text-secondary">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando línea de tiempo...
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-text-secondary">
        <AlertTriangle className="h-4 w-4 text-warning-500" />
        {error}
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="rounded-lg border border-border-light bg-bg-main p-3 dark:border-border-dark dark:bg-bg-dark">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-text-secondary">
          Progreso de la Práctica
        </span>
      </div>
      <div className="pl-1">
        {data.stages.map((stage, i) => (
          <TimelineNode key={stage.key} stage={stage} isLast={i === data.stages.length - 1} />
        ))}
      </div>
    </div>
  );
}

export default PracticeTimeline;
