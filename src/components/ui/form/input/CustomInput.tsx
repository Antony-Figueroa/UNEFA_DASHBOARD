import React, { forwardRef } from 'react';
import InputField, { type InputProps } from '../../../form/input/InputField';

interface CustomInputProps extends Omit<InputProps, 'error'> {
  label?: string;
  error?: string;
}

const CustomInput = forwardRef<HTMLInputElement, CustomInputProps>(
  ({ label, error, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-text-primary dark:text-white/90">
            {label}
          </label>
        )}
        <InputField
          ref={ref}
          error={!!error}
          hint={error}
          {...props}
        />
      </div>
    );
  }
);

CustomInput.displayName = 'CustomInput';

export default CustomInput;
