import React from "react";
import ComponentCard from "../../../components/common/ComponentCard";
import CountUp from "../components/CountUp";

const GraduateStatsSection: React.FC = () => {
  return (
    <section className="bg-white py-24 dark:bg-bg-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-text-emphasis sm:text-4xl mb-4">
            Reporte Estadístico: Pasantías y Prácticas Profesionales
          </h2>
          <div className="h-1.5 w-24 bg-[#2d90c4] mx-auto rounded-full mb-6" />
          <p className="max-w-3xl mx-auto text-lg text-text-secondary">
            Análisis histórico del impacto de las prácticas profesionales en la Extensión Acarigua (2008 - 2025).
          </p>
        </div>

        {/* Global Stats - Focused on Acarigua */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <ComponentCard title="Pasantes Acarigua" className="bg-linear-to-br from-[#2d90c4]/10 to-transparent">
            <div className="text-center py-6">
              <p className="text-5xl font-bold text-[#2d90c4] mb-2">
                +<CountUp from={0} to={3500} duration={2} />
              </p>
              <p className="text-sm font-medium text-text-secondary uppercase tracking-wider">
                Total Acumulado (Est.)
              </p>
            </div>
          </ComponentCard>

          <ComponentCard title="Promedio Anual" className="bg-linear-to-br from-[#2d90c4]/10 to-transparent">
            <div className="text-center py-6">
              <p className="text-5xl font-bold text-[#2d90c4] mb-2">
                +<CountUp from={0} to={100} duration={2} />
              </p>
              <p className="text-sm font-medium text-text-secondary uppercase tracking-wider">
                Pasantes por Ciclo
              </p>
            </div>
          </ComponentCard>

          <ComponentCard title="Tasa de Cumplimiento" className="bg-linear-to-br from-[#2d90c4]/10 to-transparent">
            <div className="text-center py-6">
              <p className="text-5xl font-bold text-[#2d90c4] mb-2">
                98%
              </p>
              <p className="text-sm font-medium text-text-secondary uppercase tracking-wider">
                Efectividad en Colocación
              </p>
            </div>
          </ComponentCard>
        </div>

        {/* Breakdown by Location - Simplified to only Acarigua */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-8">
            <div className="bg-bg-secondary dark:bg-white/5 p-8 rounded-2xl border border-border-light dark:border-border-dark shadow-theme-md">
              <h3 className="text-2xl font-bold text-text-emphasis mb-4 flex items-center gap-3">
                <span className="h-8 w-1.5 bg-[#2d90c4] rounded-full" />
                Identificación Institucional
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-bold text-text-tertiary uppercase">Universidad</p>
                  <p className="text-text-primary font-medium">Universidad Nacional Experimental Politécnica de la Fuerza Armada Nacional Bolivariana</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-text-tertiary uppercase">Unidad Académica</p>
                  <p className="text-text-primary font-medium">Extensión Acarigua</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-text-tertiary uppercase">Ubicación</p>
                  <p className="text-text-primary font-medium">Municipio Páez, Estado Portuguesa, Venezuela</p>
                </div>
              </div>
            </div>

            <div className="bg-bg-secondary dark:bg-white/5 p-8 rounded-2xl border border-border-light dark:border-border-dark shadow-theme-md">
              <h3 className="text-2xl font-bold text-text-emphasis mb-6 flex items-center gap-3">
                <span className="h-8 w-1.5 bg-[#2d90c4] rounded-full" />
                Cronología Operativa
              </h3>
              <div className="relative border-l-2 border-[#2d90c4]/30 ml-3 space-y-8 pb-1">
                <div className="relative pl-8">
                  <div className="absolute -left-2.25 top-1 h-4 w-4 rounded-full bg-[#2d90c4]" />
                  <p className="text-xs font-bold text-[#2d90c4] uppercase">Año 2008</p>
                  <h4 className="font-bold text-text-primary">Primeras Cohortes de Prácticas</h4>
                </div>
                <div className="relative pl-8">
                  <div className="absolute -left-2.25 top-1 h-4 w-4 rounded-full bg-[#2d90c4]" />
                  <p className="text-xs font-bold text-[#2d90c4] uppercase">Año 2015</p>
                  <h4 className="font-bold text-text-primary">Máximo Histórico de Activos (1,366)</h4>
                </div>
                <div className="relative pl-8">
                  <div className="absolute -left-2.25 top-1 h-4 w-4 rounded-full bg-[#2d90c4]" />
                  <p className="text-xs font-bold text-[#2d90c4] uppercase">2025</p>
                  <h4 className="font-bold text-text-primary">Consolidación Sector Agroindustrial</h4>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-bg-secondary dark:bg-white/5 p-8 rounded-3xl border border-border-light dark:border-border-dark shadow-theme-md">
            <h3 className="text-2xl font-bold text-text-emphasis mb-6">Ficha Técnica: Pasantías Acarigua</h3>
            <ul className="space-y-6">
              <li className="flex gap-4">
                <div className="h-6 w-6 shrink-0 rounded-full bg-[#2d90c4]/20 flex items-center justify-center text-[#2d90c4] text-xs font-bold">1</div>
                <div>
                  <h4 className="font-bold text-text-primary">Resumen del Proceso</h4>
                  <p className="text-sm text-text-secondary">Prácticas Profesionales obligatorias de 12 a 16 semanas. Carácter curricular para todas las carreras.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="h-6 w-6 shrink-0 rounded-full bg-[#2d90c4]/20 flex items-center justify-center text-[#2d90c4] text-xs font-bold">2</div>
                <div>
                  <h4 className="font-bold text-text-primary">Principales Sectores de Colocación</h4>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    <p className="text-xs text-text-secondary"><span className="font-bold">Agroindustrial:</span> Centrales azucareros, plantas de arroz y silos.</p>
                    <p className="text-xs text-text-secondary"><span className="font-bold">Sector Público:</span> Alcaldías, institutos autónomos y seguridad.</p>
                    <p className="text-xs text-text-secondary"><span className="font-bold">Sector Salud:</span> Hospitales y ambulatorios (Páez y Araure).</p>
                  </div>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="h-6 w-6 shrink-0 rounded-full bg-[#2d90c4]/20 flex items-center justify-center text-[#2d90c4] text-xs font-bold">3</div>
                <div>
                  <h4 className="font-bold text-text-primary">Impacto Regional</h4>
                  <p className="text-sm text-text-secondary">Alta rotación en el sector privado debido al polo de desarrollo industrial Acarigua-Araure.</p>
                </div>
              </li>
            </ul>
            <div className="mt-8 pt-8 border-t border-border-light dark:border-border-dark">
              <div className="p-4 bg-brand-500/10 rounded-xl border border-brand-500/20">
                <p className="text-xs text-text-tertiary italic">
                  <span className="font-bold text-text-secondary block mb-1">Nota de Proyección:</span>
                  Datos basados en la matrícula histórica (ej. 1,366 activos en 2015) y registros de cohortes de la Extensión Acarigua.
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
