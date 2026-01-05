import { useState, useEffect } from "react";
import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";
import StatisticsChart from "../../components/ecommerce/StatisticsChart";
import MonthlyTarget from "../../components/ecommerce/MonthlyTarget";
import RecentOrders from "../../components/ecommerce/RecentOrders";
import DemographicCard from "../../components/ecommerce/DemographicCard";
import PageMeta from "../../components/common/PageMeta";
import { SkeletonLoader, MetricsSkeleton, ChartSkeleton, TableSkeleton } from "../../components/ui/skeleton";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulamos carga de datos del dashboard
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500); // 1.5s de carga para que se note el skeleton
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <PageMeta
        title="React.js Ecommerce Dashboard | Proyecto-Unefa - React.js Admin Dashboard Template"
        description="This is React.js Ecommerce Dashboard page for Proyecto-Unefa - React.js Tailwind CSS Admin Dashboard Template"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6 stagger-delay">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <SkeletonLoader
            isLoading={isLoading}
            id="home-metrics"
            skeleton={<MetricsSkeleton />}
          >
            <EcommerceMetrics />
          </SkeletonLoader>

          <SkeletonLoader
            isLoading={isLoading}
            id="home-monthly-sales"
            skeleton={<ChartSkeleton height={300} />}
          >
            <MonthlySalesChart />
          </SkeletonLoader>
        </div>

        <div className="col-span-12 xl:col-span-5">
          <SkeletonLoader
            isLoading={isLoading}
            id="home-monthly-target"
            skeleton={<ChartSkeleton height={420} />}
          >
            <MonthlyTarget />
          </SkeletonLoader>
        </div>

        <div className="col-span-12">
          <SkeletonLoader
            isLoading={isLoading}
            id="home-statistics"
            skeleton={<ChartSkeleton height={400} />}
          >
            <StatisticsChart />
          </SkeletonLoader>
        </div>

        <div className="col-span-12 xl:col-span-5">
          <SkeletonLoader
            isLoading={isLoading}
            id="home-demographic"
            skeleton={<ChartSkeleton height={400} />}
          >
            <DemographicCard />
          </SkeletonLoader>
        </div>

        <div className="col-span-12 xl:col-span-7">
          <SkeletonLoader
            isLoading={isLoading}
            id="home-recent-orders"
            skeleton={<TableSkeleton rows={6} />}
          >
            <RecentOrders />
          </SkeletonLoader>
        </div>
      </div>
    </>
  );
}
