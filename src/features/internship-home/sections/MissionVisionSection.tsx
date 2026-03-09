import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaBullseye, FaEye } from "react-icons/fa6";
import { landingConfigService } from "../../landing-config/services/landingConfigService";
import { LandingMissionVision } from "../../landing-config/types";

const MissionVisionSection: React.FC = () => {
  const [missionVision, setMissionVision] = useState<LandingMissionVision | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMissionVision = async () => {
      try {
        const config = await landingConfigService.getConfig();
        setMissionVision(config.missionVision);
      } catch (error) {
        console.error("[MissionVisionSection] Error loading mission/vision:", error);
        const defaultConfig = landingConfigService.getDefaultConfig();
        setMissionVision(defaultConfig.missionVision);
      } finally {
        setLoading(false);
      }
    };

    loadMissionVision();
  }, []);

  if (loading || !missionVision) {
    return (
      <section id="mision-vision" className="py-20 bg-white dark:bg-bg-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {[1, 2].map((i) => (
              <div key={i} className="p-8 rounded-3xl bg-gray-100 dark:bg-gray-800 animate-pulse">
                <div className="h-14 w-14 rounded-2xl bg-gray-300 dark:bg-gray-700 mb-6" />
                <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                <div className="space-y-2">
                  <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="mision-vision" className="py-20 bg-white dark:bg-bg-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative p-8 rounded-3xl bg-bg-secondary/40 dark:bg-white/5 border border-border-light dark:border-white/10 transition-all duration-300 hover:shadow-theme-lg group"
          >
            <div className="flex items-center gap-4 mb-6">
              <motion.div
                whileHover={{ scale: 1.15, rotate: 10 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-theme-sm group-hover:scale-110 transition-transform duration-300"
              >
                <FaBullseye className="text-2xl" />
              </motion.div>
              <h2 className="text-3xl font-bold text-text-emphasis">{missionVision.missionTitle}</h2>
            </div>
            <p className="text-lg leading-relaxed text-text-secondary dark:text-text-tertiary text-justify">
              {missionVision.missionText}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative p-8 rounded-3xl bg-bg-secondary/40 dark:bg-white/5 border border-border-light dark:border-white/10 transition-all duration-300 hover:shadow-theme-lg group"
          >
            <div className="flex items-center gap-4 mb-6">
              <motion.div
                whileHover={{ scale: 1.15, rotate: -10 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-theme-sm group-hover:scale-110 transition-transform duration-300"
              >
                <FaEye className="text-2xl" />
              </motion.div>
              <h2 className="text-3xl font-bold text-text-emphasis">{missionVision.visionTitle}</h2>
            </div>
            <p className="text-lg leading-relaxed text-text-secondary dark:text-text-tertiary text-justify">
              {missionVision.visionText}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default MissionVisionSection;