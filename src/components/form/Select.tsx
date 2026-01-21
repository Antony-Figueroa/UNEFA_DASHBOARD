import { useState, useEffect } from "react";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  id?: string;
  options: Option[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  defaultValue?: string;
  value?: string;
  disabled?: boolean;
  onBlur?: () => void;
  error?: boolean;
  isLoading?: boolean;
}

const Select: React.FC<SelectProps> = ({
  id,
  options,
  placeholder = "Seleccione una opción",
  onChange,
  className = "",
  defaultValue = "",
  value,
  disabled = false,
  onBlur,
  error = false,
  isLoading = false,
}) => {
  // Sync state if value or defaultValue changes
  const [selectedValue, setSelectedValue] = useState<string>(value !== undefined ? value : defaultValue);

  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  useEffect(() => {
    if (value === undefined && defaultValue !== undefined) {
      setSelectedValue(defaultValue);
    }
  }, [defaultValue, value]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    setSelectedValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="relative">
      <select
        id={id}
        disabled={disabled}
        className={`h-11 w-full appearance-none rounded-lg border bg-transparent px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-text-tertiary focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:bg-gray-100 disabled:opacity-70 disabled:cursor-not-allowed dark:bg-bg-dark dark:text-text-emphasis dark:placeholder:text-text-tertiary dark:disabled:bg-white/5 ${
          error 
            ? "border-error-500 focus:border-error-500 focus:ring-error-500/10 dark:border-error-800" 
            : "border-border-medium focus:border-brand-300 dark:border-border-dark dark:focus:border-brand-800"
        } ${selectedValue
            ? "text-text-primary dark:text-text-emphasis"
            : "text-text-tertiary dark:text-text-tertiary"
          } ${className}`}
        value={selectedValue}
        onChange={handleChange}
        onBlur={onBlur}
      >
        {/* Placeholder option */}
        <option
          value=""
          className="text-text-secondary dark:bg-bg-dark dark:text-text-tertiary"
        >
          {placeholder}
        </option>
        {/* Map over options */}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className="text-text-secondary dark:bg-bg-dark dark:text-text-tertiary"
          >
            {option.label}
          </option>
        ))}
      </select>
      <span className="absolute top-1/2 right-4 -translate-y-1/2 pointer-events-none text-text-tertiary dark:text-text-tertiary">
        {isLoading ? (
          <svg
            className="h-4 w-4 animate-spin text-brand-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        ) : (
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        )}
      </span>
    </div>
  );
};

export default Select;
