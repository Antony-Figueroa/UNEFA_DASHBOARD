import { useState } from "react";
import { Modal, ModalBody, ModalFooter } from "../modal";
import Button from "../button/Button";
import { BackupRecord, backupService } from "../../../features/backup/services/backupService";

interface RestoreDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
  backup: BackupRecord | null;
  isLoading?: boolean;
}

export const RestoreDialog: React.FC<RestoreDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  backup,
  isLoading = false,
}) => {
  const [step, setStep] = useState<'password' | 'confirm'>('password');
  const [password, setPassword] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleNext = async () => {
    if (step === 'password') {
      if (!password.trim()) {
        return;
      }
      setVerifying(true);
      try {
        const result = await backupService.verifyRestorePassword(password);
        if (result.valid) {
          setStep('confirm');
        } else {
          alert('Contraseña incorrecta');
        }
      } catch (error) {
        console.error('Error verifying password:', error);
        alert('Error al verificar contraseña');
      } finally {
        setVerifying(false);
      }
    } else {
      await onConfirm(password);
      handleClose();
    }
  };

  const handleClose = () => {
    setPassword('');
    setStep('password');
    onClose();
  };

  if (!backup) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-md" size="md">
      <ModalBody className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-500/20">
            <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary dark:text-white">
              {step === 'password' ? 'Verificar Contraseña' : 'Confirmar Restauración'}
            </h3>
            <p className="text-sm text-text-secondary dark:text-text-tertiary">
              {backup.name}
            </p>
          </div>
        </div>

        {step === 'password' ? (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary dark:text-text-tertiary">
              Para restaurar este respaldo, debe ingresar su contraseña de administrador.
            </p>
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-white mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-text-primary dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                autoFocus
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">
                    Esta acción es irreversible
                  </p>
                  <ul className="mt-2 text-xs text-red-600 dark:text-red-400 space-y-1">
                    <li>• Se eliminarán <strong>TODOS</strong> los datos actuales</li>
                    <li>• Se restaurarán los datos del respaldo</li>
                    <li>• Se creará un backup automático antes</li>
                  </ul>
                </div>
              </div>
            </div>
            <p className="text-sm font-medium text-text-primary dark:text-white text-center">
              ¿Está ABSOLUTAMENTE seguro de continuar?
            </p>
          </div>
        )}
      </ModalBody>

      <ModalFooter className="border-t border-gray-200 dark:border-gray-700 p-4 flex gap-3">
        <Button
          variant="outline"
          onClick={handleClose}
          className="flex-1"
          disabled={isLoading || verifying}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleNext}
          className={`flex-1 ${step === 'confirm' ? 'bg-red-600 hover:bg-red-700' : ''}`}
          loading={isLoading || verifying}
          disabled={(step === 'password' && !password.trim()) || isLoading || verifying}
        >
          {verifying ? 'Verificando...' : step === 'password' ? 'Verificar' : 'RESTAURAR'}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default RestoreDialog;
