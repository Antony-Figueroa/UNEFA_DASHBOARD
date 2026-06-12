import { useEffect } from "react";
import { MapPin, Crosshair, AlertTriangle, CheckCircle } from "lucide-react";
import { useAddressCoincidence } from "../hooks/useAddressCoincidence";
import Badge from "../../../components/ui/badge/Badge";

interface AddressCoincidencePanelProps {
  personId?: number | string | null;
  institutionId?: number | string | null;
}

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

export const AddressCoincidencePanel = ({
  personId,
  institutionId,
}: AddressCoincidencePanelProps) => {
  const { coincidence, loading, error, fetchCoincidence } = useAddressCoincidence();

  useEffect(() => {
    if (personId && institutionId) {
      fetchCoincidence(personId, institutionId);
    }
  }, [personId, institutionId, fetchCoincidence]);

  if (!personId || !institutionId) return null;

  if (loading) {
    return (
      <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <MapPin className="h-4 w-4 animate-pulse" />
          Verificando ubicación geográfica...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          No se pudo verificar la ubicación
        </div>
      </div>
    );
  }

  if (!coincidence) return null;

  const config = levelConfig[coincidence.coincidence.level];
  const Icon = config.icon;

  const scorePercent = (coincidence.coincidence.proximityScore / 10) * 100;

  return (
    <div className="mt-3 space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Coincidencia Geográfica
        </span>
        <Badge color={config.color} variant="light" size="sm">
          <Icon className="mr-1 inline-block h-3 w-3" />
          {config.label}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded bg-white p-2 dark:bg-gray-900">
          <span className="block text-gray-400">Estudiante</span>
          <span className="block font-medium text-gray-700 dark:text-gray-200">
            {coincidence.studentAddress.estado}
          </span>
          <span className="block text-gray-500">
            {coincidence.studentAddress.municipio}
          </span>
          <span className="block text-gray-500 truncate">
            {coincidence.studentAddress.parroquia}
          </span>
        </div>
        <div className="rounded bg-white p-2 dark:bg-gray-900">
          <span className="block text-gray-400">Institución</span>
          <span className="block font-medium text-gray-700 dark:text-gray-200">
            {coincidence.institutionAddress.estado}
          </span>
          <span className="block text-gray-500">
            {coincidence.institutionAddress.municipio}
          </span>
          <span className="block text-gray-500 truncate">
            {coincidence.institutionAddress.parroquia}
          </span>
        </div>
      </div>

      {coincidence.coincidence.level !== "SAME_PARROQUIA" && (
        <div className="text-xs text-gray-400 italic">
          {config.description}
        </div>
      )}

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            coincidence.coincidence.level === "SAME_PARROQUIA"
              ? "bg-green-500"
              : coincidence.coincidence.level === "SAME_MUNICIPIO"
                ? "bg-blue-500"
                : coincidence.coincidence.level === "SAME_STATE"
                  ? "bg-amber-500"
                  : "bg-red-400"
          }`}
          style={{ width: `${scorePercent}%` }}
        />
      </div>
    </div>
  );
};

export default AddressCoincidencePanel;
