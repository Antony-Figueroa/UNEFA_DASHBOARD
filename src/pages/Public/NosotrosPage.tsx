import React, { Suspense, lazy } from "react";
import PageMeta from "../../components/common/PageMeta";
import PublicNavbar from "../../features/internship-home/components/PublicNavbar";
import PublicFooter from "../../features/internship-home/components/PublicFooter";
import TopBanner from "../../components/layout/TopBanner";
import { motion } from "framer-motion";
import { Shield, Music, BookOpen, MapPin, Calendar, Award } from "lucide-react";

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

/**
 * Timeline hitos de la UNEFA
 */
const timelineData = [
  {
    year: "1974",
    title: "Fundación del IUPFAN",
    desc: "El 3 de febrero, mediante Decreto N° 1.587 del Presidente Rafael Caldera, se crea el Instituto Universitario Politécnico de las Fuerzas Armadas Nacionales (IUPFAN), con sede principal en la Región Capital.",
    icon: Calendar,
  },
  {
    year: "1996",
    title: "Comité de Transformación",
    desc: "El 17 de octubre se constituye el Comité encargado de fundamentar los cambios estructurales, académicos y administrativos para la transformación del IUPFAN en universidad.",
    icon: BookOpen,
  },
  {
    year: "1998",
    title: "Aprobación del CNU",
    desc: "El 5 de octubre, el Consejo Nacional de Universidades emite opinión favorable mediante Resolución N° 28, publicada en Gaceta Oficial N° 36.583.",
    icon: Award,
  },
  {
    year: "1999",
    title: "Nace la UNEFA",
    desc: "El 26 de abril, el Presidente Hugo Chávez Frías firma el Decreto N° 115, creando la Universidad Nacional Experimental Politécnica de la Fuerza Armada Nacional Bolivariana.",
    icon: Award,
  },
  {
    year: "Presente",
    title: "Modernización",
    desc: "Bajo una nueva gestión rectoral, la UNEFA vive una era de transformación con optimización de infraestructura, rescate de espacios y fortalecimiento de programas de pregrado y postgrado.",
    icon: MapPin,
  },
];

const NosotrosPage: React.FC = React.memo(() => {
  return (
    <div className="min-h-screen bg-bg-main dark:bg-bg-dark relative">
      <PageMeta
        title="Nosotros | UNEFA"
        description="Conoce la historia institucional, misión, visión, valores y símbolos de la Universidad Nacional Experimental Politécnica de la Fuerza Armada."
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
                Conoce la historia, los valores y los símbolos que nos identifican como institución
              </motion.p>
            </div>
          </section>
        </SectionWrapper>

        <Suspense>
          <SectionWrapper delay={0.1}>
            <MissionVisionSection />
          </SectionWrapper>
        </Suspense>

        {/* ─── Historia ──────────────────────────────── */}
        <SectionWrapper delay={0.2}>
          <section className="py-16 lg:py-20 bg-white dark:bg-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center max-w-3xl mx-auto mb-16"
              >
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-brand-500" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-text-emphasis mb-4">Nuestra Historia</h2>
                <p className="text-text-secondary">
                  El testimonio de una evolución institucional marcada por el patriotismo y la excelencia académica
                </p>
              </motion.div>

              {/* Timeline */}
              <div className="relative mb-16">
                {/* Línea vertical */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-brand-200 dark:bg-brand-800 hidden md:block" />

                <div className="space-y-12">
                  {timelineData.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        className="relative pl-0 md:pl-20"
                      >
                        {/* Círculo en la línea */}
                        <div className="absolute left-[22px] top-1.5 w-3 h-3 rounded-full bg-brand-500 border-2 border-white dark:border-gray-800 hidden md:block" />

                        <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-8">
                          <div className="flex-shrink-0">
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-sm font-bold">
                              {item.year}
                            </span>
                          </div>
                          <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="h-10 w-10 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-500">
                                <Icon className="h-5 w-5" />
                              </div>
                              <h3 className="text-xl font-bold text-text-emphasis">{item.title}</h3>
                            </div>
                            <p className="text-text-secondary leading-relaxed">{item.desc}</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Texto histórico detallado */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="prose prose-lg max-w-4xl mx-auto space-y-6 text-text-secondary leading-relaxed"
              >
                <p>
                  La historia de la Universidad Nacional Experimental Politécnica de la Fuerza Armada Nacional
                  Bolivariana (UNEFA) es el testimonio de una evolución institucional marcada por el
                  patriotismo, la excelencia académica, la disciplina y el compromiso inquebrantable con el
                  desarrollo estratégico de Venezuela.
                </p>
                <p>
                  Durante 25 años de intachable trayectoria, el IUPFAN se consolidó como un referente de alta
                  calidad en la educación superior venezolana, destacándose por la formación de profesionales
                  con un profundo sentido de la responsabilidad, el honor y la eficiencia. No obstante, la
                  dinámica geopolítica y los profundos cambios estructurales de la nación exigieron una
                  transformación integral para expandir este exitoso modelo educativo hacia toda la sociedad
                  civil.
                </p>
                <p>
                  Bajo esta concepción humanista y patriótica, la universidad proyectó su visión de consolidarse
                  como la institución líder en educación superior e investigación del país, reconocida tanto a
                  nivel nacional e internacional por su excelencia académica, su rigurosidad científica, su
                  carácter de vanguardia tecnológica, la vigencia de sus valores institucionales y su papel
                  protagónico en la consolidación de la soberanía e independencia tecnológica de la República
                  Bolivariana de Venezuela.
                </p>
                <p>
                  Hoy, bajo la gestión rectoral orientada a la excelencia y la modernización, la UNEFA vive una
                  era de profunda transformación y optimización de su infraestructura, el rescate integral de sus
                  espacios funcionales y el robustecimiento de sus programas de pregrado y postgrado de alta
                  calidad, garantizando un entorno académico que inspira y capacita a los líderes del nuevo
                  ecosistema profesional y tecnológico del país.
                </p>
                <p>
                  Para asegurar de manera efectiva una cobertura educativa inclusiva, equitativa y de calidad en
                  cada rincón de la geografía nacional, la universidad se organiza bajo un modelo
                  descentralizado de Gestión Regional articulado por ocho Vicerrectorados Regionales que
                  dirigen las políticas académicas, administrativas y productivas en los distintos ejes del
                  territorio venezolano; un despliegue operativo que se materializa a través de veintiséis núcleos
                  que operan como polos de desarrollo y conocimiento regional, veintisiete centros de
                  formación dependientes en calidad de extensiones que acercan la oferta académica a
                  comunidades clave, y diecisiete ampliaciones como espacios de aprendizaje estratégicos para
                  asegurar que la formación superior alcance a cada sector productivo y social.
                </p>
                <p className="text-brand-600 dark:text-brand-400 font-semibold text-center text-lg pt-4">
                  Esta sólida estructura convierte a la UNEFA en la red universitaria con mayor despliegue
                  territorial y compromiso social de Venezuela.
                </p>
              </motion.div>
            </div>
          </section>
        </SectionWrapper>

        {/* ─── Valores ──────────────────────────────── */}
        <SectionWrapper delay={0.25}>
          <section className="py-16 lg:py-20 bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center max-w-3xl mx-auto mb-16"
              >
                <h2 className="text-3xl font-bold text-text-emphasis mb-4">Nuestros Valores</h2>
                <p className="text-text-secondary">Los principios que guían nuestra labor educativa</p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { title: "Excelencia Académica", desc: "Compromiso con la calidad educativa y la rigurosidad científica", icon: "🎓" },
                  { title: "Patriotismo", desc: "Compromiso con la soberanía e independencia tecnológica de la nación", icon: "🇻🇪" },
                  { title: "Disciplina", desc: "Formación con sentido de responsabilidad, honor y eficiencia", icon: "⚡" },
                  { title: "Responsabilidad Social", desc: "Compromiso con el desarrollo integral del país", icon: "🤝" },
                  { title: "Innovación", desc: "Vanguardia tecnológica y adaptabilidad a nuevos desafíos", icon: "💡" },
                  { title: "Unión Cívico-Militar", desc: "Integración de civiles y militares en las aulas de clase", icon: "🤝" },
                ].map((valor, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -4 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-theme-sm hover:shadow-theme-md transition-all duration-200"
                  >
                    <div className="h-14 w-14 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-2xl mb-4">
                      {valor.icon}
                    </div>
                    <h3 className="text-lg font-bold text-text-emphasis mb-2">{valor.title}</h3>
                    <p className="text-sm text-text-secondary">{valor.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        </SectionWrapper>

        {/* ─── Símbolos Institucionales ──────────────── */}
        <SectionWrapper delay={0.3}>
          <section className="py-16 lg:py-20 bg-white dark:bg-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center max-w-3xl mx-auto mb-16"
              >
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-brand-500" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-text-emphasis mb-4">Símbolos Institucionales</h2>
                <p className="text-text-secondary">
                  Los emblemas que representan nuestra identidad como institución
                </p>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Escudo */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-500">
                      <Shield className="h-5 w-5" />
                    </div>
                    <h3 className="text-2xl font-bold text-text-emphasis">Escudo de la UNEFA</h3>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-8">
                    <div className="w-48 h-48 flex-shrink-0 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-theme-sm border border-gray-200 dark:border-gray-600">
                      <img
                        src="/unefa-img/Escudo.png"
                        alt="Escudo de la UNEFA"
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    </div>
                    <div className="space-y-4 text-text-secondary leading-relaxed">
                      <p>
                        El escudo de la UNEFA representa los valores institucionales de la universidad,
                        incorporando elementos simbólicos que reflejan su compromiso con la formación
                        de profesionales al servicio de la nación.
                      </p>
                      <p>
                        En su diseño se integran los colores y emblemas que identifican a la Fuerza Armada
                        Nacional Bolivariana, junto con símbolos del conocimiento y la excelencia académica.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Himno */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-500">
                      <Music className="h-5 w-5" />
                    </div>
                    <h3 className="text-2xl font-bold text-text-emphasis">Himno de la UNEFA</h3>
                  </div>

                  <div className="space-y-6 text-center">
                    {/* Coro */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-brand-200 dark:border-brand-800">
                      <p className="text-xs uppercase tracking-widest text-brand-500 font-semibold mb-3">Coro</p>
                      <p className="text-text-primary dark:text-white italic leading-relaxed text-lg">
                        "A tus aulas cual rico panal<br />
                        hoy venimos tu miel a beber<br />
                        de la ciencia anhelante soldados<br />
                        bajo luz de sapiencia y de fe."
                      </p>
                    </div>

                    {/* Estrofas */}
                    <div className="grid grid-cols-1 gap-4">
                      {[
                        {
                          num: "I",
                          text: "En tus venas discurre la savia\nde la patria, de estudio farol,\ny en tu surco levanta la espiga,\njuventud del esfuerzo creador.",
                        },
                        {
                          num: "II",
                          text: "Adalid que en tu paso adelante\nvas sembrando semillas de anhelos,\norientando las mentes a cumbres\nde ilusión, esperanzas y ensueños.",
                        },
                        {
                          num: "III",
                          text: "Con batuta de luz encaminas\nlos hombres por sendas de sol,\nel deber de tu voz de campanas,\nque en el alba despierta tu honor.",
                        },
                      ].map((estrofa) => (
                        <div
                          key={estrofa.num}
                          className="bg-white dark:bg-gray-800 rounded-lg px-5 py-4 border border-gray-100 dark:border-gray-700"
                        >
                          <p className="text-xs text-brand-500 font-bold mb-2">Estrofa {estrofa.num}</p>
                          <p className="text-text-secondary italic leading-relaxed whitespace-pre-line">{estrofa.text}</p>
                        </div>
                      ))}
                    </div>

                    <div className="text-xs text-text-tertiary pt-2 border-t border-gray-100 dark:border-gray-700">
                      <p><strong>Letra:</strong> Coronel (GN) Guillermo Parra García</p>
                      <p><strong>Música:</strong> Edgar Jesús Arteaga</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>
        </SectionWrapper>

        {/* ─── Estructura Organizativa ──────────────── */}
        <SectionWrapper delay={0.35}>
          <section className="py-16 lg:py-20 bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center max-w-3xl mx-auto mb-16"
              >
                <h2 className="text-3xl font-bold text-text-emphasis mb-4">Despliegue Territorial</h2>
                <p className="text-text-secondary">
                  La red universitaria con mayor presencia en la geografía nacional
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { number: "8", label: "Vicerrectorados Regionales", desc: "Gestión académica y administrativa descentralizada" },
                  { number: "26", label: "Núcleos", desc: "Polos de desarrollo y conocimiento regional" },
                  { number: "27", label: "Centros de Formación", desc: "Extensiones que acercan la oferta académica" },
                  { number: "17", label: "Ampliaciones", desc: "Espacios de aprendizaje estratégicos" },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-theme-sm border border-gray-100 dark:border-gray-700 text-center"
                  >
                    <div className="text-4xl font-bold text-brand-500 mb-2">{item.number}</div>
                    <h3 className="text-lg font-bold text-text-emphasis mb-2">{item.label}</h3>
                    <p className="text-sm text-text-secondary">{item.desc}</p>
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
