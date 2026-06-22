import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageBreadcrumb from '../../../components/common/PageBreadCrumb';
import PageMeta from '../../../components/common/PageMeta';
import ComponentCard from '../../../components/common/ComponentCard';
import Button from '../../../components/ui/button/Button';
import Badge from '../../../components/ui/badge/Badge';
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
import ReminderFormModal from '../../../features/reminders/components/ReminderFormModal';
import ExpressEmailModal from '../../../features/reminders/components/ExpressEmailModal';
import TemplateManager from '../../../features/reminders/components/TemplateManager';
import { PlusCircleIcon, SearchIcon, MailIcon } from '../../../icons/actions';
import { PencilIcon, TrashBinIcon } from '../../../icons';

// ─── Componente principal ────────────────────────────────────────────────

const ReminderConfigPage = () => {
  const { rules, loading, toggleRule, createRule, updateRule, deleteRule } = useReminders();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ReminderRule | null>(null);
  const [saving, setSaving] = useState(false);

  // Confirm delete
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Express email
  const [expressEmailOpen, setExpressEmailOpen] = useState(false);

  // ── Search & filters ────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'' | ReminderType>('');
  const [filterRole, setFilterRole] = useState<'' | TargetRoleName>('');
  const [filterEmail, setFilterEmail] = useState<'' | 'yes' | 'no'>('');
  const [filterActive, setFilterActive] = useState<'' | 'yes' | 'no'>('');

  // ── Dynamic filter options (derived from actual data, not hardcoded) ──────

  const dynamicTypeOptions = useMemo(() => {
    const types = [...new Set(rules.map(r => r.type))] as ReminderType[];
    return types.sort();
  }, [rules]);

  const dynamicRoleOptions = useMemo(() => {
    const roles = [...new Set(rules.map(r => r.targetRoleName))] as TargetRoleName[];
    return roles.sort();
  }, [rules]);

  const filteredRules = useMemo(() => {
    let result = rules;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        r =>
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q),
      );
    }

    if (filterType) {
      result = result.filter(r => r.type === filterType);
    }

    if (filterRole) {
      result = result.filter(r => r.targetRoleName === filterRole);
    }

    if (filterEmail === 'yes') {
      result = result.filter(r => r.sendEmail);
    } else if (filterEmail === 'no') {
      result = result.filter(r => !r.sendEmail);
    }

    if (filterActive === 'yes') {
      result = result.filter(r => r.active);
    } else if (filterActive === 'no') {
      result = result.filter(r => !r.active);
    }

    return result;
  }, [rules, search, filterType, filterRole, filterEmail, filterActive]);

  const clearFilters = () => {
    setSearch('');
    setFilterType('');
    setFilterRole('');
    setFilterEmail('');
    setFilterActive('');
  };

  const hasActiveFilters = search || filterType || filterRole || filterEmail || filterActive;

  // ─── Handlers ──────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingRule(null);
    setIsModalOpen(true);
  };

  const openEdit = (rule: ReminderRule) => {
    setEditingRule(rule);
    setIsModalOpen(true);
  };

  const handleSave = async (form: any) => {
    setSaving(true);
    try {
      if (editingRule) {
        await updateRule(editingRule.id, form);
      } else {
        await createRule(form);
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
          <div className="flex items-center gap-2">
            <Button onClick={() => setExpressEmailOpen(true)} variant="outline" size="sm">
              <MailIcon className="w-4 h-4 mr-1.5" />
              Express Email
            </Button>
            <Button onClick={openCreate} variant="primary" size="sm">
              <PlusCircleIcon className="w-4 h-4 mr-1.5" />
              Nuevo recordatorio
            </Button>
          </div>
        </div>

        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre o descripción..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>

          {/* Type filter — dinámico desde datos */}
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value as '' | ReminderType)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
          >
            <option key="all-types" value="">Todos los tipos</option>
            {dynamicTypeOptions.map(t => (
              <option key={t} value={t}>{REMINDER_TYPE_LABELS[t]}</option>
            ))}
          </select>

          {/* Role filter — dinámico desde datos */}
          <select
            value={filterRole}
            onChange={e => setFilterRole(e.target.value as '' | TargetRoleName)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
          >
            <option key="all-roles" value="">Todos los roles</option>
            {dynamicRoleOptions.map(r => (
              <option key={r} value={r}>{TARGET_ROLE_LABELS[r]}</option>
            ))}
          </select>

          {/* Email filter */}
          <select
            value={filterEmail}
            onChange={e => setFilterEmail(e.target.value as '' | 'yes' | 'no')}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
          >
            <option key="all-email" value="">Email: todos</option>
            <option key="email-yes" value="yes">Email: sí</option>
            <option key="email-no" value="no">Email: no</option>
          </select>

          {/* Active filter */}
          <select
            value={filterActive}
            onChange={e => setFilterActive(e.target.value as '' | 'yes' | 'no')}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
          >
            <option key="all-active" value="">Estado: todos</option>
            <option key="active-yes" value="yes">Activo</option>
            <option key="active-no" value="no">Inactivo</option>
          </select>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-brand-600 dark:text-brand-400 hover:underline whitespace-nowrap"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Rules list */}
        <ComponentCard title="Reglas configuradas">
          {loading ? (
            <div className="py-12 text-center text-gray-400 dark:text-gray-500">
              Cargando reglas...
            </div>
          ) : filteredRules.length === 0 ? (
            <div className="py-12 text-center text-gray-400 dark:text-gray-500">
              {hasActiveFilters
                ? 'No se encontraron reglas con los filtros aplicados.'
                : 'No hay reglas de recordatorios configuradas.'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              <AnimatePresence mode="popLayout">
                {filteredRules.map((rule, idx) => (
                  <RuleRow
                    key={rule.id}
                    rule={rule}
                    index={idx}
                    onToggle={() => toggleRule(rule.id)}
                    onEdit={() => openEdit(rule)}
                    onDelete={() => setConfirmDelete(rule.id)}
                    onFilterType={(type) => setFilterType(type)}
                    onFilterRole={(role) => setFilterRole(role)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </ComponentCard>

        {/* ══════════════════════════════════════════════════════════════
            Plantillas de Email — embebido en el módulo de recordatorios
         ══════════════════════════════════════════════════════════════ */}
        <TemplateManager />
      </div>

      {/* Edit/Create modal — key remounts for fresh form state */}
      <ReminderFormModal
        key={`reminder-modal-${editingRule?.id ?? 'new'}`}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editingRule={editingRule}
        saving={saving}
      />

      {/* Express email modal */}
      <ExpressEmailModal
        isOpen={expressEmailOpen}
        onClose={() => setExpressEmailOpen(false)}
      />

      {/* Delete confirmation */}
      <UnifiedDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => { if (confirmDelete) handleDelete(confirmDelete); }}
        title="Eliminar recordatorio"
        message="¿Estás seguro de eliminar esta regla? Los recordatorios ya enviados no se eliminan."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="error"
        size="sm"
        isLoading={saving}
      />
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
  onFilterType: (type: ReminderType) => void;
  onFilterRole: (role: TargetRoleName) => void;
}

const RuleRow = ({ rule, index, onToggle, onEdit, onDelete, onFilterType, onFilterRole }: RuleRowProps) => {
  const isSeed = rule.id.startsWith('seed_');
  const typeLabel = REMINDER_TYPE_LABELS[rule.type];
  const roleLabel = TARGET_ROLE_LABELS[rule.targetRoleName];

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
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900 dark:text-white truncate">
            {rule.name}
          </span>

          {/* Badge de tipo — clickeable para filtrar */}
          <button type="button" onClick={() => onFilterType(rule.type)} title="Filtrar por este tipo">
            <Badge variant="outline" color="dark" size="sm" className="cursor-pointer hover:ring-2 hover:ring-brand-500/40 transition-all">
              {typeLabel}
            </Badge>
          </button>

          {/* Badge de rol — clickeable para filtrar */}
          <button type="button" onClick={() => onFilterRole(rule.targetRoleName)} title="Filtrar por este rol">
            <Badge variant="light" color="light" size="sm" className="cursor-pointer hover:ring-2 hover:ring-brand-500/40 transition-all">
              {roleLabel}
            </Badge>
          </button>

          {rule.sendEmail && (
            <Badge color="info" size="sm" startIcon={<MailIcon className="w-3 h-3" />}>
              Email
            </Badge>
          )}
          {isSeed && (
            <Badge color="primary" size="sm">
              Preset
            </Badge>
          )}
          {rule.daysThreshold !== null && (
            <Badge color="warning" size="sm">
              {rule.daysThreshold}d
            </Badge>
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
