/**
 * @file TemplateManager.tsx
 * @description Componente embebible para el CRUD de plantillas de email.
 * Se integra dentro del módulo de recordatorios (no como página standalone).
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../../components/ui/button/Button';
import Badge from '../../../components/ui/badge/Badge';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../components/ui/modal';
import { UnifiedDialog } from '../../../components/ui/dialog/UnifiedDialog';
import { SYSTEM_DIALOGS } from '../../../components/ui/dialog/DialogConfig';
import { useUnsavedChanges } from '../../../hooks/useUnsavedChanges';
import emailTemplatesService, { EmailTemplate, CreateEmailTemplate } from '../../../api/emailTemplatesService';
import { PlusCircleIcon, ChevronDownIcon } from '../../../icons/actions';
import { TrashBinIcon } from '../../../icons';
import { EditIcon } from '../../../icons/actions';
import { EmailEditor } from './EmailEditor';

// ─── Category config ─────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<string, { label: string; color: 'primary' | 'success' | 'warning' | 'info' }> = {
  periodo: { label: 'Período', color: 'primary' },
  evaluacion: { label: 'Evaluación', color: 'success' },
  general: { label: 'General', color: 'info' },
};

const CATEGORY_OPTIONS = [
  { value: 'periodo', label: 'Período Académico' },
  { value: 'evaluacion', label: 'Evaluación' },
  { value: 'general', label: 'General' },
];

// ─── Component ───────────────────────────────────────────────────────────

const TemplateManager = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  // Form
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('general');
  const [formSubject, setFormSubject] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Dirty tracking & close confirmation
  const [isDirty, setIsDirty] = useState(false);

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setIsDirty(false);
  };

  const { showConfirmation: showCloseWarning, handleCloseAttempt, confirmClose, cancelClose } = useUnsavedChanges(isDirty, closeModal);

  // Section collapsed
  const [collapsed, setCollapsed] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await emailTemplatesService.getAll();
      setTemplates(data);
    } catch (err) {
      console.error('[TemplateManager] Error fetching:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // ── Modal handlers ────────────────────────────────────────────────────

  const openCreateModal = () => {
    setEditing(null);
    setFormName('');
    setFormDescription('');
    setFormCategory('general');
    setFormSubject('');
    setFormBody('');
    setFormErrors({});
    setIsDirty(false);
    setModalOpen(true);
  };

  const openEditModal = (t: EmailTemplate) => {
    setEditing(t);
    setFormName(t.name);
    setFormDescription(t.description || '');
    setFormCategory(t.category);
    setFormSubject(t.subject);
    setFormBody(t.body_html);
    setFormErrors({});
    setIsDirty(false);
    setModalOpen(true);
  };

  // ── Validation ────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formName.trim() || formName.trim().length < 3) errs.name = 'Mínimo 3 caracteres';
    if (!formSubject.trim() || formSubject.trim().length < 3) errs.subject = 'Mínimo 3 caracteres';
    if (!formBody.trim() || formBody.trim().length < 10) errs.body = 'Mínimo 10 caracteres';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Save ──────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const input: CreateEmailTemplate = {
        name: formName.trim(),
        description: formDescription.trim() || null,
        category: formCategory,
        subject: formSubject.trim(),
        body_html: formBody.trim(),
      };

      if (editing) {
        await emailTemplatesService.update(editing.id, input);
      } else {
        await emailTemplatesService.create(input);
      }

      await fetchTemplates();
      setIsDirty(false);
      closeModal();
    } catch (err) {
      console.error('[TemplateManager] Error saving:', err);
      setFormErrors({ submit: 'Error al guardar. Intentá de nuevo.' });
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────

  const handleDelete = async (id: number) => {
    try {
      await emailTemplatesService.remove(id);
      setConfirmDelete(null);
      await fetchTemplates();
    } catch (err) {
      console.error('[TemplateManager] Error deleting:', err);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800/50 overflow-hidden">
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600 dark:text-purple-400">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Plantillas de Email</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {templates.length} plantilla(s) — usalas en el Correo Express
            </p>
          </div>
        </div>
        <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${collapsed ? '' : 'rotate-180'}`} />
      </button>

      {!collapsed && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-5 space-y-4">
          {/* Top bar */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Creá y editá plantillas con variables dinámicas {'{{nombre}}'}, {'{{periodo}}'}, etc.
            </p>
            <Button variant="primary" size="sm" onClick={openCreateModal}>
              <PlusCircleIcon className="w-4 h-4 mr-1.5" />
              Nueva
            </Button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              <span className="ml-2 text-xs text-gray-500">Cargando...</span>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-gray-400">No hay plantillas aún.</p>
              <Button variant="outline" size="sm" onClick={openCreateModal} className="mt-3">
                Crear primera plantilla
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left py-2.5 px-3 font-medium text-gray-500 dark:text-gray-400 text-xs">Nombre</th>
                    <th className="text-left py-2.5 px-3 font-medium text-gray-500 dark:text-gray-400 text-xs">Categoría</th>
                    <th className="text-left py-2.5 px-3 font-medium text-gray-500 dark:text-gray-400 text-xs">Asunto</th>
                    <th className="text-right py-2.5 px-3 font-medium text-gray-500 dark:text-gray-400 text-xs">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {templates.map(t => {
                      const cat = CATEGORY_CONFIG[t.category] || CATEGORY_CONFIG.general;
                      return (
                        <motion.tr
                          key={t.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="py-2.5 px-3">
                            <span className="font-medium text-gray-900 dark:text-white text-sm">{t.name}</span>
                            {t.description && (
                              <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[200px]">{t.description}</p>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <Badge color={cat.color} size="sm">
                              {cat.label}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 text-gray-600 dark:text-gray-300 text-xs max-w-[180px] truncate">
                            {t.subject}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEditModal(t)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                                title="Editar"
                              >
                                <EditIcon className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setConfirmDelete(t.id)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                title="Eliminar"
                              >
                                <TrashBinIcon className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          Create/Edit Modal
       ════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        onCloseAttempt={handleCloseAttempt}
        showCloseButton
        size="lg"
      >
        <ModalHeader>
          <span className="font-semibold text-text-primary modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
            {editing ? 'Editar plantilla' : 'Nueva plantilla'}
          </span>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nombre *</label>
              <input
                type="text"
                value={formName}
                onChange={e => { setFormName(e.target.value); setIsDirty(true); }}
                className={`w-full rounded-lg border ${formErrors.name ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20`}
                placeholder="Ej: Inicio de Lapso Académico"
              />
              {formErrors.name && <p className="mt-1 text-[11px] text-red-500">{formErrors.name}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Descripción</label>
              <input
                type="text"
                value={formDescription}
                onChange={e => { setFormDescription(e.target.value); setIsDirty(true); }}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                placeholder="¿Para qué se usa esta plantilla?"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Categoría *</label>
              <select
                value={formCategory}
                onChange={e => { setFormCategory(e.target.value); setIsDirty(true); }}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              >
                {CATEGORY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Asunto * <span className="text-gray-400 font-normal">(podés usar {'{{variable}}'})</span>
              </label>
              <input
                type="text"
                value={formSubject}
                onChange={e => { setFormSubject(e.target.value); setIsDirty(true); }}
                className={`w-full rounded-lg border ${formErrors.subject ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20`}
                placeholder="Ej: 📢 Inicio de lapso {{periodo}}"
              />
              {formErrors.subject && <p className="mt-1 text-[11px] text-red-500">{formErrors.subject}</p>}
            </div>

            {/* Cuerpo del email — editor visual */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Cuerpo del correo * <span className="text-gray-400 font-normal">(usá los botones para dar formato)</span>
              </label>
              <EmailEditor
                value={formBody}
                onChange={v => { setFormBody(v); setIsDirty(true); }}
                error={formErrors.body}
                minHeight="220px"
              />
            </div>

            {formErrors.submit && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-xs text-red-600 dark:text-red-400">{formErrors.submit}</p>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={handleCloseAttempt} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving} loading={saving} loadingText="Guardando...">
            {editing ? 'Guardar cambios' : 'Crear plantilla'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* ════════════════════════════════════════════════════════════════
          Delete Confirm Dialog
       ════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        showCloseButton
        size="sm"
      >
        <ModalHeader>
          <span className="font-semibold text-text-primary modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
            Eliminar plantilla
          </span>
        </ModalHeader>
        <ModalBody>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            ¿Estás seguro de eliminar esta plantilla? Esta acción no se puede deshacer.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setConfirmDelete(null)}>
            Cancelar
          </Button>
          <Button
            variant="error"
            onClick={() => confirmDelete !== null && handleDelete(confirmDelete)}
          >
            Eliminar
          </Button>
        </ModalFooter>
      </Modal>

      {/* ════════════════════════════════════════════════════════════════
          Close Without Saving Warning
       ════════════════════════════════════════════════════════════════ */}
      <UnifiedDialog
        isOpen={showCloseWarning}
        onClose={cancelClose}
        onConfirm={confirmClose}
        variant="warning"
        {...SYSTEM_DIALOGS.closeWithoutSaving}
      />
    </div>
  );
};

export default TemplateManager;
