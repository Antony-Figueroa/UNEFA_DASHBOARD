import { useEffect, useState } from "react";
import { MapPin, Crosshair, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useAddressCoincidence } from "../hooks/useAddressCoincidence";
import Badge from "../../../components/ui/badge/Badge";
import { Tooltip } from "../../../components/ui/tooltip/Tooltip";

interface AddressCoincidencePanelProps {
  personId?: number | string | null;
  institutionId?: number | string | null;
}

type MatchFactorKey = "parishMatch" | "municipalityMatch" | "stateMatch";

const levelConfig = {
  SAME_PARROQUIA: {
    label: "Misma Parroquia",
    color: "success" as const,
    icon: CheckCircle,
    description: "Estudiante e institución comparten la misma parroquia",
  },
  SAME_MUNICIPIO: {
    label: "Mismo Municipio",
    color: "primary" as const,
    icon: Crosshair,
    description: "Estudiante e institución están en el mismo municipio",
  },
  SAME_STATE: {
    label: "Mismo Estado",
    color: "warning" as const,
    icon: MapPin,
    description: "Estudiante e institución están en el mismo estado",
  },
  DIFFERENT_STATE: {
    label: "Distinto Estado",
    color: "error" as const,
    icon: AlertTriangle,
    description: "Estudiante e institución están en diferentes estados",
  },
};

const MATCH_FACTORS: { key: MatchFactorKey; label: string; weight: number }[] = [
  { key: "parishMatch", label: "Misma parroquia", weight: 10 },
  { key: "municipalityMatch", label: "Mismo municipio", weight: 5 },
  { key: "stateMatch", label: "Mismo estado", weight: 3 },
];

function getScoreColor(score: number): string {
  if (score >= 8) return "text-success-500";
  if (score >= 5) return "text-brand-500";
  if (score >= 3) return "text-warning-500";
  return "text-error-500";
}

function getGaugeStrokeClass(score: number): string {
  if (score >= 8) return "stroke-success-500";
  if (score >= 5) return "stroke-brand-500";
  if (score >= 3) return "stroke-warning-500";
  return "stroke-error-500";
}

function getScoreLabel(score: number): string {
  if (score >= 8) return "Coincidencia alta";
  if (score >= 5) return "Coincidencia media";
  if (score >= 3) return "Coincidencia baja";
  return "Sin coincidencia";
}

function ScoreGauge({ score }: { score: number }) {
  const r = 15.9;
  const circumference = 2 * Math.PI * r;
  const percent = Math.max(0, Math.min(100, (score / 10) * 100));
  const offset = circumference - (percent / 100) * circumference;

  return (
    <Tooltip
      content={
        <div className="space-y-0.5">
          <p>Escala 0–10 según cercanía de direcciones.</p>
          <p>Estado (+3) · Municipio (+5) · Parroquia (+10)</p>
          <p>
            Puntaje: {score}/10 —{" "}
            <span className={getScoreColor(score)}>{getScoreLabel(score)}</span>
          </p>
        </div>
      }
    >
      <div className="relative inline-flex shrink-0 cursor-help items-center justify-center">
        <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
          <circle
            cx="18"
            cy="18"
            r={r}
            fill="none"
            className="stroke-border-light dark:stroke-border-dark"
            strokeWidth="3.2"
          />
          <circle
            cx="18"
            cy="18"
            r={r}
            fill="none"
            className={getGaugeStrokeClass(score)}
            strokeWidth="3.2"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <span className={`absolute text-sm font-semibold ${getScoreColor(score)}`}>
          {score}/10
        </span>
      </div>
    </Tooltip>
  );
}

export const AddressCoincidencePanel = ({
  personId,
  institutionId,
}: AddressCoincidencePanelProps) => {
  const { coincidence, loading, error, fetchCoincidence } = useAddressCoincidence();
  const [fetchedOnce, setFetchedOnce] = useState(false);

  useEffect(() => {
    if (personId && institutionId) {
      fetchCoincidence(personId, institutionId);
    }
  }, [personId, institutionId, fetchCoincidence]);

  // Track when fetch completes so we can distinguish "no data" from "hasn't fetched yet"
  useEffect(() => {
    if (!loading) setFetchedOnce(true);
  }, [loading]);

  if (!personId || !institutionId) return null;

  if (loading) {
    return (
      <div className="mt-3 rounded-lg border border-border-light bg-bg-secondary p-3 dark:border-border-dark dark:bg-bg-dark">
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <MapPin className="h-4 w-4 animate-pulse" />
          Verificando ubicación geográfica...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-3 rounded-lg border border-border-light bg-bg-secondary p-3 dark:border-border-dark dark:bg-bg-dark">
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <AlertTriangle className="h-4 w-4 text-warning-500" />
          No se pudo verificar la ubicación
        </div>
      </div>
    );
  }

  // API returned successfully but no address data → inform the user
  if (fetchedOnce && !coincidence && !error) {
    return (
      <div className="mt-3 rounded-lg border border-border-light bg-bg-secondary p-3 dark:border-border-dark dark:bg-bg-dark">
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <AlertTriangle className="h-4 w-4 text-warning-500" />
          No se pudo calcular coincidencia: el estudiante o la institución no tiene dirección principal registrada
        </div>
      </div>
    );
  }

  if (!coincidence) return null;

  const config = levelConfig[coincidence.coincidence.level];
  const Icon = config.icon;
  const score = coincidence.coincidence.proximityScore;
  const factors = coincidence.coincidence;

  return (
    <div className="mt-3 space-y-3 rounded-lg border border-border-light bg-bg-secondary p-3 dark:border-border-dark dark:bg-bg-dark">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-text-secondary">
          Coincidencia Geográfica
        </span>
        <Badge color={config.color} variant="light" size="sm">
          <Icon className="mr-1 inline-block h-3 w-3" />
          {config.label}
        </Badge>
      </div>

      {/* Gauge + factor breakdown */}
      <div className="flex items-start gap-4">
        <ScoreGauge score={score} />
        <div className="min-w-0 flex-1 space-y-1 pt-0.5">
          {MATCH_FACTORS.map(({ key, label, weight }) => {
            const matched = Boolean(factors[key]);
            return (
              <div key={key} className="flex items-center gap-1.5 text-xs">
                {matched ? (
                  <CheckCircle className="h-3.5 w-3.5 shrink-0 text-success-500" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 shrink-0 text-text-tertiary" />
                )}
                <span
                  className={matched ? "text-text-primary" : "text-text-tertiary"}
                >
                  {label}
                </span>
                <span className="ml-auto tabular-nums text-text-tertiary">
                  +{weight}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Address comparison grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded bg-bg-main p-2 dark:bg-bg-dark">
          <span className="block text-text-tertiary">Estudiante</span>
          <span className="block font-medium text-text-primary">
            {coincidence.studentAddress.estado}
          </span>
          <span className="block text-text-secondary">
            {coincidence.studentAddress.municipio}
          </span>
          <span className="block truncate text-text-secondary">
            {coincidence.studentAddress.parroquia}
          </span>
        </div>
        <div className="rounded bg-bg-main p-2 dark:bg-bg-dark">
          <span className="block text-text-tertiary">Institución</span>
          <span className="block font-medium text-text-primary">
            {coincidence.institutionAddress.estado}
          </span>
          <span className="block text-text-secondary">
            {coincidence.institutionAddress.municipio}
          </span>
          <span className="block truncate text-text-secondary">
            {coincidence.institutionAddress.parroquia}
          </span>
        </div>
      </div>

      {/* Description for partial matches */}
      {coincidence.coincidence.level !== "SAME_PARROQUIA" && (
        <div className="text-xs italic text-text-tertiary">
          {config.description}
        </div>
      )}
    </div>
  );
};

export default AddressCoincidencePanel;
