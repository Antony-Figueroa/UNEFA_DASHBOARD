import PageBreadcrumb from "../components/common/PageBreadCrumb";
import UserMetaCard from "../components/UserProfile/UserMetaCard";
import UserInfoCard from "../components/UserProfile/UserInfoCard";
import PageMeta from "../components/common/PageMeta";
import { SkeletonLoader, ProfileSkeleton, BreadcrumbSkeleton } from "../components/ui/skeleton";
import { useAuth } from "../context/auth";

export default function UserProfiles() {
  const { loading: isLoading } = useAuth();

  return (
    <>
      <PageMeta
        title="Configuración de Perfil de Usuario"
        description="Configuración de Perfil de Usuario"
      />

      <SkeletonLoader
        isLoading={isLoading}
        id="profile-breadcrumb"
        skeleton={<BreadcrumbSkeleton />}
      >
        <PageBreadcrumb pageTitle="Perfil" />
      </SkeletonLoader>

      <SkeletonLoader
        isLoading={isLoading}
        id="profile-content"
        skeleton={<ProfileSkeleton />}
      >
        <UserMetaCard />
        <UserInfoCard />
      </SkeletonLoader>
    </>
  );
}
