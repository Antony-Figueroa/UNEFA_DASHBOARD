import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import InstitutionConfig from "./InstitutionConfig";
import NucleiManager from "./NucleiManager";

const TABS = [
  { id: "institution", label: "Institución" },
  { id: "nuclei", label: "Núcleos" },
];

export default function OrganizationConfig() {
  const [activeTab, setActiveTab] = useState("institution");

  return (
    <>
      <PageMeta title="Configuración de la Organización" description="Datos institucionales y núcleos" />
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

        {/* Tab content — each is a full page component */}
        {activeTab === "institution" && <InstitutionConfig />}
        {activeTab === "nuclei" && <NucleiManager />}
      </div>
    </>
  );
}