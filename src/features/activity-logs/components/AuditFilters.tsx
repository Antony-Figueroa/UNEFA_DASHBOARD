import Input from '../../../components/form/input/InputField';
import CustomSelect from '../../../components/form/CustomSelect';
import Button from '../../../components/ui/button/Button';
import { RefreshIcon } from '../../../icons/actions';

export interface FilterConfig {
  value: string;
  onChange: (val: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
  className?: string;
}

export interface AuditFiltersProps {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (val: string) => void;
  onDateToChange: (val: string) => void;
  onClearDates: () => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  searchPlaceholder: string;
  filters: FilterConfig[];
  onRefresh: () => void;
  loading?: boolean;
}

export const AuditFilters: React.FC<AuditFiltersProps> = ({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onClearDates,
  searchTerm,
  onSearchChange,
  searchPlaceholder,
  filters,
  onRefresh,
  loading = false,
}) => {
  return (
    <div className="space-y-4">
      {/* Row 1: Date Range - compact inline */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[140px] max-w-[180px]">
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">
            Desde
          </label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="h-10 text-sm"
          />
        </div>
        <div className="flex-1 min-w-[140px] max-w-[180px]">
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">
            Hasta
          </label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="h-10 text-sm"
          />
        </div>
        {(dateFrom || dateTo) && (
          <button
            onClick={onClearDates}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 underline mb-2"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Row 2: Search + Dropdowns - responsive grid */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10"
          />
        </div>
        {filters.map((filter, index) => (
          <div
            key={index}
            className={filter.className || 'w-full sm:w-[180px]'}
          >
            <CustomSelect
              options={filter.options}
              placeholder={filter.placeholder}
              onChange={(val) => filter.onChange(val as string)}
              value={filter.value}
            />
          </div>
        ))}
        <Button
          variant="primary"
          onClick={onRefresh}
          disabled={loading}
          className="h-10"
        >
          <RefreshIcon className="w-4 h-4 mr-1.5" />
          Actualizar
        </Button>
      </div>
    </div>
  );
};
