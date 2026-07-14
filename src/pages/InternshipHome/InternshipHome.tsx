import React, { Suspense, lazy, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import PublicNavbar from "../../features/internship-home/components/PublicNavbar";
import PublicFooter from "../../features/internship-home/components/PublicFooter";
import TopBanner from "../../components/layout/TopBanner";

const HeroSection = lazy(() => import("../../features/internship-home/sections/HeroSection"));
const CommunityInfoSection = lazy(() => import("../../features/internship-home/sections/CommunityInfoSection"));
const GraduateStatsSection = lazy(() => import("../../features/internship-home/sections/GraduateStatsSection"));
const ProcessFlowSection = lazy(() => import("../../features/internship-home/sections/ProcessFlowSection"));
const PartnerLogosSection = lazy(() => import("../../features/internship-home/sections/PartnerLogosSection"));
const MissionVisionSection = lazy(() => import("../../features/internship-home/sections/MissionVisionSection"));
const WorkspaceImageGallery = lazy(() => import("../../features/internship-home/sections/WorkspaceImageGallery"));
const UnefaInfoSection = lazy(() => import("../../features/internship-home/sections/UnefaInfoSection"));
const UnefaMapSection = lazy(() => import("../../features/internship-home/sections/UnefaMapSection"));
const UnefaCarousel = lazy(() => import("../../features/internship-home/sections/UnefaCarousel"));
const FAQSection = lazy(() => import("../../features/internship-home/sections/FAQSection"));

const preloadImages = [
  '/unefa-img/9360.jpg',
  '/logo-nuevo.png',
];

const SectionSkeleton: React.FC<{ height?: string }> = ({ height = "h-64" }) => (
  <div className={`${height} bg-gray-50 dark:bg-gray-900 animate-pulse`} />
);

const sections = [
  { Component: HeroSection, key: 'hero', height: 'h-[600px]' },
  { Component: UnefaCarousel, key: 'carousel', height: 'h-96' },
  { Component: MissionVisionSection, key: 'mission', height: 'h-96' },
  { Component: PartnerLogosSection, key: 'partners', height: 'h-32' },
  { Component: CommunityInfoSection, key: 'community', height: 'h-80' },
  { Component: GraduateStatsSection, key: 'stats', height: 'h-64' },
  { Component: ProcessFlowSection, key: 'process', height: 'h-96' },
  { Component: WorkspaceImageGallery, key: 'gallery', height: 'h-[500px]' },
  { Component: UnefaInfoSection, key: 'info', height: 'h-96' },
  { Component: UnefaMapSection, key: 'map', height: 'h-96' },
  { Component: FAQSection, key: 'faq', height: 'h-96' },
];

const InternshipHome: React.FC = () => {
  useEffect(() => {
    preloadImages.forEach((src) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });

    return () => {
      preloadImages.forEach((src) => {
        const link = document.querySelector(`link[rel="preload"][href="${src}"]`);
        if (link) document.head.removeChild(link);
      });
    };
  }, []);

  return (
    <>
      <PageMeta
        title="Prácticas Profesionales | UNEFA"
        description="Página informativa sobre el proceso de prácticas profesionales de la UNEFA."
      />

      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 bg-linear-to-br from-slate-50 via-white to-brand-50/20 dark:from-gray-950 dark:via-gray-900 dark:to-brand-950/10" />

        <div
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232d90c4' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="fixed top-0 left-0 right-0 z-40">
        <TopBanner />
        <PublicNavbar />
      </div>

      <div className="min-h-screen bg-bg-main dark:bg-bg-dark" style={{ paddingTop: 'calc(var(--banner-height, 0px) + var(--navbar-height, 80px))' }}>
        <main role="main" aria-label="Contenido principal">
          {sections.map((section) => (
            <Suspense key={section.key} fallback={<SectionSkeleton height={section.height} />}>
              <section.Component />
            </Suspense>
          ))}
        </main>

        <footer role="contentinfo" aria-label="Pie de página">
          <PublicFooter />
        </footer>
      </div>
    </>
  );
};

export default React.memo(InternshipHome);
