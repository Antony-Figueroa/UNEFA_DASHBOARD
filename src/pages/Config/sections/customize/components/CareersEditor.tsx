import React from 'react';
import ComponentCard from '../../../../../components/common/ComponentCard';
import Button from '../../../../../components/ui/button/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { LandingCareer } from '../../../../../features/landing-config/types';

interface CareersEditorProps {
  careers: LandingCareer[];
  onCareerChange: (index: number, field: keyof LandingCareer, value: string | number | boolean) => void;
  onSave: () => void;
  saving: boolean;
}

const CareersEditor: React.FC<CareersEditorProps> = ({ careers, onCareerChange, onSave, saving }) => {
  return (
    <ComponentCard title="Carreras Destacadas" className="mb-6">
      <div className="space-y-6">
        <AnimatePresence>
          {careers.map((career, index) => (
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
                  onClick={() => onCareerChange(index, 'active', !career.active)}
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
                    onChange={(e) => onCareerChange(index, 'title', e.target.value)}
                    className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-700 text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-emphasis mb-1">Categoría</label>
                  <select
                    value={career.category}
                    onChange={(e) => onCareerChange(index, 'category', e.target.value)}
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
                    onChange={(e) => onCareerChange(index, 'description', e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-700 text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-emphasis mb-1">URL de Imagen</label>
                  <input
                    type="text"
                    value={career.image}
                    onChange={(e) => onCareerChange(index, 'image', e.target.value)}
                    className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-700 text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-emphasis mb-1">Color del Badge</label>
                  <select
                    value={career.color}
                    onChange={(e) => onCareerChange(index, 'color', e.target.value)}
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
            onClick={onSave}
            disabled={saving}
            loading={saving}
            loadingText="Guardando..."
          >
            Guardar Carreras
          </Button>
        </div>
      </div>
    </ComponentCard>
  );
};

export default CareersEditor;
