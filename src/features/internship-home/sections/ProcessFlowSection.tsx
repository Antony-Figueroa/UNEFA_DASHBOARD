
import React from "react";
import Button from "../../../components/ui/button/Button";

const steps = [
  {
    number: "01",
    title: "Registro de Perfil",
    description: "Completa tu información personal y académica en nuestra plataforma segura.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Postulación",
    description: "Selecciona la institución y el tipo de pasantía que mejor se adapte a tus metas.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Seguimiento",
    description: "Realiza el seguimiento de tus actividades y recibe feedback de tus tutores.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Culminación",
    description: "Finaliza tu proceso con éxito y obtén tu certificación académica.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const ProcessFlowSection: React.FC = () => {
  return (
    <section id="procesos" className="py-24 bg-white dark:bg-bg-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-text-emphasis sm:text-4xl mb-4">
            ¿Cómo funciona el proceso?
          </h2>
          <p className="text-lg text-text-secondary">
            Nuestra plataforma simplifica la gestión de tus prácticas profesionales en cuatro pasos clave.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-12 left-0 w-full h-0.5 bg-border-light dark:bg-border-dark -z-10" />

          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center text-center group">
              <div className="h-20 w-20 rounded-full bg-brand-50 flex items-center justify-center text-brand-500 mb-6 group-hover:bg-brand-500 group-hover:text-white transition-all duration-300 shadow-theme-sm">
                {step.icon}
              </div>
              <span className="text-sm font-bold text-brand-500 mb-2">{step.number}</span>
              <h3 className="text-xl font-bold text-text-emphasis mb-3">{step.title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Banner */}
        <div className="mt-24 rounded-3xl bg-[#2d90c4]/10 p-8 md:p-12 dark:bg-[#2d90c4]/20 border border-[#2d90c4]/30 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 text-center md:text-left">
            <h3 className="text-2xl font-bold text-[#2d90c4]">
              ¿Eres una institución o tutor?
            </h3>
            <p className="text-[#2d90c4] dark:text-[#2d90c4]/80 max-w-xl">
              Únete a nuestra red de aliados y ayuda a formar a la próxima generación de profesionales. Registra tu institución o postúlate como tutor externo.
            </p>
          </div>
          <Button 
            variant="primary" 
            size="md" 
            className="whitespace-nowrap bg-[#2d90c4] hover:bg-[#2d90c4]/90"
          >
            Registrar Información
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ProcessFlowSection;
