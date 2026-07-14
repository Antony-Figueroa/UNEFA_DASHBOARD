import React from "react";
import ComponentCard from "../../../components/common/ComponentCard";
import CountUp from "../components/CountUp";

const GraduateStatsSection: React.FC = () => {
  return (
    <section className="bg-white py-16 lg:py-20 dark:bg-bg-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-text-emphasis sm:text-4xl mb-4 uppercase tracking-tight">
            Ficha de Datos: Pasantías y Prácticas Profesionales
          </h2>
          <div className="h-1.5 w-24 bg-brand-500 mx-auto rounded-full mb-6" />
          <p className="max-w-3xl mx-auto text-lg text-text-secondary">
            Estimado Histórico y Estadísticas de Cumplimiento Académico - Extensión Acarigua (2008 - 2025).
          </p>
        </div>

        {/* Global Stats - Static Data */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <ComponentCard title="Total Acumulado" className="bg-linear-to-br from-brand-500/10 to-transparent">
            <div className="text-center py-6">
              <p className="text-4xl font-bold text-brand-500 mb-2">
                <CountUp from={0} to={3200} duration={2} /> - <CountUp from={0} to={5100} duration={2.5} />
              </p>
              <p className="text-sm font-medium text-text-secondary uppercase tracking-wider">
                Estudiantes en Pasantías
              </p>
            </div>
          </ComponentCard>

          <ComponentCard title="Promedio Anual" className="bg-linear-to-br from-brand-500/10 to-transparent">
            <div className="text-center py-6">
              <p className="text-4xl font-bold text-brand-500 mb-2">
                <CountUp from={0} to={180} duration={2} /> - <CountUp from={0} to={350} duration={2.5} />
              </p>
              <p className="text-sm font-medium text-text-secondary uppercase tracking-wider">
                Pasantes por Ciclo
              </p>
            </div>
          </ComponentCard>

          <ComponentCard title="Tasa de Cumplimiento" className="bg-linear-to-br from-brand-500/10 to-transparent">
            <div className="text-center py-6">
              <p className="text-5xl font-bold text-brand-500 mb-2">
                ~<CountUp from={0} to={98} duration={2} />%
              </p>
              <p className="text-sm font-medium text-text-secondary uppercase tracking-wider">
                Inicio de Pasantías
              </p>
            </div>
          </ComponentCard>
        </div>

        {/* Breakdown by Location - Simplified to only Acarigua */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-8">
            <div className="bg-bg-secondary dark:bg-white/5 p-6 sm:p-8 rounded-2xl border border-border-light dark:border-border-dark shadow-theme-md">
              <h3 className="text-2xl font-bold text-text-emphasis mb-4 flex items-center gap-3">
                <span className="h-8 w-1.5 bg-brand-500 rounded-full" />
                Definición del Proceso
              </h3>
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-bold text-text-tertiary uppercase mb-1">Término Académico</p>
                  <p className="text-text-primary font-medium text-lg">Prácticas Profesionales (Pasantías)</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-text-tertiary uppercase mb-1">Carácter</p>
                  <p className="text-text-primary font-medium">Obligatorio y curricular para todas las carreras de pregrado (T.S.U., Ingeniería y Licenciatura).</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-text-tertiary uppercase mb-1">Duración Promedio</p>
                  <p className="text-text-primary font-medium">Entre 12 y 16 semanas (dependiendo del diseño curricular de la carrera).</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-bg-secondary dark:bg-white/5 p-6 sm:p-8 rounded-2xl border border-border-light dark:border-border-dark shadow-theme-md">
            <h3 className="text-2xl font-bold text-text-emphasis mb-6 flex items-center gap-3">
              <span className="h-8 w-1.5 bg-brand-500 rounded-full" />
              Relación Pasantía vs. Graduación
            </h3>
            <ul className="space-y-6">
              <li className="flex gap-4">
                <div className="h-6 w-6 shrink-0 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-500 text-xs font-bold">1</div>
                <div>
                  <h4 className="font-bold text-text-primary">Factor de Conversión</h4>
                  <p className="text-sm text-text-secondary">Se estima que el número de pasantes es un <span className="font-bold text-brand-500">10-15% superior</span> al número de graduados finales.</p>
                  <p className="text-xs text-text-tertiary mt-2">Nota: Estudiantes que completan la práctica pero postergan el Trabajo Especial de Grado (TEG) o el acto administrativo.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="h-6 w-6 shrink-0 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-500 text-xs font-bold">2</div>
                <div>
                  <h4 className="font-bold text-text-primary">Ubicación y Alcance</h4>
                  <p className="text-sm text-text-secondary">Los estudiantes inician sus pasantías predominantemente en empresas de la región <span className="font-bold text-brand-500">Acarigua-Araure</span>.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="h-6 w-6 shrink-0 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-500 text-xs font-bold">3</div>
                <div>
                  <h4 className="font-bold text-text-primary">Efectividad Académica</h4>
                  <p className="text-sm text-text-secondary">~98% de los estudiantes que llegan al último semestre inician exitosamente su vinculación con el sector productivo.</p>
                </div>
              </li>
            </ul>
            <div className="mt-8 pt-8 border-t border-border-light dark:border-border-dark">
              <div className="p-4 bg-brand-500/10 rounded-xl border border-brand-500/20">
                <p className="text-xs text-text-tertiary italic">
                  <span className="font-bold text-text-secondary block mb-1">Nota de Datos:</span>
                  Cifras consolidadas con base en los registros históricos de la Unidad de Gestión Educativa.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GraduateStatsSection;
