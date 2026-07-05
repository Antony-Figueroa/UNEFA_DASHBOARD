import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import GraceDefaultsSection from "../components/GraceDefaultsSection";
import EvaluationConfigSection from "../components/EvaluationConfigSection";

export default function AcademicConfigPage() {
  return (
    <>
      <PageMeta title="Configuración Académica" description="Parámetros y configuración del módulo académico" />
      <PageBreadcrumb pageTitle="Configuración Académica" />

      <div className="space-y-6 animate-fadeIn">
        <GraceDefaultsSection />
        <EvaluationConfigSection />
      </div>
    </>
  );
}
