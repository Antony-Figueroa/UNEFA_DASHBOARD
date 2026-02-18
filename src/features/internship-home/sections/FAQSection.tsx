import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FAQItem {
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    question: "¿Cuáles son los requisitos para iniciar mis prácticas profesionales?",
    answer: "Para iniciar tus prácticas profesionales debes haber completado al menos el 70% de las unidades curriculares de tu pensum, estar oficialmente inscrito en el período académico correspondiente y haber entregado toda la documentación requerida por la Coordinación de Pasantías.",
  },
  {
    question: "¿Cuántas horas de pasantía debo realizar?",
    answer: "La carga horaria varía según la carrera. Generalmente se requieren entre 480 y 600 horas de prácticas, distribuidas durante un período de 3 a 6 meses dependiendo de la disponibilidad del estudiante y los requerimientos de la carrera.",
  },
  {
    question: "¿Puedo realizar mis pasantías en cualquier empresa?",
    answer: "Las empresas o instituciones donde realices tus prácticas deben estar previamente registradas y avaladas por la UNEFA. Puedes consultar el listado de instituciones aliadas en nuestra plataforma o proponer una nueva institución que será evaluada por la Coordinación.",
  },
  {
    question: "¿Qué documentos debo entregar para la preinscripción?",
    answer: "Los documentos requeridos incluyen: carta de postulación, constancia de inscripción actualizada, certificado de notas, fotografía reciente, copia de cédula de identidad y formato de datos personales debidamente diligenciado.",
  },
  {
    question: "¿Quién me tutora durante las prácticas profesionales?",
    answer: "Durante tus pasantías contarás con dos tutores: un Tutor Académico (docente de la UNEFA) quien supervisa el cumplimiento académico, y un Tutor Empresarial (profesional de la institución receptora) quien guía tu trabajo diario.",
  },
  {
    question: "¿Las pasantías son remuneradas?",
    answer: "La remuneración depende de las políticas de cada institución receptora. Algunas empresas ofrecen stipends o beneficios como transporte y alimentación, aunque no es un requisito obligatorio. Esto debe negociarse directamente con la empresa.",
  },
  {
    question: "¿Qué sucede si debo suspender mis pasantías?",
    answer: "En caso de fuerza mayor, debes informar inmediatamente a tu Tutor Académico y gestionar la suspensión formal ante la Coordinación de Pasantías. Podrás reanudar tus prácticas una vez se resuelva la situación, siempre dentro del período académico vigente.",
  },
  {
    question: "¿Cómo se evalúa el desempeño en las pasantías?",
    answer: "La evaluación consta de tres componentes: informe técnico presentado (40%), evaluación del tutor empresarial (30%) y evaluación del tutor académico mediante visitas y seguimiento (30%). Debes obtener una calificación mínima de 10 puntos para aprobar.",
  },
];

const FAQItemComponent: React.FC<{ item: FAQItem; index: number }> = ({ item, index }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="border-b border-gray-200 dark:border-gray-700 last:border-b-0"
    >
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 rounded-lg group"
        whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
        transition={{ duration: 0.2 }}
      >
        <span className="text-lg font-medium text-text-emphasis pr-8 group-hover:text-brand-600 transition-colors">
          {item.question}
        </span>
        <motion.span
          className="flex-shrink-0 ml-4 relative"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="h-10 w-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white transition-colors">
            <svg
              className="h-5 w-5 text-brand-500 group-hover:text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </motion.span>
      </motion.button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <motion.p
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="pb-6 text-text-secondary leading-relaxed pl-4 border-l-2 border-brand-300 ml-2"
            >
              {item.answer}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const FAQSection: React.FC = () => {
  return (
    <section id="faq" className="py-24 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-brand-100 dark:bg-brand-900/10 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-success-100 dark:bg-success-900/10 rounded-full blur-3xl opacity-50" />
      </div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="inline-block px-4 py-1.5 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-sm font-medium mb-4"
          >
            ¿Tienes dudas?
          </motion.span>
          <h2 className="text-3xl font-bold text-text-emphasis sm:text-4xl mb-4">
            Preguntas Frecuentes
          </h2>
          <p className="text-lg text-text-secondary">
            Encuentra respuestas a las dudas más comunes sobre el proceso de prácticas profesionales.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-theme-sm p-6 sm:p-10 border border-gray-100 dark:border-gray-700"
        >
          {faqItems.map((item, index) => (
            <FAQItemComponent key={index} item={item} index={index} />
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-12 text-center"
        >
          <p className="text-text-secondary">
            ¿Aún tienes dudas?{" "}
            <a
              href="/contacto"
              className="text-brand-500 hover:text-brand-600 font-medium underline underline-offset-4 transition-colors"
            >
              Contáctanos
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
