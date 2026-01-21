import type React from "react";

interface CheckboxProps {
  label?: string;
  checked: boolean;
  className?: string;
  id?: string;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked,
  id,
  onChange,
  className = "",
  disabled = false,
  ariaLabel,
}) => {
  return (
    <label
      className={`flex items-center space-x-3 group ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
        }`}
    >
      <div className="relative w-5 h-5">
        <input
          id={id}
          type="checkbox"
          className={`w-5 h-5 appearance-none cursor-pointer dark:border-border-dark border border-border-medium checked:border-transparent rounded-md checked:bg-brand-500 disabled:opacity-60 
          ${className}`}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          aria-label={ariaLabel}
        />
        {checked && (
          <svg
            className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none top-1/2 left-1/2"
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
          >
            <path
              d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
              stroke="white"
              strokeWidth="1.94437"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {disabled && (
          <svg
            className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none top-1/2 left-1/2"
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
          >
            <path
              d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
              stroke="currentColor"
              className="text-border-light dark:text-border-dark"
              strokeWidth="2.33333"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      {label && (
        <span className="text-sm font-medium text-text-primary dark:text-text-secondary">
          {label}
        </span>
      )}
    </label>
  );
};

export default Checkbox;
