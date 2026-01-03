import { useState, useEffect } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import LineChartOne from "../../components/charts/line/LineChartOne";
import PageMeta from "../../components/common/PageMeta";
import { SkeletonLoader, ChartSkeleton, BreadcrumbSkeleton } from "../../components/ui/skeleton";

export default function LineChart() {
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
        title="React.js Chart Dashboard | TailAdmin - React.js Admin Dashboard Template"
        description="This is React.js Chart Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <SkeletonLoader
        isLoading={isLoading}
        id="line-chart-breadcrumb"
        skeleton={<BreadcrumbSkeleton />}
      >
        <PageBreadcrumb pageTitle="Line Chart" />
      </SkeletonLoader>

      <div className="space-y-6">
        <ComponentCard title="Line Chart 1">
          <SkeletonLoader
            isLoading={isLoading}
            id="line-chart-one"
            skeleton={<ChartSkeleton height={400} />}
          >
            <LineChartOne />
          </SkeletonLoader>
        </ComponentCard>
      </div>
    </>
  );
}
