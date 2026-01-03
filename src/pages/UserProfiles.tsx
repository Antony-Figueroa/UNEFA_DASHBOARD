import { useState, useEffect } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import UserMetaCard from "../components/UserProfile/UserMetaCard";
import UserInfoCard from "../components/UserProfile/UserInfoCard";
import UserAddressCard from "../components/UserProfile/UserAddressCard";
import PageMeta from "../components/common/PageMeta";
import { SkeletonLoader, ProfileSkeleton, BreadcrumbSkeleton } from "../components/ui/skeleton";

export default function UserProfiles() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulamos carga de perfil
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <PageMeta
        title="React.js Profile Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Profile Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />

      <SkeletonLoader
        isLoading={isLoading}
        id="profile-breadcrumb"
        skeleton={<BreadcrumbSkeleton />}
      >
        <PageBreadcrumb pageTitle="Profile" />
      </SkeletonLoader>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 lg:p-6 stagger-delay">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Profile
        </h3>

        <SkeletonLoader
          isLoading={isLoading}
          id="profile-content"
          skeleton={<ProfileSkeleton />}
        >
          <div className="space-y-6">
            <UserMetaCard />
            <UserInfoCard />
            <UserAddressCard />
          </div>
        </SkeletonLoader>
      </div>
    </>
  );
}
