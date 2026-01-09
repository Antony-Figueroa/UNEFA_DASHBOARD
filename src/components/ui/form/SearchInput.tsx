import React, { forwardRef } from 'react';
import Input from '../../form/input/InputField';
import { SearchIcon } from '../../../icons/actions';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <SearchIcon className="h-4 w-4 text-text-tertiary" />
        </div>
        <Input
          ref={ref}
          className={`pl-10 ${className}`}
          {...props}
        />
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";
