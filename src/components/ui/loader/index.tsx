import React from "react";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "white" | "gray";
  className?: string;
  label?: string;
}

export const Loader: React.FC<LoaderProps> = ({
  size = "md",
  variant = "primary",
  className = "",
  label = "Cargando...",
}) => {
  const sizeClasses = {
    sm: "size-5 border-2",
    md: "size-8 border-3",
    lg: "size-12 border-4",
  };

  const variantClasses = {
    primary: "border-brand-500 border-t-transparent",
    white: "border-white border-t-transparent",
    gray: "border-gray-200 border-t-transparent dark:border-gray-700",
  };

  return (
    <div
      role="status"
      aria-label={label}
      className={`flex items-center justify-center ${className}`}
    >
      <div
        className={`animate-spin rounded-full ${sizeClasses[size]} ${variantClasses[variant]}`}
      ></div>
      <span className="sr-only">{label}</span>
    </div>
  );
};

export const FullScreenLoader: React.FC<LoaderProps> = (props) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/60 backdrop-blur-sm dark:bg-gray-950/60 animate-fade-in">
      <Loader size="lg" {...props} />
    </div>
  );
};

export const InlineLoader: React.FC<LoaderProps & { text?: string }> = ({
  text,
  ...props
}) => {
  return (
    <div className="flex items-center gap-3">
      <Loader size="sm" {...props} />
      {text && (
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {text}
        </span>
      )}
    </div>
  );
};
