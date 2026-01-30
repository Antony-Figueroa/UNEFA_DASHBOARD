import React, { forwardRef } from 'react';
import Input from '../../form/input/InputField';
import { SearchIcon } from '../../../icons/actions';
import { cn } from '../../../utils/cn';

/**
 * Props for the SearchInput component.
 */
interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Optional callback to clear the input. */
  onClear?: () => void;
}

/**
 * A specialized input component for search functionality.
 * Includes a search icon and consistent styling.
 * 
 * @example
 * ```tsx
 * <SearchInput 
 *   placeholder="Buscar..." 
 *   value={query} 
 *   onChange={(e) => setQuery(e.target.value)} 
 * />
 * ```
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <div className="relative w-full" role="search">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <SearchIcon className="h-4 w-4 text-text-tertiary" aria-hidden="true" />
        </div>
        <Input
          ref={ref}
          className={cn("pl-10", className)}
          type="search"
          {...props}
        />
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";
