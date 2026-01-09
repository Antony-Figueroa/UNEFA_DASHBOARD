import React, { forwardRef, useEffect, useRef, useCallback } from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  hint?: string;
  autoResize?: boolean;
}

const TextArea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className = "",
      disabled = false,
      error = false,
      hint = "",
      rows = 3,
      autoResize = true,
      onChange,
      ...props
    },
    ref
  ) => {
    const internalRef = useRef<HTMLTextAreaElement | null>(null);

    // Combinar refs
    const setRefs = (node: HTMLTextAreaElement | null) => {
      internalRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    const adjustHeight = useCallback(() => {
      const textarea = internalRef.current;
      if (textarea && autoResize) {
        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    }, [autoResize]);

    useEffect(() => {
      if (autoResize) {
        adjustHeight();
      }
    }, [props.value, autoResize, adjustHeight]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (autoResize) {
        adjustHeight();
      }
      if (onChange) {
        onChange(e);
      }
    };

    let textareaClasses = `w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden transition-all duration-200 ease-in-out resize-none ${className} `;

    if (disabled) {
      textareaClasses += ` bg-bg-secondary opacity-50 text-text-tertiary border-border-medium cursor-not-allowed dark:bg-white/5 dark:text-text-tertiary dark:border-border-dark`;
    } else if (error) {
      textareaClasses += ` bg-transparent border-error-500 focus:border-error-300 focus:ring-3 focus:ring-error-500/10 dark:border-error-500 dark:bg-bg-dark dark:text-text-emphasis dark:focus:border-error-800`;
    } else {
      textareaClasses += ` bg-transparent text-text-primary dark:text-text-secondary border-border-medium focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-border-dark dark:bg-bg-dark dark:text-text-emphasis dark:focus:border-brand-800`;
    }

    return (
      <div className="relative">
        <textarea
          {...props}
          ref={setRefs}
          rows={rows}
          onChange={handleChange}
          disabled={disabled}
          className={textareaClasses}
        />
        {hint && (
          <p
            className={`mt-1.5 text-xs ${
              error ? "text-error-500" : "text-text-tertiary dark:text-text-tertiary"
            }`}
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);

TextArea.displayName = "TextArea";

export default TextArea;
