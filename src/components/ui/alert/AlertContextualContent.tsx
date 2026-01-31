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
  const defaultExcludes = [
    "studentId",
    "careerId",
    "periodId",
    "updatedAt",
    "enrollmentDate",
    "creationDate", // Excluido para evitar ruido visual en comparaciones
  ];
  const allExcludes = [...defaultExcludes, ...excludeFields];

  // Helper para comparar valores, manejando fechas y tipos básicos
  const areEqual = (a: unknown, b: unknown): boolean => {
    // Si ambos son nulos o undefined
    if (a == null && b == null) return true;
    if (a == null || b == null) return false;

    // Si ambos son fechas
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime();
    }

    // Comparación Date vs string/number
    if (a instanceof Date) {
      const bDate = b instanceof Date ? b : new Date(typeof b === 'number' && b < 1e12 ? b * 1000 : b as any);
      return !isNaN(bDate.getTime()) && a.getTime() === bDate.getTime();
    }
    if (b instanceof Date) {
      const aDate = a instanceof Date ? a : new Date(typeof a === 'number' && a < 1e12 ? a * 1000 : a as any);
      return !isNaN(aDate.getTime()) && b.getTime() === aDate.getTime();
    }

    // Comparación de números y strings numéricos
    if (typeof a === 'number' && typeof b === 'string') return a.toString() === b;
    if (typeof a === 'string' && typeof b === 'number') return a === b.toString();

    // Comparación por JSON para objetos simples/arrays
    return JSON.stringify(a) === JSON.stringify(b);
  };

  // Helper para formatear valores para visualización
  const formatValue = (val: unknown): string => {
    if (val === null || val === undefined) return "N/A";
    if (val instanceof Date) {
      return val.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    if (typeof val === "boolean") return val ? "Activo" : "Inactivo";
    return String(val);
  };

  const changes = Object.keys(newData).filter((key) => {
    // Si el campo está en la lista de exclusión Y no tiene una etiqueta explícita, lo saltamos
    // Pero si tiene etiqueta, probablemente el usuario quiere verlo
    if (allExcludes.includes(key) && !labels[key]) return false;

    const oldVal = oldData[key];
    const newVal = newData[key];

    return !areEqual(oldVal, newVal);
  });

  if (changes.length === 0) return <span>Sin cambios detectados.</span>;

  return (
    <div className="mt-3 space-y-2 border-l-2 border-brand-200 pl-4 py-1 max-w-full bg-black/5 dark:bg-white/5 rounded-r-lg pr-2">
      <div className="text-[10px] uppercase tracking-wider font-bold text-text-secondary opacity-70 mb-1">
        Resumen de cambios:
      </div>
      {changes.map((key) => (
        <div key={key} className="text-xs leading-relaxed py-1 border-b border-black/5 dark:border-white/5 last:border-0">
          <div className="font-bold text-text-primary dark:text-text-secondary mb-0.5">
            {labels[key] || key}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-1.5 py-0.5 rounded bg-error-50 dark:bg-error-500/10 text-error-600 dark:text-error-400 line-through decoration-error-400/50">
              {formatValue(oldData[key])}
            </span>
            <span className="text-text-tertiary">→</span>
            <span className="px-1.5 py-0.5 rounded bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-success-400 font-bold">
              {formatValue(newData[key])}
            </span>
          </div>
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
