import React from "react";
import PageMeta from "../../components/common/PageMeta";
import PublicNavbar from "../../features/internship-home/components/PublicNavbar";
import PublicFooter from "../../features/internship-home/components/PublicFooter";
import TopBanner from "../../components/layout/TopBanner";
import { motion } from "framer-motion";

interface PasoProceso {
  numero: string;
  titulo: string;
  descripcion: string;
  duracion: string;
  icon: React.ReactNode;
}

const pasosProceso: PasoProceso[] = [
  {
    numero: "01",
    titulo: "Postulación",
    descripcion: "Registra tus datos en la plataforma SICEU, selecciona el área de interés y completa tu perfil académico.",
    duracion: "1-2 días",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    numero: "02",
    titulo: "Preinscripción",
    descripcion: "Entrega la documentación requerida en la Coordinación de Pasantías: constancia de inscripción, certificado de notas y carta de postulación.",
    duracion: "3-5 días",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    numero: "03",
    titulo: "Asignación",
    descripcion: "La Coordinación asigna la institución receptora y los tutores académico y empresarial según tu perfil y disponibilidad.",
    duracion: "5-7 días",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    numero: "04",
    titulo: "Desarrollo",
    descripcion: "Realiza tus prácticas profesionales en la institución asignada, cumpliendo con las actividades planificadas y el horario establecido.",
    duracion: "3-6 meses",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    numero: "05",
    titulo: "Seguimiento",
    descripcion: "Registra tus actividades semanales en la plataforma. Recibe visitas de seguimiento y feedback de tus tutores.",
    duracion: "Durante todo el proceso",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    numero: "06",
    titulo: "Informe Final",
    descripcion: "Elabora y entrega el informe técnico final documentando tu experiencia de pasantía, aprendizajes y aportes a la institución.",
    duracion: "2 semanas",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    numero: "07",
    titulo: "Defensa y Culminación",
    descripcion: "Presenta y defends tu informe final ante el tribunal académico. Obtén tu certificación de pasantías.",
    duracion: "1-2 semanas",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const documentosRequeridos = [
  { nombre: "Constancia de inscripción actualizada", icono: "📄" },
  { nombre: "Certificado de notas", icono: "📊" },
  { nombre: "Carta de postulación", icono: "✉️" },
  { nombre: "Copia de cédula de identidad", icono: "🪪" },
  { nombre: "2 fotografías recientes", icono: "📷" },
  { nombre: "Formato de datos personales", icono: "📝" },
  { nombre: "Constancia de buena conducta", icono: "✅" },
];

const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute inset-0 bg-linear-to-br from-bg-main via-white to-brand-50/30 dark:from-bg-dark dark:via-gray-900 dark:to-brand-950/20" />
      
      <motion.div
        className="absolute top-0 right-1/4 w-[450px] h-[450px] rounded-full opacity-20 dark:opacity-8"
        style={{ background: 'radial-gradient(circle, var(--color-brand-400) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.2, 1], y: [0, -30, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      
      <motion.div
        className="absolute bottom-0 left-1/4 w-[500px] h-[500px] rounded-full opacity-15 dark:opacity-6"
        style={{ background: 'radial-gradient(circle, var(--color-success-400) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.3, 1], y: [0, 40, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 5 }}
      />
    </div>
  );
};

const SectionWrapper: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.6, delay, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

const PasantiasPage: React.FC = React.memo(() => {
  return (
    <div className="min-h-screen bg-bg-main dark:bg-bg-dark relative">
      <PageMeta
        title="Pasantías | UNEFA"
        description="Todo sobre el proceso de prácticas profesionales en la UNEFA: requisitos, etapas, documentación y más."
      />

      <AnimatedBackground />

      <div className="sticky top-0 z-9999 w-full" role="banner">
        <TopBanner />
        <PublicNavbar />
      </div>

      <main role="main" aria-label="Contenido principal">
        <SectionWrapper>
          <section className="py-20 bg-linear-to-br from-brand-500/10 via-brand-600/5 to-transparent">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <motion.h1 
                className="text-4xl md:text-5xl font-bold text-text-emphasis mb-4"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                Prácticas Profesionales
              </motion.h1>
              <motion.p 
                className="text-xl text-text-secondary max-w-3xl mx-auto"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Conoce el proceso completo para realizar tus pasantías profesionales en la UNEFA
              </motion.p>
            </div>
          </section>
        </SectionWrapper>

        <SectionWrapper delay={0.1}>
          <section className="py-24 bg-white dark:bg-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center max-w-3xl mx-auto mb-16"
              >
                <h2 className="text-3xl font-bold text-text-emphasis mb-4">
                  Etapas del Proceso
                </h2>
                <p className="text-text-secondary">
                  El proceso de pasantías se divide en 7 etapas fundamentales que te guían desde la postulación hasta la culminación exitosa.
                </p>
              </motion.div>

              <div className="relative">
                <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-linear-to-b from-brand-500 via-brand-400 to-brand-500 opacity-20"></div>
                
                <div className="space-y-12">
                  {pasosProceso.map((paso, index) => (
                    <motion.div
                      key={paso.numero}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className={`relative flex items-center ${
                        index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                      } flex-col gap-8`}
                    >
                      <div className={`flex-1 ${index % 2 === 0 ? "md:text-right md:pr-16" : "md:text-left md:pl-16"} text-center px-4 md:px-0`}>
                        <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-brand-500 text-white font-bold text-lg mb-4 md:hidden">
                          {paso.numero}
                        </div>
                        <motion.h3 
                          className="text-xl font-bold text-text-emphasis mb-2"
                          whileHover={{ scale: 1.02 }}
                        >
                          {paso.titulo}
                        </motion.h3>
                        <p className="text-text-secondary mb-2">{paso.descripcion}</p>
                        <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-text-secondary">
                          Duración: {paso.duracion}
                        </span>
                      </div>
                      
                      <div className="hidden md:flex items-center justify-center absolute left-1/2 transform -translate-x-1/2">
                        <motion.div 
                          className="h-16 w-16 rounded-full bg-brand-500 flex items-center justify-center text-white shadow-lg z-10"
                          whileHover={{ scale: 1.1 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          {paso.icon}
                        </motion.div>
                        <div className="absolute -bottom-8 text-sm font-bold text-brand-500">
                          {paso.numero}
                        </div>
                      </div>

                      <div className="flex-1"></div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </SectionWrapper>

        <SectionWrapper delay={0.2}>
          <section className="py-24 bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-12 w-12 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                      <svg className="h-6 w-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-text-emphasis">Documentación Requerida</h2>
                  </div>
                  <p className="text-text-secondary mb-8">
                    Para iniciar el proceso de preinscripción, debes preparar los siguientes documentos:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {documentosRequeridos.map((doc, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ x: 5 }}
                        className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-theme-sm border border-gray-100 dark:border-gray-700"
                      >
                        <span className="text-2xl">{doc.icono}</span>
                        <span className="text-text-emphasis font-medium">{doc.nombre}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-12 w-12 rounded-xl bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
                      <svg className="h-6 w-6 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-text-emphasis">Evaluación</h2>
                  </div>
                  <p className="text-text-secondary mb-6">
                    La evaluación de las pasantías profesionales se divide en los siguientes componentes:
                  </p>
                  <div className="space-y-4">
                    {[
                      { porcentaje: "40%", titulo: "Informe Técnico", desc: "Documentación escrita de la experiencia", color: "bg-brand-500" },
                      { porcentaje: "30%", titulo: "Tutor Empresarial", desc: "Evaluación del supervisor en la empresa", color: "bg-success-500" },
                      { porcentaje: "30%", titulo: "Tutor Académico", desc: "Seguimiento y evaluación del docente", color: "bg-orange-500" },
                    ].map((eval_, index) => (
                      <motion.div
                        key={index}
                        className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-theme-sm flex items-center justify-between border border-gray-100 dark:border-gray-700"
                        whileHover={{ scale: 1.02 }}
                      >
                        <div>
                          <h4 className="font-bold text-text-emphasis">{eval_.titulo}</h4>
                          <p className="text-sm text-text-secondary">{eval_.desc}</p>
                        </div>
                        <div className={`px-4 py-2 rounded-lg ${eval_.color} text-white font-bold text-xl`}>
                          {eval_.porcentaje}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <p className="mt-6 text-sm text-text-secondary bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                    <strong>Nota mínima para aprobar:</strong> 10 puntos sobre 20
                  </p>
                </motion.div>
              </div>
            </div>
          </section>
        </SectionWrapper>

        <SectionWrapper delay={0.3}>
          <section className="py-24 bg-white dark:bg-gray-800">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl font-bold text-text-emphasis mb-6">
                ¿Estás listo para comenzar?
              </h2>
              <p className="text-lg text-text-secondary mb-8">
                Si cumples con los requisitos y tienes toda la documentación, puedes iniciar tu proceso de pasantías.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <motion.a
                  href="/faq"
                  className="px-8 py-3 rounded-lg border-2 border-brand-500 text-brand-500 font-medium hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Ver Preguntas Frecuentes
                </motion.a>
              </div>
            </div>
          </section>
        </SectionWrapper>
      </main>

      <footer role="contentinfo" aria-label="Pie de página">
        <PublicFooter />
      </footer>
    </div>
  );
});

export default PasantiasPage;
