import { useState, useEffect } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import BasicTableOne from "../../components/tables/BasicTables/BasicTableOne";
import { SkeletonLoader, TableSkeleton, BreadcrumbSkeleton } from "../../components/ui/skeleton";

export default function BasicTables() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <PageMeta
        title="React.js Basic Tables Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Basic Tables Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <SkeletonLoader
        isLoading={isLoading}
        id="tables-breadcrumb"
        skeleton={<BreadcrumbSkeleton />}
      >
        <PageBreadcrumb pageTitle="Basic Tables" />
      </SkeletonLoader>

      <div className="space-y-6">
        <ComponentCard title="Basic Table 1">
          <SkeletonLoader
            isLoading={isLoading}
            id="basic-table-one"
            skeleton={<TableSkeleton rows={5} />}
          >
            <BasicTableOne />
          </SkeletonLoader>
        </ComponentCard>
      </div>
    </>
  );
}
