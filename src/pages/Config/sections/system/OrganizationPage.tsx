import { useSearchParams } from "react-router";
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import InstitutionConfig from "./InstitutionConfig";
import NucleiManager from "./NucleiManager";
import GraceDefaultsSection from "@/features/academic-config/components/GraceDefaultsSection";
import PracticeSequenceSection from "@/features/academic-config/components/PracticeSequenceSection";
import EvaluationConfigTab from "./EvaluationConfigTab";

const TABS = [
  { id: "institution", label: "Institución" },
  { id: "nuclei", label: "Núcleos" },
  { id: "academic", label: "Académico" },
  { id: "evaluacion", label: "Evaluación" },
];

export default function OrganizationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "institution";

  const setActiveTab = (tab: string) => {
    setSearchParams(tab === "institution" ? {} : { tab }, { replace: true });
  };

  return (
    <>
      <PageMeta title="Configuración de la Organización" description="Datos institucionales, núcleos, configuración académica y de evaluación" />
      <PageBreadcrumb pageTitle="Configuración de la Organización" />

      <div className="space-y-6 animate-fadeIn">
        {/* Tabs */}
        <div className="border-b border-border-light dark:border-white/10">
          <nav className="flex gap-6">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-brand-500 text-brand-600 dark:text-brand-400"
                    : "border-transparent text-text-secondary hover:text-text-primary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab content */}
        {activeTab === "institution" && <InstitutionConfig />}
        {activeTab === "nuclei" && <NucleiManager />}
        {activeTab === "academic" && (
          <div className="space-y-6 animate-fadeIn">
            <PracticeSequenceSection />
            <GraceDefaultsSection />
          </div>
        )}
        {activeTab === "evaluacion" && <EvaluationConfigTab />}
      </div>
    </>
  );
}
