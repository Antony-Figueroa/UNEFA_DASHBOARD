import React from "react";

/**
 * Componente para mostrar la comparación de cambios entre dos estados de un registro.
 */
export const ChangeComparison: React.FC<{
  oldData: Record<string, unknown>;
  newData: Record<string, unknown>;
  labels?: Record<string, string>;
  excludeFields?: string[];
}> = ({ oldData, newData, labels = {}, excludeFields = [] }) => {
  const defaultExcludes = ["studentId", "careerId", "periodId", "updatedAt", "enrollmentDate", "status"];
  const allExcludes = [...defaultExcludes, ...excludeFields];

  const changes = Object.keys(newData).filter((key) => {
    if (allExcludes.includes(key)) return false;

    const oldVal = oldData[key];
    const newVal = newData[key];

    // Comparación básica (se puede mejorar para objetos anidados si es necesario)
    return JSON.stringify(oldVal) !== JSON.stringify(newVal);
  });

  if (changes.length === 0) return <span>Sin cambios detectados.</span>;

  return (
    <div className="mt-2 space-y-1.5 border-l-2 border-brand-200 pl-3 py-0.5 max-w-full">
      {changes.map((key) => (
        <div key={key} className="text-xs leading-relaxed wrap-break-word">
          <span className="font-semibold text-text-secondary dark:text-text-tertiary">
            {labels[key] || key}:
          </span>{" "}
          <span className="text-error-500 line-through">
            {String((oldData as Record<string, unknown>)[key] ?? "N/A")}
          </span>{" "}
          <span className="text-text-tertiary">→</span>{" "}
          <span className="text-success-600 font-medium">
            {String((newData as Record<string, unknown>)[key] ?? "N/A")}
          </span>
        </div>
      ))}
    </div>
  );
};

/**
 * Componente para mostrar detalles de un nuevo registro.
 */
export const RecordDetails: React.FC<{
  data: Record<string, unknown>;
  labels?: Record<string, string>;
  fields?: string[];
}> = ({ data, labels = {}, fields = [] }) => {
  const displayFields = fields.length > 0 ? fields : Object.keys(data).slice(0, 4);

  return (
    <div className="mt-2 space-y-1 border-l-2 border-success-200 pl-3 py-0.5 max-w-full">
      {displayFields.map((key) => (
        <div key={key} className="text-xs wrap-break-word">
          <span className="font-medium text-text-secondary dark:text-text-tertiary">
            {labels[key] || key}:
          </span>{" "}
          <span className="text-text-primary dark:text-white/90 font-medium">
            {String((data as Record<string, unknown>)[key] ?? "N/A")}
          </span>
        </div>
      ))}
    </div>
  );
};
