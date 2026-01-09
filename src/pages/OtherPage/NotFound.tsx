import GridShape from "../../components/common/GridShape";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";

export default function NotFound() {
  return (
    <>
      <PageMeta
        title="React.js 404 Dashboard | Proyecto-Unefa - React.js Admin Dashboard Template"
        description="This is React.js 404 Dashboard page for Proyecto-Unefa - React.js Tailwind CSS Admin Dashboard Template"
      />
      <div className="relative flex flex-col items-center justify-center min-h-screen p-6 overflow-hidden z-1">
        <GridShape />
        <div className="mx-auto w-full max-w-60.5 text-center sm:max-w-118">
          <h1 className="mb-8 font-bold text-text-primary text-title-md dark:text-text-emphasis xl:text-title-2xl">
            ERROR
          </h1>

          <img src="/images/error/404.svg" alt="404" className="dark:hidden" />
          <img
            src="/images/error/404-dark.svg"
            alt="404"
            className="hidden dark:block"
          />

          <p className="mt-10 mb-6 text-base text-text-secondary dark:text-text-tertiary sm:text-lg">
            We can’t seem to find the page you are looking for!
          </p>

          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg border border-border-medium bg-bg-main px-5 py-3.5 text-sm font-medium text-text-secondary shadow-theme-xs hover:bg-bg-secondary hover:text-text-primary dark:border-border-dark dark:bg-bg-dark dark:text-text-tertiary dark:hover:bg-white/3 dark:hover:text-text-emphasis"
          >
            Back to Home Page
          </Link>
        </div>
        {/* <!-- Footer --> */}
        <p className="absolute text-sm text-center text-text-secondary -translate-x-1/2 bottom-6 left-1/2 dark:text-text-tertiary">
          &copy; {new Date().getFullYear()} - Proyecto-Unefa
        </p>
      </div>
    </>
  );
}
