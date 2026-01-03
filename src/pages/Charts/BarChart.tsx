import { useState, useEffect } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import BarChartOne from "../../components/charts/bar/BarChartOne";
import PageMeta from "../../components/common/PageMeta";
import { SkeletonLoader, ChartSkeleton, BreadcrumbSkeleton } from "../../components/ui/skeleton";

export default function BarChart() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div>
      <PageMeta
        title="React.js Chart Dashboard | TailAdmin - React.js Admin Dashboard Template"
        description="This is React.js Chart Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <SkeletonLoader
        isLoading={isLoading}
        id="bar-chart-breadcrumb"
        skeleton={<BreadcrumbSkeleton />}
      >
        <PageBreadcrumb pageTitle="Bar Chart" />
      </SkeletonLoader>

      <div className="space-y-6">
        <ComponentCard title="Bar Chart 1">
          <SkeletonLoader
            isLoading={isLoading}
            id="bar-chart-one"
            skeleton={<ChartSkeleton height={400} />}
          >
            <BarChartOne />
          </SkeletonLoader>
        </ComponentCard>
      </div>
    </div>
  );
}
