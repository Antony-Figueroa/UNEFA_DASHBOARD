/**
 * @file ExpressEmailModal.tsx
 * @description Modal para envío de correo express masivo.
 * Soporta: roles, usuarios del sistema, emails externos y plantillas pre-definidas.
 */

import { useState, useMemo, useCallback } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../components/ui/modal';
import Button from '../../../components/ui/button/Button';
import RecipientSelector, { RecipientSelection } from './RecipientSelector';
import TemplateSelector from './TemplateSelector';
import { EmailEditor } from './EmailEditor';
import { MailIcon } from '../../../icons/actions';
import apiClient from '../../../api/apiClient';
import type { EmailTemplate } from '../../../api/emailTemplatesService';
import { useUnsavedChanges } from '../../../hooks/useUnsavedChanges';
import { UnifiedDialog } from '../../../components/ui/dialog/UnifiedDialog';
import { SYSTEM_DIALOGS } from '../../../components/ui/dialog/DialogConfig';

// ─── Validation ─────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Types ──────────────────────────────────────────────────────────────

interface ExpressEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Component ──────────────────────────────────────────────────────────

export const ExpressEmailModal = ({ isOpen, onClose }: ExpressEmailModalProps) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [recipients, setRecipients] = useState<RecipientSelection>({ roles: [], users: [] });

  // External emails (chip input)
  const [externalEmails, setExternalEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [emailInputError, setEmailInputError] = useState('');

  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const [result, setResult] = useState<{ total: number; sent: number; failed: number } | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const close = useCallback(() => {
    if (sent) {
      setSubject('');
      setMessage('');
      setRecipients({ roles: [], users: [] });
      setExternalEmails([]);
      setEmailInput('');
      setEmailInputError('');
      setErrors({});
      setSent(false);
      setResult(null);
    }
    onClose();
  }, [sent, onClose]);

  const { showConfirmation, handleCloseAttempt, confirmClose, cancelClose } = useUnsavedChanges(isDirty && !sent, close);

  // ── External email handlers ──────────────────────────────────────────

  const addEmail = () => {
    const trimmed = emailInput.trim().toLowerCase();
    if (!trimmed) return;

    if (!EMAIL_REGEX.test(trimmed)) {
      setEmailInputError('Formato de email inválido');
      return;
    }

    if (externalEmails.includes(trimmed)) {
      setEmailInputError('Este email ya está agregado');
      return;
    }

    setExternalEmails(prev => [...prev, trimmed]);
    setEmailInput('');
    setEmailInputError('');
    setIsDirty(true);
  };

  const removeEmail = (email: string) => {
    setExternalEmails(prev => prev.filter(e => e !== email));
    setIsDirty(true);
  };

  const handleEmailKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addEmail();
    }
    if (e.key === 'Backspace' && !emailInput && externalEmails.length > 0) {
      removeEmail(externalEmails[externalEmails.length - 1]);
    }
  };

  const handleEmailBlur = () => {
    if (emailInput.trim()) addEmail();
  };

  // ── Template handler ────────────────────────────────────────────────

  const handleTemplateSelect = (template: EmailTemplate) => {
    setSubject(template.subject);
    setMessage(template.body_html);
    setIsDirty(true);
  };

  // ── Validation ────────────────────────────────────────────────────────

  const totalCount = useMemo(() => {
    let count = externalEmails.length;
    if (recipients.roles.includes('all')) count += 1; // placeholder
    else count += recipients.roles.length;
    count += recipients.users.length;
    return count;
  }, [externalEmails, recipients]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!subject.trim()) errs.subject = 'El asunto es obligatorio.';
    if (!message.trim()) errs.message = 'El mensaje es obligatorio.';
    if (recipients.roles.length === 0 && recipients.users.length === 0 && externalEmails.length === 0) {
      errs.recipients = 'Agregá al menos un destinatario (rol, usuario o email externo).';
    }
    return errs;
  };

  // ── Send ──────────────────────────────────────────────────────────────

  const handleSend = async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSending(true);
    try {
      const res = await apiClient.post('/notifications/express-email', {
        subject: subject.trim(),
        message: message.trim(),
        recipients: {
          roles: recipients.roles,
          users: recipients.users.map(u => ({ id: u.id })),
          externalEmails,
        },
      });

      setResult(res.data.data);
      setSent(true);
      setIsDirty(false);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Error al enviar. Intentá de nuevo.';
      setErrors({ send: msg });
      console.error('[ExpressEmail] Error:', err);
    } finally {
      setSending(false);
    }
  };

  // ── Close / Reset ─────────────────────────────────────────────────────

  // `close` is now defined above as a useCallback

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <>
      <Modal isOpen={isOpen} onClose={close} onCloseAttempt={handleCloseAttempt} showCloseButton size="2xl">
      <ModalHeader>
        <div className="max-w-3xl mx-auto w-full">
          <span className="mb-1 font-semibold text-text-primary modal-title text-theme-xl dark:text-white/90 lg:text-2xl flex items-center gap-2">
            <MailIcon className="w-5 h-5 text-brand-500" />
            Correo Express Masivo
          </span>
          <p className="text-sm text-text-secondary dark:text-text-tertiary font-normal">
            Enviá un correo en este mismo momento a grupos, usuarios y/o direcciones externas.
          </p>
        </div>
      </ModalHeader>

      <ModalBody className="bg-gray-50/50 dark:bg-gray-900/30">
        <div className="max-w-3xl mx-auto space-y-6">
          {sent ? (
            /* ── Success state ──────────────────────────────────── */
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 dark:text-green-400">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Correo enviado</h3>
              <p className="text-sm text-gray-500 mt-1">
                {result
                  ? `Enviado a ${result.sent} de ${result.total} destinatario(s).${result.failed > 0 ? ` ${result.failed} fallaron.` : ''}`
                  : `El mensaje fue enviado exitosamente.`}
              </p>
            </div>
          ) : (
            <>
              {/* ══════ Template selector ════════════════════════════ */}
              <div className="bg-white dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                <TemplateSelector onSelect={handleTemplateSelect} disabled={sending} />
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Al seleccionar una plantilla se auto-completarán el asunto y el mensaje. 
                  Podés editarlos antes de enviar.
                </p>
              </div>

              {/* ══════ Subject & message ════════════════════════════ */}
              <div className="bg-white dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Asunto y mensaje</h3>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Asunto *</label>
                  <input
                    type="text"
                    className={`w-full rounded-lg border ${errors.subject ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-gray-400`}
                    value={subject}
                    onChange={e => { setSubject(e.target.value); setIsDirty(true); }}
                    placeholder="Ej: Aviso importante - SIGP UNEFA"
                    disabled={sending}
                  />
                  {errors.subject && <p className="mt-1 text-[11px] text-red-500">{errors.subject}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Mensaje * <span className="text-gray-400 font-normal">(usá los botones para dar formato)</span>
                  </label>
                  <EmailEditor
                    value={message}
                    onChange={v => { setMessage(v); setIsDirty(true); }}
                    error={errors.message}
                    minHeight="180px"
                    disabled={sending}
                  />
                </div>
              </div>

              {/* ══════ External emails (chip input) ════════════════ */}
              <div className="bg-white dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Destinatarios externos</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 -mt-3">
                  Escribí direcciones de email para enviar a personas fuera del sistema (como Google Drive).
                </p>

                {/* Chip input */}
                <div className={`flex flex-wrap items-center gap-1.5 p-2 rounded-lg border transition-all ${
                  emailInputError ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-800 min-h-[44px] focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20`}>
                  {externalEmails.map(email => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-medium"
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => removeEmail(email)}
                        className="hover:text-brand-800 dark:hover:text-brand-200"
                        disabled={sending}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </span>
                  ))}
                  <input
                    type="email"
                    value={emailInput}
                    onChange={e => { setEmailInput(e.target.value); setEmailInputError(''); }}
                    onKeyDown={handleEmailKeyDown}
                    onBlur={handleEmailBlur}
                    placeholder={externalEmails.length === 0 ? 'ej: correo@ejemplo.com, otro@dominio.com' : 'Agregar otro...'}
                    className="flex-1 min-w-[120px] border-0 bg-transparent text-sm outline-none placeholder:text-gray-400 py-1"
                    disabled={sending}
                  />
                </div>
                {emailInputError && <p className="text-[11px] text-red-500">{emailInputError}</p>}
                <p className="text-[11px] text-gray-400">
                  Presioná Enter o coma después de cada email.
                </p>
              </div>

              {/* ══════ System recipients ════════════════════════════ */}
              <div className="bg-white dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                  <RecipientSelector
                    value={recipients}
                    onChange={v => { setRecipients(v); setIsDirty(true); }}
                    title="Destinatarios del sistema"
                  description="Seleccioná los grupos y/o usuarios registrados a los que querés enviar el correo."
                />
                {errors.recipients && <p className="text-[11px] text-red-500">{errors.recipients}</p>}
              </div>

              {/* ── Total count ────────────────────────────────────── */}
              <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                {totalCount > 0 && <span>Total: ~{totalCount} destinatario(s)</span>}
              </div>

              {/* ── Error banner ───────────────────────────────────── */}
              {errors.send && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-xs text-red-600 dark:text-red-400">{errors.send}</p>
                </div>
              )}
            </>
          )}
        </div>
      </ModalBody>

      <ModalFooter className="shrink-0 px-6 sm:px-12 py-5 bg-white dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 w-full max-w-3xl mx-auto">
          <Button variant="outline" onClick={sent ? close : handleCloseAttempt} disabled={sending} className="w-full sm:w-auto min-h-11">
            {sent ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!sent && (
            <Button
              variant="primary"
              onClick={handleSend}
              disabled={sending}
              className="w-full sm:w-auto min-h-11"
            >
              {sending ? 'Enviando...' : (
                <span className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  Enviar correo
                </span>
              )}
            </Button>
          )}
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

export default ExpressEmailModal;
