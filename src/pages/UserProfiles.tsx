import PageBreadcrumb from "../components/common/PageBreadCrumb";
import UserMetaCard from "../components/UserProfile/UserMetaCard";
import UserInfoCard from "../components/UserProfile/UserInfoCard";
import UserPasswordCard from "../components/UserProfile/UserPasswordCard";
import UserLoginHistoryCard from "../components/UserProfile/UserLoginHistoryCard";
import UserThemeCard from "../components/UserProfile/UserThemeCard";
import NotificationPreferencesCard from "../components/UserProfile/NotificationPreferencesCard";
import ActiveSessionsCard from "../components/UserProfile/ActiveSessionsCard";
import AccountDangerZoneCard from "../components/UserProfile/AccountDangerZoneCard";
import LanguagePreferencesCard from "../components/UserProfile/LanguagePreferencesCard";
import PageMeta from "../components/common/PageMeta";
import { SkeletonLoader, ProfileSkeleton, BreadcrumbSkeleton } from "../components/ui/skeleton";
import { useAuth } from "../context/auth";

export default function UserProfiles() {
  const { loading: isLoading } = useAuth();

  return (
    <>
      <PageMeta
        title="Mi Perfil"
        description="Configuración de Perfil de Usuario"
      />

      <SkeletonLoader
        isLoading={isLoading}
        id="profile-breadcrumb"
        skeleton={<BreadcrumbSkeleton />}
      >
        <PageBreadcrumb pageTitle="Mi Perfil" />
      </SkeletonLoader>

      <SkeletonLoader
        isLoading={isLoading}
        id="profile-content"
        skeleton={<ProfileSkeleton />}
      >
        <div className="space-y-6">
          <UserMetaCard />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UserPasswordCard />
            <UserThemeCard />
          </div>

          <NotificationPreferencesCard />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UserLoginHistoryCard />
            <ActiveSessionsCard />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LanguagePreferencesCard />
            <UserInfoCard />
          </div>

          <AccountDangerZoneCard />
        </div>
      </SkeletonLoader>
    </>
  );
}
