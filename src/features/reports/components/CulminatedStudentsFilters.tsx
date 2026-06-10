import React from 'react';
import CustomSelect from '../../../components/form/CustomSelect';
import MultiSelect from '../../../components/form/MultiSelect';

export interface CulminatedStudentsFiltersProps {
  periodId?: number;
  careerIds?: number[];
  status?: string;
  institutionId?: number;
  periods: { value: string; label: string }[];
  careers: { value: string; label: string }[];
  institutions: { value: string; label: string }[];
  onFilterChange: (filters: {
    periodId?: number;
    careerIds?: number[];
    status?: string;
    institutionId?: number;
  }) => void;
}

const CulminatedStudentsFilters: React.FC<CulminatedStudentsFiltersProps> = ({
  periodId,
  careerIds = [],
  status,
  institutionId,
  periods,
  careers,
  institutions,
  onFilterChange
}) => {
  const multiCareerOptions = careers.map(c => ({ value: c.value, text: c.label }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-text-primary dark:text-gray-300">
          Período Académico
        </label>
        <CustomSelect
          options={periods}
          value={periodId?.toString() || ''}
          onChange={(val) => onFilterChange({ periodId: val ? Number(val) : undefined })}
          placeholder="Todos los períodos"
        />
      </div>

      <div>
        <MultiSelect
          label="Carrera"
          options={multiCareerOptions}
          value={careerIds.map(String)}
          onChange={(vals) => onFilterChange({ careerIds: vals.length > 0 ? vals.map(Number) : undefined })}
          placeholder="Todas las carreras"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-text-primary dark:text-gray-300">
          Estado
        </label>
        <CustomSelect
          options={[
            { value: 'all', label: 'Todos' },
            { value: 'pending', label: 'Pendiente' },
            { value: 'approved', label: 'Aprobado' },
            { value: 'certified', label: 'Certificado' }
          ]}
          value={status || 'all'}
          onChange={(val) => onFilterChange({ status: val === 'all' ? undefined : val })}
          placeholder="Todos los estados"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-text-primary dark:text-gray-300">
          Institución
        </label>
        <CustomSelect
          options={institutions}
          value={institutionId?.toString() || ''}
          onChange={(val) => onFilterChange({ institutionId: val ? Number(val) : undefined })}
          placeholder="Todas las instituciones"
        />
      </div>
    </div>
  );
};

export default CulminatedStudentsFilters;
