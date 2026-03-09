import { useState, useEffect, useCallback } from 'react';
import { landingConfigService } from '../services/landingConfigService';
import { LandingConfig } from '../types';

export const useLandingConfig = (forceRefresh = false) => {
  const [config, setConfig] = useState<LandingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await landingConfigService.getConfig(forceRefresh);
      setConfig(data);
    } catch (err) {
      console.error('[useLandingConfig] Error:', err);
      const defaultConfig = landingConfigService.getDefaultConfig();
      setConfig(defaultConfig);
    } finally {
      setLoading(false);
    }
  }, [forceRefresh]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const refreshConfig = useCallback(() => {
    landingConfigService.clearCache();
    return fetchConfig();
  }, [fetchConfig]);

  const updateCareers = useCallback(async (careers: LandingConfig['careers']) => {
    try {
      const data = await landingConfigService.updateCareers(careers);
      setConfig(data);
      return data;
    } catch (err) {
      console.error('[useLandingConfig] Error updating careers:', err);
      throw err;
    }
  }, []);

  const updateFAQs = useCallback(async (faqs: LandingConfig['faqs']) => {
    try {
      const data = await landingConfigService.updateFAQs(faqs);
      setConfig(data);
      return data;
    } catch (err) {
      console.error('[useLandingConfig] Error updating FAQs:', err);
      throw err;
    }
  }, []);

  const updateHero = useCallback(async (hero: Partial<LandingConfig['hero']>) => {
    try {
      const data = await landingConfigService.updateHero(hero);
      setConfig(data);
      return data;
    } catch (err) {
      console.error('[useLandingConfig] Error updating hero:', err);
      throw err;
    }
  }, []);

  const updateMissionVision = useCallback(async (missionVision: Partial<LandingConfig['missionVision']>) => {
    try {
      const data = await landingConfigService.updateMissionVision(missionVision);
      setConfig(data);
      return data;
    } catch (err) {
      console.error('[useLandingConfig] Error updating mission/vision:', err);
      throw err;
    }
  }, []);

  const updateGraduateStats = useCallback(async (stats: Partial<LandingConfig['graduateStats']>) => {
    try {
      const data = await landingConfigService.updateGraduateStats(stats);
      setConfig(data);
      return data;
    } catch (err) {
      console.error('[useLandingConfig] Error updating graduate stats:', err);
      throw err;
    }
  }, []);

  return {
    config,
    loading,
    error,
    refreshConfig,
    updateCareers,
    updateFAQs,
    updateHero,
    updateMissionVision,
    updateGraduateStats
  };
};