import React, { FC } from "react";
import { cn } from "../../../utils/cn";

/**
 * Propiedades para el componente FileInput estandarizado.
 */
export interface FileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Clases adicionales para personalizar el estilo. */
  className?: string;
  /** Función que se ejecuta al seleccionar archivos. */
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Indica si hay un error en la selección del archivo. */
  error?: boolean;
}

/**
 * Componente de entrada de archivos (FileInput) estandarizado.
 * Proporciona un estilo consistente para la selección de archivos con soporte para temas.
 * 
 * @component
 * @example
 * ```tsx
 * <FileInput 
 *   accept="image/*" 
 *   onChange={(e) => handleUpload(e.target.files)} 
 * />
 * ```
 */
const FileInput: FC<FileInputProps> = ({ className, onChange, error, ...props }) => {
  return (
    <input
      type="file"
      className={cn(
        // Clases base
        "h-11 w-full overflow-hidden rounded-lg border text-sm transition-all duration-200 shadow-theme-xs",
        "bg-transparent text-text-tertiary placeholder:text-text-tertiary",
        "focus:outline-hidden focus:ring-3 focus:ring-brand-500/20",
        "dark:bg-bg-dark dark:text-text-emphasis",

        // Estilos del botón (file pseudo-element)
        "file:mr-5 file:h-full file:cursor-pointer file:border-0 file:border-r file:border-solid",
        "file:bg-bg-secondary file:px-4 file:text-sm file:font-medium file:text-text-secondary",
        "file:border-border-light hover:file:bg-bg-main",
        "dark:file:bg-white/5 dark:file:border-border-dark dark:file:text-text-tertiary",

        // Estados
        error ? "border-error-500 focus:border-error-300 focus:ring-error-500/20" : "border-border-medium dark:border-border-dark focus:border-brand-300",
        
        className
      )}
      onChange={onChange}
      aria-invalid={error}
      {...props}
    />
  );
};

export default FileInput;
