import { Link } from "react-router";
import { CATEGORY_COLORS, type Category } from "../../../constants/designSystem";

interface AlertProps {
  variant?: "success" | "error" | "warning" | "info"; // Alert type
  category?: Category; // Optional category for specialized styling
  title: string; // Title of the alert
  message?: React.ReactNode; // Message of the alert
  showLink?: boolean; // Whether to show the "Learn More" link
  linkHref?: string; // Link URL
  linkText?: string; // Link text
  timestamp?: Date; // Time of the alert
  onClose?: () => void; // Close callback
  actions?: React.ReactNode; // Custom action buttons
}

const Alert: React.FC<AlertProps> = ({
  variant = "info",
  category,
  title,
  message,
  showLink = false,
  linkHref = "#",
  linkText = "Learn more",
  timestamp,
  onClose,
  actions,
}) => {
  // Tailwind classes for each variant
  const variantClasses = {
    success: {
      container: "border-alert-success-border bg-alert-success-bg dark:border-success-700 dark:bg-success-950",
      icon: "text-alert-success-text dark:text-success-400",
    },
    error: {
      container: "border-alert-error-border bg-alert-error-bg dark:border-error-700 dark:bg-error-950",
      icon: "text-alert-error-text dark:text-error-400",
    },
    warning: {
      container: "border-alert-warning-border bg-alert-warning-bg dark:border-warning-700 dark:bg-warning-950",
      icon: "text-alert-warning-text dark:text-warning-400",
    },
    info: {
      container: "border-alert-info-border bg-alert-info-bg dark:border-blue-light-700 dark:bg-blue-light-950",
      icon: "text-alert-info-text dark:text-blue-light-400",
    },
  };

  // Specialized category classes (only if variant is not success, per restoration requirements)
  const categoryClasses = (category && variant !== "success") ? {
    container: `${CATEGORY_COLORS[category].border} ${CATEGORY_COLORS[category].bg} ${CATEGORY_COLORS[category].darkBorder} ${CATEGORY_COLORS[category].darkBg}`,
    icon: `${CATEGORY_COLORS[category].text} ${CATEGORY_COLORS[category].darkText}`,
  } : null;

  // Use category classes if available, otherwise fallback to variant
  // Success variant always uses green solid colors per restoration requirements
  const activeClasses = categoryClasses || variantClasses[variant];

  // Icons mapping
  const icons = {
    success: (
      <svg className="fill-current" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M3.70186 12.0001C3.70186 7.41711 7.41711 3.70186 12.0001 3.70186C16.5831 3.70186 20.2984 7.41711 20.2984 12.0001C20.2984 16.5831 16.5831 20.2984 12.0001 20.2984C7.41711 20.2984 3.70186 16.5831 3.70186 12.0001ZM12.0001 1.90186C6.423 1.90186 1.90186 6.423 1.90186 12.0001C1.90186 17.5772 6.423 22.0984 12.0001 22.0984C17.5772 22.0984 22.0984 17.5772 22.0984 12.0001C22.0984 6.423 17.5772 1.90186 12.0001 1.90186ZM15.6197 10.7395C15.9712 10.388 15.9712 9.81819 15.6197 9.46672C15.2683 9.11525 14.6984 9.11525 14.347 9.46672L11.1894 12.6243L9.6533 11.0883C9.30183 10.7368 8.73198 10.7368 8.38051 11.0883C8.02904 11.4397 8.02904 12.0096 8.38051 12.3611L10.553 14.5335C10.7217 14.7023 10.9507 14.7971 11.1894 14.7971C11.428 14.7971 11.657 14.7023 11.8257 14.5335L15.6197 10.7395Z" />
      </svg>
    ),
    error: (
      <svg className="fill-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M20.3499 12.0004C20.3499 16.612 16.6115 20.3504 11.9999 20.3504C7.38832 20.3504 3.6499 16.612 3.6499 12.0004C3.6499 7.38881 7.38833 3.65039 11.9999 3.65039C16.6115 3.65039 20.3499 7.38881 20.3499 12.0004ZM11.9999 22.1504C17.6056 22.1504 22.1499 17.6061 22.1499 12.0004C22.1499 6.3947 17.6056 1.85039 11.9999 1.85039C6.39421 1.85039 1.8499 6.3947 1.8499 12.0004C1.8499 17.6061 6.39421 22.1504 11.9999 22.1504ZM13.0008 16.4753C13.0008 15.923 12.5531 15.4753 12.0008 15.4753L11.9998 15.4753C11.4475 15.4753 10.9998 15.923 10.9998 16.4753C10.9998 17.0276 11.4475 17.4753 11.9998 17.4753L12.0008 17.4753C12.5531 17.4753 13.0008 17.0276 13.0008 16.4753ZM11.9998 6.62898C12.414 6.62898 12.7498 6.96476 12.7498 7.37898L12.7498 13.0555C12.7498 13.4697 12.414 13.8055 11.9998 13.8055C11.5856 13.8055 11.2498 13.4697 11.2498 13.0555L11.2498 7.37898C11.2498 6.96476 11.5856 6.62898 11.9998 6.62898Z" />
      </svg>
    ),
    warning: (
      <svg className="fill-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M3.6501 12.0001C3.6501 7.38852 7.38852 3.6501 12.0001 3.6501C16.6117 3.6501 20.3501 7.38852 20.3501 12.0001C20.3501 16.6117 16.6117 20.3501 12.0001 20.3501C7.38852 20.3501 3.6501 16.6117 3.6501 12.0001ZM12.0001 1.8501C6.39441 1.8501 1.8501 6.39441 1.8501 12.0001C1.8501 17.6058 6.39441 22.1501 12.0001 22.1501C17.6058 22.1501 22.1501 17.6058 22.1501 12.0001C22.1501 6.39441 17.6058 1.8501 12.0001 1.8501ZM10.9992 7.52517C10.9992 8.07746 11.4469 8.52517 11.9992 8.52517H12.0002C12.5525 8.52517 13.0002 8.07746 13.0002 7.52517C13.0002 6.97289 12.5525 6.52517 12.0002 6.52517H11.9992C11.4469 6.52517 10.9992 6.97289 10.9992 7.52517ZM12.0002 17.3715C11.586 17.3715 11.2502 17.0357 11.2502 16.6215V10.945C11.2502 10.5303 11.586 10.195 12.0002 10.195C12.4144 10.195 12.7502 10.5308 12.7502 10.945V16.6215C12.7502 17.0357 12.4144 17.3715 12.0002 17.3715Z" />
      </svg>
    ),
    info: (
      <svg className="fill-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M3.6501 11.9996C3.6501 7.38803 7.38852 3.64961 12.0001 3.64961C16.6117 3.64961 20.3501 7.38803 20.3501 11.9996C20.3501 16.6112 16.6117 20.3496 12.0001 20.3496C7.38852 20.3496 3.6501 16.6112 3.6501 11.9996ZM12.0001 1.84961C6.39441 1.84961 1.8501 6.39392 1.8501 11.9996C1.8501 17.6053 6.39441 22.1496 12.0001 22.1496C17.6058 22.1496 22.1501 17.6053 22.1501 11.9996C22.1501 6.39392 17.6058 1.84961 12.0001 1.84961ZM10.9992 7.52468C10.9992 8.07697 11.4469 8.52468 11.9992 8.52468H12.0002C12.5525 8.52468 13.0002 8.07697 13.0002 7.52468C13.0002 6.9724 12.5525 6.52468 12.0002 6.52468H11.9992C11.4469 6.52468 10.9992 6.9724 10.9992 7.52468ZM12.0002 17.371C11.586 17.371 11.2502 17.0352 11.2502 16.621V10.9445C11.2502 10.5303 11.586 10.1945 12.0002 10.1945C12.4144 10.1945 12.7502 10.5303 12.7502 10.9445V16.621C12.7502 17.0352 12.4144 17.371 12.0002 17.371Z" />
      </svg>
    ),
  };

  // Category icons mapping
  const categoryIcons: Record<Category, React.ReactNode> = {
    ESTUDIANTE: (
      <svg className="fill-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 6C13.66 6 15 7.34 15 9C15 10.66 13.66 12 12 12C10.34 12 9 10.66 9 9C9 7.34 10.34 6 12 6ZM12 20C9.5 20 7.29 18.78 6 16.91C6.03 14.91 10 13.8 12 13.8C13.99 13.8 17.97 14.91 18 16.91C16.71 18.78 14.5 20 12 20Z" />
      </svg>
    ),
  };

  const activeIcon = category ? categoryIcons[category] : icons[variant];

  return (
    <div
      className={`relative rounded-xl border p-4 shadow-lg transition-all duration-300 animate-fadeIn overflow-hidden ${activeClasses.container}`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 shrink-0 ${activeClasses.icon}`}>
          {activeIcon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 mb-1">
            <h4 className="text-sm font-bold text-text-emphasis dark:text-text-emphasis truncate">
              {title}
            </h4>
            {timestamp && (
              <span className="text-[10px] text-text-tertiary dark:text-text-tertiary font-medium whitespace-nowrap">
                {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          <div className="text-sm text-text-secondary dark:text-text-tertiary wrap-break-word leading-relaxed">
            {message}
          </div>

          {(showLink || actions) && (
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              {showLink && (
                <Link
                  to={linkHref}
                  className="text-sm font-medium text-text-secondary underline hover:text-text-emphasis dark:text-text-tertiary dark:hover:text-text-emphasis"
                >
                  {linkText}
                </Link>
              )}
              {actions}
            </div>
          )}
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="shrink-0 -mr-1 -mt-1 p-1.5 text-text-tertiary hover:text-text-emphasis dark:hover:text-text-emphasis transition-colors rounded-lg hover:bg-bg-secondary dark:hover:bg-white/10"
            aria-label="Cerrar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;
