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

const InternshipHome: React.FC = React.memo(() => {
  return (
    <div className="min-h-screen bg-bg-main dark:bg-bg-dark" aria-label="Página de Prácticas UNEFA">
      <PageMeta
        title="Prácticas Profesionales | UNEFA"
        description="Página informativa sobre el proceso de prácticas profesionales de la UNEFA."
      />

      {/* Header Pegajoso (Banner + Nav) */}
      <div className="sticky top-0 z-9999 w-full" role="banner">
        <TopBanner />
        <PublicNavbar />
      </div>

      <main role="main" aria-label="Contenido principal">
        <Suspense>
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <HeroSection />
          </motion.section>
        </Suspense>

        <Suspense>
          <motion.section
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <MissionVisionSection />
          </motion.section>
        </Suspense>

        <Suspense>
          <motion.section
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <PartnerLogosSection />
          </motion.section>
        </Suspense>

        <Suspense>
          <motion.section
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <CommunityInfoSection />
          </motion.section>
        </Suspense>

        <Suspense>
          <motion.section
            initial={{ opacity: 0, rotate: -5 }}
            animate={{ opacity: 1, rotate: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
          >
            <GraduateStatsSection />
          </motion.section>
        </Suspense>

        <Suspense>
          <motion.section
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.6 }}
          >
            <ProcessFlowSection />
          </motion.section>
        </Suspense>

        <Suspense>
          <motion.section
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.7 }}
          >
            <WorkspaceImageGallery />
          </motion.section>
        </Suspense>

        <Suspense>
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8 }}
          >
            <UnefaInfoSection />
          </motion.section>
        </Suspense>

        <Suspense>
          <motion.section
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.9 }}
          >
            <UnefaMapSection />
          </motion.section>
        </Suspense>

        {/* Placeholder para componentes externos (Siguientes Pasos) */}
        {/* <Suspense><TestimonialsSection /></Suspense> */}
        {/* <Suspense><FAQSection /></Suspense> */}
      </main>

      <footer role="contentinfo" aria-label="Pie de página">
        <PublicFooter />
      </footer>
    </div>
  );
});

export default InternshipHome;
