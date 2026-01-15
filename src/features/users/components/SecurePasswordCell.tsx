import React, { useState } from "react";
import { EyeIcon, EyeCloseIcon, CopyIcon, CheckLineIcon } from "../../../icons";
import { useToast } from "../../../context/toast";

interface SecurePasswordCellProps {
  password?: string;
  onReveal: () => void;
  onHide: () => void;
  isRevealed: boolean;
  isLoading?: boolean;
}

const SecurePasswordCell: React.FC<SecurePasswordCellProps> = ({
  password,
  onReveal,
  onHide,
  isRevealed,
  isLoading = false
}) => {
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    addToast({
      variant: "success",
      title: "Copiado",
      message: "Contraseña copiada al portapapeles"
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 min-w-35">
      <div className="flex-1 font-mono text-xs font-bold bg-bg-secondary dark:bg-white/5 px-2 py-1 rounded border border-border-light dark:border-border-dark min-h-7 flex items-center">
        {isRevealed && password ? (
          <span className="text-brand-600 dark:text-brand-400 animate-fadeIn">
            {password}
          </span>
        ) : (
          <span className="text-text-tertiary tracking-widest">••••••••</span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={isLoading}
          onClick={() => {
            if (isRevealed) {
              onHide();
            } else {
              onReveal();
            }
          }}
          className={`p-1.5 rounded-md transition-colors ${
            isRevealed 
              ? "text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10" 
              : "text-text-tertiary hover:text-text-primary hover:bg-bg-main dark:hover:bg-white/10"
          } ${isLoading ? "opacity-50 cursor-wait" : ""}`}
          title={isRevealed ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-label={isRevealed ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {isRevealed ? (
            <EyeCloseIcon className="w-3.5 h-3.5" />
          ) : (
            <EyeIcon className="w-3.5 h-3.5" />
          )}
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!isRevealed || !password}
          className={`p-1.5 rounded-md transition-colors ${
            isRevealed && password
              ? "text-text-secondary hover:text-text-primary hover:bg-bg-main dark:hover:bg-white/10"
              : "text-text-tertiary cursor-not-allowed opacity-50"
          }`}
          title="Copiar al portapapeles"
          aria-label="Copiar al portapapeles"
        >
          {copied ? (
            <CheckLineIcon className="w-3.5 h-3.5 text-success-500" />
          ) : (
            <CopyIcon className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
};

export default SecurePasswordCell;
