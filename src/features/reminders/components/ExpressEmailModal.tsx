/**
 * @file ExpressEmailModal.tsx
 * @description Modal para envío de correo express masivo.
 * Permite seleccionar destinatarios por grupo y/o usuarios específicos,
 * redactar el mensaje y enviarlo en el momento.
 */

import { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../components/ui/modal';
import Button from '../../../components/ui/button/Button';
import RecipientSelector, { RecipientSelection } from './RecipientSelector';
import { MailIcon } from '../../../icons/actions';
import apiClient from '../../../api/apiClient';

// ─── Props ────────────────────────────────────────────────────────────────

interface ExpressEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Component ──────────────────────────────────────────────────────────

export const ExpressEmailModal = ({ isOpen, onClose }: ExpressEmailModalProps) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [recipients, setRecipients] = useState<RecipientSelection>({ roles: [], users: [] });
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!subject.trim()) errs.subject = 'El asunto es obligatorio.';
    if (!message.trim()) errs.message = 'El mensaje es obligatorio.';
    if (recipients.roles.length === 0 && recipients.users.length === 0) {
      errs.recipients = 'Seleccioná al menos un destinatario.';
    }
    return errs;
  };

  const handleSend = async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSending(true);
    try {
      // Enviar a backend endpoint (a implementar)
      await apiClient.post('/notifications/express-email', {
        subject,
        message,
        recipients,
      });
      setSent(true);
    } catch (err) {
      setErrors({ send: 'Error al enviar. Intentá de nuevo.' });
      console.error('[ExpressEmail] Error:', err);
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    if (sent) {
      setSubject('');
      setMessage('');
      setRecipients({ roles: [], users: [] });
      setErrors({});
      setSent(false);
    }
    onClose();
  };

  const totalRecipients = recipients.roles.length + recipients.users.length;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} showCloseButton size="2xl">
      <ModalHeader>
        <div className="max-w-3xl mx-auto w-full">
          <span className="mb-1 font-semibold text-text-primary modal-title text-theme-xl dark:text-white/90 lg:text-2xl flex items-center gap-2">
            <MailIcon className="w-5 h-5 text-brand-500" />
            Correo Express Masivo
          </span>
          <p className="text-sm text-text-secondary dark:text-text-tertiary font-normal">
            Enviá un correo en este mismo momento a grupos y/o usuarios específicos.
          </p>
        </div>
      </ModalHeader>

      <ModalBody className="bg-gray-50/50 dark:bg-gray-900/30">
        <div className="max-w-3xl mx-auto space-y-6">
          {sent ? (
            /* Success state */
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 dark:text-green-400">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Correo enviado</h3>
              <p className="text-sm text-gray-500 mt-1">
                El mensaje fue enviado a {totalRecipients > 0 ? `${totalRecipients} destinatario(s)` : 'los destinatarios seleccionados'}.
              </p>
            </div>
          ) : (
            <>
              {/* Subject */}
              <div className="bg-white dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Asunto y mensaje</h3>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Asunto *</label>
                  <input
                    type="text"
                    className={`w-full rounded-lg border ${errors.subject ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-gray-400`}
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="Ej: 📢 Aviso importante - SIGP UNEFA"
                  />
                  {errors.subject && <p className="mt-1 text-[11px] text-red-500">{errors.subject}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Mensaje *</label>
                  <textarea
                    className={`w-full rounded-lg border ${errors.message ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all min-h-[120px] placeholder:text-gray-400 resize-y`}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Escribí el contenido del correo..."
                    rows={5}
                  />
                  {errors.message && <p className="mt-1 text-[11px] text-red-500">{errors.message}</p>}
                </div>
              </div>

              {/* Recipients */}
              <div className="bg-white dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                <RecipientSelector
                  value={recipients}
                  onChange={setRecipients}
                  title="Destinatarios"
                  description="Seleccioná los grupos y/o usuarios a los que querés enviar el correo."
                />
                {errors.recipients && <p className="text-[11px] text-red-500">{errors.recipients}</p>}
              </div>

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
          <Button variant="outline" onClick={handleClose} disabled={sending} className="w-full sm:w-auto min-h-11">
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
  );
};

export default ExpressEmailModal;
