import React, { useState, useEffect, useRef } from "react";
import { Tooltip } from "../ui/tooltip/Tooltip";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  disabledReason?: string;
}

interface CustomSelectProps {
  id?: string;
  options: SelectOption[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  defaultValue?: string;
  value?: string;
  disabled?: boolean;
  onBlur?: () => void;
  error?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
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
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string>(value !== undefined ? value : defaultValue);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (isOpen && onBlur) onBlur();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onBlur]);

  const handleSelect = (option: SelectOption) => {
    if (option.disabled || disabled) return;
    
    setSelectedValue(option.value);
    onChange(option.value);
    setIsOpen(false);
  };

  const selectedOption = options.find((opt) => opt.value === selectedValue);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-disabled={disabled}
        className={`h-11 w-full flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm transition-all duration-200 ${
          disabled 
            ? "cursor-not-allowed bg-gray-100 opacity-50 border-border-medium dark:bg-bg-dark/50" 
            : error
              ? "border-error-500 focus:ring-error-500/10"
              : "border-border-medium bg-transparent hover:border-brand-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-border-dark dark:bg-bg-dark"
        } ${
          selectedValue ? "text-text-primary dark:text-text-emphasis" : "text-text-tertiary"
        }`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`h-4 w-4 text-text-tertiary transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && !disabled && (
        <ul
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border-light bg-white py-1 shadow-lg focus:outline-hidden dark:border-border-dark dark:bg-bg-dark"
          role="listbox"
        >
          {options.map((option) => {
            const isOptionDisabled = option.disabled;
            const optionContent = (
              <li
                key={option.value}
                onClick={() => handleSelect(option)}
                aria-disabled={isOptionDisabled}
                role="option"
                aria-selected={selectedValue === option.value}
                className={`relative cursor-pointer select-none px-4 py-2 text-sm transition-colors ${
                  isOptionDisabled
                    ? "cursor-not-allowed bg-[#f5f5f5] text-[#808080] opacity-50 line-through dark:bg-gray-800/50"
                    : selectedValue === option.value
                      ? "bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400"
                      : "text-text-primary hover:bg-gray-50 dark:text-text-emphasis dark:hover:bg-white/5"
                }`}
              >
                {option.label}
              </li>
            );

            if (isOptionDisabled && option.disabledReason) {
              return (
                <Tooltip key={option.value} content={option.disabledReason}>
                  {optionContent}
                </Tooltip>
              );
            }

            return optionContent;
          })}
        </ul>
      )}
    </div>
  );
};

export default CustomSelect;
