import React from 'react';
import CustomSelect from '../../../components/form/CustomSelect';

export interface CulminatedStudentsFiltersProps {
  periodId?: number;
  careerId?: number;
  status?: string;
  institutionId?: number;
  periods: { value: string; label: string }[];
  careers: { value: string; label: string }[];
  institutions: { value: string; label: string }[];
  onFilterChange: (filters: {
    periodId?: number;
    careerId?: number;
    status?: string;
    institutionId?: number;
  }) => void;
}

const CulminatedStudentsFilters: React.FC<CulminatedStudentsFiltersProps> = ({
  periodId,
  careerId,
  status,
  institutionId,
  periods,
  careers,
  institutions,
  onFilterChange
}) => {
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
        <label className="mb-2 block text-sm font-medium text-text-primary dark:text-gray-300">
          Carrera
        </label>
        <CustomSelect
          options={careers}
          value={careerId?.toString() || ''}
          onChange={(val) => onFilterChange({ careerId: val ? Number(val) : undefined })}
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
