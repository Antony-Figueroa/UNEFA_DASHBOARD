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
}) => {
  // Manage the selected value
  const [selectedValue, setSelectedValue] = useState<string>(value !== undefined ? value : defaultValue);

  // Sync state if value or defaultValue changes
  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  useEffect(() => {
    if (value === undefined) {
      setSelectedValue(defaultValue);
    }
  }, [defaultValue, value]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedValue(value);
    onChange(value); // Trigger parent handler
  };

  return (
    <div className="relative">
      <select
        id={id}
        disabled={disabled}
        className={`h-11 w-full appearance-none rounded-lg border border-border-medium bg-transparent px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-text-tertiary focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-border-dark dark:bg-bg-dark dark:text-text-emphasis dark:placeholder:text-text-tertiary dark:focus:border-brand-800 ${selectedValue
            ? "text-text-primary dark:text-text-emphasis"
            : "text-text-tertiary dark:text-text-tertiary"
          } ${className}`}
        value={selectedValue}
        onChange={handleChange}
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
      </span>
    </div>
  );
};

export default Select;
