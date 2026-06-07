/**
 * @file TemplateSelector.tsx
 * @description Dropdown para seleccionar una plantilla de email.
 * Agrupa por categoría y auto-completa asunto + mensaje al seleccionar.
 */

import { useState, useEffect, useCallback } from 'react';
import emailTemplatesService, { EmailTemplate } from '../../../api/emailTemplatesService';

// ─── Types ───────────────────────────────────────────────────────────────

interface TemplateSelectorProps {
  onSelect: (template: EmailTemplate) => void;
  disabled?: boolean;
}

// ─── Category labels ─────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  periodo: 'Período Académico',
  evaluacion: 'Evaluación',
  general: 'General',
};

// ─── Component ──────────────────────────────────────────────────────────

export const TemplateSelector = ({ onSelect, disabled }: TemplateSelectorProps) => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | ''>('');

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await emailTemplatesService.getAll();
      setTemplates(data);
    } catch {
      console.error('[TemplateSelector] Error fetching templates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    setSelectedId(id);

    const template = templates.find(t => t.id === id);
    if (template) {
      onSelect(template);
    }
  };

  const handleClear = () => {
    setSelectedId('');
  };

  // Agrupar por categoría
  const grouped = templates.reduce<Record<string, EmailTemplate[]>>((acc, t) => {
    const cat = t.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});

  const categoryOrder = ['periodo', 'evaluacion', 'general'];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
          Plantilla (opcional)
        </label>
        {selectedId !== '' && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[11px] text-brand-600 dark:text-brand-400 hover:underline"
          >
            Limpiar selección
          </button>
        )}
      </div>

      <div className="relative">
        <select
          value={selectedId}
          onChange={handleChange}
          disabled={disabled || loading}
          className={`w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all appearance-none cursor-pointer ${
            selectedId === '' ? 'text-gray-400' : 'text-gray-900 dark:text-white'
          } ${loading ? 'opacity-60' : ''}`}
        >
          <option value="">{loading ? 'Cargando plantillas...' : 'Seleccionar plantilla...'}</option>
          {categoryOrder.map(cat => {
            const items = grouped[cat];
            if (!items || items.length === 0) return null;
            return (
              <optgroup key={cat} label={CATEGORY_LABELS[cat] || cat}>
                {items.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>

        {/* Dropdown arrow */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {templates.length === 0 && !loading && (
        <p className="text-[11px] text-gray-400">
          No hay plantillas disponibles. Creá una en Gestión de Plantillas.
        </p>
      )}
    </div>
  );
};

export default TemplateSelector;
