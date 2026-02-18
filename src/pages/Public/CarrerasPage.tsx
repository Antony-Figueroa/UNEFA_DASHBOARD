import React from "react";
import PageMeta from "../../components/common/PageMeta";
import PublicNavbar from "../../features/internship-home/components/PublicNavbar";
import PublicFooter from "../../features/internship-home/components/PublicFooter";
import TopBanner from "../../components/layout/TopBanner";
import { motion } from "framer-motion";

interface CarreraInfo {
  id: string;
  nombre: string;
  codigo: string;
  abreviatura: string;
  tipo: "Ingeniería" | "Técnica" | "Licenciatura";
  duracion: string;
  descripcion: string;
  perfil: string[];
  campoLaboral: string[];
  requisitos: string[];
}

const carreras: CarreraInfo[] = [
  {
    id: "1",
    nombre: "Ingeniería de Sistemas",
    codigo: "ING-SIST",
    abreviatura: "ING. SIST",
    tipo: "Ingeniería",
    duracion: "5 años (10 semestres)",
    descripcion: "Formación de profesionales capaces de diseñar, desarrollar e implementar sistemas informáticos y soluciones tecnológicas para organizaciones.",
    perfil: [
      "Desarrollo de software",
      "Administración de redes y bases de datos",
      "Análisis de sistemas",
      "Gestión de proyectos tecnológicos",
    ],
    campoLaboral: [
      "Empresas de tecnología",
      "Sector bancario y financiero",
      "Instituciones públicas",
      "Consultorías tecnológicas",
    ],
    requisitos: [
      "Haber aprobado el 70% de las unidades curriculares",
      "Constancia de inscripción actualizada",
      "Carta de buena conducta",
    ],
  },
  {
    id: "2",
    nombre: "Ingeniería Civil",
    codigo: "ING-CIVIL",
    abreviatura: "ING. CIVIL",
    tipo: "Ingeniería",
    duracion: "5 años (10 semestres)",
    descripcion: "Profesionales especializados en el diseño, construcción y mantenimiento de obras civiles como edificios, puentes, carreteras e infraestructura.",
    perfil: [
      "Diseño estructural",
      "Gestión de obras",
      "Topografía y geodesia",
      "Materiales de construcción",
    ],
    campoLaboral: [
      "Construcción civil",
      "Empresas contratistas",
      "Instituciones del Estado",
      "Consultorías de ingeniería",
    ],
    requisitos: [
      "Haber aprobado el 70% de las unidades curriculares",
      "Constancia de inscripción actualizada",
      "Examen médico ocupacional",
    ],
  },
  {
    id: "3",
    nombre: "Ingeniería Electrónica",
    codigo: "ING-ELEC",
    abreviatura: "ING. ELEC",
    tipo: "Ingeniería",
    duracion: "5 años (10 semestres)",
    descripcion: "Formación de profesionales en el diseño, desarrollo y mantenimiento de sistemas electrónicos y de automatización.",
    perfil: [
      "Electrónica analógica y digital",
      "Sistemas embebidos",
      "Automatización industrial",
      "Telecomunicaciones",
    ],
    campoLaboral: [
      "Industria manufacturera",
      "Telecomunicaciones",
      "Mantenimiento industrial",
      "Desarrollo de dispositivos electrónicos",
    ],
    requisitos: [
      "Haber aprobado el 70% de las unidades curriculares",
      "Constancia de inscripción actualizada",
      "Conocimientos en física y matemáticas avanzadas",
    ],
  },
  {
    id: "4",
    nombre: "Técnica Superior en Informática",
    codigo: "TEC-INF",
    abreviatura: "TSU INF",
    tipo: "Técnica",
    duracion: "3 años (6 semestres)",
    descripcion: "Formación de técnicos especializados en programación, soporte técnico y administración de sistemas básicos.",
    perfil: [
      "Programación web y de aplicaciones",
      "Soporte técnico",
      "Administración de bases de datos",
      "Redes locales",
    ],
    campoLaboral: [
      "Centros de soporte técnico",
      "Empresas de desarrollo de software",
      "Departamentos de TI en empresas",
      "Trabajo independiente como freelancer",
    ],
    requisitos: [
      "Haber completado todas las unidades del pensum",
      "Constancia de inscripción actualizada",
    ],
  },
  {
    id: "5",
    nombre: "Licenciatura en Administración",
    codigo: "LIC-ADM",
    abreviatura: "LIC. ADM",
    tipo: "Licenciatura",
    duracion: "4 años (8 semestres)",
    descripcion: "Profesionales capaces de planificar, organizar, dirigir y controlar los recursos de una organización.",
    perfil: [
      "Gestión empresarial",
      "Recursos humanos",
      "Finanzas y contabilidad",
      "Marketing",
    ],
    campoLaboral: [
      "Empresas privadas",
      "Sector público",
      "Consultorías",
      "Emprendimiento",
    ],
    requisitos: [
      "Haber aprobado el 70% de las unidades curriculares",
      "Constancia de inscripción actualizada",
      "Conocimientos básicos de ofimática",
    ],
  },
];

const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-br from-bg-main via-white to-brand-50/30 dark:from-bg-dark dark:via-gray-900 dark:to-brand-950/20" />
      
      <motion.div
        className="absolute top-1/4 left-0 w-[400px] h-[400px] rounded-full opacity-20 dark:opacity-8"
        style={{ background: 'radial-gradient(circle, var(--color-brand-400) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.2, 1], x: [0, 20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      
      <motion.div
        className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full opacity-15 dark:opacity-6"
        style={{ background: 'radial-gradient(circle, var(--color-success-400) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.3, 1], x: [0, -30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 5 }}
      />
    </div>
  );
};

const CarreraCard: React.FC<{ carrera: CarreraInfo; index: number }> = ({ carrera, index }) => {
  const [expanded, setExpanded] = React.useState(false);

  const tipoColors: Record<string, string> = {
    "Ingeniería": "bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400",
    "Técnica": "bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400",
    "Licenciatura": "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ y: -4 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-theme-sm overflow-hidden border border-gray-100 dark:border-gray-700"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <motion.span 
              className={`inline-block px-3 py-1 text-xs font-medium rounded-full mb-2 ${tipoColors[carrera.tipo]}`}
              whileHover={{ scale: 1.05 }}
            >
              {carrera.tipo}
            </motion.span>
            <motion.h3 
              className="text-xl font-bold text-text-emphasis"
              whileHover={{ color: "var(--color-brand-500)" }}
            >
              {carrera.nombre}
            </motion.h3>
            <p className="text-sm text-text-secondary">{carrera.codigo} • {carrera.duracion}</p>
          </div>
          <motion.span 
            className="text-2xl font-black text-brand-500 opacity-30"
            initial={{ opacity: 0.3 }}
            whileHover={{ opacity: 0.6, scale: 1.1 }}
          >
            {carrera.abreviatura}
          </motion.span>
        </div>

        <motion.p 
          className="text-text-secondary mb-6"
          initial={{ opacity: 0.8 }}
        >
          {carrera.descripcion}
        </motion.p>

        <motion.button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-3 px-4 rounded-xl bg-gray-50 dark:bg-gray-700 text-text-emphasis font-medium flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <span>{expanded ? "Ver menos" : "Ver más información"}</span>
          <motion.svg
            className="w-5 h-5"
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </motion.svg>
        </motion.button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4"
            >
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <h4 className="font-semibold text-text-emphasis mb-2 flex items-center gap-2">
                  <svg className="h-4 w-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Perfil Profesional
                </h4>
                <ul className="space-y-1">
                  {carrera.perfil.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h4 className="font-semibold text-text-emphasis mb-2 flex items-center gap-2">
                  <svg className="h-4 w-4 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Campo Laboral
                </h4>
                <ul className="space-y-1">
                  {carrera.campoLaboral.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                      <span className="h-1.5 w-1.5 rounded-full bg-success-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h4 className="font-semibold text-text-emphasis mb-2 flex items-center gap-2">
                  <svg className="h-4 w-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Requisitos para Pasantías
                </h4>
                <ul className="space-y-1">
                  {carrera.requisitos.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                      <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const CarrerasPage: React.FC = React.memo(() => {
  const [filtroTipo, setFiltroTipo] = React.useState<string>("todos");

  const carrerasFiltradas = React.useMemo(() => {
    if (filtroTipo === "todos") return carreras;
    return carreras.filter((c) => c.tipo === filtroTipo);
  }, [filtroTipo]);

  const filterButtons = [
    { value: "todos", label: "Todas" },
    { value: "Ingeniería", label: "Ingeniería" },
    { value: "Técnica", label: "Técnica" },
    { value: "Licenciatura", label: "Licenciatura" },
  ];

  return (
    <div className="min-h-screen bg-bg-main dark:bg-bg-dark relative">
      <PageMeta
        title="Carreras | UNEFA"
        description="Explora las carreras disponibles en la UNEFA. Conoce perfiles profesionales, campo laboral y requisitos."
      />

      <AnimatedBackground />

      <div className="sticky top-0 z-9999 w-full" role="banner">
        <TopBanner />
        <PublicNavbar />
      </div>

      <main role="main" aria-label="Contenido principal">
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="py-20 bg-gradient-to-br from-brand-500/10 via-brand-600/5 to-transparent"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.h1 
              className="text-4xl md:text-5xl font-bold text-text-emphasis mb-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              Nuestras Carreras
            </motion.h1>
            <motion.p 
              className="text-xl text-text-secondary max-w-3xl mx-auto"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Conoce las diferentes opciones académicas que ofrece la UNEFA y encuentra la mejor opción para tu futuro profesional
            </motion.p>
          </div>
        </motion.section>

        <motion.section 
          className="py-8 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-y border-gray-200 dark:border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap gap-4 justify-center">
              {filterButtons.map((btn) => (
                <motion.button
                  key={btn.value}
                  onClick={() => setFiltroTipo(btn.value)}
                  className={`px-6 py-2.5 rounded-full font-medium transition-all ${
                    filtroTipo === btn.value
                      ? "bg-brand-500 text-white shadow-lg"
                      : "bg-gray-100 dark:bg-gray-700 text-text-secondary hover:bg-brand-100 dark:hover:bg-brand-900/30 hover:text-brand-600"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {btn.label}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.section>

        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {carrerasFiltradas.map((carrera, index) => (
                <CarreraCard key={carrera.id} carrera={carrera} index={index} />
              ))}
            </motion.div>

            {carrerasFiltradas.length === 0 && (
              <div className="text-center py-12">
                <p className="text-text-secondary">No se encontraron carreras con ese filtro.</p>
              </div>
            )}
          </div>
        </section>

        <motion.section 
          className="py-16 bg-gray-50 dark:bg-gray-900"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold text-text-emphasis mb-4">
              ¿Necesitas más información?
            </h2>
            <p className="text-text-secondary mb-6">
              Si tienes dudas sobre alguna carrera o necesitas más detalles, no dudes en contactarnos.
            </p>
            <motion.a
              href="/contacto"
              className="inline-flex items-center px-6 py-3 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Contáctanos
            </motion.a>
          </div>
        </motion.section>
      </main>

      <footer role="contentinfo" aria-label="Pie de página">
        <PublicFooter />
      </footer>
    </div>
  );
});

const AnimatePresence: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);

export default CarrerasPage;
