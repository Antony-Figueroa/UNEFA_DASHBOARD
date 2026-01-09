import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";

export default function Blank() {
  return (
    <div>
      <PageMeta
        title="React.js Blank Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Blank Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Blank Page" />
      <div className="min-h-screen rounded-2xl border border-border-light bg-bg-main px-5 py-7 dark:border-border-dark dark:bg-white/3 xl:px-10 xl:py-12">
        <div className="mx-auto w-full max-w-157.5 text-center">
          <h3 className="mb-4 font-semibold text-text-primary text-theme-xl dark:text-text-emphasis sm:text-2xl">
            Card Title Here
          </h3>

          <p className="text-sm text-text-secondary dark:text-text-tertiary sm:text-base">
            Start putting content on grids or panels, you can also use different
            combinations of grids.Please check out the dashboard and other pages
          </p>
        </div>
      </div>
    </div>
  );
}
