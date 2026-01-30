import { Link } from "react-router";

/**
 * Props for the PageBreadcrumb component.
 */
interface BreadcrumbProps {
  /** The title of the current page. */
  pageTitle: string;
}

/**
 * Standardized breadcrumb component for pages.
 * Displays navigation path and current page title.
 * 
 * @example
 * ```tsx
 * <PageBreadcrumb pageTitle="Users" />
 * ```
 */
const PageBreadcrumb: React.FC<BreadcrumbProps> = ({ pageTitle }) => {
  return (
    <div className="flex flex-col items-start justify-between gap-3 mb-6">
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link
              className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-brand-500 dark:text-text-tertiary dark:hover:text-brand-400 transition-colors"
              to="/"
            >
              Home
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
          <li className="text-sm text-text-emphasis dark:text-text-emphasis font-medium" aria-current="page">
            {pageTitle}
          </li>
        </ol>
      </nav>
      <h2 className="text-xl font-bold text-text-emphasis dark:text-text-emphasis">
        {pageTitle}
      </h2>
    </div>
  );
};

export default PageBreadcrumb;
