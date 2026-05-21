import { useLocation, Link } from "react-router";
import { usePageTitle } from "../../hooks/usePageTitle";

/**
 * Props for the PageBreadcrumb component.
 * If pageTitle is provided, it takes priority over the global title.
 */
interface BreadcrumbProps {
  /** The title of the current page. If not provided, uses global title from context. */
  pageTitle?: string;
  /** Optional: Custom parent path for pages that need it */
  parentPath?: string;
}

/**
 * Global breadcrumb component for all pages.
 * Uses route-based navigation and optionally a global title set via usePageTitle.
 * 
 * @example
 * ```tsx
 * // With global title (recommended - no prop needed)
 * <PageBreadcrumb />
 * 
 * // With explicit title (for custom naming)
 * <PageBreadcrumb pageTitle="Mis Estudiantes" />
 * ```
 */
const PageBreadcrumb: React.FC<BreadcrumbProps> = ({ pageTitle: propTitle, parentPath }) => {
  const location = useLocation();
  const { pageTitle: globalTitle } = usePageTitle();
  
  // Use prop title if provided, otherwise use global title
  const displayTitle = propTitle || globalTitle;
  
  // Generate parent breadcrumb based on current path
  const getParentBreadcrumb = () => {
    const path = location.pathname;
    
    // Define parent routes
    if (path.startsWith('/configure/')) {
      return { label: 'Configuración', path: '/configure/users' };
    }
    if (path.startsWith('/tutor/')) {
      return { label: 'Panel de Tutor', path: '/tutor' };
    }
    if (path.startsWith('/student/')) {
      return { label: 'Panel de Estudiante', path: '/student' };
    }
    if (path.startsWith('/visit-registration/') || path.startsWith('/activity-logs/')) {
      return { label: 'Seguimiento', path: '/tracking' };
    }
    
    return null;
  };
  
  const parentBreadcrumb = parentPath 
    ? { label: parentPath.split('/').pop() || '', path: parentPath }
    : getParentBreadcrumb();

  // Don't render breadcrumb on dashboard (home)
  const currentPath = location.pathname;
  if (currentPath === '/dashboard' || currentPath === '/') {
    return null;
  }

  return (
    <div className="flex flex-col items-start justify-between gap-3 mb-6">
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link
              className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-brand-500 dark:text-text-tertiary dark:hover:text-brand-400 transition-colors"
              to="/dashboard"
            >
              Dashboard
              <svg
                className="stroke-current"
                width="17"
                height="16"
                viewBox="0 0 17 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </li>
          
          {/* Parent breadcrumb if exists */}
          {parentBreadcrumb && parentBreadcrumb.label && (
            <li>
              <Link
                className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-brand-500 dark:text-text-tertiary dark:hover:text-brand-400 transition-colors"
                to={parentBreadcrumb.path}
              >
                {parentBreadcrumb.label}
                <svg
                  className="stroke-current"
                  width="17"
                  height="16"
                  viewBox="0 0 17 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </li>
          )}
          
          {/* Current page */}
          <li className="text-sm text-text-emphasis dark:text-text-emphasis font-medium" aria-current="page">
            {displayTitle}
          </li>
        </ol>
      </nav>
      <h2 className="text-xl font-bold text-text-emphasis dark:text-text-emphasis">
        {displayTitle}
      </h2>
    </div>
  );
};

export default PageBreadcrumb;