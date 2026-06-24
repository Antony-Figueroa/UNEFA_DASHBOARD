import React, { useState, useEffect, useCallback } from 'react';
import PageMeta from '../../../../components/common/PageMeta';
import PageBreadcrumb from '../../../../components/common/PageBreadCrumb';
import { landingConfigService } from '../../../../features/landing-config/services/landingConfigService';
import { LandingConfig, LandingCareer, LandingFAQ } from '../../../../features/landing-config/types';
import toast from 'react-hot-toast';
import ConfigLayout from '../../ConfigLayout';
import HeroSectionEditor from './components/HeroSectionEditor';
import MissionVisionEditor from './components/MissionVisionEditor';
import CareersEditor from './components/CareersEditor';
import FaqEditor from './components/FaqEditor';

type TabType = 'hero' | 'mission' | 'careers' | 'faqs';

const tabs: { id: TabType; label: string }[] = [
  { id: 'hero', label: 'Hero' },
  { id: 'mission', label: 'Misión/Visión' },
  { id: 'careers', label: 'Carreras' },
  { id: 'faqs', label: 'FAQs' },
];

const LandingConfigPage: React.FC = () => {
  const [config, setConfig] = useState<LandingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('hero');

  const [heroForm, setHeroForm] = useState({
    title: '',
    subtitle: '',
    highlightTexts: '',
    statsText: '',
    statsCount: 0,
    mainImage: '',
    successCardValue: '',
    companiesCardValue: '',
  });

  const [missionVisionForm, setMissionVisionForm] = useState({
    missionTitle: '',
    missionText: '',
    visionTitle: '',
    visionText: '',
  });

  const [careersForm, setCareersForm] = useState<LandingCareer[]>([]);
  const [faqsForm, setFaqsForm] = useState<LandingFAQ[]>([]);

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const data = await landingConfigService.getConfig();
      setConfig(data);
      
      setHeroForm({
        title: data.hero.title || '',
        subtitle: data.hero.subtitle || '',
        highlightTexts: (data.hero.highlightTexts || []).join(', '),
        statsText: data.hero.statsText || '',
        statsCount: data.hero.statsCount || 0,
        mainImage: data.hero.mainImage || '',
        successCardValue: data.hero.successCardValue || '',
        companiesCardValue: data.hero.companiesCardValue || '',
      });
      
      setMissionVisionForm({
        missionTitle: data.missionVision.missionTitle || '',
        missionText: data.missionVision.missionText || '',
        visionTitle: data.missionVision.visionTitle || '',
        visionText: data.missionVision.visionText || '',
      });
      
      setCareersForm(data.careers || []);
      setFaqsForm(data.faqs || []);
    } catch (error) {
      console.error('[LandingConfigPage] Error loading config:', error);
      toast.error('Error al cargar la configuración');
      const defaultConfig = landingConfigService.getDefaultConfig();
      setConfig(defaultConfig);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSaveHero = async () => {
    try {
      setSaving(true);
      const updated = await landingConfigService.updateHero({
        ...config?.hero,
        title: heroForm.title,
        subtitle: heroForm.subtitle,
        highlightTexts: heroForm.highlightTexts.split(',').map((s: string) => s.trim()).filter(Boolean),
        statsText: heroForm.statsText,
        statsCount: heroForm.statsCount,
        mainImage: heroForm.mainImage,
        successCardValue: heroForm.successCardValue,
        companiesCardValue: heroForm.companiesCardValue,
      });
      setConfig(updated);
      toast.success('Hero actualizado exitosamente');
    } catch (error) {
      console.error('[LandingConfigPage] Error saving hero:', error);
      toast.error('Error al guardar el hero');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMissionVision = async () => {
    try {
      setSaving(true);
      const updated = await landingConfigService.updateMissionVision(missionVisionForm);
      setConfig(updated);
      toast.success('Misión/Visión actualizada exitosamente');
    } catch (error) {
      console.error('[LandingConfigPage] Error saving mission/vision:', error);
      toast.error('Error al guardar misión/visión');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCareers = async () => {
    try {
      setSaving(true);
      const updated = await landingConfigService.updateCareers(careersForm);
      setConfig(updated);
      toast.success('Carreras actualizadas exitosamente');
    } catch (error) {
      console.error('[LandingConfigPage] Error saving careers:', error);
      toast.error('Error al guardar las carreras');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFAQs = async () => {
    try {
      setSaving(true);
      const updated = await landingConfigService.updateFAQs(faqsForm);
      setConfig(updated);
      toast.success('FAQs actualizadas exitosamente');
    } catch (error) {
      console.error('[LandingConfigPage] Error saving FAQs:', error);
      toast.error('Error al guardar las FAQs');
    } finally {
      setSaving(false);
    }
  };

  const handleHeroChange = (field: string, value: string | number) => {
    setHeroForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleMissionVisionChange = (field: string, value: string) => {
    setMissionVisionForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCareerChange = (index: number, field: keyof LandingCareer, value: string | number | boolean) => {
    const updated = [...careersForm];
    updated[index] = { ...updated[index], [field]: value };
    setCareersForm(updated);
  };

  const handleFAQChange = (index: number, field: keyof LandingFAQ, value: string | number | boolean) => {
    const updated = [...faqsForm];
    updated[index] = { ...updated[index], [field]: value };
    setFaqsForm(updated);
  };

  if (loading) {
    return (
      <ConfigLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-500 border-t-transparent" />
        </div>
      </ConfigLayout>
    );
  }

  return (
    <ConfigLayout>
      <PageMeta title="Configuración de Landing Page" description="Administra el contenido de la página principal" />
      <PageBreadcrumb pageTitle="Configuración de Landing Page" />

      <div className="border-b border-border-light dark:border-border-dark mb-6 overflow-x-auto">
        <nav className="flex space-x-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-text-secondary hover:text-brand-500 hover:border-brand-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'hero' && (
        <HeroSectionEditor
          hero={heroForm}
          onChange={handleHeroChange}
          onSave={handleSaveHero}
          saving={saving}
        />
      )}

      {activeTab === 'mission' && (
        <MissionVisionEditor
          missionVision={missionVisionForm}
          onChange={handleMissionVisionChange}
          onSave={handleSaveMissionVision}
          saving={saving}
        />
      )}

      {activeTab === 'careers' && (
        <CareersEditor
          careers={careersForm}
          onCareerChange={handleCareerChange}
          onSave={handleSaveCareers}
          saving={saving}
        />
      )}

      {activeTab === 'faqs' && (
        <FaqEditor
          faqs={faqsForm}
          onFaqChange={handleFAQChange}
          onSave={handleSaveFAQs}
          saving={saving}
        />
      )}
    </ConfigLayout>
  );
};

export default LandingConfigPage;
