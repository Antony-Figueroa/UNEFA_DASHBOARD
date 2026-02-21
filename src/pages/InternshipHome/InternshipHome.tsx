import React, { Suspense, lazy } from "react";
import PageMeta from "../../components/common/PageMeta";
import PublicNavbar from "../../features/internship-home/components/PublicNavbar";
import PublicFooter from "../../features/internship-home/components/PublicFooter";
import TopBanner from "../../components/layout/TopBanner";
import { motion } from "framer-motion";

const HeroSection = lazy(() => import("../../features/internship-home/sections/HeroSection"));
const CommunityInfoSection = lazy(() => import("../../features/internship-home/sections/CommunityInfoSection"));
const GraduateStatsSection = lazy(() => import("../../features/internship-home/sections/GraduateStatsSection"));
const ProcessFlowSection = lazy(() => import("../../features/internship-home/sections/ProcessFlowSection"));
const PartnerLogosSection = lazy(() => import("../../features/internship-home/sections/PartnerLogosSection"));
const MissionVisionSection = lazy(() => import("../../features/internship-home/sections/MissionVisionSection"));
const WorkspaceImageGallery = lazy(() => import("../../features/internship-home/sections/WorkspaceImageGallery"));
const UnefaInfoSection = lazy(() => import("../../features/internship-home/sections/UnefaInfoSection"));
const UnefaMapSection = lazy(() => import("../../features/internship-home/sections/UnefaMapSection"));
const FAQSection = lazy(() => import("../../features/internship-home/sections/FAQSection"));

const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute inset-0 bg-linear-to-br from-bg-main via-white to-brand-50/30 dark:from-bg-dark dark:via-gray-900 dark:to-brand-950/20" />
      
      <motion.div
        className="absolute top-0 right-0 w-150 h-150 rounded-full opacity-30 dark:opacity-15"
        style={{ background: 'radial-gradient(circle, var(--color-brand-400) 0%, transparent 70%)' }}
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-25 dark:opacity-10"
        style={{ background: 'radial-gradient(circle, var(--color-success-400) 0%, transparent 70%)' }}
        animate={{
          scale: [1, 1.3, 1],
          x: [0, -40, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5,
        }}
      />
      
      <motion.div
        className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full opacity-20 dark:opacity-8"
        style={{ background: 'radial-gradient(circle, var(--color-unefa-gold) 0%, transparent 70%)' }}
        animate={{
          scale: [1, 1.4, 1],
          x: [0, 30, 0],
          y: [0, 40, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 10,
        }}
      />
      
      <div className="absolute inset-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232d90c4' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />
    </div>
  );
};

const SectionWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.3, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

const sections = [
  { Component: HeroSection, key: 'hero' },
  { Component: MissionVisionSection, key: 'mission' },
  { Component: PartnerLogosSection, key: 'partners' },
  { Component: CommunityInfoSection, key: 'community' },
  { Component: GraduateStatsSection, key: 'stats' },
  { Component: ProcessFlowSection, key: 'process' },
  { Component: WorkspaceImageGallery, key: 'gallery' },
  { Component: UnefaInfoSection, key: 'info' },
  { Component: UnefaMapSection, key: 'map' },
  { Component: FAQSection, key: 'faq' },
];

const InternshipHome: React.FC = React.memo(() => {
  return (
    <>
      <PageMeta
        title="Prácticas Profesionales | UNEFA"
        description="Página informativa sobre el proceso de prácticas profesionales de la UNEFA."
      />

      <AnimatedBackground />

      <div className="fixed top-0 left-0 right-0 z-40">
        <TopBanner />
        <PublicNavbar />
      </div>

      <div className="min-h-screen bg-bg-main dark:bg-bg-dark" style={{ paddingTop: 'calc(var(--banner-height, 0px) + var(--navbar-height, 80px))' }}>
        <main role="main" aria-label="Contenido principal">
          {sections.map((section) => {
            const SectionComponent = section.Component;
            return (
              <Suspense key={section.key} fallback={<div className="h-24" />}>
                <SectionWrapper>
                  <SectionComponent />
                </SectionWrapper>
              </Suspense>
            );
          })}
        </main>

        <footer role="contentinfo" aria-label="Pie de página">
          <PublicFooter />
        </footer>
      </div>
    </>
  );
});

export default InternshipHome;
