import React from 'react';
import Button from '../../../components/ui/button/Button';
import { AuditTable } from '../types';

interface AuditLogsFiltersProps {
  tables: AuditTable[];
  onFilterChange: (filters: {
    tableName?: string;
    operation?: string;
    startDate?: string;
    endDate?: string;
  }) => void;
  onReset: () => void;
  isLoading?: boolean;
}

// Simple select component for filters
const SimpleSelect: React.FC<{
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}> = ({ options, value, onChange, placeholder }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500"
  >
    {placeholder && <option value="">{placeholder}</option>}
    {options.map(opt => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
);

// Simple date input
const SimpleDateInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
}> = ({ value, onChange }) => (
  <input
    type="date"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500"
  />
);

export const AuditLogsFilters: React.FC<AuditLogsFiltersProps> = ({
  tables,
  onFilterChange,
  onReset,
  isLoading
}) => {
  const [tableName, setTableName] = React.useState('');
  const [operation, setOperation] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');

  const handleApplyFilters = () => {
    onFilterChange({
      tableName: tableName || undefined,
      operation: operation || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined
    });
  };

  const handleReset = () => {
    setTableName('');
    setOperation('');
    setStartDate('');
    setEndDate('');
    onReset();
  };

  const tableOptions = [
    { value: '', label: 'Todas las tablas' },
    ...tables.map(t => ({ value: t.PHYSICAL_NAME, label: t.NAME || t.PHYSICAL_NAME }))
  ];

  const operationOptions = [
    { value: '', label: 'Todas las operaciones' },
    { value: 'INSERT', label: 'Inserción' },
    { value: 'UPDATE', label: 'Actualización' },
    { value: 'DELETE', label: 'Eliminación' }
  ];

  return (
    <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-1">
          <label className="block text-xs font-medium text-text-secondary mb-1">Tabla</label>
          <SimpleSelect
            options={tableOptions}
            value={tableName}
            onChange={setTableName}
          />
        </div>
        
        <div className="lg:col-span-1">
          <label className="block text-xs font-medium text-text-secondary mb-1">Operación</label>
          <SimpleSelect
            options={operationOptions}
            value={operation}
            onChange={setOperation}
          />
        </div>
        
        <div className="lg:col-span-1">
          <label className="block text-xs font-medium text-text-secondary mb-1">Fecha Desde</label>
          <SimpleDateInput
            value={startDate}
            onChange={setStartDate}
          />
        </div>
        
        <div className="lg:col-span-1">
          <label className="block text-xs font-medium text-text-secondary mb-1">Fecha Hasta</label>
          <SimpleDateInput
            value={endDate}
            onChange={setEndDate}
          />
        </div>
        
        <div className="lg:col-span-1 flex items-end gap-2">
          <Button
            variant="primary"
            onClick={handleApplyFilters}
            disabled={isLoading}
            className="flex-1"
          >
            Filtrar
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isLoading}
          >
            Limpiar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsFilters;
