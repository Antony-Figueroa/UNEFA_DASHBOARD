import React from "react";
import CircularGallery from "../components/CircularGallery";

const WorkspaceImageGallery: React.FC = () => {
  return (
    <section className="py-12 bg-brand-50/30 dark:bg-brand-900/10 border-y border-brand-100 dark:border-brand-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-[#2d90c4] dark:text-[#2d90c4]">
            Nuestra Comunidad y Espacios
          </h2>
          <p className="mt-4 text-lg text-text-secondary dark:text-text-tertiary max-w-2xl mx-auto">
            Conoce los espacios donde se forja el futuro profesional de la Patria. 
            La UNEFA es compromiso, disciplina y excelencia.
          </p>
          <div className="mt-4 flex justify-center">
            <div className="h-1 w-20 bg-[#2d90c4] rounded-full"></div>
          </div>
        </div>

        <div className="relative min-h-150"> 
          <CircularGallery bend={3} borderRadius={0.05} scrollEase={0.02}/> 
        </div>
      </div>
    </section>
  );
};

export default WorkspaceImageGallery;
