/**
 * @file EvaluationFilters.tsx
 * @description Filtros reutilizables para el módulo de Evaluaciones y Culminación
 */

import React from 'react';
import InputField from '../../../components/form/input/InputField';
import CustomSelect from '../../../components/form/CustomSelect';
import MultiSelect from '../../../components/form/MultiSelect';
import Button from '../../../components/ui/button/Button';
import { PracticeFilters } from '../types';

interface Option {
  value: string;
  label: string;
}

interface EvaluationFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters: PracticeFilters;
  onFilterChange: (key: keyof PracticeFilters, value: string) => void;
  onClear: () => void;
  /** Opciones dinámicas desde el backend */
  periodOptions: Option[];
  careerOptions: Option[];
  practiceTypeOptions: Option[];
  /** Filtros adicionales opcionales (para pestañas específicas) */
  extraFilters?: React.ReactNode;
  /** Si hay filtros activos para mostrar botón Limpiar */
  hasActiveFilters: boolean;
  /** Manejador para cambio de carreras múltiples */
  onCareerFilterChange?: (values: string[]) => void;
  /** Carreras seleccionadas */
  selectedCareerIds?: string[];
}

export const EvaluationFilters: React.FC<EvaluationFiltersProps> = ({
  searchTerm,
  onSearchChange,
  filters,
  onFilterChange,
  onClear,
  periodOptions,
  careerOptions,
  practiceTypeOptions,
  extraFilters,
  hasActiveFilters,
  onCareerFilterChange,
  selectedCareerIds = [],
}) => {
  const multiCareerOptions = careerOptions.map(c => ({ value: c.value, text: c.label }));
  const hasMultiCareer = typeof onCareerFilterChange === 'function';

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-6">
      <div className="w-full sm:w-64">
        <InputField
          type="text"
          placeholder="Buscar estudiante, cédula, institución..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <CustomSelect
        options={periodOptions}
        value={String(filters.periodId || '')}
        onChange={(v) => onFilterChange('periodId', v as string)}
        className="w-full sm:w-44"
      />

      {hasMultiCareer ? (
        <MultiSelect
          label="Carrera"
          options={multiCareerOptions}
          value={selectedCareerIds}
          onChange={(vals) => onCareerFilterChange?.(vals)}
          placeholder="Todas las carreras"
        />
      ) : (
        <CustomSelect
          options={careerOptions}
          value={String(filters.careerId || '')}
          onChange={(v) => onFilterChange('careerId', v as string)}
          className="w-full sm:w-48"
        />
      )}

      <CustomSelect
        options={practiceTypeOptions}
        value={String(filters.practiceTypeId || '')}
        onChange={(v) => onFilterChange('practiceTypeId', v as string)}
        className="w-full sm:w-44"
      />

      {extraFilters}

      {hasActiveFilters && (
        <Button variant="ghost" onClick={onClear}>
          Limpiar
        </Button>
      )}
    </div>
  );
};

export default EvaluationFilters;
