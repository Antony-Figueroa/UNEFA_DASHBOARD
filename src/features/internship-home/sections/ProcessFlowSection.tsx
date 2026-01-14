
import React from "react";
import Button from "../../../components/ui/button/Button";

const steps = [
  {
    number: "01",
    title: "Postulación",
    description: "Completa tu información personal y académica en la plataforma aliada SICEU.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Preinscripción",
    description: "Entrega de los documentos solicitados.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Inscripción",
    description: "Se selecciona la institución y los tutores que mejor se adapte a tus metas.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Desarrollo",
    description: "Ejecución de las prácticas profesionales.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    number: "05",
    title: "Seguimiento",
    description: "Realiza el seguimiento de tus actividades y recibe feedback de tus tutores.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    number: "06",
    title: "Defensa",
    description: "Defiende el informe final de las prácticas profesionales.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    number: "07",
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
            Nuestra plataforma gestiona el ciclo completo de tus prácticas profesionales en siete etapas estructuradas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16 relative">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center text-center group">
              <div className="relative mb-6">
                <div className="h-20 w-20 rounded-full bg-brand-50 flex items-center justify-center text-brand-500 group-hover:bg-brand-500 group-hover:text-white transition-all duration-300 shadow-theme-sm relative z-10">
                  {step.icon}
                </div>
                <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-white dark:bg-bg-dark border-2 border-brand-500 flex items-center justify-center text-xs font-black text-brand-500 z-20">
                  {step.number}
                </div>
              </div>
              <h3 className="text-xl font-bold text-text-emphasis mb-3">{step.title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed px-4">
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
              Únete a nuestra red de aliados con integración SICEU. Gestiona postulaciones, aprueba documentos y realiza seguimiento digital de tus pasantes.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              variant="primary" 
              size="md" 
              className="whitespace-nowrap bg-[#2d90c4] hover:bg-[#2d90c4]/90"
            >
              Registrar Institución
            </Button>
            <Button 
              variant="outline" 
              size="md" 
              className="whitespace-nowrap border-[#2d90c4] text-[#2d90c4] hover:bg-[#2d90c4]/10"
            >
              Postular como Tutor
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProcessFlowSection;
