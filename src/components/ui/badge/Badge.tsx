type BadgeVariant = "light" | "solid" | "outline";
type BadgeSize = "sm" | "md";
type BadgeShape = "full" | "rounded";
type BadgeColor =
  | "primary"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "light"
  | "dark";

interface BadgeProps {
  variant?: BadgeVariant; // Light, solid, or outline variant
  size?: BadgeSize; // Badge size
  shape?: BadgeShape; // Badge shape: full (default) or rounded
  color?: BadgeColor; // Badge color
  startIcon?: React.ReactNode; // Icon at the start
  endIcon?: React.ReactNode; // Icon at the end
  children: React.ReactNode; // Badge content
  className?: string; // Additional classes
}

const Badge: React.FC<BadgeProps> = ({
  variant = "light",
  color = "primary",
  size = "md",
  shape = "full",
  startIcon,
  endIcon,
  children,
  className = "",
}) => {
  const baseStyles =
    "inline-flex items-center px-3 py-1 justify-center gap-1 font-bold uppercase tracking-wider transition-all duration-200";

  // Define size styles
  const sizeStyles = {
    sm: "text-[10px]", // Smaller padding and font size
    md: "text-xs", // Default padding and font size
  };

  // Define shape styles
  const shapeStyles = {
    full: "rounded-full",
    rounded: "rounded-lg border",
  };

  // Define color styles for variants
  const variants = {
    light: {
      primary:
        "bg-brand-50 text-brand-500 border-brand-200 dark:bg-brand-500/15 dark:text-brand-400 dark:border-brand-500/20",
      success:
        "bg-success-50 text-success-600 border-success-200 dark:bg-success-500/15 dark:text-success-500 dark:border-success-500/20",
      error:
        "bg-error-50 text-error-600 border-error-200 dark:bg-error-500/15 dark:text-error-500 dark:border-error-500/20",
      warning:
        "bg-warning-50 text-warning-600 border-warning-200 dark:bg-warning-500/15 dark:text-orange-400 dark:border-warning-500/20",
      info: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
      light: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-white/5 dark:text-white/80 dark:border-white/10",
      dark: "bg-gray-500 text-white border-gray-600 dark:bg-white/5 dark:text-white dark:border-white/20",
    },
    solid: {
      primary: "bg-brand-500 text-white border-transparent dark:text-white",
      success: "bg-success-500 text-white border-transparent dark:text-white",
      error: "bg-error-500 text-white border-transparent dark:text-white",
      warning: "bg-warning-500 text-white border-transparent dark:text-white",
      info: "bg-blue-600 text-white border-transparent dark:text-white",
      light: "bg-gray-400 border-transparent dark:bg-white/5 text-white dark:text-white/80",
      dark: "bg-gray-700 text-white border-transparent dark:text-white",
    },
    outline: {
      primary: "bg-transparent text-brand-500 border-brand-500 dark:text-brand-400 dark:border-brand-400",
      success: "bg-transparent text-success-600 border-success-600 dark:text-success-500 dark:border-success-500",
      error: "bg-transparent text-error-600 border-error-600 dark:text-error-500 dark:border-error-500",
      warning: "bg-transparent text-warning-600 border-warning-600 dark:text-orange-400 dark:border-orange-400",
      info: "bg-transparent text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400",
      light: "bg-transparent text-gray-700 border-gray-400 dark:text-white/80 dark:border-white/40",
      dark: "bg-transparent text-gray-700 border-gray-700 dark:text-white dark:border-white/80",
    },
  };

  // Runtime safety: guard against invalid variant/color values
  const allowedVariants: BadgeVariant[] = ["light", "solid", "outline"];
  const allowedColors: BadgeColor[] = [
    "primary",
    "success",
    "error",
    "warning",
    "info",
    "light",
    "dark",
  ];
  const allowedShapes: BadgeShape[] = ["full", "rounded"];

  const safeVariant = allowedVariants.includes(variant) ? variant : "light";
  const safeColor = allowedColors.includes(color) ? color : "primary";
  const safeShape = allowedShapes.includes(shape) ? shape : "full";

  if (import.meta.env.MODE !== "production") {
    if (!allowedVariants.includes(variant)) {
      console.warn(
        `[Badge] Invalid variant "${variant}". Falling back to "light".`,
      );
    }
    if (!allowedColors.includes(color)) {
      console.warn(
        `[Badge] Invalid color "${color}". Falling back to "primary".`,
      );
    }
  }

  // Get styles based on size and color variant
  const sizeClass = sizeStyles[size];
  const colorStyles = variants[safeVariant][safeColor];
  const shapeClass = shapeStyles[safeShape];

  return (
    <span className={`${baseStyles} ${sizeClass} ${colorStyles} ${shapeClass} ${className}`}>
      {startIcon && <span className="mr-1">{startIcon}</span>}
      {children}
      {endIcon && <span className="ml-1">{endIcon}</span>}
    </span>
  );
};

export default Badge;
