import React from "react";
import { Search } from "lucide-react";
import { cn } from "../../utils/cn";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// ponytail: input + icono, sin debounce. El hook maneja eso.
export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = "Buscar...",
  className,
}) => (
  <div className={cn("relative w-full sm:w-64", className)}>
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-border-medium bg-white py-2 pl-10 pr-4 text-sm outline-none transition-all focus:border-brand-500 focus:shadow-focus-ring dark:border-border-dark dark:bg-bg-dark dark:text-white dark:focus:border-brand-300"
    />
  </div>
);

export default SearchInput;
