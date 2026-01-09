import { useState, useEffect } from "react";
import UserList from "../components/UserList/UserList";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PeriodStatusChart from "../features/periods/components/PeriodStatusChart";
import { SkeletonLoader, TitleSkeleton, TablePageSkeleton } from "../components/ui/skeleton";

const UsersPage = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulamos carga de datos
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // 1s de carga inicial para demostrar el skeleton de 0.5s
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <SkeletonLoader
        isLoading={isLoading}
        id="users-page-header"
        skeleton={<TitleSkeleton />}
      >
        <PageBreadcrumb pageTitle="Lista de Usuarios" />
      </SkeletonLoader>

      <div className="mb-10 max-w-2xl mx-auto">
        <SkeletonLoader
          isLoading={isLoading}
          id="users-page-chart"
          skeleton={
            <div className="h-87.5 w-full bg-bg-secondary dark:bg-white/5 animate-pulse rounded-sm" />
          }
        >
          <PeriodStatusChart />
        </SkeletonLoader>
      </div>

      <div className="flex flex-col gap-10">
        <SkeletonLoader
          isLoading={isLoading}
          id="users-page-list"
          skeleton={<TablePageSkeleton rows={5} />}
        >
          <UserList />
        </SkeletonLoader>
      </div>
    </>
  );
};

export default UsersPage;
