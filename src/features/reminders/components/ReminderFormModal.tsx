/**
 * @file ReminderFormModal.tsx
 * @description Modal de creación/edición de reglas de recordatorios.
 * Incluye calendario interactivo para seleccionar fecha de envío,
 * opción de recurrencia, selector de destinatarios, y validaciones.
 */

import { useState, useEffect } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../components/ui/modal';
import Button from '../../../components/ui/button/Button';
import Switch from '../../../components/form/switch/Switch';
import {
  ReminderRule,
  ReminderType,
  REMINDER_TYPE_LABELS,
  REMINDER_TYPE_ICONS,
  REMINDER_TYPE_DESCRIPTIONS,
} from '../types';
import RecipientSelector, { RecipientSelection } from './RecipientSelector';
import { CalendarIcon, MailIcon, BellIcon, ClockIcon, EyeIcon } from '../../../icons/actions';
import { useUnsavedChanges } from '../../../hooks/useUnsavedChanges';
import { UnifiedDialog } from '../../../components/ui/dialog/UnifiedDialog';
import { SYSTEM_DIALOGS } from '../../../components/ui/dialog/DialogConfig';

// ─── Constants ───────────────────────────────────────────────────────────

const REMINDER_TYPES = Object.keys(REMINDER_TYPE_LABELS) as ReminderType[];

const FORM_DEFAULTS = {
  name: '',
  description: '',
  type: 'pending_evaluation' as ReminderType,
  active: true,
  // En lugar de daysThreshold, usamos sendDate como ISO string
  sendDate: null as string | null,
  // Recurrencia
  recurringEnabled: false,
  recurringInterval: 7 as number | null,
  // Destinatarios
  recipients: { roles: [], users: [] } as RecipientSelection,
  // Mensaje
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

// ─── Helper: format date ─────────────────────────────────────────────────

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const daysBetween = (a: Date, b: Date): number => {
  const diff = b.getTime() - a.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// ─── Email Preview Component ─────────────────────────────────────────────

const SAMPLE_VALUES: Record<string, string> = {
  count: '3',
  student: 'María González',
  date: '20 de junio, 2026',
  docs: 'Informe final, Carta aval',
  lastDate: '28 de mayo, 2026',
};

const fillTemplateVariables = (text: string): string => {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => SAMPLE_VALUES[key] ?? `{{${key}}}`);
};

const EmailPreview = ({ title, message }: { title: string; message: string }) => {
  const [expanded, setExpanded] = useState(false);
  const previewTitle = fillTemplateVariables(title || 'Asunto del correo');
  const previewMessage = fillTemplateVariables(message || 'Contenido del mensaje');

  return (
    <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800/50">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <EyeIcon className="w-4 h-4 text-gray-400" />
          Vista previa del correo
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${expanded ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {expanded && (
        <div className="px-4 pb-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-gradient-to-r from-brand-600 to-brand-700">
              <p className="text-[10px] text-white/70">SIGP UNEFA</p>
              <p className="text-[11px] text-white/90 font-medium mt-0.5">{previewTitle}</p>
            </div>
            <div className="px-4 py-4 space-y-3">
              <p className="text-xs text-gray-400">Hola [Nombre del destinatario],</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{previewMessage}</p>
              <div className="p-2 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium mb-1">Valores de muestra</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-amber-600 dark:text-amber-500">
                  <span>{'{{count}}'} → 3</span>
                  <span>{'{{student}}'} → María González</span>
                  <span>{'{{date}}'} → 20 de junio, 2026</span>
                  <span>{'{{docs}}'} → Informe final, Carta aval</span>
                  <span>{'{{lastDate}}'} → 28 de mayo, 2026</span>
                </div>
              </div>
            </div>
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-[10px] text-gray-400 text-center">SIGP UNEFA — Sistema de Gestión de Personal<br />Este es un mensaje automático, por favor no responder.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Section Title ──────────────────────────────────────────────────────

const SectionTitle = ({ icon, title, description }: { icon: React.ReactNode; title: string; description?: string }) => (
  <div className="flex items-start gap-3 mb-4">
    <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center flex-shrink-0 ring-1 ring-brand-200 dark:ring-brand-500/20">
      <div className="text-brand-600 dark:text-brand-400">{icon}</div>
    </div>
    <div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
      {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
    </div>
  </div>
);

// ─── Calendar Date Picker ────────────────────────────────────────────────

const DAYS_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

interface CalendarDatePickerProps {
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  recurringEnabled: boolean;
  recurringInterval: number | null;
}

const CalendarDatePicker = ({ selectedDate, onSelectDate, recurringEnabled, recurringInterval }: CalendarDatePickerProps) => {
  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const selected = selectedDate ? new Date(selectedDate + 'T00:00:00') : null;

  // View state
  const initialMonth = selected ? selected.getMonth() : today.getMonth();
  const initialYear = selected ? selected.getFullYear() : today.getFullYear();
  const [viewMonth, setViewMonth] = useState(initialMonth);
  const [viewYear, setViewYear] = useState(initialYear);

  const goPrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else { setViewMonth(m => m - 1); }
  };
  const goNextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else { setViewMonth(m => m + 1); }
  };

  const startDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const diffMonths = selected
    ? (todayDate.getFullYear() - selected.getFullYear()) * 12 + (todayDate.getMonth() - selected.getMonth())
    : 0;

  const gridCells: Array<{ day: number; date: Date } | null> = [];
  for (let i = 0; i < startDayOfWeek; i++) gridCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    gridCells.push({ day: d, date: new Date(viewYear, viewMonth, d) });
  }

  // Calculate recurring dates if enabled
  const recurringDates: Date[] = [];
  if (recurringEnabled && selected && recurringInterval && recurringInterval > 0) {
    let nextDate = new Date(selected);
    while (nextDate <= todayDate) {
      recurringDates.push(new Date(nextDate));
      nextDate.setDate(nextDate.getDate() + recurringInterval);
    }
  }

  const isInRange = (date: Date): boolean => {
    if (!selected) return false;
    if (date < selected || date > todayDate) return false;
    if (recurringEnabled && recurringInterval && recurringInterval > 0) {
      const diff = daysBetween(selected, date);
      return diff % recurringInterval === 0;
    }
    return true;
  };

  const isRecurringDate = (date: Date): boolean => {
    if (!recurringEnabled || !selected || !recurringInterval) return false;
    return recurringDates.some(rd => rd.toDateString() === date.toDateString()) && date > todayDate;
  };

  const isPastRecurring = (date: Date): boolean => {
    if (!recurringEnabled || !selected || !recurringInterval) return false;
    return recurringDates.some(rd => rd.toDateString() === date.toDateString()) && date <= todayDate;
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={goPrevMonth} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Mes anterior">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 capitalize">{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button type="button" onClick={goNextMonth} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Mes siguiente">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAYS_NAMES.map(name => (
          <div key={name} className="text-center text-[10px] font-medium text-gray-400 dark:text-gray-500 py-1">{name}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {gridCells.map((cell, idx) => {
          if (!cell) return <div key={`b-${idx}`} className="h-8" />;
          const { day, date } = cell;
          const isToday = date.toDateString() === todayDate.toDateString();
          const isSelected = selected && date.toDateString() === selected.toDateString();
          const isPast = date < todayDate;
          const isFutureRecurring = isRecurringDate(date);
          const wasSent = isPastRecurring(date);

          let cellStyle = 'text-gray-500 dark:text-gray-400';
          let clickable = false;

          if (isSelected) {
            cellStyle = 'bg-brand-500 text-white font-bold shadow-sm shadow-brand-500/30 z-10';
            clickable = true;
          } else if (isToday) {
            cellStyle = 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold ring-1 ring-gray-300 dark:ring-gray-500';
            clickable = true;
          } else if (isFutureRecurring) {
            cellStyle = 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 ring-1 ring-orange-200 dark:ring-orange-700';
            clickable = false;
          } else if (wasSent) {
            cellStyle = 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400';
            clickable = false;
          } else if (!isPast) {
            cellStyle = 'text-gray-700 dark:text-gray-200 hover:bg-brand-100 dark:hover:bg-brand-900/30 cursor-pointer';
            clickable = true;
          } else {
            cellStyle = 'text-gray-300 dark:text-gray-600';
          }

          return (
            <div
              key={day}
              className={`relative flex items-center justify-center h-8 w-full text-xs font-medium transition-all rounded-lg ${cellStyle}`}
              onClick={() => {
                if (clickable && !isPast) {
                  if (isSelected) {
                    onSelectDate(null);
                  } else {
                    onSelectDate(date.toISOString().split('T')[0]);
                  }
                }
              }}
              role={clickable ? 'button' : undefined}
              tabIndex={clickable ? 0 : undefined}
              onKeyDown={e => {
                if (clickable && e.key === 'Enter') {
                  onSelectDate(date.toISOString().split('T')[0]);
                }
              }}
            >
              <span className={isSelected ? 'relative z-10' : ''}>{day}</span>
              {isSelected && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-400 rounded-full animate-pulse ring-1 ring-white dark:ring-gray-800" />}
              {isToday && !isSelected && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-500 rounded-full" />}
              {isFutureRecurring && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-orange-400 rounded-full" />}
              {wasSent && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full" />}
            </div>
          );
        })}
      </div>

      {/* Selected date info */}
      {selected && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center shadow-sm shadow-brand-500/20">
                <BellIcon className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 text-center leading-tight font-medium">
                {selected.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </span>
            </div>

            <div className="flex-1 relative flex items-center justify-center h-9">
              {recurringEnabled && recurringInterval ? (
                <>
                  <div className="h-0.5 w-full bg-gradient-to-r from-brand-400 to-orange-300 dark:from-brand-500 dark:to-orange-600" />
                  <div className="absolute bg-white dark:bg-gray-800 px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-600 text-[10px] font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap shadow-sm">
                    Cada {recurringInterval} días
                  </div>
                </>
              ) : selected > todayDate ? (
                <>
                  <div className="h-0.5 w-full bg-gradient-to-r from-brand-400 to-gray-300 dark:from-brand-500 dark:to-gray-600" />
                  <div className="absolute bg-white dark:bg-gray-800 px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-600 text-[10px] font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap shadow-sm">
                    {daysBetween(todayDate, selected)} días
                  </div>
                </>
              ) : (
                <>
                  <div className="h-0.5 w-full bg-gray-300 dark:bg-gray-600" />
                  <div className="absolute bg-white dark:bg-gray-800 px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-600 text-[10px] font-semibold text-gray-500 whitespace-nowrap shadow-sm">
                    Enviado
                  </div>
                </>
              )}
              <div className="absolute right-0 w-2 h-2 rotate-45 border-t-2 border-r-2 border-gray-300 dark:border-gray-600" />
            </div>

            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ring-1 ${
                selected <= todayDate
                  ? 'bg-green-100 dark:bg-green-900/30 ring-green-300 dark:ring-green-700'
                  : 'bg-gray-200 dark:bg-gray-700 ring-gray-300 dark:ring-gray-600'
              }`}>
                <CalendarIcon className={`w-4 h-4 ${selected <= todayDate ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`} />
              </div>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 text-center leading-tight font-medium">
                Hoy
              </span>
            </div>
          </div>
        </div>
      )}

      {!selected && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center gap-2 py-1">
            <CalendarIcon className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400">Selecciona un día en el calendario para programar el envío</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Validation helpers ──────────────────────────────────────────────────

interface ValidationErrors {
  name?: string;
  sendDate?: string;
  recipients?: string;
  templateTitle?: string;
  templateMessage?: string;
}

const validateForm = (form: typeof FORM_DEFAULTS): ValidationErrors => {
  const errors: ValidationErrors = {};
  if (!form.name.trim()) errors.name = 'El nombre es obligatorio.';
  if (!form.sendDate) errors.sendDate = 'Selecciona una fecha de envío.';
  if (form.recipients.roles.length === 0 && form.recipients.users.length === 0) {
    errors.recipients = 'Selecciona al menos un destinatario (grupo o usuario).';
  }
  if (form.sendEmail) {
    if (!form.templateTitle.trim()) errors.templateTitle = 'El título del correo es obligatorio si activas el envío por correo electrónico.';
    if (!form.templateMessage.trim()) errors.templateMessage = 'El mensaje del correo es obligatorio si activas el envío por correo electrónico.';
  }
  return errors;
};

// ─── Main Component ─────────────────────────────────────────────────────

export const ReminderFormModal = ({
  isOpen,
  onClose,
  onSave,
  editingRule,
  saving,
}: ReminderFormModalProps) => {
  const getInitialForm = () => {
    if (editingRule) {
      return {
        name: editingRule.name,
        description: editingRule.description,
        type: editingRule.type,
        active: editingRule.active,
        sendDate: null as string | null,
        recurringEnabled: false,
        recurringInterval: 7 as number | null,
        recipients: { roles: editingRule.targetRoleName ? [editingRule.targetRoleName] : [], users: [] } as RecipientSelection,
        templateTitle: editingRule.templateTitle,
        templateMessage: editingRule.templateMessage,
        sendEmail: editingRule.sendEmail,
      };
    }
    return FORM_DEFAULTS;
  };

  const [form, setForm] = useState(getInitialForm);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isDirty, setIsDirty] = useState(false);
  const { showConfirmation, handleCloseAttempt, confirmClose, cancelClose } = useUnsavedChanges(isDirty, onClose);

  // Reset errors when form changes
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const newErrors = validateForm(form);
      setErrors(newErrors);
    }
  }, [form]);

  const handleChange = <K extends keyof typeof FORM_DEFAULTS>(
    key: K,
    value: (typeof FORM_DEFAULTS)[K],
  ) => {
    setForm(f => ({ ...f, [key]: value }));
    setTouched(t => ({ ...t, [key]: true }));
    setIsDirty(true);
  };

  const handleSave = () => {
    const validationErrors = validateForm(form);
    setErrors(validationErrors);
    setTouched({ name: true, sendDate: true, recipients: true, templateTitle: true, templateMessage: true });
    if (Object.keys(validationErrors).length > 0) return;
    setIsDirty(false);
    onSave(form);
  };

  const isValid = form.name.trim().length > 0;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} onCloseAttempt={handleCloseAttempt} showCloseButton size="3xl">
      <ModalHeader>
        <div className="max-w-4xl mx-auto w-full">
          <span className="mb-1 font-semibold text-text-primary modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
            {editingRule ? 'Editar recordatorio' : 'Nuevo recordatorio'}
          </span>
          <p className="text-sm text-text-secondary dark:text-text-tertiary font-normal">
            Configura la regla, la fecha de envío y los destinatarios.
          </p>
        </div>
      </ModalHeader>

      <ModalBody className="bg-gray-50/50 dark:bg-gray-900/30">
        <div className="max-w-4xl mx-auto space-y-6">
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
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nombre <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className={`w-full rounded-lg border ${errors.name && touched.name ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-gray-400`}
                  value={form.name}
                  onChange={e => handleChange('name', e.target.value)}
                  placeholder="Ej: Evaluaciones 5 días"
                />
                {errors.name && touched.name && <p className="mt-1 text-[11px] text-red-500">{errors.name}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Descripción</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-gray-400"
                  value={form.description}
                  onChange={e => handleChange('description', e.target.value)}
                  placeholder="Breve descripción del recordatorio"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tipo de recordatorio</label>
                <select
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  value={form.type}
                  onChange={e => handleChange('type', e.target.value as ReminderType)}
                  disabled={!!editingRule}
                >
                  {REMINDER_TYPES.map(t => (
                    <option key={t} value={t}>{REMINDER_TYPE_ICONS[t]} {REMINDER_TYPE_LABELS[t]}</option>
                  ))}
                </select>
                {editingRule && <p className="mt-1 text-[11px] text-gray-400 italic">El tipo no se puede cambiar después de crear la regla.</p>}
              </div>
            </div>
          </div>

          {/* ── Section: ¿Cuándo se envía? ──────────────────────────────── */}
          <div className="bg-white dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <SectionTitle
              icon={<ClockIcon className="w-4 h-4" />}
              title="¿Cuándo se envía?"
              description="Selecciona la fecha exacta de envío en el calendario."
            />

            <CalendarDatePicker
              selectedDate={form.sendDate}
              onSelectDate={(date) => handleChange('sendDate', date)}
              recurringEnabled={form.recurringEnabled}
              recurringInterval={form.recurringInterval}
            />
            {errors.sendDate && touched.sendDate && <p className="text-[11px] text-red-500">{errors.sendDate}</p>}

            {/* Recurring option */}
            <div className="flex items-center gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <Switch
                label="Recordatorio recurrente"
                defaultChecked={form.recurringEnabled}
                onChange={(checked) => handleChange('recurringEnabled', checked)}
                color="blue"
              />
              {form.recurringEnabled && (
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">Cada</label>
                  <input
                    type="number"
                    className="w-20 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-xs text-center focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                    value={form.recurringInterval ?? 7}
                    onChange={e => handleChange('recurringInterval', e.target.value ? Number(e.target.value) : null)}
                    min={1}
                  />
                  <label className="text-xs text-gray-500">días</label>
                  <span className="text-[11px] text-gray-400 ml-2">
                    (próximo envío: {form.sendDate ? formatDate(form.sendDate) : '—'})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── Section: Destinatarios ──────────────────────────────────── */}
          <div className="bg-white dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <SectionTitle
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
              title="Destinatarios"
              description="Selecciona a quiénes va dirigido el recordatorio."
            />
            <RecipientSelector
              value={form.recipients}
              onChange={(value) => handleChange('recipients', value)}
            />
            {errors.recipients && touched.recipients && <p className="text-[11px] text-red-500">{errors.recipients}</p>}
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
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Título</label>
                <input
                  type="text"
                  className={`w-full rounded-lg border ${errors.templateTitle && touched.templateTitle ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-gray-400`}
                  value={form.templateTitle}
                  onChange={e => handleChange('templateTitle', e.target.value)}
                  placeholder="Ej: 📋 Evaluación pendiente"
                />
                {errors.templateTitle && touched.templateTitle && <p className="mt-1 text-[11px] text-red-500">{errors.templateTitle}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Mensaje</label>
                <textarea
                  className={`w-full rounded-lg border ${errors.templateMessage && touched.templateMessage ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all min-h-[80px] placeholder:text-gray-400 resize-y`}
                  value={form.templateMessage}
                  onChange={e => handleChange('templateMessage', e.target.value)}
                  placeholder="Ej: Tienes {{count}} evaluación(es) sin calificar."
                  rows={3}
                />
                {errors.templateMessage && touched.templateMessage && <p className="mt-1 text-[11px] text-red-500">{errors.templateMessage}</p>}
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {['{{count}}', '{{student}}', '{{date}}', '{{docs}}', '{{lastDate}}'].map(v => (
                    <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-[10px] font-mono text-gray-500 dark:text-gray-400">{v}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Section: Notificación por Email ─────────────────────────── */}
          <div className="bg-white dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <SectionTitle
              icon={<MailIcon className="w-4 h-4" />}
              title="Notificación por correo electrónico"
              description="Además de la notificación in-app, puedes enviar un correo electrónico a los destinatarios."
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
                    <p>Los destinatarios recibirán un correo electrónico con el título y mensaje configurados, además de la notificación dentro del sistema.</p>
                  </div>
                </div>
              )}
              {!form.sendEmail && (
                <p className="mt-2 text-[11px] text-gray-400 leading-relaxed">Solo se enviará una notificación dentro del sistema. Activa la opción si quieres que también llegue por correo electrónico.</p>
              )}
              <EmailPreview title={form.templateTitle} message={form.templateMessage} />
            </div>
          </div>
        </div>
      </ModalBody>

      <ModalFooter className="shrink-0 px-6 sm:px-12 py-5 bg-white dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 w-full max-w-4xl mx-auto">
          <Button variant="outline" onClick={handleCloseAttempt} disabled={saving} className="w-full sm:w-auto min-h-11">Cancelar</Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saving || !isValid}
            loading={saving}
            loadingText="Guardando..."
            className="w-full sm:w-auto min-h-11"
          >
            {editingRule ? 'Guardar cambios' : 'Crear recordatorio'}
          </Button>
        </div>
      </ModalFooter>
      </Modal>

      <UnifiedDialog
        isOpen={showConfirmation}
        onClose={cancelClose}
        onConfirm={confirmClose}
        variant="warning"
        {...SYSTEM_DIALOGS.closeWithoutSaving}
      />
    </>
  );
};

export default ReminderFormModal;
