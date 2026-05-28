import type { ReassignmentOption } from '../types';

interface ReassignmentFieldsProps {
  typeName: string;
  tutors: ReassignmentOption[];
  institutions: ReassignmentOption[];
  careers: ReassignmentOption[];
  values: {
    newTutorId?: number | string;
    newInstitutionId?: number | string;
    newCareerId?: number | string;
  };
  reason?: string;
  showReason?: boolean;
  onChange: (field: string, value: number | string | undefined) => void;
  onReasonChange?: (value: string) => void;
}

export const ReassignmentFields = ({
  typeName,
  tutors,
  institutions,
  careers,
  values,
  reason,
  showReason = true,
  onChange,
  onReasonChange
}: ReassignmentFieldsProps) => {
  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-4">
      <h4 className="font-medium text-blue-800 dark:text-blue-200">
        Datos de Reasignación
      </h4>

      {typeName.includes('Tutor') && (
        <div>
          <label className="block text-sm font-medium mb-1">Nuevo Tutor</label>
          <select
            value={values.newTutorId ?? ''}
            onChange={(e) => onChange('newTutorId', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="">Seleccionar tutor...</option>
            {tutors.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      )}

      {typeName.includes('Empresa') && (
        <div>
          <label className="block text-sm font-medium mb-1">Nueva Empresa/Institución</label>
          <select
            value={values.newInstitutionId ?? ''}
            onChange={(e) => onChange('newInstitutionId', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="">Seleccionar empresa...</option>
            {institutions.map(i => (
              <option key={i.value} value={i.value}>{i.label}</option>
            ))}
          </select>
        </div>
      )}

      {typeName.includes('Carrera') && (
        <div>
          <label className="block text-sm font-medium mb-1">Nueva Carrera</label>
          <select
            value={values.newCareerId ?? ''}
            onChange={(e) => onChange('newCareerId', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="">Seleccionar carrera...</option>
            {careers.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      )}

      {showReason && onReasonChange && (
        <div>
          <label className="block text-sm font-medium mb-1">
            Motivo de la reasignación *
          </label>
          <textarea
            value={reason ?? ''}
            onChange={(e) => onReasonChange(e.target.value)}
            className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800"
            rows={3}
            placeholder="Explica el motivo por el cual necesitas este cambio..."
          />
        </div>
      )}
    </div>
  );
};

export default ReassignmentFields;
