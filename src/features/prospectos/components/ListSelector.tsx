import { useState } from "react";
import CustomSelect from "../../../components/form/CustomSelect";
import Button from "../../../components/ui/button/Button";
import { ProspectList } from "../types";

interface PeriodOption {
  value: string;
  label: string;
}

interface ListSelectorProps {
  lists: ProspectList[];
  selectedListId: number | null;
  onSelect: (id: number) => void;
  onCreateList: (name: string, periodId: number) => void;
  onDeleteList: (id: number) => void;
  periods: PeriodOption[];
  /** Período preseleccionado (el próximo futuro) */
  defaultPeriodId?: string;
  loading: boolean;
}

export function ListSelector({
  lists,
  selectedListId,
  onSelect,
  onCreateList,
  onDeleteList,
  periods,
  defaultPeriodId,
  loading,
}: ListSelectorProps) {
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedPeriodId, setSelectedPeriodId] = useState(defaultPeriodId ?? "");

  const selectedPeriod = periods.find(p => p.value === selectedPeriodId);
  const autoName = selectedPeriod ? `Prospecto ${selectedPeriod.label}` : "";

  const listOptions = lists.map(l => ({
    value: String(l.listId),
    label: `${l.name}${l.periodDescription ? ` (${l.periodDescription})` : ""}${l.itemCount !== undefined ? ` — ${l.itemCount} est.` : ""}`,
  }));

  const handleSelect = (value: string) => {
    onSelect(Number(value));
  };

  const handleCreate = () => {
    if (!autoName || !selectedPeriodId) return;
    onCreateList(autoName, Number(selectedPeriodId));
    setShowNewForm(false);
    setSelectedPeriodId(defaultPeriodId ?? "");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <CustomSelect
            options={listOptions}
            placeholder="Seleccioná una lista..."
            value={selectedListId ? String(selectedListId) : ""}
            onChange={handleSelect}
            disabled={loading}
          />
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowNewForm(prev => !prev)}
          disabled={loading}
        >
          {showNewForm ? "Cancelar" : "Nueva lista"}
        </Button>
      </div>

      {showNewForm && (
        <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-4 space-y-3 border border-border-light dark:border-border-dark">
          <div>
            <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-1">
              Período académico
            </label>
            <CustomSelect
              options={periods}
              placeholder="Seleccioná un período..."
              value={selectedPeriodId}
              onChange={setSelectedPeriodId}
            />
          </div>
          {selectedPeriod && (
            <p className="text-sm text-text-secondary">
              Nombre sugerido: <span className="font-semibold">{autoName}</span>
            </p>
          )}
          <div className="flex justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreate}
              disabled={!selectedPeriodId}
            >
              Crear lista
            </Button>
          </div>
        </div>
      )}

      {selectedListId && lists.length > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onDeleteList(selectedListId)}
            className="text-xs font-medium text-error-500 hover:text-error-600 dark:text-error-400 transition-colors"
          >
            Eliminar lista
          </button>
        </div>
      )}
    </div>
  );
}

export default ListSelector;
