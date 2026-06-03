/**
 * @file ReminderFormModal.tsx
 * @description Modal de creación/edición de reglas de recordatorios.
 * Incluye visualización de calendario para días de anticipación y
 * opción de notificación por correo electrónico.
 */

import { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../components/ui/modal';
import Button from '../../../components/ui/button/Button';
import Switch from '../../../components/form/switch/Switch';
import {
  ReminderRule,
  ReminderType,
  TargetRoleName,
  REMINDER_TYPE_LABELS,
  REMINDER_TYPE_ICONS,
  REMINDER_TYPE_DESCRIPTIONS,
  TARGET_ROLE_LABELS,
} from '../types';
import { CalendarIcon, MailIcon, BellIcon, ClockIcon } from '../../../icons/actions';

// ─── Constantes ───────────────────────────────────────────────────────────

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
  sendEmail: false,
};

// ─── Props ────────────────────────────────────────────────────────────────

interface ReminderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: typeof FORM_DEFAULTS) => Promise<void>;
  editingRule: ReminderRule | null;
  saving: boolean;
}

// ─── Calendar Visualization ──────────────────────────────────────────────

const DAYS_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const CalendarPreview = ({ daysThreshold }: { daysThreshold: number | null }) => {
  const today = new Date();
  const triggerDate = daysThreshold
    ? new Date(today.getTime() - daysThreshold * 24 * 60 * 60 * 1000)
    : null;

  // Mini grid: show days around the trigger date or today
  const todayDay = today.getDate();
  const todayMonth = today.toLocaleDateString('es-ES', { month: 'short' });

  // Show 7 days: if triggerDate, center around it; otherwise show current week
  const centerDate = triggerDate || today;
  const dayOfWeek = centerDate.getDay();
  const startOfWeek = new Date(centerDate);
  startOfWeek.setDate(centerDate.getDate() - dayOfWeek);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const monthLabel = centerDate.toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {monthLabel}
        </span>
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          Semana del {startOfWeek.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
        </span>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS_NAMES.map(name => (
          <div key={name} className="text-center text-[10px] font-medium text-gray-400 dark:text-gray-500 py-1">
            {name}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((d, idx) => {
          const isTrigger = triggerDate && d.toDateString() === triggerDate.toDateString();
          const isToday = d.toDateString() === today.toDateString();

          return (
            <div
              key={idx}
              className={`
                relative flex items-center justify-center h-8 w-full rounded-lg text-xs font-medium transition-all
                ${isTrigger
                  ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/30 scale-105 z-10'
                  : isToday
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 ring-1 ring-gray-300 dark:ring-gray-600'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }
              `}
            >
              <span className={isTrigger ? 'relative z-10' : ''}>
                {d.getDate()}
              </span>
              {isTrigger && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full animate-pulse" />
              )}
            </div>
          );
        })}
      </div>

      {/* Timeline */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        {daysThreshold && daysThreshold > 0 ? (
          <div className="flex items-center gap-2">
            {/* Trigger marker */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center shadow-sm">
                <BellIcon className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 text-center leading-tight">
                {triggerDate?.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </span>
            </div>

            {/* Arrow line */}
            <div className="flex-1 relative flex items-center justify-center px-2">
              <div className="h-0.5 w-full bg-gradient-to-r from-brand-400 to-gray-300 dark:from-brand-500 dark:to-gray-600" />
              <div className="absolute bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-600 text-[10px] font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">
                {daysThreshold} {daysThreshold === 1 ? 'día' : 'días'} antes
              </div>
              <div className="absolute right-0 w-2 h-2 rotate-45 border-t-2 border-r-2 border-gray-300 dark:border-gray-600" />
            </div>

            {/* Event marker */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <CalendarIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 text-center leading-tight">
                {today.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 py-1">
            <BellIcon className="w-4 h-4 text-brand-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {daysThreshold === null
                ? 'Se envía al detectar la condición (sin días de anticipación)'
                : 'Se envía el mismo día del evento'}
            </span>
          </div>
        )}
      </div>

      {daysThreshold && daysThreshold > 0 && (
        <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-500 text-center">
          El recordatorio se enviará <strong className="text-gray-600 dark:text-gray-300">{daysThreshold} {daysThreshold === 1 ? 'día' : 'días'}</strong> antes de la fecha del evento.
        </p>
      )}
    </div>
  );
};

// ─── Section Title ──────────────────────────────────────────────────────

const SectionTitle = ({ icon, title, description }: { icon: React.ReactNode; title: string; description?: string }) => (
  <div className="flex items-start gap-3 mb-4">
    <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center flex-shrink-0 ring-1 ring-brand-200 dark:ring-brand-500/20">
      <div className="text-brand-600 dark:text-brand-400">
        {icon}
      </div>
    </div>
    <div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
      )}
    </div>
  </div>
);

// ─── Component ──────────────────────────────────────────────────────────

export const ReminderFormModal = ({
  isOpen,
  onClose,
  onSave,
  editingRule,
  saving,
}: ReminderFormModalProps) => {
  // Derive initial state from editingRule directly (component remounts via key)
  const getInitialForm = () => {
    if (editingRule) {
      return {
        name: editingRule.name,
        description: editingRule.description,
        type: editingRule.type,
        active: editingRule.active,
        daysThreshold: editingRule.daysThreshold,
        targetRoleName: editingRule.targetRoleName,
        templateTitle: editingRule.templateTitle,
        templateMessage: editingRule.templateMessage,
        sendEmail: editingRule.sendEmail,
      };
    }
    return FORM_DEFAULTS;
  };

  const [form, setForm] = useState(getInitialForm);

  const handleChange = <K extends keyof typeof FORM_DEFAULTS>(
    key: K,
    value: (typeof FORM_DEFAULTS)[K],
  ) => {
    setForm(f => ({ ...f, [key]: value }));
  };

  const handleSave = () => {
    onSave(form);
  };

  const isValid = form.name.trim().length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton
      size="2xl"
    >
      <ModalHeader>
        <div className="max-w-3xl mx-auto w-full">
          <span className="mb-1 font-semibold text-text-primary modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
            {editingRule ? 'Editar recordatorio' : 'Nuevo recordatorio'}
          </span>
          <p className="text-sm text-text-secondary dark:text-text-tertiary font-normal">
            {editingRule
              ? 'Modificá la configuración de esta regla de recordatorio automático.'
              : 'Configurá una nueva regla de recordatorio automático para tutores y estudiantes.'}
          </p>
        </div>
      </ModalHeader>

      <ModalBody className="bg-gray-50/50 dark:bg-gray-900/30">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* ── Section: Información básica ─────────────────────────────── */}
          <div className="bg-white dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <SectionTitle
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              }
              title="Información básica"
              description="Datos generales de la regla de recordatorio."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Nombre *
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  value={form.name}
                  onChange={e => handleChange('name', e.target.value)}
                  placeholder="Ej: Evaluaciones 5 días"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Descripción
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  value={form.description}
                  onChange={e => handleChange('description', e.target.value)}
                  placeholder="Breve descripción del recordatorio"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Tipo de recordatorio
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  value={form.type}
                  onChange={e => handleChange('type', e.target.value as ReminderType)}
                  disabled={!!editingRule}
                >
                  {REMINDER_TYPES.map(t => (
                    <option key={t} value={t}>
                      {REMINDER_TYPE_ICONS[t]} {REMINDER_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
                {editingRule && (
                  <p className="mt-1 text-[11px] text-gray-400 italic">El tipo no se puede cambiar después de crear la regla.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Dirigido a
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                  value={form.targetRoleName}
                  onChange={e => handleChange('targetRoleName', e.target.value as TargetRoleName)}
                >
                  {TARGET_ROLES.map(r => (
                    <option key={r} value={r}>{TARGET_ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ── Section: ¿Cuándo se envía? ──────────────────────────────── */}
          <div className="bg-white dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <SectionTitle
              icon={<ClockIcon className="w-4 h-4" />}
              title="¿Cuándo se envía?"
              description="Configurá con cuántos días de anticipación se dispara el recordatorio."
            />

            <div className="flex items-end gap-4">
              <div className="w-48">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Días de anticipación
                </label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 pr-10 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={form.daysThreshold ?? ''}
                    onChange={e => handleChange('daysThreshold', e.target.value ? Number(e.target.value) : null)}
                    placeholder="Ej: 3"
                    min={0}
                  />
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col">
                    <button
                      type="button"
                      className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                      onClick={() => handleChange('daysThreshold', Math.max(0, (form.daysThreshold ?? 0) + 1))}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="18 15 12 9 6 15" /></svg>
                    </button>
                    <button
                      type="button"
                      className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                      onClick={() => {
                        const current = form.daysThreshold ?? 1;
                        const next = current - 1;
                        handleChange('daysThreshold', next > 0 ? next : null);
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9" /></svg>
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-[11px] text-gray-400">
                  {form.daysThreshold === null
                    ? 'Sin límite de días.'
                    : form.daysThreshold === 0
                      ? 'Mismo día del evento.'
                      : `${form.daysThreshold} ${form.daysThreshold === 1 ? 'día' : 'días'} antes del evento.`}
                </p>
              </div>

              {form.daysThreshold !== null && form.daysThreshold > 0 && (
                <div className="flex-1 min-w-0">
                  <CalendarPreview daysThreshold={form.daysThreshold} />
                </div>
              )}
            </div>

            {form.daysThreshold === null && (
              <div className="mt-2">
                <CalendarPreview daysThreshold={null} />
              </div>
            )}
          </div>

          {/* ── Section: Mensaje ────────────────────────────────────────── */}
          <div className="bg-white dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <SectionTitle
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              }
              title="Mensaje de la notificación"
              description="Texto que verán los destinatarios del recordatorio."
            />

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Título
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  value={form.templateTitle}
                  onChange={e => handleChange('templateTitle', e.target.value)}
                  placeholder="Ej: 📋 Evaluación pendiente"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Mensaje
                </label>
                <textarea
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all min-h-[80px] placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-y"
                  value={form.templateMessage}
                  onChange={e => handleChange('templateMessage', e.target.value)}
                  placeholder="Ej: Tenés {{count}} evaluación(es) sin calificar."
                  rows={3}
                />
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-[10px] font-mono text-gray-500 dark:text-gray-400">
                    {'{{count}}'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-[10px] font-mono text-gray-500 dark:text-gray-400">
                    {'{{student}}'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-[10px] font-mono text-gray-500 dark:text-gray-400">
                    {'{{date}}'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-[10px] font-mono text-gray-500 dark:text-gray-400">
                    {'{{docs}}'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-[10px] font-mono text-gray-500 dark:text-gray-400">
                    {'{{lastDate}}'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Section: Notificación por Email ─────────────────────────── */}
          <div className="bg-white dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <SectionTitle
              icon={<MailIcon className="w-4 h-4" />}
              title="Notificación por correo electrónico"
              description="Además de la notificación in-app, podés enviar un email a los destinatarios."
            />

            <div className="pl-12">
              <Switch
                key={`sendEmail-${editingRule?.id ?? 'new'}`}
                label="Enviar también por correo electrónico"
                defaultChecked={form.sendEmail}
                onChange={(checked) => handleChange('sendEmail', checked)}
                color="blue"
              />

              {form.sendEmail && (
                <div className="mt-3 flex items-start gap-2.5 p-3 rounded-lg bg-brand-50/50 dark:bg-brand-500/5 border border-brand-100 dark:border-brand-500/10">
                  <MailIcon className="w-4 h-4 text-brand-500 mt-0.5 flex-shrink-0" />
                  <div className="text-[12px] text-gray-600 dark:text-gray-400 leading-relaxed">
                    <p className="font-medium text-gray-700 dark:text-gray-300 mb-0.5">Correo activado</p>
                    <p>
                      Los destinatarios recibirán un email con el título y mensaje configurados,
                      además de la notificación dentro del sistema.
                    </p>
                  </div>
                </div>
              )}

              {!form.sendEmail && (
                <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed">
                  Solo se enviará una notificación dentro del sistema. Activá la opción si querés
                  que también llegue por correo electrónico.
                </p>
              )}
            </div>
          </div>
        </div>
      </ModalBody>

      <ModalFooter className="shrink-0 px-6 sm:px-12 py-5 bg-white dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 w-full max-w-3xl mx-auto">
          <Button variant="outline" onClick={onClose} disabled={saving} className="w-full sm:w-auto min-h-11">
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saving || !isValid}
            className="w-full sm:w-auto min-h-11"
          >
            {saving
              ? 'Guardando...'
              : editingRule
                ? 'Guardar cambios'
                : 'Crear recordatorio'
            }
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export default ReminderFormModal;
