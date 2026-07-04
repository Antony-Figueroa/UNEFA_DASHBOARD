import React, { useState, useEffect, useCallback } from 'react';
import PageMeta from '../../../components/common/PageMeta';
import ComponentCard from '../../../components/common/ComponentCard';
import Button from '../../../components/ui/button/Button';
import { landingConfigService } from '../services/landingConfigService';
import { LandingConfig, LandingCareer, LandingFAQ } from '../types';
import { useToast } from '@/context/toast';
import { TOAST } from '@/components/ui/dialog/DialogConfig';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'hero' | 'mission' | 'careers' | 'faqs';

const tabs: { id: TabType; label: string }[] = [
  { id: 'hero', label: 'Hero' },
  { id: 'mission', label: 'Misión/Visión' },
  { id: 'careers', label: 'Carreras' },
  { id: 'faqs', label: 'FAQs' },
];

const LandingConfigPage: React.FC = () => {
  const { addToast } = useToast();
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
      addToast(TOAST.loadError());
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
      addToast({ variant: "success", title: "Hero actualizado", message: "Hero actualizado exitosamente" });
    } catch (error) {
      console.error('[LandingConfigPage] Error saving hero:', error);
      addToast({ variant: "error", title: "Error al guardar", message: "Error al guardar el hero" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMissionVision = async () => {
    try {
      setSaving(true);
      const updated = await landingConfigService.updateMissionVision(missionVisionForm);
      setConfig(updated);
      addToast({ variant: "success", title: "Misión/Visión actualizada", message: "Misión/Visión actualizada exitosamente" });
    } catch (error) {
      console.error('[LandingConfigPage] Error saving mission/vision:', error);
      addToast({ variant: "error", title: "Error al guardar", message: "Error al guardar misión/visión" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCareers = async () => {
    try {
      setSaving(true);
      const updated = await landingConfigService.updateCareers(careersForm);
      setConfig(updated);
      addToast({ variant: "success", title: "Carreras actualizadas", message: "Carreras actualizadas exitosamente" });
    } catch (error) {
      console.error('[LandingConfigPage] Error saving careers:', error);
      addToast({ variant: "error", title: "Error al guardar", message: "Error al guardar las carreras" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFAQs = async () => {
    try {
      setSaving(true);
      const updated = await landingConfigService.updateFAQs(faqsForm);
      setConfig(updated);
      addToast({ variant: "success", title: "FAQs actualizadas", message: "FAQs actualizadas exitosamente" });
    } catch (error) {
      console.error('[LandingConfigPage] Error saving FAQs:', error);
      addToast({ variant: "error", title: "Error al guardar", message: "Error al guardar las FAQs" });
    } finally {
      setSaving(false);
    }
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
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Configuración de Landing Page | Panel Admin" description="Administra el contenido de la página principal" />
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-emphasis">Configuración de Landing Page</h1>
        <p className="text-text-secondary">Administra el contenido visible en la página principal del sistema</p>
      </div>

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
        <ComponentCard title="Configuración del Hero" className="mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-emphasis mb-1">Título Principal</label>
              <input
                type="text"
                value={heroForm.title}
                onChange={(e) => setHeroForm({ ...heroForm, title: e.target.value })}
                className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-text-primary"
                placeholder="Ej: Impulsa tu carrera con"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-emphasis mb-1">Subtítulo</label>
              <textarea
                value={heroForm.subtitle}
                onChange={(e) => setHeroForm({ ...heroForm, subtitle: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-text-primary"
                placeholder="Descripción breve de la institución"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-emphasis mb-1">Textos Destacados (separados por coma)</label>
              <input
                type="text"
                value={heroForm.highlightTexts}
                onChange={(e) => setHeroForm({ ...heroForm, highlightTexts: e.target.value })}
                className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-text-primary"
                placeholder="Ej: Creatividad, Excelencia, Valor, Éxito"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-emphasis mb-1">Texto de Estadísticas</label>
                <input
                  type="text"
                  value={heroForm.statsText}
                  onChange={(e) => setHeroForm({ ...heroForm, statsText: e.target.value })}
                  className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-text-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-emphasis mb-1">Contador de Estadísticas</label>
                <input
                  type="number"
                  value={heroForm.statsCount}
                  onChange={(e) => setHeroForm({ ...heroForm, statsCount: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-text-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-emphasis mb-1">Valor de Éxito (Card)</label>
                <input
                  type="text"
                  value={heroForm.successCardValue}
                  onChange={(e) => setHeroForm({ ...heroForm, successCardValue: e.target.value })}
                  className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-text-primary"
                  placeholder="Ej: +95%"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-emphasis mb-1">Valor de Empresas (Card)</label>
                <input
                  type="text"
                  value={heroForm.companiesCardValue}
                  onChange={(e) => setHeroForm({ ...heroForm, companiesCardValue: e.target.value })}
                  className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-text-primary"
                  placeholder="Ej: 200+"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-emphasis mb-1">URL de Imagen Principal</label>
              <input
                type="text"
                value={heroForm.mainImage}
                onChange={(e) => setHeroForm({ ...heroForm, mainImage: e.target.value })}
                className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-text-primary"
                placeholder="/unefa-img/hero.jpg"
              />
            </div>

            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={handleSaveHero}
                disabled={saving}
                loading={saving}
                loadingText="Guardando..."
              >
                Guardar Hero
              </Button>
            </div>
          </div>
        </ComponentCard>
      )}

      {activeTab === 'mission' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ComponentCard title="Misión" className="mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-emphasis mb-1">Título</label>
                <input
                  type="text"
                  value={missionVisionForm.missionTitle}
                  onChange={(e) => setMissionVisionForm({ ...missionVisionForm, missionTitle: e.target.value })}
                  className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-text-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-emphasis mb-1">Descripción</label>
                <textarea
                  value={missionVisionForm.missionText}
                  onChange={(e) => setMissionVisionForm({ ...missionVisionForm, missionText: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-text-primary"
                />
              </div>
            </div>
          </ComponentCard>

          <ComponentCard title="Visión" className="mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-emphasis mb-1">Título</label>
                <input
                  type="text"
                  value={missionVisionForm.visionTitle}
                  onChange={(e) => setMissionVisionForm({ ...missionVisionForm, visionTitle: e.target.value })}
                  className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-text-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-emphasis mb-1">Descripción</label>
                <textarea
                  value={missionVisionForm.visionText}
                  onChange={(e) => setMissionVisionForm({ ...missionVisionForm, visionText: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-text-primary"
                />
              </div>
            </div>
          </ComponentCard>

          <div className="md:col-span-2 flex justify-end">
            <Button
              variant="primary"
              onClick={handleSaveMissionVision}
              disabled={saving}
              loading={saving}
              loadingText="Guardando..."
            >
              Guardar Misión/Visión
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'careers' && (
        <ComponentCard title="Carreras Destacadas" className="mb-6">
          <div className="space-y-6">
            <AnimatePresence>
              {careersForm.map((career, index) => (
                <motion.div
                  key={career.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="p-4 border border-border-light dark:border-border-dark rounded-lg bg-gray-50 dark:bg-gray-800"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-text-emphasis">Carrera {index + 1}</h4>
                    <button
                      onClick={() => {
                        const updated = [...careersForm];
                        updated[index] = { ...updated[index], active: !updated[index].active };
                        setCareersForm(updated);
                      }}
                      className={`px-3 py-1 rounded text-sm ${career.active ? 'bg-success-100 text-success-600' : 'bg-gray-200 text-gray-600'}`}
                    >
                      {career.active ? 'Activa' : 'Inactiva'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-emphasis mb-1">Título</label>
                      <input
                        type="text"
                        value={career.title}
                        onChange={(e) => handleCareerChange(index, 'title', e.target.value)}
                        className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-700 text-text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-emphasis mb-1">Categoría</label>
                      <select
                        value={career.category}
                        onChange={(e) => handleCareerChange(index, 'category', e.target.value)}
                        className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-700 text-text-primary"
                      >
                        <option value="Ingeniería">Ingeniería</option>
                        <option value="T.S.U">T.S.U</option>
                        <option value="Licenciatura">Licenciatura</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-text-emphasis mb-1">Descripción</label>
                      <textarea
                        value={career.description}
                        onChange={(e) => handleCareerChange(index, 'description', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-700 text-text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-emphasis mb-1">URL de Imagen</label>
                      <input
                        type="text"
                        value={career.image}
                        onChange={(e) => handleCareerChange(index, 'image', e.target.value)}
                        className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-700 text-text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-emphasis mb-1">Color del Badge</label>
                      <select
                        value={career.color}
                        onChange={(e) => handleCareerChange(index, 'color', e.target.value)}
                        className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-700 text-text-primary"
                      >
                        <option value="primary">Azul (Primary)</option>
                        <option value="success">Verde (Success)</option>
                        <option value="info">Celeste (Info)</option>
                        <option value="warning">Amarillo (Warning)</option>
                        <option value="error">Rojo (Error)</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={handleSaveCareers}
                disabled={saving}
                loading={saving}
                loadingText="Guardando..."
              >
                Guardar Carreras
              </Button>
            </div>
          </div>
        </ComponentCard>
      )}

      {activeTab === 'faqs' && (
        <ComponentCard title="Preguntas Frecuentes" className="mb-6">
          <div className="space-y-4">
            <AnimatePresence>
              {faqsForm.map((faq, index) => (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="p-4 border border-border-light dark:border-border-dark rounded-lg bg-gray-50 dark:bg-gray-800"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-text-tertiary">FAQ #{index + 1}</span>
                    <button
                      onClick={() => {
                        const updated = [...faqsForm];
                        updated[index] = { ...updated[index], active: !updated[index].active };
                        setFaqsForm(updated);
                      }}
                      className={`px-3 py-1 rounded text-sm ${faq.active ? 'bg-success-100 text-success-600' : 'bg-gray-200 text-gray-600'}`}
                    >
                      {faq.active ? 'Activa' : 'Inactiva'}
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-text-emphasis mb-1">Pregunta</label>
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) => handleFAQChange(index, 'question', e.target.value)}
                        className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-700 text-text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-emphasis mb-1">Respuesta</label>
                      <textarea
                        value={faq.answer}
                        onChange={(e) => handleFAQChange(index, 'answer', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-700 text-text-primary"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={handleSaveFAQs}
                disabled={saving}
                loading={saving}
                loadingText="Guardando..."
              >
                Guardar FAQs
              </Button>
            </div>
          </div>
        </ComponentCard>
      )}
    </>
  );
};

export default LandingConfigPage;
