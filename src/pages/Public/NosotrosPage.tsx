import React, { Suspense, lazy } from "react";
import PageMeta from "../../components/common/PageMeta";
import PublicNavbar from "../../features/internship-home/components/PublicNavbar";
import PublicFooter from "../../features/internship-home/components/PublicFooter";
import TopBanner from "../../components/layout/TopBanner";
import { motion } from "framer-motion";

const MissionVisionSection = lazy(() => import("../../features/internship-home/sections/MissionVisionSection"));

const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-br from-bg-main via-white to-brand-50/30 dark:from-bg-dark dark:via-gray-900 dark:to-brand-950/20" />
      
      <motion.div
        className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-25 dark:opacity-10"
        style={{ background: 'radial-gradient(circle, var(--color-brand-400) 0%, transparent 70%)' }}
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      
      <motion.div
        className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-20 dark:opacity-8"
        style={{ background: 'radial-gradient(circle, var(--color-unefa-gold) 0%, transparent 70%)' }}
        animate={{
          scale: [1, 1.3, 1],
          x: [0, -30, 0],
          y: [0, 30, 0],
        }}
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

const NosotrosPage: React.FC = React.memo(() => {
  return (
    <div className="min-h-screen bg-bg-main dark:bg-bg-dark relative">
      <PageMeta
        title="Nosotros | UNEFA"
        description="Conoce la historia, misión, visión y valores de la Universidad Nacional Experimental Politécnica de la Fuerza Armada."
      />

      <AnimatedBackground />

      <div className="sticky top-0 z-9999 w-full" role="banner">
        <TopBanner />
        <PublicNavbar />
      </div>

      <main role="main" aria-label="Contenido principal">
        <SectionWrapper>
          <section className="py-20 bg-gradient-to-br from-brand-500/10 via-brand-600/5 to-transparent dark:from-brand-900/20 dark:via-brand-900/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <motion.h1 
                className="text-4xl md:text-5xl font-bold text-text-emphasis mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                Nosotros
              </motion.h1>
              <motion.p 
                className="text-xl text-text-secondary max-w-3xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                Conoce más sobre nuestra institución, nuestra historia y los valores que nos guían
              </motion.p>
            </div>
          </section>
        </SectionWrapper>

        <Suspense>
          <SectionWrapper delay={0.1}>
            <MissionVisionSection />
          </SectionWrapper>
        </Suspense>

        <SectionWrapper delay={0.2}>
          <section className="py-24 bg-white dark:bg-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                <motion.div
                  initial={{ opacity: 0, x: -40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-12 w-12 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                      <svg className="h-6 w-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-text-emphasis">Nuestra Historia</h2>
                  </div>
                  <div className="space-y-4 text-text-secondary leading-relaxed">
                    <p>
                      La Universidad Nacional Experimental Politécnica de la Fuerza Armada (UNEFA) 
                      fue fundada con el propósito de formar profesionales de excelencia en el área 
                      tecnológica y científica, al servicio del desarrollo nacional.
                    </p>
                    <p>
                      A lo largo de nuestras décadas de trayectoria, hemos formado miles de profesionales 
                      en diversas áreas del conocimiento, contribuyendo significativamente al desarrollo 
                      económico y social de Venezuela.
                    </p>
                    <p>
                      Nuestra institución se caracteriza por su compromiso con la excelencia académica, 
                      la investigación científica y la extensión universitaria, formando profesionales 
                      capaces de enfrentar los desafíos del siglo XXI.
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 border border-gray-100 dark:border-gray-700"
                >
                  <h3 className="text-2xl font-bold text-text-emphasis mb-6">Nuestros Valores</h3>
                  <ul className="space-y-4">
                    {[
                      { title: "Excelencia Académica", desc: "Compromiso con la calidad educativa", icon: "🎓" },
                      { title: "Integridad", desc: "Honestidad y ética en todas nuestras acciones", icon: "⚖️" },
                      { title: "Responsabilidad Social", desc: "Compromiso con el desarrollo nacional", icon: "🤝" },
                      { title: "Innovación", desc: "Adaptabilidad a los nuevos desafíos", icon: "💡" },
                      { title: "Solidaridad", desc: "Apoyo mutuo y trabajo en equipo", icon: "❤️" },
                    ].map((valor, index) => (
                      <motion.li 
                        key={index} 
                        className="flex items-start gap-4 p-4 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors"
                        whileHover={{ x: 5 }}
                      >
                        <div className="h-12 w-12 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0 text-2xl">
                          {valor.icon}
                        </div>
                        <div>
                          <h4 className="font-semibold text-text-emphasis">{valor.title}</h4>
                          <p className="text-sm text-text-secondary">{valor.desc}</p>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              </div>
            </div>
          </section>
        </SectionWrapper>

        <SectionWrapper delay={0.3}>
          <section className="py-24 bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center max-w-3xl mx-auto mb-16"
              >
                <h2 className="text-3xl font-bold text-text-emphasis mb-4">Estructura Organizativa</h2>
                <p className="text-text-secondary">
                  Una institución comprometida con la formación integral de profesionales
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { title: "Coordinación Académica", desc: "Gestión de procesos educativos", icon: (
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  )},
                  { title: "Investigación", desc: "Desarrollo científico y tecnológico", icon: (
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  )},
                  { title: "Extensión", desc: "Vínculo con la comunidad", icon: (
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  )},
                ].map((area, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-theme-sm border border-gray-100 dark:border-gray-700"
                  >
                    <div className="h-16 w-16 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-500 mb-6">
                      {area.icon}
                    </div>
                    <h3 className="text-xl font-bold text-text-emphasis mb-2">{area.title}</h3>
                    <p className="text-text-secondary">{area.desc}</p>
                  </motion.div>
                ))}
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

export default NosotrosPage;
