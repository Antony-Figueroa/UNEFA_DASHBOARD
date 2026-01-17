import React from "react";
import PageMeta from "../../components/common/PageMeta";
import PublicNavbar from "../../features/internship-home/components/PublicNavbar";
import PublicFooter from "../../features/internship-home/components/PublicFooter";
import HeroSection from "../../features/internship-home/sections/HeroSection";
import CommunityInfoSection from "../../features/internship-home/sections/CommunityInfoSection";
import GraduateStatsSection from "../../features/internship-home/sections/GraduateStatsSection";
import ProcessFlowSection from "../../features/internship-home/sections/ProcessFlowSection";
import PartnerLogosSection from "../../features/internship-home/sections/PartnerLogosSection";
import MissionVisionSection from "../../features/internship-home/sections/MissionVisionSection";
import WorkspaceImageGallery from "../../features/internship-home/sections/WorkspaceImageGallery";
import UnefaInfoSection from "../../features/internship-home/sections/UnefaInfoSection";
import UnefaMapSection from "../../features/internship-home/sections/UnefaMapSection";
import TopBanner from "../../components/layout/TopBanner";

const InternshipHome: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg-main dark:bg-bg-dark">
      <PageMeta
        title="Prácticas Profesionales | UNEFA"
        description="Página informativa sobre el proceso de prácticas profesionales y pasantías de la UNEFA."
      />

      {/* Header Pegajoso (Banner + Nav) */}
      <div className="sticky top-0 z-9999 w-full">
        {/* Banner Superior Institucional */}
        <TopBanner />

        {/* Navbar Pública */}
        <PublicNavbar />
      </div>

      <main>
        {/* Hero Section */}
        <HeroSection />

        {/* Sección de Misión y Visión */}
        <MissionVisionSection />

        {/* Sección de Redes Sociales (Logo Loop) */}
        <PartnerLogosSection />

        {/* Sección de Información de Comunidad */}
        <CommunityInfoSection />

        {/* Sección de Reporte Estadístico de Egresados */}
        <GraduateStatsSection />

        {/* Sección de Flujo de Procesos */}
        <ProcessFlowSection />

        {/* Sección de Galería de Espacios UNEFA */}
        <WorkspaceImageGallery />

        {/* Nueva Sección Informativa Dinámica */}
        <UnefaInfoSection />

        {/* Mapa de Ubicación */}
        <UnefaMapSection />

        {/* Placeholder para componentes externos (Siguientes Pasos) */}
        {/* 
        <TestimonialsSection /> 
        <FAQSection />
        */}
      </main>

      {/* Footer Público */}
      <PublicFooter />
    </div>
  );
};

export default InternshipHome;
