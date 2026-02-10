import { useState, forwardRef } from "react";
import { cn } from "../../../utils/cn";
import { ChevronDownIcon } from "../../../icons";

/**
 * Interfaz para los códigos de país del PhoneInput.
 */
export interface CountryCode {
  /** Código del país (ej. "VE"). */
  code: string;
  /** Prefijo telefónico (ej. "+58"). */
  label: string;
}

/**
 * Propiedades para el componente PhoneInput.
 */
export interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  /** Lista de países y sus prefijos. */
  countries: CountryCode[];
  /** Texto de marcador de posición para el número. */
  placeholder?: string;
  /** Función que se llama cuando cambia el número completo. */
  onChange?: (phoneNumber: string) => void;
  /** Posición del selector de país (inicio o fin del input). */
  selectPosition?: "start" | "end";
}

/**
 * Componente de entrada de teléfono (PhoneInput) con selector de país.
 * Combina un selector de prefijo internacional con un campo de texto para el número local.
 * 
 * @component
 * @example
 * ```tsx
 * <PhoneInput 
 *   countries={[{ code: 'VE', label: '+58' }, { code: 'US', label: '+1' }]} 
 *   onChange={(val) => console.log(val)} 
 * />
 * ```
 */
const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(({
  countries,
  placeholder = "+1 (555) 000-0000",
  onChange,
  selectPosition = "start",
  className = "",
  ...props
}, ref) => {
  const [selectedCountry, setSelectedCountry] = useState<string>(countries[0]?.code || "US");
  const [phoneNumber, setPhoneNumber] = useState<string>(countries[0]?.label || "+1");

  /**
   * Mapeo de códigos a etiquetas para búsqueda rápida.
   */
  const countryCodes: Record<string, string> = countries.reduce(
    (acc, { code, label }) => ({ ...acc, [code]: label }),
    {}
  );

  /**
   * Maneja el cambio de país seleccionado.
   * @param e - Evento de cambio del select.
   */
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountry = e.target.value;
    const prefix = countryCodes[newCountry];
    setSelectedCountry(newCountry);
    setPhoneNumber(prefix);
    if (onChange) {
      onChange(prefix);
    }
  };

  /**
   * Maneja el cambio manual del número de teléfono.
   * @param e - Evento de cambio del input.
   */
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPhoneNumber = e.target.value;
    setPhoneNumber(newPhoneNumber);
    if (onChange) {
      onChange(newPhoneNumber);
    }
  };

  const selectClasses = cn(
    "appearance-none bg-transparent py-3 pl-3.5 pr-9 leading-tight text-text-secondary outline-none transition-all",
    "focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10",
    "dark:text-text-tertiary",
    selectPosition === "start" ? "rounded-l-lg border-r border-border-light dark:border-border-dark" : "rounded-r-lg border-l border-border-light dark:border-border-dark"
  );

  const inputClasses = cn(
    "h-11 w-full rounded-lg border border-border-medium bg-transparent py-3 px-4 text-sm text-text-primary shadow-theme-xs outline-none transition-all",
    "placeholder:text-text-tertiary focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10",
    "dark:border-border-dark dark:bg-bg-dark dark:text-text-emphasis dark:placeholder:text-text-tertiary dark:focus:border-brand-800",
    selectPosition === "start" ? "pl-24" : "pr-24",
    className
  );

  return (
    <div className="relative flex w-full">
      {/* Selector de País: Inicio */}
      {selectPosition === "start" && (
        <div className="absolute left-0 z-10 h-full flex items-center">
          <select
            value={selectedCountry}
            onChange={handleCountryChange}
            className={selectClasses}
          >
            {countries.map((country) => (
              <option
                key={country.code}
                value={country.code}
                className="text-text-secondary dark:bg-bg-dark dark:text-text-tertiary"
              >
                {country.code}
              </option>
            ))}
          </select>
          <div className="absolute right-2.5 pointer-events-none text-text-tertiary dark:text-text-tertiary">
            <ChevronDownIcon className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* Campo de Entrada */}
      <input
        {...props}
        ref={ref}
        type="tel"
        value={phoneNumber}
        onChange={handlePhoneNumberChange}
        placeholder={placeholder}
        className={inputClasses}
      />

      {/* Selector de País: Fin */}
      {selectPosition === "end" && (
        <div className="absolute right-0 z-10 h-full flex items-center">
          <select
            value={selectedCountry}
            onChange={handleCountryChange}
            className={selectClasses}
          >
            {countries.map((country) => (
              <option
                key={country.code}
                value={country.code}
                className="text-text-secondary dark:bg-bg-dark dark:text-text-tertiary"
              >
                {country.code}
              </option>
            ))}
          </select>
          <div className="absolute right-2.5 pointer-events-none text-text-tertiary dark:text-text-tertiary">
            <ChevronDownIcon className="w-4 h-4" />
          </div>
        </div>
      )}
    </div>
  );
});

PhoneInput.displayName = "PhoneInput";

export default PhoneInput;
