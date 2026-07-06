import React from 'react';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { LandingFAQ } from '@/features/landing-config/types';

interface FaqEditorProps {
  faqs: LandingFAQ[];
  onFaqChange: (index: number, field: keyof LandingFAQ, value: string | number | boolean) => void;
  onSave: () => void;
  saving: boolean;
}

const FaqEditor: React.FC<FaqEditorProps> = ({ faqs, onFaqChange, onSave, saving }) => {
  return (
    <ComponentCard title="Preguntas Frecuentes" className="mb-6">
      <div className="space-y-4">
        <AnimatePresence>
          {faqs.map((faq, index) => (
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
                  onClick={() => onFaqChange(index, 'active', !faq.active)}
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
                    onChange={(e) => onFaqChange(index, 'question', e.target.value)}
                    className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-700 text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-emphasis mb-1">Respuesta</label>
                  <textarea
                    value={faq.answer}
                    onChange={(e) => onFaqChange(index, 'answer', e.target.value)}
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
            onClick={onSave}
            disabled={saving}
            loading={saving}
            loadingText="Guardando..."
          >
            Guardar FAQs
          </Button>
        </div>
      </div>
    </ComponentCard>
  );
};

export default FaqEditor;
