import React from 'react';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';

interface HeroFormData {
  title: string;
  subtitle: string;
  highlightTexts: string;
  statsText: string;
  statsCount: number;
  mainImage: string;
  successCardValue: string;
  companiesCardValue: string;
}

interface HeroSectionEditorProps {
  hero: HeroFormData;
  onChange: (field: keyof HeroFormData, value: string | number) => void;
  onSave: () => void;
  saving: boolean;
}

const HeroSectionEditor: React.FC<HeroSectionEditorProps> = ({ hero, onChange, onSave, saving }) => {
  return (
    <ComponentCard title="Configuración del Hero" className="mb-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-emphasis mb-1">Título Principal</label>
          <input
            type="text"
            value={hero.title}
            onChange={(e) => onChange('title', e.target.value)}
            className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-text-primary"
            placeholder="Ej: Impulsa tu carrera con"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-emphasis mb-1">Subtítulo</label>
          <textarea
            value={hero.subtitle}
            onChange={(e) => onChange('subtitle', e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-text-primary"
            placeholder="Descripción breve de la institución"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-emphasis mb-1">Textos Destacados (separados por coma)</label>
          <input
            type="text"
            value={hero.highlightTexts}
            onChange={(e) => onChange('highlightTexts', e.target.value)}
            className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-text-primary"
            placeholder="Ej: Creatividad, Excelencia, Valor, Éxito"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-emphasis mb-1">Texto de Estadísticas</label>
            <input
              type="text"
              value={hero.statsText}
              onChange={(e) => onChange('statsText', e.target.value)}
              className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-text-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-emphasis mb-1">Contador de Estadísticas</label>
            <input
              type="number"
              value={hero.statsCount}
              onChange={(e) => onChange('statsCount', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-text-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-emphasis mb-1">Valor de Éxito (Card)</label>
            <input
              type="text"
              value={hero.successCardValue}
              onChange={(e) => onChange('successCardValue', e.target.value)}
              className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-text-primary"
              placeholder="Ej: +95%"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-emphasis mb-1">Valor de Empresas (Card)</label>
            <input
              type="text"
              value={hero.companiesCardValue}
              onChange={(e) => onChange('companiesCardValue', e.target.value)}
              className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-text-primary"
              placeholder="Ej: 200+"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-emphasis mb-1">URL de Imagen Principal</label>
          <input
            type="text"
            value={hero.mainImage}
            onChange={(e) => onChange('mainImage', e.target.value)}
            className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-text-primary"
            placeholder="/unefa-img/hero.jpg"
          />
        </div>

        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={onSave}
            disabled={saving}
            loading={saving}
            loadingText="Guardando..."
          >
            Guardar Hero
          </Button>
        </div>
      </div>
    </ComponentCard>
  );
};

export default HeroSectionEditor;
