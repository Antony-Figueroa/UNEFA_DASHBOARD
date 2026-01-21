import { useState, useEffect } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import { SkeletonLoader, TitleSkeleton, BreadcrumbSkeleton, TablePageSkeleton } from "../../components/ui/skeleton";
import { PlusCircleIcon } from "../../icons/actions";
import UserManagementTable from "../../features/users/components/UserManagementTable";

const UserManagementPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"Activos" | "Inactivos">("Activos");

  useEffect(() => {
    // Simulamos carga de datos
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <PageMeta 
        title="Gestión de Usuarios | UNEFA" 
        description="Administración de usuarios del panel de control" 
      />

      <SkeletonLoader
        isLoading={isLoading}
        id="users-page-header"
        skeleton={<BreadcrumbSkeleton />}
      >
        <PageBreadcrumb pageTitle="Gestión de Usuarios" />
      </SkeletonLoader>

      <div className="stagger-delay">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <SkeletonLoader isLoading={isLoading} skeleton={<TitleSkeleton />} id="users-title">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-text-primary dark:text-text-emphasis">
                  Administración de Usuarios
                </h2>
              </div>
              <p className="mt-1 text-sm text-text-secondary dark:text-text-tertiary">
                Gestiona los accesos y roles de los usuarios del sistema.
              </p>
            </SkeletonLoader>
          </div>

          {!isLoading && (
            <Button 
              onClick={() => {
                window.dispatchEvent(new CustomEvent('open-user-modal'));
              }} 
              startIcon={<PlusCircleIcon className="h-5 w-5" />}
            >
              Nuevo Usuario
            </Button>
          )}
        </div>

        <div className="space-y-6">
          <ComponentCard title={activeTab === "Activos" ? "Usuarios Activos" : "Usuarios Inactivos"}>
            <div className="mb-6 flex border-b border-border-light dark:border-border-dark">
              <button
                onClick={() => setActiveTab("Activos")}
                className={`pb-3 px-4 text-sm font-medium transition-colors relative ${
                  activeTab === "Activos" ? "text-brand-500" : "text-text-secondary hover:text-text-emphasis"
                }`}
              >
                Activos
                {activeTab === "Activos" && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-500 animate-slideInLeft" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("Inactivos")}
                className={`pb-3 px-4 text-sm font-medium transition-colors relative ${
                  activeTab === "Inactivos" ? "text-brand-500" : "text-text-secondary hover:text-text-emphasis"
                }`}
              >
                Inactivos
                {activeTab === "Inactivos" && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-500 animate-slideInLeft" />
                )}
              </button>
            </div>

            <SkeletonLoader
              isLoading={isLoading}
              id="users-page-list"
              skeleton={<TablePageSkeleton rows={10} />}
            >
              <UserManagementTable activeTab={activeTab} />
            </SkeletonLoader>
          </ComponentCard>
        </div>
      </div>
    </>
  );
};

export default UserManagementPage;
