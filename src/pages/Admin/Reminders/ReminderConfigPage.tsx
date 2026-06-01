import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageBreadcrumb from '../../../components/common/PageBreadCrumb';
import PageMeta from '../../../components/common/PageMeta';
import ComponentCard from '../../../components/common/ComponentCard';
import Button from '../../../components/ui/button/Button';
import { UnifiedDialog } from '../../../components/ui/dialog/UnifiedDialog';
import { useReminders } from '../../../features/reminders/hooks/useReminders';
import {
  ReminderRule,
  ReminderType,
  TargetRoleName,
  REMINDER_TYPE_LABELS,
  REMINDER_TYPE_ICONS,
  TARGET_ROLE_LABELS,
} from '../../../features/reminders/types';
import { PlusCircleIcon } from '../../../icons/actions';
import { PencilIcon, TrashBinIcon } from '../../../icons';

// ─── Constantes de formulario ────────────────────────────────────────────

const REMINDER_TYPES = Object.keys(REMINDER_TYPE_LABELS) as ReminderType[];
const TARGET_ROLES: TargetRoleName[] = ['all', 'admin', 'asistente', 'tutor', 'estudiante'];

const FORM_DEFAULTS = {
  name: '',
  description: '',
  type: 'pending_evaluation' as ReminderType,
  active: true,
  daysThreshold: null as number | null,
  targetRoleName: 'tutor' as TargetRoleName,
  templateTitle: '',
  templateMessage: '',
};

// ─── Componente principal ────────────────────────────────────────────────

const ReminderConfigPage = () => {
  const { rules, loading, toggleRule, createRule, updateRule, deleteRule } = useReminders();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ReminderRule | null>(null);
  const [form, setForm] = useState(FORM_DEFAULTS);
  const [saving, setSaving] = useState(false);

  // Confirm delete
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // ─── Handlers ──────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingRule(null);
    setForm(FORM_DEFAULTS);
    setIsModalOpen(true);
  };

  const openEdit = (rule: ReminderRule) => {
    setEditingRule(rule);
    setForm({
      name: rule.name,
      description: rule.description,
      type: rule.type,
      active: rule.active,
      daysThreshold: rule.daysThreshold,
      targetRoleName: rule.targetRoleName,
      templateTitle: rule.templateTitle,
      templateMessage: rule.templateMessage,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingRule) {
        await updateRule(editingRule.id, form);
      } else {
        await createRule(form as any);
      }
      setIsModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteRule(id);
    setConfirmDelete(null);
  };

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <>
      <PageMeta title="Recordatorios | Configuración" description="Administra los recordatorios automáticos del sistema" />
      <PageBreadcrumb pageTitle="Recordatorios" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Recordatorios Automáticos
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Gestioná los recordatorios que el sistema envía automáticamente a
              tutores y estudiantes.
            </p>
          </div>
          <Button onClick={openCreate} variant="primary" size="sm">
            <PlusCircleIcon className="w-4 h-4 mr-1.5" />
            Nuevo recordatorio
          </Button>
        </div>

        {/* Rules list */}
        <ComponentCard title="Reglas configuradas">
          {loading ? (
            <div className="py-12 text-center text-gray-400 dark:text-gray-500">
              Cargando reglas...
            </div>
          ) : rules.length === 0 ? (
            <div className="py-12 text-center text-gray-400 dark:text-gray-500">
              No hay reglas de recordatorios configuradas.
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              <AnimatePresence mode="popLayout">
                {rules.map((rule, idx) => (
                  <RuleRow
                    key={rule.id}
                    rule={rule}
                    index={idx}
                    onToggle={() => toggleRule(rule.id)}
                    onEdit={() => openEdit(rule)}
                    onDelete={() => setConfirmDelete(rule.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </ComponentCard>
      </div>

      {/* Edit/Create modal */}
      <UnifiedDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRule ? 'Editar recordatorio' : 'Nuevo recordatorio'}
        variant="info"
        size="lg"
      >
        <div className="space-y-5">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ej: Evaluaciones 5 días"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descripción
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Breve descripción del recordatorio"
            />
          </div>

          {/* Tipo (solo editable al crear) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as ReminderType }))}
                disabled={!!editingRule}
              >
                {REMINDER_TYPES.map(t => (
                  <option key={t} value={t}>
                    {REMINDER_TYPE_ICONS[t]} {REMINDER_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
              {editingRule && (
                <p className="mt-1 text-xs text-gray-400">El tipo no se puede cambiar después de crear la regla.</p>
              )}
            </div>

            {/* Días */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Días de anticipación
              </label>
              <input
                type="number"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                value={form.daysThreshold ?? ''}
                onChange={e => setForm(f => ({ ...f, daysThreshold: e.target.value ? Number(e.target.value) : null }))}
                placeholder="Ej: 3"
                min={0}
              />
              <p className="mt-1 text-xs text-gray-400">Dejá vacío para sin límite de días.</p>
            </div>
          </div>

          {/* Rol destino */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Dirigido a
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              value={form.targetRoleName}
              onChange={e => setForm(f => ({ ...f, targetRoleName: e.target.value as TargetRoleName }))}
            >
              {TARGET_ROLES.map(r => (
                <option key={r} value={r}>{TARGET_ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>

          {/* Template título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Título de la notificación
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              value={form.templateTitle}
              onChange={e => setForm(f => ({ ...f, templateTitle: e.target.value }))}
              placeholder="Ej: 📋 Evaluación pendiente"
            />
          </div>

          {/* Template mensaje */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mensaje
            </label>
            <textarea
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 min-h-[80px]"
              value={form.templateMessage}
              onChange={e => setForm(f => ({ ...f, templateMessage: e.target.value }))}
              placeholder="Ej: Tenés {{count}} evaluación(es) sin calificar."
            />
            <p className="mt-1 text-xs text-gray-400">
              Variables disponibles: {'{{count}}'}, {'{{student}}'}, {'{{date}}'}, {'{{docs}}'}, {'{{lastDate}}'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={saving || !form.name}>
              {saving ? 'Guardando...' : editingRule ? 'Guardar cambios' : 'Crear recordatorio'}
            </Button>
          </div>
        </div>
      </UnifiedDialog>

      {/* Delete confirmation */}
      <UnifiedDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Eliminar recordatorio"
        variant="error"
        size="sm"
      >
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          ¿Estás seguro de eliminar esta regla? Los recordatorios ya enviados no se eliminan.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setConfirmDelete(null)}>
            Cancelar
          </Button>
          <Button
            variant="error"
            onClick={() => confirmDelete && handleDelete(confirmDelete)}
          >
            Eliminar
          </Button>
        </div>
      </UnifiedDialog>
    </>
  );
};

// ─── Rule Row ─────────────────────────────────────────────────────────────

interface RuleRowProps {
  rule: ReminderRule;
  index: number;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const RuleRow = ({ rule, index, onToggle, onEdit, onDelete }: RuleRowProps) => {
  const isSeed = rule.id.startsWith('seed_');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className="flex items-center gap-4 py-4 px-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
    >
      {/* Icon */}
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-lg">
        {REMINDER_TYPE_ICONS[rule.type]}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 dark:text-white truncate">
            {rule.name}
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 uppercase">
            {TARGET_ROLE_LABELS[rule.targetRoleName]}
          </span>
          {isSeed && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              preset
            </span>
          )}
          {rule.daysThreshold !== null && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
              {rule.daysThreshold}d
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
          {rule.description}
        </p>
      </div>

      {/* Toggle */}
      <button
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
          rule.active ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            rule.active ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={onEdit}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Editar"
        >
          <PencilIcon className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="Eliminar"
        >
          <TrashBinIcon className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default ReminderConfigPage;
