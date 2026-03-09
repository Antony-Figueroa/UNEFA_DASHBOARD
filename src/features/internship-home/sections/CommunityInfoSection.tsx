import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Badge, { BadgeColor } from "../../../components/ui/badge/Badge";
import { landingConfigService } from "../../landing-config/services/landingConfigService";
import { LandingCareer } from "../../landing-config/types";

const colorMap: Record<string, BadgeColor> = {
  primary: "primary",
  success: "success",
  info: "info",
  warning: "warning",
  error: "error",
};

const CommunityInfoSection: React.FC = () => {
  const [careers, setCareers] = useState<LandingCareer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCareers = async () => {
      try {
        const config = await landingConfigService.getConfig();
        setCareers(config.careers.filter(c => c.active).sort((a, b) => a.order - b.order));
      } catch (error) {
        console.error("[CommunityInfoSection] Error loading careers:", error);
        const defaultConfig = landingConfigService.getDefaultConfig();
        setCareers(defaultConfig.careers);
      } finally {
        setLoading(false);
      }
    };

    loadCareers();
  }, []);

  if (loading) {
    return (
      <section id="ofertas" className="py-24 bg-gray-50 dark:bg-bg-dark/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="space-y-4">
              <div className="h-10 w-72 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-6 w-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="ofertas" className="py-24 bg-gray-50 dark:bg-bg-dark/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-text-emphasis sm:text-4xl">
              Oferta Académica: Extensión Acarigua
            </h2>
            <p className="max-w-2xl text-lg text-text-secondary">
              Explora las carreras disponibles exclusivamente en nuestra sede Acarigua. Formación de excelencia para el desarrollo de la región.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {careers.map((career, index) => (
            <motion.div
              key={career.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative group rounded-2xl overflow-hidden shadow-theme-md bg-white dark:bg-bg-dark border border-border-light dark:border-border-dark hover:shadow-theme-lg transition-all duration-300"
            >
              <div className="relative h-56 overflow-hidden">
                <img
                  src={career.image}
                  alt={career.title}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                <div className="absolute top-4 left-4">
                  <Badge color={colorMap[career.color] || "primary"} className="font-semibold">
                    {career.category}
                  </Badge>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-text-emphasis mb-2 group-hover:text-brand-600 transition-colors">
                  {career.title}
                </h3>
                <p className="text-sm text-text-secondary line-clamp-3">
                  {career.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CommunityInfoSection;